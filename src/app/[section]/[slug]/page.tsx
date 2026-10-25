import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kindPaths } from "@/lib/catalog";
import { publicWhere } from "@/lib/content";
import { PageHeading, ContentCard } from "@/components/content";
import { VideoPlayer, YouTubePlayer } from "@/components/player";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { slug } = await params;
  const c = await db.content.findUnique({ where: { slug, ...publicWhere } });
  return {
    title: c?.title || "Conteúdo indisponível",
    description: c?.summary,
  };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const kind = Object.keys(kindPaths).find((k) => kindPaths[k] === section);
  if (!kind) notFound();
  const c = await db.content.findUnique({
    where: { slug, ...publicWhere, kind },
    include: { media: { where: { status: "READY", lessonId: null } } },
  });
  if (!c) notFound();
  const related = await db.content.findMany({
    where: {
      ...publicWhere,
      id: { not: c.id },
      categorySlugs: { hasSome: c.categorySlugs },
    },
    take: 3,
  });
  const categories = await db.category.findMany({
    where: { slug: { in: c.categorySlugs } },
  });
  return (
    <div className="container page-content">
      <PageHeading title={c.title} description={c.summary} />
      <div className="article-layout">
        <article className="article-body">
          {c.youtubeId && (
            <>
              <YouTubePlayer id={c.youtubeId} title={c.title} />
              <p className="credit">
                Fonte: {c.author}. EDSON OFICINA não possui afiliação com o
                canal.{" "}
                <a
                  href={"https://www.youtube.com/watch?v=" + c.youtubeId}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Assistir no YouTube ↗
                </a>
              </p>
            </>
          )}
          {c.media
            .filter((m) => m.mimeType.startsWith("video/"))
            .map((m) => (
              <VideoPlayer mediaId={m.id} key={m.id} />
            ))}
          <div className="prose">{c.body}</div>
          {c.sourceUrl && (
            <p className="credit">
              <a href={c.sourceUrl} rel="noopener noreferrer" target="_blank">
                Consultar fonte / referência ↗
              </a>
            </p>
          )}
          <hr className="divider" />
          <p className="muted">
            Por {c.author} · Atualizado em{" "}
            {c.updatedAt.toLocaleDateString("pt-BR", {
              timeZone: "America/Fortaleza",
            })}
          </p>
        </article>
        <aside className="article-aside">
          <div className="card">
            <h3>Sistemas relacionados</h3>
            {categories.map((cat) => (
              <Link
                href={"/categorias/" + cat.slug}
                key={cat.id}
                className="badge"
              >
                {cat.name}
              </Link>
            ))}
            {c.tags.map((t) => (
              <span className="badge" key={t}>
                {t}
              </span>
            ))}
          </div>
          <div className="card">
            <h3>Informação com responsabilidade</h3>
            <p>
              Conteúdo educativo. Não substitui inspeção, testes, manual do
              fabricante ou avaliação profissional. Nunca trabalhe sob um
              veículo sem suporte adequado ou em sistemas de alta tensão sem
              qualificação.
            </p>
            <Link className="text-link" href="/contato">
              Enviar uma dúvida ↗
            </Link>
          </div>
          {(c.brand || c.vehicleModel) && (
            <div className="card">
              <h3>Aplicações registradas</h3>
              <p>
                {c.brand} {c.vehicleModel} {c.year}
              </p>
              <p className="muted">
                Confirme a documentação e as especificações antes de aplicar.
              </p>
            </div>
          )}
        </aside>
      </div>
      {related.length > 0 && (
        <section className="section">
          <h2>Continue explorando</h2>
          <div className="grid three">
            {related.map((r) => (
              <ContentCard item={r} key={r.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
