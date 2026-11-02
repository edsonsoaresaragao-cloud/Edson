# Catálogo técnico de sensores e atuadores

O catálogo aparece em `/categorias/sensores-e-atuadores`, acima dos conteúdos e vídeos existentes. Não depende de API, banco adicional ou chave de busca para funcionar. A categoria continua sendo carregada pelo fluxo normal do site.

## Conteúdo

- 24 componentes essenciais: 12 sensores e 12 atuadores, com as funções e inspeções fornecidas pelo usuário.
- 16 componentes adicionais: oito sensores e oito atuadores, com descrições educativas acrescentadas para completar as fichas.
- Busca por nome, sigla, sinônimos, função e inspeção; filtros de tipo, sistema e conjunto de componentes; contagens e estado vazio.
- Cada ficha oferece “Pesquisar ofertas”, que abre `/pecas?buy=...` com seu nome. A integração de ofertas continua dependendo das chaves descritas em `BUSCA-DE-PECAS.md`; o catálogo não apresenta preços ou compatibilidade inventados.
- Os filtros por marca, modelo e ano que já existiam continuam na seção de conteúdos e vídeos. O catálogo técnico é genérico e não declara aplicação em um veículo específico.

Dados: `src/lib/sensor-actuator-catalog.ts`. Interface: `src/components/sensor-actuator-catalog.tsx`.

## Fotos e ilustrações

Foram preservadas 23 referências de imagem fornecidas pelo usuário. A primeira versão dos links dos sensores foi usada, pois alguns tokens foram truncados na repetição posterior do pedido. Não se trata de um catálogo oficial Bosch, NGK ou de qualquer loja citada nos títulos. O fragmento “Bosch Auto Parts+2” não foi tratado como uma citação verificável.

22 links são utilizados como fontes de foto, com carregamento adiado, texto alternativo e tratamento de falha. O link do solenoide do câmbio tem o título “Verify Your Identity”: foi mantido apenas na referência da ficha e não é carregado como fotografia. O sensor ABS e os 16 componentes adicionais não vieram com uma foto.

O ambiente de desenvolvimento recusou acesso a `images.openai.com` com HTTP 403. Assim, as fotografias externas **não foram verificadas nem baixadas**. O navegador do visitante tenta carregar a referência enviada; uma fotografia que carregar recebe a legenda “Foto de referência fornecida”. Links externos podem expirar e um título não autentica o conteúdo remoto.

Para que cada ficha permaneça visualmente útil, há um atlas local de 40 **ilustrações didáticas geradas**, com um componente por célula (cinco colunas e oito linhas). O arquivo `public/images/components/sensors-actuators-atlas.webp` foi gerado por ferramenta de imagem e convertido para WebP. A ordem das células é definida por `illustrationIndex`. As ilustrações aparecem antes da foto carregar, na ausência de uma foto ou quando o carregamento falha. A legenda e o texto alternativo identificam explicitamente que são geradas; não são fotografias nem desenhos técnicos de fabricante.

As fichas distinguem sonda antes/depois do catalisador, IAC separado/borboleta eletrônica, TPMS direto/indireto, interruptor/sensor de óleo e wastegate/geometria variável. A foto de atuador de turbo enviada não comprova qual mecanismo equipa o componente mostrado. Não foram inferidos pinagem, valores elétricos, pressão de trabalho, torque ou compatibilidade pelos títulos das referências.

## Verificação

- `npx tsx --test tests/sensor-actuator-catalog.test.tsx`: conteúdo e divisão do catálogo, busca, distinções técnicas, referências de imagem, encaminhamento à busca de ofertas e renderização inicial.
- `npx eslint src/lib/sensor-actuator-catalog.ts src/components/sensor-actuator-catalog.tsx tests/sensor-actuator-catalog.test.tsx tests/browser/sensor-actuator-catalog.spec.ts 'src/app/categorias/[slug]/page.tsx'`.
- TypeScript por configuração temporária restrita aos novos arquivos, sem carregar o Prisma não gerado neste ambiente.
- `tests/browser/sensor-actuator-catalog.spec.ts`: navegação e filtros em desktop/celular, foto carregada simulada, recuperação após falha da foto, ausência de erros de execução, largura responsiva e axe nos temas claro/escuro. As imagens de sucesso são fixtures; esses testes não validam a disponibilidade das fontes externas.

O teste local usa uma rota temporária com o componente e o layout reais, removida antes do commit. A página de categoria completa e a compilação de produção precisam do cliente Prisma, cuja geração não está disponível neste ambiente devido à restrição de rede já identificada. O novo catálogo não altera consultas nem o esquema do banco.

Resultado local: seis testes novos e 14 testes de regressão da busca de ofertas passaram; os seis cenários de navegador passaram nos projetos desktop/celular. TypeScript restrito e ESLint passaram. A revisão visual confirmou a grade de três colunas no desktop e uma coluna no celular.

## Publicação

Com o commit em `main`, usar **Render → Manual Deploy → Deploy latest commit**. Não é necessária uma nova variável de ambiente para o catálogo. As fotos enviadas continuam sujeitas à disponibilidade do servidor de origem; para substituí-las por fotos definitivas, atualizar as referências no arquivo de dados com imagens autorizadas e estáveis.
