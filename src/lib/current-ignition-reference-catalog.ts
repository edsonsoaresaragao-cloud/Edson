import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const currentIgnitionSystems = [
  { id: "controle", name: "ECU e driver" },
  { id: "ignicao", name: "Bobinas e velas" },
  { id: "sensores", name: "Sensores do motor" },
  { id: "alimentacao", name: "Conexões e alimentação" },
  { id: "bobina", name: "Interior da bobina" },
  { id: "contexto", name: "Contexto de funcionamento" },
] as const;
type CurrentIgnitionSystem = (typeof currentIgnitionSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: CurrentIgnitionSystem,
  description: string,
  note: string,
  aliases: readonly string[] = [],
  kind?: "context",
): VisualPart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
  ...(kind ? { kind } : {}),
});

/** 1–6 are the system groups in the chart; 7–13 detail the coil, and 14 is engine context. */
export const currentIgnitionParts: readonly VisualPart[] = [
  part(
    1,
    "ECU do motor",
    "controle",
    "Processa as informações dos sensores e calcula o momento da ignição e o período de carga das bobinas, conforme a estratégia de gerenciamento do motor.",
    "A ECU comanda o estágio de potência; ela não é a fonte direta da alta tensão da vela. Falhas de alimentação, massa, sinais e comunicação devem ser investigadas antes de atribuir o defeito ao módulo.",
    ["central do motor", "módulo de controle", "ECM", "engine control unit"],
  ),
  part(
    2,
    "Bobinas de ignição",
    "ignicao",
    "Produzem a tensão necessária à centelha a partir da energia armazenada no campo magnético. Podem ser individuais ou reunidas em conjuntos, conforme a aplicação.",
    "O exemplo COP usa uma bobina por cilindro. Conjuntos em régua podem reunir várias bobinas ou diferentes saídas; sua forma externa não determina, sozinha, a estratégia elétrica ou a eficiência.",
    [
      "bobina individual",
      "coil on plug",
      "COP",
      "bobina caneta",
      "bobina em régua",
    ],
  ),
  part(
    3,
    "Velas de ignição",
    "ignicao",
    "Recebem a alta tensão da bobina e permitem a descarga elétrica entre os eletrodos, iniciando a combustão da mistura na câmara do motor.",
    "Confira aplicação, desgaste, depósitos, folga e integridade do isolador conforme o fabricante. Falhas de combustão também podem envolver mistura, injeção, compressão e outras causas.",
    ["vela", "spark plug", "eletrodos", "centelha", "faísca"],
  ),
  part(
    4,
    "Sensores do motor",
    "sensores",
    "Informam rotação, fase, carga, temperatura e outras condições ao gerenciamento eletrônico. A ECU utiliza os sinais previstos no projeto para determinar suas estratégias de funcionamento.",
    "A referência inclui CKP, CMP, MAP/MAF, TPS, ECT e sonda lambda. Nem todo veículo utiliza todos eles da mesma forma; a lambda atua no controle da mistura e não é um disparador direto de cada centelha.",
    [
      "sensor de rotação",
      "sensor de fase",
      "CKP",
      "CMP",
      "MAP",
      "MAF",
      "TPS",
      "ECT",
      "sonda lambda",
    ],
  ),
  part(
    5,
    "Chicote e conectores",
    "alimentacao",
    "Interligam sensores, ECU, alimentação e comandos das bobinas, mantendo as conexões elétricas e os retornos de massa necessários ao sistema.",
    "Inspecione contato, oxidação, travas, isolamento e quedas de tensão pelo procedimento da aplicação. Cores e trajetos do cartaz representam funções, sem definir pinagem, protocolo ou ligações para reparo.",
    ["fiação", "cablagem", "harness", "plugues", "aterramento"],
  ),
  part(
    6,
    "Alimentação elétrica (12 V nominal)",
    "alimentacao",
    "Fornece energia aos circuitos de gerenciamento e às bobinas pelos caminhos de proteção e distribuição previstos no veículo.",
    "Bateria e fusível ilustram a alimentação nominal de 12 V; a tensão real varia com as condições de operação. Circuitos de controle, proteção e aterramento exigem identificação própria, sem presumir um esquema universal.",
    ["bateria", "fusível", "positivo", "energia", "power supply"],
  ),
  part(
    7,
    "Conector da bobina",
    "alimentacao",
    "Faz a interface elétrica entre a bobina e o chicote, conduzindo os circuitos de alimentação, massa e comando que existirem na aplicação.",
    "Quantidade de pinos e função de cada terminal variam com bobinas e drivers. Não deduza ligações pela aparência ou pela quantidade de pinos da ilustração.",
    ["plugue da bobina", "coil connector", "terminais"],
  ),
  part(
    8,
    "Carcaça da bobina",
    "bobina",
    "Abriga, protege e posiciona os elementos da bobina, contribuindo para o isolamento e a fixação do conjunto no motor.",
    "A vista separada é didática. Bobinas modernas frequentemente possuem encapsulamento e não são projetadas para desmontagem ou reparo de seus enrolamentos; verifique trincas e sinais de fuga conforme a aplicação.",
    ["invólucro", "corpo plástico", "coil housing"],
  ),
  part(
    9,
    "Driver eletrônico",
    "controle",
    "Comuta a corrente do enrolamento primário em resposta ao comando eletrônico, controlando a carga e a interrupção do campo magnético da bobina.",
    "É um estágio de potência que pode estar na bobina, na ECU ou em outro módulo. Ele não gera diretamente a alta tensão; a elevação de tensão decorre da indução nos enrolamentos.",
    [
      "estágio de potência",
      "módulo de ignição",
      "IGBT",
      "transistor",
      "igniter",
    ],
  ),
  part(
    10,
    "Núcleo magnético",
    "bobina",
    "Concentra e conduz o fluxo magnético, contribuindo para o acoplamento entre os enrolamentos primário e secundário.",
    "Material e geometria dependem do projeto. A indicação de ferrite no cartaz não define todos os núcleos de bobinas; a imagem é uma referência de construção, sem especificação de material ou dimensões.",
    ["núcleo ferromagnético", "ferrite", "magnetic core"],
  ),
  part(
    11,
    "Enrolamento primário",
    "bobina",
    "Ao receber corrente durante o período de carga, estabelece o campo magnético no qual é armazenada a energia utilizada na ignição.",
    "A corrente é controlada pelo driver. Os 12 V do cartaz indicam alimentação nominal, não uma tensão constante em toda a forma de onda primária nem um valor de teste aplicável a qualquer bobina.",
    ["bobina primária", "dwell", "tempo de carga", "primary winding"],
  ),
  part(
    12,
    "Enrolamento secundário",
    "bobina",
    "A variação do fluxo magnético induz a alta tensão necessária para vencer as condições de isolamento e produzir a descarga na vela.",
    "A faixa de aproximadamente 20–40 kV do cartaz é ilustrativa. A tensão exigida para a centelha varia com a folga, a pressão, a mistura e o projeto; não é uma leitura fixa nem um limite universal.",
    ["bobina secundária", "alta tensão", "secondary winding"],
  ),
  part(
    13,
    "Isolador e contato",
    "bobina",
    "O isolador e o contato de alta tensão ligam a bobina à vela, mantendo o caminho elétrico e o isolamento previstos na construção do conjunto.",
    "Borracha ou silicone, mola e terminais variam conforme a aplicação. Inspecione trincas, contaminação, marcas de fuga e contato com a vela pelo procedimento do fabricante.",
    ["cachimbo", "borracha", "silicone", "mola de contato", "coil boot"],
  ),
  part(
    14,
    "Motor e referência de rotação (contexto)",
    "contexto",
    "Relaciona a centelha ao ciclo dos cilindros e à referência de posição do virabrequim, ajudando a visualizar o instante de ignição no motor.",
    "O motor de quatro cilindros é contexto de funcionamento, não uma peça de reposição do interior da bobina. Ordem de ignição, sincronismo e estratégias exigem identificação do motor e da calibração.",
    ["câmara de combustão", "virabrequim", "pistões", "ciclo do motor"],
    "context",
  ),
];

