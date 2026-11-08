export type VisualPart = {
  /** Context identifiers (for example flow arrows) are not replacement parts. */
  kind?: "context";
  number: number;
  name: string;
  system: string;
  description: string;
  note: string;
  aliases: readonly string[];
  imageCell: number;
};
export type VisualAssembly = {
  artwork?: VisualArtwork;
  id: string;
  name: string;
  system: string;
  description: string;
  details: readonly string[];
  partNumbers: readonly number[];
  imageCell: number;
};
export type VisualArtwork = {
  caption?: string;
  src: string;
  columns: number;
  rows: number;
  aspectRatio: number;
  /** Normalized row boundaries when the source atlas has unequal rows. */
  rowBounds?: readonly number[];
};
export type VisualOverview = {
  alt: string;
  caption: string;
} & (
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "sprite"; artwork: VisualArtwork; cell: number }
);
export type VisualCatalog = {
  id: string;
  name: string;
  className: string;
  title: string;
  eyebrow: string;
  description: string;
  searchTerms: string;
  searchPlaceholder: string;
  systemLabel: string;
  assemblyLabel: string;
  assemblyNoun: [string, string];
  partLabels?: {
    tab: string;
    singular: string;
    plural: string;
    feminine?: boolean;
  };
  interactiveHref: string;
  interactiveLabel: string;
  systems: readonly { id: string; name: string }[];
  parts: readonly VisualPart[];
  assemblies: readonly VisualAssembly[];
  partArtwork: VisualArtwork;
  assemblyArtwork: VisualArtwork;
  overview: VisualOverview;
  notes: readonly string[];
  sections?: readonly {
    title: string;
    description?: string;
    items?: readonly string[];
    groups?: readonly { name: string; text: string }[];
  }[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function visualSystemName(catalog: VisualCatalog, id: string) {
  return catalog.systems.find((item) => item.id === id)?.name || id;
}
export function filterVisualParts(
  catalog: VisualCatalog,
  query = "",
  system = "all",
  order: "number" | "name" = "number",
) {
  const normalized = normalize(query),
    words = normalized.split(" ").filter(Boolean);
  return catalog.parts
    .filter((item) => {
      if (system !== "all" && item.system !== system) return false;
      if (/^\d{1,2}$/.test(normalized))
        return item.number === Number(normalized);
      const text = normalize(
        [
          item.number,
          catalog.searchTerms,
          item.name,
          item.description,
          item.note,
          visualSystemName(catalog, item.system),
          ...item.aliases,
        ].join(" "),
      );
      return words.every((word) => text.includes(word));
    })
    .sort((a, b) =>
      order === "number"
        ? a.number - b.number
        : a.name.localeCompare(b.name, "pt-BR"),
    );
}
export function filterVisualAssemblies(
  catalog: VisualCatalog,
  query = "",
  system = "all",
) {
  const normalized = normalize(query),
    words = normalized.split(" ").filter(Boolean);
  return catalog.assemblies.filter((item) => {
    if (system !== "all" && item.system !== system) return false;
    if (/^\d{1,2}$/.test(normalized))
      return item.partNumbers.includes(Number(normalized));
    const text = normalize(
      [
        catalog.searchTerms,
        item.name,
        item.description,
        visualSystemName(catalog, item.system),
        ...item.details,
        ...item.partNumbers,
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}
export function visualArtworkStyle(artwork: VisualArtwork, cell: number) {
  const row = Math.floor(cell / artwork.columns),
    column = cell % artwork.columns;
  const top = artwork.rowBounds?.[row] ?? row / artwork.rows;
  const bottom = artwork.rowBounds?.[row + 1] ?? (row + 1) / artwork.rows;
  const height = bottom - top;
  return {
    backgroundImage: `url('${artwork.src}')`,
    backgroundSize: `${artwork.columns * 100}% ${100 / height}%`,
    backgroundPosition: `${artwork.columns === 1 ? 0 : (column / (artwork.columns - 1)) * 100}% ${height === 1 ? 0 : (top / (1 - height)) * 100}%`,
    // Preserve the source proportions even when atlas rows have unequal heights.
    aspectRatio: artwork.aspectRatio / (height * artwork.rows),
  };
}
