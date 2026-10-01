import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { SITE_URL, localeTags } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { localePath } from "@/i18n/localePath";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow={dict.home.quizEyebrow}
        title={dict.quiz.title}
        description={dict.quiz.description}
        as="h1"
      />
      <div className="mt-8 max-w-4xl">
        <QuizWizard />
      </div>
    </Container>
  );
}
