import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const electricalReferenceSystems = [
  { id: "energia", name: "Geração e partida" },
  { id: "protecao", name: "Proteção e distribuição" },
  { id: "controle", name: "Controle eletrônico" },
  { id: "chicotes", name: "Chicotes e conexões" },
  { id: "sinais", name: "Sensores e atuadores" },
  { id: "massas", name: "Retorno e aterramento" },
] as const;
type ElectricalReferenceSystem =
  (typeof electricalReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: ElectricalReferenceSystem,
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

/** Principal identifiers follow the 1–11 legend of the supplied electrical chart. */
export const electricalReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Bateria",
    "energia",
    "Armazena energia e participa da alimentação dos circuitos, incluindo a partida, conforme o estado de operação e a arquitetura do veículo.",
    "A referência utiliza um sistema nominal de 12 V de veículo a combustão. Tipo, capacidade, temperatura e estado de carga alteram as condições de teste; a tensão nominal não é um valor fixo em toda situação.",
    ["acumulador", "bateria de partida", "starter battery"],
  ),
  part(
    2,
    "Alternador",
    "energia",
    "Converte energia mecânica do motor em energia elétrica para atender consumidores e participar da recarga da bateria no exemplo representado.",
    "A tensão de carga depende da aplicação, da temperatura, do estado da bateria e do gerenciamento. Carga inteligente pode variar a tensão; a faixa citada no cartaz não é um limite universal.",
    ["gerador automotivo", "alternator", "sistema de carga"],
  ),
  part(
    3,
    "Motor de partida",
    "energia",
    "Utiliza energia elétrica para produzir o torque que movimenta o motor térmico durante a partida, nas condições de acionamento previstas.",
    "Inspecione alimentação, circuito de comando, cabos e quedas de tensão conforme o veículo. Motor, solenoide, conexões e condições mecânicas devem ser relacionados aos sintomas antes de definir a causa.",
    ["arranque", "starter motor", "solenoide de partida"],
  ),
  part(
    4,
    "Caixa de fusíveis e relés",
    "protecao",
    "Organiza circuitos de distribuição, proteção e acionamento. No exemplo, reúne fusíveis para sobrecorrente e relés para comutação das cargas previstas.",
    "Fusível e relé possuem funções diferentes. Posição, tipo, capacidade, circuitos e eventual controle eletrônico integrado são específicos; confira a identificação no diagrama da aplicação.",
    ["central de distribuição", "BJB", "fuse box", "relay box"],
  ),
  part(
    5,
    "Unidades de comando / ECUs",
    "controle",
    "Processam informações e executam estratégias de controle próprias de cada sistema, como motor, freios, carroceria e segurança, conforme os recursos do veículo.",
    "ECU do motor, módulo ABS, BCM e SRS são exemplos com funções diferentes. Protocolos, software, conectores e configuração variam; um código de falha não confirma sozinho defeito no módulo.",
    [
      "central eletrônica",
      "módulos de controle",
      "ECM",
      "BCM",
      "SRS",
      "control units",
    ],
  ),
  part(
    6,
    "Chicotes elétricos",
    "chicotes",
    "Organizam condutores, ramificações e proteções que transportam alimentação, retornos e sinais entre os componentes e as regiões do veículo.",
    "Cores, bitolas, rotas e identificação de terminais seguem o projeto. As cores funcionais do cartaz são uma legenda didática, não um padrão universal de fios ou uma definição de pinagem.",
    ["fiação", "feixe de fios", "wiring harness", "loom"],
  ),
  part(
    7,
    "Conectores",
    "chicotes",
    "Estabelecem as interfaces elétricas entre chicotes e componentes pelos contatos previstos, permitindo a ligação dos circuitos de alimentação e sinal.",
    "Vedação, retenção, número de vias e capacidade dependem da aplicação. Um conector pode ser selado, multipolar e possuir trava ao mesmo tempo; aparência e cor não determinam sua pinagem.",
    [
      "plugues",
      "tomadas elétricas",
      "electrical connectors",
      "terminais de contato",
    ],
  ),
  part(
    8,
    "Sensores",
    "sinais",
    "Convertem grandezas físicas, como rotação, temperatura ou pressão, em informações utilizadas pelo gerenciamento dos sistemas do veículo.",
    "Os componentes ilustrados são exemplos. Alimentação, sinal, redundância e método de inspeção dependem de cada sensor; não se deve presumir uma tensão ou um teste de resistência comum a todos.",
    ["transdutores", "entrada de sinais", "sensors", "CKP", "ECT", "MAP"],
  ),
  part(
    9,
    "Atuadores",
    "sinais",
    "Recebem comandos para executar ações, como dosar combustível, movimentar válvulas ou acionar motores elétricos, conforme o sistema.",
    "Injetor, válvula de purga e motor de ventilação são exemplos. Alimentação, estágio de potência e forma de comando variam; a ilustração não estabelece um procedimento de acionamento direto ou universal.",
    ["saídas comandadas", "cargas controladas", "actuators", "eletroválvulas"],
  ),
  part(
    10,
    "Pontos de aterramento",
    "massas",
    "Fornecem os retornos e as referências elétricas previstos no projeto, por ligações de massa entre circuitos, componentes, motor e carroceria conforme a aplicação.",
    "Verifique contato, integridade e queda de tensão nas condições previstas. A localização e a ligação são definidas pelo diagrama do veículo; os símbolos de massa do cartaz são didáticos.",
    [
      "massa",
      "cabo de massa",
      "ground strap",
      "ground points",
      "retorno elétrico",
    ],
  ),
  part(
    11,
    "Barramentos de distribuição",
    "protecao",
    "Reúnem e distribuem alimentação entre circuitos por condutores comuns dimensionados para as cargas e as conexões previstas no sistema.",
    "O barramento de potência ilustrado distribui energia e não equivale à rede CAN de dados. Material, isolamento, proteções e pontos de conexão dependem da arquitetura elétrica do veículo.",
    [
      "barramento de potência",
      "distribuidor de energia",
      "power busbar",
      "bus bar",
    ],
  ),
];

