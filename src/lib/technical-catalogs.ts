import { compressorVisualCatalog } from "./compressor-reference-catalog";
import { frontModuleVisualCatalog } from "./front-module-reference-catalog";
import { mercedesVisualCatalog } from "./mercedes-visual-catalog";

export const technicalCatalogs = {
  compressor: compressorVisualCatalog,
  "modulo-dianteiro": frontModuleVisualCatalog,
  mercedes: mercedesVisualCatalog,
} as const;
export type TechnicalCatalogId = keyof typeof technicalCatalogs;
export const defaultTechnicalCatalog: TechnicalCatalogId = "compressor";
export function resolveTechnicalCatalogId(value?: string): TechnicalCatalogId {
  return value && Object.hasOwn(technicalCatalogs, value)
    ? (value as TechnicalCatalogId)
    : defaultTechnicalCatalog;
}
