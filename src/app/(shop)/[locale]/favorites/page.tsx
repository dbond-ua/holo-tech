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
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.favorites.title}</h1>
      <FavoritesClient />
    </Container>
  );
}
