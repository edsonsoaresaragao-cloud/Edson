/** Transcrição manual conferida nas quatro páginas do PDF Ponto do Motor. */
export const COURSE_ID = "academy-aula-02-conferencia-final-v1";
export const LESSON_SLUG = "conferencia-final";
export const LESSON_URL = `/academy/aulas/${LESSON_SLUG}`;
export const LESSON_TITLE = "AULA 02 — CONFERÊNCIA FINAL ANTES DE DAR PARTIDA";
export const LESSON_SUBTITLE =
  "Correia seca, correia em óleo e corrente: 21 pontos de conferência, material integral e leitura por página.";
/** Sem duração atribuída até a validação do responsável. */
export const COURSE_HOURS: number | null = null;
export const PASSING_SCORE = 70;
export const ADAPTED_PDF =
  "Aula_02_Conferencia_Final_sem_Bonus_no_Cabecalho.pdf";
export const materialUrl = (file: string) =>
  `/api/academy/aula-02/material/${file}`;
export const lessonId = (step: string) => `${COURSE_ID}:lesson:${step}`;
export type SourcePoint = {
  title: string;
  lines: { kind: "ok" | "warning"; text: string }[];
};
export type SourcePage = {
  page: number;
  title: string;
  folio?: string;
  subtitle: string;
  points: SourcePoint[];
  release: string[];
  footnote: string;
  captions: string[];
};
const ok = (text: string) => ({ kind: "ok" as const, text });
const warning = (text: string) => ({ kind: "warning" as const, text });
export const sourcePages: SourcePage[] = [
  {
    page: 1,
    title: "Conferência final antes de dar partida",
    subtitle:
      "Voltas, ferramentas, marcas, tensor, torques, periféricos e primeira partida — já conferido, na ordem.",
    points: [],
    release: [],
    footnote: "Ponto do Motor.",
    captions: [
      "Indicação visual: 2x, duas voltas. Correia seca. Correia no óleo. Corrente.",
      "3 checklists prontos. Sinal verde: tem que estar assim. Sinal vermelho: sinal de problema.",
    ],
  },
  {
    page: 2,
    title: "Conferência final — Correia seca",
    folio: "01 de 03",
    subtitle:
      "Na ordem, antes de virar a chave. Sinal verde: tem que estar assim. Sinal vermelho: sinal de problema.",
    points: [
      {
        title: "Voltas",
        lines: [
          ok(
            "2 voltas completas à mão, no sentido de giro, pelo parafuso do virabrequim",
          ),
          warning(
            "Travou no meio? Pare e não force: pode ser válvula no pistão",
          ),
        ],
      },
      {
        title: "Pino e ferramentas",
        lines: [
          ok("Pino de PMS e travas dos comandos encaixam sem forçar"),
          ok("Depois: todas as ferramentas FORA do motor"),
        ],
      },
      {
        title: "Marcas",
        lines: [
          ok(
            "Marcas do comando e do virabrequim alinhadas com as da tampa/cabeçote",
          ),
          warning("Um dente fora: desmonte e refaça"),
        ],
      },
      {
        title: "Tensor",
        lines: [
          ok("Ponteiro na marca da instrução do kit, motor frio"),
          ok("Depois das 2 voltas, continua na marca"),
        ],
      },
      {
        title: "Torques",
        lines: [
          ok(
            "Polias, tensor, rolamento guia e damper no torque (e ângulo) do guia",
          ),
          ok("Parafusos com ângulo novos"),
        ],
      },
      {
        title: "Periféricos",
        lines: [
          ok("Tampas da correia montadas sem raspar na correia"),
          ok("Correia de acessórios, conectores e sensor de rotação no lugar"),
        ],
      },
      {
        title: "Primeira partida",
        lines: [
          ok("Pega e fica sem estalo nem batida metálica"),
          warning(
            "Ruído de raspar ou luz de injeção acesa: desligue e confira",
          ),
        ],
      },
    ],
    release: [
      "2 voltas livres",
      "Ferramentas fora",
      "Marcas alinhadas",
      "Tensor na marca",
    ],
    captions: ["Na fotografia de rotação: indicação 2x."],
    footnote:
      "Ponto do Motor · Bônus 06 · 01/03 · Fonte: O Mecânico (Fire 1.0; TU5JP4/EC5JP4) · regra geral · esquema ilustrativo — confira no seu modelo",
  },
  {
    page: 3,
    title: "Conferência final — Correia no óleo",
    folio: "02 de 03",
    subtitle:
      "Na ordem, antes de virar a chave. Sinal verde: tem que estar assim. Sinal vermelho: sinal de problema.",
    points: [
      {
        title: "Voltas",
        lines: [
          ok("2 voltas completas à mão, devagar, no sentido de giro"),
          warning("Travou no meio? Pare: não force o motor"),
        ],
      },
      {
        title: "Pino e ferramentas",
        lines: [
          ok("Pino no volante e ferramentas dos comandos encaixam sem forçar"),
          ok("Trava da cremalheira, pino e ferramentas FORA"),
        ],
      },
      {
        title: "Marcas e polias",
        lines: [
          ok("Polias sem chaveta apertadas com o motor travado"),
          warning("Polia apertada com o motor solto: comando fora de fase"),
        ],
      },
      {
        title: "Tensor",
        lines: [
          ok("Gira no sentido indicado pela seta do tensor"),
          ok(
            "Ponteiro na marca do kit, motor frio, e continua lá após 2 voltas",
          ),
        ],
      },
      {
        title: "Torques",
        lines: [
          ok("Torque + ângulo nas polias e no damper"),
          ok("Parafusos com ângulo novos"),
        ],
      },
      {
        title: "Óleo e tampa",
        lines: [
          ok("Óleo da especificação + filtro novo, nível certo"),
          ok("Tampa inferior nova e cola curada no tempo da instrução"),
          ok("Pescador limpo, sem resto da correia velha"),
        ],
      },
      {
        title: "Primeira partida",
        lines: [
          ok("Pressão do óleo normal, sem luz acesa"),
          warning("Luz do óleo acesa ou ruído: desligue na hora"),
        ],
      },
    ],
    release: [
      "2 voltas livres",
      "Ferramentas fora",
      "Óleo certo e nível OK",
      "Cola curada",
    ],
    captions: [],
    footnote:
      "Ponto do Motor · Bônus 06 · 02/03 · Fonte: O Mecânico (Onix CSS Prime, 2024) · regra geral · esquema ilustrativo — confira no seu modelo",
  },
  {
    page: 4,
    title: "Conferência final — Corrente",
    folio: "03 de 03",
    subtitle:
      "Na ordem, antes de virar a chave. Sinal verde: tem que estar assim. Sinal vermelho: sinal de problema.",
    points: [
      {
        title: "Voltas",
        lines: [
          ok("2 voltas completas à mão, no sentido de giro"),
          warning("Travou ou deu tranco? Pare e confira as marcas"),
        ],
      },
      {
        title: "Travas e ferramentas",
        lines: [
          ok("Ferramentas dos comandos e do virabrequim encaixam sem forçar"),
          ok("Pino/trava do tensor hidráulico retirado"),
        ],
      },
      {
        title: "Marcas",
        lines: [
          ok(
            "Na montagem: elos coloridos (quando tem) nas marcas das engrenagens",
          ),
          ok(
            "Após as voltas: marcas das engrenagens/ferramentas no lugar (o elo colorido não volta a alinhar — é normal)",
          ),
          warning("Marca da engrenagem fora: pulou dente — refaça"),
        ],
      },
      {
        title: "Tensor e guias",
        lines: [
          ok("Tensor hidráulico solto e empurrando a guia"),
          ok("Guias fixas, parafusos no torque"),
        ],
      },
      {
        title: "Torques",
        lines: [
          ok("Engrenagens, variadores e damper no torque (e ângulo) do guia"),
          ok("Parafusos com ângulo novos"),
        ],
      },
      {
        title: "Tampa e óleo",
        lines: [
          ok("Tampa da corrente vedada e vedante curado"),
          ok("Óleo da especificação + filtro, nível certo"),
          ok("Retentor dianteiro novo, sem dobrar o lábio"),
        ],
      },
      {
        title: "Primeira partida",
        lines: [
          ok("Funciona sem batida metálica contínua"),
          warning(
            "Ruído de corrente que não some ou luz de injeção: desligue e confira",
          ),
        ],
      },
    ],
    release: [
      "2 voltas livres",
      "Trava do tensor fora",
      "Marcas das engrenagens no lugar",
      "Óleo e nível OK",
    ],
    captions: ["Na fotografia de rotação: indicação 2x."],
    footnote:
      "Ponto do Motor · Bônus 06 · 03/03 · Fonte: regra geral dos sistemas de corrente · esquema ilustrativo — confira no seu modelo",
  },
];
export const manualNote =
  "Checklist geral de estudo. Antes de qualquer intervenção, identifique o código, ano e versão do motor e consulte o procedimento do fabricante. A referência a duas voltas não autoriza girar um conjunto com suspeita de contato. Não force resistência nem use a partida para investigar travamento. Torques, ângulos, óleo, ferramentas e tempos de cura devem vir da documentação da aplicação exata.";
