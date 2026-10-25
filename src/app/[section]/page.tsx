import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { kindPaths, kindLabels, normalize } from "@/lib/catalog";
import { searchContent } from "@/lib/content";
import { PageHeading, ContentCard, Empty } from "@/components/content";
import { SearchBox } from "@/components/forms";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const kind = Object.keys(kindPaths).find((k) => kindPaths[k] === section);
  return { title: kind ? kindLabels[kind] : "Busca" };
}
export default async function Catalog({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params;
  const s = await searchParams;
  const kind = Object.keys(kindPaths).find((k) => kindPaths[k] === section);
  if (!kind && section !== "busca") notFound();
  const page = Math.max(1, Math.min(1000, Number(s.page) || 1));
  const [{ items, hasNext }, categories, courses] = await Promise.all([
    searchContent({
      q: s.q?.slice(0, 150),
      kind: kind || s.kind,
      category: s.category,
      brand: s.brand,
      model: s.model,
      year: s.year,
      page,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    section === "busca" && s.q
      ? db.course.findMany({ where: { status: "PUBLISHED" }, take: 100 })
      : Promise.resolve([]),
  ]);
  const matchingCourses = courses.filter((c) =>
    normalize(c.title + " " + c.description).includes(normalize(s.q || "")),
  );
  const url = (p: number) => {
    const query = new URLSearchParams(
      Object.entries(s).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    query.set("page", String(p));
    return "/" + section + "?" + query;
  };
  return (
    <div className="container page-content">
      <PageHeading
        title={kind ? kindLabels[kind] : "Pesquisa inteligente"}
        description={
          section === "videos"
            ? "Vídeos próprios e incorporações oficiais. Cada conteúdo externo preserva sua autoria."
            : section === "diagnostico"
              ? "Causas possíveis e verificações educativas. A confirmação de falhas exige avaliação e testes profissionais."
              : "Explore conteúdos técnicos por sistema, peça, veículo e palavra-chave."
        }
      />
      <SearchBox />
      {s.q && (
        <p>
          Resultados para <strong>“{s.q}”</strong>
          {/nao (liga|pega)/.test(normalize(s.q))
            ? " — possibilidades relacionadas a partida, bateria e ignição; não constituem diagnóstico definitivo."
            : ""}
        </p>
      )}
      <form className="filters">
        <input name="q" type="hidden" value={s.q || ""} />
        <label>
          Sistema
          <select name="category" defaultValue={s.category}>
            <option value="">Todos</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Marca
          <input
            name="brand"
            defaultValue={s.brand}
            placeholder="Marca confirmada"
          />
        </label>
        <label>
          Modelo
          <input
            name="model"
            defaultValue={s.model}
            placeholder="Modelo confirmado"
          />
        </label>
        <label>
          Ano
          <input
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={s.year}
          />
        </label>
        <button className="button">Aplicar filtros</button>
      </form>
      {section === "videos" && !process.env.YOUTUBE_API_KEY && (
        <p className="notice">
          YouTube: configuração pendente. O administrador deve fornecer uma
          chave válida da YouTube Data API v3. Nenhuma importação é simulada.
        </p>
      )}
      <div className="grid three">
        {items.map((c) => (
          <ContentCard key={c.id} item={c} />
        ))}
      </div>
      {!items.length && (
        <Empty
          title="Nenhum conteúdo encontrado"
          text="Tente remover filtros ou buscar um termo mais amplo. O administrador pode cadastrar novos conteúdos."
        />
      )}
      {matchingCourses.length > 0 && (
        <section className="section">
          <h2>Treinamentos encontrados</h2>
          {matchingCourses.map((c) => (
            <Link className="record" href={"/cursos/" + c.slug} key={c.id}>
              {c.title} →
            </Link>
          ))}
        </section>
      )}
      <div className="pagination">
        {page > 1 && <Link href={url(page - 1)}>← Anterior</Link>}
        {hasNext && <Link href={url(page + 1)}>Próxima →</Link>}
      </div>
    </div>
  );
}
