import { readFile, lstat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  getLibraryCourse,
  libraryCourses,
  examStep,
  pageStep,
} from "./catalog";
import { publicQuestionBank } from "./questions";
import {
  libraryDocumentSchema,
  type LibraryAuthorization,
  type LibraryCourse,
  type LibraryDocument,
  type LibraryPublicationStatus,
  type PublicLibraryDocument,
} from "./types";
import { StudyError } from "../progress";

const editorialRoot = () =>
  join(process.cwd(), "src", "lib", "academy", "library");
export const libraryMaterialRoot = (course: LibraryCourse) =>
  join(
    process.cwd(),
    "academy-materials",
    "library",
    `aula-${String(course.number).padStart(2, "0")}`,
  );

export async function loadLibraryDocument(
  course: LibraryCourse,
): Promise<LibraryDocument | null> {
  try {
    const file = join(
      editorialRoot(),
      "data",
      `aula-${String(course.number).padStart(2, "0")}.json`,
    );
    const data: unknown = JSON.parse(await readFile(file, "utf8"));
    if (
      data &&
      typeof data === "object" &&
      "status" in data &&
      data.status === "missing"
    )
      return null;
    return libraryDocumentSchema.parse(data);
  } catch (error) {
    if (!(
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ))
      console.error("academy_library_editorial_data_invalid", course.number);
    return null;
  }
}

export async function loadLibraryAuthorization(): Promise<LibraryAuthorization> {
  try {
    return z
      .object({
        confirmed: z.boolean(),
        scope: z.array(z.number().int()),
        statement: z.string().optional(),
        confirmedAt: z.string().optional(),
      })
      .parse(
        JSON.parse(
          await readFile(join(editorialRoot(), "authorization.json"), "utf8"),
        ),
      );
  } catch {
    return { confirmed: false, scope: [] };
  }
}

export function publicationStatus(
  course: LibraryCourse,
  document: LibraryDocument | null,
  authorization: LibraryAuthorization,
): LibraryPublicationStatus {
  const reasons: string[] = [];
  if (
    !authorization.confirmed ||
    !authorization.scope.includes(course.number) ||
    !authorization.statement?.trim()
  )
    reasons.push("Autorização específica de reprodução e adaptação pendente.");
  const receivedPages = document?.pages.length || 0;
  const reviewedPages =
    document?.pages.filter((page) => page.review === "verified").length || 0;
  if (
    !document ||
    document.courseNumber !== course.number ||
    document.pageCount !== course.expectedPages ||
    receivedPages !== course.expectedPages ||
    document.pages.some((page, index) => page.number !== index + 1)
  )
    reasons.push(
      "O documento completo ainda não está disponível para esta aula.",
    );
  if (document) {
    if (
      document.technicalReview !== "verified" ||
      reviewedPages !== course.expectedPages ||
      document.pages.some(
        (page) =>
          !page.transcript.some((line) => line.trim()) ||
          !page.description.trim() ||
          !page.image ||
          !page.preview ||
          !page.sourceSha256?.match(/^[a-f0-9]{64}$/),
      )
    )
      reasons.push(
        "Transcrições, imagens e valores técnicos aguardam conferência integral.",
      );
    if (!materialEntries(course, document))
      reasons.push(
        "A identificação e os hashes dos arquivos integrais aguardam conferência.",
      );
    const knownSteps = new Set([
      ...document.pages.map((page) => pageStep(page.number)),
      examStep,
    ]);
    const ids = new Set(document.questions.map((question) => question.id));
    if (
      document.questions.filter(
        (question) =>
          question.step === examStep && question.review === "verified",
      ).length < 10 ||
      ids.size !== document.questions.length ||
      document.questions.some(
        (question) =>
          question.review !== "verified" ||
          !knownSteps.has(question.step) ||
          question.correctIndex >= question.options.length ||
          question.pages.some(
            (number) =>
              !document.pages.some(
                (page) => page.number === number && page.review === "verified",
              ),
          ),
      )
    )
      reasons.push(
        "Perguntas e avaliação final aguardam conferência com suas páginas de origem.",
      );
  }
  return { ready: reasons.length === 0, reasons, receivedPages, reviewedPages };
}