export const electricalReferenceArtwork: VisualArtwork = {
  src: "/images/electrical-reference/catalog.webp",
  columns: 4,
  rows: 5,
  aspectRatio: 1122 / 4 / (1402 / 5),
  rowBounds: [0, 281 / 1402, 561 / 1402, 841 / 1402, 1122 / 1402, 1],
};

export const electricalReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "visao-geral",
    name: "Visão geral do sistema elétrico",
    system: "energia",
    imageCell: 11,
    description:
      "A vista relaciona componentes e regiões de um veículo a combustão com sistema nominal de 12 V. Os chicotes são apresentados como contexto, sem definir conexões reais de uma aplicação.",
    details: [
      "Bateria, geração e partida",
      "Proteção e distribuição",
      "Módulos, sensores e atuadores",
      "Chicotes, conectores e massas",
      "Disposição ilustrativa dos conjuntos no veículo",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: "chicote-motor",
    name: "Chicote do motor",
    system: "chicotes",
    imageCell: 12,
    description:
      "Relaciona os circuitos do gerenciamento do motor, como interfaces com ECU, sensores e atuadores, conforme a construção. A imagem mostra o chicote separado dos componentes.",
    details: [
      "Ramificações do compartimento do motor",
      "Interfaces de sensores e atuadores",
      "Conectores e proteção dos condutores",
      "Fixação e afastamentos previstos no projeto",
      "Sem definição universal de cores ou pinagem",
    ],
    partNumbers: [5, 6, 7, 8, 9, 10],
  },
  {
    id: "chicote-cabine",
    name: "Chicote da cabine",
    system: "chicotes",
    imageCell: 13,
    description:
      "Organiza interfaces de painel, conforto e outros sistemas internos previstos no veículo. Distribuição de alimentação, comunicação e integração com o BCM dependem da aplicação.",
    details: [
      "Painel e comandos",
      "Climatização e conforto",
      "Multimídia e comunicação quando presentes",
      "Distribuição e interfaces com módulos",
      "Rotas e conectores específicos do veículo",
    ],
    partNumbers: [4, 5, 6, 7, 9, 10, 11],
  },
  {
    id: "chicote-portas",
    name: "Chicote das portas",
    system: "chicotes",
    imageCell: 14,
    description:
      "Leva alimentação e sinais entre carroceria e equipamentos da porta, como vidro, trava e retrovisor quando presentes. A passagem flexível acomoda os movimentos previstos.",
    details: [
      "Passagem flexível entre porta e carroceria",
      "Interfaces de vidros, travas e retrovisores",
      "Sensores e comandos conforme o equipamento",
      "Conectores e fixação",
      "Integridade dos condutores na região de movimento",
    ],
    partNumbers: [6, 7, 8, 9, 10],
  },
  {
    id: "chicote-traseiro",
    name: "Chicote traseiro",
    system: "chicotes",
    imageCell: 15,
    description:
      "Relaciona os circuitos da região traseira, como iluminação, fechadura e sensores previstos. Equipamentos e divisão das ramificações variam por carroceria e versão.",
    details: [
      "Lanternas e iluminação traseira",
      "Fechadura e tampa do compartimento de bagagem",
      "Sensores de estacionamento quando presentes",
      "Conectores, massas e proteção",
      "Ramificações conforme os equipamentos do veículo",
    ],
    partNumbers: [6, 7, 8, 9, 10],
  },
  {
    id: "chicote-teto",
    name: "Chicote do teto",
    system: "chicotes",
    imageCell: 16,
    description:
      "Relaciona iluminação interna e acessórios da região superior, conforme os equipamentos. Circuitos de segurança podem possuir rotas próprias e devem ser identificados pelo diagrama da aplicação.",
    details: [
      "Iluminação interna",
      "Teto solar e acessórios quando presentes",
      "Antenas e interfaces previstas",
      "Integração com módulos conforme o projeto",
      "Circuitos de segurança com identificação específica",
    ],
    partNumbers: [5, 6, 7, 9],
  },
  {
    id: "conectores",
    name: "Exemplos de conectores",
    system: "chicotes",
    imageCell: 17,
    description:
      "Os exemplos permitem observar vedação, retenção, múltiplas vias e interfaces de sensores ou atuadores. Essas características podem coexistir em um mesmo conector.",
    details: [
      "Selado: vedação conforme o projeto e sua condição",
      "Com trava: retenção do acoplamento",
      "Multipolar: várias vias de contato",
      "Sensor ou atuador: interface conforme a função",
      "Características sobrepostas, sem pinagem definida pela aparência",
    ],
    partNumbers: [7],
  },
  {
    id: "fusivel-rele",
    name: "Fusíveis, relés e distribuição",
    system: "protecao",
    imageCell: 18,
    description:
      "Fusíveis atuam na proteção contra sobrecorrente, enquanto relés comutam cargas nos circuitos previstos. Caixas e barramentos organizam a distribuição conforme o projeto.",
    details: [
      "Fusível e capacidade especificada",
      "Relé e comutação das cargas",
      "Caixa de distribuição",
      "Barramentos e interfaces previstas",
      "Proteção e acionamento possuem funções diferentes",
    ],
    partNumbers: [4, 11],
  },
  {
    id: "modulos",
    name: "ECUs: motor, ABS, BCM e SRS",
    system: "controle",
    imageCell: 19,
    description:
      "Os módulos de exemplo atendem funções distintas: gerenciamento do motor, controle de freios, carroceria e sistema de retenção suplementar. Integração e comunicação dependem do veículo.",
    details: [
      "ECU do motor: gerenciamento previsto na aplicação",
      "ABS: controle eletrônico do sistema de freios",
      "BCM: funções de carroceria e conforto",
      "SRS: gerenciamento do sistema de retenção suplementar",
      "Conectores e arquiteturas específicos de cada módulo",
    ],
    partNumbers: [5],
  },
];

