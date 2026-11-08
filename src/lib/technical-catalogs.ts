import { alternatorVisualCatalog } from "./alternator-reference-catalog";
import { coolingVisualCatalog } from "./cooling-reference-catalog";
import { compressorVisualCatalog } from "./compressor-reference-catalog";
import { frontModuleVisualCatalog } from "./front-module-reference-catalog";
import { mercedesVisualCatalog } from "./mercedes-visual-catalog";
import { hvacVisualCatalog } from "./hvac-reference-catalog";
import { starterVisualCatalog } from "./starter-reference-catalog";
import { manualTransmissionVisualCatalog } from "./manual-transmission-reference-catalog";

export const technicalCatalogs = {
  hvac: hvacVisualCatalog,
  arrefecimento: coolingVisualCatalog,
  alternador: alternatorVisualCatalog,
  "motor-de-partida": starterVisualCatalog,
  "transmissao-manual": manualTransmissionVisualCatalog,
  compressor: compressorVisualCatalog,
  "modulo-dianteiro": frontModuleVisualCatalog,
  mercedes: mercedesVisualCatalog,
} as const;
export type TechnicalCatalogId = keyof typeof technicalCatalogs;
export const defaultTechnicalCatalog: TechnicalCatalogId = "hvac";
export function resolveTechnicalCatalogId(value?: string): TechnicalCatalogId {
  return value && Object.hasOwn(technicalCatalogs, value)
    ? (value as TechnicalCatalogId)
    : defaultTechnicalCatalog;
}
