import { Container } from "@/components/ui/Container";
import { QuizWizard } from "@/components/quiz/QuizWizard";
import type { Dictionary } from "@/i18n/dictionary.types";

export function QuizTeaser({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="caption mb-5 flex gap-3 text-fg-2 sm:mb-8">
              <span className="text-fg">02</span>
              <span>{dict.home.quizEyebrow}</span>
            </p>
            <h2 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-h2">
              {dict.home.quizTitle}
            </h2>
          </div>
          <p className="max-w-md text-fg-2 lg:col-span-4">{dict.ui.quizLead}</p>
        </div>
        <QuizWizard compact />
      </Container>
    </section>
  );
}
