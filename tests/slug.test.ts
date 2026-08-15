import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, withSlugSuffix } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("AeroForge Dynamics")).toBe("aeroforge-dynamics");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  Meridian -- Health,  AI!  ")).toBe("meridian-health-ai");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Über")).toBe("cafe-uber");
  });

  it("produces valid slugs from awkward input", () => {
    for (const input of ["---", "A", "🚀🚀", "a".repeat(300), "Ends with-"]) {
      const slug = slugify(input);
      if (slug.length > 0) expect(isValidSlug(slug)).toBe(true);
    }
  });
});

describe("isValidSlug", () => {
  it("accepts canonical slugs", () => {
    expect(isValidSlug("atlas-robotics")).toBe(true);
    expect(isValidSlug("a1")).toBe(true);
  });

  it("rejects malformed slugs", () => {
    for (const bad of ["", "-lead", "trail-", "UPPER", "a--b", "with space", "sneaky/../path"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});

describe("withSlugSuffix", () => {
  it("keeps the result a valid slug", () => {
    expect(isValidSlug(withSlugSuffix("atlas-robotics"))).toBe(true);
  });
});
