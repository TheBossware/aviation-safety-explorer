export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type ItemType = "Alert" | "Warning" | "Report" | "Advisory";

export interface ContentItem {
  id: string;
  title: string;
  source: string;
  sourceInitials: string;
  sourceColor: string;
  sourceLogo?: string;
  date: string;
  summary: string;
  content: string[];
  severity: Severity;
  type: ItemType;
  category: string;
  region: string;
  tags: string[];
}

export interface Source {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: string;
  description: string;
  status: "active" | "inactive";
  itemCount: number;
  lastUpdated: string;
  logo: string;
  // backward-compatible fields used by existing pages
  active: boolean;
  items: number;
  initials: string;
  color: string;
}

export const severityStyles: Record<Severity, { badge: string; dot: string; label: string }> = {
  CRITICAL: { badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", label: "Critical" },
  HIGH: { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", label: "High" },
  MEDIUM: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500", label: "Medium" },
  LOW: { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500", label: "Low" },
  INFO: { badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Info" },
};

export const typeStyles: Record<ItemType, string> = {
  Alert: "bg-red-50 text-red-600",
  Warning: "bg-amber-50 text-amber-600",
  Report: "bg-slate-100 text-slate-600",
  Advisory: "bg-blue-50 text-blue-600",
};

export const categories = [
  "Regulators",
  "Airworthiness Directives",
  "Safety Alerts",
  "Accident Investigation",
  "Occurrence Databases",
  "Safety Organisations",
  "Aircraft Manufacturers",
  "Engine Manufacturers",
  "Avionics",
  "Flight Data Monitoring",
  "Air Traffic Management",
  "Meteorology",
  "Human Factors",
  "Academic",
  "Aviation News",
  "Cyber Security",
  "Podcasts & Webinars",
  "YouTube Channels",
  "Email Newsletters",
];

const categoryColors: Record<string, string> = {
  "Regulators": "bg-blue-700",
  "Airworthiness Directives": "bg-orange-600",
  "Safety Alerts": "bg-red-600",
  "Accident Investigation": "bg-rose-700",
  "Occurrence Databases": "bg-teal-600",
  "Safety Organisations": "bg-indigo-600",
  "Aircraft Manufacturers": "bg-sky-700",
  "Engine Manufacturers": "bg-cyan-700",
  "Avionics": "bg-violet-600",
  "Flight Data Monitoring": "bg-emerald-600",
  "Air Traffic Management": "bg-purple-700",
  "Meteorology": "bg-amber-600",
  "Human Factors": "bg-fuchsia-600",
  "Academic": "bg-slate-600",
  "Aviation News": "bg-pink-600",
  "Cyber Security": "bg-red-700",
  "Podcasts & Webinars": "bg-lime-700",
  "YouTube Channels": "bg-red-500",
  "Email Newsletters": "bg-blue-500",
};

export function categoryColor(category: string): string {
  return categoryColors[category] ?? "bg-slate-600";
}

function initialsOf(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
  if (clean.length === 1) return clean[0].slice(0, 2).toUpperCase();
  return (clean[0][0] + clean[1][0]).toUpperCase();
}

interface RawSource {
  name: string;
  domain: string;
  url?: string;
  category: string;
  description: string;
  status?: "active" | "inactive";
  itemCount: number;
  lastUpdated: string;
}

const rawSources: RawSource[] = [
  // 1. Regulators
  { name: "ICAO", domain: "icao.int", category: "Regulators", description: "UN body setting global standards and recommended practices for civil aviation.", itemCount: 428, lastUpdated: "2026-07-27" },
  { name: "IATA", domain: "iata.org", category: "Regulators", description: "Global airline trade association driving operational safety standards (IOSA).", itemCount: 312, lastUpdated: "2026-07-27" },
  { name: "EASA", domain: "easa.europa.eu", category: "Regulators", description: "European Union Aviation Safety Agency — rulemaking and certification.", itemCount: 389, lastUpdated: "2026-07-26" },
  { name: "FAA", domain: "faa.gov", category: "Regulators", description: "US Federal Aviation Administration regulating civil aviation nationwide.", itemCount: 456, lastUpdated: "2026-07-27" },
  { name: "UK CAA", domain: "caa.co.uk", category: "Regulators", description: "United Kingdom Civil Aviation Authority safety oversight.", itemCount: 174, lastUpdated: "2026-07-25" },
  { name: "Transport Canada", domain: "tc.canada.ca", category: "Regulators", description: "Canadian civil aviation regulator and airworthiness authority.", itemCount: 158, lastUpdated: "2026-07-24" },
  { name: "CASA", domain: "casa.gov.au", category: "Regulators", description: "Civil Aviation Safety Authority of Australia.", itemCount: 141, lastUpdated: "2026-07-25" },
  { name: "CAAS", domain: "caas.gov.sg", category: "Regulators", description: "Civil Aviation Authority of Singapore.", itemCount: 96, lastUpdated: "2026-07-23" },
  { name: "GCAA", domain: "gcaa.gov.ae", category: "Regulators", description: "UAE General Civil Aviation Authority.", itemCount: 88, lastUpdated: "2026-07-22" },
  { name: "DGCA India", domain: "dgca.gov.in", category: "Regulators", description: "Directorate General of Civil Aviation, India.", itemCount: 103, lastUpdated: "2026-07-24" },

  // 2. Airworthiness Directives
  { name: "EASA AD", domain: "ad.easa.europa.eu", category: "Airworthiness Directives", description: "EASA Airworthiness Directives publication portal.", itemCount: 267, lastUpdated: "2026-07-27" },
  { name: "FAA Airworthiness Directives", domain: "faa.gov", category: "Airworthiness Directives", description: "FAA mandatory continuing airworthiness directives.", itemCount: 298, lastUpdated: "2026-07-27" },
  { name: "TCCA Airworthiness Directives", domain: "tc.canada.ca", category: "Airworthiness Directives", description: "Transport Canada AD web query service.", itemCount: 112, lastUpdated: "2026-07-24" },
  { name: "CASA Airworthiness Directives", domain: "casa.gov.au", category: "Airworthiness Directives", description: "Australian AD system for continuing airworthiness.", itemCount: 84, lastUpdated: "2026-07-23" },

  // 3. Safety Alerts
  { name: "FAA SAFO", domain: "faa.gov", category: "Safety Alerts", description: "Safety Alerts For Operators — time-critical operational safety information.", itemCount: 132, lastUpdated: "2026-07-26" },
  { name: "EASA Safety Publications", domain: "easa.europa.eu", category: "Safety Alerts", description: "Safety Information Bulletins and safety promotion material.", itemCount: 148, lastUpdated: "2026-07-26" },

  // 4. Accident Investigation
  { name: "NTSB", domain: "ntsb.gov", category: "Accident Investigation", description: "US National Transportation Safety Board accident investigations.", itemCount: 341, lastUpdated: "2026-07-27" },
  { name: "BEA France", domain: "bea.aero", category: "Accident Investigation", description: "French Bureau of Enquiry and Analysis for Civil Aviation Safety.", itemCount: 156, lastUpdated: "2026-07-25" },
  { name: "UK AAIB", domain: "gov.uk", category: "Accident Investigation", description: "Air Accidents Investigation Branch, United Kingdom.", itemCount: 168, lastUpdated: "2026-07-26" },
  { name: "ATSB", domain: "atsb.gov.au", category: "Accident Investigation", description: "Australian Transport Safety Bureau investigations.", itemCount: 149, lastUpdated: "2026-07-26" },
  { name: "TSB Canada", domain: "tsb.gc.ca", category: "Accident Investigation", description: "Transportation Safety Board of Canada.", itemCount: 121, lastUpdated: "2026-07-24" },
  { name: "TAIC", domain: "taic.org.nz", category: "Accident Investigation", description: "New Zealand Transport Accident Investigation Commission.", itemCount: 62, lastUpdated: "2026-07-21" },
  { name: "Dutch Safety Board", domain: "onderzoeksraad.nl", category: "Accident Investigation", description: "Onderzoeksraad voor Veiligheid — Dutch Safety Board.", itemCount: 74, lastUpdated: "2026-07-22" },

  // 5. Occurrence Databases
  { name: "Aviation Safety Network", domain: "aviation-safety.net", category: "Occurrence Databases", description: "Comprehensive database of accidents, incidents and hijackings.", itemCount: 512, lastUpdated: "2026-07-27" },
  { name: "NASA ASRS", domain: "asrs.arc.nasa.gov", category: "Occurrence Databases", description: "Aviation Safety Reporting System — confidential incident reports.", itemCount: 476, lastUpdated: "2026-07-27" },
  { name: "FAA ASIAS", domain: "asias.faa.gov", category: "Occurrence Databases", description: "Aviation Safety Information Analysis and Sharing system.", itemCount: 288, lastUpdated: "2026-07-25" },
  { name: "ECCAIRS", domain: "eccairsportal.eu", category: "Occurrence Databases", description: "European Coordination Centre for Accident and Incident Reporting.", itemCount: 197, lastUpdated: "2026-07-24" },

  // 6. Safety Organisations
  { name: "Flight Safety Foundation", domain: "flightsafety.org", category: "Safety Organisations", description: "Independent non-profit advancing global aviation safety.", itemCount: 356, lastUpdated: "2026-07-27" },
  { name: "SKYbrary", domain: "skybrary.aero", category: "Safety Organisations", description: "Aviation safety knowledge base curated with EUROCONTROL, ICAO & FSF.", itemCount: 402, lastUpdated: "2026-07-27" },
  { name: "EUROCONTROL", domain: "eurocontrol.int", category: "Safety Organisations", description: "European organisation for the safety of air navigation.", itemCount: 274, lastUpdated: "2026-07-26" },

  // 7. Aircraft Manufacturers
  { name: "Airbus", domain: "airbus.com", category: "Aircraft Manufacturers", description: "European multinational aerospace manufacturer.", itemCount: 231, lastUpdated: "2026-07-26" },
  { name: "Airbus Safety First", domain: "safetyfirst.airbus.com", category: "Aircraft Manufacturers", description: "Airbus operational safety magazine and knowledge hub.", itemCount: 187, lastUpdated: "2026-07-27" },
  { name: "Boeing", domain: "boeing.com", category: "Aircraft Manufacturers", description: "American aerospace manufacturer of commercial jetliners.", itemCount: 244, lastUpdated: "2026-07-27" },
  { name: "Embraer", domain: "embraer.com", category: "Aircraft Manufacturers", description: "Brazilian manufacturer of commercial and executive jets.", itemCount: 118, lastUpdated: "2026-07-24" },
  { name: "ATR", domain: "atr-aircraft.com", category: "Aircraft Manufacturers", description: "Franco-Italian regional turboprop aircraft manufacturer.", itemCount: 79, lastUpdated: "2026-07-22" },

  // 8. Engine Manufacturers
  { name: "GE Aerospace", domain: "geaerospace.com", category: "Engine Manufacturers", description: "Jet and turboprop engine manufacturer and services.", itemCount: 143, lastUpdated: "2026-07-25" },
  { name: "Pratt & Whitney", domain: "prattwhitney.com", category: "Engine Manufacturers", description: "Aircraft engine manufacturer (RTX group).", itemCount: 137, lastUpdated: "2026-07-25" },
  { name: "Rolls-Royce", domain: "rolls-royce.com", category: "Engine Manufacturers", description: "Wide-body aircraft engine manufacturer.", itemCount: 129, lastUpdated: "2026-07-24" },
  { name: "CFM International", domain: "cfmaeroengines.com", category: "Engine Manufacturers", description: "GE–Safran joint venture, maker of the LEAP and CFM56.", itemCount: 108, lastUpdated: "2026-07-23" },
  { name: "Safran", domain: "safran-group.com", category: "Engine Manufacturers", description: "French aerospace propulsion and equipment group.", itemCount: 96, lastUpdated: "2026-07-23" },

  // 9. Avionics
  { name: "Collins Aerospace", domain: "collinsaerospace.com", category: "Avionics", description: "Avionics, interiors and mission systems supplier.", itemCount: 92, lastUpdated: "2026-07-24" },
  { name: "Honeywell Aerospace", domain: "honeywell.com", category: "Avionics", description: "Avionics, engines and connectivity for aircraft.", itemCount: 114, lastUpdated: "2026-07-25" },
  { name: "Thales", domain: "thalesgroup.com", category: "Avionics", description: "Avionics and air traffic management technology.", itemCount: 87, lastUpdated: "2026-07-23" },
  { name: "Garmin Aviation", domain: "garmin.com", category: "Avionics", description: "Integrated flight decks and navigation systems.", itemCount: 71, lastUpdated: "2026-07-22" },

  // 10. Flight Data Monitoring
  { name: "GE Aerospace FDM", domain: "geaerospace.com", category: "Flight Data Monitoring", description: "Flight data monitoring and analytics (FlightPulse).", itemCount: 64, lastUpdated: "2026-07-22" },
  { name: "Teledyne Controls", domain: "teledynecontrols.com", category: "Flight Data Monitoring", description: "Flight data acquisition and management systems.", itemCount: 48, lastUpdated: "2026-07-20" },

  // 11. Air Traffic Management
  { name: "EUROCONTROL ATM", domain: "eurocontrol.int", category: "Air Traffic Management", description: "Network management for European air traffic.", itemCount: 156, lastUpdated: "2026-07-26" },
  { name: "CANSO", domain: "canso.org", category: "Air Traffic Management", description: "Civil Air Navigation Services Organisation.", itemCount: 82, lastUpdated: "2026-07-23" },
  { name: "NATS", domain: "nats.aero", category: "Air Traffic Management", description: "UK's leading air navigation service provider.", itemCount: 73, lastUpdated: "2026-07-24" },
  { name: "FAA Air Traffic", domain: "faa.gov", category: "Air Traffic Management", description: "FAA Air Traffic Organization operations and NOTAMs.", itemCount: 168, lastUpdated: "2026-07-27" },

  // 12. Meteorology
  { name: "Aviation Weather Center", domain: "aviationweather.gov", category: "Meteorology", description: "NOAA aviation weather products and hazards.", itemCount: 134, lastUpdated: "2026-07-27" },
  { name: "WMO", domain: "wmo.int", category: "Meteorology", description: "World Meteorological Organization aviation programme.", itemCount: 61, lastUpdated: "2026-07-22" },
  { name: "ECMWF", domain: "ecmwf.int", category: "Meteorology", description: "European Centre for Medium-Range Weather Forecasts.", itemCount: 57, lastUpdated: "2026-07-21" },

  // 13. Human Factors
  { name: "SKYbrary Human Factors", domain: "skybrary.aero", category: "Human Factors", description: "Human factors and CRM knowledge resources.", itemCount: 98, lastUpdated: "2026-07-25" },
  { name: "HFES", domain: "hfes.org", category: "Human Factors", description: "Human Factors and Ergonomics Society research.", itemCount: 52, lastUpdated: "2026-07-20" },

  // 14. Academic
  { name: "NASA Technical Reports", domain: "ntrs.nasa.gov", category: "Academic", description: "NASA Technical Reports Server — aerospace research.", itemCount: 176, lastUpdated: "2026-07-26" },
  { name: "arXiv", domain: "arxiv.org", category: "Academic", description: "Open-access preprints incl. aerospace and safety.", itemCount: 143, lastUpdated: "2026-07-26" },
  { name: "ResearchGate", domain: "researchgate.net", category: "Academic", description: "Research network for aviation safety papers.", itemCount: 89, lastUpdated: "2026-07-23", status: "inactive" },

  // 15. Aviation News
  { name: "FlightGlobal", domain: "flightglobal.com", category: "Aviation News", description: "Aviation industry news and analysis.", itemCount: 287, lastUpdated: "2026-07-27" },
  { name: "Aviation Week", domain: "aviationweek.com", category: "Aviation News", description: "In-depth aerospace and defense journalism.", itemCount: 264, lastUpdated: "2026-07-27" },
  { name: "Simple Flying", domain: "simpleflying.com", category: "Aviation News", description: "Commercial aviation news for enthusiasts.", itemCount: 198, lastUpdated: "2026-07-26" },
  { name: "Leeham News", domain: "leehamnews.com", category: "Aviation News", description: "Commercial aviation analysis and market intelligence.", itemCount: 112, lastUpdated: "2026-07-25" },
  { name: "AIN Online", domain: "ainonline.com", category: "Aviation News", description: "Aviation International News across all segments.", itemCount: 156, lastUpdated: "2026-07-26" },

  // 16. Cyber Security
  { name: "CISA", domain: "cisa.gov", category: "Cyber Security", description: "US Cybersecurity & Infrastructure Security Agency advisories.", itemCount: 94, lastUpdated: "2026-07-26" },
  { name: "NIST", domain: "nist.gov", category: "Cyber Security", description: "Cybersecurity framework and standards for critical systems.", itemCount: 78, lastUpdated: "2026-07-24" },

  // 17. Podcasts & Webinars
  { name: "Aviation Week Podcasts", domain: "aviationweek.com", category: "Podcasts & Webinars", description: "Check 6 and other aerospace podcast series.", itemCount: 63, lastUpdated: "2026-07-25" },
  { name: "FSF Webinars", domain: "flightsafety.org", category: "Podcasts & Webinars", description: "Flight Safety Foundation safety webinars.", itemCount: 41, lastUpdated: "2026-07-22" },

  // 18. YouTube Channels
  { name: "ICAO YouTube", domain: "youtube.com", category: "YouTube Channels", description: "Official ICAO videos and safety briefings.", itemCount: 58, lastUpdated: "2026-07-24" },
  { name: "EASA YouTube", domain: "youtube.com", category: "YouTube Channels", description: "EASA safety promotion video channel.", itemCount: 47, lastUpdated: "2026-07-23" },
  { name: "FAA YouTube", domain: "youtube.com", category: "YouTube Channels", description: "FAA news, education and safety videos.", itemCount: 52, lastUpdated: "2026-07-24" },

  // 19. Email Newsletters
  { name: "FAA Safety Bulletin", domain: "faa.gov", category: "Email Newsletters", description: "FAASTeam safety briefing email newsletter.", itemCount: 36, lastUpdated: "2026-07-25" },
  { name: "EASA News", domain: "easa.europa.eu", category: "Email Newsletters", description: "EASA newsletter with rulemaking and safety updates.", itemCount: 44, lastUpdated: "2026-07-26", },
  { name: "FSF Newsletter", domain: "flightsafety.org", category: "Email Newsletters", description: "Flight Safety Foundation AeroSafety World digest.", itemCount: 39, lastUpdated: "2026-07-24" },
];

export const sources: Source[] = rawSources.map((r, i) => ({
  id: `s${i + 1}`,
  name: r.name,
  domain: r.domain,
  url: r.url ?? r.domain,
  category: r.category,
  description: r.description,
  status: r.status ?? "active",
  itemCount: r.itemCount,
  lastUpdated: r.lastUpdated,
  logo: `https://www.godaddy.com/resources/wp-content/uploads/2025/08/godaddy-favicon-example.jpg?size=3840x0`,
  active: (r.status ?? "active") === "active",
  items: r.itemCount,
  initials: initialsOf(r.name),
  color: categoryColor(r.category),
}));

function findSource(name: string): Source {
  return sources.find((s) => s.name === name) ?? sources[0];
}

// Top 10 highest-value sources for the dashboard grid
export const topSourceNames = [
  "ICAO",
  "IATA",
  "FAA SAFO",
  "EASA",
  "Flight Safety Foundation",
  "SKYbrary",
  "Aviation Safety Network",
  "NASA ASRS",
  "Airbus Safety First",
  "Boeing",
];

export const topSources = topSourceNames.map((n) => {
  const s = findSource(n);
  return {
    ...s,
    name: n === "FAA SAFO" ? "FAA Safety" : n === "Boeing" ? "Boeing Aero" : s.name,
    trend: "+" + (Math.floor(Math.random() * 12) + 2) + "%",
  };
});

// Sources-per-category coverage for the dashboard bars
export const categoryCoverage = categories
  .map((c) => ({ category: c, count: sources.filter((s) => s.category === c).length }))
  .sort((a, b) => b.count - a.count);

// Multi-series 30-day activity data
export const activityData = [
  { day: "Jun 28", alerts: 3, ads: 5, reports: 8, advisories: 6 },
  { day: "Jun 30", alerts: 4, ads: 6, reports: 11, advisories: 7 },
  { day: "Jul 2", alerts: 2, ads: 7, reports: 9, advisories: 5 },
  { day: "Jul 4", alerts: 5, ads: 4, reports: 7, advisories: 8 },
  { day: "Jul 6", alerts: 6, ads: 8, reports: 12, advisories: 6 },
  { day: "Jul 8", alerts: 4, ads: 9, reports: 14, advisories: 9 },
  { day: "Jul 10", alerts: 7, ads: 6, reports: 10, advisories: 7 },
  { day: "Jul 12", alerts: 5, ads: 11, reports: 15, advisories: 8 },
  { day: "Jul 14", alerts: 8, ads: 7, reports: 13, advisories: 10 },
  { day: "Jul 16", alerts: 6, ads: 12, reports: 17, advisories: 9 },
  { day: "Jul 18", alerts: 9, ads: 8, reports: 14, advisories: 7 },
  { day: "Jul 20", alerts: 7, ads: 14, reports: 18, advisories: 11 },
  { day: "Jul 22", alerts: 10, ads: 9, reports: 16, advisories: 8 },
  { day: "Jul 24", alerts: 8, ads: 13, reports: 20, advisories: 12 },
  { day: "Jul 26", alerts: 11, ads: 10, reports: 17, advisories: 10 },
];

export const stats = [
  { label: "Total Sources", value: "847", change: "+12", sub: "this week", trend: "up", icon: "Database", color: "text-blue-700", bg: "bg-blue-50" },
  { label: "Active Alerts", value: "23", change: "Urgent", sub: "needs review", trend: "urgent", icon: "AlertTriangle", color: "text-red-700", bg: "bg-red-50" },
  { label: "ADs Published", value: "156", change: "this month", sub: "airworthiness", trend: "up", icon: "FileWarning", color: "text-orange-700", bg: "bg-orange-50" },
  { label: "Countries Covered", value: "94", change: "+3", sub: "global reach", trend: "up", icon: "Globe", color: "text-teal-700", bg: "bg-teal-50" },
];

export const items: ContentItem[] = [
  {
    id: "1",
    title: "ICAO State Letter on Runway Safety and Excursion Prevention",
    source: "ICAO",
    sourceInitials: "IC",
    sourceColor: categoryColor("Regulators"),
    sourceLogo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPlAaShvfDb1oLWnQ7BCfqjyVmSJA_Lt6BpZx2UT3Puf5mPI47Et0xKuyty3fIEQSfkxeeQFptEKW-Z78Ik2NSAf7NikTwHNlshhwGcjSxEHHFsqOaR2xDJ_bM4y7s8dd3NT-RRAxl69Ti/s1600/icao.jpg",
    date: "2026-07-27",
    summary:
      "A new State Letter urges contracting states to adopt enhanced runway condition reporting (GRF) and accelerate implementation of runway excursion mitigation measures following a rise in reported events.",
    content: [
      "The International Civil Aviation Organization (ICAO) has issued a State Letter calling on contracting states to reinforce runway safety programmes, with particular emphasis on the Global Reporting Format (GRF) for runway surface conditions.",
      "The letter references a measurable increase in runway excursion occurrences over the past reporting cycle and recommends that states integrate excursion risk into their State Safety Programmes (SSP) and Safety Management Systems (SMS).",
      "Recommended actions include standardised runway condition assessment and reporting, stabilised approach monitoring, and improved flight crew training on landing performance assessment in degraded braking conditions.",
      "States are asked to report implementation status through the USOAP Continuous Monitoring Approach ahead of the next Air Navigation Commission review.",
    ],
    severity: "CRITICAL",
    type: "Alert",
    category: "Regulators",
    region: "Global",
    tags: ["ICAO", "Runway Safety", "GRF", "Excursion"],
  },
  {
    id: "2",
    title: "FAA SAFO: Terrain Awareness and Warning System (TAWS) Nuisance Alerts",
    source: "FAA SAFO",
    sourceInitials: "FA",
    sourceColor: categoryColor("Safety Alerts"),
    sourceLogo: "https://www.ttnews.com/sites/default/files/styles/article_full_width_webp/public/2023-11/FAA-logo-1200.jpg.webp",
    date: "2026-07-26",
    summary:
      "The FAA issued a Safety Alert For Operators addressing an increase in TAWS nuisance and false alerts on specific approach procedures, and the risk of crews inhibiting valid warnings.",
    content: [
      "This Safety Alert For Operators (SAFO) highlights a pattern of Terrain Awareness and Warning System (TAWS) nuisance alerts occurring on certain RNP and circling approach procedures.",
      "The FAA is concerned that repeated nuisance activations may lead flight crews to distrust or inhibit TAWS, degrading a critical last line of defense against controlled flight into terrain (CFIT).",
      "Operators are urged to review TAWS database currency, report recurring nuisance alerts to the manufacturer and FAA, and reinforce that crews must always respond to genuine warnings with the published escape manoeuvre.",
    ],
    severity: "HIGH",
    type: "Alert",
    category: "Safety Alerts",
    region: "United States",
    tags: ["FAA", "SAFO", "TAWS", "CFIT"],
  },
  {
    id: "3",
    title: "EASA Airworthiness Directive: A320 Family Flight Control Computer Software",
    source: "EASA AD",
    sourceInitials: "EA",
    sourceColor: categoryColor("Airworthiness Directives"),
    sourceLogo: "https://airportindustry-news.com/wp-content/uploads/sites/2/2019/12/EASA.png",
    date: "2026-07-26",
    summary:
      "An Airworthiness Directive mandates a flight control computer software update on Airbus A320 family aircraft to address a potential angle-of-attack processing anomaly.",
    content: [
      "EASA has issued an Airworthiness Directive (AD) requiring operators of Airbus A320 family aircraft to install an updated flight control computer software standard.",
      "The AD addresses a condition in which the flight control system could, under a specific combination of blocked angle-of-attack probes, command undesired pitch behaviour during certain flight phases.",
      "Compliance is required within the interval specified in the AD. Until modification, operators must apply the interim operational procedure published in the associated Alert Operators Transmission (AOT).",
      "Airbus has made the modified software standard available through its usual service channels, and no additional hardware change is required.",
    ],
    severity: "HIGH",
    type: "Advisory",
    category: "Airworthiness Directives",
    region: "Europe",
    tags: ["EASA", "Airworthiness Directive", "A320", "Flight Controls"],
  },
  {
    id: "4",
    title: "NTSB Preliminary Report: Cargo Aircraft Ground Handling Incident",
    source: "NTSB",
    sourceInitials: "NT",
    sourceColor: categoryColor("Accident Investigation"),
    sourceLogo: "https://www.ntsb.gov/Documents/50th-Emblem-tag.png",
    date: "2026-07-25",
    summary:
      "The NTSB released a preliminary report on a cargo aircraft that experienced a load shift during climb, prompting an emergency return and a review of load planning procedures.",
    content: [
      "The National Transportation Safety Board (NTSB) has published a preliminary report concerning a freighter that reported a load shift shortly after takeoff and returned to the departure airport without injuries.",
      "Initial examination indicates that a pallet restraint may not have been correctly engaged, allowing cargo movement during the climb pitch attitude.",
      "The investigation will examine load planning, weight and balance documentation, restraint hardware condition, and ground crew training. No probable cause has been determined at this preliminary stage.",
    ],
    severity: "MEDIUM",
    type: "Report",
    category: "Accident Investigation",
    region: "United States",
    tags: ["NTSB", "Cargo", "Weight & Balance", "Investigation"],
  },
  {
    id: "5",
    title: "Boeing 737 MAX Service Bulletin: Wiring Separation Inspection",
    source: "Boeing",
    sourceInitials: "BO",
    sourceColor: categoryColor("Aircraft Manufacturers"),
    sourceLogo: "https://i.ytimg.com/vi/v6kJtSR84xk/sddefault.jpg",
    date: "2026-07-25",
    summary:
      "Boeing issued a service bulletin recommending inspection and, where necessary, rerouting of a wire bundle on 737 MAX aircraft to maintain required electrical separation.",
    content: [
      "Boeing has released a Service Bulletin (SB) applicable to 737 MAX aircraft recommending a one-time inspection of a specific wire bundle installation to confirm compliance with electrical separation requirements.",
      "Where the inspection identifies insufficient separation, operators are directed to reroute or add protection to the affected bundle in accordance with the accomplishment instructions.",
      "The bulletin is precautionary and intended to preserve system redundancy. Boeing is coordinating with the FAA, which may issue a related Airworthiness Directive to mandate the action across the fleet.",
    ],
    severity: "HIGH",
    type: "Advisory",
    category: "Aircraft Manufacturers",
    region: "Global",
    tags: ["Boeing", "737 MAX", "Service Bulletin", "Wiring"],
  },
  {
    id: "6",
    title: "Airbus Safety First: Optimising the Go-Around Procedure",
    source: "Airbus Safety First",
    sourceInitials: "AS",
    sourceColor: categoryColor("Aircraft Manufacturers"),
    sourceLogo: "https://upload.wikimedia.org/wikipedia/commons/4/45/VT-JRF_%40_JFK%2C_2024-11-04.png",
    date: "2026-07-24",
    summary:
      "The latest Airbus Safety First article examines go-around handling, thrust and pitch management, and crew coordination to reduce the risk of altitude and speed excursions.",
    content: [
      "Airbus Safety First revisits the go-around manoeuvre, one of the most dynamic and least-practised phases of flight, highlighting common handling and energy-management pitfalls.",
      "The article discusses the tendency toward excessive pitch and rapid acceleration during a light-weight go-around, and reinforces the importance of monitoring flight path and speed during thrust application.",
      "Recommendations include reinforcing the standard call-outs, task sharing between pilot flying and pilot monitoring, and regular simulator practice of all-engine and one-engine-inoperative go-arounds.",
    ],
    severity: "MEDIUM",
    type: "Report",
    category: "Aircraft Manufacturers",
    region: "Global",
    tags: ["Airbus", "Go-Around", "Human Factors", "Training"],
  },
  {
    id: "7",
    title: "NASA ASRS Report: Air Traffic Control Communication Breakdown",
    source: "NASA ASRS",
    sourceInitials: "NA",
    sourceColor: categoryColor("Occurrence Databases"),
    sourceLogo: "https://www.nasa.gov/wp-content/uploads/2025/09/asrs-banner-web.jpg",
    date: "2026-07-23",
    summary:
      "A confidential ASRS report describes a readback/hearback error on a frequency change that led to a brief altitude deviation, with lessons on sterile communication.",
    content: [
      "A recent Aviation Safety Reporting System (ASRS) submission describes a communication breakdown in which a flight crew accepted an altitude clearance intended for a similar-sounding callsign.",
      "The reporter notes that frequency congestion and callsign similarity contributed to the readback/hearback error, resulting in a brief unintended altitude deviation that was quickly corrected once ATC intervened.",
      "The report reinforces the value of complete readbacks, callsign vigilance, and controllers challenging ambiguous readbacks — core defenses against loss-of-separation events.",
    ],
    severity: "LOW",
    type: "Report",
    category: "Occurrence Databases",
    region: "United States",
    tags: ["NASA ASRS", "ATC", "Communication", "Readback"],
  },
  {
    id: "8",
    title: "SKYbrary Update: Controlled Flight Into Terrain (CFIT) Prevention Toolkit",
    source: "SKYbrary",
    sourceInitials: "SK",
    sourceColor: categoryColor("Safety Organisations"),
    sourceLogo: "https://flightsafety.org/wp-content/uploads/2016/07/Skybrary-logo-824-e1475698650414.png",
    date: "2026-07-22",
    summary:
      "SKYbrary refreshed its CFIT prevention resources, consolidating guidance on TAWS use, stabilised approaches, and terrain awareness during non-precision approaches.",
    content: [
      "SKYbrary has updated its Controlled Flight Into Terrain (CFIT) knowledge area, bringing together current guidance from ICAO, EUROCONTROL and the Flight Safety Foundation.",
      "The refreshed toolkit covers terrain awareness and warning systems, stabilised approach criteria, and the human-factors elements that contribute to loss of terrain awareness.",
      "The resource is intended for operators building or refreshing their CFIT-prevention training and safety promotion material.",
    ],
    severity: "INFO",
    type: "Advisory",
    category: "Safety Organisations",
    region: "Global",
    tags: ["SKYbrary", "CFIT", "TAWS", "Toolkit"],
  },
  {
    id: "9",
    title: "EUROCONTROL Safety Alert: TCAS Resolution Advisory Compliance",
    source: "EUROCONTROL",
    sourceInitials: "EU",
    sourceColor: categoryColor("Safety Organisations"),
    sourceLogo: "https://www.easa.europa.eu/sites/default/files/inline-images/Screenshot_from_2025-01-10_15-30-56.png",
    date: "2026-07-21",
    summary:
      "EUROCONTROL highlighted occurrences where crews did not promptly follow TCAS Resolution Advisories, and reiterated that RAs take priority over ATC instructions.",
    content: [
      "EUROCONTROL has issued a safety reminder following analysis of occurrences in which flight crews delayed or did not follow Traffic Collision Avoidance System (TCAS) Resolution Advisories (RA).",
      "The alert reiterates the fundamental principle that, once an RA is triggered, the crew must follow it promptly and accurately, even if it conflicts with an ATC clearance, and must report the RA to ATC.",
      "Operators are encouraged to reinforce TCAS RA response in recurrent training and to submit RA occurrence data to support network-wide monitoring.",
    ],
    severity: "HIGH",
    type: "Alert",
    category: "Air Traffic Management",
    region: "Europe",
    tags: ["EUROCONTROL", "TCAS", "Resolution Advisory", "Separation"],
  },
  {
    id: "10",
    title: "ATSB Investigation Update: Turboprop Engine Power Loss on Approach",
    source: "ATSB",
    sourceInitials: "AT",
    sourceColor: categoryColor("Accident Investigation"),
    sourceLogo: "https://i.ytimg.com/vi/a-6_VtAAqE0/maxresdefault.jpg",
    date: "2026-07-20",
    summary:
      "The ATSB provided an update on its investigation into a regional turboprop that experienced a partial power loss on approach, focusing on fuel system and maintenance history.",
    content: [
      "The Australian Transport Safety Bureau (ATSB) has released an interim update on its investigation into a regional turboprop that experienced a partial engine power loss during approach and landed safely.",
      "Investigators are examining the aircraft's fuel system, recent maintenance actions, and recorded engine parameters to understand the sequence that led to the power reduction.",
      "The ATSB notes that the crew's adherence to the abnormal checklist contributed to the successful outcome and will publish safety findings in its final report.",
    ],
    severity: "MEDIUM",
    type: "Report",
    category: "Accident Investigation",
    region: "Australia",
    tags: ["ATSB", "Turboprop", "Engine", "Investigation"],
  },
  {
    id: "11",
    title: "FlightGlobal: Regulators Signal New Safety Rules for Advanced Air Mobility",
    source: "FlightGlobal",
    sourceInitials: "FL",
    sourceColor: categoryColor("Aviation News"),
    sourceLogo: "https://cdn-ukwest.onetrust.com/logos/c3f27b3d-766d-49e2-ab53-a234fb034271/b976c2d9-38f9-4137-b570-05d677c872c8/c2ffcf7f-3e5b-4f36-a30a-0e90f54b081f/FlighLogoRound.png",
    date: "2026-07-19",
    summary:
      "Industry coverage of upcoming certification and operating rules for eVTOL and advanced air mobility, as regulators move toward harmonised safety frameworks.",
    content: [
      "FlightGlobal reports that regulators on both sides of the Atlantic are advancing new certification and operating rules for electric vertical take-off and landing (eVTOL) aircraft and advanced air mobility (AAM).",
      "The article outlines expected requirements around pilot training, vertiport operations, and battery safety, and the push toward harmonisation between the FAA and EASA frameworks.",
      "Manufacturers welcomed the clarity but cautioned that timelines remain ambitious given the novelty of the technology and operations.",
    ],
    severity: "INFO",
    type: "Report",
    category: "Aviation News",
    region: "Global",
    tags: ["FlightGlobal", "eVTOL", "AAM", "Certification"],
  },
  {
    id: "12",
    title: "FAA InFO: Enhanced Weather Briefing Procedures for Convective Season",
    source: "FAA SAFO",
    sourceInitials: "FA",
    sourceColor: categoryColor("Safety Alerts"),
    sourceLogo: "https://www.atc-network.com/Upload/Associations/logo300/FAA.jpg",
    date: "2026-07-18",
    summary:
      "An Information for Operators bulletin recommends enhanced pre-flight and en-route weather briefing practices during the convective season to improve thunderstorm avoidance.",
    content: [
      "This Information for Operators (InFO) bulletin from the FAA provides recommended practices for weather briefing and in-flight decision making during the convective (thunderstorm) season.",
      "The bulletin encourages operators to make full use of graphical forecasts, datalink weather, and dispatch support, and to establish clear thunderstorm avoidance criteria in operating procedures.",
      "It also reminds crews of the limitations of onboard weather radar and the importance of strategic route planning around developing convection.",
    ],
    severity: "LOW",
    type: "Advisory",
    category: "Meteorology",
    region: "United States",
    tags: ["FAA", "InFO", "Weather", "Convective"],
  },
];