export async function hasLibraryEditorAccess() {
  if (!(await cookies()).has("edson_session")) return false;
  const { currentUser } = await import("@/lib/auth");
  const user = await currentUser();
  return Boolean(user && ["ADMIN", "EDITOR"].includes(user.role));
}

export function publicLibraryDocument(
  document: LibraryDocument,
): PublicLibraryDocument {
  const { questions: _questions, ...safe } = document;
  return safe;
}

type MaterialEntry = { filename: string; sha256: string };
const sha256Pattern = /^[a-f0-9]{64}$/;
function materialEntries(
  course: LibraryCourse,
  document: LibraryDocument,
): MaterialEntry[] | null {
  if (
    document.courseNumber !== course.number ||
    document.pageCount !== course.expectedPages ||
    document.pages.length !== course.expectedPages ||
    !sha256Pattern.test(document.originalSha256)
  )
    return null;
  const entries: MaterialEntry[] = [
    { filename: "original.pdf", sha256: document.originalSha256 },
  ];
  for (const [index, page] of document.pages.entries()) {
    const number = String(index + 1).padStart(3, "0");
    if (
      page.number !== index + 1 ||
      page.image !== `pagina-${number}.jpg` ||
      page.preview !== `preview-${number}.webp` ||
      !page.sourceSha256 ||
      !sha256Pattern.test(page.sourceSha256) ||
      !page.previewSha256 ||
      !sha256Pattern.test(page.previewSha256)
    )
      return null;
    entries.push(
      { filename: page.image, sha256: page.sourceSha256 },
      { filename: page.preview, sha256: page.previewSha256 },
    );
  }
  if (document.pdfParts) {
    if (document.pdfParts.length !== 2) return null;
    let nextPage = 1;
    for (const [index, part] of document.pdfParts.entries()) {
      if (
        part.filename !== `parte-0${index + 1}.pdf` ||
        part.firstPage !== nextPage ||
        part.lastPage < part.firstPage ||
        !sha256Pattern.test(part.sha256)
      )
        return null;
      entries.push({ filename: part.filename, sha256: part.sha256 });
      nextPage = part.lastPage + 1;
    }
    if (nextPage !== document.pageCount + 1) return null;
  }
  if (document.adaptedFilename || document.adaptedSha256) {
    if (
      document.adaptedFilename !== "adaptado.pdf" ||
      !document.adaptedSha256 ||
      !sha256Pattern.test(document.adaptedSha256)
    )
      return null;
    entries.push({ filename: "adaptado.pdf", sha256: document.adaptedSha256 });
  }
  return entries;
}

// At most four streams are open; large source PDFs are never buffered in memory.
async function mapMaterials<T>(
  entries: MaterialEntry[],
  operation: (entry: MaterialEntry) => Promise<T>,
): Promise<T[]> {
  const results: T[] = new Array(entries.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, entries.length) }, async () => {
      while (next < entries.length) {
        const index = next++;
        results[index] = await operation(entries[index]);
      }
    }),
  );
  return results;
}

const materialChecks = new Map<string, { signature: string; valid: boolean }>();
const MAX_MATERIAL_CHECKS = 16;
async function materialSignature(root: string, entries: MaterialEntry[]) {
  const identities = await mapMaterials(entries, async ({ filename }) => {
    const info = await lstat(join(root, filename), { bigint: true });
    if (!info.isFile()) throw new Error("Material is not a regular file");
    return [
      filename,
      String(info.dev),
      String(info.ino),
      String(info.size),
      String(info.mtimeNs),
      String(info.ctimeNs),
    ];
  });
  return createHash("sha256")
    .update(JSON.stringify({ entries, identities }))
    .digest("hex");
}

/** Validate the editorial hashes, not merely the existence of a filename.
 * rootDirectory is supplied only by isolated filesystem tests; app routes always
 * use the fixed per-course directory. Every call checks fresh file identities.
 */
