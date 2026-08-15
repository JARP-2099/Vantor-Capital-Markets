import "server-only";
import { notFound, redirect } from "next/navigation";
import {
  type AuthedUser,
  ForbiddenError,
  requireAdmin,
  UnauthorizedError,
} from "@/lib/authz";

/**
 * Page-level admin gate. Every admin PAGE calls this itself — the layout's
 * identical check is defense in depth, not a security boundary (layouts and
 * pages render concurrently). Signed-out users are sent to login; signed-in
 * non-admins get a 404 so /admin's existence is never confirmed to them.
 */
export async function requireAdminPage(): Promise<AuthedUser> {
  try {
    return await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login");
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }
}
