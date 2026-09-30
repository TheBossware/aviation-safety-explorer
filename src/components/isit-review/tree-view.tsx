"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TreeViewNode {
  /** Unique across the whole tree; this is what selection and hidden inputs carry. */
  id: string;
  label: string;
  /** Short monospace text before the label, e.g. a code. Searchable. */
  prefix?: string;
  /** Secondary text (e.g. a definition). Searchable; shown when relevant and as a tooltip. */
  description?: string | null;
  /** Rich content always rendered under the label (e.g. evidence). Not searchable. */
  detail?: React.ReactNode;
  badges?: React.ReactNode;
  /** Defaults to true when the tree has a selection mode. */
  selectable?: boolean;
  children?: TreeViewNode[];
}

interface TreeViewProps {
  nodes: TreeViewNode[];
  "aria-label": string;
  selectionMode?: "none" | "multiple";
  /** Controlled selection. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Uncontrolled initial selection. */
  defaultSelected?: string[];
  /** Renders one hidden input per selected id, so the tree works inside a native form. */
  name?: string;
  /** Initially expanded nodes: explicit ids, every node, or the ancestors of the selection. */
  defaultExpanded?: string[] | "all" | "selected";
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  /** Classes for the scrollable list only (the toolbar stays in place), e.g. a max height. */
  listClassName?: string;
}

interface IndexEntry {
  node: TreeViewNode;
  parentId: string | null;
  searchText: string;
}

function buildIndex(nodes: TreeViewNode[]): Map<string, IndexEntry> {
  const index = new Map<string, IndexEntry>();
  const walk = (list: TreeViewNode[], parentId: string | null) => {
    for (const node of list) {
      index.set(node.id, {
        node,
        parentId,
        searchText: [node.prefix, node.label, node.description].filter(Boolean).join(" ").toLowerCase(),
      });
      if (node.children) walk(node.children, node.id);
    }
  };
  walk(nodes, null);
  return index;
}

