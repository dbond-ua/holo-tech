import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getDictionary } from "@/i18n/getDictionary";
import { locales, localeTags, SITE_URL, SITE_NAME, type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/localePath";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.defaultTitle,
      template: `%s — ${SITE_NAME}`,
    },
    description: dict.meta.defaultDescription,
    alternates: {
      canonical: `${SITE_URL}${localePath(params.locale)}`,
      languages: {
        "uk-UA": `${SITE_URL}${localePath("uk")}`,
        en: `${SITE_URL}${localePath("en")}`,
      },
    },
    openGraph: {
      siteName: SITE_NAME,
      title: dict.meta.defaultTitle,
      description: dict.meta.defaultDescription,
      type: "website",
      locale: localeTags[params.locale],
      url: `${SITE_URL}${localePath(params.locale)}`,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function ShopLocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  return (
    <html lang={localeTags[params.locale]} suppressHydrationWarning className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <I18nProvider locale={params.locale}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
            >
              {params.locale === "uk" ? "Перейти до змісту" : "Skip to content"}
            </a>
            <Header />
            <main id="main-content" className="flex-1 pb-16 lg:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