export const steps = [
  {
    id: "introducao",
    title: "Introdução",
    page: 1,
    objectives: [
      "Reconhecer os três sistemas e a sequência dos checklists.",
      "Distinguir a referência geral do procedimento específico do fabricante.",
    ],
    explanation: [
      "A aula organiza três checklists de sete pontos, preservando as quatro páginas da fonte. As caixas digitais são um roteiro de leitura; a conclusão registra estudo, sem atestar execução de um reparo.",
      "A verificação depende do motor exato e das condições seguras previstas pelo fabricante. A avaliação ajuda a interpretar os sinais de problema e os limites da referência.",
    ],
  },
  {
    id: "correia-seca",
    title: "Correia seca",
    page: 2,
    objectives: [
      "Revisar os sete pontos da correia seca.",
      "Reconhecer resistência, desalinhamento e ruídos como motivos para interromper e conferir.",
    ],
    explanation: [
      "A conferência reúne voltas, ferramentas, marcas, tensor, torques, periféricos e primeira partida. A rotação manual só é considerada após estabelecer as condições seguras da aplicação; nunca force um ponto de resistência.",
      "Os símbolos verdes da fonte descrevem condições esperadas; os vermelhos indicam problemas. A orientação de remover ferramentas deve ser conciliada com a sequência de bloqueio, aperto e liberação do manual específico.",
    ],
  },
  {
    id: "correia-em-oleo",
    title: "Correia em óleo",
    page: 3,
    objectives: [
      "Relacionar sincronismo, óleo, filtro, pescador e vedação.",
      "Identificar o cuidado com polias sem chaveta e a condição de pressão do óleo.",
    ],
    explanation: [
      "A página acrescenta cuidados com polias sem chaveta, óleo especificado, filtro, pescador e tempo de cura. Esses itens dependem da aplicação; a fonte não define uma especificação universal de óleo ou duração de cura.",
      "Não antecipe a partida para testar uma dúvida de montagem. Siga o procedimento de fixação e a sequência de verificação do fabricante; uma luz de óleo acesa ou ruído exige interrupção e investigação conforme a referência.",
    ],
  },
  {
    id: "corrente",
    title: "Corrente",
    page: 4,
    objectives: [
      "Distinguir a posição dos elos coloridos na montagem da conferência após as voltas.",
      "Revisar liberação do tensor, guias, vedação e sinais de ruído persistente.",
    ],
    explanation: [
      "A fonte distingue os elos coloridos usados na montagem das marcas das engrenagens e ferramentas conferidas após o giro. Não conclua que o sincronismo está incorreto apenas porque um elo colorido não voltou à posição inicial; confirme pelo manual da aplicação.",
      "Tensor hidráulico, guias, fixações, vedação e óleo trabalham em conjunto. Não interprete ruído persistente como funcionamento normal nem tente compensar uma montagem duvidosa com novas partidas.",
    ],
  },
  {
    id: "avaliacao",
    title: "Avaliação final",
    page: null,
    objectives: [
      "Interpretar os três checklists e reconhecer seus limites de aplicação.",
    ],
    explanation: [
      "Responda às dez perguntas. A correção e as explicações são calculadas no servidor; a etapa é concluída ao atingir 70%. Visitar a tela ou ouvir o material não conclui a aula.",
    ],
  },
];
export function pageTranscript(page: SourcePage): string[] {
  return [
    "Ponto do Motor. AULA 02.",
    page.title,
    ...(page.folio ? [`Conferência ${page.folio}.`] : []),
    page.subtitle,
    ...page.points.flatMap((point, index) => [
      `Ponto ${index + 1}. ${point.title}.`,
      ...point.lines.map(
        (line) =>
          `${line.kind === "ok" ? "Condição esperada" : "Sinal de problema"}: ${line.text}.`,
      ),
    ]),
    ...page.captions,
    ...(page.release.length ? ["Só dê partida se:", ...page.release] : []),
    `Créditos e referência da página: ${page.footnote}`,
  ];
}
