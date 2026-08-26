/**
 * Validates an optional ?next= return path (sign-in-to-save flows) on the
 * server: only same-site absolute paths pass — external URLs,
 * protocol-relative "//host", backslash tricks, and garbage all fall back
 * to undefined so callers use their default landing page.
 */
export function safeNextPath(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return undefined;
  }
  return raw;
}
