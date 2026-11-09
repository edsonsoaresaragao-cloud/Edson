import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const absReferenceSystems = [
  { id: "controle", name: "Sensores e controle" },
  { id: "modulacao", name: "Modulação hidráulica" },
  { id: "acionamento", name: "Acionamento e fluido" },
  { id: "circuitos", name: "Tubulações e circuitos" },
] as const;
type AbsReferenceSystem = (typeof absReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: AbsReferenceSystem,
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

/** Principal identifiers match the reference chart and the existing ABS explorer. */
export const absReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Sensores de velocidade das rodas",
    "controle",
    "Informam a rotação de cada roda ao gerenciamento do ABS. O exemplo representa quatro sensores associados aos seus elementos de leitura.",
    "Sensores podem ser passivos ou ativos, e o elemento de leitura pode ser dentado ou magnético. Inspecione montagem, chicote, elemento de leitura e sinal conforme a aplicação; não aplique um teste de resistência universal.",
    [
      "sensor ABS",
      "sensor de roda",
      "wheel speed sensor",
      "indutivo",
      "Hall",
      "magnetorresistivo",
    ],
  ),
  part(
    2,
    "Módulo de controle ABS / ECU",
    "controle",
    "Processa as informações disponíveis para identificar tendência de bloqueio das rodas e comanda a modulação de pressão pelas válvulas e pela bomba.",
    "Alimentação, comunicação, sinais e códigos devem ser relacionados aos testes previstos. Um DTC não confirma sozinho defeito na ECU; construção, integração e procedimentos de configuração variam por veículo.",
    ["central ABS", "módulo eletrônico", "ABS control unit", "ECU ABS"],
  ),
  part(
    3,
    "Unidade hidráulica / modulador",
    "modulacao",
    "Reúne as galerias hidráulicas que relacionam cilindro-mestre, válvulas, bomba, acumuladores e circuitos das rodas para modular a pressão do freio.",
    "Quantidade de canais, distribuição dos circuitos e posições das conexões dependem do conjunto. A imagem do bloco não estabelece ligação de tubos ou procedimento de desmontagem de uma aplicação real.",
    ["bloco hidráulico", "modulador ABS", "HCU", "hydraulic control unit"],
  ),
  part(
    4,
    "Válvulas solenoides",
    "modulacao",
    "Controlam as passagens internas para aumentar, manter ou reduzir a pressão no circuito da roda durante a atuação do ABS, conforme o comando eletrônico.",
    "O exemplo de quatro canais utiliza oito válvulas, uma de entrada e uma de saída por roda. Quantidade e funcionamento variam por arquitetura; a vista separada não confirma fornecimento ou reparo individual de cada válvula.",
    [
      "eletroválvulas",
      "válvula de entrada",
      "válvula de saída",
      "solenoid valves",
    ],
  ),
  part(
    5,
    "Motor elétrico da bomba",
    "modulacao",
    "Aciona a bomba de recirculação, que devolve ao circuito o fluido liberado durante a redução de pressão no exemplo hidráulico representado.",
    "Motor e elemento de bombeamento têm funções diferentes. Verifique alimentação e comando nas condições de teste previstas; ausência de ruído isolada não confirma defeito. O fluido não é simplesmente descartado no reservatório.",
    ["motor da bomba ABS", "bomba de retorno", "pump motor", "return pump"],
  ),
  part(
    6,
    "Reservatório do fluido de freio",
    "acionamento",
    "Alimenta o cilindro-mestre e compensa variações de volume no sistema de freio. Seu nível integra as condições de inspeção do circuito hidráulico.",
    "Utilize a especificação de fluido do fabricante. Nível baixo exige avaliação do sistema, sem identificar sozinho uma falha de ABS; formato, sensores, conexões e integração com outros circuitos variam.",
    ["depósito do fluido", "brake fluid reservoir", "reservatório de freio"],
  ),
  part(
    7,
    "Cilindro-mestre",
    "acionamento",
    "Converte o acionamento do pedal em pressão hidráulica para os circuitos de freio. O exemplo usa construção tandem, com dois circuitos.",
    "A assistência ao pedal e a divisão dos circuitos são específicas do veículo. O ABS modula a pressão do circuito; a imagem não determina uma divisão diagonal, conexões de manutenção ou um valor de pressão universal.",
    ["cilindro mestre", "cilindro tandem", "master cylinder"],
  ),
  part(
    8,
    "Tubulações de freio",
    "circuitos",
    "Conduzem o fluido entre os conjuntos de acionamento, modulação e freio das rodas, preservando os circuitos hidráulicos previstos no projeto.",
    "Inspecione vazamentos, corrosão, fixação e integridade. Materiais, terminais, flangeamentos, roteamento e torques dependem da aplicação; a disposição ilustrada não prescreve a conexão de uma roda a uma porta do bloco.",
    [
      "tubos de freio",
      "linhas hidráulicas",
      "galerias",
      "brake pipes",
      "brake lines",
    ],
  ),
];

