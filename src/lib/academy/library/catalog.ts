import type { LibraryCourse } from "./types";

const entries = [
  [
    3,
    "guias-visuais-sincronismo",
    "GUIAS VISUAIS DE SINCRONISMO DOS MOTORES",
    "Guias por fabricante, veículo e motor, com páginas relacionadas e pesquisa interna.",
    187,
  ],
  [
    4,
    "motores-menos-frequentes",
    "SINCRONISMO DE MOTORES MENOS FREQUENTES",
    "Trinta guias de motores menos frequentes, mantendo suas partes relacionadas.",
    61,
  ],
  [
    5,
    "ferramentas-travamento",
    "FERRAMENTAS DE TRAVAMENTO E SINCRONISMO",
    "Dezesseis fichas de ferramentas, códigos de aplicação e cuidados com o travamento.",
    17,
  ],
  [
    6,
    "correias-acessorios",
    "CORREIAS DE ACESSÓRIOS: MONTAGEM E TENSIONAMENTO",
    "Quarenta guias de caminho da correia, polias, montagem e tensionamento por aplicação.",
    41,
  ],
  [
    7,
    "pecas-orcamento",
    "COMPONENTES ASSOCIADOS E ORÇAMENTO DE MANUTENÇÃO",
    "Componentes para inspecionar, recomendações de substituição e elaboração de orçamento técnico.",
    11,
  ],
  [
    8,
    "diagnostico-sincronismo",
    "DIAGNÓSTICO ELETRÔNICO DO SINCRONISMO",
    "Correlação de sinais, códigos DTC e investigação de falhas sem presumir a peça defeituosa.",
    14,
  ],
  [
    9,
    "valvulas-empenadas",
    "DIAGNÓSTICO DE VÁLVULAS EMPENADAS",
    "Verificações preliminares, compressão, estanqueidade e interpretação segura dos resultados.",
    8,
  ],
  [
    10,
    "torque-cabecote",
    "TORQUE E SEQUÊNCIA DE APERTO DO CABEÇOTE",
    "Preparação, fixadores, consulta por motor e interpretação de fichas de torque e aperto angular.",
    19,
  ],
] as const;

export const libraryCourses: LibraryCourse[] = entries.map(
  ([number, slug, title, description, expectedPages]) => ({
    id: `academy-aula-${String(number).padStart(2, "0")}-${slug}-v1`,
    number,
    slug,
    title: `AULA ${String(number).padStart(2, "0")} — ${title}`,
    description,
    expectedPages,
    hours: null,
    category: "Motor e sistemas de distribuição",
    difficulty: "Intermediário e avançado",
  }),
);

export function getLibraryCourse(slug: string) {
  return libraryCourses.find((course) => course.slug === slug);
}
export function isLibraryCourseId(id: string) {
  return libraryCourses.some((course) => course.id === id);
}
export function courseId(slug: string) {
  return getLibraryCourse(slug)?.id;
}
export const pageStep = (number: number) => `pagina-${number}`;
export const examStep = "avaliacao";
export const libraryLessonId = (course: LibraryCourse, step: string) =>
  `${course.id}:${step}`;
export const libraryLessonUrl = (slug: string) => `/academy/aulas/${slug}`;
