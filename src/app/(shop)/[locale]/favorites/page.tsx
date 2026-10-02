import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { Container } from "@/components/ui/Container";
import { FavoritesClient } from "./FavoritesClient";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.favorites.title,
    description: dict.favorites.emptyText,
    robots: { index: false, follow: true },
  };
}

export default function FavoritesPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <Container className="pt-6 sm:pt-10">
      <h1 className="mb-6 text-[34px] font-semibold leading-none tracking-[-0.03em] sm:mb-10 sm:text-h1">
        {dict.favorites.title}
      </h1>
      <FavoritesClient />
    </Container>
  );
}
