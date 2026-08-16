import { twMerge } from "tailwind-merge";

/**
 * className combiner with Tailwind conflict resolution: later classes win
 * over earlier ones (`cn("text-white", "text-ink-900")` → "text-ink-900"),
 * so variant overrides behave predictably instead of depending on
 * stylesheet order.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
