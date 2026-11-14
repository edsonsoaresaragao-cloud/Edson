import { db } from "@/lib/db";
import { StudyError, type ProgressRepository } from "../progress";
import {
  COURSE_ID,
  COURSE_HOURS,
  LESSON_SLUG,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  PASSING_SCORE,
  steps,
  lessonId,
} from "./content";
import { questionsFor } from "./questions";
import { summarizeProgress } from "./progress";
async function ensureCourse() {
  const course = await db.course
    .upsert({
      where: { id: COURSE_ID },
      update: {},
      create: {
        id: COURSE_ID,
        slug: LESSON_SLUG,
        title: LESSON_TITLE,
        description: LESSON_SUBTITLE,
        instructor: "EDSON OFICINA Academy",
        hours: COURSE_HOURS ?? 0,
        passingScore: PASSING_SCORE,
        status: "PUBLISHED",
        objectives:
          "Conferência final de correia seca, correia em óleo e corrente, limites da referência geral e interpretação segura dos sinais de problema.",
        audience: "Mecânica intermediária e avançada",
        prerequisites:
          "Conhecimentos de motor de quatro tempos, sincronismo e segurança de oficina.",
        categorySlugs: ["motor-e-componentes-internos", "correias-e-correntes"],
        modules: {
          create: steps.map((s, position) => ({
            id: `${COURSE_ID}:module:${s.id}`,
            title: s.title,
            position,
            lessons: {
              create: {
                id: lessonId(s.id),
                title: s.title,
                body: s.explanation.join("\n\n"),
                position: 0,
                questions: {
                  create: questionsFor(s.id).map((q) => ({
                    id: `${COURSE_ID}:${q.id}`,
                    prompt: q.prompt,
                    options: q.options,
                    correctIndex: q.correctIndex,
                  })),
                },
              },
            },
          })),
        },
      },
    })
    .catch(async (error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const existing = await db.course.findUnique({
          where: { id: COURSE_ID },
        });
        if (existing) return existing;
      }
      throw error;
    });
  if (course.status !== "PUBLISHED")
    throw new StudyError("Aula indisponível para matrícula.", 404);
  // Zero é somente a ausência de carga validada no cadastro legado (campo Int).
  // Uma validação editorial futura preenche apenas esse valor pendente, sem sobrescrever horas já definidas.
  if (COURSE_HOURS !== null && COURSE_HOURS > 0 && course.hours === 0)
    await db.course.updateMany({
      where: { id: COURSE_ID, hours: 0 },
      data: { hours: COURSE_HOURS },
    });
}
async function enrollment(userId: string) {
  const value = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: COURSE_ID } },
    include: { progress: true, course: true },
  });
  if (value && value.course.status !== "PUBLISHED")
    throw new StudyError("Aula indisponível.", 404);
  return value;
}
export const checklistRepository: ProgressRepository = {
  async load(userId) {
    const e = await enrollment(userId);
    if (!e)
      return {
        ...summarizeProgress([], "introducao", false),
        hours: COURSE_HOURS,
      };
    return {
      ...summarizeProgress(
        e.progress.flatMap((p) => {
          const step = steps.find((s) => lessonId(s.id) === p.lessonId);
          return step
            ? [
                {
                  step: step.id,
                  score: p.score,
                  completedAt: p.completedAt.toISOString(),
                },
              ]
            : [];
        }),
        steps.find((s) => lessonId(s.id) === e.lastLessonId)?.id,
      ),
      hours: e.course.hours > 0 ? e.course.hours : null,
    };
  },
  async start(userId) {
    await ensureCourse();
    await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: COURSE_ID } },
      update: {},
      create: {
        userId,
        courseId: COURSE_ID,
        lastLessonId: lessonId("introducao"),
        lastViewedAt: new Date(),
      },
    });
  },
  async visit(userId, step) {
    await db.enrollment.update({
      where: { userId_courseId: { userId, courseId: COURSE_ID } },
      data: { lastLessonId: lessonId(step), lastViewedAt: new Date() },
    });
  },
  async complete(userId, step, score) {
    const e = await enrollment(userId);
    if (!e) throw new StudyError("Matrícula necessária.", 403);
    await db.$transaction(async (tx) => {
      const completion = await tx.progress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: e.id,
            lessonId: lessonId(step),
          },
        },
        create: { enrollmentId: e.id, lessonId: lessonId(step), score },
        update: {},
      });
      await tx.progress.updateMany({
        where: { id: completion.id, score: { lt: score } },
        data: { score },
      });
      await tx.enrollment.update({
        where: { id: e.id },
        data: { lastLessonId: lessonId(step), lastViewedAt: new Date() },
      });
    });
  },
};
