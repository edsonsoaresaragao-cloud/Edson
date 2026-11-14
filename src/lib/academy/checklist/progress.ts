import type { ProgressRepository, StudentProgress } from "../progress";
import { StudyError } from "../progress";
import { steps, sourcePages, PASSING_SCORE } from "./content";
import { gradeStep } from "./questions";
export type { ProgressRepository, StudentProgress };
export function summarizeProgress(
  completed: StudentProgress["completed"],
  lastStep = "introducao",
  started = true,
): StudentProgress {
  const valid = steps.flatMap((step) => {
    const value = completed.find(
      (p) => p.step === step.id && p.score >= PASSING_SCORE,
    );
    return value ? [value] : [];
  });
  return {
    completed: valid,
    lastStep: steps.some((s) => s.id === lastStep) ? lastStep : "introducao",
    started,
    percent: Math.round((100 * valid.length) / steps.length),
    eligible: valid.length === steps.length,
  };
}
export type Activity = {
  action: "start" | "visit" | "complete";
  step?: string;
  answers?: Record<string, number>;
  checks?: string[];
};
export async function changeProgress(
  repo: ProgressRepository,
  userId: string,
  input: Activity,
) {
  if (input.action === "start") {
    await repo.start(userId);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Aula iniciada. Seu progresso será salvo na sua conta.",
    };
  }
  const step = steps.find((s) => s.id === input.step);
  if (!step) throw new StudyError("Etapa inválida.");
  if (!(await repo.load(userId)).started)
    throw new StudyError("Inicie a aula antes de salvar o progresso.", 409);
  if (input.action === "visit") {
    await repo.visit(userId, step.id);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Posição de estudo salva.",
    };
  }
  const points = sourcePages.find((p) => p.page === step.page)?.points || [];
  const expected = points.map((_, i) => `${step.id}:${i + 1}`);
  const checked = input.checks || [];
  if (
    checked.length !== expected.length ||
    new Set(checked).size !== checked.length ||
    checked.some((id) => !expected.includes(id))
  )
    throw new StudyError("Marque os sete pontos estudados desta etapa.");
  const grade = gradeStep(step.id, input.answers || {});
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
