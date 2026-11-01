# Direção elétrica EPS interativa

Botão **Explorar direção elétrica ↗** adicionado após **Centralizar direção** na barra da direção hidráulica em `/categorias/direcao-hidraulica-e-eletrica`, no local marcado pelo usuário. Abre `/categorias/direcao-hidraulica-e-eletrica/eps`, com link de retorno à categoria.

Modelo procedural genérico de EPS com motor junto à caixa, inspirado no cartaz enviado. Não incorpora o arquivo original da imagem. Mantém os 17 itens e números da legenda: volante, coluna, junta universal, sensor, ECU, motor, caixa, pinhão, barras, terminais, semieixos, bandejas, pivôs, agregado, conjuntos mola/amortecedor, discos e pinças. Cubos e estabilizadora aparecem como contexto nos itens 18 e 19.

Geometria McPherson reutilizada de Suspensão com remapeamento de grupos. Acrescentados sensor junto ao pinhão, ECU com aletas/conectores, chicotes e motor cilíndrico com rotor, polos, enrolamentos de cobre e carcaça de redução. Corte do motor oculta parte da carcaça e dos enrolamentos para observar o rotor. Cremalheira permanece em janela de corte para estudo. Cores e materiais independentes dos demais módulos; pinças em azul conforme a referência. Geometria fixa agrupada por material: 147 malhas.

Interação: montado, corte do motor EPS, vista explodida, separação gradual, seleção por malha/etiqueta/lista, comando automático ou manual, centralização, pausa, restauração da câmera e indicação de assistência elétrica. Volante e pinhão comandam a posição da cremalheira e o esterçamento. Não existe circuito hidráulico na cena EPS.

Indicação de sinal: sensor → ECU → motor. Mudanças de comando geram uma demanda ilustrativa que permanece por até 0,45 segundo de tempo da animação. Sem mudança, cessam as partículas. Quando a assistência está habilitada, o rotor mostrado gira proporcionalmente à mudança do comando (relação visual arbitrária). Desativar a indicação conserva a posição do rotor demonstrativo e mantém o vínculo mecânico de volante, cremalheira e rodas. Não representa comportamento de falha ou o arraste real de um motor EPS desligado.

O sensor real mede esforço, não apenas posição. Aqui não há cálculo de torque, corrente, carga, velocidade do veículo, mapa de assistência, protocolo da ECU, temperatura ou controle elétrico. Não simula Ackermann, redução exata, tolerâncias, calibração ou fabricante específico. Outras arquiteturas EPS podem atuar na coluna ou em outro ponto.

Renderer apenas no cliente, com pausa por visibilidade/aba oculta, preferência por movimento reduzido, observação de tamanho e liberação de recursos. Campo de visão ajustado à proporção da tela. Fallback SVG com lista e descrições acessíveis quando não há WebGL.

Validação: seis testes EPS (geometria/ausência de componentes hidráulicos, vínculo mecânico e motor, sinais, corte, acesso/HTML, enquadramento) mais seis testes de direção hidráulica. TypeScript direcionado e lint aprovados. Aparência em navegador/GPU não conferida nesta sessão; build completo depende de geração Prisma indisponível no ambiente.

Publicação: push no GitHub, seguido de Render → Manual Deploy → Deploy latest commit.
