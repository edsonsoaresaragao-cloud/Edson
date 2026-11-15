import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  rm,
  readFile,
  stat,
  utimes,
  symlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { libraryCourses } from "../src/lib/academy/library/catalog";
import { libraryDocumentSchema } from "../src/lib/academy/library/types";
import {
  publicationStatus,
  verifyLibraryMaterials,
} from "../src/lib/academy/library/access";

const hash = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "academy-library-integrity-"));
  const course = { ...libraryCourses[2], expectedPages: 2 };
  // These bytes exercise the integrity boundary only, not PDF/image decoding.
  const files = new Map<string, Buffer>([
    [
      "original.pdf",
      Buffer.from("Synthetic original PDF bytes for an isolated hash test"),
    ],
    ["pagina-001.jpg", Buffer.from("Native image one")],
    ["preview-001.webp", Buffer.from("Preview image one")],
    ["pagina-002.jpg", Buffer.from("Native image two")],
    ["preview-002.webp", Buffer.from("Preview image two")],
  ]);
  for (const [filename, bytes] of files)
    await writeFile(join(root, filename), bytes);
  const document = libraryDocumentSchema.parse({
    courseNumber: course.number,
    pageCount: 2,
    originalSha256: hash(files.get("original.pdf")!),
    technicalReview: "verified",
    pages: [1, 2].map((number) => {
      const label = String(number).padStart(3, "0");
      return {
        number,
        title: `Página sintética ${number}`,
        transcript: ["Texto sintético usado somente no teste."],
        description: "Imagem sintética para teste de integridade.",
        review: "verified",
        image: `pagina-${label}.jpg`,
        preview: `preview-${label}.webp`,
        sourceSha256: hash(files.get(`pagina-${label}.jpg`)!),
        previewSha256: hash(files.get(`preview-${label}.webp`)!),
      };
    }),
    questions: Array.from({ length: 10 }, (_, index) => ({
      id: `synthetic-${index}`,
      step: "avaliacao",
      pages: [1],
      prompt: "Questão sintética?",
      options: ["Sim", "Não"],
      correctIndex: 0,
      explanation: "Explicação sintética.",
      review: "verified",
    })),
  });
  return {
    root,
    course,
    document,
    files,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("integridade confere PDF original, imagens nativas e previews contra seus hashes editoriais", async () => {
  const { root, course, document, cleanup } = await fixture();
  try {
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    // Changing only the expected editorial digest must invalidate a cached approval.
    assert.equal(
      await verifyLibraryMaterials(
        course,
        { ...document, originalSha256: "a".repeat(64) },
        root,
      ),
      false,
    );
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    assert.equal(
      await verifyLibraryMaterials(
        course,
        {
          ...document,
          pages: document.pages.map((page, index) =>
            index === 0 ? { ...page, previewSha256: "c".repeat(64) } : page,
          ),
        },
        root,
      ),
      false,
    );
  } finally {
    await cleanup();
  }
});

test("cache não aprova PDF truncado, imagem alterada de mesmo tamanho ou preview substituído", async () => {
  const { root, course, document, files, cleanup } = await fixture();
  try {
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    await writeFile(
      join(root, "original.pdf"),
      files.get("original.pdf")!.subarray(0, 7),
    );
    assert.equal(await verifyLibraryMaterials(course, document, root), false);
    await writeFile(join(root, "original.pdf"), files.get("original.pdf")!);
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    const filename = join(root, "pagina-001.jpg");
    const before = await stat(filename);
    const changed = Buffer.from(await readFile(filename));
    changed[0] ^= 1;
    await writeFile(filename, changed);
    await utimes(filename, before.atime, before.mtime);
    assert.equal(await verifyLibraryMaterials(course, document, root), false);
    await writeFile(filename, files.get("pagina-001.jpg")!);
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    await writeFile(join(root, "preview-002.webp"), "Wrong preview");
    assert.equal(await verifyLibraryMaterials(course, document, root), false);
  } finally {
    await cleanup();
  }
});

test("páginas não podem repetir outro arquivo, atravessar diretórios ou perder um arquivo após a aprovação", async () => {
  const { root, course, document, files, cleanup } = await fixture();
  try {
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    const remapped = {
      ...document,
      pages: [
        document.pages[0],
        {
          ...document.pages[1],
          image: document.pages[0].image,
          sourceSha256: document.pages[0].sourceSha256,
        },
      ],
    };
    assert.equal(await verifyLibraryMaterials(course, remapped, root), false);
    assert.equal(
      await verifyLibraryMaterials(
        course,
        {
          ...document,
          pages: document.pages.map((page, index) =>
            index === 0 ? { ...page, image: "../pagina-001.jpg" } : page,
          ),
        },
        root,
      ),
      false,
    );
    await rm(join(root, "pagina-002.jpg"));
    assert.equal(await verifyLibraryMaterials(course, document, root), false);
    await writeFile(join(root, "pagina-002.jpg"), files.get("pagina-002.jpg")!);
    assert.equal(await verifyLibraryMaterials(course, document, root), true);
    await rm(join(root, "pagina-002.jpg"));
    await symlink(join(root, "pagina-001.jpg"), join(root, "pagina-002.jpg"));
    assert.equal(await verifyLibraryMaterials(course, document, root), false);
  } finally {
    await cleanup();
  }
});

test("preview sem hash não libera publicação e PDF adaptado também precisa de hash íntegro", async () => {
  const { root, course, document, cleanup } = await fixture();
  try {
    const authorization = {
      confirmed: true,
      scope: [course.number],
      statement: "Somente um teste sintético.",
    };
    assert.equal(
      publicationStatus(course, document, authorization).ready,
      true,
    );
    const missingHash = {
      ...document,
      pages: document.pages.map((page, index) =>
        index === 0 ? { ...page, previewSha256: undefined } : page,
      ),
    };
    assert.equal(
      publicationStatus(course, missingHash, authorization).ready,
      false,
    );
    assert.equal(
      await verifyLibraryMaterials(course, missingHash, root),
      false,
    );
    const adapted = "Synthetic adapted PDF bytes";
    await writeFile(join(root, "adaptado.pdf"), adapted);
    const adaptedDocument = {
      ...document,
      adaptedFilename: "adaptado.pdf",
      adaptedSha256: hash(adapted),
    };
    assert.equal(
      await verifyLibraryMaterials(course, adaptedDocument, root),
      true,
    );
    await writeFile(join(root, "adaptado.pdf"), "Truncated");
    assert.equal(
      await verifyLibraryMaterials(course, adaptedDocument, root),
      false,
    );
  } finally {
    await cleanup();
  }
});
