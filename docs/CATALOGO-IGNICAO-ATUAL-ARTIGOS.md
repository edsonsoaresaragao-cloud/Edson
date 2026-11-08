# Catálogo da ignição atual em Notícias e artigos

O catálogo pode ser selecionado na biblioteca de `/artigos` ou aberto diretamente em `/artigos?catalog=ignicao-atual`. A biblioteca reúne nove catálogos técnicos.

## Organização

As 14 identificações acompanham a numeração do interativo COP existente: os seis grupos principais do cartaz, sete detalhes internos da bobina e o contexto do motor.

- 1–6: ECU, bobinas, velas, sensores, chicote/conectores e alimentação nominal.
- 7–13: conector, carcaça, driver, núcleo, primário, secundário e isolador/contato.
- 14: motor e referência de rotação, identificado como contexto e sem link de compra de peça interna.

Cada ficha oferece imagem, nome, função e observações de identificação e inspeção. Busca por número exato, nome, função e sinônimos, filtros por sistema e ordenação por nome ou número usam a interface existente.

Seis vistas complementares mostram bobina em vista explodida, sistema COP de quatro cilindros, bobina individual, régua/conjunto, sinais e alimentação e centelha na câmara. **Explorar ignição atual interativa** abre `/categorias/ignicao/atual`.

Imagens, nomes e botões das fichas selecionam o item e leem nome e função em português. Os controles permitem repetir, interromper e desligar a voz. A ficha ampliada fecha por botão ou Escape e devolve o foco ao elemento de origem.

## Imagens e esquema funcional

O arquivo local `public/images/current-ignition-reference/catalog.webp` é um atlas de ilustrações geradas, com 1.402 × 1.122 pixels, cinco colunas e quatro linhas. O catálogo utiliza 14 imagens das identificações e cinco vistas desse atlas; a vista de sinais utiliza o SVG local `signal-flow.svg`.

O esquema funcional em SVG distingue alimentação vermelha, sinais dos sensores em verde, comandos em azul e alta tensão em amarelo. Os comandos terminam nas bobinas; cada saída de alta tensão segue para sua vela. A alimentação da ECU e das bobinas é representada a partir da proteção. O desenho não estabelece pinagem ou ligações de manutenção.

As legendas distinguem ilustração gerada e esquema funcional, sem apresentá-los como fotografias de fabricante ou documentação de uma aplicação específica. A proporção das células preserva as dimensões reais do atlas.

## Conteúdo técnico

O catálogo reúne os seis passos de funcionamento, funções dos sensores relacionados, recursos possíveis, cinco grupos de falhas e sintomas, comparação de arquiteturas e aplicação.

O driver comuta a corrente primária e não gera diretamente a alta tensão. A separação da bobina encapsulada é didática. Materiais do núcleo, driver integrado, pinos e estratégias dependem do projeto.

Régua não significa automaticamente uma única bobina ou menor eficiência. A alimentação de 12 V é nominal e a faixa de 20–40 kV do cartaz é ilustrativa, sem definir leitura constante ou especificação universal. A sonda lambda participa do controle da mistura e não dispara diretamente cada centelha. Motores diesel convencionais utilizam ignição por compressão, sem este mesmo conjunto de bobinas e velas de centelha.

## Validação

Em 08/11/2026, passaram 55 testes de dados, componentes e modelos, incluindo os nove catálogos de referência, o modelo COP e os controles de narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram sem erros ou avisos.

Passaram 16 cenários de navegador em computador e celular: o novo catálogo e a leitura das 14 identificações e seis vistas, com regressão do catálogo e narração da transmissão manual. Foram conferidos busca, filtros, ordenação, imagens, ficha, foco/Escape, links, voz, contexto sem link de compra, troca e restauração pela URL, ausência de transbordamento horizontal e acessibilidade axe nos dois temas e no diálogo. Testes próprios verificam os destinos dos fluxos no SVG.

Os testes de voz registram chamadas da API e não comprovam áudio audível em todos os dispositivos. A prévia usa a biblioteca e o layout reais em uma rota temporária removida antes do commit; a página completa de artigos depende do banco. Não foi validado um build de produção nesta execução porque o Prisma Client local não está gerado.

## Publicação

Após enviar o commit a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
