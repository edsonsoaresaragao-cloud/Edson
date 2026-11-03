import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const alternatorReferenceSystems = [
  { id: "acionamento", name: "Polia e ventilação" },
  { id: "mecanica", name: "Carcaças, apoios e fixação" },
  { id: "geracao", name: "Rotor e estator" },
  { id: "controle", name: "Excitação e regulação" },
  { id: "retificacao", name: "Retificação e conexões" },
] as const;
type AlternatorReferenceSystem =
  (typeof alternatorReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: AlternatorReferenceSystem,
  description: string,
  note: string,
  aliases: string[] = [],
): VisualPart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
});

/** Same 1–16 numbering as the user's chart and the existing alternator interactive. */
export const alternatorReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Polia",
    "acionamento",
    "Recebe a rotação da correia do motor e transmite movimento ao eixo do rotor.",
    "Verifique aperto, trincas, canais e alinhamento conforme o fabricante. A referência mostra uma polia rígida; polias de roda livre ou desacopladoras exigem identificação própria.",
    ["pulley", "polia multicanal"],
  ),
  part(
    2,
    "Ventoinha / arruela frontal",
    "acionamento",
    "A ventoinha movimenta o ar para refrigerar o alternador. A arruela de apoio, quando prevista, participa da montagem da polia.",
    "Ventoinha e arruela têm funções diferentes. O cartaz as agrupa no item 2; a posição das ventoinhas, sua integração ao rotor e as peças de apoio dependem do projeto.",
    ["ventilador", "hélice", "fan"],
  ),
  part(
    3,
    "Rolamento dianteiro",
    "mecanica",
    "Apoia o eixo na carcaça dianteira e permite a rotação do rotor com baixo atrito.",
    "Inspecione ruído, folga e travamento pelo procedimento específico. Dimensões, vedação e método de fixação são próprios da aplicação.",
    ["mancal dianteiro", "front bearing"],
  ),
  part(
    4,
    "Carcaça dianteira",
    "mecanica",
    "Aloja o rolamento dianteiro, sustenta o eixo e oferece pontos de fixação do alternador.",
    "A peça ilustrada é de alumínio ventilado. Verifique trincas, alojamentos e fixações sem inferir medidas ou torque pela imagem.",
    ["tampa dianteira", "front housing"],
  ),
  part(
    5,
    "Rotor",
    "geracao",
    "Conjunto girante com bobina de campo e polos em garra. A corrente de excitação produz o campo magnético usado na geração.",
    "O exemplo tem anéis coletores contínuos que recebem corrente pelas escovas. Não são um comutador segmentado de motor de partida; outras arquiteturas de geração podem ser diferentes.",
    ["bobina de campo", "polos em garra", "claw pole"],
  ),
  part(
    6,
    "Estator",
    "geracao",
    "Conjunto fixo de núcleo laminado e enrolamentos onde o campo variável do rotor induz tensão alternada.",
    "Inspecione bobinas, isolamento e sinais de aquecimento conforme o manual. A configuração de fases, ligações e construção depende do alternador.",
    ["bobinas fixas", "enrolamentos", "stator"],
  ),
  part(
    7,
    "Regulador de tensão",
    "controle",
    "Controla a corrente de excitação do rotor para regular a saída elétrica conforme a estratégia do sistema.",
    "O cartaz cita aproximadamente 13,8–14,5 V como exemplo. Não é uma faixa universal: temperatura, estado da bateria e carga inteligente alteram os valores previstos. Consulte os dados do veículo.",
    ["regulação", "voltage regulator"],
  ),
  part(
    8,
    "Porta-escovas",
    "controle",
    "Sustenta e guia as escovas, que mantêm contato com os anéis coletores para alimentar a bobina do rotor.",
    "Escovas curtas ou desgastadas podem causar mau contato e interrupção da carga. Porta-escovas e regulador podem formar uma unidade; as imagens separadas são didáticas.",
    ["brush holder", "carvões", "escovas de carvão"],
  ),
  part(
    9,
    "Ponte retificadora",
    "retificacao",
    "Utiliza diodos para retificar a corrente alternada gerada no estator, alimentando o circuito de corrente contínua.",
    "Verifique diodos em curto, abertos ou com fuga conforme o método de teste. Defeitos podem causar baixa carga, ondulação excessiva e aquecimento.",
    ["diodos", "retificador", "rectifier", "ripple"],
  ),
  part(
    10,
    "Rolamento traseiro",
    "mecanica",
    "Apoia o eixo na região traseira, contribuindo para o alinhamento e a rotação do rotor.",
    "É diferente do apoio dianteiro do item 3. Tamanho, vedação e montagem precisam corresponder ao projeto, mesmo quando as peças têm aparência semelhante.",
    ["mancal traseiro", "rear bearing"],
  ),
  part(
    11,
    "Carcaça traseira",
    "mecanica",
    "Sustenta a região traseira e os componentes elétricos, com apoios e aberturas de ventilação.",
    "A integração dos suportes e da dissipação de calor varia. Inspecione alojamentos, fixações e passagens de ar conforme a aplicação.",
    ["tampa traseira de alumínio", "rear housing"],
  ),
  part(
    12,
    "Terminais / conector",
    "retificacao",
    "Ligam a saída de potência e os sinais elétricos do alternador à bateria e ao sistema do veículo.",
    "O borne B+ é uma saída de potência comum. S, L, DFM, COM/LIN e outras identificações dependem da aplicação; não estabelecem pinagem ou protocolo universal. Verifique oxidação, contato e chicote.",
    ["borne", "terminal positivo", "plugue", "fiação"],
  ),
  part(
    13,
    "Parafusos passantes",
    "mecanica",
    "Unem as carcaças e mantêm o conjunto do alternador montado nos pontos previstos no projeto.",
    "Comprimento, classe, torque e ordem de aperto dependem do fabricante. A posição das peças no cartaz não define uma sequência de montagem.",
    ["tirantes", "fixadores", "through bolts"],
  ),
  part(
    14,
    "Tampa / protetor traseiro",
    "mecanica",
    "Protege retificador, regulador e conexões contra sujeira e contato acidental, preservando a ventilação.",
    "É uma proteção diferente da carcaça traseira do item 11. Verifique integridade, fixações e passagens de ar sem obstruí-las.",
    ["capa plástica", "rear cover", "proteção"],
  ),
  part(
    15,
    "Porca da polia",
    "acionamento",
    "Fixa a polia ao eixo do rotor conforme o sistema de retenção utilizado pelo alternador.",
    "Torque, ferramenta e procedimento precisam ser confirmados. Não substitua a identificação do sistema de polia por uma avaliação apenas visual.",
    ["porca de fixação", "pulley nut"],
  ),
  part(
    16,
    "Espaçadores / isoladores",
    "mecanica",
    "Mantêm posicionamento e afastamento entre componentes; os elementos isolantes separam eletricamente as partes previstas no projeto.",
    "Espaçadores metálicos e buchas isolantes têm funções distintas. Material, dimensões, posição e isolamento dependem do conjunto e não podem ser confirmados pela cor.",
    ["buchas isolantes", "anéis de apoio", "arruelas", "spacers"],
  ),
];

