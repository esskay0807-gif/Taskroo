"use client";

/**
 * Auth indirection.
 *
 * When NEXT_PUBLIC_AUTH_DISABLED=true the app runs in a no-auth dev mode: Clerk is never
 * mounted and these exports become local shims that report a single signed-in "dev" user with
 * no token. Paired with the API's DEV_AUTH_BYPASS=true, every request is treated as one dev
 * user, so the whole app is usable without Clerk keys.
 *
 * Otherwise these are the real Clerk components/hooks (requires Clerk keys).
 */

import type { ReactNode } from "react";

import {
  ClerkProvider as RealClerkProvider,
  SignedIn as RealSignedIn,
  SignedOut as RealSignedOut,
  SignInButton as RealSignInButton,
  SignUpButton as RealSignUpButton,
  UserButton as RealUserButton,
  useAuth as realUseAuth,
} from "@clerk/nextjs";

export const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

// --- Shims (no-auth dev mode) ---

function PassThrough({ children }: { children?: ReactNode }) {
  return <>{children ?? null}</>;
}

function RenderNothing() {
  return null;
}

function DevUserButton() {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      dev
    </span>
  );
}

type AuthLike = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null;
  getToken: (...args: unknown[]) => Promise<string | null>;
};

function devUseAuth(): AuthLike {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: "dev_user",
    getToken: async () => null,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const AuthProvider: (props: { children: ReactNode }) => any = AUTH_DISABLED
  ? PassThrough
  : (RealClerkProvider as any);
export const SignedIn = AUTH_DISABLED ? PassThrough : RealSignedIn;
export const SignedOut = AUTH_DISABLED ? RenderNothing : RealSignedOut;
export const SignInButton = AUTH_DISABLED ? PassThrough : RealSignInButton;
export const SignUpButton = AUTH_DISABLED ? PassThrough : RealSignUpButton;
export const UserButton = AUTH_DISABLED ? DevUserButton : RealUserButton;
export const useAuth: () => AuthLike = AUTH_DISABLED
  ? devUseAuth
  : (realUseAuth as any);
