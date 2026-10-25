import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActionForm, Field } from "@/components/forms";
import { PageHeading, Empty } from "@/components/content";
export const dynamic = "force-dynamic";
export const metadata = { title: "Área do aluno" };
export default async function Student() {
  const u = await currentUser();
  if (!u) redirect("/login");
  const [enrollments, certs] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: u.id },
      include: {
        progress: true,
        course: { include: { modules: { include: { lessons: true } } } },
      },
    }),
    db.certificate.findMany({ where: { userId: u.id } }),
  ]);
  return (
    <div className="container page-content">
      <PageHeading
        eyebrow="EDSON OFICINA ACADEMY / SUA JORNADA"
        title={"Olá, " + u.name.split(" ")[0] + "."}
        description="Continue seus treinamentos e acompanhe seu progresso."
      />
      <div className="actions mb-8">
        <Link className="button secondary" href="/treinamentos">
          Explorar cursos
        </Link>
        <Link className="button secondary" href="/certificados">
          Validar certificado
        </Link>
        {["ADMIN", "EDITOR"].includes(u.role) && (
          <Link className="button secondary" href="/admin">
            Painel administrativo
          </Link>
        )}
        <ActionForm action="logout" submitLabel="Sair" />
      </div>
      <h2>Meus cursos</h2>
      {enrollments.length ? (
        <div className="grid three">
          {enrollments.map((e) => {
            const total = e.course.modules.reduce(
              (n, m) => n + m.lessons.length,
              0,
            );
            const percent = total
              ? Math.round((100 * e.progress.length) / total)
              : 0;
            return (
              <Link
                className="card"
                key={e.id}
                href={"/aluno/cursos/" + e.course.id}
              >
                <span className="eyebrow">
                  {e.course.status === "PUBLISHED"
                    ? "TREINAMENTO"
                    : "INDISPONÍVEL"}
                </span>
                <h3>{e.course.title}</h3>
                <progress value={percent} max={100} />
                <p>
                  {percent}% · {e.progress.length}/{total} aulas concluídas
                </p>
                <span className="text-link">Continuar aprendendo →</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Sua jornada está começando"
          text="Escolha um treinamento publicado e faça sua matrícula gratuita."
        />
      )}
      <section className="section">
        <h2>Meus certificados</h2>
        {certs.length ? (
          certs.map((c) => (
            <Link
              className="record"
              href={"/certificados/" + c.code}
              key={c.id}
            >
              {c.courseTitle} <span>Consultar e baixar →</span>
            </Link>
          ))
        ) : (
          <p>
            Seus certificados aparecerão aqui após cumprir os requisitos e
            solicitar a emissão.
          </p>
        )}
      </section>
      <div className="grid two">
        <ActionForm
          action="profile"
          className="card"
          submitLabel="Atualizar perfil"
        >
          <h2>Meu perfil</h2>
          <Field label="Nome completo" name="name" value={u.name} required />
          <p className="muted">E-mail de acesso: {u.email}</p>
        </ActionForm>
        <div className="card">
          <h2>Seus dados</h2>
          <p>
            Para solicitar acesso, correção ou exclusão dos dados pessoais,
            entre em contato com Edson. O histórico de aprendizagem e os
            certificados são tratados conforme a política de privacidade.
          </p>
          <Link href="/contato" className="text-link">
            Falar com o responsável →
          </Link>
        </div>
      </div>
    </div>
  );
}
