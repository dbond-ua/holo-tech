import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { Container } from "@/components/ui/Container";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.profile.title,
    description: dict.profile.subtitle,
    robots: { index: false, follow: true },
  };
}

export default function ProfilePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  const rows = [
    { title: dict.profile.guestTitle, text: dict.profile.guestText },
    { title: dict.profile.ordersTitle, text: dict.profile.ordersText },
    { title: dict.profile.addressesTitle, text: dict.profile.addressesText },
    { title: dict.profile.notificationsTitle, text: dict.profile.notificationsText },
  ];

  return (
    <Container className="pt-6 sm:pt-10">
      <h1 className="text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-h1">{dict.profile.title}</h1>
      <p className="mt-3 text-fg-2">{dict.profile.subtitle}</p>

      <dl className="mt-10 grid grid-cols-1 border-t border-fg md:grid-cols-2 md:gap-x-10">
        {rows.map((r) => (
          <div key={r.title} className="border-b border-rule py-5">
            <dt className="font-medium">{r.title}</dt>
            <dd className="mt-1 text-[15px] text-fg-2">{r.text}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
