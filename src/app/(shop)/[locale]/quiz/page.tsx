import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { SITE_URL, localeTags } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { localePath } from "@/i18n/localePath";
import { Container } from "@/components/ui/Container";
import { QuizWizard } from "@/components/quiz/QuizWizard";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title = dict.quiz.title;
  const description = dict.quiz.description;
  const path = "/quiz";
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${localePath(params.locale, path)}`,
      languages: {
        "uk-UA": `${SITE_URL}${localePath("uk", path)}`,
        en: `${SITE_URL}${localePath("en", path)}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: localeTags[params.locale],
      url: `${SITE_URL}${localePath(params.locale, path)}`,
    },
  };
}

export default function QuizPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  return (
    <Container className="pt-6 sm:pt-10">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="caption mb-4 text-fg-2">{dict.home.quizEyebrow}</p>
          <h1 className="text-balance text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-h1">
            {dict.quiz.title}
          </h1>
        </div>
        <p className="max-w-md text-fg-2 sm:text-lg lg:col-span-4">{dict.ui.quizLead}</p>
      </div>
      <QuizWizard />
    </Container>
  );
}
