import { measures, inspections, symptoms } from "./content";
import { referenceUsable, type DiagnosticCase } from "./schema";
export const hypothesisDefinitions = [
  {
    id: "battery",
    name: "Bateria degradada",
    required: ["batteryCapacity"],
    optional: ["batteryVisual"],
    symptoms: ["s2", "s3", "s4"],
    components: [],
    source: "denso",
  },
  {
    id: "belt",
    name: "Correia patinando / acionamento",
    required: ["belt"],
    optional: ["pulley"],
    symptoms: ["s3", "s9", "s15"],
    components: [1],
    source: "denso",
  },
  {
    id: "pulley",
    name: "Polia desacopladora defeituosa",
    required: ["pulley"],
    optional: ["belt"],
    symptoms: ["s6", "s8", "s9"],
    components: [1],
    source: "bosch",
  },
  {
    id: "bplus",
    name: "Resistência excessiva no circuito B+",
    required: ["positiveCable"],
    optional: ["fuses", "terminals"],
    symptoms: ["s2", "s4", "s15"],
    components: [12],
    measurement: "positiveDrop",
    source: "denso",
  },
  {
    id: "ground",
    name: "Aterramento inadequado",
    required: ["grounds"],
    optional: ["terminals"],
    symptoms: ["s4", "s5", "s7", "s15"],
    components: [12],
    measurement: "groundDrop",
    source: "denso",
  },
  {
    id: "regulator",
    name: "Regulador defeituoso",
    required: ["regulatorBench"],
    optional: ["excitation", "harness", "ibs"],
    symptoms: ["s3", "s4", "s5"],
    components: [7],
    source: "bosch",
  },
  {
    id: "excitation",
    name: "Falha no circuito de excitação",
    required: ["excitation"],
    optional: ["fuses", "harness"],
    symptoms: ["s1", "s3", "s13"],
    components: [5, 7, 8, 12],
    source: "denso",
  },
  {
    id: "rectifier",
    name: "Ponte retificadora defeituosa",
    required: ["diodeBench"],
    optional: ["parasitic", "statorBench"],
    symptoms: ["s3", "s7", "s10", "s11", "s12"],
    components: [9],
    source: "denso",
  },
  {
    id: "stator",
    name: "Estator danificado",
    required: ["statorBench"],
    optional: ["diodeBench"],
    symptoms: ["s7", "s10", "s15"],
    components: [6],
    source: "denso",
  },
  {
    id: "rotor",
    name: "Rotor / anéis / escovas com falha",
    required: ["rotorBench", "brushes"],
    optional: ["excitation"],
    symptoms: ["s3", "s6"],
    components: [5, 8],
    source: "bosch",
  },
  {
    id: "communication",
    name: "Falha de comunicação do alternador",
    required: ["lin", "harness"],
    optional: ["ibs"],
    symptoms: ["s13", "s14"],
    components: [7, 12],
    source: "bosch",
  },
  {
    id: "ibs",
    name: "Sensor IBS/BMS ou gerenciamento",
    required: ["ibs"],
    optional: ["lin"],
    symptoms: ["s4", "s13", "s14"],
    components: [],
    source: "bosch",
  },
  {
    id: "parasitic",
    name: "Consumidor parasita com veículo desligado",
    required: ["parasitic"],
    optional: ["diodeBench"],
    symptoms: ["s2", "s12"],
    components: [],
    measurement: "sleepCurrent",
    source: "denso",
  },
];
export function numeric(s?: string) {
  if (s === undefined || s.trim() === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
export function interpretMeasurements(c: DiagnosticCase) {
  return measures.map(([id, label, unit]) => {
    let value = numeric(c.measurements[id]);
    if (id === "ripple" && value !== null && c.rippleUnit === "mV")
      value /= 1000;
    const min = numeric(c.limits[id]?.min),
      max = numeric(c.limits[id]?.max);
    const methodOk =
      id !== "ripple" ||
      (c.rippleMethod !== "unknown" &&
        c.rippleMethod === c.referenceRippleMethod);
    const contextual =
      Boolean(c.conditions.trim()) &&
      (["positiveDrop", "groundDrop", "current", "ripple"].includes(id)
        ? (numeric(c.measurements.rpm) ?? 0) > 0 && Boolean(c.consumers.trim())
        : true);
    const loadedPathOk =
      !["positiveDrop", "groundDrop"].includes(id) ||
      (numeric(c.measurements.current) ?? 0) > 0;
    const scopeOk = id !== "ripple" || Boolean(c.scopeSettings.trim());
    const batteryOk =
      !["rest", "crank", "soc", "soh"].includes(id) ||
      (c.vehicle.battery !== "desconhecida" &&
        numeric(c.measurements.temperature) !== null);
    const usable =
      referenceUsable(c) &&
      methodOk &&
      contextual &&
      loadedPathOk &&
      scopeOk &&
      batteryOk &&
      c.vehicle.voltage !== "other";
    let state = "não medido",
      interpretation = "Registrar uma medição real.",
      missing = "Medição, procedimento e referência da aplicação.";
    if (value !== null) {
      state = "evidência insuficiente";
      interpretation =
        "Valor registrado; não há critério de aprovação confirmado.";
      missing = !referenceUsable(c)
        ? "Valor de referência do fabricante não confirmado"
        : !methodOk
          ? "Método de ripple compatível com a referência."
          : !contextual || !loadedPathOk || !scopeOk || !batteryOk
            ? "Condições, carga, rotação, configuração do instrumento e identificação da bateria conforme o teste."
            : min === null && max === null
              ? "Limites específicos deste teste."
              : "Procedimento para esta arquitetura.";
      if (usable && (min !== null || max !== null)) {
        state =
          (min !== null && value < min) || (max !== null && value > max)
            ? "fora da referência"
            : "compatível com a referência";
        interpretation =
          state === "fora da referência"
            ? "Investigar circuito e condições; este valor isolado não condena uma peça."
            : "Valor dentro do limite informado nas condições registradas; não exclui falha intermitente.";
        missing = "Correlacionar com os demais testes e confirmar a causa.";
      }
    }
    if (id === "current" && value !== null) {
      interpretation +=
        " Corrente depende da demanda, SOC, rotação, temperatura e estratégia.";
    }
    if (
      c.vehicle.management !== "convencional" &&
      ["idle", "loaded", "bplus"].includes(id) &&
      value !== null
    ) {
      interpretation +=
        " Comparar com solicitação da ECU; tensão variável pode ser intencional.";
    }
    return {
      id,
      label,
      unit,
      value,
      min,
      max,
      state,
      interpretation,
      missing,
      next:
        id === "ripple"
          ? "Confirmar forma de onda e ensaio isolado do retificador/estator."
          : id === "rest" || id === "crank"
            ? "Confirmar SOC e capacidade da bateria."
            : "Conferir referência, condições e circuitos associados.",
    };
  });
}
export function evaluate(c: DiagnosticCase) {
  const readings = interpretMeasurements(c);
  return hypothesisDefinitions.map((h) => {
    const applicable =
      !(h.id === "communication" || h.id === "ibs") ||
      c.vehicle.management !== "convencional";
    const favors: string[] = [],
      against: string[] = [],
      missing: string[] = [];
    for (const key of h.required) {
      const result = c.checks[key],
        label = inspections.find((i) => i[0] === key)?.[1] || key;
      if (result?.status === "reprovado")
        favors.push(
          `${label}: ${result.note || "reprovado sem descrição do ensaio"}`,
        );
      else if (result?.status === "aprovado")
        against.push(
          `${label}: ${result.note || "aprovado sem descrição do ensaio"}`,
        );
      else missing.push(label);
    }
    const m =
      "measurement" in h
        ? readings.find((r) => r.id === h.measurement)
        : undefined;
    if (m?.state === "fora da referência")
      favors.push(
        `${m.label}: ${m.value} ${m.unit}, fora do limite informado.`,
      );
    if (m?.state === "compatível com a referência")
      against.push(
        `${m.label}: compatível com o limite nas condições registradas.`,
      );
    if (
      m &&
      m.state !== "fora da referência" &&
      m.state !== "compatível com a referência"
    )
      missing.push(`Confirmar ${m.label} sob as condições especificadas.`);
    const directFailed = h.required.every(
      (k) => c.checks[k]?.status === "reprovado" && c.checks[k]?.note.trim(),
    );
    const directPassed = h.required.every(
      (k) => c.checks[k]?.status === "aprovado" && c.checks[k]?.note.trim(),
    );
    const prerequisites =
      h.id === "regulator" ||
      h.id === "rotor" ||
      h.id === "stator" ||
      h.id === "rectifier"
        ? ["belt", "grounds", "positiveCable", "excitation"]
        : [];
    for (const k of prerequisites)
      if (c.checks[k]?.status !== "aprovado")
        missing.push(
          `Excluir causa externa: ${inspections.find((i) => i[0] === k)?.[1]}`,
        );
    if (h.id === "battery" && c.vehicle.battery === "desconhecida")
      missing.push(
        "Identificar tecnologia da bateria e procedimento do testador.",
      );
    let state = "Hipótese inicial";
    if (c.vehicle.voltage === "other") state = "Evidência insuficiente";
    else if (!applicable) state = "Não aplicável à arquitetura informada";
    else if (favors.length && against.length) state = "Evidência insuficiente";
    else if (
      directPassed &&
      c.conditions &&
      referenceUsable(c) &&
      missing.length === 0
    )
      state = "Hipótese descartada";
    else if (
      directFailed &&
      c.conditions &&
      referenceUsable(c) &&
      missing.length === 0
    )
      state = "Falha confirmada por teste";
    else if (favors.length) state = "Falha provável";
    else if (missing.length || !referenceUsable(c))
      state = "Evidência insuficiente";
    if (!referenceUsable(c))
      missing.push("Referência da aplicação identificada.");
    if (!c.conditions.trim()) missing.push("Condições do ensaio.");
    if (c.vehicle.voltage === "other")
      missing.push("Procedimento especializado para a arquitetura elétrica.");
    const related = c.symptoms.filter((s) => h.symptoms.includes(s));
    return {
      ...h,
      state,
      favors,
      against,
      missing,
      related,
      confirmation: `Reprovação documentada em ${h.required.join(", ")} com procedimento da aplicação e exclusão de causas externas.`,
      discard:
        "Aprovação documentada de todos os testes obrigatórios nas condições do sintoma; não exclui intermitência fora do ensaio.",
    };
  });
}
export function nextDecision(c: DiagnosticCase) {
  if (c.vehicle.voltage === "other")
    return "Identificar arquitetura e encaminhar para procedimento especializado antes de ensaios.";
  if (c.checks.batteryCapacity?.status !== "aprovado")
    return "Avaliar/corrigir o estado e a capacidade da bateria; repetir o teste antes de condenar a geração.";
  if (
    c.checks.belt?.status !== "aprovado" ||
    c.checks.pulley?.status === "reprovado"
  )
    return "Investigar correia, tensor, alinhamento e polia; confirmar o acionamento mecânico.";
  const readings = interpretMeasurements(c);
  if (
    ["positiveDrop", "groundDrop"].some(
      (k) => readings.find((r) => r.id === k)?.state === "fora da referência",
    )
  )
    return "Investigar a resistência dos cabos, conexões e aterramentos; repetir a queda sob a mesma carga após correção.";
  if (
    c.vehicle.management !== "convencional" &&
    numeric(c.measurements.ecu) === null
  )
    return "Consultar solicitação da ECU, estratégia, IBS/BMS e comunicação; comando ainda não medido.";
  if (
    c.vehicle.management !== "convencional" &&
    numeric(c.measurements.ecu) !== null &&
    numeric(c.measurements.bplus) !== null &&
    numeric(c.measurements.ecu)! <= numeric(c.measurements.bplus)!
  )
    return "Nos valores registrados, a ECU não solicita tensão maior que a medida. Investigar estratégia, SOC, IBS/BMS e comunicação antes de condenar a geração.";
  if (
    readings.find((r) => r.id === "bplus")?.state ===
    "compatível com a referência"
  )
    return "Comparar B+ com polos da bateria e medir quedas positiva e negativa sob carga.";
  if (
    c.checks.diodeBench?.status === "reprovado" ||
    c.checks.statorBench?.status === "reprovado"
  )
    return "Confirmar retificador/enrolamentos em teste isolado com especificação e evidência registrada.";
  return "Verificar excitação, fusíveis, aterramento e comando; prosseguir para ripple e ensaios específicos se as causas externas forem excluídas.";
}
export function reportReady(c: DiagnosticCase) {
  const confirmed = evaluate(c).filter(
    (h) => h.state === "Falha confirmada por teste",
  );
  if (c.status === "confirmado" && !confirmed.length)
    return "Status confirmado exige ao menos uma causa confirmada por teste.";
  if (
    c.status === "resolvido" &&
    (!confirmed.length ||
      c.checks.repair?.status !== "aprovado" ||
      !c.retest.trim() ||
      !c.repair.trim())
  )
    return "Resolvido exige causa confirmada, reparo registrado e teste pós-reparo aprovado com descrição.";
  return "";
}
export function selectedSequence(c: DiagnosticCase) {
  const checks = new Set(
    c.symptoms.flatMap((id) => symptoms.find((s) => s.id === id)?.checks || []),
  );
  return [...checks];
}
