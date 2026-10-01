import type { Metadata } from "next";
import { User, Package, MapPin, Bell } from "lucide-react";
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

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.profile.title}</h1>
      <p className="mt-2 text-muted dark:text-muted-dark">{dict.profile.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl2 border border-line p-6 dark:border-line-dark">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <User className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-semibold">{dict.profile.guestTitle}</p>
            <p className="text-sm text-muted dark:text-muted-dark">{dict.profile.guestText}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl2 border border-line p-6 dark:border-line-dark">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <Package className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-semibold">{dict.profile.ordersTitle}</p>
            <p className="text-sm text-muted dark:text-muted-dark">{dict.profile.ordersText}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl2 border border-line p-6 dark:border-line-dark">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <MapPin className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-semibold">{dict.profile.addressesTitle}</p>
            <p className="text-sm text-muted dark:text-muted-dark">{dict.profile.addressesText}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl2 border border-line p-6 dark:border-line-dark">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <Bell className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-semibold">{dict.profile.notificationsTitle}</p>
            <p className="text-sm text-muted dark:text-muted-dark">{dict.profile.notificationsText}</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
