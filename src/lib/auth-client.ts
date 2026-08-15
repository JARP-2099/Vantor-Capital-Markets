"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. Uses same-origin /api/auth by default; no secrets
 * are ever available to this module.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
