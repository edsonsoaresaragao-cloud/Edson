# Catálogo de injeção multiponto em Notícias e artigos

O catálogo MPI integra a biblioteca de `/artigos` e pode ser aberto diretamente em `/artigos?catalog=injecao-mpi`. A biblioteca reúne 11 catálogos técnicos.

## Organização e interação

As 16 fichas preservam a numeração da referência e dos componentes principais do interativo MPI: bomba, filtro, regulador, flauta, injetores, MAF, borboleta, IAT, IAC, sonda lambda, ECU, purga EVAP, relé, bobinas, velas e cânister.

Cada ficha apresenta imagem, nome, função e observações de identificação ou inspeção. A busca aceita número exato, nome, função e sinônimos; há filtros por cinco sistemas, ordenação e restauração do estado vazio. Imagem, nome e botão de detalhes abrem a ficha ampliada.

Oito vistas organizam o funcionamento:

- Vista geral da injeção MPI.
- Alimentação de combustível.
- Admissão e marcha lenta.
- Injeção nos dutos de admissão.
- Entradas e saídas da ECU.
- Cânister e sistema de purga.
- Ignição e combustão.
- Sonda lambda e controle de mistura.

Selecionar uma peça ou vista aciona a leitura do nome e da função em português. Os controles compartilhados permitem repetir, interromper e desativar a narração. Fechar a ficha por botão ou Escape interrompe a fala e devolve o foco à origem. O link **Explorar injeção MPI interativa** abre `/categorias/injecao-eletronica`.

## Imagens e conteúdo técnico

O arquivo local `public/images/mpi-reference/catalog.webp` reúne 24 ilustrações didáticas geradas: 16 componentes e oito vistas. O atlas tem 1.145 × 1.374 pixels, quatro colunas, seis linhas e 238.628 bytes. A proporção de cada célula considera as dimensões reais do arquivo. As legendas informam que as imagens são ilustrações geradas, sem atribuição a fabricante ou aplicação específica.

O conteúdo inclui cinco passos de funcionamento, seis grupos de entradas da ECU, cinco grupos de saídas, recursos possíveis, cinco grupos de falhas e distinções de construção.

O exemplo usa quatro cilindros, injetores nos dutos antes das válvulas, MAF, borboleta mecânica com IAC separado e regulação com retorno. Essa combinação não define todos os motores MPI: outros projetos podem utilizar MAP, borboleta eletrônica e regulação em outro local, inclusive no tanque. Não há valores de pressão ou pinagem universais.

O local da injeção MPI é distinguido da injeção direta na câmara. A centelha ocorre na câmara, enquanto a pulverização representada ocorre na admissão. A sonda lambda informa oxigênio no escape; o controle em malha fechada depende das condições e da estratégia. O cânister retém vapores em carvão ativado, e o caminho da purga é separado da linha de combustível líquido.

Tanque, filtro de ar, coletor, motor, catalisador e sensores adicionais das vistas são contexto. Eles não alteram a lista principal de 16 componentes. As imagens não estabelecem procedimentos de manutenção nem confirmam defeitos isoladamente.

## Implementação e validação

Dados em `src/lib/mpi-reference-catalog.ts`, registro em `src/lib/technical-catalogs.ts` e interface compartilhada dos catálogos existentes. O CSS específico mantém os grupos de explicações legíveis em diferentes larguras.

Passaram 68 testes de dados, componentes e modelos, incluindo os 11 catálogos, o interativo MPI e os controles de narração. TypeScript com escopo nos módulos e testes envolvidos e ESLint passaram.

Passaram 14 cenários de navegador em computador e celular com Chromium: leitura das 16 fichas e oito vistas, imagens, busca, sistemas, ordenação, fichas ampliadas, foco/Escape, links, troca de catálogo, persistência pela URL e regressão de chave/imobilizador. A verificação axe não encontrou violações nos escopos avaliados dos dois temas e da ficha ampliada. Também foram conferidos ausência de transbordamento horizontal e enquadramento das imagens.

Os testes de narração registram chamadas da API de voz; eles não comprovam áudio audível em todos os dispositivos. A prévia usa o componente da biblioteca e o layout reais em rota temporária, removida antes do commit. A página completa de artigos depende do banco. O build de produção não foi validado nesta execução; o Prisma Client local não está gerado.

## Publicação

Após enviar a alteração a `main`, implantar no serviço existente: **Render → Manual Deploy → Deploy latest commit**. O envio ao GitHub não comprova atualização da versão pública.
