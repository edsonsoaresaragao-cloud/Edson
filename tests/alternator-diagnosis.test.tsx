import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  symptoms,
  stages,
  componentDiagnostics,
  dtcs,
  measures,
} from "../src/lib/alternator-diagnosis/content";
import {
  emptyCase,
  caseSchema,
  entrySchema,
  referenceUsable,
  applicationKey,
  administrativeReferenceIssue,
  type DiagnosticCase,
  type TechnicalEntry,
} from "../src/lib/alternator-diagnosis/schema";
import {
  evaluate,
  interpretMeasurements,
  nextDecision,
  reportReady,
} from "../src/lib/alternator-diagnosis/rules";
import { reportText } from "../src/lib/alternator-diagnosis/report";
import {
  caseHandler,
  type Store,
  type CaseRow,
} from "../src/lib/alternator-diagnosis/handlers";
import { AlternatorDiagnosis } from "../src/components/alternator-diagnosis/workbench";
function identified(): DiagnosticCase {
  const c = emptyCase();
  Object.assign(c.vehicle, {
    make: "Marca teste",
    model: "Modelo teste",
    yearVersion: "2020 versão A",
    engine: "1.0",
    partCode: "A123",
    management: "convencional",
    battery: "convencional",
  });
  c.reference = {
    title: "Manual teste de aplicação",
    url: "https://example.com/repair",
    date: "2020",
    application: applicationKey(c.vehicle),
    origin: "technician",
    entryId: "",
  };
  c.conditions = "Ensaio registrado conforme manual";
  return c;
}
test("base contempla 15 sintomas, oito etapas, 16 peças, nove DTCs e campos sem medições inventadas", () => {
  assert.equal(symptoms.length, 15);
  assert.equal(stages.length, 8);
  assert.deepEqual(
    componentDiagnostics.map((c) => c.number),
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
  for (const c of componentDiagnostics) {
    assert.ok(c.procedure.length > 40);
    assert.ok(c.principle && c.location && c.expected && c.criterion);
  }
  assert.equal(dtcs.length, 9);
  assert.ok(dtcs.every((d) => d.confirmation.includes("isolado")));
  assert.deepEqual(emptyCase().measurements, {});
  assert.ok(measures.length >= 16);
});
test("12 V, 24 V e gerenciamento inteligente não adotam faixa genérica de aprovação", () => {
  for (const voltage of ["12", "24"] as const)
    for (const management of ["convencional", "LIN", "desconhecido"] as const) {
      const c = emptyCase();
      c.vehicle.voltage = voltage;
      c.vehicle.management = management;
      c.measurements.idle = "14.1";
      const result = interpretMeasurements(c).find((r) => r.id === "idle")!;
      assert.equal(result.state, "evidência insuficiente");
      assert.equal(
        evaluate(c).some((h) => h.state === "Falha confirmada por teste"),
        false,
      );
    }
});
test("limites só classificam a aplicação e condições associadas; trocar veículo invalida referência", () => {
  const c = identified();
  c.limits.bplus = { min: "13.5", max: "14.8" };
  c.measurements.bplus = "15";
  assert.equal(
    interpretMeasurements(c).find((r) => r.id === "bplus")?.state,
    "fora da referência",
  );
  c.vehicle.partCode = "B456";
  assert.equal(referenceUsable(c), false);
  assert.equal(
    interpretMeasurements(c).find((r) => r.id === "bplus")?.state,
    "evidência insuficiente",
  );
});
test("queda sob carga exige corrente/contexto e rpm; zero não equivale a campo ausente", () => {
  const c = identified();
  c.measurements.positiveDrop = "0";
  c.limits.positiveDrop = { min: "0", max: "0.3" };
  assert.equal(
    interpretMeasurements(c).find((r) => r.id === "positiveDrop")?.state,
    "evidência insuficiente",
  );
  c.measurements.rpm = "1800";
  c.measurements.current = "40";
  c.consumers = "Faróis e ventilador";
  assert.equal(
    interpretMeasurements(c).find((r) => r.id === "positiveDrop")?.state,
    "compatível com a referência",
  );
});
test("ripple converte mV para V, sem confundir RMS com pico a pico", () => {
  const c = identified();
  Object.assign(c, {
    rippleUnit: "mV",
    rippleMethod: "scope-pp",
    referenceRippleMethod: "scope-pp",
    consumers: "Carga registrada",
    scopeSettings: "AC, atenuação e base de tempo conforme procedimento",
  });
  Object.assign(c.measurements, { ripple: "400", rpm: "2000" });
  c.limits.ripple = { min: "0", max: "0.5" };
  let r = interpretMeasurements(c).find((r) => r.id === "ripple")!;
  assert.equal(r.value, 0.4);
  assert.equal(r.state, "compatível com a referência");
  c.rippleMethod = "meter-rms";
  r = interpretMeasurements(c).find((r) => r.id === "ripple")!;
  assert.equal(r.state, "evidência insuficiente");
});
test("sintomas e DTCs não confirmam peças; dado insuficiente, desconhecido e N/A não condenam", () => {
  for (const status of ["não testado", "não sei", "não aplicável"] as const) {
    const c = identified();
    c.symptoms = symptoms.map((s) => s.id);
    c.dtcs = "P0562 P0620";
    c.checks.diodeBench = { status, note: "" };
    assert.equal(
      evaluate(c).some((h) => h.state === "Falha confirmada por teste"),
      false,
    );
  }
});
test("confirmação exige teste documentado, referência e exclusão de causas externas", () => {
  const c = identified();
  c.checks.diodeBench = {
    status: "reprovado",
    note: "Diodo conduz em ambos sentidos em ensaio isolado conforme manual.",
  };
  assert.equal(
    evaluate(c).find((h) => h.id === "rectifier")?.state,
    "Falha provável",
  );
  for (const k of ["belt", "grounds", "positiveCable", "excitation"])
    c.checks[k] = { status: "aprovado", note: "Ensaio documentado" };
  assert.equal(
    evaluate(c).find((h) => h.id === "rectifier")?.state,
    "Falha confirmada por teste",
  );
  c.conditions = "";
  assert.notEqual(
    evaluate(c).find((h) => h.id === "rectifier")?.state,
    "Falha confirmada por teste",
  );
});
test("descarte exige aprovação documentada e resolved exige reteste e reparo", () => {
  const c = identified();
  c.checks.batteryCapacity = {
    status: "aprovado",
    note: "Teste de capacidade compatível",
  };
  assert.equal(
    evaluate(c).find((h) => h.id === "battery")?.state,
    "Hipótese descartada",
  );
  c.status = "resolvido";
  assert.ok(reportReady(c));
  c.checks.batteryCapacity = {
    status: "reprovado",
    note: "Bateria reprovada em teste de carga pelo procedimento identificado.",
  };
  c.repair = "Bateria substituída conforme aplicação";
  c.retest = "Sistema testado e problema não reproduzido";
  c.checks.repair = { status: "aprovado", note: "Reteste registrado" };
  assert.equal(reportReady(c), "");
});
test("validação rejeita NaN, infinitos, SOC inválido, unidades e limites invertidos, mas aceita vírgula", () => {
  for (const value of ["NaN", "Infinity", "1e99", "10x"]) {
    const c = emptyCase();
    c.measurements.bplus = value;
    assert.equal(caseSchema.safeParse(c).success, false);
  }
  let c = emptyCase();
  c.measurements.soc = "101";
  assert.equal(caseSchema.safeParse(c).success, false);
  c = emptyCase();
  c.measurements.bplus = "14,2";
  assert.equal(caseSchema.safeParse(c).success, true);
  c.limits.bplus = { min: "15", max: "13" };
  assert.equal(caseSchema.safeParse(c).success, false);
});
test("arquitetura especial não produz conclusão nem sugere ensaio genérico", () => {
  const c = identified();
  c.vehicle.voltage = "other";
  c.reference.application = applicationKey(c.vehicle);
  c.checks.batteryCapacity = { status: "reprovado", note: "Observação" };
  assert.equal(
    evaluate(c).some((h) => h.state === "Falha confirmada por teste"),
    false,
  );
  assert.match(nextDecision(c), /especializado/);
});
test("referências administrativas não aceitam alteração de limites ou aplicação", () => {
  const c = identified();
  const entry: TechnicalEntry = {
    kind: "variant",
    title: "Aplicação teste",
    body: "Procedimento de ensaio da aplicação",
    url: "",
    sourceTitle: c.reference.title,
    sourceUrl: c.reference.url,
    sourceDate: c.reference.date,
    application: "Aplicação teste",
    vehicle: c.vehicle,
    limits: { bplus: { min: "13", max: "15" } },
    published: true,
    rippleMethod: "unknown",
  };
  c.limits = structuredClone(entry.limits!);
  c.reference.origin = "admin";
  assert.equal(administrativeReferenceIssue(c, entry), "");
  c.limits.bplus.max = "17";
  assert.match(administrativeReferenceIssue(c, entry), /alterados/);
  assert.ok(administrativeReferenceIssue(c, undefined));
  assert.equal(
    entrySchema.safeParse({ ...entry, sourceUrl: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("relatório mantém medições ausentes, fonte, evidências e falhas não confirmadas", () => {
  const c = emptyCase();
  c.vehicle.technician = "Técnico de teste";
  c.measurements.idle = "14,2";
  const text = reportText(c, "R-123", "09/11/2026");
  assert.match(text, /R-123/);
  assert.match(text, /14,2 V/);
  assert.match(text, /Causa confirmada: Não estabelecida/);
  assert.match(text, /Valor de referência do fabricante não confirmado/);
  assert.match(text, /Confirmação pós-reparo: Não executada/);
  assert.doesNotMatch(text, /Corrente de saída.*: 0 A/);
});
test("HTML inicial oferece nove abas, identificação, rascunhos e links preservando o 3D", () => {
  const html = renderToStaticMarkup(createElement(AlternatorDiagnosis));
  for (const text of [
    "Visão Geral",
    "Sintomas",
    "Diagnóstico Guiado",
    "Testes Elétricos",
    "Osciloscópio",
    "Componentes",
    "Códigos de Falha",
    "Resultado",
    "Relatório",
    "Salvar na conta",
    "Retomar diagnóstico",
    "Montadora",
    "Modelo",
    "Ano e versão",
    "Nunca desconectar",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /categorias\/alternador/);
  assert.match(html, /catalog=alternador/);
});
test("API exige usuário e rejeita escrita antes de persistir registros inválidos ou sem evidência", async () => {
  let writes = 0;
  const store = {
    list: async () => [],
    get: async () => undefined,
    update: async () => undefined,
    remove: async () => false,
    create: async () => {
      writes++;
      return {} as CaseRow;
    },
  } satisfies Store;
  let h = caseHandler(store, async () => {
    throw Object.assign(new Error("Login obrigatório"), { status: 401 });
  });
  assert.equal(
    (
      await h(
        new Request("http://localhost/api", { method: "POST", body: "{}" }),
      )
    ).status,
    401,
  );
  h = caseHandler(store, async () => ({ id: "owner" }));
  assert.equal(
    (
      await h(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({
            data: { ...emptyCase(), status: "confirmado" },
          }),
        }),
      )
    ).status,
    400,
  );
  assert.equal(writes, 0);
});
test("API não grava referência administrativa forjada e impede origem rejeitada", async () => {
  let writes = 0;
  const store = {
    list: async () => [],
    get: async () => undefined,
    update: async () => undefined,
    remove: async () => false,
    create: async () => {
      writes++;
      return {} as CaseRow;
    },
    validateReference: async () => "Limites alterados",
  } satisfies Store;
  const c = identified();
  c.reference.origin = "admin";
  let h = caseHandler(store, async () => ({ id: "a" }));
  assert.equal(
    (
      await h(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({ data: c }),
        }),
      )
    ).status,
    400,
  );
  h = caseHandler(store, async () => {
    throw Object.assign(new Error("Origem inválida"), { status: 403 });
  });
  assert.equal(
    (
      await h(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({ data: emptyCase() }),
        }),
      )
    ).status,
    403,
  );
  assert.equal(writes, 0);
});
test("API usa revisão ao atualizar e devolve 409 para conflito, sem sobrescrever", async () => {
  let seen: unknown[] = [];
  const store = {
    update: async (...args: unknown[]) => {
      seen = args;
      return undefined;
    },
  } as unknown as Store;
  const h = caseHandler(store, async () => ({ id: "owner-a" }));
  const id = randomUUID();
  const response = await h(
    new Request("http://localhost/api", {
      method: "PUT",
      body: JSON.stringify({ id, revision: 3, data: emptyCase() }),
    }),
  );
  assert.equal(response.status, 409);
  assert.deepEqual(seen.slice(0, 3), [id, "owner-a", 3]);
});

test("referências públicas não incluem rascunhos; visitante/editor não podem editar a base", async () => {
  const { referenceHandler } =
    await import("../src/lib/alternator-diagnosis/handlers");
  let saved = 0,
    listed: unknown = null;
  const handler = referenceHandler(
    {
      list: async (admin) => {
        listed = admin;
        return [];
      },
      save: async () => {
        saved++;
        return randomUUID();
      },
      remove: async () => {
        saved++;
      },
    },
    async () => {
      throw Object.assign(new Error("Apenas administrador"), { status: 403 });
    },
  );
  assert.equal(
    (await handler(new Request("http://localhost/api/references"))).status,
    200,
  );
  assert.equal(listed, false);
  listed = null;
  assert.equal(
    (await handler(new Request("http://localhost/api/references?admin=1")))
      .status,
    403,
  );
  assert.equal(listed, null);
  assert.equal(
    (
      await handler(
        new Request("http://localhost/api/references", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        new Request("http://localhost/api/references?id=" + randomUUID(), {
          method: "DELETE",
        }),
      )
    ).status,
    403,
  );
  assert.equal(saved, 0);
});

test("resultados contraditórios não descartam nem confirmam resistência no B+", () => {
  const c = identified();
  Object.assign(c.measurements, {
    positiveDrop: "0.5",
    current: "40",
    rpm: "1800",
  });
  c.consumers = "Carga registrada";
  c.limits.positiveDrop = { min: "0", max: "0.3" };
  c.checks.positiveCable = {
    status: "aprovado",
    note: "Conexões inspecionadas",
  };
  assert.equal(
    evaluate(c).find((h) => h.id === "bplus")?.state,
    "Evidência insuficiente",
  );
  c.checks.positiveCable.status = "reprovado";
  assert.equal(
    evaluate(c).find((h) => h.id === "bplus")?.state,
    "Falha confirmada por teste",
  );
  c.checks.positiveCable.status = "aprovado";
  c.measurements.positiveDrop = "0.1";
  assert.equal(
    evaluate(c).find((h) => h.id === "bplus")?.state,
    "Hipótese descartada",
  );
  delete c.measurements.positiveDrop;
  assert.notEqual(
    evaluate(c).find((h) => h.id === "bplus")?.state,
    "Falha confirmada por teste",
  );
});
