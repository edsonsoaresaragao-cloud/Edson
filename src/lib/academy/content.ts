/** Texto didático da Academy. As tabelas/classificações continuam nas páginas da fonte. */
export const COURSE_ID = "academy-aula-01-motores-v1";
export const LESSON_SLUG = "motores-que-batem-valvula";
export const LESSON_URL = `/academy/aulas/${LESSON_SLUG}`;
export const LESSON_TITLE = "AULA 01 — MOTORES QUE BATEM VÁLVULA";
export const LESSON_SUBTITLE =
  "Guia técnico de sincronismo, motores interferentes e diagnóstico de colisão entre pistões e válvulas.";
export const COURSE_HOURS = 4;
export const PASSING_SCORE = 70;
export type StudyStep = {
  id: string;
  title: string;
  kind: "intro" | "fundamentals" | "manufacturer" | "diagnosis" | "exam";
  page?: number;
  rows?: number;
  objectives: string[];
  explanation: string[];
  sourceAlert?: string;
  sourceTip?: string;
  focus?: string;
};
export const workshopCare = [
  "Não acione o motor de partida nem tente pegar no tranco se houver suspeita de perda de sincronismo ou colisão.",
  "Não gire comando e virabrequim de forma independente sem avaliar a posição segura indicada pelo fabricante.",
  "Não force uma resistência mecânica. Pare e investigue; girar à mão também pode causar contato e dano.",
  "Use as ferramentas e marcas da aplicação exata. Marcas de tinta ou semelhança visual não substituem o procedimento.",
  "Confira código do motor, ano, versão e configuração. Motores da mesma família podem ter procedimentos diferentes.",
  "Em correia em óleo, confirme óleo homologado, estado do sistema, intervalos e procedimento específicos; não aplique uma regra universal.",
];
export const diagnosticSteps = [
  [
    "Identifique o motor",
    "Registre código, ano, versão e configuração do veículo. Obtenha o manual de reparação correspondente; a tabela é referência educacional.",
  ],
  [
    "Recolha o histórico",
    "Anote como ocorreu a falha, ruídos, manutenção recente e tentativas de partida. Não repita o acionamento para reproduzir o sintoma.",
  ],
  [
    "Inspecione a distribuição",
    "Com o veículo imobilizado e a partida impedida conforme o manual, examine correia/corrente, dentes, guias, tensionadores, polias e contaminação. Preserve evidências.",
  ],
  [
    "Verifique o sincronismo",
    "Siga a posição de referência, ferramentas de bloqueio e sequência do fabricante. Não mova os eixos para procurar marcas sem antes definir posições seguras.",
  ],
  [
    "Avalie o risco de contato",
    "Considere a geometria e a aplicação exata. Sem confirmação confiável, trate o motor como interferente. Não libere rotação ou partida apenas pela aparência externa.",
  ],
  [
    "Considere o boroscópio",
    "Quando apropriado, observe pistões e câmaras com o procedimento de acesso correto. Marcas sugerem contato; ausência de marcas visíveis não comprova integridade ou vedação.",
  ],
  [
    "Avalie se a compressão pode ser testada",
    "Só faça teste dinâmico depois de confirmar que a rotação é segura e autorizada pelo procedimento. Suspeita de colisão impede usar o arranque como teste inicial. Valores vêm do fabricante.",
  ],
  [
    "Teste a estanqueidade, quando aplicável",
    "Posicione e imobilize o conjunto de forma segura segundo o procedimento; ar comprimido pode movimentá-lo. Investigue por onde o ar escapa: admissão, escape, cárter ou arrefecimento.",
  ],
  [
    "Interprete em conjunto",
    "Relacione sincronismo, imagens, compressão/estanqueidade e histórico. Fuga pelas válvulas exige investigar vedação; não comprova, sozinha, empenamento nem autoriza trocar peças sem inspeção.",
  ],
  [
    "Decida a desmontagem e confirme o reparo",
    "Evidência de contato, falha de vedação persistente ou dano mecânico justifica avaliar desmontagem do cabeçote. Inspecione válvulas, guias, sedes, pistões e distribuição conforme o manual. Corrija a causa, documente medições e faça validação segura antes da liberação.",
  ],
] as const;
export const fundamentals = [
  [
    "Quatro tempos",
    "Admissão: o pistão desce e admite a carga. Compressão: sobe com as válvulas fechadas. Expansão: a combustão impulsiona o pistão. Escape: o pistão sobe expulsando gases. É uma representação básica: os instantes reais de abertura/fechamento dependem do projeto.",
  ],
  [
    "Pistão e virabrequim",
    "A biela liga o pistão ao virabrequim e converte movimento alternado em rotação. PMS é a posição mais alta do pistão; ocorre tanto próximo ao fim da compressão quanto na transição escape/admissão.",
  ],
  [
    "Válvulas e árvore de comando",
    "Os ressaltos do comando controlam a abertura das válvulas de admissão e escape. Molas promovem o retorno na configuração convencional. Comando variável altera a fase dentro dos limites definidos pelo projeto.",
  ],
  [
    "Relação de sincronismo",
    "No motor de quatro tempos convencional, o virabrequim completa duas voltas para uma volta do comando: 720° e 360°, respectivamente. A relação 2:1 não define, por si só, as marcas de montagem.",
  ],
  [
    "Correia seca, corrente e correia em óleo",
    "São diferentes formas de transmitir movimento sincronizado. Cada uma exige componentes, lubrificação quando aplicável, tensionamento e manutenção próprios. Corrente também pode falhar; correia em óleo exige especificações de óleo e inspeção da aplicação.",
  ],
  [
    "Abertura e cruzamento",
    "O cruzamento é a região em que admissão e escape podem permanecer abertas perto do PMS entre escape e admissão. A folga para o pistão depende de fase, levantamento e geometria. Não use apenas o PMS para decidir se um eixo pode ser girado livremente.",
  ],
  [
    "Perda de sincronismo",
    "Dentes saltados, ruptura, falha de tensionamento ou montagem incorreta podem deslocar as fases. Podem ocorrer perda de funcionamento, colisão e danos. Não presuma dano ou ausência de dano sem diagnóstico.",
  ],
];
export const classifications = [
  [
    "Interferente",
    "Determinadas posições fora do sincronismo podem fazer pistões e válvulas ocuparem a mesma região e colidirem. A ocorrência e a extensão do dano precisam ser verificadas.",
  ],
  [
    "Não interferente",
    "Projeto em que, nas condições previstas, há espaço para evitar esse contato. A fonte exige confirmação técnica; não extrapole para outras versões, modificações ou condições anormais.",
  ],
  [
    "Sem fonte — trate como interferente",
    "É uma classificação de incerteza da referência. Não significa não interferente nem comprovação universal de interferência. Adote o procedimento conservador até confirmar a aplicação exata.",
  ],
];
export const studySteps: StudyStep[] = [
  {
    id: "introducao",
    title: "Introdução",
    kind: "intro",
    page: 1,
    objectives: [
      "Entender o objetivo da aula e as limitações da referência.",
      "Reconhecer as três legendas sem transformar incerteza em confirmação.",
    ],
    explanation: [
      "Nesta aula, você aprenderá a relacionar o movimento de pistões e válvulas, identificar a aplicação de um motor e organizar uma investigação segura de falha no sincronismo.",
      "A fonte visual é o mapa do Ponto do Motor fornecido para esta aula. A capa e as dez páginas técnicas permanecem na ordem original. Somente a indicação de bônus nos cabeçalhos foi adaptada; tabelas, imagens, notas, créditos e referências foram preservados.",
      "A aula distingue a informação da fonte, visível na página completa, das explicações didáticas da EDSON OFICINA Academy. As fontes citadas no rodapé do PDF não foram tratadas como manuais oficiais verificados por esta plataforma.",
      "Percurso de 4 horas: introdução (10 min), fundamentos (40 min), dez montadoras (12 min cada), diagnóstico (30 min), avaliação (20 min) e revisão (20 min). São horas de estudo previstas no programa, não um cronômetro de presença.",
      "Para concluir: marque as etapas estudadas, acerte a pergunta de cada montadora e obtenha ao menos 70% na avaliação final. O progresso fica vinculado à sua conta; a simples visita não conclui etapas. Depois, solicite o certificado verificável de participação em curso livre.",
    ],
  },
  {
    id: "fundamentos",
    title: "Fundamentos do sincronismo",
    kind: "fundamentals",
    objectives: [
      "Relacionar quatro tempos, PMS, comando e virabrequim.",
      "Comparar interferência e formas de acionamento da distribuição.",
    ],
    explanation: [
      "Use a ilustração interativa para relacionar movimentos. Ela é conceitual: não representa dimensões, marcas ou fase de um motor específico.",
      "Uma classificação só serve como ponto de partida. A confirmação de código, aplicação e procedimento precede qualquer intervenção.",
    ],
  },
  {
    id: "volkswagen",
    title: "Volkswagen",
    kind: "manufacturer",
    page: 2,
    rows: 11,
    objectives: [
      "Localizar AP, EA111, EA211, EA888 e Amarok na página 2.",
      "Interpretar a ausência de confirmação de não interferência nesta lista.",
    ],
    focus: "AP, EA111, EA211, EA888 e motores Amarok",
    explanation: [
      "Comece pelo código e pelas colunas motor, carros, tipo e válvula. A página contém onze linhas e inclui correia seca, corrente e campos ‘confira’. Não preencha esses campos por semelhança com outro motor.",
      "As onze linhas estão marcadas na fonte como ‘sem fonte — trate como interferente’. Isso é uma regra conservadora do material, não prova de que todas as variantes dessas famílias tenham a mesma geometria.",
      "A nota cita uma lista AERA/Gates para aplicações americanas antigas. Essa citação não confirma automaticamente o motor de um veículo brasileiro com ano ou configuração diferente.",
    ],
    sourceAlert:
      "A fonte alerta que nenhum motor VW desta lista tem fonte confiável de ‘não interferente’ e orienta tratá-los conservadoramente.",
    sourceTip:
      "O documento rejeita a fama de ‘AP não entorta válvula’ como comprovação e cita AERA/Gates (EUA, VW de 1976 a 1991). A orientação original sobre girar à mão deve ser lida com os cuidados da oficina abaixo: não force nem gire sem avaliar o risco.",
  },
  {
    id: "chevrolet",
    title: "Chevrolet",
    kind: "manufacturer",
    page: 3,
    rows: 11,
    objectives: [
      "Diferenciar as linhas das famílias I/II, SPE/4, Ecotec, CSS Prime e Duramax.",
      "Reconhecer o alerta específico da Família I 1.8 8V.",
    ],
    focus: "Famílias I e II, SPE/4, Ecotec, CSS Prime e Duramax",
    explanation: [
      "A Família I 1.8 8V aparece como interferente na referência. Não estenda essa marcação às demais cilindradas: cada linha precisa ser lida separadamente.",
      "O CSS Prime aparece com correia no óleo e sem fonte de interferência. Sistema de acionamento e classificação de interferência são informações diferentes. Use o procedimento exato para travamento, montagem e inspeção.",
      "Campos ‘confira’ em outros motores indicam que o sistema precisa ser confirmado, não que a manutenção seja dispensável.",
    ],
    sourceAlert:
      "Família I 1.8 8V: o material descreve contato de pistão e válvulas quando a correia rompe e alerta que um dente fora já é risco.",
    sourceTip:
      "CSS Prime: a fonte menciona pino no volante e ferramentas nos comandos. A aplicação, a posição e as ferramentas devem ser confirmadas no manual correspondente.",
  },
  {
    id: "fiat-jeep",
    title: "Fiat / Jeep",
    kind: "manufacturer",
    page: 4,
    rows: 12,
    objectives: [
      "Localizar Fiasa, Fire, Fire Evo, T-Jet, Torque, E.torQ, Firefly, GSE e diesel.",
      "Separar classificação de interferência do tipo de acionamento.",
    ],
    focus: "Fire, Firefly, E.torQ, GSE e demais linhas da tabela",
    explanation: [
      "A fonte marca Fire 1.0 8V como interferente. As outras linhas permanecem com o estado de incerteza indicado no documento; não use o nome Fire como classificação única.",
      "Correia seca e corrente aparecem em linhas distintas. Isso muda o procedimento e os componentes inspecionados, mas não permite deduzir sozinho se haverá colisão.",
      "A linha Ducato 2.3 F1A / 2.8 JTD aparece aqui, inclusive como referência cruzada do módulo Peugeot/Citroën. Mantenha a identificação por código e aplicação.",
    ],
    sourceAlert:
      "Fire 1.0 8V: o material confirma colisão se a correia romper e diz expressamente para não girar com o motor de partida.",
    sourceTip:
      "Fire 1.3/1.4 8V e Evo: o documento não apresenta fonte própria de interferência e orienta o mesmo cuidado conservador.",
  },
  {
    id: "ford",
    title: "Ford",
    kind: "manufacturer",
    page: 5,
    rows: 10,
    objectives: [
      "Distinguir CHT/AE, Zetec, Sigma, Ti-VCT, Dragon, EcoBoost, Duratec, Duratorq e EcoBlue.",
      "Identificar as linhas com correia no óleo sem generalizar procedimentos.",
    ],
    focus: "Zetec, Sigma, Ti-VCT, Dragon, EcoBoost e demais motores",
    explanation: [
      "As dez linhas são apresentadas sem fonte confiável para a classificação de interferência. A regra conservadora não é uma tabela universal de todas as aplicações Ford.",
      "A referência distingue corrente, correia seca e correia no óleo. Ti-VCT 1.0, Dragon 1.5, EcoBoost 1.0 e EcoBlue 2.0 aparecem nas linhas de correia no óleo desta página; confirme sempre a variante exata.",
      "Uma dica da fonte sugere duas voltas à mão em motor travado. Não a aplique literalmente a um motor com suspeita de contato: primeiro faça a avaliação mecânica e consulte o procedimento do fabricante. Resistência exige parar, nunca forçar.",
    ],
    sourceAlert:
      "A fonte declara não ter encontrado confirmação confiável de interferência para os motores Ford desta lista e adota tratamento conservador.",
    sourceTip:
      "A dica original sobre duas voltas e parada em caso de travamento permanece integralmente na imagem. Na aula, ela não constitui autorização para girar um motor cuja segurança não foi estabelecida.",
  },
  {
    id: "renault-nissan",
    title: "Renault / Nissan",
    kind: "manufacturer",
    page: 6,
    rows: 12,
    objectives: [
      "Diferenciar códigos D7D, D4D, K7M, K4M, F4R, B4D, H4M e demais referências.",
      "Interpretar corrente e correia sem presumir configuração idêntica.",
    ],
    focus: "Famílias Renault e Nissan, SCe, TCe e diesel da página 6",
    explanation: [
      "As doze linhas incluem famílias próximas no nome, mas com configurações distintas. Oito ou dezesseis válvulas, cilindrada e código fazem parte da identificação.",
      "Todas as classificações de interferência desta página permanecem no estado de incerteza da fonte. A presença de corrente em SCe e Nissan não prova ausência de risco.",
      "Inspecione marcas, guias e tensionamento conforme o manual antes de permitir rotação. A fase incorreta de uma corrente também pode permitir contato.",
    ],
    sourceAlert:
      "O documento declara não ter fonte confiável por motor Renault/Nissan nesta lista e orienta tratá-los como interferentes.",
    sourceTip:
      "A fonte lembra que uma corrente montada um dente fora também pode entortar válvula e recomenda conferir as marcas antes de girar.",
  },
  {
    id: "peugeot-citroen",
    title: "Peugeot / Citroën",
    kind: "manufacturer",
    page: 7,
    rows: 9,
    objectives: [
      "Localizar TU, EC5, EW10, PureTech, THP e diesel na página 7.",
      "Reconhecer o alerta de TU5 e EC5 sem extrapolar às demais linhas.",
    ],
    focus: "TU, EC5, EW10, PureTech, THP e diesel",
    explanation: [
      "TU5 1.6 16V e EC5 1.6 16V estão marcados como interferentes. As demais sete linhas mantêm a indicação de incerteza do documento.",
      "PureTech 1.2 EB2 aparece como correia no óleo, THP como corrente e outras linhas como ‘confira’. Confirme o código exato e a versão do sistema antes de selecionar peças ou definir manutenção.",
      "A nota sobre Ducato/Boxer/Jumper 2.3 Multijet F1A direciona ao mapa Fiat/Jeep. Ela não autoriza substituir a identificação do motor pela marca do veículo.",
    ],
    sourceAlert:
      "TU5 e EC5 1.6 16V: o material alerta para dano em válvulas e pistões se a correia romper.",
    sourceTip:
      "A referência cruzada do Ducato/Boxer/Jumper 2.3 Multijet F1A para o módulo Fiat/Jeep foi preservada.",
  },
  {
    id: "toyota",
    title: "Toyota",
    kind: "manufacturer",
    page: 8,
    rows: 8,
    objectives: [
      "Localizar famílias A, ZZ, NZ/NR, ZR, diesel, TR e M20A.",
      "Entender por que ausência numa lista não comprova não interferência.",
    ],
    focus: "Famílias A, ZZ, NZ/NR, ZR e demais códigos da fonte",
    explanation: [
      "As oito linhas têm a marcação ‘sem fonte — trate como interferente’. A fonte explica que a ausência dessas aplicações na lista consultada não comprova que não haja colisão.",
      "Os elos coloridos são uma referência de montagem conforme a aplicação. A posição esperada depois de girar o conjunto e o procedimento de conferência devem vir do manual, não de uma regra genérica sobre coincidência dos elos.",
      "Leia código, combustível, cilindrada e ano antes de relacionar Corolla, Etios, Yaris, Hilux ou SW4 a uma linha.",
    ],
    sourceAlert:
      "O documento não apresenta fonte confiável de classificação por motor Toyota da lista e rejeita a ausência na AERA/Gates como prova de não interferência.",
    sourceTip:
      "A fonte destaca o risco de montar a corrente um elo fora da marca e orienta conferir os elos coloridos antes da primeira volta, conforme o procedimento da aplicação.",
  },
  {
    id: "honda",
    title: "Honda",
    kind: "manufacturer",
    page: 9,
    rows: 6,
    objectives: [
      "Localizar D16, D17, L15/L13, R18/R20, K20 e 1.5 Turbo.",
      "Distinguir a evidência citada para D16 das linhas sem fonte.",
    ],
    focus: "D16, D17, L13/L15, R18/R20, K20 e 1.5 Turbo",
    explanation: [
      "A linha D16 1.6 aparece como interferente, enquanto a nota cita uma aplicação Civic 1.6 de 1988–89. Isso exige atenção ao alcance da referência: não transforme a nota numa confirmação de todo Civic até 2000.",
      "As cinco outras linhas continuam com classificação sem fonte. Semelhança de família, como D16 e D17, não substitui documentação própria.",
      "A página distingue correia seca e corrente. Identifique o motor antes de escolher ferramentas e avaliar posições seguras dos eixos.",
    ],
    sourceAlert:
      "D16: a nota cita a lista AERA/Gates para Civic 1.6 (1988–89) como interferente; preserve esse recorte ao interpretar a linha.",
    sourceTip:
      "D17: a fonte observa que pertence à mesma linha, mas sem fonte própria, e orienta tratá-lo conservadoramente como interferente.",
  },
  {
    id: "hyundai-kia",
    title: "Hyundai / Kia",
    kind: "manufacturer",
    page: 10,
    rows: 7,
    objectives: [
      "Localizar Kappa, Gamma, Nu, Beta, Smartstream e os diesel.",
      "Reconhecer o alerta específico do Beta 2.0 (G4GC) do Tucson.",
    ],
    focus: "Kappa, Gamma, Nu, Beta, Smartstream e motores diesel",
    explanation: [
      "Beta 2.0 G4GC aparece como interferente na referência. As outras seis linhas ficam no estado de incerteza; não transfira essa classificação para todos os motores da marca.",
      "Kappa, Gamma e Nu são mostrados com corrente; Beta com correia seca; outras aplicações pedem confirmação. O código e a configuração real precedem a escolha do procedimento.",
      "A dica sobre marcas no dorso da correia e folga no tensor é um sinal de inspeção da fonte. A decisão sobre troca de conjunto, causas e componentes precisa seguir o manual da aplicação.",
    ],
    sourceAlert:
      "Beta 2.0 (G4GC) do Tucson: a fonte menciona atropelamento de válvulas quando a correia arrebenta.",
    sourceTip:
      "A fonte orienta trocar também o tensor quando houver marcas de dente no dorso da correia e folga no tensor. Investigue a causa e confirme o escopo do reparo no fabricante.",
  },
  {
    id: "mitsubishi",
    title: "Mitsubishi",
    kind: "manufacturer",
    page: 11,
    rows: 7,
    objectives: [
      "Localizar 4G63, 4G64, 4D56, 4M41, 4N15, 4B11/4B12 e 4G94.",
      "Distinguir marcações de interferência e referências a aplicações específicas.",
    ],
    focus: "4G63, 4G64, 4D56, 4M41, 4N15 e demais referências",
    explanation: [
      "4G63 e 4G64 estão marcados como interferentes. A nota cita Galant/Eclipse 2.0 e Galant 2.4 dos EUA; a linha do mapa inclui outras aplicações. Preserve o recorte da fonte e confirme o veículo em questão.",
      "As outras cinco linhas continuam sem fonte de interferência no material. Não transforme 4D56 ou 4M41 em não interferentes por ausência de confirmação.",
      "A ilustração identifica comando e eixo de equilíbrio. São referências visuais, não uma sequência certificada de montagem: as posições e verificações precisam do procedimento do motor exato.",
    ],
    sourceAlert:
      "A nota cita AERA/Gates para 4G63 e 4G64 em aplicações americanas específicas; a classificação da tabela foi mantida integralmente.",
    sourceTip:
      "4D56 e 4M41: a fonte recomenda tratamento conservador e conferência das marcas antes de girar, sem apresentar confirmação própria de interferência.",
  },
  {
    id: "diagnostico",
    title: "Diagnóstico prático",
    kind: "diagnosis",
    objectives: [
      "Organizar uma investigação de suspeita de válvula empenada após falha no sincronismo.",
      "Definir quando testes de rotação são seguros e quando investigar o cabeçote.",
    ],
    explanation: [
      "O objetivo é confirmar a causa e a extensão do dano, não obter uma partida a qualquer custo. Nenhum valor universal de compressão, folga ou torque é fornecido aqui.",
      "A sequência abaixo é didática. As condições e os critérios de cada ensaio devem ser definidos com documentação e equipamentos apropriados à aplicação.",
    ],
  },
  {
    id: "avaliacao",
    title: "Avaliação final",
    kind: "exam",
    objectives: [
      "Aplicar os conceitos de interferência, identificação, manutenção e diagnóstico.",
      "Obter ao menos 70% em dez perguntas e revisar as explicações.",
    ],
    explanation: [
      "Responda às dez perguntas. A correção é feita no servidor, com explicação para cada alternativa correta. Você pode revisar o conteúdo e tentar novamente; uma tentativa abaixo de 70% não conclui esta etapa.",
    ],
  },
];
export const stepLessonId = (step: string) => `${COURSE_ID}:${step}`;
