# Narração das peças do ar-condicionado

Em `/categorias/ar-condicionado`, a seleção de uma peça do módulo HVAC fala seu nome e sua função. O mesmo comportamento atende ao clique na malha 3D, na etiqueta, na lista lateral e nas etapas do ciclo. Clicar novamente no mesmo item repete sua explicação. As 13 identificações usam os textos existentes de `src/lib/hvac-parts.ts`.

## Controles

- **Falar ao selecionar**: habilita ou desabilita a narração. Começa habilitado em navegadores compatíveis; a primeira fala depende de um clique do visitante.
- **Ouvir peça novamente**: repete o nome e a função da seleção atual.
- **Interromper fala**: cancela a narração em andamento.

A fala anterior é cancelada antes de iniciar outra. Movimentos, animação, alterações de câmera e abertura da página não iniciam áudio. Desligar a narração mantém a seleção e a descrição em texto. Sem síntese de voz, o módulo informa a indisponibilidade e mantém as funções acessíveis; a lista também funciona no modo sem WebGL.

## Implementação

`src/components/use-part-narration.ts` usa a síntese de voz do navegador. O pedido tem idioma `pt-BR`, velocidade 0,95 e texto `Nome. Função: descrição`. Prefere voz brasileira local, depois outra brasileira e, na ausência, outra voz em português. Com a lista ainda vazia, solicita o idioma ao navegador; novas seleções consultam novamente as vozes, atendendo ao carregamento tardio. A reprodução efetiva depende das vozes e do áudio disponíveis no dispositivo.

`src/components/hvac-explorer.tsx` reúne os caminhos de seleção em um callback estável, mantendo o renderizador existente. O hook trata término, erro e eventos atrasados de falas canceladas. Ao ocultar a aba, sair da página ou desmontar o módulo, cancela a fala atual e remove os ouvintes. O estado inicial de suporte é compatível com renderização no servidor. Sem chave, arquivo de áudio, endpoint ou variável de ambiente adicional.

## Validação

`tests/browser/hvac-narration.spec.ts`, em desktop e celular, cobre:

- WebGL real: os 13 itens da lista, etiquetas e seleção por raycasting em malha visível.
- Ausência de fala inicial, repetição da mesma peça, texto exato de nome/função e idioma solicitado.
- Repetir, interromper, silenciar, nova seleção cancelando a anterior e evento antigo sem interromper a nova fala.
- Vozes brasileiras/portuguesas, carregamento tardio, falha de reprodução, conclusão e limpeza na navegação.
- Fallback sem WebGL e sem API de voz, acessibilidade dos controles nos dois temas e largura responsiva.
- Uma verificação adicional usando a API nativa, preservando a seleção quando a voz não pode ser reproduzida.

Os testes controlados registram pedidos à síntese de voz para verificar texto, idioma e eventos. A seleção 3D é real. Não representam uma avaliação audível de todas as vozes/dispositivos. O HTML inicial dos controles também é coberto em `tests/hvac.test.tsx`.

Resultado: 10 cenários de narração aprovados nos dois projetos de navegador, mais 34 testes de dados, HTML e modelos do conjunto envolvido. TypeScript restrito e ESLint dos arquivos envolvidos aprovados. A prévia local usa o componente e o layout reais em rota temporária removida antes do commit. A compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**.
