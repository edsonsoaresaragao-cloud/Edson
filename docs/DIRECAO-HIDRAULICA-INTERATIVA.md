# Direção hidráulica interativa

Inserida em `/categorias/direcao-hidraulica-e-eletrica`, acima dos filtros e vídeos. O título do módulo identifica explicitamente a arquitetura hidráulica; não é um simulador de EPS. A imagem foi usada como referência para a interpretação procedural, sem incorporar o arquivo original da fotografia.

17 componentes numerados conforme a referência, acrescidos de agregado/buchas (18), cubos/mangas (19) e estabilizadora/bieletas (20) como contexto. A geometria McPherson reutiliza o modelo de Suspensão sem alterar sua implementação. Os grupos foram remapeados para a numeração desta legenda; câmbio e diferencial do outro modelo não são exibidos.

Inclui volante com aro arredondado, coluna com articulações, bomba com polia, reservatório translúcido, mangueiras curvas, caixa em corte, pinhão, cremalheira com pistão, barras, terminais, coifas deformáveis, suspensão e freios detalhados. Geometria estática agrupada dentro de grupos móveis: 117 malhas. Etiquetas projetadas acompanham a câmera; seleção por malha, etiqueta ou lista mostra função e destaque.

Vista montada/explodida, separação ajustável, câmera giratória/restaurável, pausa, centralização, esterçamento automático/manual e indicação de assistência. O comando manual admite ±360° no volante, simplificado para ±25° nas rodas. Cremalheira desloca-se proporcionalmente ao ângulo do pinhão com raio didático 0,035; a coluna acompanha a rotação sobre seu próprio eixo. As barras axiais e os terminais ligam-se em um ponto intermediário; discos e cubos esterçam sem girar em torno dos eixos das rodas, representando veículo parado. Não há geometria Ackermann, cálculo de esforço ou exatidão dimensional de fabricante.

Circulação indicada por partículas: reservatório → sucção da bomba → alta pressão → válvula da caixa → retorno → reservatório. As linhas acompanham a separação. Cores nas câmaras ilustram o lado assistido e o lado de retorno, associadas ao comando do volante; na posição neutra ficam ocultas, embora a circulação possa continuar. Em um sistema real, a válvula reage ao esforço, não apenas ao ângulo. Desligar a indicação hidráulica interrompe a polia/partículas no exemplo e preserva o vínculo mecânico. Não representa falha real, pressão, torque ou vazão.

Renderizador carregado no cliente, com observação de tamanho/visibilidade, respeito a movimento reduzido e pausa em aba oculta. Campo de visão adaptado à proporção da tela; teste dos limites do modelo verifica enquadramento inicial montado/explodido para celular e desktop. Não garante enquadramento de qualquer ângulo escolhido pelo usuário. Sem WebGL, mantém esquema estático, seleção e descrições. Recursos liberados no desmonte ou perda de contexto.

Validação: seis testes de direção (geometria, vínculo mecânico, circuito hidráulico, automático/manual, HTML e enquadramento) mais cinco de regressão da Suspensão. TypeScript direcionado e lint aprovados. Aparência final em navegador/GPU não conferida nesta sessão; build completo depende da geração Prisma indisponível no ambiente.

Publicar pelo fluxo existente: push no GitHub; Render → Manual Deploy → Deploy latest commit.
