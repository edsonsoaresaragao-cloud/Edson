import "dotenv/config";
import { db } from "../src/lib/db";
async function main() {
  await db.course.upsert({
    where: { slug: "demonstracao-mecanica-basica" },
    update: {},
    create: {
      slug: "demonstracao-mecanica-basica",
      title: "[DEMONSTRAÇÃO] Introdução à manutenção preventiva",
      description:
        "Rascunho para aprender a usar o editor. Revise e substitua por material autoral completo antes de publicar.",
      instructor: "Responsável a definir",
      hours: 1,
      status: "DRAFT",
      modules: {
        create: [
          {
            title: "Módulo de exemplo",
            lessons: {
              create: [
                {
                  title: "Consulte o plano do fabricante",
                  body: "O plano de manutenção depende do projeto e das condições de uso. Consulte sempre o manual do fabricante e registre as intervenções.",
                  questions: {
                    create: [
                      {
                        prompt:
                          "Qual referência deve orientar os intervalos de manutenção?",
                        options: [
                          "O manual do fabricante",
                          "Um intervalo universal para todo veículo",
                        ],
                        correctIndex: 0,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(
    "Curso de demonstração salvo como RASCUNHO, sem aluno, matrícula ou certificado fictício.",
  );
}
main().finally(() => db.$disconnect());
