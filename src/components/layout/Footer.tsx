"use client";

import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { categorySlugs } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";

export function Footer() {
  const { dict } = useI18n();
  const categories = categorySlugs.map((slug) => ({ slug, ...dict.categories[slug] }));

  return (
    <footer className="surface-ink mt-24 bg-paper text-fg sm:mt-32">
      <Container className="pb-8 pt-14 sm:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-5">
            <Link href="/" aria-label="HoloTech">
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-fg-2">{dict.footer.tagline}</p>
            <a
              href={`tel:${dict.header.phone.replace(/\s/g, "")}`}
              className="num mt-8 block text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px]"
            >
              {dict.header.phone}
            </a>
            <p className="mt-2 text-sm text-fg-2">{dict.footer.workingHours}</p>
          </div>

          <div className="lg:col-span-2 lg:col-start-7">
            <p className="caption mb-4 text-fg-3">{dict.footer.catalogTitle}</p>
            <ul className="flex flex-col gap-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="text-fg-2 transition-colors hover:text-fg">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="caption mb-4 text-fg-3">{dict.footer.companyTitle}</p>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/quiz" className="text-fg-2 transition-colors hover:text-fg">
                  {dict.footer.quizLink}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-fg-2 transition-colors hover:text-fg">
                  {dict.footer.compareLink}
                </Link>
              </li>
              <li>
                <a href="#" className="text-fg-2 transition-colors hover:text-fg">
                  {dict.footer.deliveryLink}
                </a>
              </li>
              <li>
                <a href="#" className="text-fg-2 transition-colors hover:text-fg">
                  {dict.footer.warrantyLink}
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <p className="caption mb-4 text-fg-3">{dict.footer.contactsTitle}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-fg-2">
              <li>
                <a href="mailto:support@holotech.store" className="transition-colors hover:text-fg">
                  support@holotech.store
                </a>
              </li>
              <li>{dict.footer.address}</li>
              <li className="flex gap-4 pt-2">
                {/* Social links are placeholders in the current content (href="#"). */}
                <a href="#" className="transition-colors hover:text-fg">Instagram</a>
                <a href="#" className="transition-colors hover:text-fg">Telegram</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-rule pt-6 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {dict.footer.rightsReserved}
          </p>
          <p>{dict.footer.demoNotice}</p>
        </div>
      </Container>
    </footer>
  );
}
