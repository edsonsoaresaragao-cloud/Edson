import { searchContent, contentUrl } from "@/lib/content";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 100) || "";
  if (q.length < 2) return Response.json([]);
  const { items } = await searchContent({ q });
  return Response.json(
    items.slice(0, 6).map((c) => ({ title: c.title, url: contentUrl(c) })),
  );
}
