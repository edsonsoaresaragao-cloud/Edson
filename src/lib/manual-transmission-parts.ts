import {
  manualTransmissionParts,
  manualTransmissionAssemblies,
} from "./manual-transmission-reference-catalog";

export type TransmissionGear = "N" | "1" | "2" | "3" | "4" | "5" | "R";
export type TransmissionState = {
  selected: number;
  gear: TransmissionGear;
  clutchEngaged: boolean;
  explosion: number;
  cutaway: boolean;
  isolate: boolean;
  speed: number;
};

export const transmissionParts = [
  ...manualTransmissionParts.map((part) => ({ ...part, id: part.number })),
  ...[
    {
      id: 14,
      assembly: "embreagem",
      name: "Embreagem (contexto)",
      imageCell: 16,
    },
    {
      id: 15,
      assembly: "alavanca",
      name: "Alavanca (contexto)",
      imageCell: 17,
    },
    {
      id: 16,
      assembly: "pedais",
      name: "Pedais do veículo (contexto)",
      imageCell: 18,
    },
  ].map((context) => {
    const assembly = manualTransmissionAssemblies.find(
      (item) => item.id === context.assembly,
    )!;
    return {
      id: context.id,
      number: context.id,
      name: context.name,
      description: assembly.description,
      note: "Conjunto associado à transmissão, apresentado como contexto. Não altera a numeração 1–13 das peças da caixa.",
      imageCell: context.imageCell,
      kind: "context" as const,
      aliases: [],
      system: "contexto",
    };
  }),
];

export const initialTransmissionState: TransmissionState = {
  selected: 6,
  gear: "1",
  clutchEngaged: true,
  explosion: 0,
  cutaway: true,
  isolate: false,
  speed: 0.7,
};

/** Same module and centre distance for every forward constant-mesh gear pair. */
export const transmissionGearPairs = [
  {
    gear: "1",
    counterTeeth: 18,
    outputTeeth: 42,
    x: 1.05,
    sync: 1,
    shift: 0.13,
  },
  {
    gear: "2",
    counterTeeth: 25,
    outputTeeth: 35,
    x: 0.25,
    sync: 1,
    shift: -0.13,
  },
  {
    gear: "3",
    counterTeeth: 31,
    outputTeeth: 29,
    x: -0.6,
    sync: 0,
    shift: 0.13,
  },
  {
    gear: "5",
    counterTeeth: 39,
    outputTeeth: 21,
    x: 1.95,
    sync: 2,
    shift: -0.08,
  },
] as const;
export const transmissionGears: readonly TransmissionGear[] = [
  "N",
  "1",
  "2",
  "3",
  "4",
  "5",
  "R",
];
export const transmissionModule = (2 * 1.16) / 60;
export const transmissionAxisDistance = 1.16;
export function transmissionRatio(gear: TransmissionGear): number | null {
  if (gear === "N") return null;
  if (gear === "4") return 1;
  if (gear === "R") return -3;
  const pair = transmissionGearPairs.find((item) => item.gear === gear)!;
  return (36 / 24) * (pair.outputTeeth / pair.counterTeeth);
}
export function transmissionKinematics(state: TransmissionState) {
  const speed = Number.isFinite(state.speed)
    ? Math.max(0, Math.min(2, state.speed))
    : 0;
  const engine = speed * 2;
  const input = state.clutchEngaged ? engine : 0;
  const ratio = transmissionRatio(state.gear);
  return {
    engine,
    input,
    counter: (-input * 24) / 36,
    output: ratio === null ? 0 : input / ratio,
    ratio,
    coupled: state.clutchEngaged && ratio !== null,
  };
}
export function transmissionSliderTargets(gear: TransmissionGear): number[] {
  const targets = [0, 0, 0];
  if (gear === "4") targets[0] = -0.13;
  const pair = transmissionGearPairs.find((item) => item.gear === gear);
  if (pair) targets[pair.sync] = pair.shift;
  return targets;
}
export function transmissionGearLabel(gear: TransmissionGear) {
  return gear === "N" ? "Neutro" : gear === "R" ? "Ré" : `${gear}ª marcha`;
}
export function transmissionPowerPath(state: TransmissionState) {
  if (!state.clutchEngaged)
    return "Embreagem desacoplada: o motor não aciona a entrada da caixa neste modelo.";
  if (state.gear === "N")
    return "Neutro: entrada e contraeixo giram; as engrenagens ficam livres e a saída não é acionada.";
  if (state.gear === "4")
    return "Marcha direta: entrada → luva de engate → saída, com relação 1:1 neste exemplo.";
  if (state.gear === "R")
    return "Ré: entrada → contraeixo → engrenagem intermediária de ré → saída em sentido inverso.";
  return "Entrada → contraeixo → par de engrenagens selecionado → sincronizador e luva → saída.";
}
