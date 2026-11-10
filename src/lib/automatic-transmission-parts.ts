import { automaticTransmissionParts } from "./automatic-transmission-reference-catalog";

export const automaticParts = automaticTransmissionParts.map((part) => ({
  ...part,
  id: part.number,
}));
export type AutomaticRange = "P" | "R" | "N" | "D";
export type AutomaticGear = 1 | 2 | 3 | 4 | 5;
export type AutomaticState = {
  selected: number;
  range: AutomaticRange;
  gear: AutomaticGear;
  lockup: boolean;
  speed: number;
  explosion: number;
  cutaway: boolean;
  isolate: boolean;
};
export const initialAutomaticState: AutomaticState = {
  selected: 1,
  range: "D",
  gear: 1,
  lockup: false,
  speed: 0.7,
  explosion: 0,
  cutaway: true,
  isolate: false,
};
export const planetaryTeeth = {
  sun: 24,
  planet: 18,
  ring: 60,
  module: 0.028,
} as const;
export type PlanetaryMode =
  "reduction" | "ring-drive" | "direct" | "overdrive" | "reverse" | "neutral";

/** Willis equation: Ns * sun + Nr * ring = (Ns + Nr) * carrier. */
export function planetaryRates(input: number, mode: PlanetaryMode) {
  const { sun: s, ring: r, planet: p } = planetaryTeeth;
  let sun = 0,
    ring = 0,
    carrier = 0,
    output = 0;
  switch (mode) {
    case "reduction":
      sun = input;
      carrier = (s * input) / (s + r);
      output = carrier;
      break;
    case "ring-drive":
      ring = input;
      carrier = (r * input) / (s + r);
      output = carrier;
      break;
    case "direct":
      sun = ring = carrier = output = input;
      break;
    case "overdrive":
      carrier = input;
      ring = ((s + r) * input) / r;
      output = ring;
      break;
    case "reverse":
      sun = input;
      ring = (-s * input) / r;
      output = ring;
      break;
  }
  return {
    sun,
    ring,
    carrier,
    planet: carrier - (s / p) * (sun - carrier),
    output,
    mode,
  };
}
export function automaticModes(
  range: AutomaticRange,
  gear: AutomaticGear,
): readonly PlanetaryMode[] {
  if (range === "P" || range === "N") return ["neutral", "neutral", "neutral"];
  if (range === "R") return ["reverse", "direct", "direct"];
  switch (gear) {
    case 1:
      return ["reduction", "direct", "direct"];
    case 2:
      return ["ring-drive", "ring-drive", "direct"];
    case 3:
      return ["ring-drive", "direct", "direct"];
    case 4:
      return ["direct", "direct", "direct"];
    case 5:
      return ["direct", "direct", "overdrive"];
  }
}
export function automaticRatio(
  range: AutomaticRange,
  gear: AutomaticGear,
): number | null {
  if (range === "P" || range === "N") return null;
  let speed = 1;
  for (const mode of automaticModes(range, gear))
    speed = planetaryRates(speed, mode).output;
  return 1 / speed;
}
export function automaticKinematics(state: AutomaticState) {
  const speed = Number.isFinite(state.speed)
    ? Math.max(0, Math.min(1.5, state.speed))
    : 0;
  const engine = speed * 2;
  const driving = state.range === "D" || state.range === "R";
  const locked = state.range === "D" && state.lockup;
  const turbine = engine * (locked ? 1 : 0.82);
  let input = driving ? turbine : 0;
  const stages = automaticModes(state.range, state.gear).map((mode) => {
    const rates = planetaryRates(input, mode);
    input = rates.output;
    return rates;
  });
  return {
    engine,
    impeller: engine,
    turbine,
    pump: engine,
    input: driving ? turbine : 0,
    output: input,
    stages,
    driving,
    locked,
    ratio: automaticRatio(state.range, state.gear),
  };
}
export function automaticRangeLabel(range: AutomaticRange) {
  return { P: "Estacionamento", R: "Ré", N: "Neutro", D: "Avanço" }[range];
}
export function automaticPowerPath(state: AutomaticState) {
  if (state.range === "P")
    return "P: a trava de estacionamento bloqueia a saída. A bomba de óleo e o conversor continuam girando; os acoplamentos de tração estão liberados neste exemplo.";
  if (state.range === "N")
    return "N: os acoplamentos de tração estão liberados. A saída não recebe torque do motor e fica livre para movimento externo; o exemplo a mostra parada.";
  if (state.range === "R")
    return "R: o primeiro porta-satélites fica retido. A solar aciona a coroa em sentido inverso, e os demais estágios conduzem a ré à saída.";
  return `D · ${state.gear}ª: ${state.lockup ? "lock-up une motor e turbina" : "o ATF transfere movimento da impulsora à turbina"}. Os estágios planetários estabelecem a relação e acionam a saída para a frente.`;
}
