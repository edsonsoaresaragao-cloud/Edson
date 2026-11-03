export const referenceSystems = [
  { id: "admissao", name: "Admissão" },
  { id: "internos", name: "Motor e conjunto interno" },
  { id: "lubrificacao", name: "Lubrificação" },
  { id: "turbo-escape", name: "Turbo e escape" },
  { id: "distribuicao", name: "Distribuição" },
  { id: "arrefecimento", name: "Arrefecimento" },
  { id: "acessorios", name: "Acessórios" },
] as const;
export type ReferenceSystem = (typeof referenceSystems)[number]["id"];
export type ReferencePart = {
  number: number;
  name: string;
  system: ReferenceSystem;
  description: string;
  note: string;
  aliases: string[];
  imageCell: number;
};
const part = (
  number: number,
  name: string,
  system: ReferenceSystem,
  description: string,
  note: string,
  aliases: string[] = [],
): ReferencePart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
});

/** Numbers follow the main 24-item list in the user's educational chart. */
export const mercedesReferenceParts: readonly ReferencePart[] = [
  part(
    1,
    "Capa do motor (acabamento)",
    "internos",
    "Peça de acabamento que cobre a região superior do motor e pode contribuir para o tratamento acústico.",
    "Capa de acabamento e tampa de válvulas são componentes diferentes. A imagem representa a capa externa.",
    ["cobertura", "capa plástica"],
  ),
  part(
    2,
    "Caixa do filtro de ar",
    "admissao",
    "Abriga o elemento filtrante e conduz o ar limpo para o circuito de admissão.",
    "Formato, elemento filtrante, respiros e conexões variam conforme o veículo.",
    ["airbox", "filtro de admissão"],
  ),
  part(
    3,
    "Duto de admissão",
    "admissao",
    "Conecta trechos do circuito de entrada de ar e acomoda curvas, conexões e movimentação do conjunto.",
    "Não confundir o duto de entrada com as tubulações de ar pressurizado após o turbo.",
    ["mangueira", "tubo de ar"],
  ),
  part(
    4,
    "Coletor de admissão",
    "admissao",
    "Distribui o ar admitido entre os cilindros do motor.",
    "Geometria, atuadores e pontos de conexão dependem da versão.",
    ["manifold", "plenum"],
  ),
  part(
    5,
    "Corpo de borboleta (TBI)",
    "admissao",
    "Regula a passagem de ar de acordo com a estratégia de gerenciamento do motor.",
    "O atuador e os sensores de posição integram o conjunto ilustrado. Procedimentos de adaptação são específicos da aplicação.",
    ["borboleta eletrônica", "throttle"],
  ),
  part(
    6,
    "Cabeçote (com válvulas)",
    "internos",
    "Abriga as válvulas e seus acionamentos e participa da formação das câmaras de combustão.",
    "Os subconjuntos de comandos, molas e acionadores podem ser vistos na seção de detalhes.",
    ["comando de válvulas", "cylinder head"],
  ),
  part(
    7,
    "Junta do cabeçote",
    "internos",
    "Veda a união entre bloco e cabeçote, separando combustão, óleo e líquido de arrefecimento.",
    "Espessura, materiais e procedimentos de montagem não podem ser determinados pela ilustração.",
    ["vedação", "gasket"],
  ),
  part(
    8,
    "Bloco do motor",
    "internos",
    "Aloja os cilindros e sustenta o conjunto móvel, mancais e galerias internas.",
    "A imagem representa quatro cilindros em linha; não define medidas nem código de bloco.",
    ["cilindros", "engine block"],
  ),
  part(
    9,
    "Pistões e anéis",
    "internos",
    "Recebem a pressão da combustão. Os anéis participam da vedação e do controle do óleo nos cilindros.",
    "O conjunto de quatro pistões é ilustrativo; folgas, posição dos anéis e dimensões dependem do motor.",
    ["pistão", "segmentos", "piston"],
  ),
  part(
    10,
    "Bielas",
    "internos",
    "Conectam os pistões ao virabrequim e transmitem os esforços do movimento alternativo.",
    "Bielas, capas e fixações exigem identificação e especificações próprias de montagem.",
    ["biela", "connecting rod"],
  ),
  part(
    11,
    "Virabrequim",
    "internos",
    "Transforma os esforços do conjunto pistão/biela em movimento de rotação.",
    "Mancais, bronzinas, contrapesos e acionamentos variam conforme o projeto.",
    ["árvore de manivelas", "crankshaft"],
  ),
  part(
    12,
    "Cárter de óleo",
    "lubrificacao",
    "Fecha a região inferior do motor e, no sistema ilustrado, participa do armazenamento e retorno do óleo.",
    "Vedação, sensores e eventual função estrutural dependem do conjunto.",
    ["sump", "reservatório de óleo"],
  ),
  part(
    13,
    "Bomba de óleo",
    "lubrificacao",
    "Alimenta o circuito de lubrificação, enviando óleo às galerias e aos componentes do motor.",
    "Pescador, acionamento e controle de vazão ou pressão são específicos de cada versão.",
    ["pescador", "pressão de óleo"],
  ),
  part(
    14,
    "Filtro de óleo",
    "lubrificacao",
    "Retém partículas em circulação no circuito de lubrificação.",
    "A referência mostra um elemento do tipo cartucho. Código, alojamento e intervalo de troca precisam de confirmação.",
    ["elemento filtrante", "cartucho"],
  ),
  part(
    15,
    "Trocador de calor do óleo",
    "lubrificacao",
    "Transfere calor entre o óleo e outro meio para auxiliar no controle de sua temperatura.",
    "O meio secundário, as conexões e a integração com o alojamento do filtro variam por aplicação.",
    ["resfriador de óleo", "oil cooler"],
  ),
  part(
    16,
    "Turbocompressor",
    "turbo-escape",
    "Aproveita a energia dos gases de escape para comprimir o ar de admissão.",
    "A imagem é uma representação genérica. Turbina, compressor, mancais e controle precisam corresponder à aplicação.",
    ["turbo compressor", "turbina"],
  ),
  part(
    17,
    "Coletor de escape",
    "turbo-escape",
    "Reúne os gases de escape dos cilindros e os direciona ao sistema de escape e ao turbo.",
    "O cartaz representa um coletor separado. Alguns projetos integram dutos ao cabeçote ou agrupam o coletor com outros componentes.",
    ["manifold de escape", "gases"],
  ),
  part(
    18,
    "Catalisador / filtro GPF conforme versão",
    "turbo-escape",
    "Integra o pós-tratamento dos gases de escape para reduzir emissões. Filtro de partículas pode estar presente em determinadas versões.",
    "Catalisador e GPF têm funções diferentes e podem ser combinados em um conjunto. A ilustração não confirma a presença de GPF em todo M264 ou M260.",
    ["catalisador", "pós-tratamento", "partículas"],
  ),
  part(
    19,
    "Intercooler (ar-ar na referência)",
    "turbo-escape",
    "Reduz a temperatura do ar comprimido pelo turbocompressor antes de sua admissão no motor.",
    "O cartaz utiliza um exemplo ar-ar; a arquitetura real pode empregar outro circuito de resfriamento do ar de carga.",
    ["ar de carga", "sobrealimentação", "charge air cooler"],
  ),
  part(
    20,
    "Sistema de distribuição por corrente",
    "distribuicao",
    "Sincroniza virabrequim e comandos de válvulas por corrente, engrenagens, guias e tensionador.",
    "Este é o item 20 da lista principal. A correia de acessórios é o item 21; a marcação 21 no detalhe da corrente no cartaz não altera essa distinção.",
    ["corrente de comando", "sincronismo", "tensionador hidráulico"],
  ),
  part(
    21,
    "Polias e correia de acessórios",
    "acessorios",
    "Transmitem movimento aos acessórios e mantêm o percurso e a tensão da correia previstos no projeto.",
    "A imagem representa correia multicanal de acessórios, não uma correia dentada de distribuição.",
    ["correia poly-v", "serpentina", "tensor", "polia"],
  ),
  part(
    22,
    "Alternador",
    "acessorios",
    "Produz energia elétrica e participa do suprimento do sistema e da carga da bateria.",
    "Sistemas eletrificados podem adotar outra arquitetura de geração ou partida. Confirme o conjunto do veículo.",
    ["gerador", "carga"],
  ),
  part(
    23,
    "Compressor do ar-condicionado",
    "acessorios",
    "Comprime e faz circular o refrigerante no circuito de climatização.",
    "A referência mostra um conjunto com polia. Acionamento, fluido e controle variam conforme o veículo.",
    ["compressor ac", "climatização"],
  ),
  part(
    24,
    "Bomba d’água",
    "arrefecimento",
    "Promove a circulação do líquido pelo circuito de arrefecimento do motor.",
    "O tipo de acionamento não é confirmado pela imagem. Bomba mecânica e elétrica dependem da aplicação.",
    ["bomba de água", "bomba d agua", "bomba dagua", "coolant pump"],
  ),
];

