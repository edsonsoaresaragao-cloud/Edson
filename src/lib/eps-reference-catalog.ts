import type {
  VisualArtwork,
  VisualAssembly,
  VisualCatalog,
  VisualPart,
} from "./visual-reference-catalog";

export const epsReferenceSystems = [
  { id: "comando", name: "Comando da direção" },
  { id: "assistencia", name: "Sensores e assistência EPS" },
  { id: "caixa", name: "Caixa e articulações" },
  { id: "suspensao", name: "Estrutura e suspensão" },
  { id: "transmissao", name: "Transmissão às rodas" },
  { id: "freios", name: "Freios" },
] as const;
type EpsReferenceSystem = (typeof epsReferenceSystems)[number]["id"];
const part = (
  number: number,
  name: string,
  system: EpsReferenceSystem,
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

/** The 17 principal identifiers match the supplied chart and the EPS explorer. */
export const epsReferenceParts: readonly VisualPart[] = [
  part(
    1,
    "Volante",
    "comando",
    "É a interface do motorista para aplicar o comando de direção, transmitindo o movimento à coluna e ao conjunto de esterçamento.",
    "Recursos integrados, fixação, centralização e procedimentos de inspeção dependem do veículo. A imagem representa a forma geral do volante, sem definir os módulos ou comandos de uma aplicação.",
    ["roda de direção", "steering wheel"],
  ),
  part(
    2,
    "Coluna de direção",
    "comando",
    "Transmite o giro do volante ao mecanismo de direção pelos eixos e acoplamentos previstos, mantendo o caminho mecânico de comando.",
    "O exemplo possui coluna mecânica e assistência elétrica junto à caixa. Outras arquiteturas podem instalar o motor na coluna; construção, ajustes e fixações exigem a especificação da aplicação.",
    ["eixo da coluna", "coluna colapsável", "steering column"],
  ),
  part(
    3,
    "Junta universal",
    "comando",
    "Transmite a rotação entre trechos da coluna com desalinhamento angular, permitindo o caminho mecânico até o mecanismo de direção.",
    "Verifique folgas, travamento, fixação e integridade conforme o projeto. Ângulos, montagem e acoplamentos são específicos; a junta da coluna tem função diferente das juntas homocinéticas dos semieixos.",
    ["junta cardan", "cruzeta da direção", "universal joint", "U-joint"],
  ),
  part(
    4,
    "Sensor de torque",
    "assistencia",
    "Detecta o esforço e o sentido aplicados pelo motorista ao comando da direção, fornecendo informações para calcular a assistência elétrica.",
    "Torque e ângulo são grandezas diferentes. Tipo de sensor, redundância, posição e procedimentos de verificação ou calibração dependem do veículo; a imagem não fornece uma medição real de torque.",
    ["sensor de esforço", "barra de torção", "torque sensor"],
  ),
  part(
    5,
    "ECU da direção",
    "assistencia",
    "Processa os sinais do sistema, como torque e informações de velocidade quando previstas, e determina o comando do motor de assistência.",
    "Alimentação, comunicação, integração e configuração variam por aplicação. Relacione os DTCs aos parâmetros e testes previstos; um código não confirma sozinho a necessidade de substituir o módulo.",
    ["módulo da direção", "central EPS", "EPS control unit", "ECU EPS"],
  ),
  part(
    6,
    "Motor elétrico de assistência",
    "assistencia",
    "Fornece torque adicional ao mecanismo de direção por meio da redução prevista, auxiliando o esforço do motorista no esterçamento.",
    "O exemplo utiliza motor junto à caixa com transmissão mecânica de assistência. Outras arquiteturas EPS podem atuar na coluna ou no pinhão; construção, corrente e testes dependem da aplicação.",
    ["motor EPS", "servo elétrico", "EPS assist motor", "electric motor"],
  ),
  part(
    7,
    "Cremalheira / caixa EPS",
    "caixa",
    "O conjunto relaciona a rotação do pinhão ao deslocamento da cremalheira, transmitindo o comando às barras e recebendo a assistência elétrica neste exemplo.",
    "Carcaça, redutor, sensor e motor podem ter integrações diferentes. A separação didática não confirma fornecimento ou reparo individual de todos os elementos; posição e fixação variam conforme o veículo.",
    ["caixa de direção elétrica", "rack", "steering rack", "cremalheira EPS"],
  ),
  part(
    8,
    "Pinhão",
    "caixa",
    "Recebe a rotação transmitida pela coluna e engrena com os dentes da cremalheira para produzir o deslocamento do mecanismo de direção.",
    "Relação de transmissão, dentes, eixo e apoios são específicos do conjunto. O pinhão é apresentado isoladamente para identificar sua função, sem indicar uma peça intercambiável entre caixas.",
    ["engrenagem do pinhão", "pinion shaft", "pinhão da direção"],
  ),
  part(
    9,
    "Barra axial",
    "caixa",
    "Liga a cremalheira ao terminal de direção, transmitindo seu deslocamento e permitindo a articulação prevista na ligação interna.",
    "Inspecione folga, coifa, roscas e fixação conforme a aplicação. Comprimento, lado e procedimento de alinhamento dependem do conjunto; barra axial e semieixo transmitem esforços de sistemas diferentes.",
    ["terminal axial", "articulação axial", "inner tie rod"],
  ),
  part(
    10,
    "Terminal de direção",
    "caixa",
    "Conecta a barra axial ao braço de direção da manga de eixo por uma articulação esférica, transmitindo o comando que orienta a roda.",
    "Verifique folga, coifa, rosca e assentamento. Após intervenções, siga os procedimentos de geometria e as verificações previstas; a simples troca do terminal não define uma calibração eletrônica universal.",
    ["terminal externo", "ponteira de direção", "outer tie rod end"],
  ),
  part(
    11,
    "Semieixo",
    "transmissao",
    "Conduz o torque de propulsão do diferencial à roda motriz, acomodando os movimentos de suspensão e direção por suas juntas homocinéticas.",
    "Sua função pertence à transmissão às rodas, não ao acionamento do motor EPS. Lado, comprimento, estrias e tipos de junta variam; inspecione coifas, folgas e sinais de perda de graxa conforme a aplicação.",
    ["semi eixo", "eixo homocinético", "CV axle", "half shaft"],
  ),
  part(
    12,
    "Bandeja",
    "suspensao",
    "Liga o subchassi ao conjunto da roda pelos pontos de articulação previstos, contribuindo para guiar sua posição durante o curso da suspensão.",
    "Construção, buchas, posição e integração do pivô variam. Inspecione folgas, deformações e fixações; a imagem de uma bandeja triangular não determina a geometria de todos os veículos.",
    ["braço de suspensão", "braço inferior", "lower control arm"],
  ),
  part(
    13,
    "Pivô da bandeja",
    "suspensao",
    "Forma a articulação esférica entre a bandeja e a manga de eixo, permitindo os movimentos combinados de suspensão e direção previstos no projeto.",
    "Inspecione coifa, folga, fixação e condição da articulação pelo método do fabricante. O pivô pode ser separado ou integrado à bandeja; a imagem isolada não estabelece a forma de substituição.",
    ["pivô de suspensão", "junta esférica", "suspension ball joint"],
  ),
  part(
    14,
    "Agregado / subchassi",
    "suspensao",
    "É a estrutura de apoio e fixação dos componentes do módulo dianteiro, como elementos da suspensão e a caixa de direção conforme a construção.",
    "Material, apoios, buchas e pontos de fixação dependem do veículo. Verifique deformações e integridade; torques, centralização e procedimentos de montagem são específicos da aplicação.",
    ["berço dianteiro", "quadro auxiliar", "subframe", "crossmember"],
  ),
  part(
    15,
    "Amortecedor e mola McPherson",
    "suspensao",
    "A mola suporta as cargas previstas e o amortecedor controla as oscilações; o conjunto McPherson também participa da localização da roda.",
    "A referência reúne amortecedor e mola no item 15. Coxim e rolamento superior aparecem no conjunto; inspecione mola, amortecedor, apoios e fixações conforme o veículo, sem separar a numeração principal.",
    [
      "coluna McPherson",
      "torre da suspensão",
      "strut assembly",
      "mola helicoidal",
    ],
  ),
  part(
    16,
    "Disco de freio",
    "freios",
    "Gira com o cubo da roda e recebe o atrito das pastilhas para produzir a desaceleração, convertendo energia do movimento em calor.",
    "A imagem mostra um disco ventilado como exemplo. Espessura, desgaste, empenamento e fixação exigem os limites da aplicação; ventilação interna não significa necessariamente perfurações na face.",
    ["rotor de freio", "disco ventilado", "brake disc", "brake rotor"],
  ),
  part(
    17,
    "Pinça de freio",
    "freios",
    "Transforma a pressão hidráulica em força nas pastilhas, pressionando-as contra o disco para realizar a frenagem no exemplo representado.",
    "A pinça acompanha o esterçamento e permanece sem o giro do disco. Guias, pistões, vedadores e pastilhas dependem do tipo; a assistência EPS elétrica não elimina o circuito hidráulico próprio dos freios.",
    ["caliper", "cáliper", "brake caliper"],
  ),
];

export const epsReferenceArtwork: VisualArtwork = {
  src: "/images/eps-reference/catalog.webp",
  columns: 4,
  rows: 6,
  aspectRatio: 1,
};

export const epsReferenceAssemblies: readonly VisualAssembly[] = [
  {
    id: "modulo-dianteiro",
    name: "Módulo dianteiro com EPS",
    system: "suspensao",
    imageCell: 17,
    description:
      "A vista reúne comando de direção, assistência elétrica, suspensão, transmissão às rodas e freios. Os conjuntos são apresentados separados para identificar suas funções no módulo dianteiro.",
    details: [
      "Volante, coluna e junta universal",
      "Caixa de direção com assistência EPS",
      "Conjuntos McPherson e bandejas",
      "Semieixos e agregado",
      "Discos, pinças, cubos e mangas no contexto do módulo",
    ],
    partNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  },
  {
    id: "comando",
    name: "Do volante à caixa EPS",
    system: "comando",
    imageCell: 18,
    description:
      "Volante, coluna e acoplamentos levam o comando ao mecanismo da caixa. O deslocamento da cremalheira é transmitido pelas barras e terminais para orientar as rodas.",
    details: [
      "Volante e coluna",
      "Junta universal no caminho mecânico",
      "Motor junto à caixa neste exemplo",
      "Cremalheira e barras axiais",
      "Terminais e articulações das rodas",
    ],
    partNumbers: [1, 2, 3, 6, 7, 9, 10],
  },
  {
    id: "corte",
    name: "Caixa EPS em corte parcial",
    system: "caixa",
    imageCell: 19,
    description:
      "O corte didático relaciona pinhão, cremalheira e assistência do motor por transmissão mecânica. A geometria simplificada ajuda a identificar funções, sem reproduzir um redutor específico.",
    details: [
      "Pinhão e dentes da cremalheira",
      "Motor elétrico e enrolamentos",
      "Redução mecânica de assistência",
      "Exemplo com motor junto à caixa",
      "Outras arquiteturas EPS podem atuar na coluna ou no pinhão",
    ],
    partNumbers: [6, 7, 8],
  },
  {
    id: "controle",
    name: "Sensor de torque, ECU e motor",
    system: "assistencia",
    imageCell: 20,
    description:
      "O sensor fornece informações do esforço aplicado, a ECU calcula o comando com os sinais disponíveis e o motor fornece assistência. O grupo relaciona funções sem definir ligações elétricas.",
    details: [
      "Esforço e sentido aplicados pelo motorista",
      "Processamento da ECU",
      "Informações adicionais conforme o veículo",
      "Comando do motor de assistência",
      "Sem pinagem ou valores de teste universais",
    ],
    partNumbers: [4, 5, 6],
  },
  {
    id: "articulacoes",
    name: "Barras e terminais de direção",
    system: "caixa",
    imageCell: 21,
    description:
      "A articulação axial leva o deslocamento da cremalheira ao terminal, que transmite o comando à manga de eixo. Coifas e articulações permitem os movimentos previstos e protegem os conjuntos.",
    details: [
      "Saída da caixa e coifa",
      "Barra axial e articulação interna",
      "Terminal externo e pino esférico",
      "Ajustes de geometria específicos do veículo",
      "Semieixos possuem outra função, ligada à propulsão",
    ],
    partNumbers: [7, 9, 10],
  },
  {
    id: "suspensao-freios",
    name: "Suspensão McPherson e freios",
    system: "suspensao",
    imageCell: 22,
    description:
      "O conjunto de uma roda relaciona mola, amortecedor, bandeja, pivô, disco e pinça. Cubo e manga de eixo aparecem como contexto para localizar as articulações e o freio.",
    details: [
      "Amortecedor, mola e apoio superior",
      "Bandeja e pivô",
      "Cubo e manga como contexto",
      "Disco que gira com a roda",
      "Pinça que acompanha o esterçamento sem girar com o disco",
    ],
    partNumbers: [12, 13, 15, 16, 17],
  },
  {
    id: "estrutura-transmissao",
    name: "Subchassi, bandejas e semieixos",
    system: "transmissao",
    imageCell: 23,
    description:
      "O grupo diferencia a estrutura de apoio, os braços da suspensão e os semieixos de propulsão. Os semieixos conduzem torque do diferencial às rodas motrizes e não são acionados pelo motor EPS.",
    details: [
      "Agregado e pontos de fixação",
      "Bandejas e seus apoios",
      "Semieixos com juntas homocinéticas",
      "Componentes organizados para comparação",
      "Propulsão e assistência de direção possuem caminhos diferentes",
    ],
    partNumbers: [11, 12, 14],
  },
];

export const epsVisualCatalog: VisualCatalog = {
  id: "direcao-eletrica-eps",
  name: "Direção elétrica / EPS",
  className: "eps-reference-catalog",
  title: "Módulo dianteiro EPS, peça por peça.",
  eyebrow: "CATÁLOGO VISUAL / DIREÇÃO ELÉTRICA EPS",
  description:
    "Explore os 17 componentes numerados da referência, com imagens, funções e inspeções. Sete vistas relacionam comando mecânico, assistência elétrica, suspensão, semieixos e freios.",
  searchTerms: "direção elétrica EPS electric power steering módulo dianteiro",
  searchPlaceholder: "Nome, número ou função: torque, 15, terminal…",
  systemLabel: "Sistema do módulo EPS",
  assemblyLabel: "Conjuntos e funcionamento",
  assemblyNoun: ["vista", "vistas"],
  interactiveHref: "/categorias/direcao-hidraulica-e-eletrica/eps",
  interactiveLabel: "Explorar direção EPS interativa",
  systems: epsReferenceSystems,
  parts: epsReferenceParts,
  assemblies: epsReferenceAssemblies,
  partArtwork: epsReferenceArtwork,
  assemblyArtwork: epsReferenceArtwork,
  overview: {
    kind: "sprite",
    artwork: epsReferenceArtwork,
    cell: 17,
    alt: "Ilustração didática gerada do módulo dianteiro com volante, caixa EPS, suspensão, semieixos e freios",
    caption: "Módulo dianteiro com assistência elétrica",
  },
  sections: [
    {
      title: "Funcionamento do EPS",
      description:
        "O exemplo usa motor de assistência junto à caixa e preserva o caminho mecânico de comando entre volante e rodas. A assistência é calculada conforme os sinais e a estratégia da aplicação.",
      groups: [
        {
          name: "1. Sensor de torque",
          text: "Informa o esforço e o sentido aplicados pelo motorista. Tipo de sinal, redundância e montagem dependem do projeto.",
        },
        {
          name: "2. ECU da direção",
          text: "Processa torque e demais informações previstas, como velocidade do veículo, para determinar a assistência.",
        },
        {
          name: "3. Motor de assistência",
          text: "Recebe o comando e fornece torque adicional ao mecanismo por redução mecânica, auxiliando o esforço do motorista.",
        },
      ],
    },
    {
      title: "Do volante às rodas",
      items: [
        "Volante e coluna transmitem a rotação pelos acoplamentos e pela junta universal.",
        "O pinhão engrena com a cremalheira, produzindo seu deslocamento.",
        "Barras axiais e terminais transmitem esse deslocamento às mangas de eixo, orientando as rodas.",
        "O motor EPS auxilia o mecanismo de direção; os semieixos conduzem o torque de propulsão em outro caminho.",
      ],
    },
    {
      title: "Vantagens e recursos possíveis",
      description:
        "Eficiência, conforto, consumo e recursos disponíveis dependem do projeto, da calibração e das condições do veículo. A presença de EPS não garante todos os recursos abaixo em uma aplicação.",
      items: [
        "Assistência elétrica sem bomba, reservatório ou mangueiras hidráulicas de direção na arquitetura EPS pura representada.",
        "Possibilidade de assistência variável conforme velocidade e demais informações previstas no gerenciamento.",
        "Integração com funções de assistência e segurança quando o veículo possui esses recursos.",
        "Configuração da resposta de assistência por software e calibração específicos da aplicação.",
        "Possibilidade de ganhos de eficiência energética e consumo em relação a outras soluções, conforme o conjunto do veículo.",
        "Construção e manutenção próprias da arquitetura; a quantidade de componentes e o custo de reparo não são universais.",
      ],
    },
    {
      title: "Pontos de atenção",
      groups: [
        {
          name: "Scanner e DTCs",
          text: "Relacionar códigos, parâmetros, alimentação e comunicação aos testes previstos. Um DTC isolado não identifica automaticamente a peça que precisa ser trocada.",
        },
        {
          name: "Chicote",
          text: "Inspecionar integridade, roteamento, fixação e sinais de atrito ou dano conforme a aplicação.",
        },
        {
          name: "Conectores",
          text: "Verificar travas, contato, corrosão e vedação. Alimentação elétrica e condições dos conectores influenciam o funcionamento da assistência.",
        },
        {
          name: "Ruídos, folgas e vibrações",
          text: "Relacionar o sintoma a terminais, barras, pivôs, bandejas, apoios e caixa, antes de atribuir a causa ao motor ou à eletrônica EPS.",
        },
        {
          name: "Alinhamento e calibração",
          text: "Após intervenções, seguir as verificações de geometria e executar calibrações somente quando previstas pelo fabricante para aquele componente e veículo.",
        },
      ],
    },
    {
      title: "Aplicações comuns",
      description:
        "EPS é utilizado em diversas famílias de veículos. As categorias abaixo são exemplos de uso e não confirmam compatibilidade das peças ilustradas com uma marca, modelo ou ano.",
      items: [
        "Hatches e sedãs compactos e médios.",
        "SUVs e crossovers.",
        "Picapes leves.",
        "Minivans e utilitários, conforme o projeto.",
      ],
    },
    {
      title: "Distinções entre os componentes",
      groups: [
        {
          name: "Torque e ângulo",
          text: "O sensor de torque informa esforço. A medição de ângulo de direção é outra grandeza e pode empregar sensores próprios ou integrações específicas.",
        },
        {
          name: "Direção e propulsão",
          text: "Barras axiais e terminais orientam as rodas; os semieixos levam o torque do diferencial às rodas motrizes. O motor EPS fornece assistência de direção.",
        },
        {
          name: "EPS e hidráulica dos freios",
          text: "A ausência de bomba e fluido de assistência refere-se à direção EPS pura. Os freios representados utilizam seu próprio circuito hidráulico.",
        },
        {
          name: "Local da assistência",
          text: "A referência usa assistência junto à caixa. Existem arquiteturas EPS com atuação na coluna, no pinhão ou na cremalheira, com construções e procedimentos diferentes.",
        },
      ],
    },
  ],
  notes: [
    "Ilustrações didáticas geradas para organizar a referência enviada. Não são fotografias de fabricante nem desenhos certificados de uma aplicação específica.",
    "A numeração 1 a 17 acompanha o cartaz e os componentes principais do interativo EPS existente. O item 15 reúne amortecedor e mola; cubos, mangas, coxins, estabilizadora e bieletas aparecem como contexto quando presentes.",
    "O exemplo utiliza motor de assistência junto à caixa e suspensão McPherson. Ele não define a construção de toda direção EPS nem confirma fornecimento individual de todos os elementos ilustrados.",
    "Forma, fixações, conexões, sinais, valores de teste, geometria e calibração dependem da aplicação. As imagens não fornecem pinagem, sequência de desmontagem ou compatibilidade de peças.",
  ],
};
