# Narração das peças do compressor

Em `/categorias/ar-condicionado/compressor`, o clique na peça 3D, etiqueta, lista lateral ou etapa de funcionamento fala o nome e a função da identificação selecionada. Os textos vêm de `src/lib/compressor-parts.ts`, preservando os 16 itens, inclusive a distinção entre fluxo (11) e conexões físicas (14).

**Falar ao selecionar**, **Ouvir peça novamente** e **Interromper fala** seguem o comportamento do HVAC: primeira fala após ação do visitante; nova seleção cancela a anterior; repetição do mesmo item; opção de desligar a narração. Alterar montado/corte/explosão não inicia áudio. A descrição textual continua disponível sem voz ou WebGL.

## Implementação

`src/components/compressor-explorer.tsx` reúne os caminhos de seleção em um callback estável. Usa o hook existente `src/components/use-part-narration.ts` e o componente compartilhado `src/components/part-narration-controls.tsx`. O HVAC também utiliza esse componente, preservando suas ações e mensagens.

Os pedidos de voz usam idioma `pt-BR`, preferindo voz brasileira e a opção local quando disponível. A reprodução depende das vozes e do áudio do navegador/dispositivo. Ao desligar, sair da página, ocultar a aba ou desmontar o módulo, a fala atual é cancelada. Sem chave, endpoint ou variável de ambiente adicional. O mecanismo 3D e seus controles de movimento permanecem os existentes.

## Validação

`tests/browser/compressor-narration.spec.ts` cobre desktop/celular: texto dos 16 itens; WebGL real com seleção na lista, etiquetas e raycasting; ausência de fala ao carregar ou trocar vistas; repetição; interrupção; silenciamento; eventos atrasados; erros; etapas; encerramento da fala; fallback; acessibilidade nos dois temas e largura responsiva.

`tests/browser/hvac-narration.spec.ts` verifica a regressão do HVAC, incluindo vozes tardias, idioma e limpeza na navegação. O adaptador de voz dos testes foi reunido em `tests/browser/support/part-narration.ts`. As chamadas à síntese são registradas para conferir texto, idioma e ciclo de vida; a seleção 3D é real. Isso não representa avaliação audível de todas as vozes/dispositivos.

Resultado: nove testes de modelo/HTML e 16 cenários de navegador aprovados, incluindo seis do compressor e dez de regressão do HVAC. `tests/compressor.test.tsx` e `tests/hvac.test.tsx` cobrem geometria, cinemática e HTML inicial dos controles. TypeScript restrito, ESLint e revisão visual aprovados. A compilação de produção permanece sem verificação neste ambiente porque o cliente Prisma não está gerado.

## Publicação

Após o push em `main`, executar **Render → Manual Deploy → Deploy latest commit**.
