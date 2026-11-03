# Motor de partida interativo

O módulo aparece em `/categorias/motor-de-partida`, acima dos filtros e conteúdos existentes, com o mesmo padrão de exploração da suspensão. Não altera banco, conteúdo publicado ou o esquema de categorias.

## Referência e componentes

A referência enviada pelo usuário determina a numeração: 1 carcaça dianteira; 2 pinhão (Bendix); 3 embreagem de roda livre; 4 garfo; 5 solenoide; 6 carcaça do motor; 7 induzido; 8 estator/campo; 9 porta-escovas; 10 escovas de carvão; 11 tampa traseira.

É um modelo didático genérico de arranque pré-engatado, com acionamento direto e campo bobinado. Não representa um código de peça ou CAD de fabricante. Existem arranques com ímãs permanentes, redutor planetário e outras construções.

A geometria usa carcaças ocas com setores removíveis, nariz com janela de acesso ao pinhão, dentes de pinhão, roda livre com pistas, garfo articulado, êmbolo móvel, terminais e ponte de contato, eixo, núcleo laminado, voltas de cobre, coletor segmentado, polos bobinados, guias, escovas, cordoalhas e bucha traseira. As peças móveis e fixas são distintas. Malhas estáticas são agrupadas por material dentro de cada articulação; destaque de uma peça não altera os materiais das demais.

## Interação

- Vistas montada, em corte e explodida; separação contínua; giro da câmera; restauração do enquadramento.
- Lista de 11 nomes com miniaturas, etiquetas de seleção no modelo, imagem ampliada e função/inspeção da peça selecionada.
- Isolamento de uma peça, com enquadramento automático. No celular, etiquetas numéricas compactas e lista com nomes completos.
- Reprodução/pausa, velocidade didática, reinício e avanço manual. As cinco etapas também são botões de acesso direto e pausam a sequência para estudo.
- Pinhão e roda livre avançam juntos, o garfo articula e o êmbolo do solenoide se desloca. O contato de potência só fecha após o avanço no exemplo.
- Em partida, induzido e pinhão têm a mesma velocidade angular de transmissão direta; o estator e as escovas permanecem fixos. A coroa de contexto tem 90 dentes e o pinhão 10: o sentido é oposto e a relação geométrica ilustrativa é 9:1.
- A etapa de roda livre permite ao pinhão girar mais rápido que o induzido. O retorno desengrena o pinhão, enquanto o motor térmico continua girando.

Tempos, velocidades, separações e cortes são adaptados para observação, sem solver de contatos, cálculo eletromagnético, carga real, desgaste ou tolerâncias de fabricação. Liberação elétrica e retorno são separados em etapas para evidenciar o funcionamento. O movimento na vista explodida não representa funcionamento físico de um arranque desmontado.

A coroa do volante é contexto do motor térmico e não é contada como peça 12. Ela aparece apenas com o conjunto próximo da posição montada. Partículas e esquema elétrico distinguem comando de solenoide e circuito de potência, sem representar medições ou um diagrama de ligação específico.

## Imagens

`public/images/starter/starter-components.webp` é um atlas local de quatro colunas e três linhas, com 11 componentes e uma vista montada. Foi gerado com base visual no cartaz enviado e convertido para WebP. As imagens são **ilustrações didáticas geradas**, identificadas na interface e no texto alternativo; não são fotografias de peças de fabricante. Todas as miniaturas compartilham o mesmo arquivo local, sem dependência de links remotos.

## Conteúdo técnico

Inclui funções e inspeções dos 11 componentes, cinco fases, esquema elétrico, falhas/sintomas, inspeções e manutenção. Os números da imagem são contextualizados: 12,4–12,8 V em repouso depende da bateria e das condições; 9,6 V pertence a critérios de testes especificados, não a qualquer partida; 80–250 A é uma faixa ilustrativa; 5 mm não é um comprimento mínimo universal de escova. Valores e procedimentos devem seguir o fabricante.

A luz da bateria e a luz de injeção não são apresentadas como diagnóstico específico do arranque. Os sintomas têm causas possíveis e exigem verificação. A nomenclatura de terminais 30/50/31 no esquema é usual e não define pinagem de uma aplicação real.

## Execução e acessibilidade

Three.js é carregado somente no cliente. Câmera e canvas acompanham o tamanho disponível, pixel ratio limitado a 1,5 e animação limitada a cerca de 30 quadros/s. A animação automática respeita movimento reduzido, pausa, velocidade zero, visibilidade da aba e presença da cena na tela. Uma seleção ou câmera ainda pode produzir um quadro estático nessas condições.

Sem WebGL ou após perda de contexto, mantém o desenho SVG interativo, imagens, seleção, explicações e etapas manuais. Reprodução 2D pode avançar as fases, respeitando movimento reduzido e visibilidade. Observadores, eventos, controles, frames, geometrias, materiais e mapa de ambiente são liberados na desmontagem ou falha. A seleção por raio ignora partes ocultas durante o isolamento.

## Validação

- `npx tsx --test tests/starter.test.tsx`: nove testes de identificação/geometria, avanço antes de potência, articulação/retorno, relações de giro, roda livre, corte/isolamento/destaque, pausa/velocidade zero, liberação de recursos e HTML educativo.
- `tests/browser/starter.spec.ts`: três cenários em desktop e celular. Usa WebGL real disponível no Chromium de teste, verifica as vistas, 11 seleções/imagens, isolamento, etapas, imagem alterando durante reprodução e estabilidade após pausa; axe em temas claro/escuro; perda de contexto e cenário de WebGL indisponível.
- TypeScript restrito aos módulos novos e testes, e ESLint dos arquivos alterados.

A prévia local usa o componente e o layout reais em uma rota temporária, removida antes do commit. A página completa depende do banco já existente. A compilação de produção não é validada neste ambiente porque o cliente Prisma não está gerado; não houve mudança de esquema ou consulta do banco nesta entrega.

Resultado: nove testes do modelo e seis cenários de navegador aprovados. TypeScript restrito, ESLint e revisão visual aprovados. A geometria foi otimizada antes da última rodada, reduzindo detalhes redundantes de anéis e pequenos setores sem remover componentes ou articulações.

## Publicação

Depois do commit em `main`: **Render → Manual Deploy → Deploy latest commit**. O módulo e suas ilustrações não exigem API ou variável de ambiente adicional.
