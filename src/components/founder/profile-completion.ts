import type { CompanyRow } from "@/db/queries/companies";

/**
 * Pure profile-completion scoring shared by the dashboard cards and the
 * company overview checklist. Weights favor the required sections (identity,
 * goals) but reward optional depth (story, metrics, team).
 */

export const STORY_SECTION_COUNT = 8;

const STORY_FIELDS = [
  "problem",
  "solution",
  "market",
  "competitivePosition",
  "businessModelDescription",
  "traction",
  "roadmap",
  "fullDescription",
] as const;

export type CompletionInput = {
  company: CompanyRow;
  intentsCount: number;
  metricsCount: number;
  teamCount: number;
};

export type ChecklistItem = {
  key: "identity" | "goals" | "metrics" | "story" | "team";
  label: string;
  done: boolean;
  detail: string;
};

export type ProfileCompletion = {
  percent: number;
  items: ChecklistItem[];
  identityComplete: boolean;
  storyFilled: number;
};

export function storyFilledCount(company: CompanyRow): number {
  return STORY_FIELDS.filter((f) => {
    const v = company[f];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
}

/** Required identity fields present (submission gate mirrors this via zod). */
export function isIdentityComplete(company: CompanyRow): boolean {
  return Boolean(
    company.name.trim().length >= 2 &&
      company.industry &&
      company.stage &&
      company.businessModel &&
      company.shortDescription &&
      company.shortDescription.trim().length >= 10,
  );
}

export function computeCompletion(input: CompletionInput): ProfileCompletion {
  const { company, intentsCount, metricsCount, teamCount } = input;
  const identityComplete = isIdentityComplete(company);
  const storyFilled = storyFilledCount(company);

  const percent = Math.round(
    (identityComplete ? 30 : 0) +
      (intentsCount > 0 ? 20 : 0) +
      (storyFilled / STORY_SECTION_COUNT) * 25 +
      (metricsCount > 0 ? 15 : 0) +
      (teamCount > 0 ? 10 : 0),
  );

  const items: ChecklistItem[] = [
    {
      key: "identity",
      label: "Company identity",
      done: identityComplete,
      detail: identityComplete
        ? "Name, industry, stage, and description are set"
        : "Required before submitting for review",
    },
    {
      key: "goals",
      label: "Goals",
      done: intentsCount > 0,
      detail:
        intentsCount > 0
          ? `${intentsCount} ${intentsCount === 1 ? "signal" : "signals"} selected`
          : "Select at least one before submitting",
    },
    {
      key: "metrics",
      label: "Metrics",
      done: metricsCount > 0,
      detail:
        metricsCount > 0
          ? `${metricsCount} ${metricsCount === 1 ? "entry" : "entries"} reported`
          : "Optional — pre-revenue companies can skip this",
    },
    {
      key: "story",
      label: "Story",
      done: storyFilled === STORY_SECTION_COUNT,
      detail: `${storyFilled} of ${STORY_SECTION_COUNT} sections written`,
    },
    {
      key: "team",
      label: "Team",
      done: teamCount > 0,
      detail:
        teamCount > 0
          ? `${teamCount} ${teamCount === 1 ? "member" : "members"} listed`
          : "Add your team",
    },
  ];

  return { percent: Math.min(100, percent), items, identityComplete, storyFilled };
}
