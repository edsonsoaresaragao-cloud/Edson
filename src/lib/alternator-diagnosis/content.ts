import { alternatorReferenceParts } from "../alternator-reference-catalog";
export const references = [
  {
    id: "denso",
    title: "DENSO Aftermarket — alternadores e diagnóstico",
    url: "https://www.denso-am.eu/",
    applicability:
      "Orientação geral; localizar manual e boletim do código exato.",
    date: null,
  },
  {
    id: "bosch",
    title: "Bosch Aftermarket — informação técnica e ESI[tronic]",
    url: "https://www.boschaftermarket.com/",
    applicability:
      "Procedimentos e diagramas conforme veículo e assinatura do serviço.",
    date: null,
  },
  {
    id: "valeo",
    title: "Valeo Service — sistemas elétricos",
    url: "https://www.valeoservice.com/",
    applicability: "Confirmar catálogo e instrução do alternador identificado.",
    date: null,
  },
  {
    id: "seg",
    title: "SEG Automotive — geração elétrica",
    url: "https://www.seg-automotive.com/",
    applicability: "Tecnologia e documentação do produto identificado.",
    date: null,
  },
  {
    id: "sae",
    title: "Catálogo SAE — consultar J2012, definições de DTC",
    url: "https://www.sae.org/standards",
    applicability:
      "Descrições genéricas OBD; validar edição e definição específica na montadora.",
    date: null,
  },
];
export const safety = [
  "Nunca desconectar a bateria com o motor funcionando para testar o alternador.",
  "Nunca curto-circuitar o terminal B+.",
  "Manter mãos, cabos e instrumentos longe de correias, polias e ventoinhas em movimento.",
  "Utilizar instrumentos, categoria de proteção, pontas e faixas adequados; respeitar a polaridade.",
  "Desenergizar antes de desmontar, conforme o fabricante.",
  "Não aplicar tensão em LIN, PWM ou pinos eletrônicos sem especificação e pinagem confirmadas.",
  "Não testar isolamento com eletrônica conectada. Isolar o componente conforme o manual.",
  "Alta tensão exige procedimento próprio e pessoal qualificado; este assistente trata de sistemas auxiliares de baixa tensão.",
  "Consultar diagramas, boletins e procedimentos oficiais antes de intervenções críticas.",
  "Não inserir multímetro em escala de corrente diretamente entre B+ e massa. Para corrente de saída, usar alicate DC adequado.",
];
export const checkStates = [
  "não testado",
  "aprovado",
  "reprovado",
  "não aplicável",
  "não sei",
] as const;
export const inspections = [
  ["batteryVisual", "Bateria: estado físico, fixação e sinais de vazamento"],
  ["terminals", "Limpeza e aperto dos terminais"],
  ["grounds", "Aterramentos bateria / motor / carroceria"],
  ["belt", "Correia auxiliar, tensor e alinhamento"],
  ["pulley", "Polia de roda livre / desacopladora, quando existente"],
  ["fuses", "Fusíveis e elos de alta corrente"],
  ["positiveCable", "Cabo B+ e conexões"],
  ["harness", "Chicote e conectores de comando"],
  ["contamination", "Água, óleo, corrosão ou superaquecimento"],
  ["batteryCapacity", "Teste de capacidade/carga da bateria"],
  ["excitation", "Alimentação e excitação conforme pinagem"],
  ["diodeBench", "Ensaio isolado da ponte retificadora"],
  ["statorBench", "Ensaio isolado do estator"],
  ["rotorBench", "Enrolamento e isolamento do rotor"],
  ["regulatorBench", "Regulador em bancada compatível"],
  ["brushes", "Escovas e anéis coletores"],
  ["lin", "Comunicação e integridade da linha LIN/PWM/BSS"],
  ["ibs", "Sensor IBS/BMS e gerenciamento"],
  ["parasitic", "Consumo após repouso e isolamento do circuito"],
  ["repair", "Teste de confirmação após reparo"],
] as const;
export const measures = [
  ["rest", "Tensão da bateria em repouso", "V", 0, 100],
  ["crank", "Tensão durante a partida", "V", 0, 100],
  ["idle", "Tensão em marcha lenta", "V", 0, 100],
  ["loaded", "Tensão com consumidores", "V", 0, 100],
  ["rpmVoltage", "Tensão em rotação de ensaio", "V", 0, 100],
  ["bplus", "Tensão diretamente no B+", "V", 0, 100],
  ["positiveDrop", "Queda positiva sob carga", "V", 0, 100],
  ["groundDrop", "Queda no aterramento sob carga", "V", 0, 100],
  ["current", "Corrente de saída (alicate DC)", "A", 0, 1500],
  ["ripple", "Ondulação medida", "V", 0, 100],
  ["rpm", "Rotação do motor no ensaio", "rpm", 0, 15000],
  ["temperature", "Temperatura ambiente / bateria", "°C", -60, 200],
  ["soc", "Estado de carga — SOC", "%", 0, 100],
  ["soh", "Estado de saúde — SOH", "%", 0, 100],
  ["ecu", "Tensão solicitada pela ECU", "V", 0, 100],
  [
    "excitationCurrent",
    "Corrente de excitação, quando especificada",
    "A",
    0,
    100,
  ],
  ["sleepCurrent", "Corrente após repouso do veículo", "A", 0, 100],
] as const;
export const stages = [
  {
    name: "Inspeção inicial",
    checks: [
      "batteryVisual",
      "terminals",
      "grounds",
      "belt",
      "pulley",
      "fuses",
      "positiveCable",
      "harness",
      "contamination",
    ],
    fields: [],
    learn:
      "Comece pelo acionamento e pelas conexões. Uma bateria descarregada, resistência nos cabos ou correia patinando pode imitar falha interna.",
    procedure:
      "Motor desligado para inspeção mecânica. Registre os itens, o método utilizado e a evidência observada.",
  },
  {
    name: "Teste da bateria",
    checks: ["batteryCapacity"],
    fields: ["rest", "crank", "soc", "soh", "temperature"],
    learn:
      "SOC indica carga disponível; SOH e capacidade descrevem condição da bateria. Baixo SOC não prova degradação.",
    procedure:
      "Use procedimento e equipamento compatíveis com convencional, EFB ou AGM. Registre repouso, temperatura, corrente nominal e resultado do testador. Corrija carga e repita o teste quando indicado.",
  },
  {
    name: "Tensão de carregamento",
    checks: ["excitation"],
    fields: [
      "rest",
      "idle",
      "loaded",
      "rpmVoltage",
      "bplus",
      "ecu",
      "soc",
      "temperature",
    ],
    learn:
      "13,8–14,5 V é apenas exemplo de alguns sistemas convencionais de 12 V. Carga inteligente pode reduzir ou elevar a tensão intencionalmente.",
    procedure:
      "Compare bateria e B+ nas mesmas condições de carga e rotação. Confira solicitação da ECU, temperatura e SOC; utilize limites da aplicação identificada.",
  },
  {
    name: "Queda positiva",
    checks: ["positiveCable", "fuses", "terminals"],
    fields: ["positiveDrop", "current", "rpm"],
    learn:
      "A queda mede a resistência do caminho quando há corrente. Medir sem carga pode ocultar um mau contato.",
    procedure:
      "Voltímetro entre B+ do alternador e polo positivo da bateria, sob carga especificada. Confirme polaridade e acesso seguro; não una os pontos com uma ponta de corrente.",
  },
  {
    name: "Queda no aterramento",
    checks: ["grounds"],
    fields: ["groundDrop", "current", "rpm"],
    learn:
      "O retorno da corrente passa pela carcaça, motor, carroceria e cabo negativo.",
    procedure:
      "Meça a diferença entre carcaça do alternador e polo negativo da bateria sob carga. Registre o módulo da queda e a polaridade observada. Investigue conexões, oxidação e cabos.",
  },
  {
    name: "Corrente de saída",
    checks: [],
    fields: ["current", "rpm", "soc", "temperature"],
    learn:
      "Corrente baixa pode ser consequência de pequena demanda ou estratégia de gerenciamento; não condena o alternador.",
    procedure:
      "Zere alicate amperímetro DC e abrace apenas o condutor de saída indicado pelo manual. Anote consumidores, rotação, temperatura, SOC e capacidade nominal.",
  },
  {
    name: "Ondulação / ripple",
    checks: ["diodeBench", "statorBench"],
    fields: ["ripple", "rpm", "current"],
    learn:
      "O estator gera CA e os diodos retificam. Uma forma de onda pode orientar a investigação, mas não identifica sozinha o componente defeituoso.",
    procedure:
      "Escolha método AC RMS ou osciloscópio pico a pico. Registre unidade, acoplamento, escala, base de tempo, carga e limite do mesmo método. Confirme retificador e enrolamentos em ensaio isolado.",
  },
  {
    name: "Sistema inteligente",
    checks: [
      "lin",
      "ibs",
      "harness",
      "rotorBench",
      "regulatorBench",
      "brushes",
      "parasitic",
    ],
    fields: [
      "ecu",
      "bplus",
      "soc",
      "current",
      "excitationCurrent",
      "sleepCurrent",
    ],
    learn:
      "ECU, BCM e módulo de energia podem comandar carga e monitorar a bateria. Comunicação, excitação e tensão são grandezas diferentes.",
    procedure:
      "Confirme LIN, PWM, BSS ou GENCOM/GENMON na documentação. Compare solicitação e resposta; verifique IBS/BMS, DTCs, registro da bateria e adaptações previstas. Não desconecte o comando como teste genérico.",
  },
];
const symptomsRaw = [
  [
    "Luz da bateria acesa com motor funcionando",
    [7, 9, 12],
    ["excitation", "fuses", "harness"],
  ],
  [
    "Bateria descarregando frequentemente",
    [7, 8, 9],
    ["batteryCapacity", "parasitic", "positiveCable"],
  ],
  ["Alternador não carrega", [5, 7, 8, 12], ["belt", "excitation", "fuses"]],
  [
    "Tensão de carregamento aparentemente baixa",
    [7, 12],
    ["batteryCapacity", "positiveCable", "ibs"],
  ],
  ["Tensão excessiva", [7, 12], ["grounds", "regulatorBench", "ibs"]],
  ["Carregamento intermitente", [8, 12], ["harness", "brushes", "belt"]],
  [
    "Faróis oscilando ou piscando",
    [6, 9],
    ["diodeBench", "statorBench", "grounds"],
  ],
  ["Ruído de rolamento", [3, 10], ["belt", "pulley"]],
  ["Chiado de correia ou polia", [1, 15], ["belt", "pulley"]],
  [
    "Cheiro de queimado",
    [6, 9, 12],
    ["contamination", "positiveCable", "statorBench"],
  ],
  [
    "Alternador superaquecendo",
    [2, 6, 9],
    ["contamination", "diodeBench", "batteryCapacity"],
  ],
  [
    "Bateria descarrega com veículo desligado",
    [9, 12],
    ["parasitic", "diodeBench"],
  ],
  [
    "Falha após substituição do alternador",
    [7, 12, 16],
    ["harness", "excitation", "ibs"],
  ],
  [
    "Falha de comunicação com alternador inteligente",
    [7, 12],
    ["lin", "harness", "ibs"],
  ],
  [
    "Falha de carga apenas com consumidores ligados",
    [1, 6, 9, 12],
    ["belt", "positiveCable", "grounds", "statorBench"],
  ],
] as const;
export const symptoms = symptomsRaw.map(([name, components, checks], i) => ({
  id: `s${i + 1}`,
  name,
  components,
  checks,
  description: `Investigar ${name.toLocaleLowerCase("pt-BR")}, registrando quando ocorre, carga elétrica, temperatura e rotação.`,
  causes: components.map((n) => alternatorReferenceParts[n - 1].name),
  tools:
    i === 7 || i === 8
      ? "Ferramentas de correia e polia, inspeção mecânica com sistema desenergizado."
      : "Multímetro, alicate DC, scanner e osciloscópio conforme o circuito confirmado.",
  expected:
    "Resultado compatível com o procedimento e a referência da aplicação; sem limite universal.",
  interpretation:
    "O sintoma seleciona verificações, sem confirmar uma peça. Compare evidências favoráveis e contrárias.",
  next: checks[0],
}));
const componentDetails = [
  [
    "Na entrada do eixo, junto à correia",
    "Transmissão mecânica; roda livre/desacoplamento quando previsto",
    "Patinação, travamento ou desalinhamento",
    "Inspecionar canais, alinhamento e função desacopladora com ferramenta própria. Nunca travar pás para soltar a polia.",
  ],
  [
    "Frente do rotor / apoio da polia",
    "Ventilação e apoio axial, conforme construção",
    "Ventilação obstruída, pás danificadas ou arruela ausente",
    "Inspecionar pás e passagem de ar, posição e apoio conforme desenho de montagem.",
  ],
  [
    "Alojamento da carcaça dianteira",
    "Rolamento suporta cargas radiais/axiais previstas",
    "Ruído, folga ou travamento",
    "Com conjunto isolado e desenergizado, avaliar giro, pistas e folga conforme procedimento.",
  ],
  [
    "Frente do conjunto",
    "Estrutura e alinhamento dos apoios",
    "Trincas, desgaste no alojamento ou fixação",
    "Inspecionar alojamentos e alinhamento sem estimar tolerância visualmente.",
  ],
  [
    "Eixo girante entre carcaças",
    "Campo magnético criado pela bobina alimentada pelas escovas",
    "Enrolamento aberto, curto, fuga à massa ou anéis desgastados",
    "Medir resistência entre anéis, isolamento para eixo e estado dos anéis com eletrônica isolada. Usar valores do código da peça; não aplicar megômetro no regulador.",
  ],
  [
    "Ao redor do rotor, fixo à carcaça",
    "Indução nas fases do enrolamento",
    "Fase aberta, curto entre espiras ou isolamento danificado",
    "Comparar fases e ensaiar isolamento somente no estator isolado, com método previsto. Associar à forma de onda e à corrente.",
  ],
  [
    "Conjunto traseiro / porta-escovas",
    "Modula corrente de campo conforme estratégia convencional ou pilotada",
    "Controle de excitação inadequado ou falha eletrônica",
    "Confirmar alimentação, massa, pinagem e comando antes do ensaio em bancada compatível; conferir tensão solicitada versus real.",
  ],
  [
    "Traseira, junto aos anéis do rotor",
    "Escovas mantêm contato elétrico com os anéis coletores",
    "Escovas curtas, presas, molas fracas ou contato irregular",
    "Inspecionar curso, comprimento especificado, molas, superfície e excentricidade dos anéis. Não confundir anéis contínuos com comutador.",
  ],
  [
    "Saída das fases, região traseira",
    "Diodos conduzem em um sentido e retificam a CA",
    "Diodo aberto, curto ou fuga sob temperatura/carga",
    "Isolar a ponte conforme manual; testar condução direta e reversa em cada caminho. Circuitos paralelos e fuga térmica podem exigir bancada.",
  ],
  [
    "Apoio traseiro do eixo",
    "Giro com alinhamento e baixo atrito",
    "Ruído, desgaste ou travamento",
    "Avaliar rolamento e seu apoio no conjunto isolado, com valores de folga específicos.",
  ],
  [
    "Parte traseira do alternador",
    "Suporte, ventilação e montagem elétrica",
    "Trincas, apoio deformado ou ventilação bloqueada",
    "Conferir alojamentos, fixações e passagens de ventilação antes de remontar.",
  ],
  [
    "B+ e conector de sinais na traseira",
    "Potência em B+ e sinais definidos pelo projeto",
    "Mau contato, resistência, oxidação, fio aberto ou curto",
    "Inspecionar B+, fusíveis e conectores; medir queda sob carga e sinais com pinagem confirmada. Não aplicar tensão aos pinos de dados.",
  ],
  [
    "Ao longo das carcaças",
    "Pré-carga de fixação do conjunto",
    "Afrouxamento, rosca danificada ou deformação",
    "Inspecionar roscas e comprimento; montar apenas com sequência e torque do fabricante.",
  ],
  [
    "Cobertura traseira",
    "Proteção dos circuitos e passagem de ar",
    "Quebra, fixação inadequada ou obstrução",
    "Inspecionar integridade e ventilação; assegurar afastamento dos terminais energizados.",
  ],
  [
    "Extremidade do eixo na polia",
    "Fixação mecânica da polia",
    "Afrouxamento ou rosca danificada",
    "Usar ferramenta apropriada e torque da aplicação; verificar trava e reutilização prevista.",
  ],
  [
    "Apoios e terminais conforme construção",
    "Posicionamento e separação elétrica",
    "Peça ausente, montagem incorreta ou fuga à massa",
    "Comparar a montagem com desenho oficial, medir isolamento com circuito isolado e conferir afastamentos.",
  ],
];
export const componentDiagnostics = alternatorReferenceParts.map((p, i) => ({
  ...p,
  location: componentDetails[i][0],
  principle: componentDetails[i][1],
  failures: componentDetails[i][2],
  procedure: componentDetails[i][3],
  symptoms: symptoms
    .filter((s) => s.components.some((n) => n === p.number))
    .map((s) => s.name),
  tools: [1, 2, 3, 4, 10, 11, 13, 14, 15, 16].includes(p.number)
    ? "Ferramentas mecânicas específicas, inspeção e instrumentos dimensionais."
    : "Multímetro, scanner, osciloscópio e bancada compatível conforme o teste.",
  expected:
    "Compare com referência do fabricante para código da peça, temperatura e método; valor não confirmado nesta ficha genérica.",
  criterion:
    "Reparar ou substituir somente após teste confirmatório documentado, excluindo causas externas. Repetir o ensaio após o reparo.",
}));
export const dtcs = [
  ["P0560", "Mau funcionamento da tensão do sistema", [7, 12]],
  ["P0562", "Tensão do sistema baixa", [7, 12]],
  ["P0563", "Tensão do sistema alta", [7, 12]],
  ["P0620", "Circuito de controle do gerador", [7, 12]],
  ["P0621", "Circuito de controle da lâmpada do gerador (L)", [7, 12]],
  ["P0622", "Circuito de controle do campo do gerador (F)", [5, 7, 8]],
  ["P0625", "Circuito do terminal de campo do gerador (F) baixo", [5, 7, 12]],
  ["P0626", "Circuito do terminal de campo do gerador (F) alto", [5, 7, 12]],
  ["P2503", "Tensão do sistema de carga baixa", [7, 9, 12]],
].map(([code, description, components]) => ({
  code: code as string,
  description: description as string,
  components: components as number[],
  system: "Alimentação / controle do sistema de carga",
  conditions:
    "Condições, limiares e tempo de detecção dependem da ECU e da aplicação.",
  causes:
    "Bateria, conexões, fusíveis, massa, chicote, comando, sensores ou geração; investigar conforme o circuito.",
  tests:
    "Registrar módulo, freeze frame e condições; medir alimentação, quedas e comandos; testar componentes isolados quando indicado.",
  confirmation:
    "Reproduzir e confirmar o teste previsto pela montadora. Um DTC isolado não confirma falha do alternador.",
  source: "sae",
}));
export const tools = [
  [
    "Multímetro automotivo",
    "Tensão e queda de tensão; AC RMS não equivale a pico a pico no osciloscópio.",
    "Paralelo aos pontos de tensão; nunca escala de corrente entre B+ e massa.",
  ],
  [
    "Alicate amperímetro DC",
    "Corrente de saída e, se adequado, consumo em repouso.",
    "Zerar e abraçar um único condutor, respeitando faixa e sentido.",
  ],
  [
    "Osciloscópio automotivo",
    "Ripple e comandos; forma, amplitude e temporização.",
    "Usar atenuação, referência de massa e isolamento adequados; não unir massas incompatíveis.",
  ],
  [
    "Scanner com funções avançadas",
    "DTC, parâmetros e testes bidirecionais suportados.",
    "Escolher veículo, módulo e função corretos; registrar solicitação e resposta.",
  ],
  [
    "Testador de bateria",
    "Capacidade, SOC e SOH conforme tecnologia e norma.",
    "Identificar AGM/EFB/convencional e corrente nominal antes do teste.",
  ],
  [
    "Fonte estabilizada",
    "Suporte elétrico quando o fabricante exigir.",
    "Conectar com polaridade, limitação e tensão prescritas; não substituir teste de carga.",
  ],
  [
    "Bancada de alternadores",
    "Ensaio controlado de geração, excitação e retificação.",
    "Compatível com protocolo, sentido, rotação e fixação do conjunto.",
  ],
  [
    "Ferramentas de polia e correia",
    "Inspeção e serviço do acionamento e desacopladora.",
    "Sistema parado/desenergizado; seguir travamento e torque da aplicação.",
  ],
].map(([name, purpose, connection], i) => ({
  id: i,
  name,
  purpose,
  connection,
}));
export const glossary = Object.entries({
  "B+": "Saída positiva de potência do alternador.",
  "D+": "Designação de terminal de excitação/indicador em algumas arquiteturas; confirmar esquema.",
  LIN: "Rede serial local de um fio, com protocolo e pinagem específicos.",
  PWM: "Modulação por largura de pulso; duty cycle não é valor de tensão de carga.",
  BSS: "Interface de comunicação de alternadores; confirmar implementação.",
  "GENCOM/GENMON":
    "Sinais de comando/monitoramento em determinadas aplicações.",
  Ripple: "Componente variável residual após retificação.",
  Rotor: "Conjunto girante que cria o campo magnético.",
  Estator: "Enrolamentos fixos onde se induz tensão.",
  Retificador: "Diodos que convertem CA em CC.",
  Regulador: "Controla excitação conforme a estratégia.",
  Excitação: "Corrente que estabelece o campo do rotor.",
  SOC: "Estado de carga da bateria.",
  SOH: "Indicador de estado de saúde da bateria, dependente do método.",
  "IBS/BMS": "Sensor e gerenciamento da bateria, conforme a arquitetura.",
});
