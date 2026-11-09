import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const mpiReferenceSystems = [
  { id: "combustivel", name: "Alimentação de combustível" },
  { id: "admissao", name: "Admissão e marcha lenta" },
  { id: "gerenciamento", name: "ECU e comando elétrico" },
  { id: "emissoes", name: "Mistura, escape e EVAP" },
  { id: "ignicao", name: "Ignição e combustão" },
] as const;
type MpiReferenceSystem = (typeof mpiReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: MpiReferenceSystem,
  description: string,
  note: string,
  aliases: readonly string[] = [],
): VisualPart => ({
  number,
  name,
  system,
  description,
  note,
  aliases,
  imageCell: number - 1,
});

/** Same 1–16 principal numbering as the reference chart and the existing MPI interactive. */
export const mpiReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Bomba de combustível",
    "combustivel",
    "Pressuriza e envia combustível do tanque para o circuito de alimentação, conforme a demanda e a estratégia do sistema.",
    "Inspecione alimentação, corrente, pressão e vazão pelos dados da aplicação. O conjunto ilustrado é instalado no tanque; construção, comando e integração com outros componentes variam.",
    ["bomba elétrica", "módulo do tanque", "fuel pump"],
  ),
  part(
    2,
    "Filtro de combustível",
    "combustivel",
    "Retém partículas e contaminantes do combustível antes de sua passagem pelos componentes que precisam de proteção no circuito.",
    "Posição, elemento filtrante, integração ao módulo e intervalo de substituição são específicos do veículo. A imagem representa um filtro externo, não a construção obrigatória de todo MPI.",
    ["elemento filtrante", "fuel filter"],
  ),
  part(
    3,
    "Regulador de pressão",
    "combustivel",
    "Controla a pressão de combustível de acordo com a arquitetura. No exemplo com retorno e referência de admissão, contribui para a diferença de pressão prevista nos injetores.",
    "Há sistemas com retorno na flauta e outros com regulação em local diferente, incluindo o tanque. Não adote pressão ou posição universal; identifique o circuito e os valores da aplicação.",
    ["regulador de combustível", "diafragma", "fuel pressure regulator"],
  ),
  part(
    4,
    "Flauta / tubo distribuidor",
    "combustivel",
    "Distribui o combustível aos injetores ligados ao conjunto, mantendo a alimentação prevista para os pontos de injeção do motor.",
    "A flauta ilustrada possui quatro posições. Quantidade de injetores, construção, pontos de medição, regulador e conexões dependem do motor; verifique também a integridade dos vedadores.",
    ["rail", "rampa de combustível", "tubo distribuidor", "fuel rail"],
  ),
  part(
    5,
    "Injetores MPI",
    "combustivel",
    "Dosam e pulverizam combustível nos dutos de admissão, antes das válvulas. O exemplo usa um injetor por cilindro, comandado pelo gerenciamento eletrônico.",
    "MPI é injeção nos pontos de admissão, não injeção direta na câmara. Quantidade por cilindro e estratégia de acionamento variam; estanqueidade, vazão, pulsos e vedação exigem os dados do sistema.",
    ["bico injetor", "válvula de injeção", "port injector", "injeção indireta"],
  ),
  part(
    6,
    "Medidor de fluxo de ar / MAF",
    "admissao",
    "Mede a massa de ar admitida para auxiliar o cálculo da carga e da quantidade de combustível nas aplicações que utilizam esse sensor.",
    "Nem todo MPI usa MAF; outras estratégias podem utilizar MAP e demais informações. Caixa do filtro, dutos e condições de admissão influenciam o diagnóstico, sem confirmar falha apenas pela aparência.",
    ["sensor de massa de ar", "medidor de ar", "mass airflow", "airflow meter"],
  ),
  part(
    7,
    "Corpo de borboleta / TBI",
    "admissao",
    "Regula a passagem de ar para o motor pela abertura da borboleta, por acionamento mecânico ou eletrônico conforme o projeto.",
    "O exemplo com IAC separado utiliza borboleta mecânica. Em aplicações eletrônicas, a própria borboleta pode controlar a marcha lenta e dispensar o IAC; não presuma que todos os itens coexistem em todo veículo.",
    ["corpo de aceleração", "throttle body", "borboleta de aceleração"],
  ),
  part(
    8,
    "Sensor de temperatura do ar / IAT",
    "admissao",
    "Informa a temperatura do ar admitido ao gerenciamento, permitindo ajustes nas estratégias de mistura e funcionamento do motor.",
    "O sensor pode estar separado ou integrado a outro componente. Compare leituras e testes às condições e aos dados da aplicação; não deduza resistência, localização ou pinagem pela imagem.",
    ["temperatura da admissão", "intake air temperature sensor"],
  ),
  part(
    9,
    "Atuador de marcha lenta / IAC",
    "admissao",
    "Regula a passagem de ar de desvio para auxiliar o controle da marcha lenta nos sistemas que empregam um atuador separado.",
    "É um exemplo de componente associado à borboleta mecânica. Sistemas com borboleta eletrônica podem dispensá-lo; tipo de atuação, adaptação e inspeção dependem do projeto.",
    ["motor de passo", "válvula de marcha lenta", "pintle", "idle air control"],
  ),
  part(
    10,
    "Sonda lambda",
    "emissoes",
    "Monitora o oxigênio nos gases de escape e fornece informações usadas pelo gerenciamento para o controle da mistura nas condições previstas pela estratégia.",
    "Não mede diretamente a qualidade da queima nem identifica sozinha uma causa de consumo. Tipo de sonda, aquecimento, posição e funcionamento em malha fechada variam; o catalisador é contexto da vista.",
    ["sensor de oxigênio", "sonda de oxigênio", "oxygen sensor", "O2"],
  ),
  part(
    11,
    "Unidade de comando / ECU",
    "gerenciamento",
    "Processa os sinais disponíveis e determina os comandos de injeção, ignição e demais funções de gerenciamento previstas no motor.",
    "A ECU calcula estratégias, não uma dosagem fixa universal. Alimentação, sinais de referência, calibração e condições do motor precisam ser considerados antes de atribuir uma falha ao módulo.",
    ["central de injeção", "módulo do motor", "ECM", "engine control unit"],
  ),
  part(
    12,
    "Válvula de purga / EVAP",
    "emissoes",
    "Controla a passagem dos vapores armazenados no cânister para a admissão, conforme o comando e as condições de purga definidos pelo sistema.",
    "Vapores e combustível líquido possuem caminhos diferentes. A válvula de purga não deve ser confundida com toda válvula de ventilação do cânister; função, mangueiras e comando dependem do projeto.",
    [
      "purge valve",
      "solenoide de purga",
      "válvula do cânister",
      "vapores do tanque",
    ],
  ),
  part(
    13,
    "Relé de comando",
    "gerenciamento",
    "Comuta a alimentação da bomba ou de outros circuitos sob a estratégia de comando prevista no gerenciamento do veículo.",
    "Circuitos atendidos, proteção, corrente e acionamento variam por aplicação. A ilustração não fornece identificação de terminais nem um esquema universal de ligação.",
    ["relé principal", "relé da bomba", "main relay", "fuel pump relay"],
  ),
  part(
    14,
    "Bobinas de ignição",
    "ignicao",
    "Produzem a alta tensão necessária à descarga nas velas a partir da energia armazenada durante a carga do campo magnético.",
    "A ignição é um sistema associado ao gerenciamento MPI, sem definir o local de injeção. Bobinas individuais ou agrupadas, driver e valores de teste são específicos do projeto.",
    ["bobina", "COP", "ignition coil", "alta tensão"],
  ),
  part(
    15,
    "Velas de ignição",
    "ignicao",
    "Permitem a centelha entre os eletrodos para iniciar a combustão da mistura na câmara, em motores com ignição por centelha.",
    "No MPI, a vela não ocupa o mesmo ponto de injeção do bico no duto. Aplicação, folga, desgaste e condições de combustão precisam ser conferidos conforme o fabricante.",
    ["vela", "spark plug", "eletrodos", "faísca"],
  ),
  part(
    16,
    "Cânister",
    "emissoes",
    "Retém vapores de combustível do tanque em seu elemento de carvão ativado para posterior admissão controlada pelo sistema de purga.",
    "Sua função envolve vapores, não armazenar ou distribuir combustível líquido aos injetores. Portas, válvulas associadas e integração ao controle de emissões evaporativas dependem do veículo.",
    ["canister", "carvão ativado", "charcoal", "filtro de vapores"],
  ),
];

