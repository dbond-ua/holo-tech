import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ChevronRight, Truck, ShieldCheck, CreditCard } from "lucide-react";
import type { BaseProduct } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { buildSpecs } from "@/lib/specs";
import { Container } from "@/components/ui/Container";
import { Gallery } from "@/components/product/Gallery";
import { RatingStars } from "@/components/ui/RatingStars";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import { ProductActions } from "@/components/product/ProductActions";
import { SpecsTable } from "@/components/product/SpecsTable";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Tabs } from "@/components/ui/Tabs";

export function ProductDetailView({
  product,
  related,
  locale,
}: {
  product: BaseProduct;
  related: BaseProduct[];
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const category = { slug: product.category, ...dict.categories[product.category] };
  const name = product.name[locale];
  const tagline = product.tagline[locale];
  const description = product.description[locale];
  const whatsIncluded = product.whatsIncluded[locale];
  const features = product.features[locale];
  const specs = buildSpecs(product, dict, locale);

  const badges: string[] = [];
  if (product.isNew) badges.push(dict.common.new);
  if (product.isBestseller) badges.push(dict.common.bestseller);
  if (product.oldPrice) badges.push(dict.common.sale);
  if (product.isDemo) badges.push(dict.common.demo);
  if (product.expandable) badges.push(dict.product.expandableBadge);
  if (product.highVoltage) badges.push(dict.product.highVoltageBadge);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    brand: { "@type": "Brand", name: product.brand },
    description,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewsCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.header.home, item: "/" },
      { "@type": "ListItem", position: 2, name: category.title, item: `/${category.slug}` },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Container className="py-6 sm:py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
            {dict.header.home}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/${category.slug}`} className="transition-colors hover:text-ink dark:hover:text-ink-dark">
            {category.title}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-ink dark:text-ink-dark">{name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <Gallery
            category={product.category}
            productId={product.id}
            count={product.images}
            imageUrls={product.imageUrls}
            alt={name}
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((b) => (
                <Badge key={b} tone={b === dict.common.demo ? "outline" : "accent"}>
                  {b}
                </Badge>
              ))}
            </div>

            <p className="mt-4 text-sm font-medium uppercase tracking-wide text-muted dark:text-muted-dark">
              {product.brand}
            </p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {name}
            </h1>
            <p className="mt-2 text-muted dark:text-muted-dark">{tagline}</p>

            <div className="mt-4">
              <RatingStars rating={product.rating} count={product.reviewsCount} showValue size={16} />
            </div>

            <div className="mt-6">
              <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
              <p className={product.inStock ? "mt-2 text-sm text-volt-600 dark:text-volt" : "mt-2 text-sm text-ember"}>
                {product.inStock
                  ? product.stockCount
                    ? dict.common.inStockCount(product.stockCount)
                    : dict.common.inStock
                  : dict.common.onOrder}
              </p>
            </div>

            <div className="mt-6">
              <ProductActions
                id={product.id}
                slug={product.slug}
                category={product.category}
                name={product.name}
                brand={product.brand}
                price={product.price}
                inStock={product.inStock}
                stockCount={product.stockCount}
                stockReserved={product.stockReserved}
              />
            </div>

            {features.length > 0 && (
              <ul className="mt-8 flex flex-col gap-2.5 border-t border-line pt-6 dark:border-line-dark">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink dark:bg-ink-dark" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-line pt-6 text-xs dark:border-line-dark">
              <div className="flex flex-col items-center gap-2 text-center">
                <Truck className="h-5 w-5" strokeWidth={1.6} />
                {dict.product.deliveryBadge}
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
                {dict.product.warrantyBadge}
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <CreditCard className="h-5 w-5" strokeWidth={1.6} />
                {dict.product.paymentBadge}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Tabs
            items={[
              { key: "specs", label: dict.product.tabSpecs, content: <SpecsTable specs={specs} /> },
              {
                key: "description",
                label: dict.product.tabDescription,
                content: <p className="max-w-3xl text-muted dark:text-muted-dark">{description}</p>,
              },
              {
                key: "included",
                label: dict.product.tabIncluded,
                content: (
                  <ul className="flex max-w-xl flex-col gap-2.5">
                    {whatsIncluded.map((i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted dark:text-muted-dark">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink dark:bg-ink-dark" />
                        {i}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                key: "reviews",
                label: dict.product.tabReviews(product.reviewsCount),
                content: (
                  <ReviewsSection
                    rating={product.rating}
                    reviewsCount={product.reviewsCount}
                    reviews={product.reviews}
                  />
                ),
              },
              {
                key: "delivery",
                label: dict.product.tabDelivery,
                content: (
                  <div className="max-w-2xl text-sm text-muted dark:text-muted-dark">
                    <p>{dict.product.deliveryText}</p>
                    <p className="mt-3">{dict.product.paymentText}</p>
                  </div>
                ),
              },
              {
                key: "warranty",
                label: dict.product.tabWarranty,
                content: (
                  <div className="max-w-2xl text-sm text-muted dark:text-muted-dark">
                    <p>{dict.product.warrantyText}</p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Container>

      <Container>
        <RelatedProducts products={related} />
      </Container>
    </>
  );
}
