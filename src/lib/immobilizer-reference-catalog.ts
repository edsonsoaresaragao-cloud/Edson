import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const immobilizerReferenceSystems = [
  { id: "chave", name: "Chave e leitura" },
  { id: "comando", name: "Comando de ignição" },
  { id: "autorizacao", name: "Autorização e módulos" },
  { id: "acionamento", name: "Partida, ignição e injeção" },
] as const;
type ImmobilizerReferenceSystem =
  (typeof immobilizerReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: ImmobilizerReferenceSystem,
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

/** The nine principal identifiers match the supplied chart and the existing starting-system interactive. */
export const immobilizerReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Chave de ignição codificada",
    "chave",
    "Permite a atuação mecânica da ignição no exemplo e participa do reconhecimento eletrônico por meio do transponder previsto no sistema.",
    "A lâmina e os botões são representativos. O funcionamento do controle remoto não confirma, por si só, o reconhecimento pelo imobilizador; chave mecânica, transponder e controle remoto têm funções diferentes.",
    ["chave codificada", "chave com chip", "ignition key", "controle remoto"],
  ),
  part(
    2,
    "Chip transponder",
    "chave",
    "Participa da identificação e autenticação da chave. No exemplo passivo, recebe energia do campo da antena leitora para comunicar as informações previstas pelo projeto.",
    "O transponder passivo não depende da pilha do controle remoto. Formato, autenticação e integração à chave variam; a aparência do chip não confirma identificação, compatibilidade ou estado de cadastro.",
    ["RFID", "chip da chave", "transponder passivo", "cápsula"],
  ),
  part(
    3,
    "Cilindro / comutador de ignição",
    "comando",
    "O cilindro recebe a chave mecânica, e o comutador atua sobre as solicitações elétricas de contato e partida conforme a construção do veículo.",
    "Cilindro e comutador têm funções distintas, agrupadas na referência. Posições, contatos e intertravamentos variam; sistemas com botão ou chave de presença podem usar outra arquitetura.",
    [
      "miolo de ignição",
      "chave de contato",
      "ignition switch",
      "lock cylinder",
    ],
  ),
  part(
    4,
    "Antena leitora do imobilizador",
    "chave",
    "Realiza o acoplamento com o transponder e permite sua leitura. No exemplo com chave convencional, a antena fica ao redor do cilindro de ignição.",
    "Inspecione integridade, conexões e os testes de alimentação e leitura previstos pelo fabricante. Formato, posição e integração eletrônica dependem do veículo; não há um valor de resistência universal.",
    [
      "anel leitor",
      "bobina leitora",
      "antena do transponder",
      "reader antenna",
    ],
  ),
  part(
    5,
    "Módulo imobilizador / BCM",
    "autorizacao",
    "Verifica o reconhecimento da chave no sistema e disponibiliza o estado de autorização aos módulos responsáveis pelo funcionamento do veículo.",
    "A função pode estar em módulo próprio, no BCM ou distribuída entre unidades. Comunicação, autenticação e integração variam; a caixa ilustrada não identifica um módulo de uma aplicação específica.",
    [
      "central de carroceria",
      "immobilizer",
      "body control module",
      "módulo de autorização",
    ],
  ),
  part(
    6,
    "ECU do motor",
    "autorizacao",
    "Recebe o estado de autorização e coordena as funções de motor que dependem dessa condição, em conjunto com os demais comandos e intertravamentos da aplicação.",
    "A divisão de funções entre ECU, BCM e partida varia. O bloqueio pode atingir o comando de arranque, a injeção, a ignição ou combinações desses circuitos; reconhecimento da chave não garante sozinho que o motor funcione.",
    ["central do motor", "ECM", "engine control unit", "gerenciamento"],
  ),
  part(
    7,
    "Relé / fusível de partida",
    "acionamento",
    "O relé comuta o circuito de comando previsto para a partida, enquanto o fusível protege os circuitos designados contra condições de sobrecorrente.",
    "Relé e fusível são peças diferentes. O desenho não define ligações nem significa que a corrente total do motor passe por um pequeno relé; os contatos de potência do solenoide e a distribuição dependem do projeto.",
    [
      "starter relay",
      "relé de arranque",
      "fusível",
      "proteção",
      "circuito de comando",
    ],
  ),
  part(
    8,
    "Motor de partida",
    "acionamento",
    "Converte energia elétrica em torque para movimentar o motor térmico quando recebe o comando de partida nas condições previstas pelo veículo.",
    "A autorização é uma das condições do acionamento. Alimentação, comando, contatos, engrenamento e estado mecânico precisam ser avaliados; depois de o motor funcionar, o arranque deve se desacoplar conforme a construção.",
    ["arranque", "starter motor", "solenoide", "pinhão"],
  ),
  part(
    9,
    "Bobinas / injetores",
    "acionamento",
    "Executam os comandos de ignição e injeção necessários ao funcionamento do motor, quando habilitados pelo gerenciamento e pelas condições da aplicação.",
    "São circuitos e componentes distintos, agrupados na referência. O exemplo inclui ignição por centelha; tipos de injetor, bobina e estratégia de bloqueio dependem do motor e não definem uma ligação universal.",
    ["bobina de ignição", "bico injetor", "injeção", "coil", "injector"],
  ),
];

