import { PASSING_SCORE, studySteps } from "./content";
import { gradeStep } from "./questions";
export type StudentProgress = {
  completed: { step: string; score: number; completedAt: string }[];
  lastStep: string;
  started: boolean;
  percent: number;
  eligible: boolean;
};
export type ProgressRepository = {
  load(userId: string): Promise<StudentProgress>;
  start(userId: string): Promise<void>;
  visit(userId: string, step: string): Promise<void>;
  complete(userId: string, step: string, score: number): Promise<void>;
};
export class StudyError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function summarizeProgress(
  completed: StudentProgress["completed"],
  lastStep = "introducao",
  started = true,
): StudentProgress {
  const valid = studySteps.flatMap((step) => {
    const match = completed.find(
      (p) => p.step === step.id && p.score >= PASSING_SCORE,
    );
    return match ? [match] : [];
  });
  return {
    completed: valid,
    lastStep: studySteps.some((s) => s.id === lastStep)
      ? lastStep
      : "introducao",
    started,
    percent: Math.round((100 * valid.length) / studySteps.length),
    eligible: valid.length === studySteps.length,
  };
}
export async function changeProgress(
  repo: ProgressRepository,
  userId: string,
  input: {
    action: "start" | "visit" | "complete";
    step?: string;
    answers?: Record<string, number>;
  },
) {
  if (input.action === "start") {
    await repo.start(userId);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Aula iniciada. Seu progresso será salvo na sua conta.",
    };
  }
  const step = studySteps.find((s) => s.id === input.step);
  if (!step) throw new StudyError("Etapa inválida.");
  const current = await repo.load(userId);
  if (!current.started)
    throw new StudyError("Inicie a aula antes de salvar o progresso.", 409);
  if (input.action === "visit") {
    await repo.visit(userId, step.id);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Posição de estudo salva.",
    };
  }
  const grade = gradeStep(step.id, input.answers || {});
  // A tentativa recebe correção, mas só uma aprovação altera a conclusão.
  if (grade.score >= PASSING_SCORE)
    await repo.complete(userId, step.id, grade.score);
  return {
    progress: await repo.load(userId),
    ...grade,
    message:
      grade.score >= PASSING_SCORE
        ? `Etapa concluída. Aproveitamento: ${grade.score}%.`
        : `Você alcançou ${grade.score}%. Revise as explicações e tente novamente. Mínimo: ${PASSING_SCORE}%.`,
  };
}
