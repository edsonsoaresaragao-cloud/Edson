# Catálogo do módulo dianteiro com direção EPS em Notícias e artigos

O catálogo integra a biblioteca de `/artigos` e pode ser aberto em `/artigos?catalog=direcao-eletrica-eps`. A biblioteca reúne 13 catálogos técnicos.

## Organização e interação

As 17 fichas preservam os nomes e a numeração da referência e do interativo EPS existente: volante, coluna, junta universal, sensor de torque, ECU, motor de assistência, caixa/cremalheira, pinhão, barra axial, terminal, semieixo, bandeja, pivô, agregado, conjunto McPherson, disco e pinça.

O item 15 reúne amortecedor e mola, como no cartaz. Cada ficha possui imagem, nome, função e observações de identificação ou inspeção. A busca aceita número exato, nome, função e sinônimos; também há seis grupos de sistema, ordenação e restauração de filtros sem resultados.

Sete vistas organizam os conjuntos:

- Módulo dianteiro com EPS.
- Do volante à caixa EPS.
- Caixa EPS em corte parcial.
- Sensor de torque, ECU e motor.
- Barras e terminais de direção.
- Suspensão McPherson e freios.
- Subchassi, bandejas e semieixos.

Imagem, nome e botão de detalhes abrem a ficha ampliada e acionam a leitura do nome e da função em português. Os controles existentes permitem repetir, interromper e desativar a voz. Fechar a ficha por botão ou Escape interrompe a fala e restaura o foco. **Explorar direção EPS interativa** abre `/categorias/direcao-hidraulica-e-eletrica/eps`.

## Imagens e conteúdo técnico

O arquivo local `public/images/eps-reference/catalog.webp` reúne 24 ilustrações didáticas geradas: 17 componentes e sete vistas. O atlas tem 1.024 × 1.536 pixels, quatro colunas, seis linhas e 184.074 bytes. As células quadradas preservam as proporções da fonte. As legendas identificam ilustrações geradas, sem atribuição a fabricante ou aplicação específica.

O conteúdo organiza os três passos de funcionamento EPS, o caminho mecânico do volante às rodas, seis recursos possíveis, cinco grupos de inspeção, exemplos de aplicações e distinções entre sistemas.

O exemplo utiliza assistência junto à caixa e mantém o comando mecânico de direção. Outras arquiteturas EPS podem atuar na coluna, no pinhão ou na cremalheira. O sensor de torque informa esforço, que é uma grandeza diferente do ângulo de direção. O motor fornece assistência de esterçamento; os semieixos conduzem torque de propulsão do diferencial às rodas motrizes.

A ausência de bomba e fluido de assistência refere-se à direção EPS pura. Os freios hidráulicos representados possuem seu próprio circuito. A pinça acompanha o esterçamento sem girar com o disco. Cubos, mangas, apoios e outros elementos de suspensão nas vistas são contexto e não alteram a lista principal de 17 identificações.

Após intervenções, geometria e calibrações seguem os procedimentos específicos do fabricante; o catálogo não exige calibração eletrônica universal após toda troca de componente. Categorias de veículos são exemplos de aplicação, sem confirmar compatibilidade das peças. As imagens isoladas também não confirmam fornecimento ou reparo individual de cada elemento.

## Implementação e validação

Dados em `src/lib/eps-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes. O CSS mantém os grupos de explicações legíveis em diferentes larguras.

Passaram 78 testes de dados, componentes e modelos, incluindo os 13 catálogos, o interativo EPS e os controles de narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram.

Passaram 14 cenários de navegador em computador e celular com Chromium, cobrindo o novo catálogo e a regressão de ABS: imagens, busca, filtros, ordenação, fichas ampliadas, foco/Escape, links, leitura das 17 fichas e sete vistas, troca de catálogo, restauração pela URL e ausência de transbordamento horizontal. A verificação axe não encontrou violações nos escopos avaliados dos dois temas e da ficha ampliada. O enquadramento das imagens e a legibilidade das fichas também foram conferidos visualmente.

Os testes de narração registram chamadas da API e não comprovam áudio audível em todos os dispositivos. A prévia usa a biblioteca e o layout reais em rota temporária, removida antes do commit. A página completa de artigos depende do banco. O build de produção não foi validado nesta execução; o Prisma Client local não está gerado.

## Publicação

Após enviar a alteração a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
