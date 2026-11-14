BEGIN;

-- A Aula 02 aguarda a validação da carga horária pelo responsável.
-- Zero é somente a pendência dessa aula; os demais cursos continuam exigindo horas positivas.
ALTER TABLE "Course" DROP CONSTRAINT course_score_check;
ALTER TABLE "Course" ADD CONSTRAINT course_score_check CHECK (
  "passingScore" BETWEEN 1 AND 100
  AND (hours > 0 OR (hours = 0 AND id = 'academy-aula-02-conferencia-final-v1'))
);

COMMIT;