export const mpiReferenceArtwork: VisualArtwork = {
  src: "/images/mpi-reference/catalog.webp",
  columns: 4,
  rows: 6,
  aspectRatio: 1145 / 4 / (1374 / 6),
};

export const mpiReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "conjunto",
    name: "Vista geral da injeção MPI",
    system: "combustivel",
    imageCell: 16,
    description:
      "O exemplo relaciona coletor, borboleta, flauta e injetores de quatro cilindros. O combustível é aplicado nos dutos de admissão, antes das válvulas.",
    details: [
      "Flauta e injetores de admissão",
      "Borboleta e coletor como caminho do ar",
      "Um injetor por cilindro neste exemplo",
      "Coletor e motor como contexto da aplicação",
    ],
    partNumbers: [4, 5, 7],
  },
  {
    id: "combustivel",
    name: "Alimentação de combustível",
    system: "combustivel",
    imageCell: 17,
    description:
      "A bomba envia combustível pelo circuito de filtragem e distribuição. A regulação e o eventual retorno mantêm as condições previstas para alimentar os injetores.",
    details: [
      "Bomba no tanque do exemplo",
      "Filtragem",
      "Regulação conforme a arquitetura",
      "Flauta e injetores",
      "Retorno ou ausência de retorno conforme o sistema",
    ],
    partNumbers: [1, 2, 3, 4, 5],
  },
  {
    id: "admissao",
    name: "Admissão e marcha lenta",
    system: "admissao",
    imageCell: 18,
    description:
      "O ar passa pelos elementos de admissão e pela borboleta até o coletor. O exemplo usa MAF e controle de marcha lenta separado; outras construções podem usar MAP ou borboleta eletrônica.",
    details: [
      "Filtro de ar e dutos como contexto",
      "Medição de ar conforme o projeto",
      "Corpo de borboleta",
      "Informação de temperatura do ar",
      "IAC separado apenas nas aplicações previstas",
    ],
    partNumbers: [6, 7, 8, 9],
  },
  {
    id: "injecao-nos-dutos",
    name: "Injeção nos dutos de admissão",
    system: "combustivel",
    imageCell: 19,
    description:
      "A pulverização ocorre no duto antes da válvula de admissão, permitindo a formação da mistura que entra no cilindro. Essa posição distingue o MPI da injeção direta na câmara.",
    details: [
      "Injetor e vedadores no ponto de admissão",
      "Pulverização antes da válvula",
      "Válvula e cilindro como referência de posição",
      "Vista didática, sem confirmar dimensões de uma aplicação",
    ],
    partNumbers: [4, 5],
  },
  {
    id: "ecu",
    name: "Entradas e saídas da ECU",
    system: "gerenciamento",
    imageCell: 20,
    description:
      "O gerenciamento relaciona sinais de rotação, carga, posição, temperatura e mistura aos comandos dos atuadores. Os componentes desenhados são exemplos, sem definir pinagem ou circuitos de um veículo.",
    details: [
      "Entradas de sensores previstas no motor",
      "ECU e estratégia de controle",
      "Injetores e bobinas",
      "IAC e purga quando presentes",
      "Relé e alimentação de circuitos",
    ],
    partNumbers: [5, 6, 8, 9, 10, 11, 12, 13, 14],
  },
  {
    id: "evap",
    name: "Cânister e sistema de purga",
    system: "emissoes",
    imageCell: 21,
    description:
      "Os vapores do tanque são retidos no cânister e admitidos pelo comando de purga nas condições previstas. Esse caminho é separado da linha de combustível líquido que alimenta a flauta.",
    details: [
      "Tanque como origem dos vapores",
      "Cânister e carvão ativado",
      "Válvula de purga",
      "Admissão como destino conforme o controle",
      "Sem passagem de combustível líquido pelo cânister no circuito representado",
    ],
    partNumbers: [12, 16],
  },
  {
    id: "ignicao",
    name: "Ignição e combustão",
    system: "ignicao",
    imageCell: 22,
    description:
      "A bobina e a vela participam do início da combustão na câmara. No MPI, a dosagem do combustível acontece na admissão, em um ponto diferente do local da centelha.",
    details: [
      "Bobina e comando de ignição",
      "Vela e espaço entre eletrodos",
      "Câmara de combustão como contexto",
      "Injeção de combustível localizada na admissão",
    ],
    partNumbers: [5, 14, 15],
  },
  {
    id: "mistura",
    name: "Sonda lambda e controle de mistura",
    system: "emissoes",
    imageCell: 23,
    description:
      "A informação de oxigênio no escape é utilizada pelo gerenciamento nas estratégias de controle da mistura. A atuação em malha fechada depende das condições e do projeto.",
    details: [
      "Sonda e circuito de sinal conforme o tipo",
      "Escape e catalisador como contexto",
      "ECU e correções previstas na calibração",
      "Sem medição real de composição, consumo ou eficiência na imagem",
    ],
    partNumbers: [10, 11],
  },
];

