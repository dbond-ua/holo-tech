import { Truck, ShieldCheck, CreditCard, MapPin, Wrench, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/dictionary.types";

const icons = [Truck, ShieldCheck, CreditCard, MapPin, Wrench, MessageCircle];

export function WhyUs({ dict }: { dict: Dictionary }) {
  const items = dict.whyUs.map((item, i) => ({ ...item, icon: icons[i] ?? Truck }));

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={dict.home.whyUsEyebrow} title={dict.home.whyUsTitle} />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-xl2 border border-line bg-surface p-5 dark:border-line-dark dark:bg-surface-dark"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                <item.icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted dark:text-muted-dark">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
