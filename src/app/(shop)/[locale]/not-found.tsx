"use client";

import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export default function NotFound() {
  const { dict } = useI18n();

  return (
    <Container className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted dark:text-muted-dark">
        {dict.notFound.code}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-sm text-muted dark:text-muted-dark">{dict.notFound.text}</p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        {dict.common.backHome}
      </Link>
    </Container>
  );
}
