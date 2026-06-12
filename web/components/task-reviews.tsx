"use client";

import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createReview,
  getMe,
  getTaskReviews,
  uploadFile,
  type TaskStatus,
} from "@/lib/api";
import { ReviewList } from "@/components/review-list";
import { StarSelect } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TaskReviews({
  taskId,
  posterId,
  assignedTaskerId,
  status,
}: {
  taskId: string;
  posterId: string;
  assignedTaskerId: string | null;
  status: TaskStatus;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data: reviews } = useQuery({
    queryKey: ["task-reviews", taskId],
    queryFn: () => getTaskReviews(taskId),
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => getMe(await getToken()),
  });

  const isParticipant =
    me && (me.id === posterId || me.id === assignedTaskerId);
  const alreadyReviewed =
    me && reviews?.some((r) => r.reviewer.id === me.id);
  const canReview =
    status === "completed" && isParticipant && !alreadyReviewed;

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <ReviewList reviews={reviews ?? []} />
      {canReview && <ReviewForm taskId={taskId} />}
    </section>
  );
}

function ReviewForm({ taskId }: { taskId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      createReview(await getToken(), taskId, {
        rating,
        comment: comment.trim() || null,
        photo_urls: photoUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-reviews", taskId] });
    },
  });

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const token = await getToken();
      const urls = await Promise.all(
        files.map((f) => uploadFile(token, f, "review")),
      );
      setPhotoUrls((prev) => [...prev, ...urls].slice(0, 10));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="font-medium">Leave a review</p>
      <div className="space-y-2">
        <Label>Rating</Label>
        <StarSelect value={rating} onChange={setRating} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How did it go?"
        />
      </div>
      <div className="space-y-2">
        <Label>Photos (optional)</Label>
        <label className="inline-block">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotos}
            disabled={uploading || photoUrls.length >= 10}
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <span>{uploading ? "Uploading…" : "Add photos"}</span>
          </Button>
        </label>
        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Review photo"
                className="h-16 w-16 rounded border object-cover"
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting…" : "Submit review"}
        </Button>
        {mutation.isError && (
          <span className="text-sm text-red-600">
            {(mutation.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}
