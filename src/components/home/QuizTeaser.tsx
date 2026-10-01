import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { QuizWizard } from "@/components/quiz/QuizWizard";
import type { Dictionary } from "@/i18n/dictionary.types";

export function QuizTeaser({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={dict.home.quizEyebrow} title={dict.home.quizTitle} />
        <div className="mt-8">
          <QuizWizard compact />
        </div>
      </Container>
    </section>
  );
}
