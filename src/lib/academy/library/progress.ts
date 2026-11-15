import type { ProgressRepository, StudentProgress } from "../progress";
import { StudyError } from "../progress";
import { pageStep, examStep } from "./catalog";
import { gradeLibraryStep } from "./questions";
import type { LibraryDocument } from "./types";

export const LIBRARY_PASSING_SCORE = 70;
export type LibraryActivity = {
  action: "start" | "visit" | "complete";
  step?: string;
  studied?: boolean;
  answers?: Record<string, number>;
};
export type LibraryProgressRepository = ProgressRepository & {
  recordAttempt(
    userId: string,
    step: string,
    answers: Record<string, number>,
    score: number,
  ): Promise<void>;
};
export function librarySteps(document: Pick<LibraryDocument, "pages">) {
  return [...document.pages.map((page) => pageStep(page.number)), examStep];
}
export function summarizeLibraryProgress(
  document: Pick<LibraryDocument, "pages">,
  completed: StudentProgress["completed"],
  lastStep?: string,
  started = true,
): StudentProgress {
  const steps = librarySteps(document);
  const valid = steps.flatMap((step) => {
    const value = completed.find(
      (item) => item.step === step && item.score >= LIBRARY_PASSING_SCORE,
    );
    return value ? [value] : [];
  });
  return {
    started,
    lastStep: lastStep && steps.includes(lastStep) ? lastStep : steps[0],
    completed: valid,
    percent: Math.round((100 * valid.length) / steps.length),
    eligible: valid.length === steps.length,
  };
}
export async function changeLibraryProgress(
  repo: LibraryProgressRepository,
  document: LibraryDocument,
  userId: string,
  input: LibraryActivity,
) {
  if (input.action === "start") {
    await repo.start(userId);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Aula iniciada. Seu progresso será salvo na sua conta.",
    };
  }
  const step = input.step;
  if (!step || !librarySteps(document).includes(step))
    throw new StudyError("Etapa inválida.");
  const current = await repo.load(userId);
  if (!current.started)
    throw new StudyError("Inicie a aula antes de salvar o progresso.", 409);
  if (input.action === "visit") {
    await repo.visit(userId, step);
    return {
      progress: await repo.load(userId),
      feedback: [],
      message: "Posição de estudo salva.",
    };
  }
  if (step !== examStep && input.studied !== true)
    throw new StudyError(
      "Confirme que estudou esta página antes de concluí-la.",
    );
  if (
    step === examStep &&
    !document.pages.every((page) =>
      current.completed.some((item) => item.step === pageStep(page.number)),
    )
  )
    throw new StudyError(
      "Conclua o estudo das páginas antes da avaliação final.",
      409,
    );
  const answers = input.answers || {};
  const grade = gradeLibraryStep(document, step, answers);
  await repo.recordAttempt(userId, step, answers, grade.score);
  if (grade.score >= LIBRARY_PASSING_SCORE)
    await repo.complete(userId, step, grade.score);
  return {
    progress: await repo.load(userId),
    ...grade,
    message:
      grade.score >= LIBRARY_PASSING_SCORE
        ? `Etapa concluída. Aproveitamento: ${grade.score}%.`
        : `Você alcançou ${grade.score}%. Revise o conteúdo e tente novamente. Mínimo: ${LIBRARY_PASSING_SCORE}%.`,
  };
}
