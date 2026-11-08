# Catálogo de chave e imobilizador em Notícias e artigos

O catálogo pode ser selecionado na biblioteca de `/artigos` ou aberto em `/artigos?catalog=chave-e-imobilizador`. A biblioteca reúne dez catálogos técnicos.

## Organização

As nove fichas seguem a numeração do cartaz e as primeiras nove identificações do interativo de partida existente: chave codificada, transponder, cilindro/comutador, antena leitora, imobilizador/BCM, ECU, relé/fusível, arranque e bobinas/injetores.

Cada ficha possui imagem, nome, função e observações de identificação e inspeção. Há busca por número exato, nome, função e sinônimos, filtros por sistema, ordenação e estado vazio com restauração.

Seis vistas complementares organizam os detalhes:

- Chave e transponder em detalhe.
- Instalação na coluna de direção.
- Comunicação entre imobilizador e ECU.
- Chave reconhecida.
- Chave não reconhecida.
- Indicação do imobilizador no painel.

Imagens, nomes e botões abrem a ficha ampliada e acionam a leitura de nome e função em português. Os controles existentes permitem repetir, interromper e desligar a voz. Fechar por botão ou Escape interrompe a leitura e devolve o foco à origem. **Explorar partida e imobilizador interativos** abre `/categorias/ignicao`.

## Imagens e conteúdo técnico

O atlas local `public/images/immobilizer-reference/catalog.webp` contém 15 ilustrações geradas, com 972 × 1.618 pixels, em três colunas e cinco linhas: nove imagens de componentes e seis vistas. A proporção das células considera as dimensões reais do arquivo. As legendas identificam as ilustrações didáticas, sem atribuir fabricante, aplicação, código de chave ou segredo mecânico real.

O conteúdo inclui os sete passos de funcionamento da referência, comparação de reconhecimento, cinco grupos de sintomas, cinco pontos de atenção e distinções entre funções.

O transponder passivo do exemplo é energizado pela antena e não depende da pilha do controle remoto. Cilindro e comutador têm funções diferentes. O relé comuta o circuito de comando previsto, enquanto o fusível protege circuitos; a referência não estabelece uma ligação de potência universal.

BCM, imobilizador e ECU podem distribuir as funções de maneiras diferentes. CAN e LIN não são uma exigência conjunta de toda aplicação. O bloqueio pode atingir arranque, injeção, ignição ou combinações; alguns veículos podem girar sem entrar em funcionamento, enquanto outros não acionam o arranque. Reconhecimento da chave não garante sozinho a partida, e o significado das indicações do painel deve ser conferido no veículo.

## Implementação e validação

Dados em `src/lib/immobilizer-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes.

Em 08/11/2026, passaram 62 testes de dados, componentes e modelos, incluindo os dez catálogos, o interativo de partida e os controles de narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram sem erros ou avisos.

Passaram 14 cenários de navegador em computador e celular, cobrindo o novo catálogo e a leitura de suas nove fichas e seis vistas, com regressão do catálogo de ignição atual. Foram conferidos busca, filtros, ordenação, imagens, diálogo, foco/Escape, links, voz, estados de reconhecimento, troca e restauração pela URL, ausência de transbordamento horizontal e acessibilidade axe nos dois temas e na ficha.

Os testes de voz registram as chamadas da API e não comprovam áudio audível em todos os dispositivos. A prévia usa a biblioteca e o layout reais em rota temporária removida antes do commit; a página completa de artigos depende do banco. Não foi validado um build de produção nesta execução porque o Prisma Client local não está gerado.

## Publicação

Após enviar o commit a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
