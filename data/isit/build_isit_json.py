#!/usr/bin/env python3
"""
IATA ISIT taxonomy (xlsx) -> JSON artifacts for LLM-based classification.

Outputs
-------
isit-taxonomy.json    Nested tree. Source of truth. Hand-edited enrichment
                      (keywords / excludes) is NOT stored here - see enrich.
isit-index.json       Flat, one entry per code. Generated. Used for retrieval
                      and for validating whatever code the LLM returns.
isit-router.json      Level 1 + Level 2 only (110 nodes). Small enough to put
                      in a stage-1 prompt verbatim.

Code scheme (verified against v0.3.12)
--------------------------------------
Right-aligned, variable width:   [L1: 1-2 digits][L2: 3][L3: 2][L4: 2]
  10010100 -> L1=1  L2=001 L3=01 L4=00   Air Traffic Management / ATC Service
                                          Standard / Loss of Separation
  100010101 -> L1=10 L2=001 L3=01 L4=01  Security / ...
'00' in a slot means "not specified at this level", so a parent code is
obtained by zeroing the trailing slots - never by string prefixing.
"""

import json
import re
from pathlib import Path

import pandas as pd

SRC = "/mnt/user-data/uploads/IATA_Safety_Incident_Taxonomy_-_ISIT_v0_3_12.xlsx"
OUT = Path("/mnt/user-data/outputs")
VERSION = "0.3.12"

# Level 2 nodes grouped by what they actually describe. ISIT mixes three
# different questions into one table; keeping them apart stops the model
# from returning "Phase of Operation > Cruise" as if it were an event.
#   event       - what happened
#   context     - circumstances / consequences of the occurrence
#   contributing- why it happened
DIMENSION_BY_L1 = {
    "Air Traffic Management": "event",
    "Airport Management": "event",
    "Cabin Safety": "event",
    "Engineering/Maintenance": "event",
    "Flight Operations": "event",
    "Ground": "event",
    "Occupational Health and Safety": "event",
    "Security": "event",
    "Why": "contributing",
    "Common": "context",
}
# 'Common' is not homogeneous - these three are causal, not contextual.
DIMENSION_OVERRIDE_BY_L2_CODE = {
    "40060000": "contributing",  # Fatigue
    "40080000": "contributing",  # Stress
    "40050000": "contributing",  # Coordination/Communications
}


def split_code(code: str):
    """Return (l1, l2, l3, l4) numeric slots, right-aligned."""
    return code[:-7], code[-7:-4], code[-4:-2], code[-2:]


def parent_code(code: str, depth: int) -> str | None:
    """Code of the node one level up, or None at level 1."""
    if depth <= 1:
        return None
    if depth == 4:
        return code[:-2] + "00"
    if depth == 3:
        return code[:-4] + "0000"
    return code[:-7] + "0000000"


def load():
    df = pd.read_excel(SRC, dtype={"Mapped Descriptor Code": str})
    df.columns = ["code", "l1", "l2", "l3", "l4", "definition"]
    # NaN -> "" rather than None: iterrows() silently re-casts None back to
    # NaN on mixed-dtype rows, and float('nan') is truthy, which would put
    # "nan" strings into the output.
    for c in ("l1", "l2", "l3", "l4", "definition"):
        df[c] = df[c].apply(lambda v: str(v).strip() if pd.notna(v) else "")
    df["code"] = df["code"].str.strip()
    df["depth"] = 4 - (df.l4 == "").astype(int) - (df.l3 == "").astype(int)
    return df


def validate(df):
    """Structural checks. Returns a list of human-readable problems."""
    problems = []
    if df.code.duplicated().any():
        dups = df.loc[df.code.duplicated(), "code"].tolist()
        problems.append(f"duplicate codes: {dups}")
    if not df.code.str.fullmatch(r"\d{8,9}").all():
        problems.append("codes that are not 8-9 digits present")
    for _, r in df.iterrows():
        _, _, c3, c4 = split_code(r.code)
        if (r.l3 == "") != (c3 == "00"):
            problems.append(
                f"{r.code}: level-3 code slot and name disagree (name={r.l3!r})")
        if (r.l4 == "") != (c4 == "00"):
            problems.append(
                f"{r.code}: level-4 code slot and name disagree (name={r.l4!r})")
    # Level-1 has no row of its own in the sheet by design, so only check
    # that level-3 and level-4 rows have a real parent row.
    codes = set(df.code)
    for _, r in df.iterrows():
        if r.depth < 3:
            continue
        p = parent_code(r.code, r.depth)
        if p not in codes:
            problems.append(f"{r.code}: parent row {p} missing from sheet")
    return problems


