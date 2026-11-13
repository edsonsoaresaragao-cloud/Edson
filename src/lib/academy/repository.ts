import { db } from "@/lib/db";
import {
  COURSE_ID,
  COURSE_HOURS,
  LESSON_SLUG,
  LESSON_TITLE,
  LESSON_SUBTITLE,
  PASSING_SCORE,
  studySteps,
  stepLessonId,
} from "./content";
import { questionsFor } from "./questions";
import {
  summarizeProgress,
  StudyError,
  type ProgressRepository,
} from "./progress";
/** Instalação idempotente na primeira matrícula; nunca altera um curso editado/despublicado. */
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
        hours: COURSE_HOURS,
        passingScore: PASSING_SCORE,
        status: "PUBLISHED",
        categorySlugs: ["motor-e-componentes-internos"],
        objectives:
          "Sincronismo, interpretação das referências por montadora e investigação segura de suspeita de colisão entre pistões e válvulas.",
        audience: "Mecânica intermediária e avançada",
        prerequisites:
          "Conhecimentos básicos de motor de quatro tempos e segurança de oficina.",
        modules: {
          create: studySteps.map((s, position) => ({
            id: `${COURSE_ID}:module:${s.id}`,
            title: s.title,
            position,
            lessons: {
              create: {
                id: stepLessonId(s.id),
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
      // Outra primeira matrícula pode instalar o curso simultaneamente.
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
}
async function enrollment(userId: string) {
  const e = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: COURSE_ID } },
    include: { progress: true, course: true },
  });
  if (e && e.course.status !== "PUBLISHED")
    throw new StudyError("Aula indisponível.", 404);
  return e;
}
export const academyRepository: ProgressRepository = {
  async load(userId) {
    const e = await enrollment(userId);
    if (!e) return summarizeProgress([], "introducao", false);
    return summarizeProgress(
      e.progress.flatMap((p) => {
        const step = studySteps.find((s) => stepLessonId(s.id) === p.lessonId);
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
      studySteps.find((s) => stepLessonId(s.id) === e.lastLessonId)?.id,
    );
  },
  async start(userId) {
    await ensureCourse();
    await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: COURSE_ID } },
      update: {},
      create: {
        userId,
        courseId: COURSE_ID,
        lastLessonId: stepLessonId("introducao"),
        lastViewedAt: new Date(),
      },
    });
  },
  async visit(userId, step) {
    await db.enrollment.update({
      where: { userId_courseId: { userId, courseId: COURSE_ID } },
      data: { lastLessonId: stepLessonId(step), lastViewedAt: new Date() },
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
            lessonId: stepLessonId(step),
          },
        },
        create: { enrollmentId: e.id, lessonId: stepLessonId(step), score },
        update: {},
      });
      // Condição no UPDATE evita reduzir uma nota maior em envios concorrentes.
      await tx.progress.updateMany({
        where: { id: completion.id, score: { lt: score } },
        data: { score },
      });
      await tx.enrollment.update({
        where: { id: e.id },
        data: { lastLessonId: stepLessonId(step), lastViewedAt: new Date() },
      });
    });
  },
};
