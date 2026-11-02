# Chave de ignição, imobilizador e partida

Inserido em `/categorias/ignicao`, acima dos filtros e vídeos, seguindo a interação de Suspensão. A referência enviada trata de autorização de partida por chave codificada; o módulo apresenta esse conjunto explicitamente, em vez de confundi-lo com apenas geração de centelha. A imagem foi usada como referência procedural; o arquivo original da foto não foi incorporado.

Itens 1–9: chave, chip transponder, cilindro/comutador, antena leitora, BCM/imobilizador, ECU, relé/fusível, motor de partida e comandos bobinas/injetores. Bateria (10) e motor/volante do motor (11) são contexto. Geometria com lâmina genérica, placa/chip expostos na chave, cilindro arredondado, espiras de cobre, conectores, aletas, motor cilíndrico, pinhão retrátil e cremalheira do volante do motor. 76 malhas após agrupamento estático.

Etiqueta projetada e seleção por malha/lista mostram nome e função. Vista montada/explodida, separação ajustável, câmera giratória/restaurável, pausa, reinício e avanço manual de etapa. O avanço pausa a animação e permite percorrer as fases mesmo com preferência por movimento reduzido.

Sequência didática de dez segundos: inserir, ler, verificar, autorizar, acionar partida, representar funcionamento e desligar. A chave volta de START para ON após a fase de partida. Pinhão recua, motor de partida para e o volante do motor continua girando no funcionamento. Campos azuis representam leitura; caminhos e partículas representam comunicação/alimentação, sem tráfego real ou valores elétricos medidos.

Cenários reconhecido/não reconhecido iniciam tentativas separadas. No cenário não reconhecido deste exemplo, chave pode girar para START, mas autorização, partida e saídas permanecem inativas. Não se representa corte em funcionamento por troca de cenário. Há veículos que permitem o giro do motor de partida e bloqueiam funcionamento por outros meios; o comportamento e a divisão de funções entre BCM, ECU e sistema de partida variam.

O transponder passivo representado recebe energia da antena; não depende da pilha do controle remoto. O modelo não implementa comunicação RFID, CAN/LIN, códigos de chaves, autenticação real, programação, diagnóstico ou procedimento de desmontagem. Bobinas/injetores são apenas indicação de comandos habilitados, sem temporização real de motor.

Renderer carregado no cliente, observadores de tamanho/visibilidade, pausa em aba oculta, respeito a movimento reduzido e liberação de recursos. Painel de fase usa o mesmo estado da cena. Campo de visão ajusta à proporção da tela; sem WebGL, esquema estático e descrições continuam disponíveis.

Validação: seis testes da sequência de chave/partida (geometria, autorização, cenário não reconhecido, desacoplamento, HTML e enquadramento) mais seis testes de regressão MPI. TypeScript direcionado e lint aprovados. Sem conferência visual em navegador/GPU nesta sessão; build completo depende da geração Prisma indisponível no ambiente.

Publicação: push no GitHub; Render → Manual Deploy → Deploy latest commit.