export const alternatorReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "frente",
    name: "Acionamento e apoio dianteiro",
    system: "acionamento",
    imageCell: 0,
    description:
      "Polia, ventoinha, rolamento e carcaça dianteira apresentados separadamente para identificação.",
    details: [
      "Polia e porca",
      "Ventoinha frontal",
      "Rolamento dianteiro",
      "Carcaça dianteira",
    ],
    partNumbers: [1, 2, 3, 4, 15],
  },
  {
    id: "geracao",
    name: "Rotor e estator em detalhe",
    system: "geracao",
    imageCell: 1,
    description:
      "O rotor em garra e os enrolamentos fixos do estator organizados para distinguir suas funções.",
    details: [
      "Rotor com bobina de campo",
      "Polos em garra",
      "Anéis coletores do rotor",
      "Núcleo e enrolamentos do estator",
    ],
    partNumbers: [5, 6],
  },
  {
    id: "controle",
    name: "Regulação e contato das escovas",
    system: "controle",
    imageCell: 2,
    description:
      "Regulador e porta-escovas, com anéis coletores como contexto da alimentação do campo.",
    details: [
      "Regulador de tensão",
      "Porta-escovas e escovas",
      "Anéis coletores (parte do rotor)",
      "Conector de sinais",
    ],
    partNumbers: [5, 7, 8, 12],
  },
  {
    id: "traseira",
    name: "Retificação e conjunto traseiro",
    system: "retificacao",
    imageCell: 3,
    description:
      "Ponte de diodos, apoio e proteção traseira organizados com seus elementos de fixação e isolamento.",
    details: [
      "Carcaça e rolamento traseiros",
      "Ponte retificadora e terminal",
      "Protetor traseiro",
      "Parafusos, espaçadores e isoladores",
    ],
    partNumbers: [9, 10, 11, 12, 13, 14, 16],
  },
  {
    id: "funcionamento",
    name: "Geração e retificação em corte",
    system: "geracao",
    imageCell: 4,
    description:
      "Vista de contexto do campo do rotor, geração alternada no estator e saída retificada para o veículo.",
    details: [
      "Rotor girante e estator fixo",
      "Setas coloridas: fases CA até o retificador",
      "Seta dourada: saída CC",
      "Indicações didáticas, sem leitura real de corrente ou tensão",
    ],
    partNumbers: [1, 5, 6, 7, 8, 9, 12],
  },
];
export const alternatorPartArtwork: VisualArtwork = {
  src: "/images/alternator-reference/components.webp",
  columns: 4,
  rows: 4,
  aspectRatio: 4 / 3,
  rowBounds: [0, 301 / 1086, 569 / 1086, 816 / 1086, 1],
};
export const alternatorAssemblyArtwork: VisualArtwork = {
  src: "/images/alternator-reference/assemblies.webp",
  columns: 3,
  rows: 2,
  aspectRatio: 1,
  rowBounds: [0, 496 / 1024, 1],
};
export const alternatorVisualCatalog: VisualCatalog = {
  id: "alternador",
  name: "Alternador automotivo",
  className: "alternator-reference-catalog",
  title: "Alternador, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / GERAÇÃO ELÉTRICA",
  description:
    "Explore os 16 componentes numerados conforme o cartaz, do acionamento pela correia à geração e retificação da energia elétrica. Consulte as funções, os conjuntos e os pontos de inspeção.",
  searchTerms: "alternador automotivo",
  searchPlaceholder: "Nome, número ou função: rotor, 9, diodos…",
  systemLabel: "Sistema do alternador",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/alternador",
  interactiveLabel: "Explorar alternador interativo",
  systems: alternatorReferenceSystems,
  parts: alternatorReferenceParts,
  assemblies: alternatorReferenceAssemblies,
  partArtwork: alternatorPartArtwork,
  assemblyArtwork: alternatorAssemblyArtwork,
  overview: {
    kind: "sprite",
    artwork: alternatorAssemblyArtwork,
    cell: 5,
    alt: "Ilustração didática gerada de alternador automotivo montado, com polia e carcaças ventiladas",
    caption: "Alternador montado · referência ilustrativa",
  },
  sections: [
    {
      title: "Como funciona",
      description:
        "O alternador converte energia mecânica do motor em energia elétrica para carregar a bateria e alimentar os consumidores do veículo.",
      items: [
        "A polia recebe a rotação do motor pela correia e movimenta o rotor.",
        "A corrente de excitação, conduzida pelas escovas e anéis coletores, cria o campo magnético do rotor.",
        "Ao girar, o campo variável induz tensão e corrente alternadas (CA) nos enrolamentos do estator.",
        "A ponte retificadora utiliza diodos para converter a saída CA em corrente contínua (CC).",
        "O regulador controla a excitação conforme a estratégia de carga do veículo.",
        "A saída CC contribui para carregar a bateria e alimentar ignição, iluminação, módulos e outros consumidores.",
      ],
    },
    {
      title: "Pontos de atenção",
      items: [
        "Rolamentos: verificar ruído, folga e travamento; desgaste pode provocar vibração e aquecimento.",
        "Escovas: inspecionar desgaste e contato com os anéis coletores; mau contato pode interromper a carga.",
        "Regulador: avaliar funcionamento e tensão nas condições previstas pelo fabricante; falhas podem causar carga insuficiente ou excessiva.",
        "Ponte retificadora: verificar diodos em curto, abertos ou com fuga; observar baixa carga, ondulação e aquecimento.",
        "Polia: conferir aperto, folga, trincas e canais; defeitos podem gerar ruído, vibração e desgaste da correia.",
        "Conectores: inspecionar terminais e chicote quanto a oxidação, folga e mau contato; conexões ruins podem causar falhas de carga ou comunicação.",
        "Superaquecimento: investigar cheiro de queimado, escurecimento do verniz das bobinas ou carcaça excessivamente quente; avaliar sobrecarga, curto e ventilação.",
      ],
    },
    {
      title: "Tensão de referência e aplicação",
      description:
        "O cartaz indica aproximadamente 13,8–14,5 V como exemplo. Esse intervalo não é uma regra universal nem um critério isolado de diagnóstico. Temperatura, estado de carga, condições de ensaio e gerenciamento inteligente podem alterar a tensão prevista; consulte a documentação da aplicação.",
    },
  ],
  notes: [
    "Imagens ilustrativas geradas com base no cartaz para identificação didática. Não são fotografias de fabricante e não confirmam código, medidas ou compatibilidade.",
    "A numeração 1 a 16 acompanha a lista principal e o alternador interativo. Ventoinha e arruela, regulador e porta-escovas, espaçadores e isoladores têm construções ou funções distintas, mesmo quando aparecem agrupados.",
    "A vista explodida não define procedimento de desmontagem, montagem, aperto ou reparo. O exemplo com rotor em garra e polia rígida não representa todas as arquiteturas, polias ou estratégias de carga.",
  ],
};
