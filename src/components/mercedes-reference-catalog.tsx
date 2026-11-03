"use client";
import { VisualReferenceCatalog } from "./visual-reference-catalog";
import { mercedesVisualCatalog } from "@/lib/mercedes-visual-catalog";

export function MercedesReferenceCatalog() {
  return <VisualReferenceCatalog catalog={mercedesVisualCatalog} />;
}
