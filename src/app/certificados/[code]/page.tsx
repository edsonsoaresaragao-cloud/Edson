import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PageHeading } from "@/components/content";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Autenticidade do certificado",
  robots: { index: false, follow: false },
};
export default async function Certificate({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const c = await db.certificate.findUnique({ where: { code } });
  const u = await currentUser();
  const owner = c && u && (u.id === c.userId || u.role === "ADMIN");
  return (
    <div className="container page-content">
      <PageHeading title="Validação de certificado" />
      <div className="card certificate">
        <span className="eyebrow">EDSON OFICINA ACADEMY</span>
        <h2>{c ? "Certificado autêntico ✓" : "Código não encontrado"}</h2>
        {c ? (
          <>
            <h3>{c.courseTitle}</h3>
            <p>
              Carga horária: {c.hours} horas · Emitido em{" "}
              {c.issuedAt.toLocaleDateString("pt-BR", {
                timeZone: "America/Fortaleza",
              })}
            </p>
            {owner ? (
              <p>Aluno: {c.studentName}</p>
            ) : (
              <p>
                Os dados pessoais do aluno são exibidos somente ao titular e ao
                administrador.
              </p>
            )}
            <p className="muted">Código: {c.code}</p>
            <p className="muted">
              Curso livre. Sem alegação de reconhecimento oficial ou acadêmico.
            </p>
            {owner && (
              <a className="button" href={"/api/certificates/" + c.code}>
                Baixar certificado PDF
              </a>
            )}
          </>
        ) : (
          <p>Verifique os caracteres e tente novamente.</p>
        )}
      </div>
      <Link className="text-link" href="/certificados">
        Consultar outro código →
      </Link>
    </div>
  );
}