export const immobilizerReferenceArtwork: VisualArtwork = {
  src: "/images/immobilizer-reference/catalog.webp",
  columns: 3,
  rows: 5,
  aspectRatio: (972 * 5) / (1618 * 3),
};

export const immobilizerReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "chave",
    name: "Chave e transponder em detalhe",
    system: "chave",
    imageCell: 9,
    description:
      "A separação didática distingue carcaça, lâmina, eletrônica do controle remoto, pilha e transponder da chave. O transponder passivo do exemplo é energizado pela antena, não pela pilha do controle.",
    details: [
      "Carcaça e lâmina representativas",
      "Transponder de reconhecimento",
      "Eletrônica e botões do controle remoto",
      "Pilha do controle como função distinta",
    ],
    partNumbers: [1, 2],
  },
  {
    id: "coluna",
    name: "Instalação na coluna de direção",
    system: "comando",
    imageCell: 10,
    description:
      "A vista mostra um exemplo de cilindro e antena leitora na coluna. Localização e forma de montagem são específicas de cada veículo e não representam todos os sistemas com botão de partida.",
    details: [
      "Cilindro de ignição",
      "Antena ao redor da região de leitura",
      "Comutador e suas interfaces conforme o projeto",
      "Coluna de direção como contexto de instalação",
    ],
    partNumbers: [3, 4],
  },
  {
    id: "modulos",
    name: "Comunicação entre imobilizador e ECU",
    system: "autorizacao",
    imageCell: 11,
    description:
      "O estado de reconhecimento é compartilhado com as unidades que participam da autorização. A comunicação pode utilizar rede ou circuitos dedicados, conforme a arquitetura.",
    details: [
      "Função imobilizador ou BCM",
      "ECU do motor",
      "Conexões e alimentação como contexto",
      "CAN, LIN ou outros caminhos apenas quando previstos no veículo",
    ],
    partNumbers: [5, 6],
  },
  {
    id: "reconhecida",
    name: "Chave reconhecida",
    system: "autorizacao",
    imageCell: 12,
    description:
      "O reconhecimento permite disponibilizar a autorização prevista no sistema. Partida e funcionamento ainda dependem das demais condições, comandos e intertravamentos do veículo.",
    details: [
      "Leitura e reconhecimento válidos no exemplo",
      "Estado de autorização disponível",
      "Condições adicionais de partida atendidas conforme o projeto",
      "Ignição e injeção habilitadas quando a estratégia permitir",
    ],
    partNumbers: [1, 2, 4, 5, 6, 7, 8, 9],
  },
  {
    id: "nao-reconhecida",
    name: "Chave não reconhecida",
    system: "autorizacao",
    imageCell: 13,
    description:
      "A ausência de reconhecimento pode impedir o comando de partida ou o funcionamento por bloqueio de injeção e/ou ignição. O comportamento depende do projeto do veículo.",
    details: [
      "Reconhecimento não confirmado neste cenário",
      "Partida pode não ser acionada",
      "Em outras aplicações o motor gira, mas não entra em funcionamento",
      "Indicação e códigos precisam ser interpretados conforme o veículo",
    ],
    partNumbers: [1, 2, 4, 5, 6],
  },
  {
    id: "painel",
    name: "Indicação do imobilizador no painel",
    system: "autorizacao",
    imageCell: 14,
    description:
      "Luz, símbolo ou mensagem podem informar o estado do sistema de reconhecimento. Cor, comportamento e significado devem ser conferidos no manual da aplicação.",
    details: [
      "Símbolo de chave ou veículo com cadeado como referência",
      "Estado aceso, piscante ou temporário conforme o projeto",
      "Indicação não identifica sozinha um componente defeituoso",
      "Correlacionar com autorização e diagnóstico dos módulos",
    ],
    partNumbers: [5, 6],
  },
];

