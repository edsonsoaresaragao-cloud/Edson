import { StudyError } from "../progress";
import { pageStep, examStep } from "./catalog";
import type { LibraryDocument } from "./types";

export function questionsFor(document: LibraryDocument, step: string) {
  if (
    step !== examStep &&
    !document.pages.some((page) => pageStep(page.number) === step)
  )
    throw new StudyError("Etapa inválida.");
  return document.questions.filter(
    (question) =>
      question.step === step &&
      question.review === "verified" &&
      question.pages.every((number) =>
        document.pages.some(
          (page) => page.number === number && page.review === "verified",
        ),
      ),
  );
}

export function publicQuestionBank(document: LibraryDocument) {
  return Object.fromEntries(
    [...document.pages.map((page) => pageStep(page.number)), examStep].map(
      (step) => [
        step,
        questionsFor(document, step).map(({ id, prompt, options, pages }) => ({
          id,
          prompt,
          options,
          pages,
        })),
      ],
    ),
  );
}

export function gradeLibraryStep(
  document: LibraryDocument,
  step: string,
  answers: Record<string, number>,
) {
  const questions = questionsFor(document, step);
  if (step === examStep && questions.length < 10)
    throw new StudyError("Avaliação final ainda está em revisão.", 409);
  if (
    Object.keys(answers).some(
      (id) => !questions.some((question) => question.id === id),
    )
  )
    throw new StudyError("Resposta não pertence à etapa.");
  if (
    questions.some(
      (question) =>
        !Number.isInteger(answers[question.id]) ||
        answers[question.id] < 0 ||
        answers[question.id] >= question.options.length,
    )
  )
    throw new StudyError("Responda a todas as perguntas.");
  const feedback = questions.map((question) => ({
    id: question.id,
    correct: answers[question.id] === question.correctIndex,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    pages: question.pages,
  }));
  return {
    score: questions.length
      ? Math.round(
          (100 * feedback.filter((item) => item.correct).length) /
            questions.length,
        )
      : 100,
    feedback,
  };
}
