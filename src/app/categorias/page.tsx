import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/content";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sistemas automotivos" };
export default async function Categories() {
  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { parent: true },
  });
  return (
    <div className="container page-content">
      <PageHeading
        title="Conhecimento por sistema"
        description="Explore as áreas da mecânica e encontre vídeos, peças, artigos e treinamentos relacionados."
      />
      <div className="category-list">
        {cats.map((c, i) => (
          <Link className="card" key={c.id} href={"/categorias/" + c.slug}>
            <span className="eyebrow">
              {String(i + 1).padStart(2, "0")} /{" "}
              {c.parent?.name || "SISTEMA AUTOMOTIVO"}
            </span>
            <h2>{c.name} ↗</h2>
            <p>{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
