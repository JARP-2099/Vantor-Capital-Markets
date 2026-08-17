import type { DiscoverySignal } from "@/lib/discovery/signals";

const DEMO_EXPLANATION =
  "Fictional demonstration company created by Vantor for testing. Not a real business.";

/**
 * Marks seeded fictional companies wherever they are publicly rendered so
 * demo content can never be mistaken for a real listing.
 */
export function DemoChip() {
  return (
    <span
      title={DEMO_EXPLANATION}
      className="inline-flex items-center whitespace-nowrap rounded-full border border-warn-700/40 bg-warn-50 px-1.5 py-px text-[10px] font-medium text-warn-700"
    >
      Demo
      <span className="sr-only">. {DEMO_EXPLANATION}</span>
    </span>
  );
}

/**
 * Factual discovery-signal chips ("New to Vantor", "Recently updated",
 * "Highly verified"). Quiet by design: these are context, not endorsements.
 * Each chip carries its plain-English explanation for pointer users (title)
 * and screen readers (visually hidden text).
 */
export function SignalChips({ signals }: { signals: DiscoverySignal[] }) {
  if (signals.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {signals.map((signal) => (
        <span
          key={signal.key}
          title={signal.explanation}
          className="inline-flex items-center whitespace-nowrap rounded-full border border-line px-1.5 py-px text-[10px] font-medium text-muted"
        >
          {signal.label}
          <span className="sr-only">. {signal.explanation}</span>
        </span>
      ))}
    </span>
  );
}
