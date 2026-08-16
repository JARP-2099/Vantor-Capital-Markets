/**
 * Fictional companies used in marketing compositions. Everything here is
 * invented and must always render under an "Illustrative" caption — no
 * real companies, no implied live data. Status strings mirror
 * PUBLIC_INTENT_BADGES so the demo speaks the product's actual language.
 */

export type IllustrativeCompany = {
  name: string;
  oneLiner: string;
  industry: string;
  stage: string;
  hq: string;
  revenue: string;
  growth: string;
  valuation: string;
  verifiedPct: number;
  status: "Seeking Capital" | "Open to Offers" | "Not Raising";
};

export const ILLUSTRATIVE_COMPANIES: IllustrativeCompany[] = [
  {
    name: "Arclight Aerospace",
    oneLiner: "Precision titanium components for aerospace, delivered in days.",
    industry: "Advanced Manufacturing",
    stage: "Series A",
    hq: "Cincinnati, OH",
    revenue: "$3.1M",
    growth: "+64%",
    valuation: "$4.2M – $5.1M",
    verifiedPct: 82,
    status: "Seeking Capital",
  },
  {
    name: "Caldera Biothermal",
    oneLiner: "Geothermal heat for industrial process loads.",
    industry: "Climate & Energy",
    stage: "Series B",
    hq: "Reno, NV",
    revenue: "$12.4M",
    growth: "+38%",
    valuation: "$86M – $104M",
    verifiedPct: 91,
    status: "Not Raising",
  },
  {
    name: "Corvex Robotics",
    oneLiner: "Autonomous pallet handling for mid-size warehouses.",
    industry: "Robotics",
    stage: "Series A",
    hq: "Columbus, OH",
    revenue: "$4.8M",
    growth: "+71%",
    valuation: "$28M – $34M",
    verifiedPct: 77,
    status: "Seeking Capital",
  },
  {
    name: "LoomWeave Systems",
    oneLiner: "Workflow automation for industrial textile production.",
    industry: "Enterprise SaaS",
    stage: "Seed",
    hq: "Raleigh, NC",
    revenue: "$890K",
    growth: "+112%",
    valuation: "$7.2M – $9.4M",
    verifiedPct: 64,
    status: "Seeking Capital",
  },
  {
    name: "Northbeam Logistics AI",
    oneLiner: "Route intelligence that cuts LTL freight costs.",
    industry: "Logistics",
    stage: "Seed",
    hq: "Kansas City, MO",
    revenue: "$1.2M",
    growth: "+96%",
    valuation: "$9.0M – $12.0M",
    verifiedPct: 58,
    status: "Open to Offers",
  },
  {
    name: "Basalt Analytics",
    oneLiner: "Cost observability for large-scale data platforms.",
    industry: "Data Infrastructure",
    stage: "Series A",
    hq: "Denver, CO",
    revenue: "$2.6M",
    growth: "+59%",
    valuation: "$21M – $26M",
    verifiedPct: 73,
    status: "Not Raising",
  },
];