export const electricalVisualCatalog: VisualCatalog = {
  id: "sistema-eletrico-eletronico",
  name: "Sistema elétrico e eletrônico",
  className: "electrical-reference-catalog",
  title: "Elétrica e eletrônica, componente por componente.",
  eyebrow: "CATÁLOGO VISUAL / ELÉTRICA AUTOMOTIVA",
  description:
    "Explore os 11 componentes numerados da referência, com imagens, funções e inspeções. Nove vistas organizam os chicotes por região, os conectores, a proteção e os módulos de controle.",
  searchTerms: "sistema elétrico eletrônico automotivo electrical electronics",
  searchPlaceholder: "Nome, número ou função: chicote, 10, barramento…",
  systemLabel: "Sistema elétrico",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/eletrica-automotiva",
  interactiveLabel: "Ver conteúdos de elétrica automotiva",
  systems: electricalReferenceSystems,
  parts: electricalReferenceParts,
  assemblies: electricalReferenceAssemblies,
  partArtwork: electricalReferenceArtwork,
  assemblyArtwork: electricalReferenceArtwork,
  overview: {
    kind: "sprite",
    artwork: electricalReferenceArtwork,
    cell: 11,
    alt: "Ilustração didática gerada de componentes elétricos e chicotes organizados em um veículo a combustão",
    caption: "Energia, controle e distribuição no veículo",
  },
  sections: [
    {
      title: "Como funciona",
      description:
        "O exemplo utiliza sistema nominal de 12 V em veículo a combustão. Alimentação, proteção, comando e comunicação possuem circuitos definidos pelo projeto; os passos resumem funções.",
      groups: [
        {
          name: "1. Armazenamento e alimentação",
          text: "A bateria armazena energia e participa da alimentação dos circuitos, inclusive na partida, conforme a condição de operação.",
        },
        {
          name: "2. Geração e carga",
          text: "O alternador converte energia mecânica e atende consumidores e recarga da bateria conforme a estratégia de carga.",
        },
        {
          name: "3. Distribuição e proteção",
          text: "Caixas, fusíveis, relés, barramentos e chicotes distribuem energia, protegem e comutam os circuitos previstos.",
        },
        {
          name: "4. Processamento",
          text: "As unidades de comando interpretam sensores e informações disponíveis para executar as estratégias de cada sistema.",
        },
        {
          name: "5. Execução dos comandos",
          text: "Atuadores realizam as ações previstas, enquanto os circuitos de retorno e referência completam as condições elétricas necessárias.",
        },
      ],
    },
    {
      title: "Funções dos circuitos na referência",
      description:
        "As cores do cartaz são uma legenda didática por função, não um padrão universal de fios. Uma rede de comunicação pode atender diversos sistemas e não se limita à multimídia.",
      groups: [
        {
          name: "Motor e injeção",
          text: "Interfaces de gerenciamento, sensores e atuadores do motor conforme a aplicação.",
        },
        {
          name: "Cabine e conforto",
          text: "Painel, climatização, comandos e equipamentos internos previstos no veículo.",
        },
        {
          name: "Iluminação",
          text: "Circuitos de luzes e seus controles, com proteção e alimentação específicas.",
        },
        {
          name: "Segurança",
          text: "Sistemas como ABS e SRS possuem componentes, circuitos e procedimentos próprios.",
        },
        {
          name: "Carroceria",
          text: "Interfaces de portas, vidros, travas e demais funções de carroceria conforme o equipamento.",
        },
        {
          name: "Comunicação e multimídia",
          text: "CAN e outras redes transportam dados conforme a arquitetura. Multimídia é uma possível aplicação, não a função exclusiva da rede CAN.",
        },
        {
          name: "Carga e partida",
          text: "Circuitos dimensionados para as correntes de geração, recarga e acionamento do arranque, conforme o projeto.",
        },
        {
          name: "Aterramento e referência",
          text: "Retornos e referências previstos nos circuitos, identificados no diagrama do veículo.",
        },
      ],
    },
    {
      title: "Regiões e localização dos conjuntos",
      description:
        "As posições são exemplos de organização. Compartimentos, pontos de massa e roteamento real variam conforme a carroceria e a aplicação.",
      groups: [
        {
          name: "Compartimento do motor",
          text: "Pode reunir bateria, alternador, motor de partida, módulos, caixas de distribuição e ramificações do chicote do motor.",
        },
        {
          name: "Cabine",
          text: "Concentra interfaces de painel, comandos, conforto, BCM e redes conforme os equipamentos.",
        },
        {
          name: "Assoalho e laterais",
          text: "Podem conduzir chicotes principais, ramificações, comunicação e conexões de retorno previstas.",
        },
        {
          name: "Teto",
          text: "Abriga interfaces de iluminação, acessórios e outros circuitos definidos pelo projeto.",
        },
        {
          name: "Traseira",
          text: "Reúne conexões de lanternas, fechadura, tampa e sensores ou acessórios quando presentes.",
        },
      ],
    },
    {
      title: "Manutenção e inspeção",
      items: [
        "Verificar chicotes quanto a danos, ressecamento, atrito, proteção e fixação conforme a aplicação.",
        "Inspecionar conectores quanto a corrosão, contato, travas e condição da vedação.",
        "Conferir identificação, capacidade e funcionamento dos fusíveis e relés pelos dados do fabricante.",
        "Avaliar integridade, contato e queda de tensão nos pontos de massa nas condições de teste previstas.",
        "O cartaz cita 13,8–14,8 V como exemplo de tensão de carga em sistema nominal de 12 V. Temperatura, estado da bateria e carga inteligente variam a leitura; essa faixa não é um limite universal.",
        "Utilizar o diagrama e os procedimentos elétricos específicos do veículo para identificar circuitos, terminais e valores de teste.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Os sintomas podem ter várias causas. Códigos, tensão isolada ou aparência de uma peça não confirmam sozinhos a origem da falha.",
      groups: [
        {
          name: "Fusível abre com frequência",
          text: "Investigar curto, sobrecarga, especificação e condição do circuito conforme o projeto; a ocorrência não identifica sozinha o componente causador.",
        },
        {
          name: "Mau contato em conectores",
          text: "Pode produzir interrupções, aquecimento ou falhas intermitentes. Relacionar contato, retenção, vedação e circuito atendido.",
        },
        {
          name: "Chicote danificado",
          text: "Condutores rompidos, atrito e deterioração da isolação podem afetar alimentação, sinais ou comunicação conforme a região atingida.",
        },
        {
          name: "Falha de aterramento",
          text: "Retornos com resistência elevada ou interrompidos podem causar sintomas em diversos sistemas. Verificar o caminho previsto e as condições sob carga.",
        },
        {
          name: "Tensão de carga alterada",
          text: "Relacionar gerenciamento, bateria, alternador, conexões e condições de medição aos valores da aplicação.",
        },
        {
          name: "Comunicação intermitente",
          text: "Avaliar alimentação dos módulos, conexões e rede conforme o diagrama. Uma falha de comunicação não comprova isoladamente defeito na ECU.",
        },
      ],
    },
    {
      title: "Distinções de função e identificação",
      groups: [
        {
          name: "Barramento de potência e rede de dados",
          text: "O barramento do item 11 distribui energia. CAN é uma rede de comunicação de dados, com requisitos próprios definidos pela arquitetura.",
        },
        {
          name: "Fusível e relé",
          text: "O fusível integra a proteção contra sobrecorrente; o relé comuta a carga no circuito previsto. Eles não exercem a mesma função.",
        },
        {
          name: "Características dos conectores",
          text: "Vedação, trava e múltiplas vias podem coexistir. Cor, forma ou quantidade de vias não definem sozinhas alimentação, sinal ou compatibilidade.",
        },
        {
          name: "Tensão nominal e estratégia de carga",
          text: "12 V identifica o sistema do exemplo. A tensão real depende da operação, e outras arquiteturas de veículo podem empregar alimentação e gerenciamento diferentes.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar a referência enviada. Não são fotografias de fabricante nem desenhos certificados de uma aplicação específica.",
    "A numeração 1 a 11 acompanha a lista principal do cartaz. Os cinco chicotes regionais, os tipos de conector e as famílias de módulo detalham essas categorias e não acrescentam novos números à lista principal.",
    "A referência representa um veículo a combustão com sistema nominal de 12 V. Ela não define a arquitetura de todos os veículos nem um circuito de tração elétrica de alta tensão.",
    "Cores, rotas, conexões, pinagem, especificações e procedimentos dependem do veículo. As imagens organizam funções e exemplos; elas não são diagramas elétricos para montagem ou reparo.",
  ],
};