export async function verifyLibraryMaterials(
  course: LibraryCourse,
  document: LibraryDocument,
  rootDirectory = libraryMaterialRoot(course),
) {
  const entries = materialEntries(course, document);
  if (!entries) return false;
  const root = resolve(rootDirectory);
  const key = `${course.id}:${root}`;
  try {
    const signature = await materialSignature(root, entries);
    const cached = materialChecks.get(key);
    if (cached?.signature === signature) {
      materialChecks.delete(key);
      materialChecks.set(key, cached);
      return cached.valid;
    }
    const matches = await mapMaterials(
      entries,
      async ({ filename, sha256 }) => {
        const digest = createHash("sha256");
        for await (const bytes of createReadStream(join(root, filename)))
          digest.update(bytes);
        return digest.digest("hex") === sha256;
      },
    );
    // A change during verification must not become a cached approval.
    if (signature !== (await materialSignature(root, entries))) {
      materialChecks.delete(key);
      return false;
    }
    const valid = matches.every(Boolean);
    materialChecks.delete(key);
    materialChecks.set(key, { signature, valid });
    while (materialChecks.size > MAX_MATERIAL_CHECKS)
      materialChecks.delete(materialChecks.keys().next().value!);
    return valid;
  } catch {
    materialChecks.delete(key);
    return false;
  }
}

/** Authorized, intact source pages can be consulted while teaching content is reviewed. */
export async function canViewLibraryMaterial(
  course: LibraryCourse,
  document: LibraryDocument | null,
  authorization: LibraryAuthorization,
) {
  if (
    !document ||
    !authorization.confirmed ||
    !authorization.scope.includes(course.number) ||
    !authorization.statement?.trim()
  )
    return false;
  return verifyLibraryMaterials(course, document);
}

export async function libraryReadiness(
  course: LibraryCourse,
  document: LibraryDocument | null,
) {
  const status = publicationStatus(
    course,
    document,
    await loadLibraryAuthorization(),
  );
  if (status.ready && document) {
    if (!(await verifyLibraryMaterials(course, document))) {
      status.ready = false;
      status.reasons.push(
        "Arquivos integrais ausentes ou diferentes da referência conferida.",
      );
    }
  }
  return status;
}

export async function requirePublishedLibraryCourse(slug: string) {
  const course = getLibraryCourse(slug);
  if (!course) throw new StudyError("Aula não encontrada.", 404);
  const document = await loadLibraryDocument(course);
  const status = await libraryReadiness(course, document);
  if (!document || !status.ready)
    throw new StudyError(
      "Aula em preparação editorial. Matrícula e conclusão ficam disponíveis após a conferência integral.",
      409,
    );
  return { course, document, status };
}

export async function getLibraryDirectory() {
  const authorization = await loadLibraryAuthorization();
  return Promise.all(
    libraryCourses.map(async (course) => {
      const document = await loadLibraryDocument(course);
      const viewable = await canViewLibraryMaterial(
        course,
        document,
        authorization,
      );
      return {
        number: course.number,
        slug: course.slug,
        title: course.title,
        pageCount: document?.pageCount || 0,
        viewable,
        ready:
          viewable && publicationStatus(course, document, authorization).ready,
      };
    }),
  );
}

export async function getReadyLibrarySlugs() {
  return (await getLibraryDirectory())
    .filter((status) => status.ready)
    .map((status) => status.slug);
}

export async function getLibraryAccess(slug: string) {
  const course = getLibraryCourse(slug);
  if (!course) return null;
  const document = await loadLibraryDocument(course);
  const authorization = await loadLibraryAuthorization();
  const canView = await canViewLibraryMaterial(course, document, authorization);
  const status = publicationStatus(course, document, authorization);
  if (status.ready && !canView) {
    status.ready = false;
    status.reasons.push(
      "Arquivos integrais ausentes ou diferentes da referência conferida.",
    );
  }
  const editorPreview = !status.ready && (await hasLibraryEditorAccess());
  const permitted = canView || editorPreview;
  const preview = !status.ready && permitted;
  return {
    course,
    status,
    preview,
    canView,
    canStudy: status.ready,
    document: document && permitted ? publicLibraryDocument(document) : null,
    questions:
      document && (status.ready || editorPreview)
        ? publicQuestionBank(document)
        : {},
    availableLessons: !document
      ? (await getLibraryDirectory()).filter((lesson) => lesson.viewable)
      : [],
  };
}
