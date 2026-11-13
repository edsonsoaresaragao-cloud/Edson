import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const files = new Set([
  "original.pdf",
  "aula-01.pdf",
  ...Array.from(
    { length: 11 },
    (_, i) => `page-${String(i + 1).padStart(2, "0")}.png`,
  ),
]);
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (!files.has(file))
    return new Response("Arquivo não encontrado.", { status: 404 });
  if (file === "original.pdf") {
    if (!(await cookies()).has("edson_session"))
      return new Response("Conferência interna restrita à equipe editorial.", {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      });
    const { currentUser } = await import("@/lib/auth");
    const user = await currentUser();
    if (!user || !["ADMIN", "EDITOR"].includes(user.role))
      return new Response("Conferência interna restrita à equipe editorial.", {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      });
  }
  try {
    const bytes = await readFile(
      join(process.cwd(), "academy-materials", "aula-01", file),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.endsWith(".pdf") ? "application/pdf" : "image/png",
        "Content-Disposition": `${file.endsWith(".pdf") ? "attachment" : "inline"}; filename="${file}"`,
        "Cache-Control":
          file === "original.pdf"
            ? "private, no-store"
            : "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("academy_material_unavailable", file);
    return new Response("Material temporariamente indisponível.", {
      status: 503,
    });
  }
}
