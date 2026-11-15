import { libraryDocumentSchema } from "../../src/lib/academy/library/types";
import {
  summarizeLibraryProgress,
  type LibraryProgressRepository,
} from "../../src/lib/academy/library/progress";
import type { StudentProgress } from "../../src/lib/academy/progress";

/** Synthetic test content; never a transcription or claim about a supplied PDF. */
export function syntheticLibraryDocument(courseNumber = 5, pageCount = 17) {
  return libraryDocumentSchema.parse({
    courseNumber,
    pageCount,
    originalSha256: "a".repeat(64),
    technicalReview: "verified",
    pages: Array.from({ length: pageCount }, (_, index) => ({
      number: index + 1,
      title: `Página sintética ${index + 1}`,
      transcript: [
        `Conteúdo sintético da página ${index + 1}, criado exclusivamente para verificar o fluxo de estudo.`,
      ],
      description: "Página de teste sem instruções de reparação.",
      review: "verified",
      image: `pagina-${String(index + 1).padStart(3, "0")}.jpg`,
      preview: `preview-${String(index + 1).padStart(3, "0")}.webp`,
      sourceSha256: "b".repeat(64),
      previewSha256: "c".repeat(64),
    })),
    questions: [
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `practice-${index + 1}`,
        step: "pagina-2",
        pages: [2],
        prompt: `Pergunta sintética de fixação ${index + 1}`,
        options: ["Correta", "Incorreta"],
        correctIndex: 0,
        explanation: "Explicação sintética para teste de correção.",
        review: "verified",
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        id: `final-${index + 1}`,
        step: "avaliacao",
        pages: [1],
        prompt: `Pergunta sintética final ${index + 1}`,
        options: ["Correta", "Incorreta"],
        correctIndex: 0,
        explanation: "Explicação sintética para teste de avaliação.",
        review: "verified",
      })),
    ],
  });
}
export function memoryLibraryRepository(document = syntheticLibraryDocument()) {
  const students = new Map<
    string,
    { completed: StudentProgress["completed"]; lastStep?: string }
  >();
  const attempts: {
    userId: string;
    step: string;
    answers: Record<string, number>;
    score: number;
  }[] = [];
  const repo: LibraryProgressRepository = {
    async load(userId) {
      const value = students.get(userId);
      return summarizeLibraryProgress(
        document,
        value?.completed || [],
        value?.lastStep,
        Boolean(value),
      );
    },
    async start(userId) {
      if (!students.has(userId)) students.set(userId, { completed: [] });
    },
    async visit(userId, step) {
      students.get(userId)!.lastStep = step;
    },
    async recordAttempt(userId, step, answers, score) {
      attempts.push({ userId, step, answers: { ...answers }, score });
    },
    async complete(userId, step, score) {
      const value = students.get(userId)!;
      const previous = value.completed.find((item) => item.step === step);
      if (previous) previous.score = Math.max(previous.score, score);
      else
        value.completed.push({
          step,
          score,
          completedAt: new Date().toISOString(),
        });
      value.lastStep = step;
    },
  };
  return { repo, attempts };
}
