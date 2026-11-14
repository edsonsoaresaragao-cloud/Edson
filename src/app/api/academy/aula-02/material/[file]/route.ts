import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { ADAPTED_PDF } from "@/lib/academy/checklist/content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const files = new Set([
  "original.pdf",
  ADAPTED_PDF,
  ...Array.from(
    { length: 4 },
    (_, i) => `pagina-${String(i + 1).padStart(2, "0")}.png`,
  ),
]);
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
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
      join(process.cwd(), "academy-materials", "aula-02", file),
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
    console.error("academy_checklist_material_unavailable");
    return new Response("Material temporariamente indisponível.", {
      status: 503,
    });
  }
}
