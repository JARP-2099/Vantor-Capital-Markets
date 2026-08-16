import { Reveal } from "@/components/ui/reveal";

/**
 * Discovery preview — makes Vantor read as a populated marketplace within
 * the first screens. Fictional companies, clearly labeled illustrative.
 */

const rows = [
  { name: "AeroForge", sector: "Defense Technology", stage: "Seed", revenue: "$580K", growth: "+74%", verified: "82%" },
  { name: "LoomWeave Systems", sector: "Industrial Software", stage: "Series A", revenue: "$2.4M", growth: "+41%", verified: "76%" },
  { name: "Caldera Biothermal", sector: "Climate Energy", stage: "Seed", revenue: "$310K", growth: "+112%", verified: "64%" },
  { name: "Atlas Robotics", sector: "Robotics", stage: "Series A", revenue: "$4.1M", growth: "+58%", verified: "88%" },
  { name: "Northbeam Logistics AI", sector: "Supply Chain", stage: "Series B", revenue: "$8.1M", growth: "+38%", verified: "91%" },
  { name: "Quarry Analytics", sector: "Construction Software", stage: "Pre-Seed", revenue: "—", growth: "—", verified: "45%" },
] as const;

export function DiscoveryPreview() {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-night-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
          <p className="text-sm font-semibold text-white">
            Private companies on Vantor
          </p>
          <p className="text-[11px] text-white/40">Illustrative — fictional companies</p>
        </div>
        <div aria-hidden="true" className="grid sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <div
              key={r.name}
              className="reveal-child border-b border-white/5 px-5 py-4 sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-white">{r.name}</p>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-white/60">
                  <span className="size-1.5 rounded-full bg-positive-400" />
                  {r.verified}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/45">
                {r.sector} · {r.stage}
              </p>
              <div className="mt-3 flex items-baseline gap-5 tabular-nums">
                <span className="text-sm font-bold text-white">{r.revenue}</span>
                <span
                  className={
                    r.growth === "—"
                      ? "text-sm font-semibold text-white/35"
                      : "text-sm font-bold text-positive-400"
                  }
                >
                  {r.growth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
