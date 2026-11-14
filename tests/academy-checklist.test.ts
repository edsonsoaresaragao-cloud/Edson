import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import {
  sourcePages,
  pageTranscript,
  steps,
  ADAPTED_PDF,
  COURSE_ID,
  lessonId,
} from "../src/lib/academy/checklist/content";
import {
  gradeStep,
  questionsFor,
  publicQuestions,
  finalQuestions,
} from "../src/lib/academy/checklist/questions";
import { changeProgress } from "../src/lib/academy/checklist/progress";
import { narrationChunks } from "../src/lib/academy/narration";
import { COURSE_ID as FIRST_COURSE_ID } from "../src/lib/academy/content";
import { memoryChecklistRepository } from "./fixtures/checklist-progress";
const answers = (step: string) =>
  Object.fromEntries(questionsFor(step).map((q) => [q.id, q.correctIndex]));
const checks = (step: string) =>
  Array.from({ length: 7 }, (_, i) => `${step}:${i + 1}`);
test("Aula 02 tem cinco etapas e preserva os 21 pontos e as quatro transcrições completas", () => {
  assert.equal(steps.length, 5);
  assert.notEqual(COURSE_ID, FIRST_COURSE_ID);
  assert.deepEqual(
    sourcePages.map((p) => p.points.length),
    [0, 7, 7, 7],
  );
  assert.deepEqual(
    sourcePages
      .slice(1)
      .map((page) =>
        page.points.reduce((n, point) => n + point.lines.length, 0),
      ),
    [14, 15, 16],
  );
  for (const page of sourcePages) {
    const text = pageTranscript(page);
    const chunks = narrationChunks(text, 180);
    assert.ok(chunks.length);
    assert.ok(chunks.every((c) => c.length <= 180));
    assert.equal(
      chunks.join(" "),
      text.map((p) => p.replace(/\s+/gu, " ").trim()).join(" "),
    );
    for (const point of page.points)
      for (const line of point.lines)
        assert.ok(chunks.join(" ").includes(line.text));
    assert.ok(chunks.join(" ").includes(page.footnote));
    if (page.page > 1) assert.match(page.footnote, /Bônus 06/);
  }
  assert.ok(
    sourcePages[2].points[5].lines.some((l) =>
      l.text.includes("Pescador limpo"),
    ),
  );
  assert.ok(
    sourcePages[3].points[2].lines.some((l) =>
      l.text.includes("o elo colorido não volta a alinhar"),
    ),
  );
});
test("quatro imagens completas e PDFs distintos têm integridade e resolução nativa", async () => {
  const root = "academy-materials/aula-02/";
  const manifest = JSON.parse(await readFile(root + "manifest.json", "utf8"));
  const original = await readFile(root + "original.pdf"),
    adapted = await readFile(root + ADAPTED_PDF);
  const hash = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  assert.equal(
    hash(original),
    "1ef65233b118f5cb0e9df54e9c728e2279c362346444580f4c4abffcef028274",
  );
  assert.equal(hash(original), manifest.originalSha256);
  assert.equal(hash(adapted), manifest.adaptedSha256);
  assert.notDeepEqual(original, adapted);
  assert.equal((await PDFDocument.load(original)).getPageCount(), 4);
  assert.equal((await PDFDocument.load(adapted)).getPageCount(), 4);
  for (const page of manifest.pages) {
    const png = await readFile(root + page.file);
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1536);
    assert.equal(hash(png), page.sha256);
    assert.equal(page.identicalOutsideHeader, true);
  }
});
test("banco de correção fica fora das perguntas públicas e IDs não se misturam", () => {
  for (const step of steps) {
    assert.ok(lessonId(step.id).startsWith(COURSE_ID));
    for (const q of publicQuestions(step.id)) {
      assert.equal("correctIndex" in q, false);
      assert.equal("explanation" in q, false);
    }
  }
  assert.throws(
    () => gradeStep("correia-seca", { "final-1": 0 }),
    /não pertence/,
  );
  assert.throws(() => gradeStep("correia-seca", {}), /todas as perguntas/);
  assert.throws(() => gradeStep("inválida", {}), /inválida/);
});
test("visita não matricula e somente o estudo aprovado registra os sete pontos", async () => {
  const repo = memoryChecklistRepository();
  assert.equal((await repo.load("ana")).started, false);
  await assert.rejects(
    changeProgress(repo, "ana", { action: "visit", step: "corrente" }),
    /Inicie a aula/,
  );
  await changeProgress(repo, "ana", { action: "start" });
  await changeProgress(repo, "ana", { action: "start" });
  await changeProgress(repo, "ana", { action: "visit", step: "correia-seca" });
  assert.equal((await repo.load("ana")).percent, 0);
  await assert.rejects(
    changeProgress(repo, "ana", {
      action: "complete",
      step: "correia-seca",
      answers: answers("correia-seca"),
    }),
    /sete pontos/,
  );
  await assert.rejects(
    changeProgress(repo, "ana", {
      action: "complete",
      step: "correia-seca",
      checks: checks("corrente"),
      answers: answers("correia-seca"),
    }),
    /sete pontos/,
  );
  await changeProgress(repo, "ana", {
    action: "complete",
    step: "correia-seca",
    checks: checks("correia-seca"),
    answers: answers("correia-seca"),
  });
  assert.equal((await repo.load("ana")).percent, 20);
  assert.equal((await repo.load("ana")).lastStep, "correia-seca");
});
test("60% reprova e 70% aprova sem concluir as outras etapas ou outro aluno", async () => {
  const repo = memoryChecklistRepository();
  await changeProgress(repo, "ana", { action: "start" });
  await changeProgress(repo, "bia", { action: "start" });
  const attempt = (correct: number) =>
    Object.fromEntries(
      finalQuestions.map((q, i) => [
        q.id,
        i < correct ? q.correctIndex : (q.correctIndex + 1) % q.options.length,
      ]),
    );
  const failed = await changeProgress(repo, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: attempt(6),
  });
  assert.equal(failed.progress.percent, 0);
  assert.equal(failed.feedback.length, 10);
  const pass = await changeProgress(repo, "ana", {
    action: "complete",
    step: "avaliacao",
    answers: attempt(7),
  });
  assert.equal(pass.progress.percent, 20);
  assert.equal(pass.progress.eligible, false);
  assert.equal((await repo.load("bia")).percent, 0);
  for (const step of steps.filter((s) => s.id !== "avaliacao"))
    await changeProgress(repo, "ana", {
      action: "complete",
      step: step.id,
      answers: answers(step.id),
      checks: step.id === "introducao" ? [] : checks(step.id),
    });
  assert.equal((await repo.load("ana")).percent, 100);
  assert.equal((await repo.load("ana")).completed.length, 5);
  assert.ok((await repo.load("ana")).eligible);
});
test("entrega do material recusa arquivos arbitrários e serve os quatro PNGs e o PDF", async () => {
  const { GET } =
    await import("../src/app/api/academy/aula-02/material/[file]/route");
  const call = (file: string) =>
    GET(new Request("http://localhost"), { params: Promise.resolve({ file }) });
  assert.equal((await call("../../.env")).status, 404);
  assert.equal((await call("manifest.json")).status, 404);
  for (const page of sourcePages) {
    const response = await call(
      `pagina-${String(page.page).padStart(2, "0")}.png`,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/png");
  }
  const response = await call(ADAPTED_PDF);
  assert.equal(response.status, 200);
  assert.equal(
    (await PDFDocument.load(await response.arrayBuffer())).getPageCount(),
    4,
  );
});