export const absReferenceArtwork: VisualArtwork = {
  src: "/images/abs-reference/catalog.webp",
  columns: 3,
  rows: 5,
  aspectRatio: 1254 / 3 / (1254 / 5),
  rowBounds: [0, 253 / 1254, 507 / 1254, 758 / 1254, 1012 / 1254, 1],
};

export const absReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "conjunto",
    name: "Conjunto ABS completo",
    system: "modulacao",
    imageCell: 8,
    description:
      "A unidade montada integra controle eletrônico, modulação hidráulica e acionamento da bomba. A forma de integração depende da aplicação.",
    details: [
      "ECU e conector elétrico",
      "Bloco hidráulico e válvulas internas",
      "Motor e bomba",
      "Portas de conexão conforme o conjunto",
    ],
    partNumbers: [2, 3, 4, 5],
  },
  {
    id: "explodido",
    name: "Vista explodida do módulo ABS",
    system: "modulacao",
    imageCell: 9,
    description:
      "A separação didática permite identificar eletrônica, bloco, válvulas e motor da bomba. Ela não representa a sequência de desmontagem ou a possibilidade de reparo de todo conjunto.",
    details: [
      "Carcaça e eletrônica de controle",
      "Unidade hidráulica",
      "Oito válvulas no exemplo de quatro canais",
      "Motor e elemento da bomba",
      "Separação ilustrativa das funções",
    ],
    partNumbers: [2, 3, 4, 5],
  },
  {
    id: "veiculo",
    name: "Distribuição do sistema no veículo",
    system: "circuitos",
    imageCell: 10,
    description:
      "O exemplo localiza quatro conjuntos de roda, sensores, unidade ABS e acionamento hidráulico. A disposição dos componentes serve como contexto, sem definir o roteamento de tubos de um veículo real.",
    details: [
      "Quatro rodas e respectivos sensores",
      "Unidade ABS",
      "Reservatório e cilindro-mestre",
      "Tubulações específicas da aplicação",
      "Discos, pinças e chassi como contexto",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: "sensor-roda",
    name: "Sensor e elemento de leitura da roda",
    system: "controle",
    imageCell: 11,
    description:
      "O sensor fixo lê o elemento que acompanha a rotação da roda, por dentes ou polos magnéticos conforme a construção. O disco de freio e o cubo ajudam a localizar o conjunto.",
    details: [
      "Sensor e fixação",
      "Elemento dentado neste exemplo",
      "Outras aplicações utilizam anel magnético",
      "Folga e montagem conforme o fabricante",
      "O sensor não toca a superfície de atrito do disco",
    ],
    partNumbers: [1],
  },
  {
    id: "sinal-controle",
    name: "Sensores, ECU e comando hidráulico",
    system: "controle",
    imageCell: 12,
    description:
      "Os sinais das rodas são processados pela ECU, que determina a atuação das válvulas e da bomba nas condições previstas. O grupo relaciona funções, sem reproduzir uma ligação elétrica.",
    details: [
      "Informação de rotação das rodas",
      "Processamento e detecção de tendência de bloqueio",
      "Comando das válvulas",
      "Comando do motor da bomba",
      "Alimentação e comunicação conforme o veículo",
    ],
    partNumbers: [1, 2, 3, 4, 5],
  },
  {
    id: "acionamento",
    name: "Acionamento e alimentação hidráulica",
    system: "acionamento",
    imageCell: 13,
    description:
      "O pedal aciona o cilindro-mestre, com a assistência prevista no veículo, para produzir pressão. O reservatório fornece fluido e compensa variações de volume.",
    details: [
      "Pedal como origem do acionamento",
      "Servofreio como exemplo de assistência",
      "Cilindro-mestre tandem",
      "Reservatório do fluido",
      "Pedal e servofreio são contexto da vista",
    ],
    partNumbers: [6, 7],
  },
  {
    id: "recirculacao",
    name: "Redução de pressão e recirculação",
    system: "modulacao",
    imageCell: 14,
    description:
      "No exemplo, o fluido liberado da roda na redução de pressão é recolhido em acumulador de baixa pressão e recirculado pela bomba para o circuito a montante das válvulas de entrada.",
    details: [
      "Válvula de saída e liberação controlada",
      "Acumuladores como contexto interno",
      "Bomba e acionamento elétrico",
      "Recirculação conforme a arquitetura",
      "O fluido não é simplesmente descartado no reservatório",
    ],
    partNumbers: [3, 4, 5],
  },
];

