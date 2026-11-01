export const categoryNames = [
  "Motor e componentes internos",
  "Injeção eletrônica",
  "Diagnóstico com scanner",
  "Elétrica automotiva",
  "Eletrônica e módulos",
  "Sensores e atuadores",
  "Arrefecimento",
  "Suspensão",
  "Direção hidráulica e elétrica",
  "Freios e ABS",
  "Transmissão manual",
  "Transmissão automática",
  "Câmbio CVT",
  "Embreagem",
  "Ar-condicionado",
  "Bateria",
  "Alternador",
  "Motor de partida",
  "Ignição",
  "Sistema de combustível",
  "Lubrificação",
  "Correias e correntes",
  "Escapamento",
  "Turbocompressores",
  "Motores diesel",
  "Veículos híbridos",
  "Veículos elétricos",
  "Funilaria e pintura",
  "Manutenção preventiva",
  "Diagnóstico avançado",
  "Ferramentas automotivas",
  "Gestão de oficinas",
  "Manutenção e produtividade de frotas",
  "Avaliação de veículos",
];
export const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const slugify = (v: string) =>
  normalize(v)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const CLASSIFICATION_VERSION = 2;
const rules: Record<string, string[]> = {
  "motor-e-componentes-internos": [
    "motor",
    "cabecote",
    "pistao",
    "pistoes",
    "biela",
    "virabrequim",
    "retifica",
    "compressao do motor",
  ],
  "injecao-eletronica": [
    "sensor map",
    "sonda lambda",
    "bico injetor",
    "injecao",
    "p0171",
    "p0300",
  ],
  "diagnostico-com-scanner": [
    "scanner",
    "obd",
    "obd2",
    "obdii",
    "obd-ii",
    "codigo de falha",
    "codigo de avaria",
  ],
  "eletrica-automotiva": [
    "eletrica",
    "chicote",
    "fusivel",
    "rele",
    "aterramento",
    "curto circuito",
    "curto-circuito",
  ],
  "eletronica-e-modulos": [
    "eletronica",
    "modulo",
    "ecu",
    "ecm",
    "central eletronica",
    "rede can",
    "imobilizador",
  ],
  "sensores-e-atuadores": [
    "sensor",
    "sensores",
    "atuador",
    "atuadores",
    "sonda lambda",
    "corpo de borboleta",
    "tbi",
  ],
  arrefecimento: [
    "radiador",
    "termostatica",
    "bomba de agua",
    "bomba d'agua",
    "arrefecimento",
    "superaquecimento",
    "temperatura elevada",
  ],
  suspensao: [
    "amortecedor",
    "bucha",
    "pivo",
    "suspensao",
    "bandeja",
    "bieleta",
  ],
  "direcao-hidraulica-e-eletrica": [
    "direcao",
    "caixa de direcao",
    "bomba de direcao",
    "eps",
    "alinhamento",
  ],
  "freios-e-abs": [
    "pastilha",
    "disco de freio",
    "abs",
    "freio",
    "freios",
    "fluido de freio",
  ],
  "transmissao-manual": [
    "cambio manual",
    "transmissao manual",
    "sincronizador",
    "engrenagem do cambio",
  ],
  "transmissao-automatica": [
    "dsg",
    "cambio automatico",
    "transmissao automatica",
    "cambio com trancos",
    "conversor de torque",
    "corpo de valvulas",
  ],
  "cambio-cvt": ["cvt"],
  embreagem: [
    "embreagem",
    "plato",
    "disco de embreagem",
    "atuador de embreagem",
  ],
  "ar-condicionado": [
    "ar-condicionado",
    "ar condicionado",
    "nao gela",
    "compressor do ar",
    "gas refrigerante",
  ],
  bateria: ["bateria", "nao liga", "nao pega", "carga da bateria"],
  alternador: ["alternador", "regulador de tensao"],
  "motor-de-partida": [
    "motor de partida",
    "partida",
    "nao liga",
    "nao pega",
    "arranque",
  ],
  ignicao: ["vela", "velas", "bobina", "ignicao", "falhando"],
  "sistema-de-combustivel": [
    "combustivel",
    "bomba de combustivel",
    "bomba de alta",
    "filtro de combustivel",
    "etanol",
    "gasolina",
  ],
  lubrificacao: [
    "lubrificacao",
    "pressao de oleo",
    "bomba de oleo",
    "filtro de oleo",
    "oleo do motor",
    "troca de oleo",
  ],
  "correias-e-correntes": [
    "correias",
    "correia",
    "corrente de comando",
    "corrente de distribuicao",
    "sincronismo",
    "tensor",
  ],
  escapamento: ["escapamento", "escape", "catalisador", "gpf", "dpf"],
  turbocompressores: [
    "turbocompressores",
    "turbo",
    "turbocompressor",
    "wastegate",
    "intercooler",
  ],
  "motores-diesel": ["diesel", "common rail", "common-rail"],
  "veiculos-hibridos": ["hibrido", "hibridos", "hybrid", "mhev", "phev"],
  "veiculos-eletricos": [
    "veiculo eletrico",
    "veiculos eletricos",
    "carro eletrico",
    "carros eletricos",
    "inversor de tracao",
    "alta tensao",
    "bateria de tracao",
  ],
  "funilaria-e-pintura": [
    "funilaria",
    "pintura",
    "repintura",
    "carroceria",
    "martelinho",
  ],
  "manutencao-preventiva": [
    "manutencao preventiva",
    "revisao preventiva",
    "plano de manutencao",
    "revisao periodica",
  ],
  "diagnostico-avancado": [
    "diagnostico avancado",
    "osciloscopio",
    "forma de onda",
    "transdutor",
    "teste de compressao",
  ],
  "ferramentas-automotivas": [
    "ferramenta",
    "ferramentas",
    "torquimetro",
    "multimetro",
    "elevador automotivo",
  ],
  "gestao-de-oficinas": [
    "gestao de oficina",
    "gestao de oficinas",
    "gestao da oficina",
    "administracao de oficina",
    "precificacao",
    "ordem de servico",
    "gestao financeira",
  ],
  "manutencao-e-produtividade-de-frotas": [
    "frota",
    "frotas",
    "produtividade de frotas",
  ],
  "avaliacao-de-veiculos": [
    "avaliacao de veiculos",
    "avaliacao de veiculo",
    "avaliacao do veiculo",
    "avaliacao do reparador",
    "test drive",
    "teste de rodagem",
    "inspecao veicular",
  ],
};
export function classify(text: string) {
  const n = normalize(text);
  const found = Object.entries(rules).filter(([, words]) =>
    words.some((word) => {
      const literal = normalize(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${literal}(?=$|[^a-z0-9])`).test(n);
    }),
  );
  return {
    categories: found.map(([slug]) => slug),
    confidence: found.length ? Math.min(0.9, 0.45 + found.length * 0.1) : 0,
  };
}
export function searchTerms(q: string) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (/nao (liga|pega)/.test(normalize(q)))
    words.push("partida", "bateria", "ignicao");
  if (normalize(q).includes("sonda")) words.push("lambda");
  return [...new Set(words)];
}
export const kindLabels: Record<string, string> = {
  VIDEO: "Vídeos",
  PART: "Biblioteca de peças",
  DIAGNOSIS: "Diagnóstico automotivo",
  GUIDE: "Guias de manutenção",
  ARTICLE: "Notícias e artigos",
  VEHICLE: "Marcas e modelos",
};
export const kindPaths: Record<string, string> = {
  VIDEO: "videos",
  PART: "pecas",
  DIAGNOSIS: "diagnostico",
  GUIDE: "guias",
  ARTICLE: "artigos",
  VEHICLE: "veiculos",
};
