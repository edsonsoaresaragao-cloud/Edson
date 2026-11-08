import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const hvacReferenceSystems = [
  { id: "refrigeracao", name: "Circuito de refrigeração" },
  { id: "ventilacao", name: "Ventilação e distribuição de ar" },
  { id: "estrutura", name: "Caixa e direcionamento do ar" },
  { id: "conexoes", name: "Linhas, serviço e monitoramento" },
] as const;
type HvacReferenceSystem = (typeof hvacReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: HvacReferenceSystem,
  description: string,
  note: string,
  aliases: string[] = [],
): VisualPart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
});

/** Main chart numbers 1–12. The unnumbered optional heater remains context. */
export const hvacReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Compressor",
    "refrigeracao",
    "Aspira vapor em baixa pressão e comprime o refrigerante, elevando sua pressão e temperatura e promovendo sua circulação.",
    "A imagem mostra um exemplo acionado por correia. Acionamento, mecanismo, fluido e lubrificante dependem da aplicação; não estabelece uma pressão ou carga de serviço.",
    ["bomba do ar-condicionado", "compressão", "compressor ac"],
  ),
  part(
    2,
    "Condensador",
    "refrigeracao",
    "Rejeita calor do refrigerante para o ar externo, permitindo sua condensação e saída predominantemente líquida em alta pressão.",
    "É um trocador do circuito de A/C, diferente do radiador do líquido de arrefecimento. Construção, fixações e integração do secador variam conforme o veículo.",
    ["condensação", "condenser", "trocador externo"],
  ),
  part(
    3,
    "Eletroventilador do condensador",
    "ventilacao",
    "Força a passagem de ar externo pelo condensador e auxilia na dissipação do calor.",
    "O veículo pode compartilhar a ventilação com outros trocadores. Comando, velocidades e integração variam; não é o blower da cabine do item 7.",
    ["ventoinha do condensador", "ventilador externo", "fan axial"],
  ),
  part(
    4,
    "Filtro secador",
    "refrigeracao",
    "Retém umidade e impurezas no circuito de alta pressão do exemplo com válvula de expansão.",
    "O cartaz agrupa filtro secador e acumulador. São componentes diferentes: o acumulador de outras arquiteturas fica na baixa pressão e não é equivalente ao receiver-drier ilustrado.",
    ["receiver-drier", "receiver drier", "dessecante"],
  ),
  part(
    5,
    "Válvula de expansão",
    "refrigeracao",
    "Controla a alimentação do evaporador e provoca queda de pressão, formando uma mistura fria de líquido e vapor.",
    "A referência mostra uma válvula do tipo bloco. Tubo de orifício e outras soluções de expansão têm arquiteturas próprias e não são substitutos definidos pela aparência.",
    ["TXV", "válvula termostática de expansão", "expansion valve"],
  ),
  part(
    6,
    "Evaporador",
    "refrigeracao",
    "Absorve calor do ar da cabine enquanto o refrigerante evapora; a umidade do ar pode condensar sobre suas aletas.",
    "Evaporação do refrigerante e condensação da umidade do ar são fenômenos diferentes. O evaporador não é o radiador do aquecedor ligado ao arrefecimento do motor.",
    ["evaporação", "evaporator", "serpentina fria"],
  ),
  part(
    7,
    "Blower / ventilador da cabine",
    "ventilacao",
    "Impulsiona o ar pelos caminhos da caixa HVAC e pelos trocadores até os dutos e difusores.",
    "O exemplo utiliza um ventilador centrífugo. Ar da cabine, refrigerante do A/C e líquido do aquecedor são separados; o blower não bombeia refrigerante.",
    ["soprador", "gaiola de esquilo", "motor da ventilação interna"],
  ),
  part(
    8,
    "Filtro de cabine",
    "ventilacao",
    "Retém poeira, pólen e outras partículas presentes no ar que entra nos caminhos de ventilação da cabine.",
    "A posição em relação ao blower e aos trocadores varia por projeto. Dimensões, sentido de montagem e tipo de elemento devem corresponder à aplicação.",
    ["filtro de ar da cabine", "filtro antipólen", "cabin filter"],
  ),
  part(
    9,
    "Caixa HVAC",
    "estrutura",
    "Aloja os trocadores e direciona o ar por portas de mistura e distribuição, conforme a construção do conjunto.",
    "Pode abrigar evaporador, aquecedor opcional, portas e atuadores. A vista separada identifica elementos, sem estabelecer uma ordem universal de montagem ou passagem do ar.",
    ["caixa de ar", "módulo de climatização", "housing"],
  ),
  part(
    10,
    "Dutos e difusores",
    "ventilacao",
    "Conduzem e distribuem o ar tratado para as saídas do painel, assoalho e desembaçamento previstas no projeto.",
    "Distribuição, mecanismos e posição das saídas dependem do veículo. As setas claras representam fluxo de ar, sem mistura com os fluidos dos trocadores.",
    ["saídas de ar", "ventilas", "ducts", "vents"],
  ),
  part(
    11,
    "Linhas do refrigerante",
    "conexoes",
    "Conectam os componentes do circuito de A/C por tubulações e mangueiras com vedações apropriadas.",
    "As cores do diagrama indicam trechos e estados relativos, não cores reais ou compatibilidade de mangueiras. Conexões, barreiras, vedações e aplicação precisam ser confirmadas.",
    [
      "linhas de pressão",
      "tubulações",
      "mangueiras do refrigerante",
      "refrigerant hoses",
    ],
  ),
  part(
    12,
    "Portas de serviço / sensores",
    "conexoes",
    "Reúnem acessos mecânicos para serviço e dispositivos de monitoramento da pressão, conforme o circuito do veículo.",
    "Porta de serviço e sensor de pressão são elementos distintos. A porta permite conexão de equipamento; o sensor envia informação elétrica. Posição, quantidade e sinais dependem da aplicação.",
    [
      "transdutor de pressão",
      "válvula de serviço",
      "pressure sensor",
      "service port",
    ],
  ),
];

