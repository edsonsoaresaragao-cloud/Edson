# Qualidade dos modelos 3D automotivos

A atualização abrange os **15 projetos tridimensionais existentes**, mantendo os modelos interativos, a separação das peças, os movimentos, os detalhes e a narração ao selecionar. Não substitui cenas por imagens estáticas.

| Projeto                            | Acesso                                          |
| ---------------------------------- | ----------------------------------------------- |
| Motor em corte da página inicial   | `/`                                             |
| Suspensão McPherson                | `/categorias/suspensao`                         |
| HVAC e circuito de ar-condicionado | `/categorias/ar-condicionado`                   |
| Compressor axial                   | `/categorias/ar-condicionado/compressor`        |
| Alternador                         | `/categorias/alternador`                        |
| Arrefecimento                      | `/categorias/arrefecimento`                     |
| Freios e ABS                       | `/categorias/freios-e-abs`                      |
| Injeção multiponto                 | `/categorias/injecao-eletronica`                |
| Chave de ignição e imobilizador    | `/categorias/ignicao`                           |
| Direção hidráulica e elétrica      | `/categorias/direcao-hidraulica-e-eletrica`     |
| Direção elétrica EPS               | `/categorias/direcao-hidraulica-e-eletrica/eps` |
| Ignição atual COP                  | `/categorias/ignicao/atual`                     |
| Motor de partida                   | `/categorias/motor-de-partida`                  |
| Transmissão manual                 | `/categorias/transmissao-manual`                |
| Transmissão automática             | `/categorias/transmissao-automatica`            |

## Acabamento e geometria

`automotive-finish.ts` concentra perfis de materiais físicos (MeshPhysicalMaterial), microtexturas procedurais de rugosidade/relevo e detalhes de superfície. Distingue metal fundido, metal usinado, cobre, polímero e borracha. O nome das peças ajuda a distinguir carcaças e superfícies usinadas. Cores de identificação e indicações de fluxo permanecem.

As referências de materiais usadas pelas animações são mantidas: a seleção continua alterando apenas o destaque previsto e o corte continua funcionando. Materiais luminosos de indicação não recebem textura metálica. As texturas não exigem API, imagens externas ou serviço pago e são liberadas no descarte do modelo, inclusive nos conjuntos que reaproveitam a suspensão.

Cilindros de seção circular passam a ter no mínimo 64 segmentos; seções intencionalmente poligonais (como porcas sextavadas) são preservadas. Toros usam pelo menos 16 segmentos radiais e 80 longitudinais. Mangueiras recebem amostragem mais suave; seus caminhos e extremidades continuam ligados às conexões. Janelas, aberturas, setores de corte, dentes de engrenagens e relações cinemáticas não são redefinidos.

Os modelos continuam sendo representações didáticas paramétricas. A melhoria visual não os transforma em fotografias, digitalizações ou CADs dimensionais de uma aplicação específica.

## Iluminação, sombras e enquadramento

`automotive-studio.ts` é utilizado por todos os renderizadores. Usa ambiente de reflexão local, tone mapping AgX, luz principal, preenchimento e contorno, além de um plano transparente para sombra de contato. O ambiente de reflexão e as sombras são descartados com a cena.

O enquadramento dos sistemas que antes tinham câmera distante passa a considerar os limites visíveis da montagem ou da explosão e a proporção da tela. Peças ocultas e pequenas indicações luminosas não afastam a câmera. A direção escolhida pelo usuário é conservada nos reenquadramentos comuns. As transmissões mantêm o enquadramento especializado para transições e isolamento.

Etiquetas ficam compactas por número, com nome completo na seleção em telas largas, título acessível e lista de peças existente. Isso libera a região central para observar o modelo. Os botões **Aproximar/Afastar** existem nos 15 projetos. A roda do mouse e o gesto vertical continuam disponíveis para a rolagem da página. Restaurar câmera retorna ao enquadramento original dos exploradores.

## Resolução e recursos

A resolução considera a área real do canvas, a densidade do dispositivo e o tipo de ponteiro:

- Computador: densidade máxima 2, orçamento de 2 milhões de pixels.
- Celular/área estreita: densidade máxima 1,5, orçamento de 1 milhão de pixels.
- Telas com densidade 1 recebem superamostragem de até 1,25, dentro do orçamento.
- Sombras PCF: mapa de 1024 no computador e 512 em dispositivos com ponteiro grosso. Usa a API suportada pela versão instalada do Three.js, sem o PCFSoftShadowMap removido.
- Sombras são reutilizadas em cenas estáticas, invalidadas nas alterações e atualizadas em intervalos de aproximadamente 90 ms durante movimento. Isso evita recalcular o mapa a cada atualização de etiquetas.
- Pausa, movimento reduzido, visibilidade e interrupção fora da tela mantêm as regras existentes dos exploradores.
- Sem WebGL ou após perda de contexto, o conteúdo acessível e a narração das peças continuam disponíveis; o zoom fica desabilitado.

## Verificação

- **104 testes de modelos, movimentos e qualidade:** relações de transmissão, sincronismo, conexões de mangueiras, seleção, cortes, geometrias finitas, enquadramento, perfis de superfície, orçamento de pixels, preservação de polígonos/aberturas e descarte único das microtexturas.
- A verificação das extremidades de mangueiras usa os parâmetros da geometria, em vez de índices de uma resolução fixa; continua testando a conexão real nas diferentes posições de explosão.
- **30 cenários de navegador** em computador e celular verificam os 15 projetos, canvas WebGL real, zoom, vistas montada/explodida, seleção por etiqueta/lista, chamadas de voz e fallback após perda de contexto.
- **4 verificações adicionais** exercitam clique direto na malha 3D e narração em suspensão, alternador e nas duas transmissões.
- Capturas anteriores e posteriores permitem conferir o aumento dos modelos e a diferenciação visual dos materiais.
- TypeScript e ESLint são executados nos modelos, renderizadores, componentes e testes afetados.

Os testes de navegador locais usam uma rota temporária que monta os mesmos componentes de produção, sem depender do PostgreSQL das páginas de categoria. Essa rota é removida antes da entrega. O WebGL é real no Chromium automatizado; a síntese de voz é simulada. A validação não estabelece taxa de quadros em cada aparelho físico.

Com servidor e banco configurados, a suíte usa as rotas públicas por padrão:

```sh
npx tsx --test tests/automotive-quality.test.ts
npx playwright test tests/browser/automotive-quality.spec.ts
```

O build de produção foi tentado, mas o download do schema-engine do Prisma foi bloqueado com HTTP 403 em `binaries.prisma.sh` neste ambiente. O build completo não foi validado. Não foram alteradas dependências, chaves, migrações ou configurações do Render para contornar esse bloqueio.

Para publicar o commit enviado à main: **Render → Manual Deploy → Deploy latest commit**.
