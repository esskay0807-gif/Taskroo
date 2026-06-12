"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

export function MeCard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => getMe(await getToken()),
  });

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to load your profile from <code>/v1/me</code>.
      </p>
    );
  }

  if (isLoading) return <p className="text-sm">Loading your profile…</p>;

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Failed to load /v1/me: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="rounded-lg border p-4 text-left text-sm">
      <p className="mb-2 font-medium">GET /v1/me</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