export const absVisualCatalog: VisualCatalog = {
  id: "freios-abs",
  name: "Sistema de freio ABS",
  className: "abs-reference-catalog",
  title: "Sistema ABS, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / SISTEMA ANTIBLOQUEIO",
  description:
    "Explore os oito componentes numerados da referência, com imagens, funções e inspeções. Sete vistas relacionam sensores, eletrônica, pressão hidráulica e recirculação do fluido.",
  searchTerms: "sistema de freio ABS antibloqueio antilock braking system",
  searchPlaceholder: "Nome, número ou função: sensor, 5, recirculação…",
  systemLabel: "Sistema do ABS",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/freios-e-abs",
  interactiveLabel: "Explorar ABS interativo",
  systems: absReferenceSystems,
  parts: absReferenceParts,
  assemblies: absReferenceAssemblies,
  partArtwork: absReferenceArtwork,
  assemblyArtwork: absReferenceArtwork,
  overview: {
    kind: "sprite",
    artwork: absReferenceArtwork,
    cell: 8,
    alt: "Ilustração didática gerada do conjunto ABS com ECU, bloco hidráulico e motor da bomba",
    caption: "Controle eletrônico e modulação hidráulica",
  },
  sections: [
    {
      title: "Visão geral do ABS",
      description:
        "O ABS identifica tendência de bloqueio e modula a pressão de frenagem para ajudar a preservar a capacidade de direcionar o veículo dentro da aderência disponível.",
      items: [
        "A rotação das rodas e as demais informações previstas são avaliadas pelo gerenciamento durante a frenagem.",
        "A pressão pode ser aumentada, mantida ou reduzida nos canais conforme a estratégia do conjunto.",
        "A função antibloqueio não equivale, por si só, a um controle eletrônico de estabilidade; recursos associados dependem do veículo.",
      ],
    },
    {
      title: "Como funciona, passo a passo",
      groups: [
        {
          name: "1. Frenagem",
          text: "O motorista aciona o pedal, e o sistema de acionamento produz pressão hidráulica para os freios.",
        },
        {
          name: "2. Monitoramento",
          text: "Os sensores fornecem informações da rotação de cada roda à ECU do ABS.",
        },
        {
          name: "3. Detecção",
          text: "O gerenciamento avalia os sinais e identifica tendência de bloqueio nas condições previstas pela estratégia.",
        },
        {
          name: "4. Modulação",
          text: "As válvulas e a bomba participam do aumento, da manutenção ou da redução da pressão conforme a fase de controle.",
        },
        {
          name: "5. Resultado esperado",
          text: "O controle busca evitar o bloqueio e ajudar a manter a dirigibilidade, sujeito à aderência, ao estado do sistema e às condições de operação.",
        },
      ],
    },
    {
      title: "Três fases da modulação de pressão",
      description:
        "Exemplo didático com uma válvula de entrada e uma de saída por canal. Estados e controle da bomba precisam ser interpretados conforme a arquitetura real.",
      groups: [
        {
          name: "Aumentar pressão",
          text: "A entrada aberta e a saída fechada permitem elevar a pressão no circuito da roda a partir do circuito de alimentação.",
        },
        {
          name: "Manter pressão",
          text: "Entrada e saída fechadas isolam o canal para manter a pressão naquele instante do controle.",
        },
        {
          name: "Reduzir pressão",
          text: "Entrada fechada e saída aberta liberam fluido para o acumulador de baixa pressão no exemplo; a bomba permite a recirculação ao circuito.",
        },
      ],
    },
    {
      title: "Sensor e anel de leitura",
      groups: [
        {
          name: "Sensores passivos",
          text: "O exemplo indutivo utiliza a variação associada à passagem dos dentes. Sinal e condições de medição dependem da construção e da rotação.",
        },
        {
          name: "Sensores ativos",
          text: "Podem utilizar princípios Hall ou magnetorresistivo e requerem a alimentação e o método de teste previstos no veículo.",
        },
        {
          name: "Elemento de leitura",
          text: "Pode ser dentado ou magnético, inclusive integrado ao rolamento. Fixação, folga, danos e contaminação precisam ser avaliados conforme a aplicação.",
        },
      ],
    },
    {
      title: "Recursos e limites do ABS",
      description:
        "O sistema ajuda a controlar o bloqueio, mas não garante menor distância de frenagem em todos os pisos. Pneus, aderência, velocidade e condições mecânicas continuam influenciando o resultado.",
      items: [
        "Busca reduzir o bloqueio das rodas durante a frenagem nas condições previstas.",
        "Ajuda a preservar a capacidade de direcionar o veículo dentro dos limites de aderência.",
        "Pode reduzir a distância de frenagem em condições adequadas; em superfícies soltas, como cascalho, ela pode aumentar.",
        "Recursos de estabilidade e tração, quando presentes, possuem estratégias próprias e não devem ser presumidos apenas pela presença de ABS.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Indicações, ruídos e códigos são pontos de partida para diagnóstico. Eles não confirmam isoladamente qual componente apresenta defeito.",
      groups: [
        {
          name: "Luz de ABS acesa",
          text: "Interpretar o comportamento de autoteste e os códigos conforme o veículo. A luz não identifica sozinha uma falha no módulo ou no sensor.",
        },
        {
          name: "Sinal de roda incorreto",
          text: "Relacionar leitura, chicote, fixação, elemento dentado ou magnético e condições do rolamento antes de atribuir a causa ao sensor.",
        },
        {
          name: "Controle ou unidade hidráulica",
          text: "Verificar alimentação, comunicação, parâmetros e testes comandados previstos. Um DTC não estabelece automaticamente a necessidade de trocar o conjunto.",
        },
        {
          name: "Fiação ou conector danificado",
          text: "Mau contato, corrosão ou interrupções podem causar falhas permanentes ou intermitentes. Inspecionar o circuito da aplicação.",
        },
        {
          name: "Bomba sem atuação esperada",
          text: "Confirmar se as condições de acionamento foram atendidas e verificar alimentação e comando. Ausência de ruído, por si só, não comprova defeito na bomba.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar a referência enviada. Não são fotografias de fabricante nem desenhos certificados de uma aplicação específica.",
    "A numeração 1 a 8 acompanha o cartaz e os componentes principais do interativo ABS existente. Discos, pinças, cubos, anéis, chassi, pedal, servofreio e acumuladores aparecem como contexto nas vistas.",
    "Quatro rodas, quatro canais e oito válvulas formam o exemplo didático. Quantidade de canais, válvulas, funções associadas e integração dos módulos variam conforme o veículo.",
    "Forma, conexões, especificação do fluido, procedimentos de inspeção e funcionamento dependem da aplicação. As imagens não definem pinagem, divisão dos circuitos ou roteamento de tubulações.",
  ],
};
