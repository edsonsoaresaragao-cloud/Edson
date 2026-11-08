# Catálogo da transmissão manual em Notícias e artigos

O catálogo pode ser escolhido na biblioteca de `/artigos` ou aberto diretamente em `/artigos?catalog=transmissao-manual`. A biblioteca reúne oito catálogos técnicos.

## Conteúdo e organização

As 13 fichas seguem a numeração da referência: carcaça, eixo primário, eixo secundário, contraeixo, engrenagens, sincronizador, luva, garfo, haste seletora, tambor seletor, tampa, retentores e rolamentos. Cada ficha oferece imagem própria, nome, função, inspeção e observações de construção.

A busca aceita número exato, nome, função e sinônimos. Os filtros distinguem carcaças, eixos/engrenagens, sincronização/engate, seleção, apoios/vedação e sistemas associados. Há ordenação por nome ou número e estado vazio com restauração dos filtros.

Seis vistas complementares ampliam os detalhes:

- Vista explodida da caixa de marchas.
- Detalhe do sincronizador.
- Sistema de embreagem.
- Alavanca e mecanismo de seleção.
- Pedais do veículo.
- Fluxo de potência do motor às rodas.

Embreagem, pedais e fluxo de potência são agrupados como sistemas associados. Embreagem e pedais não recebem números de peças internas; as outras vistas relacionam seus elementos aos números da lista principal. O botão **Ver conteúdos de transmissão manual** abre `/categorias/transmissao-manual`.

Imagens, nomes e botões das fichas usam a narração existente para ler nome e função em português, com controles para repetir, interromper e desligar. A ficha ampliada fecha por botão ou Escape e devolve o foco ao elemento que a abriu.

## Imagens e contexto técnico

O atlas WebP local `public/images/manual-transmission-reference/catalog.webp` contém 20 ilustrações geradas, em quatro colunas e cinco linhas: 13 peças, caixa montada e seis vistas. Sua resolução é de 1.122 × 1.402 pixels; a proporção das células é calculada a partir dessas dimensões. As legendas identificam as ilustrações, sem apresentá-las como fotografias de fabricante ou desenhos certificados.

As seis relações de marcha reproduzem as faixas aproximadas do cartaz como exemplos, incluindo a ré em módulo. Não são especificações de uma caixa real. A disposição de dois ou três eixos, eventual marcha direta, sincronização da ré e integração do diferencial dependem da arquitetura.

O tambor seletor, item 10, é identificado como dependente do projeto, especialmente em mecanismos sequenciais; não é atribuído a toda caixa manual com padrão H. Os textos distinguem o anel de sincronização da luva que efetua o acoplamento de torque. Lubrificante, regulagem, folgas e torques exigem os dados da transmissão identificada.

O conteúdo também inclui os cinco passos de funcionamento, manutenção preventiva e seis grupos de falhas e sintomas, com alternativas de investigação em vez de diagnóstico por sintoma isolado.

## Implementação e validação

Dados em `src/lib/manual-transmission-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes.

Em 08/11/2026, passaram 53 testes de dados, componentes e modelos, incluindo os oito catálogos de referência e as regressões de partida e narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram sem erros ou avisos.

Passaram 14 cenários de navegador em computador e celular: catálogo manual, leitura das 13 peças e seis vistas e regressão do catálogo de partida. As verificações cobrem busca, filtros, ordenação, imagens, ampliação, foco/Escape, links, voz, troca e restauração pela URL, ausência de transbordamento horizontal e acessibilidade axe nos dois temas e na ficha. O filtro de sistemas associados também foi verificado em reexecução dos dois cenários de fichas após o agrupamento final.

Os testes de voz registram as chamadas da API e não comprovam áudio audível em todos os aparelhos. A prévia usa a biblioteca e o layout reais em rota temporária removida antes do commit; a página completa de artigos depende do banco. Não foi validado um build de produção nesta execução porque o Prisma Client local não está gerado.

## Publicação

Após o push em `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
