import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import {
  studySteps,
  COURSE_HOURS,
  PASSING_SCORE,
} from "../src/lib/academy/content";
import {
  gradeStep,
  questionsFor,
  publicQuestions,
  finalQuestions,
} from "../src/lib/academy/questions";
import {
  changeProgress,
  summarizeProgress,
  type ProgressRepository,
  type StudentProgress,
} from "../src/lib/academy/progress";
function memory() {
  const users = new Map<string, StudentProgress>();
  const repo: ProgressRepository = {
    async load(id) {
      return structuredClone(
        users.get(id) || summarizeProgress([], "introducao", false),
      );
    },
    async start(id) {
      if (!users.has(id)) users.set(id, summarizeProgress([]));
    },
    async visit(id, step) {
      const p = users.get(id)!;
      p.lastStep = step;
    },
    async complete(id, step, score) {
      const p = users.get(id)!;
      users.set(
        id,
        summarizeProgress(
          [
            ...p.completed.filter((v) => v.step !== step),
            { step, score, completedAt: new Date().toISOString() },
          ],
          step,
        ),
      );
    },
  };
  return repo;
}
const correct = (step: string) =>
  Object.fromEntries(questionsFor(step).map((q) => [q.id, q.correctIndex]));
test("11 páginas, dez fabricantes e 93 linhas permanecem na ordem da fonte", () => {
  const source = studySteps.filter((s) => s.page);
  assert.deepEqual(
    source.map((s) => s.page),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  assert.equal(studySteps.filter((s) => s.kind === "manufacturer").length, 10);
  assert.equal(
    source.reduce((n, s) => n + (s.rows || 0), 0),
    93,
  );
  assert.equal(studySteps.length, 14);
  assert.equal(COURSE_HOURS, 4);
  assert.equal(PASSING_SCORE, 70);
  for (const s of studySteps.filter((s) => s.kind === "manufacturer")) {
    assert.ok(s.sourceAlert);
    assert.ok(s.sourceTip);
    assert.equal(questionsFor(s.id).length, 1);
  }
});
test("original e adaptação têm onze páginas, imagens nativas e hashes íntegros", async () => {
  const root = "academy-materials/aula-01/",
    manifest = JSON.parse(await readFile(root + "manifest.json", "utf8"));
  const original = await readFile(root + "original.pdf"),
    adapted = await readFile(root + "aula-01.pdf");
  assert.equal(
    createHash("sha256").update(original).digest("hex"),
    manifest.originalSha256,
  );
  assert.equal(
    createHash("sha256").update(adapted).digest("hex"),
    manifest.adaptedSha256,
  );
  assert.notDeepEqual(original, adapted);
  assert.equal((await PDFDocument.load(original)).getPageCount(), 11);
  assert.equal((await PDFDocument.load(adapted)).getPageCount(), 11);
  for (const page of manifest.pages) {
    const image = await readFile(root + page.file);
    assert.equal(image.readUInt32BE(16), 1024);
    assert.equal(image.readUInt32BE(20), 1536);
    assert.equal(createHash("sha256").update(image).digest("hex"), page.sha256);
    assert.equal(page.identicalOutsideHeader, true);
  }
});
test("visita não matricula nem conclui, início é idempotente e posição pode ser retomada", async () => {
  const repo = memory();
  assert.equal((await repo.load("ana")).started, false);
  await assert.rejects(
    changeProgress(repo, "ana", { action: "visit", step: "ford" }),
    /Inicie a aula/,
  );
  await changeProgress(repo, "ana", { action: "start" });
  await changeProgress(repo, "ana", { action: "visit", step: "ford" });
  await changeProgress(repo, "ana", { action: "start" });
  const p = await repo.load("ana");
  assert.equal(p.lastStep, "ford");
  assert.equal(p.percent, 0);
  assert.equal(p.eligible, false);
});
test("respostas incompletas, IDs estrangeiros e notas forjadas não concluem etapas", async () => {
  const repo = memory();
  await changeProgress(repo, "ana", { action: "start" });
  await assert.rejects(
    changeProgress(repo, "ana", {
      action: "complete",
      step: "avaliacao",
      answers: {},
    }),
    /todas as perguntas/,
  );
  assert.throws(
    () => gradeStep("volkswagen", { "final-1": 1 }),
    /não pertence/,
  );
  assert.throws(() => gradeStep("nao-existe", {}), /inválida/);
  assert.throws(
    () => gradeStep("volkswagen", { "vw-1": 100 }),
    /todas as perguntas/,
  );
  assert.equal((await repo.load("ana")).completed.length, 0);
});
test("nota de 60% não conclui; 70% aprova com explicação das dez respostas", async () => {
  const repo = memory();
  await changeProgress(repo, "ana", { action: "start" });
  function attempt(count: number) {
    return Object.fromEntries(
      finalQuestions.map((q, i) => [
        q.id,
        i < count ? q.correctIndex : (q.correctIndex + 1) % q.options.length,
      ]),
    );
  }
  const failed = await changeProgress(repo, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: attempt(6),
  });
  assert.equal(failed.progress.completed.length, 0);
  assert.equal(failed.feedback.length, 10);
  const pass = await changeProgress(repo, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: attempt(7),
  });
  assert.equal(pass.progress.completed[0].score, 70);
  assert.equal(pass.progress.eligible, false);
  assert.ok(pass.feedback.every((f) => f.explanation.length > 20));
});
test("progresso é individual e certificado exige as catorze etapas aprovadas", async () => {
  const repo = memory();
  await changeProgress(repo, "ana", { action: "start" });
  await changeProgress(repo, "bia", { action: "start" });
  for (const step of studySteps)
    await changeProgress(repo, "ana", {
      action: "complete",
      step: step.id,
      answers: correct(step.id),
    });
  const ana = await repo.load("ana"),
    bia = await repo.load("bia");
  assert.equal(ana.percent, 100);
  assert.equal(ana.eligible, true);
  assert.equal(bia.percent, 0);
  assert.equal(bia.eligible, false);
  await changeProgress(repo, "ana", {
    action: "complete",
    step: "ford",
    answers: correct("ford"),
  });
  assert.equal((await repo.load("ana")).completed.length, 14);
});
test("banco público não revela índices nem explicações antes da correção", () => {
  for (const step of studySteps)
    for (const q of publicQuestions(step.id))
      assert.deepEqual(Object.keys(q).sort(), ["id", "options", "prompt"]);
});
test("rota de material aceita somente arquivos conhecidos, nunca caminhos arbitrários", async () => {
  const { GET } =
    await import("../src/app/api/academy/aula-01/material/[file]/route");
  const call = (file: string) =>
    GET(new Request("http://localhost/api"), {
      params: Promise.resolve({ file }),
    });
  assert.equal((await call("../../.env")).status, 404);
  assert.equal((await call("manifest.json")).status, 404);
  const image = await call("page-11.png");
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  const pdf = await call("aula-01.pdf");
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers.get("content-disposition")!, /attachment/);
});
