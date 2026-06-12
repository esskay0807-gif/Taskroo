import Link from "next/link";

import type { Review } from "@/lib/api";
import { Stars } from "@/components/star-rating";

const ROLE_LABEL: Record<Review["role"], string> = {
  of_tasker: "as a tasker",
  of_poster: "as a poster",
};

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/profile/${review.reviewer.id}`}
              className="text-sm font-medium hover:underline"
            >
              {review.reviewer.name ?? "A user"}
            </Link>
            <Stars value={review.rating} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ROLE_LABEL[review.role]}
          </p>
          {review.comment && (
            <p className="mt-2 text-sm">{review.comment}</p>
          )}
          {review.photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {review.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Review photo"
                  className="h-20 w-20 rounded border object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
