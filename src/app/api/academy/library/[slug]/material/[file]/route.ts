import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getLibraryCourse } from "@/lib/academy/library/catalog";
import {
  hasLibraryEditorAccess,
  libraryMaterialRoot,
  libraryReadiness,
  loadLibraryDocument,
} from "@/lib/academy/library/access";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await params;
  const course = getLibraryCourse(slug);
  if (
    !course ||
    !/^(original\.pdf|adaptado\.pdf|pagina-\d{3}\.jpg|preview-\d{3}\.webp)$/.test(
      file,
    )
  )
    return new Response("Arquivo não encontrado.", { status: 404 });
  const document = await loadLibraryDocument(course);
  const status = await libraryReadiness(course, document);
  if (!status.ready && !(await hasLibraryEditorAccess()))
    return new Response(
      "Material em preparação, restrito à conferência editorial.",
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  if (!document)
    return new Response("Material ainda não recebido.", { status: 404 });
  const allowed = new Set([
    "original.pdf",
    ...(document.adaptedFilename === "adaptado.pdf" ? ["adaptado.pdf"] : []),
    ...document.pages.flatMap((page) => [page.image, page.preview]),
  ]);
  if (!allowed.has(file))
    return new Response("Arquivo não encontrado.", { status: 404 });
  try {
    const bytes = await readFile(join(libraryMaterialRoot(course), file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.endsWith(".pdf")
          ? "application/pdf"
          : file.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
        "Content-Disposition": `${file.endsWith(".pdf") ? "attachment" : "inline"}; filename="${file}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Material temporariamente indisponível.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