def build(df, sheet_codes):
    nodes = {}          # code -> node dict
    order = []          # insertion order, for stable output

    def ensure(code, level, name, definition, dimension):
        if code not in nodes:
            nodes[code] = {
                "code": code,
                "level": level,
                "name": name,
                "definition": definition or None,
                "dimension": dimension,
                "selectable": True,
                "children": [],
            }
            order.append(code)
        elif definition and not nodes[code].get("definition"):
            nodes[code]["definition"] = definition
        return nodes[code]

    for _, r in df.iterrows():
        # Level-2 code of this row's branch: zero the L3 and L4 slots. (The
        # previous parent_code() chain went one level too far, to level 1, so
        # the override below never reached level-3/4 rows - 97 codes under
        # Fatigue/Stress/Coordination were emitted as "context" in v0.3.12.)
        l2_code = r.code[:-4] + "0000"
        dimension = DIMENSION_OVERRIDE_BY_L2_CODE.get(
            l2_code, DIMENSION_BY_L1[r.l1]
        )

        c1 = r.code[:-7] + "0000000"
        ensure(c1, 1, r.l1, None, dimension)
        c2 = r.code[:-4] + "0000"
        ensure(c2, 2, r.l2, r.definition if r.depth == 2 else None, dimension)
        if r.depth >= 3:
            c3 = r.code[:-2] + "00"
            ensure(c3, 3, r.l3, r.definition if r.depth == 3 else None, dimension)
        if r.depth == 4:
            ensure(r.code, 4, r.l4, r.definition, dimension)

    # wire children
    roots = []
    for code in order:
        n = nodes[code]
        p = parent_code(code, n["level"])
        if p is None:
            roots.append(n)
        else:
            nodes[p]["children"].append(n)

    # A level-1 node is a grouping header, not a label you can assign.
    for n in roots:
        n["selectable"] = False

    # Nodes we had to synthesize because the sheet has descendants but no
    # roll-up row (e.g. Flight Operations > Regulatory Oversight, 70080000).
    # They are valid branch nodes but carry no official code row, so they
    # must not be offered to the model as an assignable label.
    for code, n in nodes.items():
        if n["level"] >= 2 and code not in sheet_codes:
            n["synthesized"] = True
            n["selectable"] = False

    return roots, nodes


def flatten(roots):
    flat = []

    def walk(node, path_names, path_codes):
        names = path_names + [node["name"]]
        codes = path_codes + [node["code"]]
        if node["selectable"]:
            flat.append({
                "code": node["code"],
                "level": node["level"],
                "dimension": node["dimension"],
                "name": node["name"],
                "path": names,
                "label": " > ".join(names),
                "parentCode": codes[-2] if len(codes) > 1 else None,
                "definition": node["definition"],
                "isLeaf": not node["children"],
            })
        for c in node["children"]:
            walk(c, names, codes)

    for r in roots:
        walk(r, [], [])
    return flat


def strip_nulls(node):
    out = {k: v for k, v in node.items()
           if not (v is None or (k == "children" and not v))}
    if "children" in out:
        out["children"] = [strip_nulls(c) for c in out["children"]]
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    df = load()
    problems = validate(df)

    roots, nodes = build(df, set(df.code))
    flat = flatten(roots)

    meta = {
        "taxonomy": "IATA Safety Incident Taxonomy (ISIT)",
        "version": VERSION,
        "sourceFile": Path(SRC).name,
        "language": "en",
        "codeScheme": {
            "description": "Right-aligned slots: L1 (1-2 digits) | L2 (3) | L3 (2) | L4 (2). '00' means unspecified at that level.",
            "parentRule": "Zero the trailing slots; do not use string prefixes.",
        },
        "levelLabels": {
            "1": "Parent Level",
            "2": "Event Type",
            "3": "Descriptor",
            "4": "Descriptor",
        },
        "counts": {
            "level1": sum(1 for n in nodes.values() if n["level"] == 1),
            "level2": sum(1 for n in nodes.values() if n["level"] == 2),
            "level3": sum(1 for n in nodes.values() if n["level"] == 3),
            "level4": sum(1 for n in nodes.values() if n["level"] == 4),
            "selectable": len(flat),
            "withDefinition": sum(1 for n in nodes.values() if n["definition"]),
        },
        "synthesizedNodes": [
            {"code": c, "level": n["level"], "name": n["name"]}
            for c, n in nodes.items() if n.get("synthesized")
        ],
        "knownSourceIssues": problems,
    }

    (OUT / "isit-taxonomy.json").write_text(json.dumps(
        {"meta": meta, "tree": [strip_nulls(r) for r in roots]},
        ensure_ascii=False, indent=2), encoding="utf-8")

    (OUT / "isit-index.json").write_text(json.dumps(
        {"meta": {k: meta[k] for k in ("taxonomy", "version", "counts")},
         "entries": flat},
        ensure_ascii=False, indent=2), encoding="utf-8")

    router = []
    for r in roots:
        router.append({
            "code": r["code"], "level": 1, "name": r["name"],
            "dimension": r["dimension"],
            "eventTypes": [{
                "code": c["code"], "name": c["name"],
                "dimension": c["dimension"],
                "definition": c["definition"],
                "descriptorCount": sum(
                    1 + len(g["children"]) for g in c["children"]),
            } for c in r["children"]],
        })
    (OUT / "isit-router.json").write_text(json.dumps(
        {"meta": {k: meta[k] for k in ("taxonomy", "version")},
         "parentLevels": router}, ensure_ascii=False, indent=2),
        encoding="utf-8")

    print("counts:", json.dumps(meta["counts"], indent=2))
    print("source issues:", problems or "none")
    for f in ("isit-taxonomy.json", "isit-index.json", "isit-router.json"):
        print(f"{f}: {(OUT / f).stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
