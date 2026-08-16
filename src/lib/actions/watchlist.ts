"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { features } from "@/config/features";
import {
  removeCompanyFromWatchlist,
  saveCompanyToWatchlist,
} from "@/db/queries/watchlists";
import { recordAudit } from "@/lib/audit";
import { ForbiddenError, UnauthorizedError, requireUser } from "@/lib/authz";

export type WatchActionState = {
  ok?: boolean;
  /** Saved-state after the mutation, so buttons can settle on the truth. */
  saved?: boolean;
  error?: string;
};

const inputSchema = z.object({
  companyId: z.uuid(),
  op: z.enum(["save", "remove"]),
});

/**
 * Save/remove a company on the signed-in user's watchlist. The user is
 * derived from the session server-side; companyId is client-supplied but can
 * only ever affect the caller's own watchlist rows, and only published
 * companies are saveable (enforced in the query layer).
 */
export async function setWatchlistState(
  _prev: WatchActionState,
  formData: FormData,
): Promise<WatchActionState> {
  if (!features.watchlistsEnabled) return { error: "Watchlists are not available." };

  const parsed = inputSchema.safeParse({
    companyId: formData.get("companyId"),
    op: formData.get("op"),
  });
  if (!parsed.success) return { error: "Invalid request." };
  const { companyId, op } = parsed.data;

  let saved: boolean;
  try {
    const user = await requireUser();

    if (op === "save") {
      const result = await saveCompanyToWatchlist(user.id, companyId);
      if (!result.saved) return { error: "This company is not available to save." };
      saved = true;
      await recordAudit({
        actorUserId: user.id,
        action: "watchlist.saved",
        entityType: "company",
        entityId: companyId,
      });
      revalidatePath(`/companies/${result.slug}`);
    } else {
      const removed = await removeCompanyFromWatchlist(user.id, companyId);
      saved = false;
      if (removed) {
        await recordAudit({
          actorUserId: user.id,
          action: "watchlist.removed",
          entityType: "company",
          entityId: companyId,
        });
      }
      // The slug is unknown on removal; refresh all profile pages so a stale
      // "Saved" button never survives navigation back to the profile.
      revalidatePath("/companies/[slug]", "page");
    }
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { error: "Sign in to save companies." };
    }
    console.error("[watchlist] mutation failed", err);
    return { error: "Could not update your watchlist. Please try again." };
  }

  revalidatePath("/companies");
  revalidatePath("/watchlist");
  return { ok: true, saved };
}
