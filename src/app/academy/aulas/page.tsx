import Link from "next/link";
import { PageHeading } from "@/components/content";
import { AcademyLessonCard } from "@/components/academy/lesson-card";
export const metadata = { title: "Aulas organizadas | EDSON OFICINA Academy" };
export default function Lessons() {
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
      </div>
    </div>
  );
}
