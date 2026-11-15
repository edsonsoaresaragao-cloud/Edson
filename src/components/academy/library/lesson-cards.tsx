import Link from "next/link";
import { libraryCourses } from "@/lib/academy/library/catalog";

export function LibraryLessonCards({
  readySlugs = [],
}: {
  readySlugs?: string[];
}) {
  return libraryCourses.map((course) => (
    <Link
      key={course.id}
      href={`/academy/aulas/${course.slug}`}
      className="card academy-lesson-card"
    >
      <span className="tag">AULA {String(course.number).padStart(2, "0")}</span>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <p>
        {course.expectedPages} páginas previstas · {course.difficulty}
      </p>
      <p>
        {readySlugs.includes(course.slug)
          ? "Disponível para estudo"
          : "Preparação editorial"}{" "}
        · Carga horária a validar.
      </p>
      <span className="text-link">
        {readySlugs.includes(course.slug)
          ? "Conhecer e iniciar aula →"
          : "Consultar preparação da aula →"}
      </span>
    </Link>
  ));
}
