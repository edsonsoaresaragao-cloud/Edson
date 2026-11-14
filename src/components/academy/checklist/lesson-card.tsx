import Link from "next/link";
import {
  LESSON_URL,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  COURSE_HOURS,
} from "@/lib/academy/checklist/content";
export function ChecklistLessonCard() {
  return (
    <Link href={LESSON_URL} className="card academy-lesson-card">
      <span className="tag">AULA 02 · GRATUITA</span>
      <h2>{LESSON_TITLE}</h2>
      <p>{LESSON_SUBTITLE}</p>
      <p>4 páginas integrais · 3 checklists · 21 pontos · Avaliação final</p>
      <p>
        {COURSE_HOURS === null
          ? "Carga horária a validar pelo responsável."
          : `${COURSE_HOURS} horas de estudo previstas.`}
      </p>
      <span className="text-link">Conhecer e iniciar aula →</span>
    </Link>
  );
}
