import { suspensionParts } from "../../../src/lib/suspension-parts";
import { hvacParts } from "../../../src/lib/hvac-parts";
import { compressorParts } from "../../../src/lib/compressor-parts";
import { alternatorParts } from "../../../src/lib/alternator-parts";
import { coolingParts } from "../../../src/lib/cooling-parts";
import { absParts } from "../../../src/lib/abs-parts";
import { injectionParts } from "../../../src/lib/injection-parts";
import { ignitionParts } from "../../../src/lib/ignition-parts";
import { steeringParts } from "../../../src/lib/steering-parts";
import { epsParts } from "../../../src/lib/eps-parts";
import { copParts } from "../../../src/lib/cop-parts";
import { starterParts } from "../../../src/lib/starter-parts";
import { transmissionParts } from "../../../src/lib/manual-transmission-parts";
import { automaticParts } from "../../../src/lib/automatic-transmission-parts";

export const narrationSystems = [
  {
    id: "automatic",
    path: "/categorias/transmissao-automatica",
    parts: automaticParts,
    selector: ".automatic-transmission-explorer",
  },
  {
    id: "transmission",
    path: "/categorias/transmissao-manual",
    parts: transmissionParts,
    selector: ".manual-transmission-explorer",
  },
  {
    id: "suspension",
    path: "/categorias/suspensao",
    parts: suspensionParts,
    selector: ".suspension-system-explorer",
  },
  {
    id: "hvac",
    path: "/categorias/ar-condicionado",
    parts: hvacParts,
    selector: ".hvac-explorer",
  },
  {
    id: "compressor",
    path: "/categorias/ar-condicionado/compressor",
    parts: compressorParts,
    selector: ".compressor-explorer",
  },
  {
    id: "alternator",
    path: "/categorias/alternador",
    parts: alternatorParts,
    selector: ".alternator-explorer",
  },
  {
    id: "cooling",
    path: "/categorias/arrefecimento",
    parts: coolingParts,
    selector: ".cooling-explorer",
  },
  {
    id: "abs",
    path: "/categorias/freios-e-abs",
    parts: absParts,
    selector: ".abs-explorer",
  },
  {
    id: "injection",
    path: "/categorias/injecao-eletronica",
    parts: injectionParts,
    selector: ".injection-explorer",
  },
  {
    id: "ignition",
    path: "/categorias/ignicao",
    parts: ignitionParts,
    selector: ".ignition-explorer",
  },
  {
    id: "steering",
    path: "/categorias/direcao-hidraulica-e-eletrica",
    parts: steeringParts,
    selector: ".steering-explorer",
  },
  {
    id: "eps",
    path: "/categorias/direcao-hidraulica-e-eletrica/eps",
    parts: epsParts,
    selector: ".eps-explorer",
  },
  {
    id: "cop",
    path: "/categorias/ignicao/atual",
    parts: copParts,
    selector: ".cop-explorer",
  },
  {
    id: "starter",
    path: "/categorias/motor-de-partida",
    parts: starterParts,
    selector: ".starter-explorer",
  },
] as const;

export function narrationPath(system: (typeof narrationSystems)[number]) {
  return process.env.ALL_VOICE_PREVIEW_PREFIX
    ? `${process.env.ALL_VOICE_PREVIEW_PREFIX}/${system.id}`
    : system.path;
}