function ancestorsOf(id: string, index: Map<string, IndexEntry>): string[] {
  const result: string[] = [];
  let parent = index.get(id)?.parentId ?? null;
  while (parent) {
    result.push(parent);
    parent = index.get(parent)?.parentId ?? null;
  }
  return result;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const at = text.toLowerCase().indexOf(query);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-primary/15 text-foreground">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

/**
 * Generic hierarchical list with optional search and multi-selection. Only expanded branches are
 * rendered, so large trees (thousands of nodes) stay responsive.
 */
export function TreeView({
  nodes,
  "aria-label": ariaLabel,
  selectionMode = "none",
  selected: controlledSelected,
  onSelectedChange,
  defaultSelected = [],
  name,
  defaultExpanded = [],
  searchable = false,
  searchPlaceholder = "Search",
  emptyMessage = "Nothing to show.",
  className,
  listClassName,
}: TreeViewProps) {
  const index = useMemo(() => buildIndex(nodes), [nodes]);

  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelected);
  const selected = controlledSelected ?? internalSelected;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpanded === "all") return new Set([...index.keys()]);
    if (defaultExpanded === "selected") return new Set(defaultSelected.flatMap((id) => ancestorsOf(id, index)));
    return new Set(defaultExpanded);
  });
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const activeQuery = deferredQuery.length >= 2 ? deferredQuery : "";

  const selecting = selectionMode === "multiple";
  const isSelectable = (node: TreeViewNode) => selecting && node.selectable !== false;

  function setSelected(next: string[]) {
    if (controlledSelected === undefined) setInternalSelected(next);
    onSelectedChange?.(next);
  }

  function toggleSelected(id: string, on: boolean) {
    setSelected(on ? [...selected, id] : selected.filter((s) => s !== id));
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // While searching or filtering, show matches plus their ancestors, with the path forced open.
  const filter = useMemo(() => {
    let matches: string[] | null = null;
    if (activeQuery) matches = [...index].filter(([, entry]) => entry.searchText.includes(activeQuery)).map(([id]) => id);
    if (selectedOnly) matches = (matches ?? [...selectedSet]).filter((id) => selectedSet.has(id));
    if (!matches) return null;
    const visible = new Set(matches);
    const forcedOpen = new Set<string>();
    for (const id of matches) {
      for (const ancestor of ancestorsOf(id, index)) {
        visible.add(ancestor);
        forcedOpen.add(ancestor);
      }
    }
    return { visible, forcedOpen, matchCount: matches.length, matches: new Set(matches) };
  }, [activeQuery, selectedOnly, selectedSet, index]);

  const selectedBelow = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of selectedSet) {
      for (const ancestor of ancestorsOf(id, index)) counts.set(ancestor, (counts.get(ancestor) ?? 0) + 1);
    }
    return counts;
  }, [selectedSet, index]);

  function renderNodes(list: TreeViewNode[], level: number): React.ReactNode {
    return list
      .filter((node) => !filter || filter.visible.has(node.id))
      .map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const open = hasChildren && (filter ? filter.forcedOpen.has(node.id) || expanded.has(node.id) : expanded.has(node.id));
        const checked = selectedSet.has(node.id);
        const below = selectedBelow.get(node.id) ?? 0;
        const showDescription =
          node.description && (checked || (activeQuery && node.description.toLowerCase().includes(activeQuery)));

        const onRowKeyDown = (event: React.KeyboardEvent) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" && hasChildren && !open) toggleExpanded(node.id);
          else if (event.key === "ArrowLeft" && open) toggleExpanded(node.id);
          else if ((event.key === " " || event.key === "Enter") && isSelectable(node)) toggleSelected(node.id, !checked);
          else if ((event.key === " " || event.key === "Enter") && hasChildren) toggleExpanded(node.id);
          else return;
          event.preventDefault();
        };

        return (
          <li
            key={node.id}
            role="treeitem"
            aria-level={level}
            aria-expanded={hasChildren ? open : undefined}
            aria-selected={isSelectable(node) ? checked : undefined}
          >
            <div
              tabIndex={0}
              onKeyDown={onRowKeyDown}
              className={cn(
                "group flex items-start gap-1.5 rounded-md py-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                checked ? "bg-primary/5" : "hover:bg-muted/60"
              )}
              style={{ paddingLeft: `${(level - 1) * 16 + 4}px` }}
              title={node.description ?? undefined}
            >
              {hasChildren ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => toggleExpanded(node.id)}
                  aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
                  className="mt-0.5 rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
                </button>
              ) : (
                <span className="size-4 shrink-0" />
              )}

              {isSelectable(node) && (
                <Checkbox
                  checked={checked}
                  onCheckedChange={(on) => toggleSelected(node.id, on)}
                  aria-label={`Select ${node.prefix ? `${node.prefix} ` : ""}${node.label}`}
                  tabIndex={-1}
                  className="mt-0.5"
                />
              )}

              <div className="min-w-0 flex-1">
                <div
                  className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm", (isSelectable(node) || hasChildren) && "cursor-pointer")}
                  onClick={() => (isSelectable(node) ? toggleSelected(node.id, !checked) : hasChildren && toggleExpanded(node.id))}
                >
                  {node.prefix && (
                    <span className="font-mono text-xs text-muted-foreground">
                      <Highlight text={node.prefix} query={activeQuery} />
                    </span>
                  )}
                  <span className={cn(level === 1 && "font-medium", filter?.matches.has(node.id) && activeQuery && "font-medium")}>
                    <Highlight text={node.label} query={activeQuery} />
                  </span>
                  {node.badges}
                  {hasChildren && below > 0 && !open && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-medium text-primary-foreground">
                      {below}
                    </span>
                  )}
                </div>
                {showDescription && (
                  <p className="text-xs text-muted-foreground">
                    <Highlight text={node.description!} query={activeQuery} />
                  </p>
                )}
                {node.detail && <div className="mt-1">{node.detail}</div>}
              </div>
            </div>

            {open && (
              <ul role="group" className="flex flex-col">
                {renderNodes(node.children!, level + 1)}
              </ul>
            )}
          </li>
        );
      });
  }

  const rendered = renderNodes(nodes, 1);
  const isEmpty = Array.isArray(rendered) && rendered.length === 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(searchable || selecting) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}
          {selecting && (
            <Button
              type="button"
              variant={selectedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOnly((on) => !on)}
              aria-pressed={selectedOnly}
            >
              Selected ({selected.length})
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(new Set())}>
            Collapse all
          </Button>
        </div>
      )}

      {filter && activeQuery && (
        <p className="text-xs text-muted-foreground">
          {filter.matchCount} match{filter.matchCount === 1 ? "" : "es"}
        </p>
      )}

      {isEmpty ? (
        <p className={cn("py-4 text-center text-sm text-muted-foreground", listClassName)}>{emptyMessage}</p>
      ) : (
        <ul
          role="tree"
          aria-label={ariaLabel}
          aria-multiselectable={selecting || undefined}
          className={cn("flex flex-col", listClassName)}
        >
          {rendered}
        </ul>
      )}

      {name && selected.map((id) => <input key={id} type="hidden" name={name} value={id} />)}
    </div>
  );
}
