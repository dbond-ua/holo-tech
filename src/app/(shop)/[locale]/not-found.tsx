"use client";

import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useI18n } from "@/i18n/I18nProvider";

export default function NotFound() {
  const { dict } = useI18n();

  return (
    <Container className="pt-10 sm:pt-16">
      <p className="num text-[96px] font-semibold leading-none tracking-[-0.05em] text-fg-3 sm:text-[160px]">
        {dict.notFound.code}
      </p>
      <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] sm:text-h2">{dict.notFound.title}</h1>
      <p className="mb-10 mt-3 max-w-md text-fg-2">{dict.notFound.text}</p>
      <EmptyState
        title={dict.header.catalog}
        action={
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            {dict.common.backHome}
          </Link>
        }
        lead={dict.ui.emptyCartLead}
      />
    </Container>
  );
}