export type ReferenceAssembly = {
  id: string;
  name: string;
  system: ReferenceSystem;
  imageCell: number;
  description: string;
  details: string[];
  partNumbers: number[];
};
// Existing generic illustrations: 3 columns × 2 rows. Cell 3 (toothed belt)
// is intentionally excluded from this chain/serpentine reference.
export const mercedesReferenceAssemblies: readonly ReferenceAssembly[] = [
  {
    id: "turbo",
    name: "Turbocompressor em detalhe",
    system: "turbo-escape",
    imageCell: 0,
    description:
      "Conjunto turbina, eixo/mancais e compressor em uma vista separada para identificação.",
    details: [
      "Carcaça da turbina",
      "Eixo e mancais",
      "Roda do compressor",
      "Carcaça do compressor",
    ],
    partNumbers: [16],
  },
  {
    id: "cabecote",
    name: "Cabeçote e trem de válvulas",
    system: "internos",
    imageCell: 1,
    description:
      "Os elementos do comando e das válvulas organizados acima do cabeçote.",
    details: [
      "Comando de válvulas de admissão",
      "Comando de válvulas de escape",
      "Tuchos / acionadores",
      "Válvulas de admissão e escape",
      "Molas de válvulas",
      "Cabeçote",
    ],
    partNumbers: [6],
  },
  {
    id: "distribuicao",
    name: "Sistema de distribuição",
    system: "distribuicao",
    imageCell: 2,
    description:
      "Sincronismo por corrente com guias, engrenagens e tensionador apresentados separadamente.",
    details: [
      "Engrenagens dos comandos",
      "Corrente de distribuição",
      "Guias deslizantes",
      "Tensionador hidráulico",
      "Engrenagem do virabrequim",
    ],
    partNumbers: [20],
  },
  {
    id: "lubrificacao",
    name: "Sistema de lubrificação",
    system: "lubrificacao",
    imageCell: 4,
    description:
      "Bomba, filtração e troca de calor do óleo reunidas para comparação visual.",
    details: [
      "Bomba de óleo e pescador",
      "Filtro de óleo",
      "Trocador de calor do óleo",
    ],
    partNumbers: [13, 14, 15],
  },
  {
    id: "arrefecimento",
    name: "Sistema de arrefecimento",
    system: "arrefecimento",
    imageCell: 5,
    description:
      "Bomba, válvula termostática e radiador como referência funcional do circuito de líquido.",
    details: [
      "Bomba d’água",
      "Válvula termostática (contexto)",
      "Radiador / trocador de calor (contexto)",
    ],
    partNumbers: [24],
  },
];

