import Link from "next/link";
import { libraryCourses } from "@/lib/academy/library/catalog";

export function LibraryLessonCards({
  readySlugs = [],
  viewableSlugs = [],
}: {
  readySlugs?: string[];
  viewableSlugs?: string[];
}) {
  const ordered = [...libraryCourses].sort(
    (a, b) =>
      Number(viewableSlugs.includes(b.slug)) -
      Number(viewableSlugs.includes(a.slug)),
  );
  return ordered.map((course) => (
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
          : viewableSlugs.includes(course.slug)
            ? "Páginas disponíveis para consulta"
            : "PDF ainda não disponível"}{" "}
        · Carga horária a validar.
      </p>
      <span className="text-link">
        {readySlugs.includes(course.slug)
          ? "Conhecer e iniciar aula →"
          : viewableSlugs.includes(course.slug)
            ? "Visualizar aula →"
            : "Ver outras aulas disponíveis →"}
      </span>
    </Link>
  ));
}
