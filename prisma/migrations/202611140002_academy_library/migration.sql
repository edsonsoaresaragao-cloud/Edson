BEGIN;

-- Carga ainda não validada: a pendência zero fica restrita às aulas editoriais fixas.
ALTER TABLE "Course" DROP CONSTRAINT course_score_check;
ALTER TABLE "Course" ADD CONSTRAINT course_score_check CHECK (
  "passingScore" BETWEEN 1 AND 100
  AND (hours > 0 OR (hours = 0 AND id IN (
    'academy-aula-02-conferencia-final-v1',
    'academy-aula-03-guias-visuais-sincronismo-v1',
    'academy-aula-04-motores-menos-frequentes-v1',
    'academy-aula-05-ferramentas-travamento-v1',
    'academy-aula-06-correias-acessorios-v1',
    'academy-aula-07-pecas-orcamento-v1',
    'academy-aula-08-diagnostico-sincronismo-v1',
    'academy-aula-09-valvulas-empenadas-v1',
    'academy-aula-10-torque-cabecote-v1'
  )))
);

CREATE TABLE "AcademyAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enrollmentId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" INTEGER NOT NULL CHECK ("score" BETWEEN 0 AND 100),
  "passed" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademyAttempt_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AcademyAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AcademyAttempt_enrollmentId_lessonId_createdAt_idx" ON "AcademyAttempt"("enrollmentId", "lessonId", "createdAt");

COMMIT;