export function normalizeReferenceSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function referenceSystemName(id: ReferenceSystem) {
  return referenceSystems.find((system) => system.id === id)!.name;
}
export function filterReferenceParts(
  query = "",
  system: ReferenceSystem | "all" = "all",
  order: "number" | "name" = "number",
): ReferencePart[] {
  const normalized = normalizeReferenceSearch(query);
  const words = normalized.split(" ").filter(Boolean);
  return mercedesReferenceParts
    .filter((item) => {
      if (system !== "all" && item.system !== system) return false;
      if (/^\d{1,2}$/.test(normalized))
        return item.number === Number(normalized);
      const text = normalizeReferenceSearch(
        [
          item.number,
          "Mercedes-Benz M264 M260",
          item.name,
          item.description,
          item.note,
          referenceSystemName(item.system),
          ...item.aliases,
        ].join(" "),
      );
      return words.every((word) => text.includes(word));
    })
    .sort((a, b) =>
      order === "number"
        ? a.number - b.number
        : a.name.localeCompare(b.name, "pt-BR"),
    );
}
export function filterReferenceAssemblies(
  query = "",
  system: ReferenceSystem | "all" = "all",
): ReferenceAssembly[] {
  const words = normalizeReferenceSearch(query).split(" ").filter(Boolean);
  return mercedesReferenceAssemblies.filter(
    (item) =>
      (system === "all" || item.system === system) &&
      words.every((word) =>
        normalizeReferenceSearch(
          [
            "Mercedes-Benz M264 M260",
            item.name,
            item.description,
            ...item.details,
            ...item.partNumbers,
          ].join(" "),
        ).includes(word),
      ),
  );
}
