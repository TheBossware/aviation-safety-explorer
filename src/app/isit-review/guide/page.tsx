import Link from "next/link";
import { BookOpen } from "lucide-react";

import { loadIsitTaxonomy, toTreePayload } from "@/lib/isit-taxonomy/taxonomy";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TreeView } from "@/components/isit-review/tree-view";
import { buildIsitTree } from "@/components/isit-review/isit-tree";
import { BackButton } from "@/components/nav-buttons";
import { FLAG_DESCRIPTIONS, type IsitFlag } from "@/components/isit-review/flag-descriptions";
import { TurkeyFlag, UkFlag } from "@/components/isit-review/language-flags";
import { OUTCOME_LABELS, WORKFLOW_STATUS_LABELS } from "@/components/isit-review/status-badges";

export const metadata = { title: "ISIT Review Guide" };

type Lang = "en" | "tr";
type Localized<T = string> = Record<Lang, T>;

const LANGS: Lang[] = ["en", "tr"];

const LANGUAGE: Localized<{ name: string; Flag: typeof UkFlag }> = {
  en: { name: "English", Flag: UkFlag },
  tr: { name: "Türkçe", Flag: TurkeyFlag },
};

/** Worked example: a real AvHerald record whose report states an event, its context and a cause. */
const EXAMPLE_NEWS_ID = "6a964dc8c6d23558d8811459";
// Quotes are verbatim source text, so they stay in English in both columns.
const EXAMPLE: Record<string, { quote: string; why: Localized }> = {
  "60050206": {
    quote: "When the flight directors and autopilot were engaged after take-off, the autopilot immediately attempted to turn the aircraft left, off the SID track.",
    why: {
      en: "The event itself, stated plainly: the autopilot turned the aircraft without a command.",
      tr: "Olayın kendisi, açıkça ifade edilmiş: otopilot, komut verilmeden uçağı döndürdü.",
    },
  },
  "70010600": {
    quote: "the aircraft entered a left turn away from the SID track, the captain intervened, disengaged the autopilot and resumed manual flight",
    why: {
      en: "A second event: the flight path deviated. The report does not say whether ATC approved it, so the general Flight Path Deviation code is kept instead of guessing a more specific child.",
      tr: "İkinci bir olay: uçuş yolundan sapıldı. Rapor bunun ATC onaylı olup olmadığını söylemiyor; bu yüzden daha spesifik bir alt kod tahmin etmek yerine genel Flight Path Deviation kodu tutuldu.",
    },
  },
  "40010200": {
    quote: "was departing Townsville's runway 01, shortly after becoming airborne",
    why: {
      en: "Context: the phase of operation.",
      tr: "Bağlam: uçuş safhası.",
    },
  },
  "50030303": {
    quote: "Regional Express procedures did not require them to verify their programmed flight plan after engine start and before take-off",
    why: {
      en: "Contributing: allowed only because the ATSB final report states it as a safety issue. Without such a statement, no contributing code.",
      tr: "Contributing: yalnızca ATSB nihai raporu bunu bir emniyet sorunu olarak belirttiği için verildi. Böyle bir ifade yoksa contributing kodu da yoktur.",
    },
  },
};

/** Turkish flag descriptions; English comes from FLAG_DESCRIPTIONS (also used for tooltips). */
const FLAG_DESCRIPTIONS_TR: Record<IsitFlag, string> = {
  retraction_candidate:
    "Başlık daha önceki bir gönderiyi geri çekiyor veya düzeltiyor. Makale yine de geri çekilen haberi anlatıyor olabilir.",
  title_references_other_post: "Başlık başka bir AvHerald makalesine bağlantı veriyor.",
  non_occurrence_candidate: "Başlık öneki bunun bir olay olmadığını söylüyor (\"News:\").",
  late_report: "Olaydan 30 günden fazla sonra yayımlanmış: genellikle yeni bir olay değil, bir güncelleme veya nihai rapor.",
  date_anomaly: "Tarihler birbiriyle çelişiyor, ör. olay tarihi gönderi tarihinden sonra.",
  missing_event_date: "Başlık bir olay bildiriyor gibi, ama içinden olay tarihi okunamadı.",
  missing_content: "Kullanılabilir makale metni yok; kanıt olarak yalnızca başlık kullanılabilir.",
  revocation: "Gönderi daha önceki bir gönderiyi geri çekiyor (AI gate'i veya başlıktaki ifadeye göre).",
  correction: "Gönderi daha önceki bir gönderiyi düzeltiyor.",
  title_content_conflict: "AI, makalenin başlıkta bildirilen şeyi anlatmadığını tespit etti.",
  gate_conflict: "Otomatik kontroller ile AI, gönderinin türü konusunda anlaşamıyor.",
  code_dropped: "AI doğrulamadan geçemeyen bir kod veya dal döndürdü; çıkarıldı.",
  low_confidence: "AI, tutulan kodlardan en az birini belirsiz olarak işaretledi.",
  ai_error: "AI çağrısı başarısız oldu; kaydın kullanılabilir bir önerisi yok.",
  input_changed: "Son AI çalıştırmasından veya onaydan sonra haber metni değişti.",
};

