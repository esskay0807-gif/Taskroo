"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { uploadAvatar } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AvatarUploader({
  value,
  onUploaded,
}: {
  value: string | null;
  onUploaded: (publicUrl: string) => void;
}) {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadAvatar(await getToken(), file);
      onUploaded(publicUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value || "https://placehold.co/64x64?text=?"}
        alt="Avatar"
        className="h-16 w-16 rounded-full border object-cover"
      />
      <div className="space-y-1">
        <label className="inline-block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <span>{uploading ? "Uploading…" : "Upload avatar"}</span>
          </Button>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
