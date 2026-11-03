import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const coolingReferenceSystems = [
  { id: "circuito", name: "Radiador e circuito principal" },
  { id: "circulacao", name: "Bomba e termostato" },
  { id: "expansao", name: "Pressão, expansão e dreno" },
  { id: "ventilacao", name: "Ventilação e aquecimento" },
  { id: "sensoriamento", name: "Sensoriamento" },
] as const;
type CoolingReferenceSystem = (typeof coolingReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: CoolingReferenceSystem,
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

/** Main chart items 1–15. Engine/bypass remain context in the interactive, not a 16th replacement part. */
export const coolingReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Radiador",
    "circuito",
    "Transfere calor do líquido de arrefecimento para o ar externo por tubos e aletas.",
    "Inspecione vazamentos, sujeira externa e obstrução conforme o procedimento do fabricante. Dimensões, conexões e capacidade não podem ser confirmadas pela ilustração.",
    ["trocador de calor", "radiator"],
  ),
  part(
    2,
    "Eletroventilador / ventoinha",
    "ventilacao",
    "Força a passagem de ar pelo radiador quando o comando do veículo solicita ventilação adicional.",
    "Avalie motor, alimentação, relés ou módulo e estratégia de comando. É diferente do ventilador da cabine do item 13; não aplique uma temperatura universal de acionamento.",
    ["ventilador do radiador", "fan axial"],
  ),
  part(
    3,
    "Tampa de pressão",
    "expansao",
    "Controla a pressão prevista pelo projeto e participa da compensação de pressão do sistema.",
    "No cartaz fica no radiador; em outros sistemas pode ficar no reservatório pressurizado. Confira a pressão especificada. Não abra o sistema quente ou pressurizado.",
    ["tampa do radiador", "válvula de pressão", "pressure cap"],
  ),
  part(
    4,
    "Bomba d’água",
    "circulacao",
    "O impulsor movimenta o líquido pelo motor e pelos caminhos de circulação disponíveis.",
    "Verifique vazamento, folga, ruído e circulação conforme o manual. Acionamento mecânico ou elétrico, geometria e integração com a carcaça variam por aplicação.",
    ["bomba de água", "bomba dagua", "water pump", "impulsor"],
  ),
  part(
    5,
    "Carcaça da válvula termostática",
    "circulacao",
    "Aloja o termostato e as conexões que ligam os caminhos de circulação do líquido.",
    "Inspecione carcaça, superfícies, vedações e conexões. Pode integrar sensores ou outros elementos; material e construção dependem do motor.",
    ["alojamento do termostato", "cavalete de água", "thermostat housing"],
  ),
  part(
    6,
    "Válvula termostática",
    "circulacao",
    "Modula a passagem para o radiador conforme a temperatura, contribuindo para o controle térmico do motor.",
    "Temperatura de início de abertura e curso precisam corresponder ao motor. Travada fechada pode causar superaquecimento; aberta pode atrasar o aquecimento.",
    ["termostato", "válvula de cera", "thermostat"],
  ),
  part(
    7,
    "Mangueira superior",
    "circuito",
    "Conduz líquido aquecido do motor ao radiador quando a válvula termostática permite a passagem neste exemplo.",
    "Vermelho é uma convenção didática de temperatura relativa, não especificação de material. Confira diâmetro, formato, abraçadeiras e pontos de conexão.",
    ["mangueira quente", "mangote superior", "upper hose"],
  ),
  part(
    8,
    "Mangueira inferior",
    "circuito",
    "Retorna líquido do radiador para a entrada da bomba no circuito principal ilustrado.",
    "Azul indica retorno relativamente mais frio, não líquido gelado. Percurso, reforços internos e construção da mangueira dependem do projeto.",
    ["mangueira de retorno", "mangote inferior", "lower hose"],
  ),
  part(
    9,
    "Reservatório de expansão",
    "expansao",
    "Acomoda variações de volume e permite acompanhar o nível do líquido conforme o projeto do sistema.",
    "Vaso pressurizado e reservatório de recuperação têm ligações diferentes. Na referência aparece em um ramal de compensação, sem ser colocado em série no trajeto principal. Cor do líquido não identifica sua especificação.",
    ["vaso de expansão", "tanque de compensação", "coolant tank"],
  ),
  part(
    10,
    "Radiador do aquecedor",
    "ventilacao",
    "Transfere calor do líquido do motor para o ar usado no aquecimento da cabine.",
    "É o heater core, diferente do evaporador do ar-condicionado. O ar e o líquido permanecem separados pelas paredes do trocador.",
    ["aquecedor da cabine", "ar quente", "heater core"],
  ),
  part(
    11,
    "Mangueira de alimentação do aquecedor",
    "ventilacao",
    "Leva líquido aquecido do motor ao trocador de calor da cabine no ramal do aquecedor.",
    "A linha vermelha identifica a alimentação neste exemplo. Válvulas de controle, posição das conexões e percurso podem variar conforme o veículo.",
    ["entrada do aquecedor", "heater supply"],
  ),
  part(
    12,
    "Mangueira de retorno do aquecedor",
    "ventilacao",
    "Retorna líquido do trocador da cabine para o lado de entrada da bomba no exemplo ilustrado.",
    "A linha azul representa retorno relativamente mais frio. É um ramal diferente da mangueira inferior do radiador, item 8.",
    ["saída do aquecedor", "heater return"],
  ),
  part(
    13,
    "Ventilador da cabine / blower",
    "ventilacao",
    "Impulsiona o ar através do aquecedor e dos demais caminhos de ventilação da cabine.",
    "A imagem mostra um ventilador centrífugo. O ar não se mistura ao líquido do aquecedor; este ventilador é distinto da ventoinha do radiador, item 2.",
    ["soprador", "motor do ar interno", "gaiola de esquilo"],
  ),
  part(
    14,
    "Dreno do radiador",
    "expansao",
    "Oferece um ponto de esvaziamento do radiador quando esse recurso existe no projeto.",
    "Tipo de válvula, vedação e procedimento variam. A imagem identifica o componente e não define um procedimento de drenagem.",
    ["válvula de dreno", "petcock", "torneira de drenagem"],
  ),
  part(
    15,
    "Sensor de temperatura / ECT",
    "sensoriamento",
    "Informa a temperatura do líquido à eletrônica do veículo para o gerenciamento previsto na aplicação.",
    "Verifique leitura, alimentação, chicote e sinal conforme o esquema. Leituras incorretas não comprovam sozinhas defeito do sensor; localização e características variam.",
    [
      "sensor de temperatura do líquido",
      "coolant sensor",
      "engine coolant temperature",
    ],
  ),
];

