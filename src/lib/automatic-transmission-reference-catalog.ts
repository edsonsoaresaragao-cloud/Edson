import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const automaticTransmissionSystems = [
  { id: "conversor", name: "Conversor e alimentação de ATF" },
  { id: "planetarios", name: "Conjuntos planetários" },
  { id: "acoplamentos", name: "Embreagens e freios" },
  { id: "hidraulica", name: "Comando hidráulico e eletrônico" },
  { id: "estrutura", name: "Carcaça e saída" },
] as const;
const part = (
  number: number,
  name: string,
  system: string,
  description: string,
  note: string,
  aliases: readonly string[] = [],
): VisualPart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
});

/** Numbering follows the longitudinal cutaway and principal list of the supplied reference. */
export const automaticTransmissionParts: readonly VisualPart[] = [
  part(
    1,
    "Conversor de torque",
    "conversor",
    "Transfere o torque do motor à transmissão por meio do ATF. A bomba impulsora movimenta o fluido, a turbina recebe esse movimento e o estator redireciona o retorno, permitindo multiplicação de torque em determinadas condições.",
    "A bomba impulsora do conversor é diferente da bomba de óleo do item 2. O lock-up pode unir mecanicamente a entrada e a turbina quando comandado; aplicação, patinação e funcionamento do estator dependem da transmissão.",
    ["torque converter", "turbina", "estator", "impulsor", "lock up"],
  ),
  part(
    2,
    "Bomba de óleo",
    "conversor",
    "Faz circular o ATF e fornece vazão para os circuitos de pressão, lubrificação e arrefecimento da transmissão, conforme o tipo de acionamento do projeto.",
    "Neste exemplo a bomba é acionada pelo motor através do cubo do conversor e continua girando em P e N. Há transmissões com bombas auxiliares elétricas; pressão e procedimento de teste precisam ser os da aplicação.",
    ["bomba ATF", "gerotor", "oil pump"],
  ),
  part(
    3,
    "Conjunto planetário (1)",
    "planetarios",
    "Combina engrenagem solar, planetas, porta-satélites e coroa interna para obter uma relação entre entrada e saída, conforme os elementos acionados, travados ou unidos.",
    "A numeração acompanha o corte da referência. A demonstração usa estágios planetários simples para explicar a cinemática; não reproduz as conexões de uma caixa comercial nem sua tabela de aplicação.",
    [
      "planetário dianteiro",
      "solar",
      "coroa",
      "porta satelites",
      "epicicloidal",
    ],
  ),
  part(
    4,
    "Conjunto de embreagens e discos (1)",
    "acoplamentos",
    "Acopla elementos internos por pressão hidráulica. Discos de atrito e separadores de aço são comprimidos para transmitir torque entre componentes do trem de engrenagens.",
    "Desgaste, folgas, pistões, vedações e pressão devem ser verificados conforme o projeto. A sequência ilustrada de atuação é didática; não permite identificar quais discos aplicar em uma transmissão real.",
    ["embreagem multidisco", "clutch pack", "disco de fricção", "tambor"],
  ),
  part(
    5,
    "Conjunto planetário (2)",
    "planetarios",
    "Participa da composição das relações de marcha, combinando o movimento de sua solar, coroa e porta-satélites com os demais elementos previstos na transmissão.",
    "As caixas podem usar planetários simples, compostos ou arranjos como Simpson e Ravigneaux. Os três conjuntos separados do desenho não definem uma arquitetura universal.",
    ["segundo planetário", "planetary gear"],
  ),
  part(
    6,
    "Conjunto de embreagens e discos (2)",
    "acoplamentos",
    "Realiza outro acoplamento comandado entre elementos internos, permitindo alterar o caminho do torque e a relação de transmissão em conjunto com os freios.",
    "Não se trata de embreagem acionada por pedal. A ordem de enchimento, o controle de pressão e a sobreposição das trocas são específicos da caixa e não são simulados fisicamente neste modelo.",
    ["segunda embreagem", "pacote de discos", "pistão hidráulico"],
  ),
  part(
    7,
    "Conjunto planetário (3)",
    "planetarios",
    "Integra o trem de engrenagens que produz as relações de avanço, direta, sobremarcha ou ré, de acordo com os vínculos e comandos da construção utilizada.",
    "Na demonstração, este estágio mostra a sobremarcha quando o porta-satélites é a entrada e a solar fica retida. Isso explica uma possibilidade cinemática, sem prescrever a atuação de uma caixa específica.",
    ["terceiro planetário", "overdrive", "sobremarcha"],
  ),
  part(
    8,
    "Freios (bandas/discos)",
    "acoplamentos",
    "Retêm determinados elementos do trem planetário em relação à carcaça. Essa reação permite produzir relações de redução ou inversão de sentido quando outros elementos são acionados.",
    "O modelo representa freio multidisco; algumas transmissões utilizam bandas ou outros elementos. Freios internos da caixa são diferentes dos freios das rodas. A quantidade e a aplicação dependem do projeto.",
    ["freio multidisco", "banda de freio", "brake pack", "elemento de reação"],
  ),
  part(
    9,
    "Eixo de saída",
    "estrutura",
    "Conduz o torque resultante dos conjuntos internos à transmissão final e às rodas, conforme a relação engatada e o sentido selecionado.",
    "Em P, o exemplo mostra o bloqueio mecânico pelo mecanismo de estacionamento; em N, a saída não recebe torque do motor. Em um veículo real, N permite movimento livre e P não substitui o freio de estacionamento.",
    ["output shaft", "saída do câmbio", "trava de estacionamento"],
  ),
  part(
    10,
    "Corpo de válvulas (unidade hidráulica)",
    "hidraulica",
    "Distribui e regula o ATF pressurizado por galerias e válvulas, direcionando a atuação de embreagens, freios e outros circuitos conforme os comandos da transmissão.",
    "As linhas animadas representam o fluxo de forma esquemática; não correspondem a um circuito hidráulico de diagnóstico. Limpeza, válvulas, juntas, esferas e torques precisam seguir a documentação da caixa.",
    ["valve body", "bloco hidráulico", "galerias ATF", "unidade hidraulica"],
  ),
  part(
    11,
    "Atuadores / solenoides",
    "hidraulica",
    "Transformam os comandos elétricos da unidade de controle em alterações do fluxo ou da pressão hidráulica, participando das trocas de marcha e do controle do conversor.",
    "Quantidade, resistência, corrente e estratégia de controle variam. Os solenoides destacados na animação são ilustrativos e não representam uma tabela de energização ou um teste elétrico aplicável a uma caixa real.",
    ["eletroválvula", "solenoid", "TCM", "controle eletrônico"],
  ),
  part(
    12,
    "Carcaça da transmissão",
    "estrutura",
    "Abriga os conjuntos, mantém o alinhamento dos apoios e forma as superfícies de fixação e vedação, incluindo o fechamento inferior do reservatório de ATF conforme o projeto.",
    "Campana, nervuras, alojamentos, juntas e cárter variam por aplicação. A vista explodida facilita a identificação; não define uma ordem segura de desmontagem ou os valores de montagem.",
    ["carcaça do câmbio", "campana", "cárter", "housing", "sump"],
  ),
];

