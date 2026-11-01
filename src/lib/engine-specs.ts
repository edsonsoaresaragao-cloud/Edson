import { type Engine } from "./engines";
import visuals from "./engine-visuals.json";

export const specLabels = {
  configuration: "Configuração",
  displacement: "Cilindrada",
  power: "Potência",
  torque: "Torque",
  fuelSystem: "Alimentação",
  timing: "Distribuição",
  cooling: "Arrefecimento",
  lubrication: "Lubrificação",
};
export type SpecKey = keyof typeof specLabels;
export type SpecSource = { title: string; url: string };
export type SpecValue = {
  value: string;
  status: "confirmed" | "general" | "pending";
  source?: SpecSource;
};
type Reference = {
  application: string;
  source: SpecSource;
  values: Partial<Record<SpecKey, string>>;
};
const mercedes = {
  title: "Mercedes-Benz — Classe E, dados técnicos (2020)",
  url: "https://media.mercedes-benz.pl/luksusowa-klasa-mercedes-benz-nowy-poczatek-znaczaco-udoskonalonych-modeli/",
};
const toyota = {
  title: "Toyota — Corolla Axio / Fielder, lançamento de 10/10/2006",
  url: "https://global.toyota/en/newsroom/toyota/23046809.html",
};
const references: Record<string, Reference> = {
  "mercedes-benz-m264": {
    application:
      "E 300, Classe E 2020, mercado europeu; motor a combustão, sem somar EQ Boost",
    source: mercedes,
    values: {
      configuration: "4 cilindros em linha",
      displacement: "1.991 cm³ (2,0 L)",
      power: "258 cv (190 kW) a 5.500–6.100 rpm",
      torque: "370 Nm a 1.650–4.000 rpm",
    },
  },
  "mercedes-benz-m274": {
    application:
      "E 300 e, Classe E 2020, Europa; somente motor a combustão do híbrido",
    source: mercedes,
    values: {
      configuration: "4 cilindros em linha",
      displacement: "1.991 cm³ (2,0 L)",
      power: "211 cv (155 kW) a 5.500 rpm",
      torque: "350 Nm a 1.200–4.000 rpm",
    },
  },
  "mercedes-benz-om654": {
    application: "E 220 d, Classe E 2020, mercado europeu",
    source: mercedes,
    values: {
      configuration: "4 cilindros em linha",
      displacement: "1.950 cm³ (2,0 L)",
      power: "194 cv (143 kW) a 3.800 rpm",
      torque: "400 Nm a 1.600–2.800 rpm",
    },
  },
  "toyota-1nz-fe": {
    application: "Corolla Axio 2WD CVT, Japão, lançamento 2006",
    source: toyota,
    values: {
      displacement: "1.496 cm³ (valor publicado pela Toyota)",
      power: "110 cv (PS; 81 kW) a 6.000 rpm",
      torque: "140 Nm a 4.400 rpm",
    },
  },
  "toyota-2zr-fe": {
    application: "Corolla Axio 2WD CVT, Japão, lançamento 2006",
    source: toyota,
    values: {
      displacement: "1.797 cm³ (1,8 L)",
      power: "136 cv (PS; 100 kW) a 6.000 rpm",
      torque: "175 Nm a 4.400 rpm",
    },
  },
  "fiat-jeep-gse-t200": {
    application: "Fiat Fastback Turbo 200 automático MY24, Brasil, flex",
    source: {
      title: "Fiat — ficha técnica Fastback Turbo 200 MY24",
      url: "https://www.media.stellantis.com/br-pt/download-model-document/251",
    },
    values: {
      configuration: "3 cilindros em linha",
      displacement: "999 cm³ (1,0 L)",
      power: "125 cv (gasolina) / 130 cv (etanol) a 5.750 rpm",
      torque: "200 Nm a 1.750 rpm (gasolina/etanol)",
      fuelSystem: "Injeção direta; gasolina/etanol",
    },
  },
  "fiat-jeep-gse-t270": {
    application: "Fiat Toro Turbo 270, lançamento abril/2021, Brasil, flex",
    source: {
      title: "Fiat — lançamento do Turbo 270 na Toro (2021)",
      url: "https://www.media.stellantis.com/br-pt/fiat/press/nova-fiat-toro-estreia-motor-turbo-flex-mais-potente-e-moderno-do-brasil",
    },
    values: {
      power: "180 cv (gasolina) / 185 cv (etanol) a 5.750 rpm",
      torque: "270 Nm a 1.750 rpm (gasolina/etanol)",
      fuelSystem: "Injeção direta e turbocompressor; flex",
    },
  },
  "fiat-jeep-e-torq": {
    application: "Fiat Punto 2011, E.torQ 1.6 16V flex, Brasil",
    source: {
      title: "Fiat — Punto 2011, lançamento do E.torQ",
      url: "https://www.media.stellantis.com/br-pt/fiat/press/fiat-punto-2011-1277838000-1277845200",
    },
    values: {
      power: "115 cv (gasolina) / 117 cv (etanol)",
      torque: "16,2 kgf·m (gasolina) / 16,8 kgf·m (etanol)",
      fuelSystem: "Flex: gasolina/etanol; tipo de injeção a confirmar",
    },
  },
  "hyundai-kia-kappa": {
    application:
      "Hyundai HB20 Comfort 2026/2027, Kappa 1.0 12V aspirado flex, Brasil",
    source: {
      title: "Hyundai — catálogo HB20 Comfort 2026/2027",
      url: "https://www.hyundai.com.br/content/dam/hmb/cars/hb20/2026-2027/catalogos/Catalogo_Digital_Novo_HB20_Comfort_26_27.pdf",
    },
    values: {
      power: "75 cv (gasolina) / 80 cv (etanol) a 6.200 rpm",
      torque: "9,6 kgf·m (gasolina) / 10,2 kgf·m (etanol) a 4.500 rpm",
      fuelSystem: "Flex: gasolina/etanol; aspirado",
    },
  },
  "hyundai-kia-smartstream": {
    application: "Hyundai Sonata DN8 2019, Smartstream G2.0, Coreia",
    source: {
      title: "Hyundai — Sonata DN8 2019, ficha histórica",
      url: "https://www.hyundai.com/kr/ko/brand/brandstory/model/sonata-history/2019-sonata-dn8",
    },
    values: {
      displacement: "1.999 cm³ (2,0 L)",
      power: "160 cv (PS) a 6.500 rpm",
      torque: "20,0 kgf·m a 4.800 rpm",
    },
  },
  "renault-nissan-hr10": {
    application: "Nissan Micra 1.0 IG-T 100 PS, manual, Reino Unido, 2019",
    source: {
      title: "Nissan — Micra, novas motorizações (2019)",
      url: "https://uk.nissannews.com/en-GB/releases/more-micra-nissan-widens-powertrain-range-to-better-meet-customer-needs?origin=channel-8a0d2f3353d7723c4c3fcf8e15004dfc",
    },
    values: {
      power: "100 cv (PS)",
      torque: "160 Nm a 2.750 rpm",
      fuelSystem: "Gasolina turbo; não confundir com DIG-T 117 PS",
    },
  },
  "chevrolet-css-prime": {
    application:
      "Chevrolet Onix Plus 2020, motor 1.0 T, Brasil; manual edição 12/2019",
    source: {
      title: "Chevrolet — Manual Onix Plus MY20, p.216",
      url: "https://meu.chevrolet.com.br/content/dam/gmownercenter/gmsa/gmbr/dynamic/manuals/2020/chevrolet/OnixPlus/pt/om_ng-chevrolet_Onix%20Plus_my20-pt_BR.pdf.pdf",
    },
    values: {
      configuration: "3 cilindros em linha",
      displacement: "999 cm³ (1,0 L)",
      power: "115,6 cv (85 kW) a 5.500 rpm",
      torque: "165 Nm a 2.000 rpm (valor do manual)",
      fuelSystem: "Flex: gasolina/etanol; turbo",
    },
  },
  "volkswagen-ea888": {
    application:
      "Volkswagen Golf VII GTI, lançamento europeu 2013, versão 220 PS",
    source: {
      title: "Volkswagen — Golf GTI, apresentação internacional 2013",
      url: "https://www.volkswagen-newsroom.com/en/new-golf-gti-international-press-presentation-2976",
    },
    values: {
      power: "220 cv (PS; 162 kW) a 4.500–6.200 rpm",
      displacement: "1.984 cm³ (2,0 L)",
      torque: "350 Nm a 1.500–4.400 rpm",
      fuelSystem: "Gasolina turbo; injeção direta e multiponto (Alemanha)",
      cooling: "Líquido, com gerenciamento térmico eletrônico",
      lubrication:
        "Bomba de óleo acionada conforme demanda; trocador a confirmar",
    },
  },
};

