import Link from "next/link";
import {
  LESSON_URL,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  COURSE_HOURS,
} from "@/lib/academy/content";
export function AcademyLessonCard() {
  return (
    <Link href={LESSON_URL} className="card academy-lesson-card">
      <span className="tag">AULA 01 · GRATUITA · {COURSE_HOURS} HORAS</span>
      <h2>{LESSON_TITLE}</h2>
      <p>{LESSON_SUBTITLE}</p>
      <p>
        Sincronismo mecânico, interferência entre pistões e válvulas e
        identificação de motores por fabricante.
      </p>
      <p>
        Motores e sistemas de distribuição · Mecânica intermediária e avançada
      </p>
      <p>
        11 páginas integrais · 10 montadoras · Diagnóstico prático · Avaliação
      </p>
      <span className="text-link">Conhecer e iniciar aula →</span>
    </Link>
  );
}
