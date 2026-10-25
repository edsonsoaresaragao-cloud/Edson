import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { contentUrl, publicWhere } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const [items, cats, courses] = await Promise.all([
    db.content.findMany({ where: publicWhere }),
    db.category.findMany(),
    db.course.findMany({ where: { status: "PUBLISHED" } }),
  ]);
  return [
    ...[
      "",
      "/videos",
      "/categorias",
      "/pecas",
      "/diagnostico",
      "/guias",
      "/artigos",
      "/veiculos",
      "/academy",
      "/sobre",
      "/contato",
    ].map((path) => ({ url: base + path })),
    ...items.map((i) => ({
      url: base + contentUrl(i),
      lastModified: i.updatedAt,
    })),
    ...cats.map((c) => ({ url: base + "/categorias/" + c.slug })),
    ...courses.map((c) => ({ url: base + "/cursos/" + c.slug })),
  ];
}
