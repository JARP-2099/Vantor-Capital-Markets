import type { ValuationComponentRow, ValuationRunRow } from "@/db/queries/valuations";

/**
 * Public profile valuation section. Placeholder — implemented by the
 * valuation UI workstream. Returns null until a completed run exists and
 * the company allows public display (both enforced by the caller).
 */
export function ValuationSection(_props: {
  run: ValuationRunRow;
  components: ValuationComponentRow[];
  history: ValuationRunRow[];
}) {
  return null;
}
