"use server";

import { z } from "zod";
import { createFeedback } from "@/db/queries/feedback";
import { ForbiddenError, UnauthorizedError, requireUser } from "@/lib/authz";

export type FeedbackFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const feedbackSchema = z.object({
  role: z.enum(["founder", "investor", "other"], {
    error: "Tell us how you use Vantor",
  }),
  pagePath: z
    .string()
    .trim()
    .max(200, "Keep the page reference under 200 characters")
    .transform((v) => (v === "" ? null : v)),
  message: z
    .string()
    .trim()
    .min(10, "Write at least a sentence so we can act on it")
    .max(2000, "Keep feedback under 2,000 characters"),
});

/** Signed-in users only: beta testers all have accounts, and requiring a
 * session keeps the box from becoming an anonymous spam target. */
export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { status: "error", message: "Sign in to send feedback." };
    }
    throw err;
  }

  const parsed = feedbackSchema.safeParse({
    role: formData.get("role"),
    pagePath: String(formData.get("pagePath") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    const result = await createFeedback(userId, parsed.data);
    if (result === "limit_reached") {
      return {
        status: "error",
        message: "You have sent a lot of feedback today. Please try again tomorrow.",
      };
    }
  } catch (err) {
    console.error("[feedback] insert failed", err);
    return { status: "error", message: "Could not send feedback. Please try again." };
  }

  return { status: "success", message: "Thank you. Your feedback was recorded." };
}
