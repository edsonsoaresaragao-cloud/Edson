import Link from "next/link";
import { PageHeading } from "@/components/content";
import { AcademyLessonCard } from "@/components/academy/lesson-card";
import { ChecklistLessonCard } from "@/components/academy/checklist/lesson-card";
import { LibraryLessonCards } from "@/components/academy/library/lesson-cards";
import { getLibraryDirectory } from "@/lib/academy/library/access";
export const dynamic = "force-dynamic";
export const metadata = { title: "Aulas organizadas | EDSON OFICINA Academy" };
export default async function Lessons() {
  const directory = await getLibraryDirectory();
  const readySlugs = directory
    .filter((lesson) => lesson.ready)
    .map((lesson) => lesson.slug);
  const viewableSlugs = directory
    .filter((lesson) => lesson.viewable)
    .map((lesson) => lesson.slug);
  return (
    <div className="container page-content">
      <PageHeading
        eyebrow="EDSON OFICINA ACADEMY / BIBLIOTECA DE AULAS"
        title="Aulas organizadas"
        description="Estude por etapas, explore o material técnico e acompanhe seu progresso na sua conta."
      />
      <Link href="/academy" className="text-link">
        ← Voltar à Academy
      </Link>
      <div className="grid two section">
        <AcademyLessonCard />
        <ChecklistLessonCard />
        <LibraryLessonCards
          readySlugs={readySlugs}
          viewableSlugs={viewableSlugs}
        />
      </div>
    </div>
  );
}
