import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, normalize, slugify, searchTerms } from "../src/lib/catalog";
import { modulesSchema, passwordSchema } from "../src/lib/validation";
test("classifica múltiplos sistemas por metadados sem alegar análise audiovisual", () => {
  const result = classify("Teste de sonda lambda e pastilha com ABS");
  assert.ok(result.categories.includes("injecao-eletronica"));
  assert.ok(result.categories.includes("freios-e-abs"));
  assert.ok(result.confidence > 0 && result.confidence < 1);
  assert.deepEqual(
    classify("Sem evidências técnicas específicas").categories,
    [],
  );
});
test("normaliza acentos e expande sintoma de partida", () => {
  assert.equal(normalize("Injeção ELÉTRICA"), "injecao eletrica");
  assert.equal(slugify("Câmbio CVT"), "cambio-cvt");
  assert.ok(searchTerms("HB20 não liga").includes("bateria"));
});
test("rejeita questionários sem alternativa correta válida e senha truncável por bcrypt", () => {
  assert.equal(passwordSchema.safeParse("á".repeat(40)).success, false);
  assert.equal(
    modulesSchema.safeParse([
      {
        title: "Módulo",
        lessons: [
          {
            title: "Aula",
            body: "Conteúdo educativo extenso",
            questions: [
              { prompt: "Pergunta", options: ["A", "B"], correctIndex: 2 },
            ],
          },
        ],
      },
    ]).success,
    false,
  );
});

test("reconhece os 34 assuntos e evita falsos positivos por trechos de palavras", async () => {
  const { categoryNames } = await import("../src/lib/catalog");
  for (const name of categoryNames) {
    assert.ok(classify(name).categories.includes(slugify(name)), name);
  }
  assert.ok(
    classify("teste do alternador e pressão de óleo").categories.includes(
      "alternador",
    ),
  );
  assert.ok(
    classify("teste do alternador e pressão de óleo").categories.includes(
      "lubrificacao",
    ),
  );
  assert.ok(
    !classify("Um resultado absolutamente normal").categories.includes(
      "freios-e-abs",
    ),
  );
  assert.ok(
    !classify("Oficina Brasil Oficial — teste de radiador").categories.includes(
      "gestao-de-oficinas",
    ),
  );
});