export const immobilizerVisualCatalog: VisualCatalog = {
  id: "chave-e-imobilizador",
  name: "Chave e imobilizador",
  className: "immobilizer-reference-catalog",
  title: "Chave e imobilizador, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / PARTIDA E RECONHECIMENTO",
  description:
    "Explore as nove identificações da referência: chave, transponder, leitura, módulos e circuitos de partida. Consulte imagens, funções, reconhecimento e sintomas, com seis vistas de funcionamento.",
  searchTerms:
    "chave de ignição imobilizador eletrônico sistema de partida antifurto reconhecimento",
  searchPlaceholder: "Nome, número ou função: transponder, 4, antena…",
  systemLabel: "Sistema da partida",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/ignicao",
  interactiveLabel: "Explorar partida e imobilizador interativos",
  systems: immobilizerReferenceSystems,
  parts: immobilizerReferenceParts,
  assemblies: immobilizerReferenceAssemblies,
  partArtwork: immobilizerReferenceArtwork,
  assemblyArtwork: immobilizerReferenceArtwork,
  overview: {
    kind: "sprite",
    artwork: immobilizerReferenceArtwork,
    cell: 10,
    alt: "Ilustração didática gerada de cilindro e antena leitora na coluna de direção",
    caption: "Chave e leitura · exemplo de instalação",
  },
  sections: [
    {
      title: "Como funciona, passo a passo",
      description:
        "A sequência descreve o reconhecimento e a autorização em um exemplo com chave convencional. A distribuição das funções depende da arquitetura.",
      items: [
        "A inserção e o giro da chave, ou o comando equivalente no projeto, solicitam os estados de ignição e partida.",
        "A antena permite a leitura do transponder; no exemplo passivo, fornece a energia de campo necessária à comunicação.",
        "A função de imobilizador verifica o reconhecimento da chave conforme o sistema do veículo.",
        "As unidades participantes compartilham o estado de autorização com a ECU por comunicação prevista no projeto.",
        "A autorização é combinada às demais condições de partida e aos intertravamentos da aplicação.",
        "Quando permitido e solicitado, o comando de partida aciona o arranque para movimentar o motor térmico.",
        "O gerenciamento mantém os comandos de injeção e ignição necessários ao funcionamento, conforme a estratégia e as condições do motor.",
      ],
    },
    {
      title: "Chave reconhecida e não reconhecida",
      groups: [
        {
          name: "Reconhecida",
          text: "O estado de autorização pode ser disponibilizado. Bateria, condições mecânicas, comandos e outros intertravamentos continuam necessários; chave reconhecida não garante sozinha a partida.",
        },
        {
          name: "Não reconhecida",
          text: "Conforme o veículo, pode haver ausência de acionamento do arranque ou motor girando sem entrar em funcionamento por bloqueio de circuitos de motor. O sintoma isolado não confirma a causa.",
        },
      ],
    },
    {
      title: "Sintomas de falha",
      description:
        "As manifestações podem ter causas fora do imobilizador. Correlacione o estado de autorização aos testes da aplicação.",
      groups: [
        {
          name: "Luz de chave ou cadeado",
          text: "Verificar o significado do símbolo e do padrão de acendimento no manual. Alguns estados de indicação são normais e não identificam, sozinhos, falha da chave.",
        },
        {
          name: "Motor gira e não pega",
          text: "Pode haver autorização não confirmada em certas arquiteturas, mas alimentação, combustível, ignição, injeção e condições mecânicas também precisam ser investigadas.",
        },
        {
          name: "Arranque não é acionado",
          text: "Conferir comando, alimentação, intertravamentos e estado de autorização. A falta de partida não comprova defeito do transponder.",
        },
        {
          name: "Reconhecimento intermitente",
          text: "Avaliar chave, leitura, conexões e alimentação conforme as condições em que a falha ocorre, sem substituir componentes apenas pelo sintoma.",
        },
        {
          name: "Falha de comunicação ou sincronismo",
          text: "Ler os estados e códigos dos módulos envolvidos. Eventuais adaptações dependem da confirmação da causa e dos procedimentos específicos da aplicação.",
        },
      ],
    },
    {
      title: "Pontos de atenção na oficina",
      items: [
        "Comparar o comportamento com uma chave reserva previamente reconhecida pelo veículo, quando disponível.",
        "Verificar integridade, conexões e os testes previstos para a antena leitora; não adotar valores genéricos de resistência ou alimentação.",
        "Inspecionar conectores e chicotes entre os elementos do sistema, observando contato, oxidação e danos.",
        "Avaliar a bateria e a alimentação dos módulos, incluindo quedas de tensão nas condições de funcionamento previstas.",
        "Utilizar diagnóstico compatível para correlacionar códigos, reconhecimento da chave, autorização e comunicação entre imobilizador/BCM e ECU.",
      ],
    },
    {
      title: "Entenda as diferenças",
      groups: [
        {
          name: "Transponder e controle remoto",
          text: "O transponder passivo do exemplo é energizado pela antena e não depende da pilha do controle. Destravar portas e reconhecer a chave para a partida são funções distintas.",
        },
        {
          name: "Relé e fusível",
          text: "O relé realiza a comutação do circuito de comando previsto; o fusível oferece proteção. A referência não define um circuito de potência ou uma ligação aplicável a todo veículo.",
        },
        {
          name: "Módulos e comunicação",
          text: "Imobilizador, BCM e ECU podem distribuir funções de formas diferentes. CAN e LIN não são uma exigência conjunta nem intercambiável de todo sistema; a aplicação determina a comunicação usada.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar os componentes da referência enviada. Não são fotografias de fabricante nem identificam segredo mecânico, código de chave ou aplicação específica.",
    "A numeração 1 a 9 segue a lista principal do cartaz e as primeiras nove identificações do interativo existente. Bateria, coluna, painel e motor térmico aparecem como contexto nas vistas.",
    "O reconhecimento é uma condição do funcionamento; a estratégia pode bloquear o arranque, a injeção, a ignição ou outras combinações conforme o projeto.",
    "Imagens, formas, conectores e trajetos não definem pinagem, comunicação ou procedimento de manutenção. Identifique o veículo e utilize seus dados técnicos.",
  ],
};
