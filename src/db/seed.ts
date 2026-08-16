/**
 * Development seed script: demo founder/admin accounts and clearly fictional
 * demo companies. Runs only when ALLOW_SEED=true so demo content can never
 * reach a production database by accident. All seeded companies carry
 * isDemo=true. Run with: pnpm db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { buildValuationInputs } from "../lib/valuation/assemble";
import { runValuationEngine } from "../lib/valuation/engine";
import * as schema from "./schema";

const {
  user,
  account,
  userRoles,
  companies,
  companyIntents,
  companyMembers,
  companyMetrics,
  valuationRuns,
  valuationComponents,
} = schema;

async function main() {
  if (process.env.ALLOW_SEED !== "true") {
    console.error("Refusing to seed: set ALLOW_SEED=true in the environment first.");
    process.exit(1);
  }
  // Second, independent guard: the seed creates a demo admin account with a
  // password committed to a public repository. A leaked ALLOW_SEED=true must
  // not be enough to plant it in production.
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed: NODE_ENV is production.");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });

  const now = new Date();

  async function upsertUser(name: string, email: string, password: string) {
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing[0]) return existing[0].id;
    const id = randomUUID();
    await db.insert(user).values({ id, name, email, emailVerified: true });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
    });
    console.log(`  user: ${email} (password: ${password})`);
    return id;
  }

  console.log("Seeding demo accounts…");
  const adminId = await upsertUser("Vantor Admin", "admin@vantor.dev", "vantor-admin-dev-1");
  const founderId = await upsertUser("Dana Reyes", "founder@vantor.dev", "vantor-founder-dev-1");

  await db.insert(userRoles).values([
    { userId: adminId, role: "admin" },
    { userId: founderId, role: "founder" },
  ]).onConflictDoNothing();

  type DemoCompany = {
    name: string;
    slug: string;
    shortDescription: string;
    industry: string;
    subindustry?: string;
    stage: (typeof schema.companyStageEnum.enumValues)[number];
    businessModel: (typeof schema.businessModelEnum.enumValues)[number];
    hqCity: string;
    hqCountry: string;
    foundedYear: number;
    website: string;
    intents: (typeof schema.companyIntentEnum.enumValues)[number][];
    story: Partial<{
      problem: string;
      solution: string;
      market: string;
      competitivePosition: string;
      businessModelDescription: string;
      traction: string;
      roadmap: string;
      fullDescription: string;
    }>;
    team: { name: string; role: "founder" | "team"; title: string; bio?: string }[];
    metrics: {
      metricType: (typeof schema.metricTypeEnum.enumValues)[number];
      value: string;
      currency?: string;
      asOf: string;
    }[];
  };

  const demoCompanies: DemoCompany[] = [
    {
      name: "AeroForge",
      slug: "aeroforge",
      shortDescription:
        "Additive-manufactured turbine components for defense and aerospace primes.",
      industry: "Aerospace & Defense",
      subindustry: "Advanced Manufacturing",
      stage: "seed",
      businessModel: "hardware",
      hqCity: "Colorado Springs",
      hqCountry: "United States",
      foundedYear: 2022,
      website: "https://example.com/aeroforge",
      intents: ["seeking_investment", "open_to_strategic_investment"],
      story: {
        problem:
          "Defense primes wait 40+ weeks for flight-qualified turbine components from a shrinking supplier base.",
        solution:
          "AeroForge produces additively manufactured, flight-qualified components in under six weeks using a proprietary printing and certification pipeline.",
        market:
          "The U.S. defense turbine component market alone represents a multi-billion dollar annual spend, with allied markets expanding under new procurement programs.",
        competitivePosition:
          "Certified parts library and existing prime contracts create a qualification moat that new entrants need years to replicate.",
        traction:
          "Two production contracts with tier-one primes; qualified parts catalog grew from 4 to 19 SKUs in twelve months.",
        roadmap:
          "Expand qualification to rotating hot-section parts and open a second production cell in 2027.",
      },
      team: [
        { name: "Dana Reyes", role: "founder", title: "CEO", bio: "Former propulsion engineer; led additive qualification programs." },
        { name: "Marcus Webb", role: "founder", title: "CTO", bio: "Materials scientist specializing in nickel superalloys." },
        { name: "Priya Natarajan", role: "team", title: "Head of Quality" },
      ],
      metrics: [
        { metricType: "arr", value: "580000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "revenue_growth_yoy", value: "74", asOf: "2026-06-30" },
        { metricType: "customers", value: "2", asOf: "2026-06-30" },
        { metricType: "employees", value: "14", asOf: "2026-06-30" },
        { metricType: "capital_raised_total", value: "3200000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "arr", value: "333000", currency: "USD", asOf: "2025-06-30" },
      ],
    },
    {
      name: "Atlas Robotics",
      slug: "atlas-robotics",
      shortDescription: "Autonomous pallet-handling robots for mid-size warehouses.",
      industry: "Robotics",
      subindustry: "Warehouse Automation",
      stage: "series_a",
      businessModel: "subscription",
      hqCity: "Rotterdam",
      hqCountry: "Netherlands",
      foundedYear: 2021,
      website: "https://example.com/atlas-robotics",
      intents: ["seeking_investment"],
      story: {
        problem:
          "Mid-size warehouses cannot justify the capital cost of traditional automation, leaving them dependent on scarce labor.",
        solution:
          "Robots-as-a-service: autonomous pallet handling deployed in days, priced per pallet moved, with no upfront capital.",
        market:
          "Over 100,000 warehouses in Europe alone fall below the size threshold that conventional integrators serve.",
        competitivePosition:
          "Deployment speed (3 days vs. 9 months) and consumption pricing differentiate against fixed-infrastructure incumbents.",
        traction: "31 sites live across four countries; net revenue retention above 130%.",
        roadmap: "Mixed-fleet orchestration and cold-storage variants in development.",
      },
      team: [
        { name: "Lotte van Dijk", role: "founder", title: "CEO" },
        { name: "Emre Kaya", role: "founder", title: "CTO" },
      ],
      metrics: [
        { metricType: "arr", value: "4100000", currency: "EUR", asOf: "2026-06-30" },
        { metricType: "revenue_growth_yoy", value: "112", asOf: "2026-06-30" },
        { metricType: "customers", value: "31", asOf: "2026-06-30" },
        { metricType: "employees", value: "48", asOf: "2026-06-30" },
        { metricType: "gross_margin", value: "54", asOf: "2026-06-30" },
        { metricType: "capital_raised_total", value: "14500000", currency: "EUR", asOf: "2026-06-30" },
      ],
    },
    {
      name: "Northstar Energy",
      slug: "northstar-energy",
      shortDescription:
        "Long-duration thermal storage that turns industrial waste heat into dispatchable power.",
      industry: "Climate & Energy",
      subindustry: "Energy Storage",
      stage: "series_b",
      businessModel: "transactional",
      hqCity: "Oslo",
      hqCountry: "Norway",
      foundedYear: 2019,
      website: "https://example.com/northstar-energy",
      intents: ["open_to_strategic_investment", "open_to_acquisition_offers"],
      story: {
        problem:
          "Industrial sites vent enormous quantities of recoverable heat while paying peak prices for grid electricity.",
        solution:
          "Modular molten-salt storage units capture waste heat and dispatch it as electricity or process heat on demand.",
        market:
          "Industrial heat recovery is a rapidly growing segment of the energy transition, driven by EU efficiency directives.",
        competitivePosition:
          "Round-trip efficiency and containerized deployment beat retrofit steam-cycle alternatives on cost per megawatt-hour.",
        traction: "Nine industrial installations; first utility-scale pilot commissioned.",
        roadmap: "Utility-scale product line and North American expansion.",
      },
      team: [
        { name: "Ingrid Solberg", role: "founder", title: "CEO" },
        { name: "Jonas Lindqvist", role: "team", title: "VP Engineering" },
      ],
      metrics: [
        { metricType: "revenue_annual", value: "11800000", currency: "EUR", asOf: "2025-12-31" },
        { metricType: "revenue_growth_yoy", value: "61", asOf: "2025-12-31" },
        { metricType: "customers", value: "9", asOf: "2025-12-31" },
        { metricType: "employees", value: "86", asOf: "2025-12-31" },
        { metricType: "capital_raised_total", value: "42000000", currency: "EUR", asOf: "2025-12-31" },
      ],
    },
    {
      name: "Meridian Health AI",
      slug: "meridian-health-ai",
      shortDescription:
        "Clinical documentation automation for outpatient specialty clinics.",
      industry: "Healthcare",
      subindustry: "Clinical Software",
      stage: "seed",
      businessModel: "subscription",
      hqCity: "Austin",
      hqCountry: "United States",
      foundedYear: 2023,
      website: "https://example.com/meridian-health",
      intents: ["seeking_investment", "open_to_minority_investment"],
      story: {
        problem:
          "Specialists lose two hours a day to documentation, and scribe services cost more than most clinics can sustain.",
        solution:
          "Ambient documentation tuned per specialty, integrated directly with the clinic's existing records system.",
        market:
          "More than 200,000 outpatient specialty clinics in the U.S. face the same documentation burden.",
        competitivePosition:
          "Specialty-specific accuracy and native integrations against horizontal, general-purpose competitors.",
        traction: "70 clinics live; physician retention above 95% after six months.",
        roadmap: "Coding-assist module and two additional specialty lines.",
      },
      team: [
        { name: "Alicia Fontaine", role: "founder", title: "CEO", bio: "Former clinic operations director." },
        { name: "Sam Okafor", role: "founder", title: "CTO" },
      ],
      metrics: [
        { metricType: "arr", value: "1240000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "mrr", value: "103000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "revenue_growth_yoy", value: "188", asOf: "2026-06-30" },
        { metricType: "customers", value: "70", asOf: "2026-06-30" },
        { metricType: "employees", value: "19", asOf: "2026-06-30" },
        { metricType: "burn_monthly", value: "160000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "runway_months", value: "17", asOf: "2026-06-30" },
      ],
    },
    {
      name: "Quarry Analytics",
      slug: "quarry-analytics",
      shortDescription:
        "Margin intelligence for construction-materials producers.",
      industry: "Software",
      subindustry: "Industrial Analytics",
      stage: "pre_seed",
      businessModel: "subscription",
      hqCity: "Leeds",
      hqCountry: "United Kingdom",
      foundedYear: 2025,
      website: "https://example.com/quarry-analytics",
      intents: ["seeking_investment"],
      story: {
        problem:
          "Aggregates producers price on spreadsheets and lose margin on every haul-distance miscalculation.",
        solution:
          "Live margin analytics combining plant costs, logistics, and quoted prices in one view for regional producers.",
        market:
          "Thousands of independent quarry operators across the UK and EU with no fit-for-purpose software.",
        traction: "Four paid pilots signed within three months of founding.",
        roadmap: "Quoting automation and ERP integrations.",
      },
      team: [{ name: "Tom Whitfield", role: "founder", title: "CEO" }],
      metrics: [
        { metricType: "customers", value: "4", asOf: "2026-05-31" },
        { metricType: "employees", value: "3", asOf: "2026-05-31" },
      ],
    },
    {
      name: "Harbor Ledger",
      slug: "harbor-ledger",
      shortDescription:
        "Compliance-grade bookkeeping for independent freight forwarders.",
      industry: "Financial Services",
      subindustry: "Vertical Fintech",
      stage: "growth",
      businessModel: "subscription",
      hqCity: "Singapore",
      hqCountry: "Singapore",
      foundedYear: 2018,
      website: "https://example.com/harbor-ledger",
      intents: ["not_raising", "open_to_acquisition_offers"],
      story: {
        problem:
          "Freight forwarders reconcile multi-currency, multi-jurisdiction shipments by hand, and generic accounting tools cannot model consignments.",
        solution:
          "Consignment-native ledger with automated multi-currency reconciliation and port-authority reporting.",
        market:
          "Tens of thousands of independent forwarders across Asia-Pacific trade corridors.",
        competitivePosition:
          "Deep vertical workflows and regulatory reporting that horizontal accounting platforms do not attempt.",
        traction: "Profitable for three consecutive years; 640 forwarder customers.",
        roadmap: "Trade-finance data partnerships and EU corridor expansion.",
      },
      team: [
        { name: "Wei Lin Tan", role: "founder", title: "CEO" },
        { name: "Rachel Ho", role: "team", title: "COO" },
      ],
      metrics: [
        { metricType: "arr", value: "9600000", currency: "USD", asOf: "2026-03-31" },
        { metricType: "revenue_growth_yoy", value: "23", asOf: "2026-03-31" },
        { metricType: "customers", value: "640", asOf: "2026-03-31" },
        { metricType: "employees", value: "72", asOf: "2026-03-31" },
        { metricType: "net_profit_annual", value: "1900000", currency: "USD", asOf: "2026-03-31" },
        { metricType: "gross_margin", value: "78", asOf: "2026-03-31" },
      ],
    },
  ];

  // Archetypes added for valuation-engine testing: pre-revenue, high-growth/
  // high-burn/low-runway, and declining revenue with customer concentration.
  demoCompanies.push(
    {
      name: "Verdant Materials",
      slug: "verdant-materials",
      shortDescription:
        "Bio-based structural insulation panels for commercial construction.",
      industry: "Climate & Energy",
      subindustry: "Sustainable Materials",
      stage: "pre_seed",
      businessModel: "hardware",
      hqCity: "Portland",
      hqCountry: "United States",
      foundedYear: 2025,
      website: "https://example.com/verdant-materials",
      intents: ["seeking_investment"],
      story: {
        problem:
          "Commercial insulation is carbon-intensive, and green alternatives fail fire-rating requirements.",
        solution:
          "Mycelium-derived panels that meet commercial fire codes at cost parity with conventional foam.",
        market: "Commercial construction insulation across North America and the EU.",
        traction: "Two pilot installations underway with regional builders; pre-revenue.",
        roadmap: "Fire certification completion and first production line in 2027.",
      },
      team: [
        { name: "Elena Vasquez", role: "founder", title: "CEO", bio: "Materials engineer, ex-building-products R&D." },
        { name: "Noah Kim", role: "founder", title: "CTO" },
      ],
      metrics: [
        { metricType: "employees", value: "6", asOf: "2026-06-30" },
        { metricType: "capital_raised_total", value: "1800000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "burn_monthly", value: "95000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "runway_months", value: "14", asOf: "2026-06-30" },
      ],
    },
    {
      name: "Helios Grid",
      slug: "helios-grid",
      shortDescription:
        "AI-driven load forecasting for municipal utilities and co-ops.",
      industry: "Artificial Intelligence",
      subindustry: "Energy Software",
      stage: "series_a",
      businessModel: "subscription",
      hqCity: "Denver",
      hqCountry: "United States",
      foundedYear: 2023,
      website: "https://example.com/helios-grid",
      intents: ["seeking_investment", "open_to_strategic_investment"],
      story: {
        problem:
          "Small utilities overbuy peak capacity because their demand forecasts run on decade-old models.",
        solution:
          "Forecasting platform that cuts peak procurement costs with hour-ahead and season-ahead predictions.",
        market: "Thousands of municipal utilities and rural co-ops in the U.S. alone.",
        traction: "ARR tripled in twelve months across 44 utility customers.",
        roadmap: "Wholesale market bidding module; expansion into ERCOT and MISO territories.",
      },
      team: [
        { name: "Grace Okonkwo", role: "founder", title: "CEO" },
        { name: "Pieter Jansen", role: "founder", title: "Chief Scientist" },
      ],
      metrics: [
        { metricType: "arr", value: "2100000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "arr", value: "680000", currency: "USD", asOf: "2025-06-30" },
        { metricType: "revenue_growth_yoy", value: "209", asOf: "2026-06-30" },
        { metricType: "customers", value: "44", asOf: "2026-06-30" },
        { metricType: "employees", value: "31", asOf: "2026-06-30" },
        { metricType: "gross_margin", value: "61", asOf: "2026-06-30" },
        { metricType: "burn_monthly", value: "450000", currency: "USD", asOf: "2026-06-30" },
        { metricType: "runway_months", value: "7", asOf: "2026-06-30" },
        { metricType: "capital_raised_total", value: "11000000", currency: "USD", asOf: "2026-06-30" },
      ],
    },
    {
      name: "Foundry Metrics",
      slug: "foundry-metrics",
      shortDescription:
        "Production analytics for mid-size metal fabrication shops.",
      industry: "Software",
      subindustry: "Manufacturing Analytics",
      stage: "seed",
      businessModel: "subscription",
      hqCity: "Sheffield",
      hqCountry: "United Kingdom",
      foundedYear: 2021,
      website: "https://example.com/foundry-metrics",
      intents: ["open_to_acquisition_offers"],
      story: {
        problem: "Fab shops lose margin to unmeasured machine downtime and rework.",
        solution: "Shop-floor analytics with retrofit sensors and simple dashboards.",
        traction:
          "Revenue declined after losing a large anchor customer; remaining base is stable.",
      },
      team: [{ name: "Callum Price", role: "founder", title: "CEO" }],
      metrics: [
        { metricType: "arr", value: "900000", currency: "GBP", asOf: "2026-05-31" },
        { metricType: "arr", value: "1100000", currency: "GBP", asOf: "2025-05-31" },
        { metricType: "revenue_growth_yoy", value: "-18", asOf: "2026-05-31" },
        { metricType: "top_customer_revenue_pct", value: "55", asOf: "2026-05-31" },
        { metricType: "employees", value: "11", asOf: "2026-05-31" },
      ],
    },
  );

  console.log("Seeding demo companies…");
  for (const demo of demoCompanies) {
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, demo.slug))
      .limit(1);
    if (existing[0]) {
      console.log(`  skip (exists): ${demo.name}`);
      continue;
    }

    const [inserted] = await db
      .insert(companies)
      .values({
        name: demo.name,
        slug: demo.slug,
        website: demo.website,
        shortDescription: demo.shortDescription,
        industry: demo.industry,
        subindustry: demo.subindustry ?? null,
        stage: demo.stage,
        businessModel: demo.businessModel,
        hqCity: demo.hqCity,
        hqCountry: demo.hqCountry,
        foundedYear: demo.foundedYear,
        ...demo.story,
        status: "published",
        submittedAt: now,
        publishedAt: now,
        reviewedBy: adminId,
        isDemo: true,
        createdBy: founderId,
      })
      .returning({ id: companies.id });

    await db
      .insert(companyIntents)
      .values(demo.intents.map((intent) => ({ companyId: inserted.id, intent })));

    await db.insert(companyMembers).values(
      demo.team.map((m, i) => ({
        companyId: inserted.id,
        userId: m.name === "Dana Reyes" ? founderId : null,
        name: m.name,
        role: m.role,
        title: m.title,
        bio: m.bio ?? null,
        displayOrder: i,
      })),
    );

    if (demo.metrics.length > 0) {
      await db.insert(companyMetrics).values(
        demo.metrics.map((m) => ({
          companyId: inserted.id,
          metricType: m.metricType,
          value: m.value,
          currency: m.currency ?? null,
          asOf: m.asOf,
        })),
      );
    }
    console.log(`  company: ${demo.name}`);
  }

  // Demo valuation runs: give each demo company one run through the real
  // engine so the founder and public valuation surfaces are demonstrable.
  console.log("Seeding demo valuation runs…");
  const demoRows = await db.select().from(companies).where(eq(companies.isDemo, true));
  for (const company of demoRows) {
    const [existing] = await db
      .select({ id: valuationRuns.id })
      .from(valuationRuns)
      .where(eq(valuationRuns.companyId, company.id))
      .limit(1);
    if (existing) {
      console.log(`  skip (has run): ${company.name}`);
      continue;
    }

    const metricRows = await db
      .select()
      .from(companyMetrics)
      .where(eq(companyMetrics.companyId, company.id))
      .orderBy(desc(companyMetrics.asOf), desc(companyMetrics.createdAt));

    const inputs = buildValuationInputs(
      company,
      metricRows,
      [],
      new Date().toISOString().slice(0, 10),
    );
    const result = runValuationEngine(inputs);

    const [run] = await db
      .insert(valuationRuns)
      .values({
        companyId: company.id,
        engineVersion: result.engineVersion,
        assumptionsVersion: result.assumptionsVersion,
        status: result.status === "completed" ? "completed" : "insufficient_data",
        dataSufficiency: result.dataSufficiency,
        currency: result.status === "completed" ? result.currency : "USD",
        valuationLow: result.status === "completed" ? String(result.low) : null,
        valuationHigh: result.status === "completed" ? String(result.high) : null,
        valuationMid: result.status === "completed" ? String(result.mid) : null,
        confidence: result.status === "completed" ? result.confidence : null,
        inputSnapshot: inputs,
        riskFlags: result.status === "completed" ? result.riskFlags : null,
        insufficiencyReasons:
          result.status === "insufficient_data"
            ? { reasons: result.reasons, hints: result.improvementHints }
            : { hints: result.improvementHints },
        requestedBy: null,
      })
      .returning({ id: valuationRuns.id });

    await db.insert(valuationComponents).values(
      result.components.map((c) => ({
        runId: run.id,
        componentKey: c.key,
        status: c.status,
        valuationLow: c.low !== undefined && Number.isFinite(c.low) ? String(Math.round(c.low)) : null,
        valuationHigh:
          c.high !== undefined && Number.isFinite(c.high) ? String(Math.round(c.high)) : null,
        valuationMid: c.mid !== undefined && Number.isFinite(c.mid) ? String(Math.round(c.mid)) : null,
        weight: String(c.weight),
        detail: c.detail,
      })),
    );
    console.log(`  valuation: ${company.name} (${result.status})`);
  }

  await client.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
