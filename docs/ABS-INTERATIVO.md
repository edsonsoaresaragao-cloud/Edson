# Sistema ABS interativo

Módulo inserido em `/categorias/freios-e-abs`, acima dos filtros e vídeos. Segue a interação de Suspensão e dos demais conjuntos. A imagem foi usada como referência para interpretação procedural; o arquivo original do cartaz não foi incorporado.

Itens 1–8 da referência: quatro sensores, ECU, modulador, solenoides, motor da bomba, reservatório, cilindro-mestre e tubulações. Os contextos adicionados são conjuntos de freio (9), pedal/servofreio (10) e acumuladores de baixa pressão (11). Seleção por malha, etiqueta projetada ou lista mostra a função e destaca o grupo.

Geometria detalhada: bloco usinado com oito furos reais por extrusão, ECU com placa e componentes, oito solenoides com êmbolos e molas helicoidais, motor cilíndrico com tampa/fixações e indicador girante, reservatório translúcido, tubos curvos, discos ventilados, pinças, anéis de leitura e quatro sensores. Detalhes estáticos agrupados por material; 142 malhas, incluindo partículas.

Interações: montado/explodido, separação ajustável, câmera giratória/restaurável, pausa, modo convencional/ABS, acionamento didático e liberação do pedal. Painel de fases recebe a fase do mesmo ciclo usado no renderizador, sendo atualizado apenas quando a fase muda. Assim acompanha a pausa, a visibilidade da aba e a preferência por movimento reduzido.

O cenário é de quatro canais e destaca a dianteira esquerda. Ciclo didático de três segundos: aumentar (entrada aberta/saída fechada), manter (ambas fechadas), reduzir (entrada fechada/saída aberta, indicação de recirculação). Os demais canais mantêm entrada aberta e saída fechada. Sensores permanecem fixos; discos e anéis giram juntos; pinças não giram com o disco. Rotações são arbitrárias para visualizar o funcionamento; o modelo não integra a desaceleração até a parada.

São mostradas duas ligações do cilindro-mestre ao modulador e uma tubulação externa por roda. Na redução, a indicação nesse tubo se inverte: roda → modulador. Galerias esquemáticas levam o fluido do canal ao acumulador e daí de volta ao circuito a montante das válvulas pela bomba. Não há segundo tubo de descarga externo da roda ao acumulador nem descarga direta ao reservatório. Sinais verdes representam sensores → ECU. Partículas hidráulicas indicam caminhos de atuação, não vazão contínua de um circuito aberto.

Pressão indicada no modelo é um nível visual normalizado, sem unidade e sem medição física. Não calcula aderência, escorregamento real, velocidade, corrente, vazão, distância de parada ou estratégia específica de fabricante. O ABS não garante menor distância de parada em todo tipo de piso; o modelo não faz essa promessa. Roteamento, divisão dos circuitos, fluido, sangria e manutenção não são instruções de intervenção.

Renderer apenas no cliente, com observadores, pausa por aba/visibilidade, suporte a movimento reduzido e liberação de recursos. Campo de visão ajustado à proporção da tela; sem WebGL, esquema estático, lista e descrições continuam disponíveis.

Validação: seis testes ABS (geometria, fases, sensores/discos, conexões, HTML e enquadramento inicial) mais cinco testes de regressão de Arrefecimento. TypeScript direcionado e lint aprovados. Aparência em navegador/GPU não conferida nesta sessão; build completo depende da geração Prisma indisponível no ambiente.

Publicação: push no GitHub, seguido de Render → Manual Deploy → Deploy latest commit.
