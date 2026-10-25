import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/content";
export default async function Dashboard() {
  const [
    videos,
    courses,
    students,
    enrollments,
    completed,
    contacts,
    storage,
    lastSync,
    failures,
    cats,
    recent,
    popular,
  ] = await Promise.all([
    db.content.count({ where: { kind: "VIDEO" } }),
    db.course.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.enrollment.count(),
    db.progress.count(),
    db.contact.count(),
    db.media.aggregate({ _sum: { size: true } }),
    db.syncRun.findFirst({ orderBy: { createdAt: "desc" } }),
    db.syncRun.count({ where: { status: "FAILED" } }),
    db.category.findMany(),
    db.content.findMany({
      where: { kind: "VIDEO" },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.content.findMany({
      where: { kind: "VIDEO" },
      take: 5,
      orderBy: { views: "desc" },
    }),
  ]);
  const videoRows = await db.content.findMany({
    where: { kind: "VIDEO" },
    select: { categorySlugs: true },
  });
  const stats = [
    ["Vídeos", videos],
    ["Cursos", courses],
    ["Alunos", students],
    ["Matrículas", enrollments],
    ["Aulas concluídas", completed],
    ["Mensagens", contacts],
    [
      "Armazenamento original (MB)",
      Math.round((storage._sum.size || 0) / 1024 / 1024),
    ],
    ["Falhas de integração", failures],
  ];
  return (
    <>
      <PageHeading
        title="Visão geral"
        description="Indicadores calculados a partir dos registros reais do portal."
      />
      <div className="stats">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="actions">
        <Link className="button" href="/admin/conteudos">
          Cadastrar conteúdo
        </Link>
        <Link className="button secondary" href="/admin/cursos">
          Criar treinamento
        </Link>
      </div>
      <section className="section">
        <h2>Última sincronização</h2>
        <p>
          {lastSync
            ? `${lastSync.status} · ${lastSync.imported} vídeos · ${lastSync.createdAt.toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })}`
            : "Nenhuma sincronização executada."}
        </p>
        {lastSync?.message && <p>{lastSync.message}</p>}
        <h2>Vídeos por categoria</h2>
        {cats
          .filter((c) =>
            videoRows.some((v) => v.categorySlugs.includes(c.slug)),
          )
          .map((c) => (
            <span className="badge" key={c.id}>
              {c.name}:{" "}
              {videoRows.filter((v) => v.categorySlugs.includes(c.slug)).length}
            </span>
          ))}
        {!videos && <p>Nenhum vídeo registrado.</p>}
      </section>
      <div className="grid two">
        <div className="card">
          <h2>Vídeos recentes</h2>
          {recent.map((v) => (
            <p key={v.id}>
              <Link href={"/admin/conteudos?edit=" + v.id}>{v.title}</Link>
            </p>
          ))}
        </div>
        <div className="card">
          <h2>Vídeos populares</h2>
          <p className="muted">
            Visualizações públicas fornecidas pelo YouTube.
          </p>
          {popular.map((v) => (
            <p key={v.id}>
              {v.title}: {v.views.toString()}
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
