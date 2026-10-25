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
const rules: Record<string, string[]> = {
  "injecao-eletronica": [
    "sensor map",
    "sonda lambda",
    "bico injetor",
    "injecao",
    "p0171",
    "p0300",
  ],
  "freios-e-abs": ["pastilha", "disco de freio", "abs", "freio"],
  suspensao: ["amortecedor", "bucha", "pivo", "suspensao"],
  arrefecimento: [
    "radiador",
    "termostatica",
    "bomba d'agua",
    "temperatura elevada",
    "superaquecimento",
  ],
  "transmissao-automatica": ["dsg", "cambio automatico", "cambio com trancos"],
  "cambio-cvt": ["cvt"],
  bateria: ["bateria", "nao liga", "nao pega"],
  "motor-de-partida": ["partida", "nao liga", "nao pega"],
  ignicao: ["vela", "bobina", "ignicao", "falhando"],
  "ar-condicionado": ["ar-condicionado", "nao gela"],
  "motores-diesel": ["diesel"],
  "gestao-de-oficinas": ["gestao", "oficina"],
  "manutencao-e-produtividade-de-frotas": ["frota"],
};
export function classify(text: string) {
  const n = normalize(text);
  const found = Object.entries(rules).filter(([, words]) =>
    words.some((w) => n.includes(normalize(w))),
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
