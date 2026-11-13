import { kindPaths } from "../catalog";
/** Só caminhos públicos: sem parâmetros, fragmentos, contas, tokens ou códigos de certificado. */
export const staticCounterPaths = new Set([
  "/",
  "/sobre",
  "/contato",
  "/privacidade",
  "/termos",
  "/apoiar",
  "/categorias",
  "/treinamentos",
  "/certificados",
  "/busca",
  "/explodedview",
  "/academy",
  "/academy/aulas",
  "/academy/aulas/motores-que-batem-valvula",
  "/categorias/ar-condicionado/compressor",
  "/categorias/ignicao/atual",
  "/categorias/direcao-hidraulica-e-eletrica/eps",
  ...Object.values(kindPaths).map((path) => `/${path}`),
]);
export const counterSectionKinds = Object.fromEntries(
  Object.entries(kindPaths).map(([kind, path]) => [path, kind]),
);
export function counterPath(input: string | null | undefined): string | null {
  if (
    !input ||
    input.length > 240 ||
    !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?)?$/.test(input)
  )
    return null;
  const path = input.length > 1 ? input.replace(/\/$/, "") : input;
  if (staticCounterPaths.has(path)) return path;
  const segments = path.slice(1).split("/");
  if (
    segments.length === 2 &&
    (segments[0] === "categorias" ||
      segments[0] === "cursos" ||
      Object.hasOwn(counterSectionKinds, segments[0]))
  )
    return path;
  return null;
}
export type AccessCounts = { total: string; page: string };
export function validCounts(value: unknown): value is AccessCounts {
  if (!value || typeof value !== "object") return false;
  const counts = value as AccessCounts;
  return (
    typeof counts.total === "string" &&
    /^\d{1,20}$/.test(counts.total) &&
    typeof counts.page === "string" &&
    /^\d{1,20}$/.test(counts.page)
  );
}
