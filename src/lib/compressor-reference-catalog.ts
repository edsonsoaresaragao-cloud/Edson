import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const compressorReferenceSystems = [
  { id: "embreagem", name: "Embreagem e polia" },
  { id: "estrutura", name: "Carcaças e acionamento" },
  { id: "compressao", name: "Compressão e válvulas" },
  { id: "vedacao", name: "Vedações" },
  { id: "conexoes", name: "Conexões, elétrica e fluxo" },
] as const;
type CompressorReferenceSystem =
  (typeof compressorReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: CompressorReferenceSystem,
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

/** Matches the chart and the existing compressor interactive, including context 11. */
export const compressorReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Polia",
    "embreagem",
    "Recebe o torque da correia do motor. No exemplo com embreagem, pode girar com o eixo do compressor desacoplado.",
    "Inspecione canais, alinhamento e sinais de desgaste. Diâmetro, número de canais e construção dependem do compressor.",
    ["polia multicanal", "pulley"],
  ),
  part(
    2,
    "Rolamento da polia",
    "embreagem",
    "Permite a rotação da polia em relação ao apoio frontal com baixo atrito.",
    "Avalie ruído, folga e travamento pelo procedimento do fabricante. O rolamento da polia é diferente dos apoios internos do eixo.",
    ["bearing", "rolamento da embreagem"],
  ),
  part(
    3,
    "Placa da embreagem",
    "embreagem",
    "É atraída pelo campo da bobina e acopla a polia ao eixo, transmitindo movimento ao mecanismo interno.",
    "Verifique desgaste da superfície, engate e folga conforme a especificação. A folga ilustrada não é uma medida de ajuste.",
    ["disco da embreagem", "armadura", "prato da embreagem"],
  ),
  part(
    4,
    "Eixo",
    "estrutura",
    "Recebe o torque da embreagem e transmite a rotação ao conjunto interno de compressão.",
    "Inspecione apoios e região de vedação conforme o manual. Estrias, comprimento e mecanismo de ligação variam por projeto.",
    ["árvore", "drive shaft"],
  ),
  part(
    5,
    "Carcaça frontal",
    "estrutura",
    "Fecha a parte dianteira, apoia o conjunto do eixo e abriga a região do retentor.",
    "É diferente do corpo principal do item 6. Observe fixações, trincas e superfícies de vedação sem deduzir torque pela imagem.",
    ["tampa dianteira", "nariz do compressor"],
  ),
  part(
    6,
    "Carcaça principal",
    "estrutura",
    "Aloja o conjunto de compressão e participa das galerias de circulação do refrigerante no projeto ilustrado.",
    "O desenho apresenta um compressor axial genérico. Formato do bloco de cilindros, integração das galerias e pontos de fixação variam.",
    ["corpo", "cilindro", "housing"],
  ),
  part(
    7,
    "Bobina magnética",
    "embreagem",
    "Gera o campo eletromagnético que atrai a placa da embreagem quando o circuito a energiza.",
    "A bobina permanece fixa enquanto a polia gira. Muitas aplicações usam 12 V, mas tensão, resistência e proteção devem ser confirmadas no esquema do veículo.",
    ["eletroímã", "solenoide", "coil"],
  ),
  part(
    8,
    "Pistões / placa oscilante",
    "compressao",
    "O mecanismo de placa inclinada converte a rotação do eixo em movimento alternado dos pistões axiais, comprimindo o vapor refrigerante.",
    "O conjunto é ilustrativo. Número de pistões, curso, placa oscilante ou inclinada e controle de cilindrada dependem da arquitetura.",
    ["conjunto de pistões", "swash plate", "placa inclinada"],
  ),
  part(
    9,
    "Placa de válvulas",
    "compressao",
    "Reúne passagens e válvulas de sucção e descarga que controlam a entrada e a saída do refrigerante dos cilindros.",
    "Inspecione lâminas, superfícies e sinais de contaminação conforme o procedimento específico. A imagem não define o sentido de montagem.",
    ["válvulas de palheta", "reed valve", "lâminas"],
  ),
  part(
    10,
    "Tampa traseira",
    "estrutura",
    "Fecha a região posterior e participa das câmaras e galerias de sucção e descarga do compressor.",
    "A posição das portas e a integração com a placa de válvulas variam. Avalie vazamentos e superfícies de união conforme o manual.",
    ["cabeçote traseiro", "rear cover"],
  ),
  {
    ...part(
      11,
      "Fluxo de sucção e descarga",
      "conexoes",
      "As setas azuis representam entrada de vapor em baixa pressão; as vermelhas representam saída de vapor em alta pressão.",
      "Identificação de contexto, não uma peça de reposição. O cartaz repete as conexões em 11 e 14; aqui o 11 identifica o fluxo e o 14 as portas físicas.",
      ["baixa pressão", "alta pressão", "entrada", "saída"],
    ),
    kind: "context",
  },
  part(
    12,
    "Retentor do eixo",
    "vedacao",
    "Veda dinamicamente a passagem do eixo, contribuindo para conter o óleo e o refrigerante no compressor.",
    "Verifique sinais de vazamento e a condição da região do eixo. Material, dimensões, lubrificação e montagem exigem a especificação da aplicação.",
    ["selo mecânico", "shaft seal"],
  ),
  part(
    13,
    "Chicote / conector elétrico",
    "conexoes",
    "Conecta a alimentação e o comando da bobina da embreagem no exemplo ilustrado.",
    "Cheque contato, oxidação, travas e integridade do chicote. Pinagem e função dos conectores variam; alguns compressores possuem controle eletrônico de outra construção.",
    ["fiação", "plugue", "alimentação elétrica"],
  ),
  part(
    14,
    "Conexões de sucção e descarga",
    "conexoes",
    "Portas físicas que ligam a entrada de baixa pressão e a saída de alta pressão às tubulações do sistema A/C.",
    "Confirme a identificação das portas, encaixes, vedações e torque no manual. O item 11 mostra apenas o fluxo, sem duplicar este componente.",
    ["bloco de conexões", "portas", "tubulações", "manifold"],
  ),
  part(
    15,
    "Parafusos de fixação",
    "estrutura",
    "Unem tampas e carcaças e fixam componentes do conjunto nos pontos previstos no projeto.",
    "Comprimento, classe, reaproveitamento, torque e sequência de aperto são específicos. A ordem visual do cartaz não é um procedimento de montagem.",
    ["fixadores", "bolts"],
  ),
  part(
    16,
    "Vedações / O-rings",
    "vedacao",
    "Vedam as interfaces entre carcaças, tampas e conexões, limitando vazamentos de refrigerante e óleo.",
    "Material e dimensões precisam ser compatíveis com o fluido, o óleo e a aplicação. Cor e aparência não comprovam equivalência entre vedações.",
    ["juntas", "anéis de vedação", "oring", "o ring"],
  ),
];

