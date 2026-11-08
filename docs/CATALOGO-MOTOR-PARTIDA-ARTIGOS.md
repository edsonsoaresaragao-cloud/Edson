# Catálogo do motor de partida em Notícias e artigos

O catálogo está registrado na biblioteca de `/artigos` e pode ser selecionado diretamente em `/artigos?catalog=motor-de-partida`. A biblioteca reúne sete catálogos técnicos.

## Organização

As 11 peças seguem os nomes e os números da referência enviada e do módulo de partida existente: carcaça dianteira, pinhão, roda livre, garfo, solenoide, carcaça do motor, induzido, estator, porta-escovas, escovas e tampa traseira. Funções e inspeções vêm de `src/lib/starter-parts.ts`, mantendo correspondência entre catálogo e interativo.

Cada ficha tem imagem individual, nome, função e inspeção. A busca aceita número exato, nome, função e sinônimos, com filtros por sistema e ordenação por nome ou número. As imagens ampliam em um diálogo com seleção por foto, nome ou botão da ficha; a leitura por voz usa os controles existentes para falar, repetir, interromper e desligar.

Cinco vistas relacionam os componentes:

- Motor de partida montado.
- Acionamento e engrenamento.
- Induzido, campo e produção de torque.
- Escovas e apoio traseiro.
- Comando e circuito de potência.

As vistas de conjuntos utilizam uma peça representativa, identificada como destaque na legenda, e listam seus elementos e números nas fichas. **Explorar motor de partida interativo** abre `/categorias/motor-de-partida`, com o modelo e a vista explodida existentes.

O conteúdo reúne os cinco passos de funcionamento, circuito e engrenamento, cinco grupos de falhas e sintomas, testes de oficina, manutenção e sinais no painel. As definições têm colunas que se adaptam à largura disponível para manter os textos legíveis.

## Imagens e referências técnicas

As imagens são as ilustrações didáticas locais já usadas no arranque, organizadas em `public/images/starter/starter-components.webp`. O arquivo de 1.448 × 1.086 pixels contém quatro colunas e três linhas de células quadradas: 11 peças e o conjunto montado. As legendas identificam as ilustrações geradas, sem apresentá-las como fotografias de fabricante.

Os exemplos de 12,4–12,8 V, 9,6 V, 80–250 A e 5 mm conservam o contexto do cartaz e as condições de aplicação. Não são valores universais. Pinhão e roda livre são separados para estudo; a coroa do volante pertence ao motor térmico. A indicação de bateria se relaciona normalmente ao sistema de carga e não confirma, isoladamente, falha do arranque; também não existe uma luz universal de motor de partida correspondente ao ícone do cartaz.

## Implementação e validação

Dados em `src/lib/starter-reference-catalog.ts` e registro em `src/lib/technical-catalogs.ts`, usando a interface compartilhada dos outros catálogos.

Em 08/11/2026, passaram 47 testes de dados, componentes e modelos: todos os catálogos de referência, motor de partida e renderização dos controles de narração. A checagem TypeScript dos módulos e testes envolvidos e o ESLint passaram sem erros ou avisos.

Também passaram 14 cenários de navegador em computador e celular, incluindo o novo catálogo, a leitura das 11 peças e cinco conjuntos e a regressão do HVAC. Os testes conferem busca, filtros, ordem, imagens, diálogo, foco e Escape, voz, URLs, troca e restauração entre catálogos, ausência de transbordamento horizontal e acessibilidade axe nos dois temas e na ficha ampliada. Após ajustar as colunas de texto, os dois cenários de layout e acessibilidade foram repetidos com sucesso.

Os testes de voz registram as chamadas da API; não comprovam áudio audível em todos os dispositivos. A prévia usa o componente e o layout reais em uma rota temporária, removida antes do commit. A página completa de artigos depende do banco; não foi validado um build de produção nesta execução porque o Prisma Client local não está gerado.

## Publicação

Após enviar o commit a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
