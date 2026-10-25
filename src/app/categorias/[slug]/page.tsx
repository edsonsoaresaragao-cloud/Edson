import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { searchContent } from "@/lib/content";
import { PageHeading, ContentCard, Empty } from "@/components/content";
export const dynamic = "force-dynamic";
export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const s = await searchParams;
  const c = await db.category.findUnique({
    where: { slug },
    include: { children: true },
  });
  if (!c) notFound();
  const { items } = await searchContent({
    category: slug,
    q: s.q,
    brand: s.brand,
    model: s.model,
    year: s.year,
  });
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED", categorySlugs: { has: slug } },
  });
  return (
    <div className="container page-content">
      <PageHeading title={c.name} description={c.description} />
      {c.children.map((child) => (
        <Link
          key={child.id}
          className="badge"
          href={"/categorias/" + child.slug}
        >
          {child.name}
        </Link>
      ))}
      <form className="filters">
        <label>
          Pesquisar
          <input name="q" defaultValue={s.q} />
        </label>
        <label>
          Marca
          <input name="brand" defaultValue={s.brand} />
        </label>
        <label>
          Modelo
          <input name="model" defaultValue={s.model} />
        </label>
        <label>
          Ano
          <input name="year" type="number" defaultValue={s.year} />
        </label>
        <button className="button">Filtrar</button>
      </form>
      {items.length ? (
        <div className="grid three">
          {items.map((i) => (
            <ContentCard item={i} key={i.id} />
          ))}
        </div>
      ) : (
        <Empty />
      )}
      {courses.map((course) => (
        <Link
          className="record"
          href={"/cursos/" + course.slug}
          key={course.id}
        >
          {course.title} →
        </Link>
      ))}
    </div>
  );
}
