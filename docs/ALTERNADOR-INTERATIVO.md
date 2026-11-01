# Alternador automotivo interativo

Inserido em `/categorias/alternador`, acima dos filtros e vídeos, na posição da primeira captura enviada. Segue o padrão de interação de Suspensão, HVAC e Compressor. A segunda imagem foi usada como referência para a interpretação procedural; o arquivo original da foto não foi incorporado.

16 componentes com numeração da referência: polia, ventoinha, rolamento dianteiro, carcaça dianteira, rotor, estator, regulador, porta-escovas, ponte retificadora, rolamento traseiro, carcaça traseira, terminais, parafusos, protetor, porca e espaçadores. Etiquetas acompanham câmera e peças; seleção por malha, etiqueta ou lista acessível exibe a função e destaca somente o item escolhido.

Modelagem com anéis, rolamentos com esferas, polia estriada, aletas, carcaças ventiladas, polos em garra, bobina de campo e enrolamentos de cobre no estator. Aberturas da carcaça são lacunas entre nervuras. Corte oculta uma seção das nervuras e do estator para observar o rotor. Detalhes estáticos são agrupados por material; seções do corte permanecem independentes. 129 malhas no modelo completo.

Modos montado, corte em funcionamento e vista explodida com separação ajustável. Controles de pausa, velocidade didática, excitação e restauração da câmera. Polia, rotor, ventoinha e porca giram juntos; estator, escovas e carcaças permanecem fixos. Desligar excitação oculta os indicadores elétricos, preservando a rotação. Velocidade zero interrompe rotação e indicadores.

As partículas nas três cores representam fases CA seguindo ao retificador; dourado indica saída CC. Não são simulação eletromagnética nem leitura de corrente, frequência, potência ou tensão. Nenhuma tensão nominal é prescrita. Modelo genérico com polia rígida e rotor em garra; não simula polia desacopladora, magnetismo residual, estratégia de carga inteligente, controle real ou posição exata de peças de um fabricante. A vista explodida não é procedimento de desmontagem.

Renderer apenas no cliente, observadores de visibilidade e tamanho, interrupção em aba oculta, pausa ou movimento reduzido. Recursos liberados no desmonte/perda de contexto. Sem WebGL, mantém esquema estático, lista e descrições; ajustes de movimento são desabilitados.

Validação: cinco testes para geometria, movimento relativo, excitação, corte/seleção e HTML acessível; nove testes de regressão HVAC/compressor. TypeScript direcionado e lint aprovados. Aparência em navegador/GPU não conferida nesta sessão. Build completo depende da geração Prisma indisponível neste ambiente.

Publicação: push no GitHub; Render → Manual Deploy → Deploy latest commit.