export const automaticTransmissionArtwork: VisualArtwork = {
  src: "/images/automatic-transmission-reference/catalog.webp",
  columns: 4,
  rows: 4,
  aspectRatio: 1,
  rowBounds: [0, 333 / 1254, 648 / 1254, 940 / 1254, 1],
  caption: "Ilustração didática gerada",
};
export const automaticTransmissionAssemblies: readonly VisualAssembly[] = [
  {
    id: "montado",
    name: "Transmissão automática montada",
    system: "estrutura",
    imageCell: 12,
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description:
      "Vista externa do exemplo longitudinal com conversor de torque, carcaça nervurada, cárter e saída.",
    details: [
      "A aparência não identifica fabricante, modelo ou compatibilidade.",
      "A vista em corte da interação expõe os conjuntos internos.",
    ],
  },
  {
    id: "explodida",
    name: "Vista explodida dos conjuntos",
    system: "estrutura",
    imageCell: 13,
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description:
      "Conjuntos separados ao longo do eixo para identificar conversor, bomba, planetários, embreagens, freios, saída e comando hidráulico.",
    details: [
      "A separação é didática e não indica sequência de serviço.",
      "A lista preserva os 12 números do corte longitudinal da referência.",
    ],
  },
  {
    id: "conversor",
    name: "Conversor de torque em detalhe",
    system: "conversor",
    imageCell: 14,
    partNumbers: [1, 2],
    description:
      "Carcaça, bomba impulsora, turbina e estator aparecem separados para explicar a transmissão hidrodinâmica e o lock-up.",
    details: [
      "O estator redireciona o fluido em condições de multiplicação; sua roda livre muda o comportamento conforme a operação.",
      "A bomba de óleo do item 2 é um conjunto distinto da impulsora do conversor.",
    ],
  },
  {
    id: "planetario",
    name: "Conjunto planetário em detalhe",
    system: "planetarios",
    imageCell: 15,
    partNumbers: [3, 5, 7, 8],
    description:
      "Coroa de dentes internos, solar, planetas e porta-satélites formam o conjunto que permite diferentes relações.",
    details: [
      "Com solar acionada e coroa retida, o porta-satélites entrega redução.",
      "Com porta-satélites retido, solar e coroa giram em sentidos opostos.",
      "Unir dois elementos faz o conjunto girar solidário, em relação direta.",
    ],
  },
];
export const automaticTransmissionVisualCatalog: VisualCatalog = {
  id: "transmissao-automatica",
  name: "Transmissão automática",
  className: "automatic-transmission-reference-catalog",
  title: "Transmissão automática, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / CONVERSOR DE TORQUE",
  description:
    "Explore os 12 conjuntos da referência com imagens individuais, funções, vista explodida, conversor e detalhes dos planetários.",
  searchTerms:
    "transmissão automática câmbio automático conversor ATF automatic transmission",
  searchPlaceholder: "Nome, número ou função: conversor, 10, solenoide…",
  systemLabel: "Sistema da transmissão",
  assemblyLabel: "Conjuntos e detalhes",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/transmissao-automatica",
  interactiveLabel: "Explorar transmissão automática interativa",
  systems: automaticTransmissionSystems,
  parts: automaticTransmissionParts,
  assemblies: automaticTransmissionAssemblies,
  partArtwork: automaticTransmissionArtwork,
  assemblyArtwork: automaticTransmissionArtwork,
  overview: {
    kind: "sprite",
    artwork: automaticTransmissionArtwork,
    cell: 12,
    alt: "Ilustração gerada de transmissão automática longitudinal montada",
    caption: "Transmissão com conversor · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      items: [
        "O motor gira a bomba impulsora do conversor e aciona a bomba de óleo neste exemplo.",
        "O ATF movimenta a turbina e transfere torque à entrada; o estator pode permitir multiplicação em determinadas condições.",
        "A unidade de controle comanda solenoides, e o corpo de válvulas distribui a pressão aos elementos de aplicação.",
        "Embreagens acoplam e freios retêm elementos dos planetários, estabelecendo o caminho do torque.",
        "A relação resultante conduz o movimento ao eixo de saída. A seleção de P, R, N ou D altera os vínculos; o lock-up pode reduzir o escorregamento do conversor quando autorizado.",
      ],
    },
    {
      title: "Relações: referência e demonstração",
      description:
        "O cartaz mostra faixas ilustrativas de cinco marchas: 2,80–3,20; 1,50–1,80; 1,00–1,30; 0,70–0,90; 0,60–0,75; e ré 2,00–2,90. A animação usa outras relações calculadas para três estágios simples: 3,50; 1,96; 1,40; 1,00; 0,71; e ré −2,50. Esses valores não são especificações de uma caixa comercial.",
      items: [
        "As relações exibidas comparam a entrada dos planetários com a saída, sem incluir o escorregamento do conversor.",
        "Os estágios didáticos não reproduzem uma tabela de aplicação de embreagens, freios ou solenoides de fabricante.",
      ],
    },
    {
      title: "Manutenção preventiva",
      items: [
        "Utilize o ATF com a especificação exata da transmissão identificada.",
        "Confira nível, temperatura e condição do fluido pelo procedimento do fabricante; não adote uma quilometragem universal de troca.",
        "Respeite o plano de serviço para ATF e filtro e verifique o arrefecimento do câmbio.",
        "Investigue vazamentos em juntas, retentores, carcaça e linhas de fluido.",
        "Realize diagnóstico por scanner e siga os procedimentos de adaptação ou atualização apenas quando previstos para a aplicação.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      groups: [
        {
          name: "Trancos ou demora para engatar",
          text: "Investigue nível e condição do ATF, comandos eletrônicos, pressão, válvulas e elementos de aplicação conforme o diagnóstico da caixa.",
        },
        {
          name: "Patinação",
          text: "Aumento de rotação sem aceleração correspondente pode envolver pressão insuficiente, desgaste ou outros problemas; não condene uma peça pelo sintoma isolado.",
        },
        {
          name: "Superaquecimento ou vazamento",
          text: "Verifique fluido, vedação e circuito de arrefecimento segundo os dados da aplicação.",
        },
        {
          name: "Luz de advertência ou códigos no TCM",
          text: "Leia códigos e parâmetros, inspecione alimentação, conectores e chicote e realize os testes previstos antes de substituir componentes.",
        },
      ],
    },
  ],
  notes: [
    "Imagens didáticas geradas a partir dos conjuntos da referência, sem marca ou identificação OEM. Não são fotografias de fabricante nem desenhos certificados.",
    "A numeração 1–12 segue a lista e o corte longitudinal. Os rótulos repetidos na faixa explodida do cartaz não renumeram as peças.",
    "Modelo com conversor de torque; não representa CVT, DCT ou todas as arquiteturas de câmbio automático.",
    "As imagens e o movimento explicam funções; não definem compatibilidade, sequência de serviço, pressão, folgas ou torques de montagem.",
  ],
};
