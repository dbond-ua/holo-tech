"use client";

import { Zap, Instagram, Facebook, Send } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const { dict } = useI18n();
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  return (
    <footer className="mt-24 border-t border-line pb-24 pt-16 lg:pb-16 dark:border-line-dark">
      <Container>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-lg">HoloTech</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted dark:text-muted-dark">{dict.footer.tagline}</p>
            <div className="mt-6 flex items-center gap-2">
              {[Instagram, Facebook, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-black/[0.04] dark:border-line-dark dark:hover:bg-white/[0.06]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold">{dict.footer.catalogTitle}</p>
            <ul className="flex flex-col gap-3 text-sm text-muted dark:text-muted-dark">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="transition-colors hover:text-ink dark:hover:text-ink-dark">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold">{dict.footer.companyTitle}</p>
            <ul className="flex flex-col gap-3 text-sm text-muted dark:text-muted-dark">
              <li>
                <Link href="/quiz" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
                  {dict.footer.quizLink}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
                  {dict.footer.compareLink}
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
                  {dict.footer.deliveryLink}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-ink dark:hover:text-ink-dark">
                  {dict.footer.warrantyLink}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold">{dict.footer.contactsTitle}</p>
            <ul className="flex flex-col gap-3 text-sm text-muted dark:text-muted-dark">
              <li>{dict.header.phone}</li>
              <li>support@holotech.store</li>
              <li>{dict.footer.address}</li>
              <li>{dict.footer.workingHours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-xs text-muted dark:border-line-dark dark:text-muted-dark sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {dict.footer.rightsReserved}</p>
          <p>{dict.footer.demoNotice}</p>
        </div>
      </Container>
    </footer>
  );
}
