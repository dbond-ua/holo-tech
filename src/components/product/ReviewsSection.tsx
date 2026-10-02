"use client";

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

  if (reviews.length === 0) {
    return <p className="text-fg-2">{dict.product.noReviews}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-9">
      <div className="lg:col-span-3">
        <p className="num text-[56px] font-semibold leading-none tracking-[-0.03em]">{rating.toFixed(1)}</p>
        <RatingStars rating={rating} size={16} className="mt-3" />
        <p className="mt-2 text-sm text-fg-2">{dict.product.reviewsBasedOn(reviewsCount)}</p>
      </div>

      <ul className="border-t border-rule lg:col-span-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-rule py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {r.author}
                {r.verified && <span className="caption ml-3 text-ok">{dict.product.verifiedPurchase}</span>}
              </p>
              <span className="spec text-fg-3">
                {new Date(r.date).toLocaleDateString(localeTags[locale], {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <RatingStars rating={r.rating} size={13} className="mt-2" />
            <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
