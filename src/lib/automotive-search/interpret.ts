import { technicalComponents } from "../sensor-actuator-catalog";
import { technicalCatalogs } from "../technical-catalogs";
import { correctPartName, normalizePartText } from "../parts/catalog";
export const normalize = normalizePartText;
const index = [
  ...technicalComponents.map((c) => ({
    name: c.name,
    aliases: c.aliases,
    function: c.function,
    notes: c.inspection + " " + (c.note || ""),
    href: c.explore?.href || "/categorias/sensores-e-atuadores",
  })),
  ...Object.values(technicalCatalogs).flatMap((c) =>
    c.parts.map((p) => ({
      name: p.name,
      aliases: [...p.aliases],
      function: p.description,
      notes: p.note,
      href: "/artigos?catalog=" + c.id,
    })),
  ),
];
const mistakes: Record<string, string> = {
  alternado: "alternador",
  alternadro: "alternador",
  amortecedo: "amortecedor",
  embregem: "embreagem",
  termotatica: "termostática",
  bobinaignicao: "bobina de ignição",
};
const symptomTerms = [
  {
    terms: ["nao pega", "nao liga", "partida dificil"],
    name: "dificuldade de partida",
    related: [
      "motor de partida",
      "bateria",
      "sensor de rotação CKP",
      "ignição",
    ],
  },
  {
    terms: ["bateria descarrega", "luz da bateria", "nao carrega"],
    name: "sistema de carga",
    related: ["alternador", "bateria", "aterramento", "queda de tensão B+"],
  },
  {
    terms: ["superaquece", "temperatura alta", "ferve"],
    name: "arrefecimento",
    related: ["bomba d’água", "válvula termostática", "radiador"],
  },
  {
    terms: ["falhando", "engasga", "perda de potencia"],
    name: "falha de funcionamento do motor",
    related: ["bobina de ignição", "velas", "sensor MAP", "injeção"],
  },
];
export function interpretQuery(original: string) {
  let corrected = correctPartName(original).replace(/\s+/g, " ").trim();
  for (const [bad, good] of Object.entries(mistakes))
    corrected = corrected.replace(new RegExp(`\\b${bad}\\b`, "gi"), good);
  const text = normalize(corrected);
  const coded = /\b[PCBU][0-9A-F][0-9A-F]{3}\b/i.test(corrected);
  const symptom = symptomTerms.find((s) =>
    s.terms.some((t) => text.includes(t)),
  );
  const scored = index
    .map((item) => {
      const keys = [item.name, ...item.aliases]
        .map(normalize)
        .filter((k) => k.length >= 3);
      const hits = keys.filter((k) =>
        new RegExp(
          `(?:^| )${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`,
        ).test(text),
      );
      return {
        item,
        score: hits.length ? Math.max(...hits.map((k) => k.length)) : 0,
      };
    })
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score);
  const found = scored[0]?.item;
  return {
    original,
    corrected,
    name: found?.name || symptom?.name || null,
    aliases: found?.aliases || [],
    intent: coded ? "code" : symptom ? "symptom" : found ? "part" : "general",
    suggestions: [
      ...new Set([
        ...(symptom?.related || []),
        ...scored.slice(0, 6).map((s) => s.item.name),
        ...(found
          ? [found.name + " diagnóstico", found.name + " funcionamento"]
          : []),
      ]),
    ].slice(0, 6),
  } as const;
}
export function suggest(query: string) {
  if (query.trim().length < 2) return [];
  const words = normalize(correctPartName(query)).split(" ").filter(Boolean);
  return [
    ...new Set(
      index
        .filter((c) =>
          words.every((w) =>
            normalize(c.name + " " + c.aliases.join(" ")).includes(w),
          ),
        )
        .map((c) => c.name),
    ),
  ].slice(0, 7);
}
export function localReferences(query: string) {
  const interpreted = interpretQuery(query);
  return index.filter((c) => interpreted.name === c.name).slice(0, 3);
}
