/**
 * Illustrative example companies used ONLY in marketing compositions to show
 * what the product looks like. Always presented with an "illustrative
 * examples" caption; never mixed with real marketplace data.
 */

export type DemoCompany = {
  name: string;
  industry: string;
  stage: string;
  revenue: string;
  growth: string;
  valuation: string;
  verification: string;
  status: string;
};

export const DEMO_COMPANIES: DemoCompany[] = [
  {
    name: "Arclight Aerospace",
    industry: "Advanced Manufacturing",
    stage: "Series A",
    revenue: "$3.1M",
    growth: "+64%",
    valuation: "$4.2M to $5.1M",
    verification: "82%",
    status: "Seeking Capital",
  },
  {
    name: "Meridian Grid Analytics",
    industry: "Climate & Energy",
    stage: "Seed",
    revenue: "$1.4M",
    growth: "+38%",
    valuation: "$2.0M to $2.6M",
    verification: "75%",
    status: "Seeking Capital",
  },
  {
    name: "Halewood Diagnostics",
    industry: "Healthcare",
    stage: "Series A",
    revenue: "$2.7M",
    growth: "+41%",
    valuation: "$3.5M to $4.4M",
    verification: "88%",
    status: "Open to Offers",
  },
  {
    name: "Corvid Robotics",
    industry: "Robotics",
    stage: "Seed",
    revenue: "$860K",
    growth: "+52%",
    valuation: "$1.3M to $1.8M",
    verification: "64%",
    status: "Seeking Capital",
  },
  {
    name: "Bluefin Logistics",
    industry: "Logistics & Supply Chain",
    stage: "Growth",
    revenue: "$8.9M",
    growth: "+22%",
    valuation: "$11M to $14M",
    verification: "91%",
    status: "Not Raising",
  },
  {
    name: "Northgate Materials",
    industry: "Industrial",
    stage: "Seed",
    revenue: "$1.1M",
    growth: "+29%",
    valuation: "$1.6M to $2.1M",
    verification: "70%",
    status: "Open to Strategic Investment",
  },
];

export const DEMO_SELECTED = DEMO_COMPANIES[0];
