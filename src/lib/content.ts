import { recentContentOrder } from "./video-presentation";
import { db } from "./db";
import { normalize, searchTerms, kindPaths } from "./catalog";
import type { Content } from "@prisma/client";
export const publicWhere = {
  status: "PUBLISHED",
  visibility: "PUBLIC",
  externalAvailable: true,
};
export function contentUrl(c: { kind: string; slug: string }) {
  return `/${kindPaths[c.kind] || "artigos"}/${c.slug}`;
}
export async function searchContent({
  q = "",
  kind = "",
  category = "",
  brand = "",
  model = "",
  year = "",
  page = 1,
}: {
  q?: string;
  kind?: string;
  category?: string;
  brand?: string;
  model?: string;
  year?: string;
  page?: number;
}) {
  const where = {
    ...publicWhere,
    ...(kind ? { kind } : {}),
    ...(category ? { categorySlugs: { has: category } } : {}),
    ...(brand
      ? { brand: { equals: brand, mode: "insensitive" as const } }
      : {}),
    ...(model
      ? { vehicleModel: { equals: model, mode: "insensitive" as const } }
      : {}),
    ...(year && /^\d{4}$/.test(year) ? { year: Number(year) } : {}),
  };
  const terms = searchTerms(q);
  let data: Content[];
  if (terms.length) {
    // Parameterized PostgreSQL normalized search; AND for literal terms, synonym expansion for symptom queries.
    const normalized = normalize(q);
    const expanded = /nao (liga|pega)/.test(normalized);
    const tokens = expanded ? ["partida", "bateria", "ignicao"] : terms;
    const ids = await db.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Content" WHERE ${expanded} AND EXISTS (SELECT 1 FROM unnest(${tokens}::text[]) term WHERE public.content_search_text(title,summary,body,brand,"vehicleModel",tags) LIKE '%' || term || '%') OR (NOT ${expanded} AND NOT EXISTS (SELECT 1 FROM unnest(${tokens}::text[]) term WHERE public.content_search_text(title,summary,body,brand,"vehicleModel",tags) NOT LIKE '%' || term || '%'))`;
    data = await db.content.findMany({
      where: { ...where, id: { in: ids.map((i) => i.id) } },
      orderBy: recentContentOrder,
      skip: (page - 1) * 24,
      take: 25,
    });
  } else
    data = await db.content.findMany({
      where,
      orderBy: recentContentOrder,
      skip: (page - 1) * 24,
      take: 25,
    });
  return { items: data.slice(0, 24), hasNext: data.length > 24 };
}
