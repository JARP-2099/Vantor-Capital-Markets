import { Badge } from "@/components/ui/badge";
import type { CompanyIntent } from "@/lib/constants";
import { publicIntentBadges } from "./metrics";

/**
 * Row of publicly surfaceable intent badges for a company. Renders nothing
 * when the company holds no publicly badged intent.
 */
export function IntentBadges({ intents }: { intents: readonly CompanyIntent[] }) {
  const badges = publicIntentBadges(intents);
  if (badges.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {badges.map(({ intent, label }) => (
        <li key={intent}>
          <Badge tone={intent === "not_raising" ? "neutral" : "accent"}>{label}</Badge>
        </li>
      ))}
    </ul>
  );
}
