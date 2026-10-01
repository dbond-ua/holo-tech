import { LocalizedLink as Link } from "@/components/LocalizedLink";
import type { BaseProduct } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { buildSpecs } from "@/lib/specs";
import { Container } from "@/components/ui/Container";
import { Gallery } from "@/components/product/Gallery";
import { RatingStars } from "@/components/ui/RatingStars";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import { Availability } from "@/components/ui/Availability";
import { ProductActions } from "@/components/product/ProductActions";
import { SpecsTable } from "@/components/product/SpecsTable";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { SectionNav } from "@/components/product/SectionNav";
import { getAvailability, getPrimaryBadge } from "@/lib/product-ui";

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

  // One status badge (discount / new / bestseller) plus factual property
  // tags. The internal "Demo" flag is no longer shown to customers.
  const primaryBadge = getPrimaryBadge(product, dict);
  const tags: string[] = [];
  if (product.expandable) tags.push(dict.product.expandableBadge);
  if (product.highVoltage) tags.push(dict.product.highVoltageBadge);
  const availability = getAvailability(product, dict);
  const keySpecs = specs.slice(0, 4);
  const hasReviews = product.reviewsCount > 0 && product.reviews.length > 0;

  const sections = [
    { id: "specs", label: dict.product.tabSpecs },
    ...(description ? [{ id: "description", label: dict.product.tabDescription }] : []),
    ...(whatsIncluded.length ? [{ id: "included", label: dict.product.tabIncluded }] : []),
    { id: "reviews", label: dict.product.tabReviews(product.reviewsCount) },
    { id: "delivery", label: dict.ui.deliveryAndWarranty },
  ];

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

      <Container className="pt-4 sm:pt-8">
        <nav className="mb-4 flex items-center gap-2 text-[13px] text-fg-2 sm:mb-6" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-fg">
            {dict.header.home}
          </Link>
          <span className="text-fg-3" aria-hidden="true">/</span>
          <Link href={`/${category.slug}`} className="transition-colors hover:text-fg">
            {category.title}
          </Link>
          <span className="hidden text-fg-3 sm:inline" aria-hidden="true">/</span>
          <span className="hidden truncate text-fg sm:inline" aria-current="page">
            {name}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Gallery
              category={product.category}
              productId={product.id}
              count={product.images}
              imageUrls={product.imageUrls}
              alt={name}
            />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[8.5rem]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="caption mr-2 text-fg-2">{product.brand}</p>
                {primaryBadge && primaryBadge.tone !== "signal" && <Badge tone={primaryBadge.tone}>{primaryBadge.label}</Badge>}
                {tags.map((t) => (
                  <Badge key={t} tone="outline">
                    {t}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-3 text-balance text-[28px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[40px]">
                {name}
              </h1>
              {tagline && <p className="mt-3 text-fg-2 sm:text-lg">{tagline}</p>}
              {hasReviews && (
                <a href="#reviews" className="mt-3 inline-flex">
                  <RatingStars rating={product.rating} count={product.reviewsCount} showValue size={14} />
                </a>
              )}

              {keySpecs.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 border-t border-fg">
                  {keySpecs.map((row, i) => (
                    <div
                      key={row.label}
                      className={`border-b border-rule py-3 ${i % 2 === 0 ? "pr-4" : "border-l pl-4"}`}
                    >
                      <dt className="caption text-fg-3">{row.label}</dt>
                      <dd className="num mt-1 text-lg font-semibold tracking-[-0.01em]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
              </div>
              <Availability
                value={availability}
                className="mt-3"
                detail={
                  availability.kind === "in_stock" && product.stockCount
                    ? `${product.stockCount} ${dict.ui.pieces}`
                    : undefined
                }
              />

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
                  image={product.imageUrls?.[0]}
                />
              </div>

              <dl className="mt-6 border-t border-rule text-sm">
                {[
                  { k: dict.product.tabDelivery, v: dict.product.deliveryBadge },
                  { k: dict.product.tabWarranty, v: dict.product.warrantyBadge },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between gap-4 border-b border-rule py-3">
                    <dt className="text-fg-2">{row.k}</dt>
                    <dd className="text-right font-medium">
                      <a href="#delivery" className="underline-offset-4 hover:underline">
                        {row.v}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-20">
          <SectionNav items={sections} />

          <DetailSection id="specs" title={dict.product.tabSpecs}>
            <SpecsTable specs={specs} />
          </DetailSection>

          {description && (
            <DetailSection id="description" title={dict.product.tabDescription}>
              <p className="max-w-[68ch] text-[17px] leading-relaxed">{description}</p>
              {features.length > 0 && (
                <>
                  <p className="caption mt-8 text-fg-2">{dict.ui.featuresTitle}</p>
                  <ul className="mt-3 grid grid-cols-1 border-t border-rule md:grid-cols-2 md:gap-x-10">
                    {features.map((f, i) => (
                      <li key={f} className="flex gap-4 border-b border-rule py-3 text-[15px]">
                        <span className="spec pt-0.5 text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </DetailSection>
          )}

          {whatsIncluded.length > 0 && (
            <DetailSection id="included" title={dict.product.tabIncluded}>
              <ul className="grid grid-cols-1 border-t border-rule md:grid-cols-2 md:gap-x-10">
                {whatsIncluded.map((item) => (
                  <li key={item} className="border-b border-rule py-3 text-[15px]">
                    {item}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          <DetailSection id="reviews" title={dict.product.tabReviews(product.reviewsCount)}>
            <ReviewsSection rating={product.rating} reviewsCount={product.reviewsCount} reviews={product.reviews} />
          </DetailSection>

          <DetailSection id="delivery" title={dict.ui.deliveryAndWarranty}>
            <dl className="grid grid-cols-1 gap-x-10 border-t border-rule md:grid-cols-3">
              {[
                { k: dict.product.tabDelivery, v: dict.product.deliveryText },
                { k: dict.checkout.paymentTitle, v: dict.product.paymentText },
                { k: dict.product.tabWarranty, v: dict.product.warrantyText },
              ].map((row) => (
                <div key={row.k} className="border-b border-rule py-4 md:border-b-0">
                  <dt className="font-medium">{row.k}</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-fg-2">{row.v}</dd>
                </div>
              ))}
            </dl>
          </DetailSection>
        </div>

        <RelatedProducts products={related} />
      </Container>
    </>
  );
}

function DetailSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-44 grid-cols-1 gap-4 border-b border-rule py-10 last:border-b-0 sm:py-14 lg:grid-cols-12 lg:gap-10">
      <h2 className="text-h3 font-semibold lg:col-span-3">{title}</h2>
      <div className="lg:col-span-9">{children}</div>
    </section>
  );
}