export function getEngineSpecs(engine: Engine) {
  const visual = visuals.find((v) => v.id === engine.id)!;
  const reference = references[engine.id];
  const fields = Object.fromEntries(
    Object.keys(specLabels).map((key) => [
      key,
      { value: "A confirmar para código, ano e aplicação", status: "pending" },
    ]),
  ) as Record<SpecKey, SpecValue>;
  fields.configuration = {
    value: `${visual.cylinders} cilindros ${engine.layout === "V6" ? "em V" : "em linha"} (referência visual)`,
    status: "general",
  };
  const beltFamilies = new Set([
    "AP 1.6",
    "AP 1.8",
    "AP 2.0",
    "EA111",
    "Família I",
    "Família II",
    "CSS Prime",
    "K4M",
  ]);
  fields.timing =
    engine.family === "EcoBoost"
      ? {
          value: "Corrente ou correia conforme geração e código",
          status: "general",
        }
      : {
          value: `${beltFamilies.has(engine.family) ? "Correia dentada" : "Corrente"}; confirmar código e versão`,
          status: "general",
        };
  fields.fuelSystem = {
    value: "Injeção eletrônica; tipo e combustível conforme versão",
    status: "general",
  };
  if (["AP 1.6", "AP 1.8", "AP 2.0", "CHT"].includes(engine.family))
    fields.fuelSystem.value = "Carburador ou injeção, conforme ano e aplicação";
  if (["OM651", "OM654", "N57"].includes(engine.family))
    fields.fuelSystem.value = "Diesel turbo, common rail; confirmar versão";
  if (["M264", "M274", "N20", "B48", "B58"].includes(engine.family))
    fields.fuelSystem.value =
      "Gasolina turbo, injeção direta; confirmar versão";
  if (["AP 1.6", "AP 1.8", "AP 2.0"].includes(engine.family))
    fields.displacement = {
      value: `${engine.family.replace("AP ", "").replace(".", ",")} L nominal; cilindrada exata depende do código`,
      status: "general",
    };
  // General principles only: no pump type, cooler, pressure or oil grade inferred.
  fields.cooling = {
    value: "Líquido; tipo de bomba conforme a versão",
    status: "general",
  };
  fields.lubrication = {
    value: "Sob pressão; trocador de calor conforme a versão",
    status: "general",
  };
  if (reference)
    for (const [key, value] of Object.entries(reference.values))
      fields[key as SpecKey] = {
        value,
        status: "confirmed",
        source: reference.source,
      };
  return {
    application:
      reference?.application ??
      "Aplicação técnica ainda não identificada; não há valores únicos para toda a família",
    fields,
    sources: reference ? [reference.source] : [],
  };
}