export const coolingReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "termostato",
    name: "Válvula termostática em detalhe",
    system: "circulacao",
    imageCell: 0,
    description:
      "Elementos do termostato apresentados para identificação visual junto à carcaça.",
    details: [
      "Tampa e válvula do termostato",
      "Mola",
      "Sede",
      "Anel de vedação",
      "Elementos internos como contexto, sem procedimento de desmontagem",
    ],
    partNumbers: [5, 6],
  },
  {
    id: "bomba",
    name: "Bomba d’água em detalhe",
    system: "circulacao",
    imageCell: 1,
    description:
      "Carcaça, apoio do eixo, impulsor e junta reunidos em uma vista separada.",
    details: [
      "Carcaça da bomba",
      "Eixo e rolamento (contexto)",
      "Rotor / impulsor",
      "Junta de vedação",
    ],
    partNumbers: [4],
  },
  {
    id: "fluxo",
    name: "Fluxo do circuito principal",
    system: "circuito",
    imageCell: 2,
    description:
      "Motor, termostato, radiador e bomba ilustram a circulação com passagem para o radiador.",
    details: [
      "Saída do motor → termostato → mangueira superior → radiador",
      "Retorno pela mangueira inferior → bomba → motor",
      "Reservatório em ramal de compensação",
      "Vermelho e azul indicam temperaturas relativas",
      "Motor e bypass são contexto; o percurso varia por projeto",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15],
  },
  {
    id: "aquecedor",
    name: "Circuito do aquecedor da cabine",
    system: "ventilacao",
    imageCell: 3,
    description:
      "O trocador da cabine recebe líquido por um ramal próprio, enquanto o blower movimenta o ar.",
    details: [
      "Mangueira de alimentação quente",
      "Radiador do aquecedor",
      "Mangueira de retorno",
      "Blower e passagem de ar, separados do líquido",
    ],
    partNumbers: [10, 11, 12, 13],
  },
  {
    id: "posicao",
    name: "Posição no compartimento do motor",
    system: "circuito",
    imageCell: 4,
    description:
      "Localização ilustrativa do radiador frontal, motor, mangueiras e reservatório em um veículo genérico.",
    details: [
      "Radiador na região frontal",
      "Motor e conexões do circuito",
      "Reservatório em posição lateral",
      "Imagem de contexto, sem identificação de modelo ou compatibilidade",
    ],
    partNumbers: [1, 2, 4, 9],
  },
];
export const coolingPartArtwork: VisualArtwork = {
  src: "/images/cooling-reference/components.webp",
  columns: 3,
  rows: 5,
  aspectRatio: 10 / 9,
  rowBounds: [0, 340 / 1536, 637 / 1536, 932 / 1536, 1218 / 1536, 1],
};
export const coolingAssemblyArtwork: VisualArtwork = {
  src: "/images/cooling-reference/assemblies.webp",
  columns: 3,
  rows: 2,
  aspectRatio: 1,
};
export const coolingVisualCatalog: VisualCatalog = {
  id: "arrefecimento",
  name: "Arrefecimento do motor",
  className: "cooling-reference-catalog",
  title: "Arrefecimento, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / CONTROLE TÉRMICO DO MOTOR",
  description:
    "Explore os 15 componentes do cartaz: radiador, bomba, termostato, mangueiras, reservatório e aquecimento da cabine. Consulte as funções, os detalhes e o fluxo do líquido.",
  searchTerms: "sistema arrefecimento motor",
  searchPlaceholder: "Nome, número ou função: termostato, 4, aquecedor…",
  systemLabel: "Sistema de arrefecimento",
  assemblyLabel: "Conjuntos e fluxo",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/arrefecimento",
  interactiveLabel: "Explorar arrefecimento interativo",
  systems: coolingReferenceSystems,
  parts: coolingReferenceParts,
  assemblies: coolingReferenceAssemblies,
  partArtwork: coolingPartArtwork,
  assemblyArtwork: coolingAssemblyArtwork,
  overview: {
    kind: "sprite",
    artwork: coolingAssemblyArtwork,
    cell: 5,
    alt: "Ilustração didática gerada do sistema de arrefecimento, com radiador, motor, reservatório e ramal do aquecedor",
    caption: "Sistema de arrefecimento · referência ilustrativa",
  },
  sections: [
    {
      title: "Fluxo do líquido de arrefecimento",
      description:
        "Com a passagem para o radiador aberta, o circuito principal segue o caminho abaixo. Com o termostato fechado, a circulação interna pode continuar pelo bypass, conforme o projeto; não significa parada da bomba. O reservatório é um ramal de compensação e o aquecedor pode ter circulação própria.",
      items: [
        "A — O líquido aquecido sai do motor.",
        "B — A passagem pela válvula termostática depende de sua abertura.",
        "C — Segue pela mangueira superior ao radiador, que transfere calor ao ar.",
        "D — Retorna relativamente mais frio pela mangueira inferior à bomba.",
        "E — A bomba promove nova circulação pelo motor.",
      ],
    },
    {
      title: "Possíveis falhas e sintomas",
      description:
        "Os sinais abaixo orientam a inspeção e não confirmam um diagnóstico isoladamente.",
      items: [
        "Vazamento de líquido → nível baixo e possível superaquecimento.",
        "Termostato travado fechado → possível superaquecimento.",
        "Termostato travado aberto → motor pode demorar a aquecer.",
        "Bomba com folga ou ruído → possível vazamento e circulação insuficiente.",
        "Radiador obstruído → temperatura elevada e perda de rendimento.",
        "Ventoinha inoperante → possível superaquecimento no trânsito ou em marcha lenta.",
        "Falha no circuito do ECT → leituras incorretas e alterações no gerenciamento; conferir também conectores e chicote.",
      ],
    },
    {
      title: "Dicas de oficina",
      items: [
        "Use o líquido e a concentração recomendados pela montadora; a cor não comprova a especificação.",
        "Verifique mangueiras, abraçadeiras, tampa e sinais de vazamento nas manutenções previstas.",
        "Após troca de líquido ou componentes, siga o procedimento específico de enchimento e sangria.",
        "Verifique a abertura do termostato pelo método e pelas especificações do fabricante; quando houver teste em bancada, utilize medição adequada de temperatura.",
      ],
    },
    {
      title: "Aplicação geral",
      description:
        "A referência abrange o princípio de arrefecimento líquido usado em muitos veículos leves, utilitários e SUVs com motor a combustão, incluindo aplicações flex, gasolina, diesel e GNV. Percursos, componentes e controles mudam conforme motor, ano e versão.",
    },
    {
      title: "Valores do cartaz: exemplos, não especificações universais",
      description:
        "Os números e o tipo de fluido abaixo reproduzem exemplos da referência. Não confirmam aplicação, faixa normal de operação, pressão de tampa ou intervalo de manutenção de um veículo. Consulte o manual do fabricante.",
      groups: [
        {
          name: "Abertura do termostato",
          text: "82–88 °C no cartaz; o valor correto depende do motor e do termostato especificado.",
        },
        {
          name: "Temperatura de trabalho",
          text: "90–105 °C como exemplo; condições de operação e estratégia de controle variam.",
        },
        {
          name: "Pressão da tampa",
          text: "0,9–1,4 bar (aprox. 13–20 psi) como exemplo; utilize a pressão especificada para o sistema.",
        },
        {
          name: "Tipo de fluido",
          text: "O cartaz cita aditivo orgânico long life. Tecnologia, mistura e concentração devem seguir a aprovação da montadora, sem escolha apenas pela cor.",
        },
        {
          name: "Troca do líquido",
          text: "2–5 anos ou 40.000–100.000 km são exemplos do cartaz; o intervalo aplicável é o do manual.",
        },
      ],
    },
  ],
  notes: [
    "Imagens ilustrativas geradas com base no cartaz para identificação didática. Não são fotografias de fabricante e não confirmam código, medidas ou compatibilidade.",
    "Os 15 componentes seguem a lista principal. Motor e bypass aparecem como contexto, assim como os elementos internos dos detalhes; não são novas peças numeradas deste catálogo.",
    "Vermelho e azul representam temperaturas relativas. O aquecedor usa líquido do motor, distinto do circuito de refrigerante do ar-condicionado; o ar não se mistura ao líquido.",
    "A vista explodida não é procedimento de reparo. Não abra o sistema quente ou pressurizado; consulte as especificações e os procedimentos do fabricante.",
  ],
};
