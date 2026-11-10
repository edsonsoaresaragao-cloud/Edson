import { measures, inspections } from "./content";
import { evaluate, interpretMeasurements, nextDecision } from "./rules";
import { referenceUsable, type DiagnosticCase } from "./schema";
export function reportText(c: DiagnosticCase, id: string, date: string) {
  const hypotheses = evaluate(c);
  return [
    "EDSON OFICINA — RELATÓRIO DE DIAGNÓSTICO DO SISTEMA DE CARGA",
    `Número: ${id}`,
    `Data: ${date}`,
    `Status informado: ${c.status}`,
    `Técnico: ${c.vehicle.technician || "Não informado"}`,
    `Veículo: ${c.vehicle.make} ${c.vehicle.model} ${c.vehicle.yearVersion} / ${c.vehicle.engine}`,
    `Combustível: ${c.vehicle.fuel || "Não informado"} | Placa: ${c.vehicle.plate || "Não informada"} | km: ${c.vehicle.km || "Não informado"}`,
    `Elétrica: ${c.vehicle.voltage === "other" ? c.vehicle.otherVoltage : c.vehicle.voltage + " V"} | Bateria: ${c.vehicle.battery} ${c.vehicle.batteryAh} Ah / ${c.vehicle.batteryCca} A`,
    `Alternador: ${c.vehicle.partCode || "Código não informado"} / ${c.vehicle.alternatorAmps || "?"} A | Gerenciamento: ${c.vehicle.management}`,
    `Reclamação: ${c.vehicle.complaint || "Não informada"}`,
    `Histórico: ${c.vehicle.history || "Não informado"}`,
    `Condições: ${c.conditions || "Não registradas"} | Consumidores: ${c.consumers || "Não registrados"}`,
    "TESTES REGISTRADOS",
    ...inspections
      .filter(([k]) => c.checks[k] && c.checks[k].status !== "não testado")
      .map(
        ([k, label]) =>
          `${label}: ${c.checks[k].status}. ${c.checks[k].note || "Evidência não descrita."}`,
      ),
    "MEDIÇÕES REAIS",
    ...measures
      .filter(([k]) => c.measurements[k] !== " " && c.measurements[k])
      .map(
        ([k, label, unit]) =>
          `${label}: ${c.measurements[k]} ${k === "ripple" ? c.rippleUnit : unit}. Limites: ${c.limits[k]?.min || "?"} a ${c.limits[k]?.max || "?"} ${unit}. ${interpretMeasurements(c).find((r) => r.id === k)?.state}`,
      ),
    `Ripple: ${c.rippleMethod}; configuração: ${c.scopeSettings || "não registrada"}`,
    `Referência: ${referenceUsable(c) ? "associada à identificação" : "Valor de referência do fabricante não confirmado"} / ${c.reference.title} / ${c.reference.url} / ${c.reference.date || "data não informada"}`,
    `Origem da referência: ${c.reference.origin === "admin" ? "cadastro administrativo" : "informada pelo técnico"}`,
    `DTCs: ${c.dtcs || "Não informados"} | Módulo: ${c.module || "Não informado"} | Freeze frame: ${c.freezeFrame || "Não registrado"}`,
    "EVIDÊNCIAS E HIPÓTESES",
    ...hypotheses.map(
      (h) =>
        `${h.name}: ${h.state}. Favoráveis: ${h.favors.join("; ") || "nenhuma registrada"}. Contrárias: ${h.against.join("; ") || "nenhuma registrada"}. Falta: ${h.missing.join("; ") || "correlacionar condição de ocorrência"}`,
    ),
    `Causa confirmada: ${
      hypotheses
        .filter((h) => h.state === "Falha confirmada por teste")
        .map((h) => h.name)
        .join("; ") || "Não estabelecida"
    }`,
    `Próxima verificação: ${nextDecision(c)}`,
    `Reparo recomendado/executado: ${c.repair || "Não registrado"}`,
    `Peças eventualmente necessárias: ${c.parts || "Não definidas"}`,
    `Confirmação pós-reparo: ${c.retest || "Não executada/registrada"}`,
    "Relatório gerado a partir de informações registradas pelo técnico; não contém leitura automática do veículo.",
  ].join("\n");
}
