import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const manualTransmissionSystems = [
  { id: "estrutura", name: "Carcaças e fechamento" },
  { id: "eixos", name: "Eixos e engrenagens" },
  { id: "engate", name: "Sincronização e engate" },
  { id: "selecao", name: "Comando e seleção" },
  { id: "apoio", name: "Rolamentos e vedação" },
  { id: "contexto", name: "Sistemas associados" },
] as const;
type ManualTransmissionSystem =
  (typeof manualTransmissionSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: ManualTransmissionSystem,
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

/** Numbers follow the supplied chart; images illustrate functions, not a certified gearbox design. */
export const manualTransmissionParts: readonly VisualPart[] = [
  part(
    1,
    "Carcaça (caixa)",
    "estrutura",
    "Abriga os componentes internos, sustenta seus apoios e mantém o alinhamento dos eixos e engrenagens da transmissão.",
    "Inspecione trincas, alojamentos, roscas e superfícies de união. Formato, divisão das carcaças e integração com o diferencial variam conforme o projeto.",
    [
      "carcaça da transmissão",
      "caixa de marchas",
      "bellhousing",
      "gearbox housing",
    ],
  ),
  part(
    2,
    "Eixo primário (entrada)",
    "eixos",
    "Recebe o torque do motor por meio da embreagem e o transmite ao trem de engrenagens da caixa.",
    "Confira estrias, superfícies de apoio, dentes e desgaste conforme o manual. Em certas arquiteturas, entrada e saída são coaxiais; a imagem não define uma posição universal.",
    ["eixo de entrada", "input shaft", "árvore primária"],
  ),
  part(
    3,
    "Eixo secundário (saída)",
    "eixos",
    "Transmite o torque correspondente à relação selecionada para a saída da caixa e o conjunto de transmissão final.",
    "Inspecione estrias, apoios e elementos de engate. A ligação ao diferencial e a disposição dos eixos dependem de a caixa ser longitudinal, transversal ou de outra construção.",
    ["eixo de saída", "output shaft", "árvore secundária"],
  ),
  part(
    4,
    "Eixo intermediário (contraeixo)",
    "eixos",
    "Nos projetos que o utilizam, conduz movimento entre a entrada e os pares de engrenagens que estabelecem as relações de marcha.",
    "O exemplo de três eixos não representa toda transmissão manual. Confirme a arquitetura antes de identificar o contraeixo; verifique dentes, apoios e folgas conforme os dados da aplicação.",
    ["contra eixo", "árvore intermediária", "countershaft", "layshaft"],
  ),
  part(
    5,
    "Conjunto de engrenagens",
    "eixos",
    "Os pares de engrenagens definem as relações entre rotação e torque, permitindo diferentes marchas de avanço e o funcionamento da ré conforme o mecanismo utilizado.",
    "Observe desgaste, trincas e danos nos dentes. Engrenagens helicoidais e de dentes retos têm aplicações diferentes; quantidade de dentes e relações precisam corresponder à caixa identificada.",
    ["pares de engrenagens", "dentes helicoidais", "gear set"],
  ),
  part(
    6,
    "Sincronizador",
    "engate",
    "Aproxima as rotações dos elementos que serão acoplados, facilitando o engate da marcha antes do travamento pela luva.",
    "Inspecione cones, anéis, cubo e elementos de sincronização conforme o projeto. Há conjuntos de um ou mais cones; não confunda o anel de atrito com a luva de engate.",
    ["anel sincronizador", "cubo sincronizador", "sincronia", "synchronizer"],
  ),
  part(
    7,
    "Luva de engate",
    "engate",
    "Desloca-se sobre o cubo e acopla os dentes de engate da engrenagem selecionada ao eixo, permitindo a transmissão do torque.",
    "Verifique dentes de acoplamento, estrias e canal de atuação do garfo. Desgaste, folga e curso incorreto podem contribuir para dificuldade de engate ou desengate involuntário.",
    ["manga de engate", "luva deslizante", "sliding sleeve", "dog teeth"],
  ),
  part(
    8,
    "Garfo seletor",
    "selecao",
    "Transfere o movimento do mecanismo de seleção à luva, posicionando o engate da relação escolhida.",
    "Inspecione apoios, sapatas e alinhamento. Formato, material e curso são próprios de cada projeto; a cor da ilustração não identifica o material da peça real.",
    ["garfo de mudança", "forquilha", "selector fork", "shift fork"],
  ),
  part(
    9,
    "Haste / eixo seletor",
    "selecao",
    "Conduz o comando de seleção e movimenta os elementos de engate, trabalhando com garfos, retenções e intertravamentos conforme a construção.",
    "Confira entalhes, apoios, fixações e folgas. A conexão à alavanca pode usar hastes, cabos ou outros mecanismos; o cartaz não estabelece uma regulagem universal.",
    ["haste seletora", "varão", "trambulador", "shift rail", "selector rod"],
  ),
  part(
    10,
    "Tambor seletor",
    "selecao",
    "Nos mecanismos que o utilizam, transforma seu giro em deslocamentos programados dos garfos por meio de pistas ou ressaltos de seleção.",
    "É característico de mecanismos de seleção sequencial e não está presente em toda caixa manual com padrão H. O item preserva a identificação do cartaz; confirme a construção antes de aplicá-lo a uma transmissão real.",
    ["tambor de seleção", "seletor sequencial", "selector drum", "barrel"],
  ),
  part(
    11,
    "Tampa traseira",
    "estrutura",
    "Fecha a região traseira da caixa e pode alojar apoios, vedações ou outros componentes previstos no projeto.",
    "Inspecione trincas, alojamentos e superfícies de vedação. Junta, selante, sequência e torque de montagem dependem da documentação da caixa identificada.",
    ["carcaça traseira", "tampa posterior", "end cover", "rear housing"],
  ),
  part(
    12,
    "Retentores",
    "apoio",
    "Vedam as passagens dos eixos, ajudando a manter o lubrificante dentro da transmissão e a impedir a entrada de contaminantes.",
    "Verifique lábios, pistas dos eixos e sinais de vazamento. Material, dimensões, orientação e método de instalação precisam ser específicos da aplicação.",
    ["retentor", "vedação", "selo de óleo", "oil seal", "shaft seal"],
  ),
  part(
    13,
    "Rolamentos",
    "apoio",
    "Sustentam os eixos com baixo atrito e mantêm o posicionamento necessário ao engrenamento, suportando as cargas previstas no projeto.",
    "Inspecione ruído, folga, pistas e elementos rolantes. Tipo de rolamento, pré-carga e folga axial devem seguir os valores da transmissão, sem estimá-los pela imagem.",
    ["mancais", "bearing", "ball bearing", "roller bearing"],
  ),
];

export const manualTransmissionArtwork: VisualArtwork = {
  src: "/images/manual-transmission-reference/catalog.webp",
  columns: 4,
  rows: 5,
  aspectRatio: (1122 * 5) / (1402 * 4),
};

export const manualTransmissionAssemblies: readonly VisualAssembly[] = [
  {
    id: "vista-explodida",
    name: "Vista explodida da caixa de marchas",
    system: "estrutura",
    imageCell: 14,
    description:
      "A separação ilustrativa mostra as carcaças, os eixos, as engrenagens e os elementos de seleção em relação ao conjunto. As posições não constituem uma sequência de montagem.",
    details: [
      "Carcaça e tampa traseira",
      "Eixos e pares de engrenagens",
      "Sincronizadores e luvas",
      "Garfos e hastes de seleção",
      "Rolamentos e retentores",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
  },
  {
    id: "sincronizador",
    name: "Detalhe do sincronizador",
    system: "engate",
    imageCell: 15,
    description:
      "O anel trabalha por atrito para aproximar rotações. Após a sincronização, a luva acopla os dentes de engate e estabelece a ligação de torque entre engrenagem e eixo.",
    details: [
      "Cubo fixado ao eixo",
      "Anel e cone de sincronização",
      "Luva de engate deslizante",
      "Engrenagem que pode girar livre antes do acoplamento",
    ],
    partNumbers: [5, 6, 7],
  },
  {
    id: "embreagem",
    name: "Sistema de embreagem",
    system: "contexto",
    imageCell: 16,
    description:
      "A embreagem permite acoplar ou interromper a transmissão de torque do motor à entrada da caixa, auxiliando a saída do veículo e a troca de marchas.",
    details: [
      "Volante do motor",
      "Disco de embreagem",
      "Platô de pressão",
      "Rolamento de embreagem",
      "Conjunto externo à lista das 13 peças da caixa",
    ],
    partNumbers: [],
  },
  {
    id: "alavanca",
    name: "Alavanca e mecanismo de seleção",
    system: "selecao",
    imageCell: 17,
    description:
      "A alavanca conduz a intenção do motorista ao mecanismo de seleção. Hastes, cabos e articulações comandam os garfos conforme o projeto; o tambor só se aplica às construções que o utilizam.",
    details: [
      "Manopla e alavanca",
      "Carcaça do seletor",
      "Articulações, hastes ou cabos",
      "Garfos de seleção",
      "Tambor seletor somente conforme o projeto",
    ],
    partNumbers: [8, 9, 10],
  },
  {
    id: "pedais",
    name: "Pedais do veículo",
    system: "contexto",
    imageCell: 18,
    description:
      "O pedal da embreagem comanda o desacoplamento do motor da transmissão. Freio e acelerador pertencem aos respectivos sistemas do veículo e não são componentes internos da caixa.",
    details: [
      "Embreagem à esquerda",
      "Freio ao centro",
      "Acelerador à direita",
      "Disposição ilustrativa de veículo com três pedais",
    ],
    partNumbers: [],
  },
  {
    id: "fluxo",
    name: "Fluxo de potência",
    system: "contexto",
    imageCell: 19,
    description:
      "O torque passa do motor pela embreagem, pela relação selecionada na caixa e pelo conjunto final até as rodas motrizes. O diferencial permite diferença de rotação entre as rodas.",
    details: [
      "Motor e embreagem",
      "Entrada da caixa e trem de engrenagens",
      "Saída da transmissão",
      "Diferencial e rodas motrizes",
      "A integração do diferencial à caixa depende da arquitetura",
    ],
    partNumbers: [2, 3, 4, 5],
  },
];

export const manualTransmissionRatios = [
  {
    gear: "1ª marcha",
    ratio: "3,50–3,90:1",
    purpose:
      "Exemplo de maior redução, para saída e condições que exigem mais torque nas rodas.",
  },
  {
    gear: "2ª marcha",
    ratio: "1,90–2,20:1",
    purpose: "Exemplo de relação para progressão da aceleração.",
  },
  {
    gear: "3ª marcha",
    ratio: "1,20–1,40:1",
    purpose:
      "Exemplo de relação intermediária para uso geral, conforme as condições de condução.",
  },
  {
    gear: "4ª marcha",
    ratio: "0,90–1,05:1",
    purpose:
      "Exemplo de relação próxima da unidade; a existência de marcha direta depende da caixa.",
  },
  {
    gear: "5ª marcha",
    ratio: "0,70–0,85:1",
    purpose:
      "Exemplo de sobremarcha, reduzindo a rotação do motor em determinadas velocidades.",
  },
  {
    gear: "Ré",
    ratio: "≈ 3,00:1 em módulo",
    purpose:
      "Exemplo de relação que inverte o sentido de movimento. O mecanismo e a sincronização da ré variam por projeto.",
  },
] as const;

export const manualTransmissionVisualCatalog: VisualCatalog = {
  id: "transmissao-manual",
  name: "Transmissão manual",
  className: "manual-transmission-reference-catalog",
  title: "Transmissão manual, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / CÂMBIO MECÂNICO",
  description:
    "Explore as 13 peças numeradas da referência, com imagens, funções e inspeções. Veja a caixa em detalhe, o sincronizador, a embreagem, a seleção de marchas e o caminho do torque até as rodas.",
  searchTerms: "transmissão manual câmbio mecânico caixa de marchas gearbox",
  searchPlaceholder: "Nome, número ou função: sincronizador, 13, retentor…",
  systemLabel: "Sistema da transmissão",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/transmissao-manual",
  interactiveLabel: "Ver conteúdos de transmissão manual",
  systems: manualTransmissionSystems,
  parts: manualTransmissionParts,
  assemblies: manualTransmissionAssemblies,
  partArtwork: manualTransmissionArtwork,
  assemblyArtwork: manualTransmissionArtwork,
  overview: {
    kind: "sprite",
    artwork: manualTransmissionArtwork,
    cell: 13,
    alt: "Ilustração didática gerada de caixa de transmissão manual montada, com carcaça de alumínio e campana",
    caption: "Caixa manual montada · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      description:
        "O exemplo relaciona a atuação da embreagem à escolha da relação de marcha e à saída de torque. O caminho interno depende da arquitetura da caixa.",
      items: [
        "O motor transmite torque pela embreagem ao eixo primário, que forma a entrada da caixa.",
        "Em construções de engrenamento constante, os pares de engrenagens mantêm movimento; a participação do contraeixo depende do projeto de dois ou três eixos.",
        "O condutor comanda a seleção pela alavanca e seu mecanismo, movimentando hastes e garfos.",
        "O sincronizador aproxima as rotações e a luva acopla a engrenagem selecionada ao eixo para transmitir torque.",
        "O torque sai pela transmissão final e pelo diferencial até as rodas motrizes, conforme a relação selecionada.",
      ],
    },
    {
      title: "Relações de marcha: exemplos do cartaz",
      description:
        "Faixas aproximadas para estudo de uma caixa de cinco marchas; não são especificações universais. Aqui a relação compara a rotação de entrada à de saída: acima de 1 indica redução, e abaixo de 1 pode representar sobremarcha.",
      groups: manualTransmissionRatios.map((item) => ({
        name: `${item.gear}: ${item.ratio}`,
        text: item.purpose,
      })),
    },
    {
      title: "Manutenção preventiva",
      items: [
        "Conferir nível e condição do lubrificante pelo procedimento da caixa identificada.",
        "Inspecionar vazamentos em retentores, juntas e superfícies de união.",
        "Verificar folgas e condições da alavanca, cabos, articulações e buchas.",
        "Avaliar o funcionamento da embreagem e o curso de desacoplamento conforme a aplicação.",
        "Utilizar o lubrificante com a especificação e a viscosidade indicadas pelo fabricante; não presumir que qualquer óleo de engrenagens seja adequado.",
        "Seguir os intervalos e as condições de manutenção previstos no manual, sem adotar uma quilometragem universal.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Os sintomas podem ter mais de uma causa e não identificam sozinhos uma peça defeituosa.",
      groups: [
        {
          name: "Dificuldade para engatar",
          text: "Investigar sincronizadores, desacoplamento da embreagem e comando de seleção conforme as condições em que ocorre a falha.",
        },
        {
          name: "Marcha escapando",
          text: "Verificar dentes de engate, luvas, garfos, retenções e folgas conforme o procedimento específico da transmissão.",
        },
        {
          name: "Ruídos na caixa",
          text: "Avaliar rolamentos, engrenagens e lubrificação; relacionar o ruído à marcha, carga e condição de operação.",
        },
        {
          name: "Vazamento de óleo",
          text: "Inspecionar retentores, juntas, superfícies e demais pontos previstos no conjunto, identificando a origem antes do reparo.",
        },
        {
          name: "Engate duro",
          text: "Conferir folgas, regulagem e articulações do seletor, além do funcionamento da embreagem e das condições do óleo.",
        },
        {
          name: "Embreagem patinando",
          text: "Avaliar disco, platô e acionamento. A embreagem é um conjunto associado à transmissão, mas não equivale a uma falha interna da caixa.",
        },
      ],
    },
    {
      title: "Construção e identificação",
      groups: [
        {
          name: "Disposição dos eixos",
          text: "Transmissões manuais podem ter dois, três ou outros arranjos de eixos. As posições e chamadas da ilustração não determinam a arquitetura de uma caixa real.",
        },
        {
          name: "Tambor seletor",
          text: "O item 10 representa um mecanismo usado em determinadas construções, especialmente sequenciais. Não presuma a presença de tambor em toda caixa manual de cinco marchas com padrão H.",
        },
        {
          name: "Marcha à ré e diferencial",
          text: "A inversão de sentido e a eventual sincronização da ré variam por projeto. Em conjuntos transversais, o diferencial pode integrar a caixa; no exemplo longitudinal do fluxo, aparece separado.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas com base nos componentes e detalhes da referência enviada. Não são fotografias de fabricante nem desenhos técnicos certificados de uma caixa específica.",
    "A numeração 1 a 13 acompanha a lista do cartaz. Carcaças, posição dos eixos, tambor, relações e número de marchas variam; os rótulos não confirmam medidas, código ou compatibilidade.",
    "Embreagem, alavanca, pedais, motor, diferencial e rodas aparecem nas vistas de funcionamento como contexto e não acrescentam peças à lista principal.",
    "A ordem visual não é procedimento de desmontagem ou montagem. Identifique a transmissão e consulte os dados do fabricante para lubrificante, regulagens, folgas e torques.",
  ],
};
