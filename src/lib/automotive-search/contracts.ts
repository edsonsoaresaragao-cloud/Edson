import { z } from "zod";
export const searchSchema = z
  .object({
    q: z.string().trim().min(2).max(250),
    brand: z.string().trim().max(60).default(""),
    model: z.string().trim().max(150).default(""),
    year: z
      .string()
      .regex(/^$|^(19|20)\d{2}$|^2100$/)
      .default(""),
    engine: z.string().trim().max(160).default(""),
    code: z.string().trim().max(60).default(""),
    source: z
      .enum([
        "all",
        "bosch",
        "ngk",
        "delphi",
        "denso",
        "continental",
        "mahle",
        "gates",
        "oficina",
      ])
      .default("all"),
  })
  .strict();
export type SearchInput = z.infer<typeof searchSchema>;
export const sourceHosts: Record<string, string[]> = {
  bosch: ["boschaftermarket.com", "bosch-mobility.com", "bosch.com"],
  ngk: ["ngkntk.com", "ngkntk.com.br", "ngksparkplugs.com"],
  delphi: ["delphiautoparts.com"],
  denso: ["denso-am.eu", "denso.com"],
  continental: ["continental.com", "continental-aftermarket.com"],
  mahle: ["mahle.com", "mahle-aftermarket.com"],
  gates: ["gates.com"],
  oficina: ["oficinabrasil.com.br"],
};
export type SearchSource = {
  id: string;
  title: string;
  url: string;
  host: string;
  snippet: string;
  provider: string;
  kind: "web" | "video" | "manual" | "diagram" | "diagnosis" | "code";
  image: string | null;
  imagePage: string | null;
  published: string | null;
  channel?: string | null;
  embeddable?: boolean;
  score: number;
};
export type MediaResult = {
  id: string;
  title: string;
  url: string;
  image: string;
  page: string;
  provider: string;
};
export const factCategories = [
  "identification",
  "function",
  "technical",
  "application",
  "diagnosis",
  "codes",
  "repair",
  "safety",
  "divergence",
  "tools",
  "tests",
  "decision",
  "symptoms",
  "location",
] as const;
export const answerSchema = z
  .object({
    summary: z.string().max(1600),
    facts: z
      .array(
        z
          .object({
            category: z.enum(factCategories),
            text: z.string().min(5).max(1800),
            sourceIds: z.array(z.string().max(40)).min(1).max(6),
            status: z.enum(["general", "hypothesis", "unconfirmed"]),
          })
          .strict(),
      )
      .max(24),
    missing: z.array(z.string().max(300)).max(8),
    related: z.array(z.string().min(2).max(120)).max(6),
  })
  .strict();
export type TechnicalAnswer = z.infer<typeof answerSchema>;
export type SearchResponse = {
  version: 1;
  localReferences: {
    name: string;
    function: string;
    notes: string;
    href: string;
  }[];
  query: SearchInput;
  interpreted: {
    original: string;
    corrected: string;
    name: string | null;
    aliases: string[];
    intent: "part" | "symptom" | "code" | "general";
    suggestions: string[];
  };
  status: "ready" | "partial" | "empty" | "not_configured" | "unavailable";
  sources: SearchSource[];
  images: MediaResult[];
  answer: TechnicalAnswer | null;
  ai: "ready" | "not_configured" | "unavailable" | "no_evidence";
  providers: {
    id: string;
    state: "ok" | "limited" | "unavailable" | "not_configured";
  }[];
  queriedAt: string;
  cached: boolean;
  storage: "database" | "memory" | "unavailable";
};
export const emptyInput: SearchInput = {
  q: "",
  brand: "",
  model: "",
  year: "",
  engine: "",
  code: "",
  source: "all",
};
