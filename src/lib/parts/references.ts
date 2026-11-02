import {
  technicalComponents,
  type TechnicalComponent,
} from "../sensor-actuator-catalog";
import { correctPartName, normalizePartText, type PartsQuery } from "./catalog";

/** Technical references are never returned as live merchant offers. */
export function matchingPartReferences(q: PartsQuery): TechnicalComponent[] {
  const name = normalizePartText(correctPartName(q.q));
  const words = name
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        ![
          "de",
          "do",
          "da",
          "dos",
          "das",
          "para",
          "com",
          "comprar",
          "peca",
        ].includes(word),
    );
  const code = normalizePartText(q.code).replace(/ /g, "");
  if (!words.length && code.length < 3) return [];
  // An unspecified generic "sensor" or "atuador" must not suggest a random part.
  if (
    words.length === 1 &&
    ["sensor", "sensores", "atuador", "atuadores"].includes(words[0])
  )
    return [];
  return technicalComponents
    .filter((item) => {
      const description = normalizePartText(
        [item.name, ...item.aliases, item.function].join(" "),
      );
      if (words.length)
        return words.every((word) => description.includes(word));
      return normalizePartText(item.photo?.title || "")
        .replace(/ /g, "")
        .includes(code);
    })
    .slice(0, 3);
}
