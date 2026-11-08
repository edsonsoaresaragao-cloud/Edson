import { starterFaults, starterParts, starterStages } from "./starter-parts";
import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const starterReferenceSystems = [
  { id: "estrutura", name: "Carcaças e apoios" },
  { id: "acionamento", name: "Acionamento e engrenamento" },
  { id: "controle", name: "Solenoide e comando" },
  { id: "motor", name: "Induzido e campo" },
  { id: "contato", name: "Escovas e contato elétrico" },
] as const;
type StarterReferenceSystem = (typeof starterReferenceSystems)[number]["id"];
const systemsByPart: readonly StarterReferenceSystem[] = [
  "estrutura",
  "acionamento",
  "acionamento",
  "acionamento",
  "controle",
  "estrutura",
  "motor",
  "motor",
  "contato",
  "contato",
  "estrutura",
];
const aliasesByPart: readonly (readonly string[])[] = [
  ["tampa dianteira", "focinho", "front housing"],
  ["engrenagem", "bendix", "pinion"],
  ["roda livre", "embreagem unidirecional", "overrunning clutch"],
  ["alavanca", "forquilha", "shift fork"],
  ["automático", "chave magnética", "solenoid"],
  ["corpo", "carcaça central", "motor housing"],
  ["armadura", "rotor", "coletor segmentado", "comutador", "armature"],
  ["bobinas de campo", "eletroímã", "stator"],
  ["suporte das escovas", "guias", "brush holder"],
  ["carvões", "carvão", "cordoalhas", "carbon brushes"],
  ["apoio traseiro", "bucha traseira", "rear cover"],
];

/** Keep the image cells, functions and numbering shared with the 11-part interactive. */
export const starterReferenceParts: readonly VisualPart[] = starterParts.map(
  (item, index) => ({
    number: item.id,
    name: item.name,
    system: systemsByPart[index],
    description: item.description,
    note: `Inspeção básica: ${item.inspection}`,
    aliases: aliasesByPart[index],
    imageCell: index,
  }),
);

export const starterPartArtwork: VisualArtwork = {
  src: "/images/starter/starter-components.webp",
  columns: 4,
  rows: 3,
  aspectRatio: 1,
};
const highlight = (name: string): VisualArtwork => ({
  ...starterPartArtwork,
  caption: `Ilustração didática gerada · destaque: ${name}`,
});

export const starterReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "montado",
    name: "Motor de partida montado",
    system: "estrutura",
    imageCell: 11,
    description:
      "O arranque transforma energia elétrica da bateria em torque para movimentar o motor térmico durante a partida. A vista externa ajuda a reconhecer as carcaças e a posição do solenoide.",
    details: [
      "Carcaça dianteira e apoio do eixo",
      "Solenoide na parte superior",
      "Corpo do motor elétrico",
      "Fechamento traseiro",
    ],
    partNumbers: [1, 5, 6, 11],
  },
  {
    id: "engrenamento",
    name: "Acionamento e engrenamento",
    system: "acionamento",
    imageCell: 1,
    artwork: highlight("pinhão (Bendix)"),
    description:
      "O solenoide movimenta o garfo, que leva o pinhão até a coroa do volante. A roda livre transmite torque na partida e permite sobrevelocidade quando o motor térmico entra em funcionamento.",
    details: [
      "Pinhão (Bendix)",
      "Embreagem de roda livre",
      "Garfo de acionamento",
      "Solenoide e êmbolo",
      "Coroa do volante: contexto externo ao arranque",
    ],
    partNumbers: [2, 3, 4, 5],
  },
  {
    id: "motor-eletrico",
    name: "Induzido, campo e produção de torque",
    system: "motor",
    imageCell: 6,
    artwork: highlight("induzido (rotor)"),
    description:
      "A interação do campo do estator com a corrente no induzido produz torque. O coletor segmentado e as escovas fazem a comutação da corrente nos enrolamentos do rotor.",
    details: [
      "Carcaça do motor",
      "Induzido com eixo e núcleo laminado",
      "Enrolamentos e coletor segmentado",
      "Estator com bobinas de campo no exemplo",
      "Outras construções podem utilizar ímãs permanentes",
    ],
    partNumbers: [6, 7, 8],
  },
  {
    id: "escovas",
    name: "Escovas e apoio traseiro",
    system: "contato",
    imageCell: 8,
    artwork: highlight("porta-escovas"),
    description:
      "O porta-escovas mantém as escovas guiadas e pressionadas contra o coletor do induzido. A tampa fecha o conjunto e oferece o apoio traseiro previsto no projeto.",
    details: [
      "Porta-escovas e guias",
      "Escovas de carvão e cordoalhas",
      "Molas de pressão",
      "Coletor do induzido como superfície de contato",
      "Tampa e apoio traseiro",
    ],
    partNumbers: [7, 9, 10, 11],
  },
  {
    id: "circuito",
    name: "Comando e circuito de potência",
    system: "controle",
    imageCell: 4,
    artwork: highlight("solenoide (automático)"),
    description:
      "O circuito de comando solicita o acionamento do solenoide. Seus contatos de potência permitem a passagem da corrente da bateria ao motor de partida; a corrente retorna pelo circuito de massa previsto na aplicação.",
    details: [
      "Bateria de 12 V como referência do cartaz",
      "Comando START, relés ou módulo conforme o veículo",
      "Solenoide e contatos de potência",
      "Motor elétrico: induzido e campo",
      "Cabos e aterramentos: contexto do veículo",
    ],
    partNumbers: [5, 7, 8, 10],
  },
];