const FLAGS = (Object.keys(FLAG_DESCRIPTIONS) as IsitFlag[]).map(
  (flag): [string, Localized] => [flag, { en: FLAG_DESCRIPTIONS[flag], tr: FLAG_DESCRIPTIONS_TR[flag] }]
);

const GROUP_ROWS: Array<{ groups: Localized; describes: Localized; examples: Localized }> = [
  {
    groups: {
      en: "Air Traffic Management, Airport Management, Cabin Safety, Engineering/Maintenance, Flight Operations, Ground, Occupational Health and Safety, Security",
      tr: "Air Traffic Management, Airport Management, Cabin Safety, Engineering/Maintenance, Flight Operations, Ground, Occupational Health and Safety, Security",
    },
    describes: {
      en: "What happened. A classified record needs at least one of these.",
      tr: "Ne olduğu. Sınıflandırılmış bir kayıtta bunlardan en az biri olmalıdır.",
    },
    examples: {
      en: "Runway excursion, engine failure, TCAS RA, passenger injury",
      tr: "Pistten çıkma (runway excursion), motor arızası, TCAS RA, yolcu yaralanması",
    },
  },
  {
    groups: { en: "Common", tr: "Common" },
    describes: {
      en: "Descriptors that apply to any occurrence.",
      tr: "Her olaya uygulanabilen tanımlayıcılar.",
    },
    examples: {
      en: "Phase of operation, aircraft damage, diversion, delay",
      tr: "Uçuş safhası, hava aracı hasarı, divert, gecikme",
    },
  },
  {
    groups: { en: "Why", tr: "Why" },
    describes: {
      en: "Causal factors. Only when the text states the cause, typically an investigation report; never inferred.",
      tr: "Nedensel faktörler. Yalnızca metin nedeni açıkça belirttiğinde (genellikle bir soruşturma raporu); asla çıkarım yapılmaz.",
    },
    examples: {
      en: "Windshear, organisational procedures, individual actions",
      tr: "Rüzgâr kesmesi (windshear), kurumsal prosedürler, bireysel eylemler",
    },
  },
];

