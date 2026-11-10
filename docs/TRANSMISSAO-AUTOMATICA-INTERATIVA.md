# Transmissão automática com conversor de torque

Inserida em `/categorias/transmissao-automatica`, acima dos filtros e vídeos. O catálogo em `/artigos?catalog=transmissao-automatica` reúne as mesmas 12 identificações e quatro vistas: conjunto montado, explosão, conversor e planetário. Os dois conteúdos possuem links entre si.

## Identificação e imagens

A lista segue a numeração do corte longitudinal e da relação principal da imagem enviada: conversor; bomba de óleo; planetário 1; embreagens e discos 1; planetário 2; embreagens e discos 2; planetário 3; freios; saída; corpo de válvulas; solenoides; carcaça. Não usa os números repetidos da faixa explodida para renumerar os conjuntos.

O atlas local `public/images/automatic-transmission-reference/catalog.webp` tem 16 regiões: 12 imagens individuais e quatro vistas. Foi gerado com base nos componentes da referência, com acabamento de fotografia de produto, sem marcas. As legendas identificam essas imagens como ilustrações didáticas geradas, não fotografias OEM. As proporções e os limites das linhas do atlas são conservados no recorte por CSS.

Clique em malha 3D, etiqueta, ficha com miniatura, imagem selecionada ou atalho para destacar a peça e ouvir nome e função em português. Os controles compartilhados permitem silenciar, repetir ou interromper a fala. A página não inicia a narração sozinha. A seleção permanece disponível em texto quando o navegador não possui síntese de voz.

## Modelo e movimento

O modelo procedural inclui carcaça curva nervurada, campana e cárter separados, conversor com pás curvas e pivôs independentes para impulsora, turbina e estator, bomba anular, dentes externos e internos, três planetários, porta-satélites, discos alternados de aço e atrito, tambores, pistões, saída estriada, trava de estacionamento e galerias hidráulicas com solenoides. Os materiais distinguem alumínio, aço, latão, atrito e borracha; as peças selecionadas recebem destaque.

- Montado, corte em funcionamento e vista explodida com separação ajustável; foco individual, pausa, velocidade, rotação, zoom e restauração da câmera.
- P bloqueia a saída no exemplo. N libera os acoplamentos de tração e não aciona a saída; em um veículo real a saída pode ser movimentada externamente. A impulsora e a bomba de óleo continuam girando em P e N neste modelo.
- R inverte a saída por meio de uma solar acionada e um porta-satélites retido. D oferece cinco relações selecionáveis para estudo; não é uma simulação de condução ou de troca automática conforme carga e velocidade.
- Sem lock-up, a turbina gira a 82% da impulsora para tornar o escorregamento visível. Esse valor fixo é ilustrativo. Com lock-up em D, as velocidades coincidem. Não se calcula multiplicação de torque nem comportamento físico do fluido.
- Discos e pistões mostram aplicação ou liberação. Marcadores nas galerias representam circulação e distribuição de ATF. Os solenoides destacados não são uma tabela de energização de fabricante.

## Cinemática planetária

Cada estágio simples usa solar de 24 dentes, três planetas de 18 e coroa interna de 60, com módulo visual de 0,028 unidades do modelo. As dimensões não correspondem a uma caixa comercial. A equação de Willis relaciona as velocidades:

`24 × solar + 60 × coroa = 84 × porta-satélites`

Os planetas orbitam com o porta-satélites e giram em seus eixos respeitando o engrenamento relativo à solar. Os três estágios independentes são encadeados de forma didática: redução pela solar; redução pela coroa; rotação solidária; sobremarcha com entrada no porta-satélites; ou inversão com porta-satélites retido. As relações resultantes são 3,50; 1,96; 1,40; 1,00; 0,71; e ré −2,50. Não incluem o escorregamento do conversor.

O catálogo mantém separadamente as faixas de relações apresentadas no cartaz e explica a diferença. Não há tentativa de reproduzir o diagrama de aplicação ou os vínculos internos de uma transmissão comercial. O conteúdo distingue este exemplo com conversor de CVT e DCT. Não calcula pressão, torque, temperatura, carga, inércia, adaptações ou o enchimento dos elementos de aplicação.

## Acessibilidade e recursos

As etiquetas e fichas são botões nomeados; câmera e controles possuem alternativas por teclado. Os controles deslizantes têm rótulos associados aos próprios inputs. A preferência por movimento reduzido inicia a cena pausada e permite reprodução explícita.

A animação interrompe a atualização fora da área visível, em aba oculta, na pausa ou com velocidade zero. Transições de montagem podem continuar enquanto os eixos estão pausados. Limites de resolução e frequência reduzem o custo gráfico. Eventos, controles, observadores, ambiente, geometrias e materiais são liberados ao desmontar ou perder o contexto WebGL. Sem WebGL, o componente conserva imagens, funções, seletor em texto, fichas e narração.

## Validação

Passaram 83 testes de dados, catálogos, renderização inicial e narração compartilhada. Os seis testes da automática foram repetidos após o ajuste do enquadramento e das galerias: validam dentes internos, geometria finita, equação de Willis, relações, movimentos, pausa, P/N/ré, explosão, foco, três direções de câmera em duas proporções e liberação dos recursos. TypeScript direcionado e ESLint dos arquivos envolvidos também passaram.

Foram validados 16 cenários distintos entre Chromium desktop e emulação de iPhone 13: cliques nas 12 peças, etiquetas e malhas, imagens, atalhos, narração, silenciar/repetir, cinco marchas, P/R/N/D, lock-up, pausa, câmera, explosão, foco, movimento reduzido, reprodução explícita, perda de contexto, ausência de WebGL ou síntese de voz, catálogo, busca e acessibilidade nos dois temas. A primeira execução encontrou uma divergência entre texto visível e nome acessível nos botões compartilhados do catálogo; os rótulos foram alinhados. Os quatro cenários afetados por rótulos e refinamento visual passaram novamente, incluindo as fichas de conjuntos e o afastamento da câmera no celular sem sobreposição do botão de contato.

As chamadas à síntese de voz foram verificadas com uma API simulada; não houve teste de audição em aparelhos físicos. A revisão visual incluiu corte, explosão e detalhes do conversor e planetário. A rota temporária montava o componente e o layout reais, sem depender do banco, e foi removida antes do commit. A página ligada ao banco e o build completo não foram validados localmente; a geração do Prisma Client estava indisponível no ambiente de desenvolvimento.

## Publicação

O push atualiza o código no GitHub. Como o deploy automático do Render está desativado, a atualização pública exige **Manual Deploy → Deploy latest commit** no serviço existente.
