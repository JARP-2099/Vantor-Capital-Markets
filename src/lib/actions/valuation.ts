"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  ForbiddenError,
  UnauthorizedError,
  isAdmin,
  requireAdmin,
  requireCompanyManager,
} from "@/lib/authz";
import { executeValuationRun, ValuationCooldownError } from "@/lib/valuation/service";

export type ValuationActionState = {
  ok?: boolean;
  error?: string;
};

const companyIdSchema = z.uuid();

/**
 * Founder/admin: generate a fresh Vantor estimate for a company they manage.
 * companyId is server-bound by callers; authorization is re-derived here
 * regardless — an arbitrary companyId cannot manipulate another company.
 */
export async function requestValuation(
  companyId: string,
  _prev: ValuationActionState,
  _formData: FormData,
): Promise<ValuationActionState> {
  const parsed = companyIdSchema.safeParse(companyId);
  if (!parsed.success) return { error: "Invalid request." };

  try {
    const { user } = await requireCompanyManager(parsed.data);
    const admin = await isAdmin(user);
    await executeValuationRun({
      companyId: parsed.data,
      requestedBy: user.id,
      bypassCooldown: admin,
    });
  } catch (err) {
    if (err instanceof ValuationCooldownError) {
      const minutes = Math.max(1, Math.ceil(err.retryAfterMs / 60000));
      return { error: `An estimate was generated recently. Try again in about ${minutes} min.` };
    }
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { error: "You do not have access to this company." };
    }
    console.error("[valuation] run failed", err);
    return { error: "The estimate could not be generated. Please try again." };
  }

  revalidatePath(`/founder/companies/${parsed.data}/valuation`);
  return { ok: true };
}

/** Founder: toggle whether the estimate appears on the public profile. */
export async function setValuationVisibility(
  companyId: string,
  _prev: ValuationActionState,
  formData: FormData,
): Promise<ValuationActionState> {
  const parsed = companyIdSchema.safeParse(companyId);
  if (!parsed.success) return { error: "Invalid request." };
  const show = formData.get("show") === "true";

  try {
    const { user, company } = await requireCompanyManager(parsed.data);
    await db
      .update(companies)
      .set({ showPublicValuation: show, updatedAt: new Date() })
      .where(eq(companies.id, company.id));
    await recordAudit({
      actorUserId: user.id,
      action: "valuation.visibility_changed",
      entityType: "company",
      entityId: company.id,
      metadata: { showPublicValuation: show },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { error: "You do not have access to this company." };
    }
    console.error("[valuation] visibility change failed", err);
    return { error: "Could not update visibility. Please try again." };
  }

  revalidatePath(`/founder/companies/${parsed.data}/valuation`);
  return { ok: true };
}

/** Admin: run a valuation for any company (bypasses cooldown). */
export async function adminRequestValuation(
  _prev: ValuationActionState,
  formData: FormData,
): Promise<ValuationActionState> {
  const parsed = companyIdSchema.safeParse(formData.get("companyId"));
  if (!parsed.success) return { error: "Invalid request." };
  try {
    const admin = await requireAdmin();
    await executeValuationRun({
      companyId: parsed.data,
      requestedBy: admin.id,
      bypassCooldown: true,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { error: "Admin access required." };
    }
    console.error("[valuation] admin run failed", err);
    return { error: "The estimate could not be generated." };
  }
  revalidatePath(`/admin/companies/${parsed.data}`);
  return { ok: true };
}