export const componentDefinitions = [
  "Capa do motor (acabamento)",
  "Caixa do filtro de ar",
  "Duto de admissão",
  "Coletor de admissão",
  "Corpo de borboleta (TBI)",
  "Cabeçote (com válvulas)",
  "Junta do cabeçote",
  "Bloco do motor",
  "Pistões e anéis",
  "Bielas",
  "Virabrequim",
  "Cárter de óleo",
  "Bomba de óleo",
  "Filtro de óleo",
  "Trocador de calor do óleo",
  "Turbocompressor",
  "Coletor de escape",
  "Catalisador / pós-tratamento",
  "Intercooler",
  "Sistema de distribuição",
  "Polias e correia de acessórios",
  "Alternador / gerador",
  "Compressor do ar-condicionado",
  "Bomba d’água",
];
const variableComponents = new Set([1, 5, 15, 18, 19, 22, 23]);
const turboFamilies = new Set([
  "EA888",
  "CSS Prime",
  "GSE T200",
  "GSE T270",
  "HR10",
  "EcoBoost",
  "M264",
  "M274",
  "OM651",
  "OM654",
  "N20",
  "B48",
  "B58",
  "N57",
]);
export function getEngineComponents(engine: Engine) {
  return componentDefinitions.map((label, index) => {
    const number = index + 1;
    const notApplicable =
      (number === 16 || number === 19) && !turboFamilies.has(engine.family);
    return {
      number,
      label,
      status: notApplicable
        ? ("not-applicable" as const)
        : variableComponents.has(number)
          ? ("variable" as const)
          : ("reference" as const),
      note: notApplicable
        ? "Não se aplica à referência aspirada selecionada"
        : number === 18
          ? "GPF é específico de versões gasolina equipadas; não equivale a DPF diesel"
          : variableComponents.has(number)
            ? "Disponibilidade e tipo dependem da versão e do veículo"
            : "Componente de referência; pode não estar visível na imagem",
    };
  });
}