export const compressorReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "embreagem",
    name: "Embreagem magnética em detalhe",
    system: "embreagem",
    imageCell: 0,
    description:
      "Polia, rolamento, placa e bobina organizados para reconhecer as partes do acionamento.",
    details: [
      "Polia multicanal",
      "Rolamento da polia",
      "Placa da embreagem",
      "Bobina estacionária",
    ],
    partNumbers: [1, 2, 3, 7],
  },
  {
    id: "frente",
    name: "Carcaça frontal, eixo e retentor",
    system: "estrutura",
    imageCell: 1,
    description:
      "A região de entrada do movimento com os apoios e a vedação do eixo apresentados separadamente.",
    details: [
      "Carcaça frontal",
      "Eixo de acionamento",
      "Retentor do eixo",
      "Anel de vedação",
    ],
    partNumbers: [4, 5, 12, 16],
  },
  {
    id: "compressao",
    name: "Conjunto interno de compressão",
    system: "compressao",
    imageCell: 2,
    description:
      "Placa inclinada e pistões axiais ilustram a transformação de rotação em movimento alternado.",
    details: [
      "Eixo central",
      "Placa inclinada / oscilante",
      "Pistões axiais",
      "Número de pistões e geometria variáveis",
    ],
    partNumbers: [4, 8],
  },
  {
    id: "traseira",
    name: "Válvulas, tampa e conexões",
    system: "compressao",
    imageCell: 3,
    description:
      "Elementos de controle do fluxo e fechamento traseiro reunidos em uma vista separada.",
    details: [
      "Placa de válvulas",
      "Tampa traseira",
      "Portas de sucção e descarga",
      "O-rings e fixações",
    ],
    partNumbers: [9, 10, 14, 15, 16],
  },
  {
    id: "funcionamento",
    name: "Funcionamento em corte",
    system: "conexoes",
    imageCell: 4,
    description:
      "Vista de contexto da compressão: o vapor entra em baixa pressão e sai em alta pressão em direção ao condensador.",
    details: [
      "Azul: entrada de vapor na sucção",
      "Vermelho: saída de vapor na descarga",
      "Movimento axial dos pistões",
      "Setas didáticas; sem cálculo de pressão ou vazão",
    ],
    partNumbers: [8, 11, 14],
  },
];
export const compressorPartArtwork: VisualArtwork = {
  src: "/images/compressor-reference/components.webp",
  columns: 4,
  rows: 4,
  aspectRatio: 4 / 3,
};
export const compressorAssemblyArtwork: VisualArtwork = {
  src: "/images/compressor-reference/assemblies.webp",
  columns: 3,
  rows: 2,
  aspectRatio: 1,
};
export const compressorVisualCatalog: VisualCatalog = {
  id: "compressor",
  name: "Compressor de ar-condicionado",
  className: "compressor-reference-catalog",
  title: "Compressor de A/C, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / CLIMATIZAÇÃO AUTOMOTIVA",
  description:
    "Referência de um compressor axial com embreagem magnética: 15 componentes e uma identificação de fluxo, mantendo os 16 números do cartaz. Explore as peças, os conjuntos e o funcionamento.",
  searchTerms: "compressor ar condicionado A/C automotivo",
  searchPlaceholder: "Nome, número ou função: bobina, 12, vedação…",
  systemLabel: "Sistema do compressor",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  partLabels: {
    tab: "Identificações",
    singular: "identificação",
    plural: "identificações",
    feminine: true,
  },
  interactiveHref: "/categorias/ar-condicionado/compressor",
  interactiveLabel: "Explorar compressor interativo",
  systems: compressorReferenceSystems,
  parts: compressorReferenceParts,
  assemblies: compressorReferenceAssemblies,
  partArtwork: compressorPartArtwork,
  assemblyArtwork: compressorAssemblyArtwork,
  overview: {
    kind: "sprite",
    artwork: compressorAssemblyArtwork,
    cell: 5,
    alt: "Ilustração didática gerada de compressor axial com polia e embreagem magnética",
    caption: "Compressor montado · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona",
      description:
        "Com a embreagem acoplada, a polia transmite torque ao eixo. A placa inclinada produz o movimento alternado dos pistões: eles aspiram vapor em baixa pressão e o comprimem, enviando-o ao condensador em alta pressão. O resfriamento da cabine ocorre na etapa de evaporação do circuito de A/C.",
    },
    {
      title: "Pontos de atenção",
      items: [
        "Embreagem magnética: verificar engate, desgaste da placa e folga conforme a especificação.",
        "Rolamento: avaliar ruído, folga e sinais de travamento da polia.",
        "Vazamentos: inspecionar carcaças, juntas, conexões e tampa traseira quanto a sinais de óleo ou refrigerante.",
        "Retentor: verificar a região do eixo e a origem de eventual vazamento.",
        "Conectores: checar contatos, oxidação, travas e integridade do chicote.",
        "Ruídos: investigar chiados, batidas e outros sons anormais pelo procedimento de diagnóstico.",
        "Contaminação interna: evitar umidade e sujeira; após falha severa, avaliar limpeza dos componentes que permitem flush e substituição do filtro secador conforme o fabricante.",
      ],
    },
    {
      title: "Entenda a numeração da referência",
      description:
        "Os números 11 e 14 repetem as conexões no cartaz original. Nesta biblioteca e na vista interativa, 11 identifica as setas do fluxo e 14 as conexões físicas. Assim, as 16 identificações representam 15 componentes e um contexto de funcionamento.",
    },
  ],
  notes: [
    "Imagens ilustrativas geradas com base no cartaz, para identificação didática. Não são fotografias de fabricante e não confirmam código, medidas ou compatibilidade.",
    "A posição das peças na vista explodida não determina sequência de desmontagem, montagem, folgas ou torques. Consulte o procedimento do compressor específico.",
    "O exemplo utiliza pistões axiais e embreagem magnética. Compressores sem embreagem, de outros mecanismos ou elétricos têm construções diferentes; tensão, fluido e lubrificante dependem da aplicação.",
  ],
};
