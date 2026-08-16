import { describe, expect, it } from "vitest";
import {
  computeDiscoverySignals,
  isHighlyVerified,
  isNewToVantor,
  isRecentlyUpdated,
} from "@/lib/discovery/signals";

const NOW = new Date("2026-08-15T12:00:00Z");

function daysBefore(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe("discovery signals", () => {
  it("new to Vantor: within 30 days of publication only", () => {
    expect(isNewToVantor(daysBefore(1), NOW)).toBe(true);
    expect(isNewToVantor(daysBefore(29), NOW)).toBe(true);
    expect(isNewToVantor(daysBefore(31), NOW)).toBe(false);
    expect(isNewToVantor(null, NOW)).toBe(false);
    // A publication date in the future is invalid data, not a signal.
    expect(isNewToVantor(daysBefore(-2), NOW)).toBe(false);
  });

  it("recently updated: requires a meaningful post-publication edit", () => {
    const publishedAt = daysBefore(60);
    expect(isRecentlyUpdated(publishedAt, daysBefore(3), NOW)).toBe(true);
    expect(isRecentlyUpdated(publishedAt, daysBefore(15), NOW)).toBe(false);
    // updated_at equal to publication (the publish itself) does not count.
    expect(isRecentlyUpdated(daysBefore(5), daysBefore(5), NOW)).toBe(false);
    expect(isRecentlyUpdated(null, daysBefore(1), NOW)).toBe(false);
    expect(isRecentlyUpdated(publishedAt, null, NOW)).toBe(false);
  });

  it("highly verified: needs both a high percentage and enough categories", () => {
    expect(isHighlyVerified(80, 3)).toBe(true);
    expect(isHighlyVerified(100, 5)).toBe(true);
    expect(isHighlyVerified(79, 5)).toBe(false);
    // 100% of a single category is not "highly verified".
    expect(isHighlyVerified(100, 1)).toBe(false);
    expect(isHighlyVerified(null, 0)).toBe(false);
  });

  it("composes signals with 'new' suppressing 'recently updated'", () => {
    const newAndEdited = computeDiscoverySignals({
      publishedAt: daysBefore(10),
      updatedAt: daysBefore(1),
      verifiedPct: 90,
      submittedCategories: 4,
      now: NOW,
    });
    expect(newAndEdited.map((s) => s.key)).toEqual(["highly_verified", "new_to_vantor"]);

    const establishedAndEdited = computeDiscoverySignals({
      publishedAt: daysBefore(90),
      updatedAt: daysBefore(2),
      verifiedPct: null,
      submittedCategories: 0,
      now: NOW,
    });
    expect(establishedAndEdited.map((s) => s.key)).toEqual(["recently_updated"]);

    const quiet = computeDiscoverySignals({
      publishedAt: daysBefore(90),
      updatedAt: daysBefore(90),
      verifiedPct: 50,
      submittedCategories: 2,
      now: NOW,
    });
    expect(quiet).toEqual([]);
  });

  it("every signal carries a user-facing explanation", () => {
    const signals = computeDiscoverySignals({
      publishedAt: daysBefore(5),
      updatedAt: daysBefore(1),
      verifiedPct: 100,
      submittedCategories: 8,
      now: NOW,
    });
    for (const signal of signals) {
      expect(signal.label.length).toBeGreaterThan(0);
      expect(signal.explanation.length).toBeGreaterThan(20);
    }
  });
});
