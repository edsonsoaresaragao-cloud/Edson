# Catálogo do sistema elétrico e eletrônico em Notícias e artigos

O catálogo integra a biblioteca de `/artigos` e abre em `/artigos?catalog=sistema-eletrico-eletronico`. A biblioteca reúne 14 catálogos técnicos.

## Organização e interação

As 11 fichas preservam a numeração da referência: bateria, alternador, motor de partida, caixa de fusíveis e relés, unidades de comando, chicotes, conectores, sensores, atuadores, pontos de aterramento e barramentos de distribuição.

Cada ficha apresenta imagem, nome, função e observações de identificação ou inspeção. A busca aceita número exato, nome, função e sinônimos. Há seis grupos de sistema, ordenação e restauração dos filtros sem resultados.

Nove vistas organizam os detalhes:

- Visão geral do sistema elétrico.
- Chicote do motor.
- Chicote da cabine.
- Chicote das portas.
- Chicote traseiro.
- Chicote do teto.
- Exemplos de conectores.
- Fusíveis, relés e distribuição.
- ECUs de motor, ABS, BCM e SRS.

Imagem, nome e botão de detalhes abrem a ficha ampliada e acionam a leitura do nome e da função em português. Os controles existentes permitem repetir, interromper e desativar a voz. Fechar por botão ou Escape interrompe a fala e restaura o foco. **Ver conteúdos de elétrica automotiva** leva à categoria existente `/categorias/eletrica-automotiva`.

## Imagens e conteúdo técnico

O arquivo local `public/images/electrical-reference/catalog.webp` contém 20 ilustrações didáticas geradas: 11 componentes e nove vistas. O atlas tem 1.122 × 1.402 pixels, quatro colunas, cinco linhas e 267.004 bytes. As proporções consideram os limites reais das linhas. As legendas identificam ilustrações geradas, sem atribuição a fabricante ou aplicação específica.

O conteúdo inclui cinco passos de funcionamento, oito grupos de circuitos da referência, cinco regiões do veículo, seis orientações de inspeção, seis grupos de sintomas e distinções entre funções.

O exemplo é de um veículo a combustão com sistema nominal de 12 V. A faixa de carga de 13,8–14,8 V citada no cartaz é contextualizada: temperatura, estado da bateria e estratégias de carga inteligente alteram a leitura, sem estabelecer um limite universal.

O barramento do item 11 distribui energia e é diferenciado da rede CAN de dados. CAN pode atender diversos sistemas, além da multimídia. As cores funcionais do cartaz são uma legenda didática e não definem cores de fios, rotas ou pinagem de uma aplicação.

Vedação, trava e múltiplas vias podem coexistir no mesmo conector. Fusíveis protegem contra sobrecorrente e relés comutam cargas conforme o projeto. As famílias ECU de motor, ABS, BCM e SRS são exemplos de funções e integrações diferentes. Os cinco chicotes regionais detalham a categoria principal de chicotes sem acrescentar números à lista de 11 itens.

## Implementação e validação

Dados em `src/lib/electrical-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes. O CSS mantém os grupos de explicações legíveis em diferentes larguras.

Passaram 77 testes de dados, componentes e narração, incluindo os 14 catálogos. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram.

Foram validados 14 cenários únicos de navegador em computador e celular com Chromium. A execução geral aprovou 12 cenários; os dois cenários de filtro passaram na reexecução após tornar o localizador do teste específico para o campo de seleção. A cobertura inclui imagens, busca, grupos, ordenação, fichas ampliadas, foco/Escape, links, leitura das 11 fichas e nove vistas, cinco chicotes, troca de catálogo, restauração pela URL e regressão de EPS.

A verificação axe não encontrou violações nos escopos avaliados dos dois temas e da ficha ampliada. Também foram conferidos ausência de transbordamento horizontal, enquadramento das imagens e legibilidade das fichas. Os testes de voz registram chamadas da API e não comprovam áudio audível em todos os dispositivos.

A prévia usa a biblioteca e o layout reais em rota temporária, removida antes do commit. A página completa de artigos depende do banco. O build de produção não foi validado nesta execução; o Prisma Client local não está gerado.

## Publicação

Após enviar a alteração a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
