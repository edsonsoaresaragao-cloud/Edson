import {
  mercedesReferenceParts,
  mercedesReferenceAssemblies,
  referenceSystems,
} from "./mercedes-reference-catalog";
import type { VisualCatalog } from "./visual-reference-catalog";

export const mercedesVisualCatalog: VisualCatalog = {
  id: "mercedes",
  name: "Mercedes-Benz",
  className: "mercedes-reference-catalog",
  title: "Mercedes-Benz, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / COMPONENTES DO MOTOR",
  description:
    "Referência educativa M264/M260: motor turbo de quatro cilindros em linha e injeção direta. Explore os componentes e os subconjuntos organizados a partir do cartaz.",
  searchTerms: "Mercedes-Benz M264 M260",
  searchPlaceholder: "Nome, número ou função: turbo, 20, óleo…",
  systemLabel: "Sistema do motor",
  assemblyLabel: "Subconjuntos",
  assemblyNoun: ["subconjunto", "subconjuntos"],
  interactiveHref: "/explodedview#engine-detail",
  interactiveLabel: "Abrir atlas de motores",
  systems: referenceSystems,
  parts: mercedesReferenceParts,
  assemblies: mercedesReferenceAssemblies,
  partArtwork: {
    src: "/images/mercedes-reference/components.webp",
    columns: 4,
    rows: 6,
    aspectRatio: 1,
  },
  assemblyArtwork: {
    src: "/images/engines/subassemblies.webp",
    columns: 3,
    rows: 2,
    aspectRatio: 1,
  },
  overview: {
    kind: "image",
    src: "/images/engines/mercedes-benz-m264.webp",
    width: 1024,
    height: 1536,
    alt: "Ilustração gerada do motor Mercedes-Benz M264 em vista explodida",
    caption: "Visão geral ilustrativa · M264",
  },
  notes: [
    "Imagens ilustrativas geradas para estudo, organizadas com base na referência visual. Não são fotografias de fabricante nem comprovam código ou compatibilidade. M264 e M260 não são tratados como motores com peças intercambiáveis.",
    "A numeração segue os 24 itens da lista principal: corrente de distribuição é 20; correia de acessórios é 21. Nos subconjuntos, termostato e radiador aparecem como contexto, além dos 24 itens.",
    "Cilindrada, potência, torque, presença de GPF, tipo de intercooler e acionamento da bomba d’água dependem da versão. Consulte os dados do fabricante e a aplicação do veículo.",
  ],
};
