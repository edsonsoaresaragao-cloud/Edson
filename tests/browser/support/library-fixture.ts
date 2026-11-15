import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { syntheticLibraryDocument } from "../../fixtures/library";

/** Only the isolated PostgreSQL workflow opts in. No production authorization bypass. */
export async function installSyntheticLibraryFixture() {
  const roots = [process.cwd(), join(process.cwd(), ".next", "standalone")];
  const snapshots = new Map<string, Buffer | null>();
  async function write(path: string, bytes: Uint8Array | string) {
    if (!snapshots.has(path)) {
      try {
        snapshots.set(path, await readFile(path));
      } catch (error) {
        if (!(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ))
          throw error;
        snapshots.set(path, null);
      }
    }
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  async function restore() {
    for (const [path, original] of [...snapshots].reverse()) {
      if (original === null) await rm(path, { force: true });
      else await writeFile(path, original);
    }
  }
  const document = syntheticLibraryDocument();
  const pdf = await PDFDocument.create();
  for (let index = 0; index < document.pageCount; index++)
    pdf.addPage([200, 200]).drawText(`SYNTHETIC TEST PAGE ${index + 1}`, {
      x: 10,
      y: 100,
      size: 10,
    });
  const pdfBytes = await pdf.save();
  const { default: sharp } = await import("sharp");
  const jpeg = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#d8d8d8" },
  })
    .jpeg()
    .toBuffer();
  const webp = await sharp(jpeg).webp().toBuffer();
  const hash = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  document.originalSha256 = hash(pdfBytes);
  for (const page of document.pages) {
    page.sourceSha256 = hash(jpeg);
    page.previewSha256 = hash(webp);
    page.teacher = [
      "Explicação didática da EDSON OFICINA: confirme a aplicação da ferramenta antes de travar o motor.",
    ];
  }
  async function authorize(confirmed: boolean) {
    for (const root of roots)
      await write(
        join(root, "src/lib/academy/library/authorization.json"),
        JSON.stringify({
          confirmed,
          scope: confirmed ? [5] : [],
          statement:
            "AUTORIZAÇÃO SINTÉTICA EXCLUSIVA DO TESTE ISOLADO; não se refere aos PDFs enviados pelo usuário.",
        }),
      );
  }
  try {
    for (const root of roots) {
      await write(
        join(root, "src/lib/academy/library/data/aula-05.json"),
        JSON.stringify(document),
      );
      await write(
        join(root, "academy-materials/library/aula-05/original.pdf"),
        pdfBytes,
      );
      for (const page of document.pages) {
        await write(
          join(root, "academy-materials/library/aula-05", page.image!),
          jpeg,
        );
        await write(
          join(root, "academy-materials/library/aula-05", page.preview!),
          webp,
        );
      }
    }
    await authorize(false);
    return { document, authorize, restore };
  } catch (error) {
    await restore();
    throw error;
  }
}
