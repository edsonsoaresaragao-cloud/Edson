import Link from "next/link";
import { GraduationCap, BookOpen, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeading, Empty } from "@/components/content";
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
          return (
            <div className="card" key={String(title)}>
              <I className="orange" />
              <h3 className="mt-4">{String(title)}</h3>
            </div>
          );
        })}
      </div>
      <h2>Treinamentos disponíveis</h2>
      {courses.length ? (
        <div className="grid three">
          {courses.map((c) => (
            <Link className="card" href={"/cursos/" + c.slug} key={c.id}>
              <span className="tag">GRATUITO · {c.hours} HORAS</span>
              <h3 className="mt-4">{c.title}</h3>
              <p>{c.description}</p>
              <span className="text-link">Conhecer o curso →</span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Os primeiros treinamentos estão em preparação"
          text="Os cursos serão apresentados aqui depois de cadastrados e publicados pelo responsável. Não há matrículas para cursos inexistentes."
        />
      )}
      <p className="muted mt-6">
        Cursos livres. Os certificados não indicam reconhecimento oficial ou
        acadêmico.
      </p>
    </div>
  );
}
