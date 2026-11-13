import test from "node:test";
import assert from "node:assert/strict";
import { studySteps } from "../src/lib/academy/content";
import {
  sourceTables,
  unconfirmedClassification,
} from "../src/lib/academy/source-tables";
import { stepNarration, narrationChunks } from "../src/lib/academy/narration";
import { publicQuestions } from "../src/lib/academy/questions";
test("leitura abrange as 14 etapas, fundamentos, diagnóstico e dez perguntas finais", () => {
  for (const step of studySteps) {
    const text = stepNarration(step, publicQuestions(step.id)).join(" ");
    assert.ok(text.includes(step.title));
    for (const objective of step.objectives)
      assert.ok(text.includes(objective));
    for (const explanation of step.explanation)
      assert.ok(text.includes(explanation));
    for (const question of publicQuestions(step.id)) {
      assert.ok(text.includes(question.prompt));
      for (const option of question.options) assert.ok(text.includes(option));
    }
    assert.match(text, /Fim da leitura/);
    assert.ok(narrationChunks([text]).every((c) => c.length <= 300));
  }
});
test("as 93 linhas e oito classificações interferentes são lidas sem converter incerteza", () => {
  let total = 0,
    confirmed = 0;
  for (const step of studySteps.filter((s) => s.kind === "manufacturer")) {
    const rows = sourceTables[step.id];
    assert.equal(rows.length, step.rows);
    total += rows.length;
    const text = stepNarration(step, []).join(" ");
    for (const [i, [motor, carros, tipo, classification]] of rows.entries()) {
      assert.ok(
        text.includes(
          `Linha ${i + 1}. Motor: ${motor}. Carros: ${carros}. Tipo de acionamento: ${tipo}. Classificação na fonte: ${classification || unconfirmedClassification}.`,
        ),
      );
      if (classification) confirmed++;
    }
    assert.ok(text.includes(step.sourceAlert!));
    assert.ok(text.includes(step.sourceTip!));
  }
  assert.equal(total, 93);
  assert.equal(confirmed, 8);
});
test("segmentação conserva todo o texto em trechos limitados, inclusive códigos e frases longas", () => {
  const samples = [
    "Motor EA211 1.4 TSI / 250 TSI. Não force a rotação.",
    "Uma frase muito longa para verificar a sequência ".repeat(40),
    "X".repeat(750),
    "",
    "  Admissão.\n\nEscape.  ",
  ];
  const chunks = narrationChunks(samples);
  assert.ok(chunks.every((c) => c.length > 0 && c.length <= 300));
  assert.equal(
    chunks.join("").replace(/\s/g, ""),
    samples.join("").replace(/\s/g, ""),
  );
  assert.throws(() => narrationChunks(["Texto"], 0), /inválido/);
});
