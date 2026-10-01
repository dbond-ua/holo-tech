"use client";

import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/types";
import { RatingStars } from "@/components/ui/RatingStars";
import { useI18n } from "@/i18n/I18nProvider";
import { localeTags } from "@/i18n/config";

export function ReviewsSection({
  rating,
  reviewsCount,
  reviews,
}: {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}) {
  const { locale, dict } = useI18n();

  return (
    <div>
      <div className="mb-8 flex flex-col items-start gap-4 rounded-xl2 border border-line p-6 sm:flex-row sm:items-center sm:justify-between dark:border-line-dark">
        <div>
          <p className="text-4xl font-semibold tracking-tight">{rating.toFixed(1)}</p>
          <RatingStars rating={rating} size={16} className="mt-2" />
          <p className="mt-2 text-sm text-muted dark:text-muted-dark">{dict.product.reviewsBasedOn(reviewsCount)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-line pb-6 last:border-0 dark:border-line-dark">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.author}</span>
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-volt-600 dark:text-volt">
                    <BadgeCheck className="h-3.5 w-3.5" /> {dict.product.verifiedPurchase}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted dark:text-muted-dark">
                {new Date(r.date).toLocaleDateString(localeTags[locale], { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <RatingStars rating={r.rating} size={13} className="mt-2" />
            <p className="mt-2 text-sm text-muted dark:text-muted-dark">{r.text}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted dark:text-muted-dark">{dict.product.noReviews}</p>
        )}
      </div>
    </div>
  );
}