export const hvacReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "circuito",
    name: "Circuito do refrigerante",
    system: "refrigeracao",
    imageCell: 0,
    artwork: {
      src: "/images/hvac-reference/refrigerant-cycle.svg",
      columns: 1,
      rows: 1,
      aspectRatio: 600 / 460,
      caption: "Esquema didático do circuito",
    },
    description:
      "Compressor, condensador, secador, válvula e evaporador formam um circuito fechado no exemplo ilustrado.",
    details: [
      "Compressor → condensador → filtro secador",
      "Filtro secador → válvula de expansão → evaporador",
      "Evaporador → retorno de vapor ao compressor",
      "Cores indicativas, sem medição real de pressão ou temperatura",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 11, 12],
  },
  {
    id: "externo",
    name: "Compressão e troca de calor externa",
    system: "refrigeracao",
    imageCell: 1,
    description:
      "Componentes externos de compressão, rejeição de calor e secagem organizados para identificação.",
    details: [
      "Compressor",
      "Condensador",
      "Eletroventilador externo",
      "Filtro secador e linhas",
    ],
    partNumbers: [1, 2, 3, 4, 11],
  },
  {
    id: "caixa",
    name: "Caixa HVAC e componentes internos",
    system: "estrutura",
    imageCell: 2,
    description:
      "Caixa, filtro, blower, evaporador, aquecedor opcional e saídas de ar apresentados separadamente.",
    details: [
      "Carcaças e portas de distribuição",
      "Filtro de cabine e blower",
      "Evaporador e válvula de expansão",
      "Aquecedor opcional (contexto, ligado ao arrefecimento)",
      "Dutos e difusores",
    ],
    partNumbers: [5, 6, 7, 8, 9, 10],
  },
  {
    id: "servico",
    name: "Serviço e monitoramento de pressão",
    system: "conexoes",
    imageCell: 3,
    description:
      "Acesso mecânico de serviço e sensor elétrico apresentados como elementos diferentes do circuito.",
    details: [
      "Porta de serviço com tampa",
      "Sensor / transdutor de pressão",
      "Conector elétrico",
      "Tubulação e vedações de contexto",
    ],
    partNumbers: [11, 12],
  },
  {
    id: "instalado",
    name: "Posição do módulo no habitáculo",
    system: "ventilacao",
    imageCell: 4,
    description:
      "Vista ilustrativa da caixa de ar sob o painel e dos caminhos até as saídas da cabine.",
    details: [
      "Caixa HVAC atrás do painel",
      "Blower e trocadores de calor",
      "Dutos e difusores",
      "Setas claras: fluxo de ar, separado do refrigerante",
      "Referência genérica, sem confirmação de modelo ou aplicação",
    ],
    partNumbers: [6, 7, 8, 9, 10],
  },
];
export const hvacPartArtwork: VisualArtwork = {
  src: "/images/hvac-reference/components.webp",
  columns: 4,
  rows: 3,
  aspectRatio: 1,
  rowBounds: [0, 365 / 1086, 722 / 1086, 1],
};
export const hvacAssemblyArtwork: VisualArtwork = {
  src: "/images/hvac-reference/assemblies.webp",
  columns: 3,
  rows: 2,
  aspectRatio: 1,
};
export const hvacVisualCatalog: VisualCatalog = {
  id: "hvac",
  name: "Ar-condicionado / HVAC",
  className: "hvac-reference-catalog",
  title: "Ar-condicionado, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / REFRIGERAÇÃO E CLIMATIZAÇÃO",
  description:
    "Explore os 12 itens da legenda do cartaz, o circuito do refrigerante e a ventilação da cabine. Consulte os componentes, as funções e a posição do módulo de climatização.",
  searchTerms: "ar condicionado HVAC climatização",
  searchPlaceholder: "Nome, número ou função: evaporador, 5, secador…",
  systemLabel: "Sistema de climatização",
  assemblyLabel: "Conjuntos e fluxos",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/ar-condicionado",
  interactiveLabel: "Explorar ar-condicionado interativo",
  systems: hvacReferenceSystems,
  parts: hvacReferenceParts,
  assemblies: hvacReferenceAssemblies,
  partArtwork: hvacPartArtwork,
  assemblyArtwork: hvacAssemblyArtwork,
  overview: {
    kind: "sprite",
    artwork: hvacAssemblyArtwork,
    cell: 5,
    alt: "Ilustração didática gerada da caixa HVAC com evaporador, aquecedor opcional, filtro, blower e dutos",
    caption: "Caixa HVAC em corte · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona",
      items: [
        "Compressão: o compressor aspira vapor em baixa pressão e o comprime, elevando pressão e temperatura.",
        "Condensação: no condensador, o refrigerante rejeita calor ao ar externo e sai predominantemente líquido em alta pressão.",
        "Filtragem e secagem: no exemplo com filtro secador, impurezas e umidade são retidas antes da expansão.",
        "Expansão: a válvula controla a alimentação do evaporador e provoca queda de pressão, formando mistura fria de líquido e vapor.",
        "Evaporação: o refrigerante absorve calor do ar na passagem pelo evaporador e retorna como vapor ao compressor; a umidade do ar pode condensar nas aletas.",
        "Insuflação: o blower movimenta o ar pelos caminhos da caixa e pelos trocadores, distribuindo-o pelos dutos e difusores.",
      ],
    },
    {
      title: "Ar da cabine e aquecimento opcional",
      description:
        "O filtro retém partículas, o evaporador retira calor do ar e o blower mantém a ventilação. Quando há aquecedor, ele recebe líquido do arrefecimento do motor por um circuito separado; portas de mistura permitem ajustar a temperatura do ar. Refrigerante do A/C, líquido do aquecedor e ar não se misturam. A ordem e a posição física dos elementos variam por projeto.",
    },
    {
      title: "Filtro secador e acumulador",
      description:
        "O cartaz agrupa os dois nomes, mas eles não são equivalentes. Esta referência mostra válvula de expansão e filtro secador na linha de alta pressão. Outras arquiteturas podem usar tubo de orifício e acumulador na linha de baixa. Confirme o conjunto e o procedimento específicos; não escolha a peça apenas por semelhança.",
    },
    {
      title: "Portas de serviço e sensores",
      description:
        "O item 12 agrupa identificações diferentes. Portas são conexões mecânicas para equipamento de serviço; sensores ou transdutores fornecem sinais para monitoramento e controle. A imagem não define pontos de conexão, pinagem, pressão de teste, quantidade de refrigerante ou procedimento de carga.",
    },
    {
      title: "Como ler as cores do cartaz",
      description:
        "As cores e setas são convenções didáticas. Não correspondem a cores obrigatórias de mangueiras, leituras medidas ou especificações de serviço.",
      groups: [
        {
          name: "Vermelho",
          text: "Descarga do compressor: vapor quente em alta pressão, seguindo para o condensador.",
        },
        {
          name: "Laranja",
          text: "Saída do condensador: refrigerante predominantemente líquido em alta pressão, após rejeitar calor.",
        },
        {
          name: "Amarelo",
          text: "Linha de líquido em alta pressão, do secador até a válvula de expansão.",
        },
        {
          name: "Azul",
          text: "Trechos de baixa pressão: mistura de líquido e vapor após a expansão e retorno de vapor ao compressor depois do evaporador.",
        },
        {
          name: "Azul-claro translúcido",
          text: "Fluxo de ar na caixa HVAC, nos dutos e nas saídas para o habitáculo; não é refrigerante nem líquido de arrefecimento.",
        },
      ],
    },
  ],
  notes: [
    "Imagens ilustrativas geradas com base no cartaz para identificação didática. Não são fotografias de fabricante nem confirmação de código, medidas ou compatibilidade.",
    "Os números 1 a 12 seguem a legenda principal. O aquecedor opcional aparece como contexto; na vista interativa existente ele recebe o número 13, sem aumentar a lista principal deste catálogo.",
    "A vista explodida não define ordem de montagem, trajeto universal do ar ou procedimento de serviço. Arquitetura, acionamento, refrigerante, lubrificante, pressões e quantidade de carga dependem da aplicação.",
  ],
};
