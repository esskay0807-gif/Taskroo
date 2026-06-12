import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

// In no-auth dev mode, skip Clerk entirely (it would error without valid keys).
export default AUTH_DISABLED ? () => NextResponse.next() : clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|woff2?|ttf)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
