export type ComponentKind = "sensor" | "actuator";
export type CatalogScope = "main" | "additional" | "all";

export type ComponentPhoto = {
  url: string;
  title: string;
  unavailable?: boolean;
};

export type TechnicalComponent = {
  id: string;
  kind: ComponentKind;
  scope: Exclude<CatalogScope, "all">;
  number: number;
  name: string;
  aliases: string[];
  system: string;
  function: string;
  inspection: string;
  note?: string;
  photo?: ComponentPhoto;
  illustrationIndex: number;
  explore?: { href: string; label: string };
};

// Referências enviadas pelo usuário. Os títulos não comprovam aplicação,
// autoria da fotografia nem compatibilidade de um código com outro veículo.
const photo = (
  token: string,
  title: string,
  unavailable = false,
): ComponentPhoto => ({
  url: `https://images.openai.com/static-rsc-4/${token}?purpose=inline`,
  title,
  ...(unavailable ? { unavailable: true } : {}),
});
const injection = {
  href: "/categorias/injecao-eletronica",
  label: "Explorar injeção",
};
const ignition = {
  href: "/categorias/ignicao/atual",
  label: "Explorar ignição atual",
};
const abs = { href: "/categorias/freios-e-abs", label: "Explorar ABS" };
const cooling = {
  href: "/categorias/arrefecimento",
  label: "Explorar arrefecimento",
};
const hvac = {
  href: "/categorias/ar-condicionado",
  label: "Explorar ar-condicionado",
};

