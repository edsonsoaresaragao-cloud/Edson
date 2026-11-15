import test from "node:test";
import assert from "node:assert/strict";
import {
  libraryCourses,
  isLibraryCourseId,
  pageStep,
} from "../src/lib/academy/library/catalog";
import {
  publicationStatus,
  publicLibraryDocument,
  loadLibraryDocument,
  canViewLibraryMaterial,
} from "../src/lib/academy/library/access";
import {
  publicQuestionBank,
  gradeLibraryStep,
} from "../src/lib/academy/library/questions";
import { changeLibraryProgress } from "../src/lib/academy/library/progress";
import {
  memoryLibraryRepository,
  syntheticLibraryDocument,
} from "./fixtures/library";

const authorization = {
  confirmed: true,
  scope: [3, 4, 5, 6, 7, 8, 9, 10],
  statement: "Autorização sintética exclusivamente para teste.",
};
const course = libraryCourses.find((value) => value.number === 5)!;
test("fontes autorizadas e íntegras podem ser consultadas antes da revisão didática", async () => {
  const source = await loadLibraryDocument(course);
  assert.ok(source);
  const pending = { ...source, technicalReview: "pending" as const };
  assert.equal(publicationStatus(course, pending, authorization).ready, false);
  assert.equal(
    await canViewLibraryMaterial(course, pending, authorization),
    true,
  );
  assert.equal(
    await canViewLibraryMaterial(course, pending, {
      confirmed: false,
      scope: [],
    }),
    false,
  );
  assert.equal(
    await canViewLibraryMaterial(course, null, authorization),
    false,
  );
  assert.equal(
    await canViewLibraryMaterial(
      course,
      { ...pending, originalSha256: "0".repeat(64) },
      authorization,
    ),
    false,
  );
});
test("oito aulas têm IDs isolados, 358 páginas esperadas e nenhuma carga horária inventada", () => {
  assert.equal(libraryCourses.length, 8);
  assert.equal(
    libraryCourses.reduce((sum, value) => sum + value.expectedPages, 0),
    358,
  );
  assert.equal(new Set(libraryCourses.map((value) => value.id)).size, 8);
  assert.ok(
    libraryCourses.every(
      (value) => value.hours === null && isLibraryCourseId(value.id),
    ),
  );
  assert.equal(
    isLibraryCourseId("academy-aula-02-conferencia-final-v1"),
    false,
  );
});
test("publicação bloqueia autorização ausente, páginas faltantes e qualquer transcrição não conferida", () => {
  const document = syntheticLibraryDocument();
  assert.equal(publicationStatus(course, document, authorization).ready, true);
  assert.equal(
    publicationStatus(course, document, { confirmed: false, scope: [] }).ready,
    false,
  );
  assert.equal(publicationStatus(course, null, authorization).ready, false);
  assert.equal(
    publicationStatus(
      course,
      { ...document, pages: document.pages.slice(1) },
      authorization,
    ).ready,
    false,
  );
  assert.equal(
    publicationStatus(
      course,
      { ...document, technicalReview: "pending" },
      authorization,
    ).ready,
    false,
  );
  assert.equal(
    publicationStatus(
      course,
      {
        ...document,
        pages: document.pages.map((page, index) =>
          index === 1 ? { ...page, review: "pending" } : page,
        ),
      },
      authorization,
    ).ready,
    false,
  );
  assert.equal(
    publicationStatus(
      course,
      { ...document, questions: document.questions.slice(0, -1) },
      authorization,
    ).ready,
    false,
  );
});
test("dados públicos não contêm gabarito e a correção recusa respostas estranhas ou incompletas", () => {
  const document = syntheticLibraryDocument();
  assert.equal("questions" in publicLibraryDocument(document), false);
  for (const questions of Object.values(publicQuestionBank(document)))
    for (const question of questions) {
      assert.equal("correctIndex" in question, false);
      assert.equal("explanation" in question, false);
    }
  assert.throws(
    () => gradeLibraryStep(document, "avaliacao", { estranho: 0 }),
    /não pertence/,
  );
  assert.throws(
    () => gradeLibraryStep(document, "pagina-2", {}),
    /todas as perguntas/,
  );
  const pending = {
    ...document,
    questions: document.questions.map((question) => ({
      ...question,
      review: "pending" as const,
    })),
  };
  assert.throws(() => gradeLibraryStep(pending, "avaliacao", {}), /em revisão/);
  assert.equal(publicQuestionBank(pending)["pagina-2"].length, 0);
});
test("visitar não conclui, estudo é explícito e tentativas/retomada são separadas por aluno e aula", async () => {
  const document = syntheticLibraryDocument();
  const { repo, attempts } = memoryLibraryRepository(document);
  const second = memoryLibraryRepository(document).repo;
  await assert.rejects(
    changeLibraryProgress(repo, document, "ana", {
      action: "visit",
      step: "pagina-1",
    }),
    /Inicie/,
  );
  await changeLibraryProgress(repo, document, "ana", { action: "start" });
  await changeLibraryProgress(repo, document, "ana", { action: "start" });
  await changeLibraryProgress(repo, document, "ana", {
    action: "visit",
    step: "pagina-3",
  });
  assert.equal((await repo.load("ana")).percent, 0);
  await assert.rejects(
    changeLibraryProgress(repo, document, "ana", {
      action: "complete",
      step: "pagina-1",
    }),
    /Confirme/,
  );
  await changeLibraryProgress(repo, document, "ana", {
    action: "complete",
    step: "pagina-1",
    studied: true,
  });
  await changeLibraryProgress(repo, document, "ana", {
    action: "complete",
    step: "pagina-2",
    studied: true,
    answers: { "practice-1": 1, "practice-2": 1 },
  });
  assert.equal((await repo.load("ana")).completed.length, 1);
  assert.equal(attempts[1].score, 0);
  assert.deepEqual(attempts[1].answers, { "practice-1": 1, "practice-2": 1 });
  assert.equal((await repo.load("bia")).started, false);
  assert.equal((await second.load("ana")).started, false);
  assert.equal((await repo.load("ana")).lastStep, "pagina-1");
});
test("avaliação exige páginas estudadas, 60% não aprova e 70% conclui com data e melhor nota", async () => {
  const document = syntheticLibraryDocument();
  const { repo, attempts } = memoryLibraryRepository(document);
  await changeLibraryProgress(repo, document, "ana", { action: "start" });
  await assert.rejects(
    changeLibraryProgress(repo, document, "ana", {
      action: "complete",
      step: "avaliacao",
    }),
    /Conclua/,
  );
  for (const page of document.pages)
    await changeLibraryProgress(repo, document, "ana", {
      action: "complete",
      step: pageStep(page.number),
      studied: true,
      answers: page.number === 2 ? { "practice-1": 0, "practice-2": 0 } : {},
    });
  const final = (correct: number) =>
    Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `final-${index + 1}`,
        index < correct ? 0 : 1,
      ]),
    );
  await changeLibraryProgress(repo, document, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: final(6),
  });
  assert.equal((await repo.load("ana")).eligible, false);
  await changeLibraryProgress(repo, document, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: final(7),
  });
  const result = await repo.load("ana");
  assert.equal(result.percent, 100);
  assert.equal(
    result.completed.find((value) => value.step === "avaliacao")?.score,
    70,
  );
  assert.ok(
    result.completed.every(
      (value) => !Number.isNaN(Date.parse(value.completedAt)),
    ),
  );
  assert.deepEqual(
    attempts.slice(-2).map((value) => value.score),
    [60, 70],
  );
});
test("material ausente falha fechado e nomes de arquivo fora da lista não são lidos", async () => {
  assert.equal(await loadLibraryDocument(libraryCourses[0]), null);
  const { GET } =
    await import("../src/app/api/academy/library/[slug]/material/[file]/route");
  assert.equal(
    (
      await GET(new Request("http://localhost"), {
        params: Promise.resolve({
          slug: course.slug,
          file: "../../secret.env",
        }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await GET(new Request("http://localhost"), {
        params: Promise.resolve({ slug: "unknown", file: "original.pdf" }),
      })
    ).status,
    404,
  );
});
