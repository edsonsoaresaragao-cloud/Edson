export type Engine = {
  id: string;
  maker: string;
  family: string;
  layout: "I3" | "I4" | "I6" | "V6" | "variavel";
  note?: string;
};
const groups: [string, [string, Engine["layout"], string?][]][] = [
  [
    "Volkswagen",
    [
      ["AP 1.6", "I4"],
      ["AP 1.8", "I4"],
      ["AP 2.0", "I4"],
      ["EA111", "I4"],
      ["EA888", "I4"],
    ],
  ],
  [
    "Chevrolet",
    [
      ["Família I", "I4"],
      ["Família II", "I4"],
      ["CSS Prime", "I3"],
    ],
  ],
  [
    "Fiat / Jeep",
    [
      ["E.torQ", "I4"],
      ["GSE T200", "I3"],
      ["GSE T270", "I4"],
    ],
  ],
  [
    "Renault / Nissan",
    [
      ["K4M", "I4"],
      ["H4M", "I4"],
      ["HR10", "I3"],
    ],
  ],
  [
    "Ford",
    [
      ["CHT", "I4"],
      ["Zetec Rocam", "I4"],
      [
        "EcoBoost",
        "variavel",
        "Família com diferentes cilindradas e configurações. Consulte o código do motor.",
      ],
    ],
  ],
  [
    "Toyota",
    [
      ["1NZ-FE", "I4"],
      ["2ZR-FE", "I4"],
      ["2GR-FE", "V6"],
    ],
  ],
  [
    "Hyundai / Kia",
    [
      ["Gamma", "I4"],
      ["Kappa", "variavel", "Inclui versões de três e quatro cilindros."],
      [
        "Smartstream",
        "variavel",
        "Denominação que abrange diferentes arquiteturas e motorizações.",
      ],
    ],
  ],
  [
    "Mercedes-Benz",
    [
      ["M264", "I4"],
      ["M274", "I4"],
      ["OM651", "I4"],
      ["OM654", "I4"],
    ],
  ],
  [
    "BMW",
    [
      ["N20", "I4"],
      ["B48", "I4"],
      ["B58", "I6"],
      ["N57", "I6"],
    ],
  ],
];
export const engines: Engine[] = groups.flatMap(([maker, families]) =>
  families.map(([family, layout, note]) => ({
    id: (maker + "-" + family)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, ""),
    maker,
    family,
    layout,
    note,
  })),
);
export const layoutNames = {
  I3: "3 cilindros em linha",
  I4: "4 cilindros em linha",
  I6: "6 cilindros em linha",
  V6: "6 cilindros em V",
  variavel: "Configuração conforme versão",
};
export const engineParts = [
  {
    name: "Tampa de válvulas",
    system: "Vedação",
    text: "Protege o conjunto superior e participa da vedação do cabeçote. Formato, respiros e fixações variam conforme a versão.",
  },
  {
    name: "Cabeçote",
    system: "Admissão e escape",
    text: "Abriga as válvulas e seus acionamentos. A posição do comando e a quantidade de válvulas dependem do projeto.",
  },
  {
    name: "Junta do cabeçote",
    system: "Vedação",
    text: "Faz a vedação entre bloco e cabeçote, separando gases de combustão, óleo e líquido de arrefecimento.",
  },
  {
    name: "Bloco do motor",
    system: "Estrutura",
    text: "Estrutura que aloja os cilindros e sustenta o conjunto móvel. Materiais, galerias e camisas variam por aplicação.",
  },
  {
    name: "Pistões e bielas",
    system: "Conjunto móvel",
    text: "Recebem a pressão da combustão e a transmitem ao virabrequim. Folgas e orientação precisam de dados específicos do fabricante.",
  },
  {
    name: "Virabrequim",
    system: "Conjunto móvel",
    text: "Transforma o movimento alternativo em rotação. Mancais, bronzinas e contrapesos dependem da motorização.",
  },
  {
    name: "Cárter",
    system: "Lubrificação",
    text: "Fecha a parte inferior do motor e, em sistemas de cárter úmido, armazena o óleo lubrificante.",
  },
];