export const technicalComponents: readonly TechnicalComponent[] = [
  {
    id: "sensor-ckp",
    kind: "sensor",
    scope: "main",
    number: 1,
    name: "Sensor de rotação (CKP)",
    aliases: ["virabrequim", "RPM", "crankshaft"],
    system: "Controle do motor",
    function:
      "Identifica rotação e posição do virabrequim para sincronizar injeção e ignição.",
    inspection: "Chicote, conector, sinal e roda fônica.",
    note: "O tipo de sensor e a forma de onda dependem do sistema. Compare o sinal com a especificação do fabricante.",
    photo: photo(
      "51HpZlsJW_8L_4lBXojK9v_YkW7DvUaw1nMMHWLv6SZASYKdSiFBwNdDliN93rF83olXf_z_P8IADsBn9wtdyozb4s4QTMSz_9Ub3K4hzoZzoozsn-vpKJaT3g1-c4jpmO-3tDaQ_seajmRboT1NKhUwtf_1oSrbgYH4z1nKBV8",
      "Bosch 0281002778 RPM / Crankshaft Sensor",
    ),
    illustrationIndex: 0,
    explore: ignition,
  },
  {
    id: "sensor-cmp",
    kind: "sensor",
    scope: "main",
    number: 2,
    name: "Sensor de fase (CMP)",
    aliases: ["comando de válvulas", "camshaft", "Sigma"],
    system: "Controle do motor",
    function:
      "Informa a posição do comando de válvulas para sincronização dos cilindros.",
    inspection: "Alimentação, aterramento e sinal.",
    photo: photo(
      "hId-ZdseK5NJ1GbHyvDDjBveimAvIGKLgjw1OwT3qCIReR82xLZPJRpFB9ybhAJnngdKiBX_2F9mYeWdJXsicLuHxe-S8-aNm_EfFA2OYrjRf_97sg-qYfiWV9JkqeIftdSry02WmR8QkUuRWRCOMDnCEZTc5xHTEQm2o45PZAE",
      "Sensor Fase NOVO KA 1.5 2015–2019 SIGMA 9s6g1 — 3563 — 70313 — UMEC",
    ),
    illustrationIndex: 1,
    explore: ignition,
  },
  {
    id: "sensor-map",
    kind: "sensor",
    scope: "main",
    number: 3,
    name: "Sensor MAP",
    aliases: ["pressão absoluta", "coletor de admissão"],
    system: "Injeção eletrônica",
    function:
      "Mede a pressão absoluta do coletor de admissão para calcular a carga do motor.",
    inspection: "Leitura de pressão, vedação e conector.",
    photo: photo(
      "1cM-4r6JdpuWRKYJcFm0q78tN03GcndtTetOvkUE5XNGdH9c9VFbvuMOfEb3ReqkAst8JkTG-CdjFB9eGF6w2oq-bIJ3g9qt9tJBb33RjJU1iVjQ87WtOpQtwcPsG_7mj-xSxn6TxIqqE2CNKk0wZaIf3IWwx4z-pRqXK5-etR0",
      "Sensor MAP Vectra / Omega / Captiva / Zafira — 0261230217 — Swiss Auto Peças",
    ),
    illustrationIndex: 2,
    explore: injection,
  },
  {
    id: "sensor-maf",
    kind: "sensor",
    scope: "main",
    number: 4,
    name: "Sensor MAF",
    aliases: ["massa de ar", "fluxo de ar", "debímetro"],
    system: "Injeção eletrônica",
    function:
      "Mede a massa de ar admitida, auxiliando no cálculo do combustível.",
    inspection: "Filtro de ar, contaminação e dados no scanner.",
    photo: photo(
      "w9xm9rLiwcDZ3Qc6ucqA_yMhl3yF1bRTjAgeY_mjQoXALJVB2gu97oQTVbOZ2L2FxVHoptnQQ0ZdIEUCYL-3xAI8-OomacQYT9x89DSAdY_BsMVfO_VdH89A54RUljccbc8V01hRmNShBKd6ezobsy7dF1A5lz-hx8ZLOklPtfU",
      "0 281 002 896 BOSCH Mass air flow sensor HFM-6-CI — AUTODOC",
    ),
    illustrationIndex: 3,
    explore: injection,
  },
  {
    id: "sensor-ect",
    kind: "sensor",
    scope: "main",
    number: 5,
    name: "Sensor de temperatura (ECT)",
    aliases: ["líquido de arrefecimento", "água", "coolant"],
    system: "Arrefecimento",
    function:
      "Informa a temperatura do líquido de arrefecimento para ajustes do motor.",
    inspection: "Leitura a frio, conector e resistência conforme manual.",
    photo: photo(
      "grMz2FNa7_g9aKcwvPVWbrtCVUxMlQXVQaRmJpUxfTAbJp91_XWxuBWGwO6IuJaPwya2lND3-g7qgdvv_BKg4Uz8tFtzC35Vo7gIhz12CiWXllCqqPwEORz-rjqGnBSys6oqJpXhQRK-3GyJAsI29WF8tLQoXSOaQV8nU97fpnk",
      "BeckArnley 158-0421 Coolant Temp Sensor — Walmart",
    ),
    illustrationIndex: 4,
    explore: cooling,
  },
  {
    id: "sensor-iat",
    kind: "sensor",
    scope: "main",
    number: 6,
    name: "Sensor IAT",
    aliases: ["temperatura do ar", "admissão"],
    system: "Injeção eletrônica",
    function:
      "Mede a temperatura do ar de admissão e auxilia no gerenciamento da mistura.",
    inspection: "Temperatura indicada e mau contato.",
    photo: photo(
      "lqSCPycd6sZx1EvjEJdUoUUzcOoesrGx5cGhRZvlA7KT57SQVIHywZXH5GB1iauGBN4ULKIsfbeczfydJvCQq8MoBUI6FIsOtKYG7Z6uBbRKxPQxEXTiUODZfkeEWfO4VlubC-dCEhcv70v9Am_-QmNIkC8ZiNLBlnFANQb_vcM",
      "Bosch 0280130085 Air Intake Temperature Sensor",
    ),
    illustrationIndex: 5,
    explore: injection,
  },
  {
    id: "sonda-lambda",
    kind: "sensor",
    scope: "main",
    number: 7,
    name: "Sonda lambda",
    aliases: ["oxigênio", "O2", "pré-catalisador", "pós-catalisador"],
    system: "Emissões",
    function:
      "Monitora o oxigênio nos gases de escape para o controle da mistura e das emissões.",
    inspection: "Aquecedor, chicote e sinal conforme tipo de sonda.",
    note: "A sonda anterior ao catalisador normalmente participa do controle da mistura; a posterior monitora a eficiência do catalisador, conforme o sistema. A referência enviada é de uma sonda pós-catalisador.",
    photo: photo(
      "4Fgz3n-2xiUAgKeWWxZMIQArbMh4WBk7doaolzbjyzekx-YReeb2mhhZ-wcb_-CGrTq785n0itv28DUUtMmbtmxpUEj9LQZxjzJPpAlE7WpmmjJgFsqhLhjuePWAQyxCCXr_FgMJ2OQ6xYVZDNPbCNjYqLKTgdBPk607xfahF28",
      "Sonda Lambda Pós Catalisador Nissan Kicks — NGK OZA755-EE13 — KarHub",
    ),
    illustrationIndex: 6,
    explore: injection,
  },
  {
    id: "sensor-ks",
    kind: "sensor",
    scope: "main",
    number: 8,
    name: "Sensor de detonação (KS)",
    aliases: ["knock", "avanço", "batida de pino"],
    system: "Ignição",
    function:
      "Detecta vibrações características da detonação e permite corrigir o avanço da ignição.",
    inspection: "Fixação, torque e integridade do chicote.",
    note: "Respeite o torque e a superfície de apoio indicados pelo fabricante.",
    photo: photo(
      "rUT8s9AkK0JQS6Dipxj7--WyHKbBQMs_RwrGZ65pL-s7BhID6zAotLCPi1Hta7WY3xtg2TihCZ3c9g6EP4r0KwBw2g0Xrg4WFgbWuLIZGSltn-WHx5Bwwm7ldtg5oaZ_1_8JeDkrV0Gw91W3qVDu5i4z6INSMBaKhxs0NGDz9IU",
      "BOSCH Knock Sensor 0261231173 — FleetPride",
    ),
    illustrationIndex: 7,
    explore: ignition,
  },
  {
    id: "sensor-tps",
    kind: "sensor",
    scope: "main",
    number: 9,
    name: "Sensor TPS",
    aliases: ["posição da borboleta", "aceleração"],
    system: "Injeção eletrônica",
    function: "Informa a posição e abertura da borboleta de aceleração.",
    inspection: "Variação do sinal e possíveis falhas intermitentes.",
    photo: photo(
      "uU88Mlp0hHci9dormOHAIYYEeotbVr1FboRzKZpIqk5ZQWW7AkpZ9lRtuFS6ttdGfECBgCzqRe6wCuwC1G6EPYPIIKU0JgcSm_4Ayb8L8gKw8Lf1OYhpoPRFQM81D7wIbLX9qjhIiVrjUFTf7mZzp0k-nNZVi76CfSaTaWbPnX4",
      "Santech Throttle Position Sensor (TPS) TP0121 — AutoZone",
    ),
    illustrationIndex: 8,
    explore: injection,
  },
  {
    id: "sensor-abs",
    kind: "sensor",
    scope: "main",
    number: 10,
    name: "Sensor ABS",
    aliases: ["velocidade da roda", "rotação das rodas", "ESC", "estabilidade"],
    system: "Freios e ABS",
    function:
      "Monitora a velocidade individual das rodas para os sistemas ABS e estabilidade.",
    inspection: "Cabo, anel magnético e sinal de rotação.",
    note: "O captador pode trabalhar com anel magnético ou roda dentada, conforme a aplicação.",
    illustrationIndex: 9,
    explore: abs,
  },
  {
    id: "sensor-pressao-combustivel",
    kind: "sensor",
    scope: "main",
    number: 11,
    name: "Sensor de pressão do combustível",
    aliases: ["rail", "flauta", "fuel pressure"],
    system: "Combustível",
    function: "Monitora a pressão do combustível na linha ou no rail.",
    inspection: "Pressão solicitada versus real e conectores.",
    note: "Use procedimentos e instrumentos próprios para a faixa de pressão do sistema.",
    photo: photo(
      "yLwqsPmObeeNsxawUUzfo82DBCN3MHZ5EBXvdf5kof5BwU50kdiIv1X0iPgyiu3mK4XbxKF8jBvOycELFkMeJrzH2M7hQZU1G10fKFJ-1vm8pruWX-RWu2Q6dTi7bK3ezmBkcUj1v8ZTJFbHRPvlTFwDxlH8tSqdwsEE-HzqqUI",
      "Bosch 0281002937 — Fuel Injection Fuel Rail Pressure Sensor",
    ),
    illustrationIndex: 10,
    explore: injection,
  },
  {
    id: "sensor-app",
    kind: "sensor",
    scope: "main",
    number: 12,
    name: "Sensor do pedal (APP)",
    aliases: ["acelerador", "pedal eletrônico", "drive by wire"],
    system: "Injeção eletrônica",
    function: "Informa à ECU a solicitação de aceleração feita pelo motorista.",
    inspection: "Correlação dos sinais redundantes e chicote.",
    photo: photo(
      "Euu83uSjjp2o1U5GD_CzZKZxQQg3n1ryziHXGJ6aaGKlwJ6-BZBWrC8pMzDupPKrg4RAOG84aUz5t0Am71AZflThpyLTZQlPBOiUF0aexv9H66ZCyUeHekn6pj981Z_zOmzJLxsz7F5ebtzXJr9GF_ArOjxcPll-DFzo76Z6xNY",
      "Accelerator-pedal module",
    ),
    illustrationIndex: 11,
    explore: injection,
  },
  {
    id: "bico-injetor",
    kind: "actuator",
    scope: "main",
    number: 1,
    name: "Bico injetor",
    aliases: ["injetor de combustível", "injector"],
    system: "Injeção eletrônica",
    function: "Dosa e pulveriza o combustível conforme o comando da ECU.",
    inspection: "Estanqueidade, vazão, pulsos e vedadores.",
    photo: photo(
      "o9onpoPBZ31WXUxwv4dBafT4xupPqpYl7NpFldWQbIbM9LnIQ3_D5H4FaVLmQKmd_3cFOwuOQsxhovV8aIrHYkeChYjX9fswaDBdGma8ZOXRZB1VrVeG7XiXQtEC52JMOizLYLvUfZBp2UDFsEyC1OxaPJmnPL2d5JPj0wgvMrI",
      "0 280 158 034 BOSCH Injector EV-14-CL — AUTODOC",
    ),
    illustrationIndex: 12,
    explore: injection,
  },
  {
    id: "bobina-ignicao",
    kind: "actuator",
    scope: "main",
    number: 2,
    name: "Bobina de ignição",
    aliases: ["coil on plug", "COP", "caneta", "bobina em régua"],
    system: "Ignição",
    function:
      "Eleva a tensão elétrica necessária para produzir a centelha na vela.",
    inspection: "Isolamento, falhas de combustão e alimentação.",
    note: "A bobina pode ser individual ou atender mais de um cilindro. A ilustração representa o formato caneta; a foto enviada tem outra configuração.",
    photo: photo(
      "X6Om0h3yLdnP4uhz97SFco2DMDCRRO_j3yg_5Kpr2gYZ_69Edpa-3V3zIuUnH_Jgjls8xgDlDMhsPcEDczlJgDzzIPH6VxvtmNIFZF1SbYgIo4mnSYAvEK8tHm6hNW9mmH_yGFOAHlrVzRjsPtxNp-ocK1pK4mpF9Rb5-uuP-HQ",
      "NGK U5027 Ignition Coil Pack — Pit Stop USA",
    ),
    illustrationIndex: 13,
    explore: ignition,
  },
  {
    id: "corpo-borboleta",
    kind: "actuator",
    scope: "main",
    number: 3,
    name: "Corpo de borboleta eletrônico",
    aliases: ["TBI", "ETC", "DBW", "e-throttle"],
    system: "Injeção eletrônica",
    function: "Motoriza a abertura da borboleta e regula a entrada de ar.",
    inspection: "Sujeira, posição comandada e adaptação.",
    note: "Limpeza e reaprendizado seguem o procedimento específico do fabricante.",
    photo: photo(
      "HI7ng3n43Zg4X-_VGzpFdSF0OYTh39ZkG-mLGCFvUjN6nB6dQCwD08Pf2HwLeeiCvro-LgsXofpbwRsOKIEA7ky3YpOBTmwEA8V90gclnJnwN30M0hAmSMWnjvexQ0z4OO-k0-vCGyLSAfF9GGlZ_ebY5FMnbPz8ObTu9MFUH0I",
      "Genuine Bosch E-throttle (DBW) — Outsider Garage",
    ),
    illustrationIndex: 14,
    explore: injection,
  },
  {
    id: "atuador-iac",
    kind: "actuator",
    scope: "main",
    number: 4,
    name: "Atuador de marcha lenta (IAC)",
    aliases: ["motor de passo", "idle air control"],
    system: "Injeção eletrônica",
    function:
      "Regula a passagem de ar de marcha lenta nos sistemas que utilizam atuador separado.",
    inspection: "Movimento, carbonização e anel de vedação.",
    note: "Muitos motores com borboleta eletrônica controlam a marcha lenta pela própria borboleta e dispensam um IAC separado.",
    photo: photo(
      "maYiMhKz5whkRmzCKaLX5yMdDAyA9TLp-bgbCZBPlLCuBKJR7vZV59Oc0CH7VOyp9sQiJCOLfwKZ3QqsFL5RX_mx8yl82xXqJga5mpf1e2wgiaFd8gw5nYeYbIuqAINkreQka7gfX-ANuNcxUvXRFQ9HXCdtLJs-J1rxTKlgqfQ",
      "Motor paso a paso (IAC) BOSCH F 000 99M 150",
    ),
    illustrationIndex: 15,
    explore: injection,
  },
  {
    id: "bomba-combustivel",
    kind: "actuator",
    scope: "main",
    number: 5,
    name: "Bomba elétrica de combustível",
    aliases: ["bomba do tanque", "módulo de combustível"],
    system: "Combustível",
    function: "Envia combustível do tanque ao sistema de alimentação.",
    inspection: "Pressão, vazão, corrente e alimentação elétrica.",
    photo: photo(
      "VEafgzqR-it5a1EH8E31eZCJ5Asd4ozlIwK9m4PDb9KtWzH9hS4t4nWmNnbRk6Q6goVXT4YvBqfbM9IIK65L7qmBrx-9z3_YTztxBgqL1C4_NIaiuOPZCoMUWoZm5MB2RmIkHFRqyAdUZbycI1pDVwv7DjcFscf6gR5013zucwE",
      "0 986 580 386 BOSCH Kraftstoff-Fördereinheit elektrisch — AUTODOC",
    ),
    illustrationIndex: 16,
    explore: injection,
  },
  {
    id: "valvula-canister",
    kind: "actuator",
    scope: "main",
    number: 6,
    name: "Válvula de purga do cânister",
    aliases: ["EVAP", "canister", "purge"],
    system: "Emissões",
    function:
      "Controla a passagem de vapores de combustível do cânister para a admissão.",
    inspection: "Estanqueidade, acionamento e mangueiras.",
    photo: photo(
      "2C58J9BJuak7kBzvGHBkthsZwyvhOzhK-DRkQ18XtphCIz1-Pwm1lCuBIwQWDym8CGkn3Sk9x3shfLTBVzHI8hac5kyofQyL78fDX4uerKBigihm2PWBN0UsGuqlDeJOnILpWfsEYTSVrWxwrGqMEZA2Kc1hnxqeYPkF1XAvmlA",
      "Bosch BOS-0280142427 Canister Purge Valve — Topspeed Automotive",
    ),
    illustrationIndex: 17,
    explore: injection,
  },
  {
    id: "valvula-egr",
    kind: "actuator",
    scope: "main",
    number: 7,
    name: "Válvula EGR",
    aliases: ["recirculação", "NOx"],
    system: "Emissões",
    function:
      "Controla a recirculação dos gases de escape para reduzir emissões, especialmente NOx.",
    inspection: "Travamento, carbonização e posição.",
    photo: photo(
      "1A8BNnOOmIlV0fBu0DVYHq_nSe16c9czHmH5DEAqmrz7jRtJK5Xw0sJ_kbpByJNpj0pJZqnCWD-aSXgatA1nnL30cIXvY5w-JYuiVz9SEZjx9LBncbewkJzyAk6zUjfwzZxgs_Eo1Rh9VsWUEmaJVad-b186-vbpuZK7FN6ovHQ",
      "7.24809.77.0 PIERBURG Vanne EGR électrique — AUTODOC",
    ),
    illustrationIndex: 18,
    explore: injection,
  },
  {
    id: "solenoide-vvt",
    kind: "actuator",
    scope: "main",
    number: 8,
    name: "Solenoide VVT",
    aliases: ["OCV", "comando variável", "faseamento", "óleo"],
    system: "Controle do motor",
    function:
      "Direciona o fluxo de óleo para modificar o faseamento do comando de válvulas.",
    inspection: "Óleo, tela de filtragem e atuação elétrica.",
    photo: photo(
      "L4hDzM3uX0-Fk61P8y9c_PR73CZ7DV973Clw9aG9bSbgImgnXFwYuhMK_eTZOVWmszcfGnNgrqerSjTr-qO42AvGjBRC41dxabWYE0Qb-_XipiZO9HuKGGwJUfVwge-g4ZTlIow7414bOHbt2ISOusj7j6DZusTwQ0NHyC_Ksto",
      "Engine Variable Timing Solenoid Oil Control Valve 55567050 GM 1.6L / 1.8L — Dominion Parts",
    ),
    illustrationIndex: 19,
    explore: injection,
  },
  {
    id: "atuador-wastegate",
    kind: "actuator",
    scope: "main",
    number: 9,
    name: "Atuador da wastegate",
    aliases: ["turbo", "pressão de sobrealimentação", "válvula de desvio"],
    system: "Turbo",
    function:
      "Controla a válvula de desvio dos gases de escape do turbocompressor.",
    inspection: "Movimento, comando e pressão de sobrealimentação.",
    note: "Wastegate e geometria variável são mecanismos diferentes. O título da foto enviada identifica apenas um atuador de turbo; confirme o mecanismo antes de associá-la à peça do veículo.",
    photo: photo(
      "Qx2dr2t70Xbxh1Tw68JzlusJFsq5iUdU6-DiGSEMEdjOUswXg-3dEG8V5a9-TIz75CpXGWzuLM-YJBOmCgJAx5y7x8q5SuT9fy1RjDIc0cDwDCkulHzPU_q3RgMTXjlTd0ji353tWuf5oHz8Z8B_TmhRGU2AvxWHPvyonh2-hWM",
      "Audi A3 / Volkswagen Golf / Passat / Skoda Turbo Actuator 2.0 TDI — 03L198716B",
    ),
    illustrationIndex: 20,
  },
  {
    id: "eletroventilador",
    kind: "actuator",
    scope: "main",
    number: 10,
    name: "Eletroventilador",
    aliases: ["ventoinha", "radiador", "PWM"],
    system: "Arrefecimento",
    function: "Força a passagem de ar pelo radiador quando necessário.",
    inspection: "Motor, relés ou módulo PWM e rotação.",
    photo: photo(
      "CBQaVzFXTgeSZoRgdL18HLttFiYEv3Pu6yDkXAMdy3qdNwukF_Wm4nA6AOGsZdMvZoBXVE8TfNzo4GRHsmAcuBrvByj8XZpDW7g63svJElNJ4VJyf92vRNg1wc-9DwIU_11zq9Zc9m-bXvXaObFtoAfbh9s4yYMg9_WnKHS4yOA",
      "Ventoinha / Eletroventilador / Defletor Palio Siena Strada GMV — DVR Distribuidora",
    ),
    illustrationIndex: 21,
    explore: cooling,
  },
  {
    id: "solenoide-cambio",
    kind: "actuator",
    scope: "main",
    number: 11,
    name: "Solenoide do câmbio automático",
    aliases: ["transmissão", "corpo de válvulas", "trocas de marcha"],
    system: "Transmissão",
    function:
      "Regula fluxos e pressões hidráulicas usados nas trocas de marcha.",
    inspection: "DTCs, corrente, óleo e testes comandados.",
    note: "A referência enviada tem o título de uma tela de verificação. Por isso, esta ficha usa uma ilustração didática gerada.",
    photo: photo(
      "rrg_2gLi-CAN74MWdt04TTODjlEkPdP8gx5sHuLR29kgin8Uog6wVNJSvgKGLVMGZzfVZeqOUlhGhQUX_ZSaF6lpQy3WCVhmUg2ja8EXCq4V2HrDZrus3Bhi60btUNgBf4zLGrwBu-i5_wPLqSVD4sRRVScHaUueytnqnSeT0QE",
      "Verify Your Identity",
      true,
    ),
    illustrationIndex: 22,
  },
  {
    id: "solenoide-partida",
    kind: "actuator",
    scope: "main",
    number: 12,
    name: "Solenoide do motor de partida",
    aliases: ["automático de partida", "arranque", "starter"],
    system: "Partida",
    function:
      "Desloca o pinhão de acionamento e fecha o contato elétrico de potência do arranque.",
    inspection: "Tensão sob carga, contatos e acionamento.",
    photo: photo(
      "kurWiMDqLOQJhZ2IPevt_BDwTCCftOsGG-fuHnAaHazh1KbhR_4XQTRizxfMs2rGMLGNNMgiF2mcTxBjAJexlc51bAPyN6za8EZxPYDdoFF-A9Vpks02y61ipI72aOtPgdtZDWD65Z5NBVNZKG9gTRnX6C2NSw6h10QvJSwYTGs",
      "Starter Solenoid S66-0224 — BOSCH Starter Solenoid",
    ),
    illustrationIndex: 23,
    explore: { href: "/categorias/ignicao", label: "Explorar partida" },
  },
  {
    id: "sensor-pressao-oleo",
    kind: "sensor",
    scope: "additional",
    number: 1,
    name: "Sensor de pressão de óleo",
    aliases: ["lubrificação", "interruptor de óleo"],
    system: "Controle do motor",
    function:
      "Informa a pressão do óleo ao gerenciamento ou ao painel, conforme a aplicação.",
    inspection:
      "Nível e condição do óleo, vazamentos, conector e comparação com manômetro conforme manual.",
    note: "Um interruptor de pressão sinaliza um limite; um sensor pode fornecer uma leitura variável. Confirme qual componente equipa o veículo.",
    illustrationIndex: 24,
  },
  {
    id: "sensor-vss",
    kind: "sensor",
    scope: "additional",
    number: 2,
    name: "Sensor de velocidade (VSS)",
    aliases: ["velocímetro", "vehicle speed"],
    system: "Transmissão",
    function:
      "Informa a velocidade do veículo aos módulos que utilizam esse sinal.",
    inspection:
      "Chicote, conector, acionamento e comparação da leitura com os demais sinais de velocidade.",
    note: "Alguns veículos calculam a velocidade a partir dos sensores de roda e não utilizam um VSS separado.",
    illustrationIndex: 25,
  },
  {
    id: "sensor-pressao-ac",
    kind: "sensor",
    scope: "additional",
    number: 3,
    name: "Sensor de pressão do ar-condicionado",
    aliases: ["refrigerante", "transdutor", "pressostato"],
    system: "Climatização",
    function:
      "Informa a pressão do circuito de refrigerante para o controle e a proteção do ar-condicionado.",
    inspection:
      "Conector, alimentação e comparação da leitura com equipamento de serviço adequado.",
    note: "Sensor e pressostato têm estratégias de sinal diferentes. Siga o procedimento específico do circuito.",
    illustrationIndex: 26,
    explore: hvac,
  },
  {
    id: "sensor-velocidade-cambio",
    kind: "sensor",
    scope: "additional",
    number: 4,
    name: "Sensor de velocidade do câmbio",
    aliases: ["rotação de entrada", "rotação de saída", "ISS", "OSS"],
    system: "Transmissão",
    function:
      "Monitora a rotação de eixos de entrada ou saída para o gerenciamento da transmissão.",
    inspection:
      "DTCs, chicote, conector e coerência das rotações em dados ao vivo.",
    illustrationIndex: 27,
  },
  {
    id: "sensor-nivel-combustivel",
    kind: "sensor",
    scope: "additional",
    number: 5,
    name: "Sensor de nível do combustível",
    aliases: ["boia", "tanque", "marcador"],
    system: "Combustível",
    function:
      "Informa o nível de combustível do tanque ao painel ou ao módulo de controle.",
    inspection:
      "Movimento da boia, conectores e variação do sinal conforme a especificação.",
    illustrationIndex: 28,
  },
  {
    id: "sensor-tpms",
    kind: "sensor",
    scope: "additional",
    number: 6,
    name: "Sensor TPMS dos pneus",
    aliases: ["pressão dos pneus", "válvula TPMS"],
    system: "Pneus e rodas",
    function:
      "No TPMS direto, mede a pressão do pneu e transmite os dados ao veículo.",
    inspection:
      "Pressão com calibrador, bateria, comunicação e identificação com ferramenta compatível.",
    note: "TPMS indireto estima alterações pelos sinais das rodas e não utiliza sensores de pressão dentro dos pneus.",
    illustrationIndex: 29,
  },
  {
    id: "sensor-angulo-direcao",
    kind: "sensor",
    scope: "additional",
    number: 7,
    name: "Sensor de ângulo da direção",
    aliases: ["SAS", "volante", "estabilidade"],
    system: "Direção",
    function:
      "Informa o ângulo e, conforme o sistema, a velocidade de giro do volante aos módulos de direção e estabilidade.",
    inspection:
      "Leitura com rodas alinhadas, conectores e calibração conforme o fabricante.",
    illustrationIndex: 30,
    explore: {
      href: "/categorias/direcao-hidraulica-e-eletrica/eps",
      label: "Explorar direção EPS",
    },
  },
  {
    id: "sensor-egt",
    kind: "sensor",
    scope: "additional",
    number: 8,
    name: "Sensor de temperatura dos gases (EGT)",
    aliases: ["escape", "DPF", "regeneração"],
    system: "Emissões",
    function:
      "Monitora a temperatura dos gases de escape para proteção de componentes e controle do pós-tratamento.",
    inspection:
      "Chicote exposto ao calor, fixação e plausibilidade das leituras a frio e em operação.",
    illustrationIndex: 31,
  },
  {
    id: "motor-eps",
    kind: "actuator",
    scope: "additional",
    number: 1,
    name: "Motor elétrico da direção EPS",
    aliases: ["assistência elétrica", "direção elétrica"],
    system: "Direção",
    function:
      "Produz a assistência de direção de acordo com o comando do módulo EPS.",
    inspection:
      "Alimentação, aterramento, DTCs, corrente e integridade mecânica do conjunto.",
    illustrationIndex: 32,
    explore: {
      href: "/categorias/direcao-hidraulica-e-eletrica/eps",
      label: "Explorar direção EPS",
    },
  },
  {
    id: "modulador-abs",
    kind: "actuator",
    scope: "additional",
    number: 2,
    name: "Modulador hidráulico do ABS",
    aliases: ["bomba ABS", "unidade hidráulica", "ESC"],
    system: "Freios e ABS",
    function:
      "Modula a pressão de frenagem por válvulas e bomba elétrica sob comando do módulo ABS/ESC.",
    inspection:
      "DTCs, alimentação, vazamentos e testes comandados com ferramenta compatível.",
    note: "Sangria e acionamento do conjunto seguem o procedimento específico do fabricante.",
    illustrationIndex: 33,
    explore: abs,
  },
  {
    id: "atuador-hvac",
    kind: "actuator",
    scope: "additional",
    number: 3,
    name: "Atuador de mistura de ar do HVAC",
    aliases: ["portinhola", "blend door", "temperatura da cabine"],
    system: "Climatização",
    function:
      "Movimenta a portinhola que mistura ar quente e frio para regular a temperatura da cabine.",
    inspection:
      "Movimento, ruídos, engrenagens, posição comandada e calibração do sistema.",
    illustrationIndex: 34,
    explore: hvac,
  },
  {
    id: "atuador-vgt",
    kind: "actuator",
    scope: "additional",
    number: 4,
    name: "Atuador de geometria variável do turbo",
    aliases: ["VGT", "VNT", "palhetas"],
    system: "Turbo",
    function:
      "Posiciona as palhetas da turbina de geometria variável para regular a energia dos gases e a sobrealimentação.",
    inspection:
      "Movimento do mecanismo, comando, realimentação de posição e pressão solicitada versus real.",
    note: "A geometria variável altera a passagem dos gases pela turbina; a wastegate abre um desvio. Ajustes e calibração dependem do conjunto.",
    illustrationIndex: 35,
  },
  {
    id: "valvula-pressao-combustivel",
    kind: "actuator",
    scope: "additional",
    number: 5,
    name: "Válvula de controle de pressão do combustível",
    aliases: ["reguladora", "dosadora", "IMV", "SCV"],
    system: "Combustível",
    function:
      "Regula a pressão ou a vazão de combustível sob comando eletrônico, conforme a arquitetura do sistema.",
    inspection:
      "Pressão solicitada versus real, alimentação, comando, contaminação e retorno conforme manual.",
    note: "Válvulas dosadoras da bomba e reguladoras do rail têm funções e testes específicos.",
    illustrationIndex: 36,
    explore: injection,
  },
  {
    id: "termostato-eletronico",
    kind: "actuator",
    scope: "additional",
    number: 6,
    name: "Termostato eletrônico controlado",
    aliases: ["válvula termostática", "map-controlled"],
    system: "Arrefecimento",
    function:
      "Permite ao gerenciamento ajustar a estratégia de abertura do circuito de arrefecimento, conforme o projeto.",
    inspection:
      "Temperaturas do circuito, comando elétrico, conectores e funcionamento conforme especificação.",
    note: "Alguns projetos utilizam aquecimento elétrico de um elemento termostático, em vez de um motor de posicionamento.",
    illustrationIndex: 37,
    explore: cooling,
  },
  {
    id: "atuador-trava",
    kind: "actuator",
    scope: "additional",
    number: 7,
    name: "Atuador de travamento elétrico das portas",
    aliases: ["fechadura", "trava central", "BCM"],
    system: "Carroceria",
    function:
      "Aciona o mecanismo de travamento e destravamento das portas conforme o comando do veículo.",
    inspection:
      "Alimentação durante o comando, chicote de passagem, mecanismo e sinais de posição, quando presentes.",
    illustrationIndex: 38,
  },
  {
    id: "atuador-epb",
    kind: "actuator",
    scope: "additional",
    number: 8,
    name: "Atuador de freio de estacionamento elétrico",
    aliases: ["EPB", "pinça elétrica", "freio de mão"],
    system: "Freios e ABS",
    function:
      "Aplica e libera o freio de estacionamento por acionamento elétrico, conforme o tipo de conjunto.",
    inspection:
      "DTCs, alimentação, mecanismo e modo de serviço indicado para a manutenção.",
    note: "Há sistemas com motor na pinça e sistemas com acionador de cabos. A ilustração representa uma pinça com motor.",
    illustrationIndex: 39,
    explore: abs,
  },
];

export function normalizeComponentSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function filterTechnicalComponents({
  query = "",
  kind = "all",
  scope = "main",
  system = "all",
}: {
  query?: string;
  kind?: ComponentKind | "all";
  scope?: CatalogScope;
  system?: string;
} = {}): TechnicalComponent[] {
  const words = normalizeComponentSearch(query).split(" ").filter(Boolean);
  return technicalComponents.filter((item) => {
    if (scope !== "all" && item.scope !== scope) return false;
    if (kind !== "all" && item.kind !== kind) return false;
    if (system !== "all" && item.system !== system) return false;
    const text = normalizeComponentSearch(
      [
        item.name,
        ...item.aliases,
        item.system,
        item.function,
        item.inspection,
        item.note || "",
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}

export function componentOffersUrl(
  item: Pick<TechnicalComponent, "name">,
): string {
  return `/pecas?buy=${encodeURIComponent(item.name)}`;
}