export const mpiVisualCatalog: VisualCatalog = {
  id: "injecao-mpi",
  name: "Injeção multiponto / MPI",
  className: "mpi-reference-catalog",
  title: "Injeção multiponto, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / INJEÇÃO ELETRÔNICA MPI",
  description:
    "Explore os 16 componentes numerados da referência, com imagens, funções e inspeções. Conheça os caminhos do combustível e do ar, o gerenciamento da ECU, a purga e a ignição em oito vistas de funcionamento.",
  searchTerms: "injeção multiponto MPI PFI injeção eletrônica",
  searchPlaceholder: "Nome, número ou função: injetor, 16, purga…",
  systemLabel: "Sistema da injeção",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/injecao-eletronica",
  interactiveLabel: "Explorar injeção MPI interativa",
  systems: mpiReferenceSystems,
  parts: mpiReferenceParts,
  assemblies: mpiReferenceAssemblies,
  partArtwork: mpiReferenceArtwork,
  assemblyArtwork: mpiReferenceArtwork,
  overview: {
    kind: "sprite",
    artwork: mpiReferenceArtwork,
    cell: 16,
    alt: "Ilustração didática gerada de coletor, flauta e injetores MPI de quatro cilindros",
    caption: "Injeção na admissão · exemplo MPI",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      description:
        "O exemplo relaciona admissão, dosagem de combustível, ignição e controle de mistura. Componentes e estratégias variam conforme o motor.",
      items: [
        "O ar é filtrado e suas condições são avaliadas pelos sensores previstos, como MAF ou MAP e temperatura de admissão.",
        "A ECU processa os sinais e determina os comandos de combustível conforme carga, rotação, temperatura e calibração.",
        "Os injetores MPI pulverizam combustível nos dutos de admissão, antes das válvulas; o exemplo usa um por cilindro.",
        "A ignição fornece a descarga nas velas para iniciar a combustão da mistura na câmara.",
        "Nas condições previstas para malha fechada, as informações do escape contribuem para as correções de mistura feitas pelo gerenciamento.",
      ],
    },
    {
      title: "Principais entradas da ECU",
      description:
        "Os sinais disponíveis dependem da aplicação. CKP, posição da borboleta e temperatura do motor são contexto do esquema e não acrescentam itens à lista principal de 16 componentes.",
      groups: [
        {
          name: "Ar e carga",
          text: "MAF mede massa de ar nas aplicações que o utilizam. Outros projetos podem empregar MAP e estratégias de cálculo de carga diferentes.",
        },
        {
          name: "Temperatura do ar",
          text: "IAT informa as condições térmicas da admissão para os ajustes previstos pelo gerenciamento.",
        },
        {
          name: "Rotação e referência",
          text: "CKP e outros sinais de sincronismo, conforme a construção, permitem relacionar os comandos ao ciclo do motor.",
        },
        {
          name: "Posição da borboleta",
          text: "O sinal de posição, frequentemente identificado como TPS/TP, participa das estratégias do sistema de admissão.",
        },
        {
          name: "Oxigênio no escape",
          text: "A sonda lambda informa o oxigênio dos gases; sua interpretação e o uso em controle da mistura dependem do tipo e das condições.",
        },
        {
          name: "Temperatura do motor",
          text: "ECT informa a temperatura do líquido de arrefecimento para as estratégias de funcionamento da aplicação.",
        },
      ],
    },
    {
      title: "Principais saídas da ECU",
      groups: [
        {
          name: "Injetores",
          text: "Recebem os comandos de dosagem e temporização do combustível previstos no projeto.",
        },
        {
          name: "Bobinas",
          text: "Os estágios de potência e as bobinas executam a carga e a interrupção necessárias à ignição conforme a estratégia.",
        },
        {
          name: "Marcha lenta",
          text: "IAC separado quando presente, ou controle pela borboleta eletrônica nas aplicações correspondentes.",
        },
        {
          name: "Purga EVAP",
          text: "A válvula admite vapores do cânister sob as condições de comando do gerenciamento.",
        },
        {
          name: "Relé e alimentação",
          text: "Comutação dos circuitos da bomba e de outras cargas conforme a distribuição elétrica do veículo.",
        },
      ],
    },
    {
      title: "Recursos e vantagens possíveis",
      description:
        "Desempenho, consumo e emissões dependem do conjunto do motor, da calibração, da manutenção e das condições de operação; não são garantidos apenas pelo nome MPI.",
      items: [
        "Distribuição do combustível pelos pontos de injeção de admissão previstos para o motor.",
        "Ajuste eletrônico da dosagem conforme as condições de funcionamento.",
        "Integração com controle de mistura e emissões nas estratégias disponíveis.",
        "Recursos de partida e aquecimento adequados à aplicação quando o sistema opera corretamente.",
        "Possibilidade de funcionamento estável e diagnóstico por parâmetros e códigos, com interpretação técnica.",
      ],
    },
    {
      title: "Principais falhas e sintomas",
      description:
        "Os sintomas podem ter várias causas. Códigos e imagens não confirmam isoladamente um componente defeituoso.",
      groups: [
        {
          name: "Injetor com falha ou restrição",
          text: "Pode haver funcionamento irregular e perda de desempenho. Verificar vedação, alimentação, comando e condição do combustível antes de concluir a causa.",
        },
        {
          name: "Pressão ou vazão insuficiente",
          text: "Pode dificultar a partida ou comprometer o funcionamento. Relacionar bomba, filtro, regulação e alimentação aos valores previstos.",
        },
        {
          name: "Sonda ou controle de mistura",
          text: "Leituras e consumo alterados podem envolver sonda, mistura, escape e outras condições; interpretar o tipo de sensor e a estratégia.",
        },
        {
          name: "MAF, TBI ou admissão",
          text: "Sujeira, entrada de ar indevida, falhas elétricas ou de controle podem afetar potência e marcha lenta. Confirmar a condição por testes da aplicação.",
        },
        {
          name: "Purga EVAP com falha",
          text: "Vazamentos ou atuação incorreta podem afetar mistura e gerar indicação de falha. Identificar válvula, mangueiras, cânister e comando conforme o projeto.",
        },
      ],
    },
    {
      title: "Distinções de construção",
      groups: [
        {
          name: "MPI e injeção direta",
          text: "No MPI, o combustível é aplicado na admissão antes da válvula. Injeção direta o aplica na câmara, com outra arquitetura; os injetores não são equivalentes.",
        },
        {
          name: "TBI e IAC",
          text: "O conjunto didático com IAC separado usa borboleta mecânica. A borboleta eletrônica pode assumir a marcha lenta e dispensar esse atuador.",
        },
        {
          name: "Pressão e retorno",
          text: "Regulação, referência de pressão e eventual retorno dependem da arquitetura. O cartaz não estabelece uma pressão universal nem exige regulador na flauta.",
        },
        {
          name: "Líquido e vapores",
          text: "A linha de combustível alimenta os injetores com líquido. O EVAP retém vapores no cânister e admite esses vapores pela purga, por caminho separado.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar os componentes da referência enviada. Não são fotografias de fabricante nem desenhos certificados de uma aplicação específica.",
    "A numeração 1 a 16 acompanha o cartaz e os componentes principais do interativo MPI existente. Tanque, filtro de ar, coletor, catalisador, motor e sensores adicionais aparecem nas vistas como contexto.",
    "O exemplo usa quatro cilindros, injetores na admissão, MAF, borboleta mecânica com IAC separado e regulação com retorno. Isso não define a configuração de todo sistema MPI.",
    "Forma, conexões, posição, valores de teste e estratégias dependem da aplicação. As imagens não fornecem pinagem ou procedimento de manutenção.",
  ],
};
