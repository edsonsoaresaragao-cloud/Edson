import {
  classifications,
  diagnosticSteps,
  fundamentals,
  LESSON_TITLE,
  studySteps,
  workshopCare,
  type StudyStep,
} from "./content";
import { sourceTables, unconfirmedClassification } from "./source-tables";
export type NarratedQuestion = { prompt: string; options: string[] };
/** Só conteúdo público da aula: nunca lê índices de correção ou respostas do banco. */
export function stepNarration(
  step: StudyStep,
  questions: NarratedQuestion[],
): string[] {
  const parts = [
    LESSON_TITLE,
    `Etapa ${studySteps.findIndex((s) => s.id === step.id) + 1} de ${studySteps.length}. ${step.title}.`,
    "O que você vai aprender.",
    ...step.objectives,
    "Explicação do professor. EDSON OFICINA Academy.",
    ...step.explanation,
  ];
  if (step.kind === "intro" || step.kind === "fundamentals")
    parts.push(
      "Classificações da referência.",
      ...classifications.map(([title, text]) => `${title}. ${text}`),
    );
  if (step.kind === "intro")
    parts.push(
      "Capa do material. Ponto do Motor. Mapa dos motores que batem válvula. Antes de abrir o motor, veja se um dente errado entorta válvula. Marca por marca, motor por motor. As classificações dependem da aplicação exata e precisam ser confirmadas na documentação técnica.",
    );
  if (step.kind === "fundamentals")
    parts.push(
      ...fundamentals.map(([title, text]) => `${title}. ${text}`),
      "A ilustração de pistão e válvulas é conceitual, sem escala ou marcas de reparação. Use os controles para explorar o movimento e a defasagem.",
    );
  if (step.kind === "manufacturer") {
    parts.push(
      `Material técnico. Fonte: Ponto do Motor. Página ${step.page} de 11. Leitura da tabela, em sua ordem original.`,
      "A transcrição conserva as classificações da fonte. Sem fonte significa que a referência não confirmou a classificação. Não amplie a aplicação para outros motores, anos ou versões.",
    );
    (sourceTables[step.id] || []).forEach(
      ([motor, carros, tipo, classificacao], i) =>
        parts.push(
          `Linha ${i + 1}. Motor: ${motor}. Carros: ${carros}. Tipo de acionamento: ${tipo}. Classificação na fonte: ${classificacao || unconfirmedClassification}.`,
        ),
    );
    parts.push(
      "Alertas e dicas da fonte, com o contexto da aula. Estas orientações não autorizam girar um conjunto com suspeita de colisão antes das verificações necessárias.",
      step.sourceAlert || "",
      step.sourceTip || "",
      "Atenção na oficina. Orientação didática.",
      ...workshopCare,
      `Diagnóstico nesta aplicação. Identifique ${step.focus}; confronte código, ano e versão com o manual. Preserve o histórico e inspecione a distribuição antes de permitir rotação. Falta de evidência de contato não confirma válvulas íntegras.`,
    );
  }
  if (step.kind === "diagnosis")
    parts.push(
      "Como diagnosticar suspeita de válvula empenada após falha no sincronismo.",
      ...diagnosticSteps.map(
        ([title, text], i) => `Verificação ${i + 1}. ${title}. ${text}`,
      ),
      "Não usar a partida para investigar uma possível colisão. Valores de compressão, folgas, torques e posições de teste devem vir da documentação do fabricante.",
    );
  if (questions.length) {
    parts.push(
      step.kind === "exam"
        ? "Avaliação final. Dez perguntas. Aproveitamento mínimo: setenta por cento."
        : "Pergunta de fixação.",
    );
    questions.forEach((q, i) =>
      parts.push(
        `Pergunta ${i + 1}. ${q.prompt}`,
        ...q.options.map(
          (option, n) =>
            `Alternativa ${String.fromCharCode(65 + n)}. ${option}`,
        ),
      ),
    );
    parts.push(
      "Escolha suas respostas na tela. A correção explicada aparece após o envio. Ouvir esta etapa não registra sua conclusão.",
    );
  }
  parts.push(
    "Fim da leitura desta etapa. Fonte visual e tabelas: Ponto do Motor. Explicações e atividades: EDSON OFICINA Academy.",
  );
  return parts.filter(Boolean);
}
/** Enunciados curtos evitam o limite de duração de uma única fala em alguns navegadores. */
export function narrationChunks(
  paragraphs: readonly string[],
  limit = 300,
): string[] {
  if (!Number.isInteger(limit) || limit < 40)
    throw new Error("Limite de leitura inválido.");
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    let text = paragraph.replace(/\s+/gu, " ").trim();
    while (text.length > limit) {
      const prefix = text.slice(0, limit + 1);
      const sentence = [...prefix.matchAll(/[.!?]\s/gu)].at(-1);
      const boundary =
        sentence && sentence.index! > limit / 3
          ? sentence.index! + 1
          : prefix.lastIndexOf(" ");
      const at = boundary > 0 ? boundary : limit;
      result.push(text.slice(0, at).trim());
      text = text.slice(at).trim();
    }
    if (text) result.push(text);
  }
  return result;
}
