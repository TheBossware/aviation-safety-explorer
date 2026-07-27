export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type ItemType = "Alert" | "Warning" | "Report" | "Advisory";

export interface ContentItem {
  id: string;
  title: string;
  source: string;
  sourceInitials: string;
  sourceColor: string;
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
  url: string;
  category: string;
  active: boolean;
  lastUpdated: string;
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

export const items: ContentItem[] = [
  {
    id: "1",
    title: "OSHA Issues Emergency Standard on Combustible Dust in Manufacturing Facilities",
    source: "OSHA Newsroom",
    sourceInitials: "OS",
    sourceColor: "bg-blue-700",
    date: "2026-07-27",
    summary:
      "A new emergency temporary standard requires manufacturers handling combustible dust to implement dust collection systems and conduct quarterly hazard assessments within 90 days.",
    content: [
      "The Occupational Safety and Health Administration (OSHA) has released an emergency temporary standard (ETS) targeting combustible dust hazards across manufacturing facilities. The rule follows a series of deflagration incidents linked to accumulated organic and metal dust in food processing and metalworking plants.",
      "Under the new standard, employers must install and maintain engineered dust collection systems, establish written housekeeping programs, and perform documented hazard assessments every quarter. Facilities exceeding threshold dust layers of 1/32 inch over 5% of floor area must halt operations until remediation is complete.",
      "Compliance officers will begin targeted inspections within 90 days. OSHA estimates the standard will affect roughly 30,000 establishments nationwide and prevent an estimated 130 dust-related fires and explosions annually.",
      "Industry groups have requested an extended implementation window, while worker safety advocates have praised the move as long overdue given the frequency of preventable combustible dust events over the past decade.",
    ],
    severity: "CRITICAL",
    type: "Alert",
    category: "Regulatory",
    region: "United States",
    tags: ["OSHA", "Combustible Dust", "Manufacturing", "Emergency Standard"],
  },
  {
    id: "2",
    title: "Recall: Defective Fall Protection Harnesses Distributed to Construction Sites",
    source: "CPSC Alerts",
    sourceInitials: "CP",
    sourceColor: "bg-red-600",
    date: "2026-07-26",
    summary:
      "Approximately 42,000 full-body safety harnesses are being recalled after reports that the dorsal D-ring can detach under load, posing a serious fall hazard.",
    content: [
      "The Consumer Product Safety Commission, in cooperation with the manufacturer, has announced a voluntary recall of approximately 42,000 full-body fall protection harnesses sold to commercial and residential construction operations between January and June 2026.",
      "Investigations found that the dorsal D-ring attachment point can separate from the webbing under dynamic loading, a defect implicated in at least three near-miss incidents. No fatalities have been reported, but the agency urges immediate removal from service.",
      "Affected units carry lot codes H-2601 through H-2606 printed on the interior label. Customers should stop using the harnesses immediately and contact the manufacturer for a free replacement or full refund.",
    ],
    severity: "HIGH",
    type: "Alert",
    category: "Product Recall",
    region: "North America",
    tags: ["Recall", "Fall Protection", "Construction", "PPE"],
  },
  {
    id: "3",
    title: "NIOSH Study Links Prolonged Heat Exposure to Rising Warehouse Injury Rates",
    source: "NIOSH Research",
    sourceInitials: "NI",
    sourceColor: "bg-teal-600",
    date: "2026-07-25",
    summary:
      "New research shows a 23% increase in musculoskeletal and heat-stress injuries among warehouse workers during peak summer months, prompting calls for mandatory cooling breaks.",
    content: [
      "A longitudinal study from the National Institute for Occupational Safety and Health (NIOSH) has documented a 23% rise in warehouse worker injuries during summer heat waves, with heat stress and fatigue-related musculoskeletal disorders leading the increase.",
      "Researchers tracked 12,000 workers across 40 distribution centers over three years. Facilities without active cooling or scheduled rest breaks reported injury rates nearly double those with heat mitigation programs.",
      "The report recommends mandatory acclimatization periods for new workers, hydration stations, and scheduled cooling breaks when the heat index exceeds 90°F.",
    ],
    severity: "MEDIUM",
    type: "Report",
    category: "Research",
    region: "United States",
    tags: ["NIOSH", "Heat Stress", "Warehouse", "Ergonomics"],
  },
  {
    id: "4",
    title: "Advisory: Updated Lockout/Tagout Procedures for Automated Assembly Lines",
    source: "Safety+Health Magazine",
    sourceInitials: "SH",
    sourceColor: "bg-indigo-600",
    date: "2026-07-24",
    summary:
      "Guidance released for facilities upgrading to robotic assembly systems, emphasizing energy isolation verification and multi-point lockout for collaborative robots.",
    content: [
      "As facilities increasingly adopt collaborative robotics, updated lockout/tagout (LOTO) guidance addresses the unique energy-control challenges of automated assembly lines.",
      "The advisory stresses verification of all hazardous energy sources — including stored pneumatic and capacitive energy — before maintenance. Multi-point lockout protocols are recommended where several workers service a single cell.",
      "Employers are advised to update their energy-control programs and retrain maintenance personnel on robot-specific isolation points.",
    ],
    severity: "LOW",
    type: "Advisory",
    category: "Best Practices",
    region: "Global",
    tags: ["LOTO", "Robotics", "Maintenance", "Automation"],
  },
  {
    id: "5",
    title: "Chemical Exposure Warning: Elevated Benzene Levels Detected at Refinery Complex",
    source: "EPA Enforcement",
    sourceInitials: "EP",
    sourceColor: "bg-green-700",
    date: "2026-07-23",
    summary:
      "Ambient air monitoring detected benzene concentrations exceeding action limits near a Gulf Coast refinery, triggering mandatory fenceline notifications and worker exposure assessments.",
    content: [
      "Environmental Protection Agency fenceline monitors recorded benzene concentrations exceeding the 9 µg/m³ action level at a Gulf Coast refining complex over a rolling two-week average.",
      "The facility is required to investigate the source, implement corrective measures, and notify nearby communities. Worker exposure assessments and enhanced respiratory protection are being deployed in affected units.",
      "Benzene is a known carcinogen, and chronic exposure is associated with blood disorders including leukemia. Continuous monitoring will remain in effect until levels return below the action threshold.",
    ],
    severity: "HIGH",
    type: "Warning",
    category: "Environmental",
    region: "United States",
    tags: ["Benzene", "Air Quality", "Refinery", "EPA"],
  },
  {
    id: "6",
    title: "Report: Scaffolding Collapse Investigation Reveals Inadequate Base Plates",
    source: "Construction Safety Council",
    sourceInitials: "CS",
    sourceColor: "bg-orange-600",
    date: "2026-07-22",
    summary:
      "A final investigation report on a high-rise scaffolding collapse attributes the failure to undersized base plates and missing mudsills on uneven terrain.",
    content: [
      "The final investigation report into a scaffolding collapse at a downtown high-rise project concludes that undersized base plates and the absence of mudsills on compacted-but-uneven ground caused a progressive structural failure.",
      "Two workers sustained non-life-threatening injuries. The report notes that the erection crew deviated from the manufacturer's tolerances and that daily competent-person inspections were not documented.",
      "Recommendations include mandatory soil-bearing checks, standardized base-plate sizing charts, and reinforced inspection recordkeeping for all scaffolds over 40 feet.",
    ],
    severity: "MEDIUM",
    type: "Report",
    category: "Incident",
    region: "United States",
    tags: ["Scaffolding", "Construction", "Investigation", "Falls"],
  },
  {
    id: "7",
    title: "Advisory: Best Practices for Confined Space Entry in Wastewater Facilities",
    source: "Water Environment Federation",
    sourceInitials: "WE",
    sourceColor: "bg-cyan-700",
    date: "2026-07-21",
    summary:
      "Updated recommendations cover atmospheric testing sequences, continuous monitoring, and rescue readiness for permit-required confined spaces in treatment plants.",
    content: [
      "New confined-space entry guidance for wastewater treatment facilities emphasizes a strict atmospheric testing sequence — oxygen, then flammables, then toxics — before and during every entry.",
      "The advisory recommends continuous multi-gas monitoring, a dedicated attendant, and on-site retrieval systems capable of non-entry rescue for all permit-required spaces.",
      "Hydrogen sulfide and methane accumulation remain the leading atmospheric hazards in these environments, underscoring the need for calibrated detection equipment.",
    ],
    severity: "LOW",
    type: "Advisory",
    category: "Best Practices",
    region: "Global",
    tags: ["Confined Space", "Wastewater", "Gas Detection", "Rescue"],
  },
  {
    id: "8",
    title: "Critical Alert: Arc Flash Incident Prompts Review of Electrical PPE Standards",
    source: "NFPA Bulletin",
    sourceInitials: "NF",
    sourceColor: "bg-red-700",
    date: "2026-07-20",
    summary:
      "Following a severe arc flash injury, a review of NFPA 70E compliance highlights gaps in incident-energy analysis and arc-rated clothing selection.",
    content: [
      "A severe arc flash incident resulting in second-degree burns has prompted an urgent review of electrical safety practices under NFPA 70E.",
      "The investigation found the affected panel lacked an up-to-date incident-energy label, and the worker's arc-rated clothing was rated below the calculated incident energy for the task.",
      "The bulletin calls for renewed arc-flash hazard analyses, accurate equipment labeling, and verification that PPE arc ratings meet or exceed calculated incident energy at each work location.",
    ],
    severity: "CRITICAL",
    type: "Alert",
    category: "Electrical",
    region: "North America",
    tags: ["Arc Flash", "NFPA 70E", "Electrical", "PPE"],
  },
  {
    id: "9",
    title: "Warning: Counterfeit Respirator Cartridges Circulating in Online Marketplaces",
    source: "NIOSH Research",
    sourceInitials: "NI",
    sourceColor: "bg-teal-600",
    date: "2026-07-19",
    summary:
      "Counterfeit chemical cartridges bearing fraudulent NIOSH approval numbers offer little to no protection and are being sold through third-party online sellers.",
    content: [
      "NIOSH has issued a warning about counterfeit respirator cartridges sold through third-party online marketplaces bearing fraudulent approval numbers.",
      "Laboratory testing showed the counterfeit cartridges provided minimal breakthrough protection against organic vapors, placing workers at serious risk of chemical exposure.",
      "Purchasers are urged to buy only from authorized distributors and to verify approval numbers against the official NIOSH Certified Equipment List.",
    ],
    severity: "HIGH",
    type: "Warning",
    category: "Product Safety",
    region: "Global",
    tags: ["Respirators", "Counterfeit", "NIOSH", "Respiratory"],
  },
  {
    id: "10",
    title: "Report: Annual Workplace Fatality Statistics Show Decline in Transportation Incidents",
    source: "Bureau of Labor Statistics",
    sourceInitials: "BL",
    sourceColor: "bg-slate-700",
    date: "2026-07-18",
    summary:
      "The latest census of fatal occupational injuries reports an overall decline, driven largely by improvements in transportation and material-moving occupations.",
    content: [
      "The annual Census of Fatal Occupational Injuries reports an overall 4% decline in workplace fatalities, with the sharpest improvement in transportation and material-moving roles.",
      "Analysts attribute the drop to expanded telematics, fatigue-management programs, and collision-avoidance technology in commercial fleets.",
      "Despite the improvement, falls, slips, and trips remain the second-leading cause of fatal injury, signaling continued need for fall-protection investment.",
    ],
    severity: "INFO",
    type: "Report",
    category: "Statistics",
    region: "United States",
    tags: ["Statistics", "Fatalities", "Transportation", "BLS"],
  },
  {
    id: "11",
    title: "Advisory: Winter Slip-and-Fall Prevention Program Guidance Released",
    source: "Safety+Health Magazine",
    sourceInitials: "SH",
    sourceColor: "bg-indigo-600",
    date: "2026-07-17",
    summary:
      "Comprehensive guidance helps facilities prepare for icy conditions with de-icing schedules, footwear traction requirements, and entryway matting standards.",
    content: [
      "Ahead of the winter season, new guidance outlines a structured slip-and-fall prevention program for facilities in cold climates.",
      "Recommendations include documented de-icing schedules, minimum footwear traction ratings for outdoor workers, and standardized entryway matting to capture moisture.",
      "The advisory highlights that same-level falls spike by up to 40% during freeze-thaw cycles, making proactive surface management essential.",
    ],
    severity: "LOW",
    type: "Advisory",
    category: "Best Practices",
    region: "North America",
    tags: ["Slips & Falls", "Winter", "Prevention", "Facilities"],
  },
  {
    id: "12",
    title: "Alert: Forklift Battery Charging Station Fire Underscores Hydrogen Ventilation Needs",
    source: "Construction Safety Council",
    sourceInitials: "CS",
    sourceColor: "bg-orange-600",
    date: "2026-07-16",
    summary:
      "A lithium and lead-acid charging area fire highlights the importance of hydrogen off-gassing ventilation and thermal-runaway detection in battery rooms.",
    content: [
      "A fire at a forklift battery charging station has renewed attention on ventilation and thermal-runaway detection in industrial battery rooms.",
      "Investigators found inadequate hydrogen off-gassing ventilation from lead-acid units and no early thermal detection on adjacent lithium-ion chargers.",
      "The alert recommends dedicated exhaust ventilation, hydrogen gas detection, and spacing requirements between charging bays to limit fire spread.",
    ],
    severity: "MEDIUM",
    type: "Alert",
    category: "Fire Safety",
    region: "United States",
    tags: ["Forklift", "Battery", "Fire", "Ventilation"],
  },
];

export const sources: Source[] = [
  { id: "s1", name: "OSHA Newsroom", url: "osha.gov/news", category: "Regulatory", active: true, lastUpdated: "2026-07-27", items: 312, initials: "OS", color: "bg-blue-700" },
  { id: "s2", name: "CPSC Alerts", url: "cpsc.gov/recalls", category: "Product Recall", active: true, lastUpdated: "2026-07-26", items: 188, initials: "CP", color: "bg-red-600" },
  { id: "s3", name: "NIOSH Research", url: "cdc.gov/niosh", category: "Research", active: true, lastUpdated: "2026-07-25", items: 154, initials: "NI", color: "bg-teal-600" },
  { id: "s4", name: "Safety+Health Magazine", url: "safetyandhealthmagazine.com", category: "Publication", active: true, lastUpdated: "2026-07-24", items: 276, initials: "SH", color: "bg-indigo-600" },
  { id: "s5", name: "EPA Enforcement", url: "epa.gov/enforcement", category: "Environmental", active: false, lastUpdated: "2026-07-12", items: 97, initials: "EP", color: "bg-green-700" },
  { id: "s6", name: "Construction Safety Council", url: "buildsafe.org", category: "Industry", active: true, lastUpdated: "2026-07-22", items: 143, initials: "CS", color: "bg-orange-600" },
  { id: "s7", name: "Water Environment Federation", url: "wef.org", category: "Industry", active: true, lastUpdated: "2026-07-21", items: 61, initials: "WE", color: "bg-cyan-700" },
  { id: "s8", name: "NFPA Bulletin", url: "nfpa.org/news", category: "Fire Safety", active: true, lastUpdated: "2026-07-20", items: 129, initials: "NF", color: "bg-red-700" },
  { id: "s9", name: "Bureau of Labor Statistics", url: "bls.gov/iif", category: "Statistics", active: false, lastUpdated: "2026-06-30", items: 44, initials: "BL", color: "bg-slate-700" },
  { id: "s10", name: "European Agency for Safety", url: "osha.europa.eu", category: "Regulatory", active: true, lastUpdated: "2026-07-19", items: 85, initials: "EU", color: "bg-blue-500" },
];

export const topSources = [
  { name: "OSHA Newsroom", items: 312, initials: "OS", color: "bg-blue-700", trend: "+12%" },
  { name: "Safety+Health Magazine", items: 276, initials: "SH", color: "bg-indigo-600", trend: "+8%" },
  { name: "CPSC Alerts", items: 188, initials: "CP", color: "bg-red-600", trend: "+5%" },
  { name: "NIOSH Research", items: 154, initials: "NI", color: "bg-teal-600", trend: "+3%" },
  { name: "Construction Safety Council", items: 143, initials: "CS", color: "bg-orange-600", trend: "-2%" },
];

export const activityData = [
  { day: "Jun 28", items: 32, alerts: 4 },
  { day: "Jun 30", items: 41, alerts: 6 },
  { day: "Jul 2", items: 38, alerts: 5 },
  { day: "Jul 4", items: 27, alerts: 3 },
  { day: "Jul 6", items: 45, alerts: 7 },
  { day: "Jul 8", items: 52, alerts: 9 },
  { day: "Jul 10", items: 48, alerts: 6 },
  { day: "Jul 12", items: 61, alerts: 11 },
  { day: "Jul 14", items: 55, alerts: 8 },
  { day: "Jul 16", items: 67, alerts: 12 },
  { day: "Jul 18", items: 58, alerts: 7 },
  { day: "Jul 20", items: 72, alerts: 14 },
  { day: "Jul 22", items: 64, alerts: 9 },
  { day: "Jul 24", items: 78, alerts: 13 },
  { day: "Jul 26", items: 71, alerts: 12 },
];

export const categories = [
  "Regulatory", "Product Recall", "Research", "Best Practices", "Environmental",
  "Incident", "Electrical", "Product Safety", "Statistics", "Fire Safety",
];

export const stats = [
  { label: "Total Items", value: "1,284", change: "+12.5%", trend: "up", icon: "FileText", color: "text-blue-700", bg: "bg-blue-50" },
  { label: "Active Sources", value: "47", change: "+3", trend: "up", icon: "Rss", color: "text-teal-700", bg: "bg-teal-50" },
  { label: "Alerts Today", value: "12", change: "+4", trend: "up", icon: "AlertTriangle", color: "text-red-700", bg: "bg-red-50" },
  { label: "Monitored Topics", value: "89", change: "+2", trend: "up", icon: "Tag", color: "text-amber-700", bg: "bg-amber-50" },
];