/** One guide section as a row: English on the left, Turkish on the right, so both stay aligned. */
function BilingualSection({
  title,
  subtitle,
  body,
  contentClassName,
}: {
  title: Localized;
  subtitle?: Localized<React.ReactNode>;
  body: Localized<React.ReactNode>;
  contentClassName?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {LANGS.map((lang) => {
        const { Flag } = LANGUAGE[lang];
        return (
          <Card key={lang} lang={lang} className="p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                {title[lang]}
                <Flag className="mt-0.5" />
              </CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle[lang]}</p>}
            </CardHeader>
            <CardContent className={cn("p-0 pt-3 text-sm leading-6", contentClassName)}>{body[lang]}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ExampleLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-primary hover:underline">
      {children}
    </Link>
  );
}

export default function IsitReviewGuidePage() {
  const taxonomy = loadIsitTaxonomy();
  const payload = toTreePayload(taxonomy);
  const exampleTree = (lang: Lang) =>
    buildIsitTree(payload, {
      include: Object.keys(EXAMPLE),
      decorate: (code) => {
        const example = EXAMPLE[code];
        if (!example) return undefined;
        return {
          detail: (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-muted-foreground italic">“{example.quote}”</p>
              <p className="text-xs text-muted-foreground">{example.why[lang]}</p>
            </div>
          ),
        };
      },
    });

  const groupsTable = (lang: Lang) => (
    <Table className="mt-3">
      <TableHeader>
        <TableRow>
          <TableHead className="w-56">{lang === "en" ? "ISIT groups" : "ISIT grupları"}</TableHead>
          <TableHead>{lang === "en" ? "What their codes describe" : "Kodları neyi anlatır"}</TableHead>
          <TableHead>{lang === "en" ? "Examples" : "Örnekler"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GROUP_ROWS.map((row) => (
          <TableRow key={row.groups.en}>
            <TableCell className="font-medium whitespace-normal">{row.groups[lang]}</TableCell>
            <TableCell className="whitespace-normal">{row.describes[lang]}</TableCell>
            <TableCell className="whitespace-normal">{row.examples[lang]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const flagsTable = (lang: Lang) => (
    <Table>
      <TableBody>
        {FLAGS.map(([flag, meaning]) => (
          <TableRow key={flag}>
            <TableCell className="w-56 font-mono text-xs">{flag}</TableCell>
            <TableCell className="text-sm whitespace-normal">{meaning[lang]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const header: Localized<{ title: string; intro: string }> = {
    en: {
      title: "How to review ISIT classifications",
      intro:
        "The AI proposes; nothing counts until a reviewer approves it. This page explains what you are looking at and walks through one real record.",
    },
    tr: {
      title: "ISIT sınıflandırmaları nasıl incelenir",
      intro:
        "AI önerir; bir reviewer onaylayana kadar hiçbir şey geçerli sayılmaz. Bu sayfa ne gördüğünüzü açıklar ve gerçek bir kayıt üzerinden adım adım ilerler.",
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/isit-review">Back to review queue</BackButton>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {LANGS.map((lang) => {
          const { Flag, name } = LANGUAGE[lang];
          return (
            <div key={lang} lang={lang} className="flex items-start gap-2">
              <BookOpen className="mt-1 size-5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Flag />
                  {name}
                </span>
                <h1 className="text-xl font-semibold">{header[lang].title}</h1>
                <p className="text-sm text-muted-foreground">{header[lang].intro}</p>
              </div>
            </div>
          );
        })}
      </div>

      <BilingualSection
        title={{ en: "1. What happens before you see a record", tr: "1. Bir kayıt size gelmeden önce neler olur" }}
        body={{
          en: (
            <>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  <span className="font-medium">Checks without AI:</span> dates are read from the title and the article
                  header, and warning flags are set (retraction wording, late report, date conflicts).
                </li>
                <li>
                  <span className="font-medium">Gate:</span> the AI decides what kind of post it is. A revocation or a
                  non-occurrence stops here and gets no codes.
                </li>
                <li>
                  <span className="font-medium">Branches:</span> the AI picks the few ISIT branches that could apply.
                </li>
                <li>
                  <span className="font-medium">Codes:</span> the AI picks codes inside those branches only, each with a
                  verbatim quote.
                </li>
                <li>
                  <span className="font-medium">Validation:</span> every code must exist, be assignable, sit in a branch the
                  AI picked, and its quote must appear in the text. Anything else is dropped and flagged.
                </li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                Two texts are shown: the <span className="font-medium text-foreground">title</span> is the post this record
                is about; the <span className="font-medium text-foreground">article</span> is the linked AvHerald page,
                which can be older, updated later, or describe a story the title withdraws.
              </p>
            </>
          ),
          tr: (
            <>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  <span className="font-medium">AI&apos;sız kontroller:</span> tarihler başlıktan ve makalenin üst
                  bilgisinden okunur, uyarı flag&apos;leri atanır (geri çekme ifadesi, geç rapor, tarih çelişkileri).
                </li>
                <li>
                  <span className="font-medium">Gate:</span> AI gönderinin ne tür olduğuna karar verir. Geri çekme
                  (revocation) veya olay olmayan bir gönderi burada durur ve kod almaz.
                </li>
                <li>
                  <span className="font-medium">Dallar (branches):</span> AI, uygulanabilecek birkaç ISIT dalını seçer.
                </li>
                <li>
                  <span className="font-medium">Kodlar:</span> AI yalnızca bu dalların içinden kod seçer, her birini metinden
                  birebir bir alıntıyla destekler.
                </li>
                <li>
                  <span className="font-medium">Doğrulama:</span> her kod mevcut ve atanabilir olmalı, AI&apos;ın seçtiği
                  bir dalda bulunmalı ve alıntısı metinde geçmelidir. Aksi halde kod çıkarılır ve flag konur.
                </li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                İki metin gösterilir: <span className="font-medium text-foreground">başlık</span> bu kaydın ait olduğu
                gönderidir; <span className="font-medium text-foreground">makale</span> ise bağlantı verilen AvHerald
                sayfasıdır ve daha eski olabilir, sonradan güncellenmiş olabilir ya da başlığın geri çektiği bir haberi
                anlatıyor olabilir.
              </p>
            </>
          ),
        }}
      />

      <BilingualSection
        title={{ en: "2. How ISIT is organised", tr: "2. ISIT nasıl düzenlenmiştir" }}
        body={{
          en: (
            <>
              <p>
                ISIT is one code list in ten parent groups. Codes are shown in IATA&apos;s own structure and sorted by code,
                which also keeps the groups in IATA&apos;s order. A record can have codes from several groups.
              </p>
              {groupsTable("en")}
            </>
          ),
          tr: (
            <>
              <p>
                ISIT, on ana gruptan oluşan tek bir kod listesidir. Kodlar IATA&apos;nın kendi yapısında ve koda göre sıralı
                gösterilir; bu, grupları da IATA&apos;nın sırasında tutar. Bir kayıt birden fazla gruptan kod alabilir.
              </p>
              {groupsTable("tr")}
            </>
          ),
        }}
      />

      <BilingualSection
        title={{
          en: "3. Worked example: REX Saab 340 at Townsville",
          tr: "3. Çözümlü örnek: Townsville'de REX Saab 340",
        }}
        subtitle={{
          en: (
            <>
              “Report: REX SF34 at Townsville on Nov 19th 2026, uncommanded turn on departure” ·{" "}
              <ExampleLink href={`/isit-review/${EXAMPLE_NEWS_ID}`}>open the record</ExampleLink>
            </>
          ),
          tr: (
            <>
              “Report: REX SF34 at Townsville on Nov 19th 2026, uncommanded turn on departure” ·{" "}
              <ExampleLink href={`/isit-review/${EXAMPLE_NEWS_ID}`}>kaydı aç</ExampleLink>
            </>
          ),
        }}
        contentClassName="flex flex-col gap-3"
        body={{
          en: (
            <>
              <p>
                The article is the ATSB final report: after take-off the autopilot turned the aircraft off the departure
                track, the captain took over manually, and the report names a procedural safety issue. One record, codes
                from four ISIT groups (Engineering/Maintenance and Flight Operations for what happened, Common for the
                phase, Why for the cause):
              </p>
              <TreeView nodes={exampleTree("en")} aria-label="Example ISIT codes" defaultExpanded="all" />
              <p className="text-muted-foreground">
                Also note the <span className="font-mono text-xs">date_anomaly</span> flag on this record: the title says
                Nov 19th 2026, but the article was created Aug 31st 2026. The title date is likely a typo in the source; the
                codes do not depend on it, but it is worth a look.
              </p>
            </>
          ),
          tr: (
            <>
              <p>
                Makale ATSB&apos;nin nihai raporudur: kalkıştan sonra otopilot uçağı kalkış rotasının dışına döndürdü,
                kaptan manuel kontrolü devraldı ve rapor prosedürel bir emniyet sorununu belirtiyor. Tek kayıt, dört ISIT
                grubundan kodlar (ne olduğu için Engineering/Maintenance ve Flight Operations, safha için Common, neden için
                Why):
              </p>
              <TreeView nodes={exampleTree("tr")} aria-label="Örnek ISIT kodları" defaultExpanded="all" />
              <p className="text-muted-foreground">
                Bu kayıttaki <span className="font-mono text-xs">date_anomaly</span> flag&apos;ine de dikkat edin: başlıkta
                19 Kasım 2026 yazıyor, ama makale 31 Ağustos 2026&apos;da oluşturulmuş. Başlıktaki tarih büyük olasılıkla
                kaynaktaki bir yazım hatası; kodlar buna bağlı değil, ama göz atmaya değer.
              </p>
            </>
          ),
        }}
      />

      <BilingualSection
        title={{ en: "4. When there should be no codes", tr: "4. Hiç kod olmaması gereken durumlar" }}
        body={{
          en: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium">{OUTCOME_LABELS.revoked}:</span> “REVOCATION: The post published by us … is
                untrue.” The article still narrates the old diversion, but the source withdrew it, so nothing is coded as
                an occurrence. <ExampleLink href="/isit-review/6a7c2e4f4c964ff3f292fffe">Example</ExampleLink>
              </li>
              <li>
                <span className="font-medium">{OUTCOME_LABELS.not_applicable}:</span> “News: AVH was sued” is about the
                website, not an occurrence.
              </li>
              <li>
                <span className="font-medium">{OUTCOME_LABELS.insufficient_evidence}:</span> an occurrence, but the text
                does not say what happened, not even at branch level.
              </li>
              <li>
                <span className="font-medium">No contributing code:</span> the L410 crash at Kenge says only “technical
                difficulties”. That supports a generic Technical Failure event, but no cause.{" "}
                <ExampleLink href="/isit-review/6ab743485b9ee7065ed1ad4d">Example</ExampleLink>
              </li>
            </ul>
          ),
          tr: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium">{OUTCOME_LABELS.revoked}:</span> “REVOCATION: The post published by us … is
                untrue.” Makale hâlâ eski divert olayını anlatıyor, ama kaynak bunu geri çekti; bu yüzden hiçbir şey olay
                olarak kodlanmaz. <ExampleLink href="/isit-review/6a7c2e4f4c964ff3f292fffe">Örnek</ExampleLink>
              </li>
              <li>
                <span className="font-medium">{OUTCOME_LABELS.not_applicable}:</span> “News: AVH was sued” bir olay
                değil, web sitesinin kendisiyle ilgili.
              </li>
              <li>
                <span className="font-medium">{OUTCOME_LABELS.insufficient_evidence}:</span> bir olay var, ama metin ne
                olduğunu dal düzeyinde bile söylemiyor.
              </li>
              <li>
                <span className="font-medium">Contributing kodu yok:</span> Kenge&apos;deki L410 kazası için metin yalnızca
                “technical difficulties” diyor. Bu genel bir Technical Failure olayını destekler, ama bir nedeni değil.{" "}
                <ExampleLink href="/isit-review/6ab743485b9ee7065ed1ad4d">Örnek</ExampleLink>
              </li>
            </ul>
          ),
        }}
      />

      <BilingualSection
        title={{ en: "5. Reviewing a record", tr: "5. Bir kaydı incelemek" }}
        body={{
          en: (
            <>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Read the title first. Does it report an occurrence, an update, or withdraw something?</li>
                <li>Check the flags and the gate decision.</li>
                <li>For each suggested code, find the highlighted quote in the article. Does it say exactly that?</li>
                <li>
                  Uncheck codes the text does not support. Search the tree to add missing ones; prefer the most specific code
                  the text supports, and keep the parent when the detail is not stated.
                </li>
                <li>Pick the outcome, add a short note if you changed something, and approve.</li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                Approved results are never overwritten by later AI runs. If the news text changes afterwards, the record
                becomes <span className="font-medium text-foreground">{WORKFLOW_STATUS_LABELS.stale}</span>: your result
                stays until you look at it again next to the new suggestion.
              </p>
            </>
          ),
          tr: (
            <>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Önce başlığı okuyun. Bir olay mı bildiriyor, bir güncelleme mi, yoksa bir şeyi geri mi çekiyor?</li>
                <li>Flag&apos;leri ve gate kararını kontrol edin.</li>
                <li>Önerilen her kod için makalede vurgulanan alıntıyı bulun. Metin tam olarak bunu mu söylüyor?</li>
                <li>
                  Metnin desteklemediği kodların işaretini kaldırın. Eksik kodları eklemek için ağaçta arama yapın; metnin
                  desteklediği en spesifik kodu tercih edin, ayrıntı belirtilmemişse üst kodu tutun.
                </li>
                <li>Sonucu (outcome) seçin, bir şeyi değiştirdiyseniz kısa bir not ekleyin ve onaylayın.</li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                Onaylanmış sonuçların üzerine sonraki AI çalıştırmaları asla yazmaz. Haber metni sonradan değişirse kayıt{" "}
                <span className="font-medium text-foreground">{WORKFLOW_STATUS_LABELS.stale}</span> olur: sonucunuz, yeni
                öneriyle yan yana tekrar bakana kadar olduğu gibi kalır.
              </p>
            </>
          ),
        }}
      />

      <BilingualSection
        title={{ en: "6. Flags", tr: "6. Flag'ler" }}
        body={{ en: flagsTable("en"), tr: flagsTable("tr") }}
      />
    </div>
  );
}
