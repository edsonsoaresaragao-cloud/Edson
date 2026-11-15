import { db } from "@/lib/db";
import { StudyError } from "../progress";
import { pageStep, examStep, libraryLessonId } from "./catalog";
import {
  LIBRARY_PASSING_SCORE,
  librarySteps,
  summarizeLibraryProgress,
  type LibraryProgressRepository,
} from "./progress";
import { questionsFor } from "./questions";
import type { LibraryCourse, LibraryDocument } from "./types";

export function createLibraryRepository(
  course: LibraryCourse,
  document: LibraryDocument,
): LibraryProgressRepository {
  const lessonIds = new Map(
    librarySteps(document).map((step) => [libraryLessonId(course, step), step]),
  );
  async function enrollment(userId: string) {
    const value = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      include: { progress: true, course: true },
    });
    if (value && value.course.status !== "PUBLISHED")
      throw new StudyError("Aula indisponível.", 404);
    return value;
  }
  async function ensureCourse() {
    const value = await db.course
      .upsert({
        where: { id: course.id },
        update: {},
        create: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          instructor: "EDSON OFICINA Academy",
          hours: course.hours ?? 0,
          passingScore: LIBRARY_PASSING_SCORE,
          status: "PUBLISHED",
          categorySlugs: [
            "motor-e-componentes-internos",
            "correias-e-correntes",
          ],
          audience: course.difficulty,
          objectives: course.description,
          prerequisites:
            "Conhecimentos de motor de quatro tempos e segurança de oficina. Identificar a aplicação exata e consultar a documentação técnica do fabricante.",
          modules: {
            create: librarySteps(document).map((step, index) => {
              const page = document.pages.find(
                (item) => pageStep(item.number) === step,
              );
              const title = step === examStep ? "Avaliação final" : page!.title;
              return {
                id: `${course.id}:module:${step}`,
                title,
                position: index,
                lessons: {
                  create: {
                    id: libraryLessonId(course, step),
                    title,
                    position: 0,
                    body: page?.teacher?.join("\n\n") || title,
                    questions: {
                      create: questionsFor(document, step).map((question) => ({
                        id: `${course.id}:${question.id}`,
                        prompt: question.prompt,
                        options: question.options,
                        correctIndex: question.correctIndex,
                      })),
                    },
                  },
                },
              };
            }),
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
            where: { id: course.id },
          });
          if (existing) return existing;
        }
        throw error;
      });
    if (value.status !== "PUBLISHED")
      throw new StudyError("Aula indisponível para matrícula.", 404);
  }
  return {
    async load(userId) {
      const value = await enrollment(userId);
      if (!value)
        return {
          ...summarizeLibraryProgress(document, [], undefined, false),
          hours: course.hours,
        };
      return {
        ...summarizeLibraryProgress(
          document,
          value.progress.flatMap((item) => {
            const step = lessonIds.get(item.lessonId);
            return step
              ? [
                  {
                    step,
                    score: item.score,
                    completedAt: item.completedAt.toISOString(),
                  },
                ]
              : [];
          }),
          value.lastLessonId ? lessonIds.get(value.lastLessonId) : undefined,
        ),
        hours: value.course.hours > 0 ? value.course.hours : null,
      };
    },
    async start(userId) {
      await ensureCourse();
      await db.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        update: {},
        create: {
          userId,
          courseId: course.id,
          lastLessonId: libraryLessonId(course, pageStep(1)),
          lastViewedAt: new Date(),
        },
      });
    },
    async visit(userId, step) {
      await db.enrollment.update({
        where: { userId_courseId: { userId, courseId: course.id } },
        data: {
          lastLessonId: libraryLessonId(course, step),
          lastViewedAt: new Date(),
        },
      });
    },
    async recordAttempt(userId, step, answers, score) {
      const value = await enrollment(userId);
      if (!value) throw new StudyError("Matrícula necessária.", 403);
      await db.academyAttempt.create({
        data: {
          enrollmentId: value.id,
          lessonId: libraryLessonId(course, step),
          answers,
          score,
          passed: score >= LIBRARY_PASSING_SCORE,
        },
      });
    },
    async complete(userId, step, score) {
      const value = await enrollment(userId);
      if (!value) throw new StudyError("Matrícula necessária.", 403);
      await db.$transaction(async (tx) => {
        const completion = await tx.progress.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: value.id,
              lessonId: libraryLessonId(course, step),
            },
          },
          create: {
            enrollmentId: value.id,
            lessonId: libraryLessonId(course, step),
            score,
          },
          update: {},
        });
        await tx.progress.updateMany({
          where: { id: completion.id, score: { lt: score } },
          data: { score },
        });
        await tx.enrollment.update({
          where: { id: value.id },
          data: {
            lastLessonId: libraryLessonId(course, step),
            lastViewedAt: new Date(),
          },
        });
      });
    },
  };
}
