import Link from "next/link";
import { GraduationCap, BookOpen, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/content";
import { AcademyLessonCard } from "@/components/academy/lesson-card";
import { COURSE_ID } from "@/lib/academy/content";
import { COURSE_ID as CHECKLIST_COURSE_ID } from "@/lib/academy/checklist/content";
import { ChecklistLessonCard } from "@/components/academy/checklist/lesson-card";
export const dynamic = "force-dynamic";
export const metadata = { title: "EDSON OFICINA ACADEMY" };
export default async function Academy() {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="container page-content">
      <PageHeading
        eyebrow="APRENDA. PRATIQUE. EVOLUA."
        title="EDSON OFICINA ACADEMY"
        description="Conhecimento automotivo para desenvolver sua jornada. Treinamentos gratuitos, aulas organizadas e progresso salvo no servidor."
      />
      <div className="academy-banner">
        <div>
          <span className="eyebrow">SUA PRÓXIMA ETAPA COMEÇA AQUI</span>
          <h2>
            Da curiosidade
            <br />
            ao conhecimento.
          </h2>
          <p>
            Crie sua conta, escolha um curso publicado e aprenda no seu ritmo.
          </p>
          <Link href="/cadastro" className="button">
            Criar minha conta ↗
          </Link>
        </div>
        <GraduationCap size={130} strokeWidth={1} />
      </div>
      <div className="grid three section">
        {[
          [BookOpen, "Aulas organizadas"],
          [GraduationCap, "Progresso individual"],
          [ShieldCheck, "Certificado verificável"],
        ].map(([Icon, title]) => {
          const I = Icon as typeof BookOpen;
          return title === "Aulas organizadas" ? (
            <Link
              className="card academy-lesson-link"
              href="/academy/aulas"
              key={String(title)}
            >
              <I className="orange" />
              <h3 className="mt-4">{String(title)}</h3>
              <p>Aulas 01 e 02 disponíveis · Sincronismo e conferência final</p>
              <span className="text-link">Explorar aulas →</span>
            </Link>
          ) : (
            <div className="card" key={String(title)}>
              <I className="orange" />
              <h3 className="mt-4">{String(title)}</h3>
            </div>
          );
        })}
      </div>
      <h2>Treinamentos disponíveis</h2>
      <div className="grid three">
        <AcademyLessonCard />
        <ChecklistLessonCard />
        {courses
          .filter((c) => c.id !== COURSE_ID && c.id !== CHECKLIST_COURSE_ID)
          .map((c) => (
            <Link className="card" href={"/cursos/" + c.slug} key={c.id}>
              <span className="tag">GRATUITO · {c.hours} HORAS</span>
              <h3 className="mt-4">{c.title}</h3>
              <p>{c.description}</p>
              <span className="text-link">Conhecer o curso →</span>
            </Link>
          ))}
      </div>
      <p className="muted mt-6">
        Cursos livres. Os certificados não indicam reconhecimento oficial ou
        acadêmico.
      </p>
    </div>
  );
}
