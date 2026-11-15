import { getLibraryAccess } from "@/lib/academy/library/access";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const result = await getLibraryAccess((await params).slug);
  return Response.json(result || { error: "Aula não encontrada." }, {
    status: result ? 200 : 404,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