export const currentIgnitionArtwork: VisualArtwork = {
  src: "/images/current-ignition-reference/catalog.webp",
  columns: 5,
  rows: 4,
  aspectRatio: (1402 * 4) / (1122 * 5),
};

export const currentIgnitionAssemblies: readonly VisualAssembly[] = [
  {
    id: "bobina-explodida",
    name: "Bobina caneta em vista explodida",
    system: "bobina",
    imageCell: 14,
    description:
      "A separação didática relaciona conector, carcaça, driver, núcleo, enrolamentos e isolador da bobina COP. Não representa uma sequência de desmontagem de uma peça encapsulada.",
    details: [
      "Conector e carcaça",
      "Driver eletrônico conforme o projeto",
      "Núcleo e enrolamentos primário/secundário",
      "Isolador e contato da vela",
    ],
    partNumbers: [7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: "sistema-cop",
    name: "Sistema COP de quatro cilindros",
    system: "controle",
    imageCell: 15,
    description:
      "A ECU recebe os sinais previstos no motor e comanda as bobinas de cada cilindro. Alimentação, chicote e velas completam o exemplo funcional de ignição eletrônica.",
    details: [
      "Sensores ligados ao gerenciamento",
      "ECU e comandos de ignição",
      "Quatro bobinas e respectivas velas no exemplo",
      "Bateria, proteção e conexões",
      "Motor como contexto, sem pinagem universal",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 14],
  },
  {
    id: "individual",
    name: "Bobina individual (COP)",
    system: "ignicao",
    imageCell: 16,
    description:
      "O exemplo Coil On Plug utiliza uma bobina instalada junto à vela de cada cilindro. A ECU e os estágios de potência controlam o instante de carga e de descarga conforme o sistema.",
    details: [
      "Uma bobina por cilindro no exemplo",
      "Conexão de baixa tensão e comando",
      "Isolador e contato próximos à vela",
      "Construção e driver específicos da aplicação",
    ],
    partNumbers: [2, 3, 7, 13],
  },
  {
    id: "regua",
    name: "Bobina em régua / conjunto",
    system: "ignicao",
    imageCell: 17,
    description:
      "Reúne bobinas e/ou saídas de ignição em uma unidade para vários cilindros. Quantidade de bobinas, circuito e estratégia de centelha dependem do projeto, não apenas do formato externo.",
    details: [
      "Carcaça integrada",
      "Múltiplas bobinas ou saídas conforme o projeto",
      "Interfaces com chicote e velas",
      "Não é automaticamente uma única bobina nem uma solução menos eficiente",
    ],
    partNumbers: [2, 3],
  },
  {
    id: "sinais",
    name: "Sinais, alimentação e alta tensão",
    system: "alimentacao",
    imageCell: 0,
    artwork: {
      src: "/images/current-ignition-reference/signal-flow.svg",
      columns: 1,
      rows: 1,
      aspectRatio: 800 / 500,
      caption: "Esquema funcional didático · sem pinagem",
    },
    description:
      "A alimentação fornece energia, os sensores informam condições de operação e a ECU envia comandos ao estágio de potência. A bobina produz a alta tensão para a respectiva vela.",
    details: [
      "Vermelho: alimentação nominal no esquema",
      "Verde: informações dos sensores para a ECU",
      "Azul: comando eletrônico das bobinas",
      "Amarelo: caminho ilustrativo da alta tensão até as velas",
      "Cores funcionais do cartaz, sem definir fios ou terminais reais",
    ],
    partNumbers: [1, 2, 4, 5, 6, 7, 9],
  },
  {
    id: "centelha",
    name: "Centelha na câmara de combustão",
    system: "contexto",
    imageCell: 19,
    description:
      "A descarga ocorre entre os eletrodos da vela e inicia a combustão da mistura. A expansão dos gases atua sobre o pistão e se relaciona ao ciclo de funcionamento do motor.",
    details: [
      "Alta tensão conduzida pela bobina e seu contato",
      "Descarga no espaço entre eletrodos",
      "Mistura e condições da câmara",
      "Pistão e motor como contexto de funcionamento",
    ],
    partNumbers: [2, 3, 13, 14],
  },
];

export const currentIgnitionVisualCatalog: VisualCatalog = {
  id: "ignicao-atual",
  name: "Ignição atual / COP",
  className: "current-ignition-reference-catalog",
  title: "Ignição atual, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / IGNIÇÃO ELETRÔNICA",
  description:
    "Explore seis grupos do sistema, sete detalhes da bobina e o contexto do motor: 14 identificações com imagens e funções. Veja a bobina COP, a régua de bobinas e o caminho dos sinais e da centelha.",
  searchTerms:
    "ignição atual eletrônica sistema COP coil on plug bobina caneta",
  searchPlaceholder: "Nome, número ou função: driver, 11, centelha…",
  systemLabel: "Sistema da ignição",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  partLabels: {
    tab: "Identificações",
    singular: "identificação",
    plural: "identificações",
    feminine: true,
  },
  interactiveHref: "/categorias/ignicao/atual",
  interactiveLabel: "Explorar ignição atual interativa",
  systems: currentIgnitionSystems,
  parts: currentIgnitionParts,
  assemblies: currentIgnitionAssemblies,
  partArtwork: currentIgnitionArtwork,
  assemblyArtwork: currentIgnitionArtwork,
  overview: {
    kind: "sprite",
    artwork: currentIgnitionArtwork,
    cell: 15,
    alt: "Ilustração didática gerada de sistema COP com ECU, bobinas e velas para quatro cilindros",
    caption: "Ignição eletrônica · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      description:
        "A ECU e o estágio de potência controlam o instante de ignição e o tempo de carga da bobina conforme as condições do motor.",
      items: [
        "Os sensores informam rotação, fase, carga, temperatura e outras condições previstas no gerenciamento.",
        "A ECU calcula o período de carga e o instante de ignição conforme os sinais e a calibração.",
        "O driver comuta a corrente primária, estabelecendo o campo magnético durante a carga.",
        "Ao interromper a corrente, a variação do fluxo magnético induz alta tensão no secundário.",
        "A descarga atravessa o espaço entre os eletrodos da vela e inicia a combustão na câmara.",
        "A pressão da combustão atua sobre o pistão; o gerenciamento acompanha o funcionamento pelos sinais disponíveis.",
      ],
    },
    {
      title: "Sensores relacionados ao gerenciamento",
      description:
        "As entradas e suas estratégias variam entre motores. Os desenhos agrupam funções e não formam uma lista obrigatória de sensores de toda aplicação.",
      groups: [
        {
          name: "CKP: rotação e posição",
          text: "Fornece a referência de rotação e posição do virabrequim usada no sincronismo do gerenciamento.",
        },
        {
          name: "CMP: fase do motor",
          text: "Informa a posição do comando para a identificação de fase conforme a arquitetura.",
        },
        {
          name: "MAP / MAF: carga",
          text: "Mede pressão do coletor ou massa de ar, conforme o sensor, auxiliando a determinação da carga.",
        },
        {
          name: "TPS: posição da borboleta",
          text: "Informa a posição de abertura da borboleta para as estratégias do gerenciamento.",
        },
        {
          name: "ECT: temperatura",
          text: "Informa a temperatura do líquido de arrefecimento, utilizada em ajustes de operação do motor.",
        },
        {
          name: "Sonda lambda: mistura",
          text: "Monitora o oxigênio no escape para o controle da mistura. Não dispara diretamente cada centelha da bobina.",
        },
      ],
    },
    {
      title: "Recursos e vantagens possíveis",
      description:
        "Os resultados dependem do projeto, da calibração, do estado dos componentes e das condições de operação; o formato da bobina não garante sozinho maior torque ou menor consumo.",
      items: [
        "Controle programado do instante de ignição em função das condições do motor.",
        "Gerenciamento do período de carga e da corrente dentro dos limites do sistema.",
        "Recursos de controle da combustão que podem contribuir para desempenho e estabilidade.",
        "Integração com o controle de mistura e emissões, conforme os recursos e a calibração do veículo.",
        "Redução de componentes mecânicos de distribuição quando o sistema dispensa distribuidor e platinado; velas e isoladores continuam exigindo inspeção.",
        "Diagnóstico por códigos e parâmetros do gerenciamento, com interpretação e testes da aplicação.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Falhas de combustão podem envolver ignição, alimentação, injeção, compressão e outras causas. Um código de falha não identifica automaticamente a peça defeituosa.",
      groups: [
        {
          name: "Bobina e isolamento",
          text: "Podem ocorrer falhas de combustão, perda de desempenho e indicação de avaria. Conferir alimentação, comando, contato e isolamento conforme o procedimento.",
        },
        {
          name: "Velas desgastadas",
          text: "Desgaste, folga ou aplicação incorreta podem causar dificuldades de partida e funcionamento irregular; avaliar também as demais condições do motor.",
        },
        {
          name: "Rotação ou fase",
          text: "Falhas nos sinais podem impedir a partida, provocar desligamento ou outras estratégias de funcionamento, dependendo da aplicação.",
        },
        {
          name: "Chicote e conectores",
          text: "Mau contato, oxidação, isolamento danificado ou quedas de tensão podem gerar falhas intermitentes e sinais incorretos.",
        },
        {
          name: "ECU e estágio de potência",
          text: "A confirmação de defeito exige verificar alimentação, massa, sinais e cargas conectadas; falhas externas podem imitar um problema do módulo.",
        },
      ],
    },
    {
      title: "Evolução da ignição: comparação de arquiteturas",
      description:
        "As denominações resumem exemplos históricos, não uma classificação universal nem uma garantia de consumo, emissões ou precisão por formato de bobina.",
      groups: [
        {
          name: "Convencional",
          text: "No exemplo com platinado, a comutação é mecânica e o distribuidor encaminha a alta tensão. Ajustes e manutenção dependem dos componentes presentes.",
        },
        {
          name: "Eletrônica com distribuidor",
          text: "Um módulo eletrônico pode assumir a comutação, mantendo o distribuidor para a alta tensão. Controle do avanço e integração ao gerenciamento variam.",
        },
        {
          name: "Atual controlada pela ECU",
          text: "No exemplo COP, a ECU controla os comandos de ignição sem distribuidor mecânico. Bobinas individuais e conjuntos integrados podem empregar diferentes estratégias e diagnósticos.",
        },
      ],
    },
    {
      title: "Aplicação e valores da referência",
      groups: [
        {
          name: "Motores com ignição por centelha",
          text: "Aplicável a projetos que utilizam velas de ignição, incluindo diversas aplicações com gasolina, etanol, flex e GNV. O diesel convencional utiliza ignição por compressão, sem este mesmo conjunto de bobinas e velas de centelha.",
        },
        {
          name: "12 V nominal",
          text: "Representa a alimentação de referência do sistema. Tensão real e formas de onda dependem da operação, dos circuitos e da aplicação.",
        },
        {
          name: "Alta tensão ilustrativa",
          text: "Os aproximadamente 20–40 kV citados no cartaz não são uma saída constante nem uma especificação universal. A demanda de tensão depende das condições da vela e da câmara.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar os componentes e detalhes da referência enviada. Não são fotografias de fabricante nem diagramas de uma aplicação específica.",
    "Os números 1–6 preservam os grupos principais do cartaz; 7–13 identificam os detalhes da bobina, e 14 é contexto do motor. A correspondência numérica acompanha o interativo COP existente.",
    "Driver integrado, materiais do núcleo, quantidade de pinos, bobinas em régua e estratégias de centelha dependem do projeto. As separações de bobina encapsulada são apenas didáticas.",
    "Cores, trajetos, tensões e proporções da imagem não definem pinagem, protocolo, procedimento de desmontagem ou valores de diagnóstico. Consulte os dados da aplicação identificada.",
  ],
};