export const starterVisualCatalog: VisualCatalog = {
  id: "motor-de-partida",
  name: "Motor de partida",
  className: "starter-reference-catalog",
  title: "Motor de partida, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / ARRANQUE AUTOMOTIVO",
  description:
    "Explore as imagens das 11 peças numeradas conforme a referência enviada. Consulte nome, função, inspeção e conjuntos de funcionamento, e abra a vista explodida interativa do arranque.",
  searchTerms: "motor de partida arranque automotivo starter",
  searchPlaceholder: "Nome, número ou função: Bendix, 7, escovas…",
  systemLabel: "Sistema do arranque",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/motor-de-partida",
  interactiveLabel: "Explorar motor de partida interativo",
  systems: starterReferenceSystems,
  parts: starterReferenceParts,
  assemblies: starterReferenceAssemblies,
  partArtwork: starterPartArtwork,
  assemblyArtwork: starterPartArtwork,
  overview: {
    kind: "sprite",
    artwork: starterPartArtwork,
    cell: 11,
    alt: "Ilustração didática gerada de motor de partida montado, com pinhão, carcaças e solenoide",
    caption: "Arranque montado · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      description:
        "A sequência relaciona o comando elétrico ao avanço do pinhão, à produção de torque e ao retorno após a partida.",
      items: starterStages.map(
        (stage) => `${stage.name}: ${stage.description}`,
      ),
    },
    {
      title: "Circuito elétrico e linha de corrente",
      groups: [
        {
          name: "Comando",
          text: "A solicitação de partida chega ao solenoide por chave, botão, relés e/ou módulos, conforme o veículo. O exemplo usa um sistema de 12 V; não é uma pinagem universal.",
        },
        {
          name: "Potência",
          text: "Com os contatos fechados, a bateria alimenta o motor elétrico, que produz torque. Verifique também o retorno por massa e as quedas de tensão sob carga.",
        },
        {
          name: "Engrenamento",
          text: "O pinhão movimenta a coroa do volante. A coroa pertence ao motor térmico e não integra a lista das 11 peças do arranque.",
        },
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Os sintomas orientam a investigação e podem ter mais de uma causa.",
      groups: starterFaults.map(([name, symptom, inspection]) => ({
        name,
        text: `${symptom} ${inspection}`,
      })),
    },
    {
      title: "Testes básicos na oficina",
      items: [
        "Bateria em repouso: o cartaz cita 12,4–12,8 V para bateria de chumbo-ácido de 12 V. Tipo, temperatura, estado de carga e tempo de repouso alteram a leitura.",
        "Tensão sob carga: 9,6 V é um critério de determinados testes de bateria, nas condições especificadas. Não é um limite universal para toda partida.",
        "Consumo de corrente: 80–250 A é a faixa ilustrativa do cartaz. Motor, temperatura, óleo e projeto do arranque podem exigir valores fora dela.",
        "Solenoide e alimentação: verificar comando, movimento, contatos de potência e quedas de tensão nos cabos e aterramentos conforme o procedimento do fabricante.",
        "Escovas: comparar o comprimento e as condições de contato com o limite do modelo. Os 5 mm citados na referência são um exemplo, não uma especificação universal.",
      ],
    },
    {
      title: "Dicas de manutenção",
      items: [
        "Verificar periodicamente o estado da bateria e a integridade das conexões.",
        "Manter cabos e aterramentos limpos, firmes e de acordo com a aplicação.",
        "Inspecionar escovas, molas e coletor do induzido durante a manutenção prevista.",
        "Lubrificar apenas os pontos e mecanismos indicados, com o produto especificado; não contaminar coletor e escovas.",
        "Substituir componentes desgastados conforme a documentação do fabricante.",
      ],
    },
    {
      title: "Sinais no painel e identificação da falha",
      groups: [
        {
          name: "Bateria",
          text: "A luz de bateria normalmente se relaciona ao sistema de carga. Seu acendimento não identifica, por si só, uma falha do motor de partida.",
        },
        {
          name: "Falha na partida",
          text: "Mensagens e símbolos dependem do veículo. O ícone de motor do cartaz não é uma luz universal dedicada ao solenoide ou ao arranque.",
        },
        {
          name: "Injeção / ECU",
          text: "Alguns veículos registram falhas relacionadas à autorização ou ao controle da partida. A confirmação exige leitura dos códigos e testes da aplicação.",
        },
      ],
    },
  ],
  notes: [
    "Imagens ilustrativas geradas para identificação didática com base na referência enviada. Não são fotografias de fabricante nem confirmam código, medidas ou compatibilidade.",
    "A numeração 1 a 11 acompanha o cartaz e o interativo. As vistas de conjuntos destacam uma peça representativa, identificada na legenda, e relacionam os demais itens nos detalhes.",
    "Bendix é um nome usual do acionamento; pinhão e roda livre estão separados para estudo. O exemplo não representa todas as arquiteturas de estator, redutor e comando de partida.",
    "As posições na imagem não definem sequência de desmontagem, montagem, aperto ou reparo. Use a documentação técnica da aplicação.",
  ],
};
