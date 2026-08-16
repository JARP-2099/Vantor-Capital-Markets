import { describe, expect, it } from "vitest";
import { buildTrustedOrigins } from "@/lib/auth-origins";

describe("buildTrustedOrigins", () => {
  it("production on Vercel: canonical + deployment + branch hosts, deduped", () => {
    const origins = buildTrustedOrigins({
      betterAuthUrl: "https://vantor-capital-markets.vercel.app",
      vercelUrl: "vantor-capital-markets-abc123xyz-jarpholdingsllc.vercel.app",
      vercelBranchUrl:
        "vantor-capital-markets-git-claude-vantor-jarpholdingsllc.vercel.app",
      vercelProjectProductionUrl: "vantor-capital-markets.vercel.app",
    });
    expect(origins).toEqual([
      "https://vantor-capital-markets.vercel.app",
      "https://vantor-capital-markets-abc123xyz-jarpholdingsllc.vercel.app",
      "https://vantor-capital-markets-git-claude-vantor-jarpholdingsllc.vercel.app",
    ]);
  });

  it("local development: only the localhost origin", () => {
    expect(buildTrustedOrigins({ betterAuthUrl: "http://localhost:3000" })).toEqual([
      "http://localhost:3000",
    ]);
  });

  it("ignores empty and malformed values without crashing", () => {
    const origins = buildTrustedOrigins({
      betterAuthUrl: "https://vantor-capital-markets.vercel.app",
      vercelUrl: "",
      vercelBranchUrl: "   ",
      vercelProjectProductionUrl: "http://",
    });
    expect(origins).toEqual(["https://vantor-capital-markets.vercel.app"]);
  });

  it("normalizes to origins (strips paths) and rejects non-http protocols", () => {
    const origins = buildTrustedOrigins({
      betterAuthUrl: "https://vantor-capital-markets.vercel.app/some/path",
      vercelUrl: "javascript:alert(1)",
    });
    expect(origins).toEqual(["https://vantor-capital-markets.vercel.app"]);
  });

  it("never emits wildcard patterns", () => {
    const origins = buildTrustedOrigins({
      betterAuthUrl: "https://vantor-capital-markets.vercel.app",
      vercelUrl: "deploy-1.vercel.app",
      vercelBranchUrl: "branch-1.vercel.app",
      vercelProjectProductionUrl: "vantor-capital-markets.vercel.app",
    });
    for (const o of origins) {
      expect(o).not.toContain("*");
      expect(o).toMatch(/^https?:\/\/[^/]+$/);
    }
  });

  it("is deterministic for identical inputs", () => {
    const input = {
      betterAuthUrl: "https://vantor-capital-markets.vercel.app",
      vercelUrl: "d.vercel.app",
    };
    expect(buildTrustedOrigins(input)).toEqual(buildTrustedOrigins(input));
  });
});
