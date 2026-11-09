# Catálogo de freios ABS em Notícias e artigos

O catálogo integra a biblioteca de `/artigos` e abre diretamente em `/artigos?catalog=freios-abs`. A biblioteca reúne 12 catálogos técnicos.

## Organização e interação

As oito fichas preservam a numeração da referência e dos componentes principais do interativo existente: sensores de velocidade das rodas, ECU ABS, unidade hidráulica, válvulas solenoides, motor da bomba, reservatório, cilindro-mestre e tubulações.

Cada ficha apresenta imagem, nome, função e observações de identificação ou inspeção. A busca aceita número exato, nome, função e sinônimos. Há quatro grupos de sistema, ordenação e restauração de filtros sem resultados.

Sete vistas complementares organizam os detalhes:

- Conjunto ABS completo.
- Vista explodida do módulo ABS.
- Distribuição do sistema no veículo.
- Sensor e elemento de leitura da roda.
- Sensores, ECU e comando hidráulico.
- Acionamento e alimentação hidráulica.
- Redução de pressão e recirculação.

Imagem, nome e botão de detalhes abrem a ficha ampliada e acionam a leitura do nome e da função em português. Os controles existentes permitem repetir, interromper e desativar a voz. Fechar a ficha por botão ou Escape interrompe a fala e restaura o foco. **Explorar ABS interativo** abre `/categorias/freios-e-abs`.

## Imagens e conteúdo técnico

O arquivo local `public/images/abs-reference/catalog.webp` reúne 15 ilustrações didáticas geradas: oito componentes e sete vistas. O atlas tem 1.254 × 1.254 pixels, três colunas, cinco linhas e 212.272 bytes. As proporções consideram os limites reais das linhas, que têm pequenas diferenças de altura. As legendas identificam ilustrações geradas, sem atribuição a fabricante ou aplicação específica.

O conteúdo inclui visão geral, cinco passos de funcionamento, três fases de modulação, tipos de sensor e elemento de leitura, recursos e limites do ABS e cinco grupos de falhas e sintomas.

O exemplo de quatro canais possui oito válvulas, uma de entrada e uma de saída por roda. Na demonstração, aumentar pressão usa entrada aberta e saída fechada; manter usa ambas fechadas; reduzir usa entrada fechada e saída aberta. O fluido liberado é recolhido em acumulador de baixa pressão e recirculado pela bomba ao circuito a montante das válvulas de entrada. A imagem não prescreve roteamento real de tubulações.

Motor e elemento de bombeamento são funções distintas. Ausência de ruído não comprova, por si só, defeito na bomba. Sensores ativos e passivos e anéis dentados ou magnéticos exigem métodos de inspeção próprios. A presença de ABS não define recursos de estabilidade e tração, e o sistema não garante menor distância de frenagem em todos os pisos.

Discos, pinças, cubos, anéis, chassi, pedal, servofreio e acumuladores aparecem como contexto das vistas e não alteram a lista principal de oito identificações. Construção, circuitos, especificação do fluido e procedimentos dependem do veículo.

## Implementação e validação

Dados em `src/lib/abs-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes. O CSS do catálogo mantém os grupos de explicações legíveis em diferentes larguras.

Passaram 73 testes de dados, componentes e modelos, incluindo os 12 catálogos, o interativo ABS e os controles de narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram.

Passaram 14 cenários de navegador em computador e celular com Chromium, cobrindo o novo catálogo e a regressão de MPI: busca, sistemas, ordenação, imagens, fichas ampliadas, foco/Escape, links, leitura das oito fichas e sete vistas, troca de catálogo, restauração pela URL e ausência de transbordamento horizontal. A verificação axe não encontrou violações nos escopos avaliados dos dois temas e da ficha ampliada. O enquadramento das imagens também foi conferido visualmente.

Os testes de narração registram chamadas da API e não comprovam áudio audível em todos os dispositivos. A prévia usa a biblioteca e o layout reais em rota temporária, removida antes do commit. A página completa de artigos depende do banco. O build de produção não foi validado nesta execução; o Prisma Client local não está gerado.

## Publicação

Após enviar a alteração a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
