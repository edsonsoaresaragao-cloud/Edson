# Narração das peças em todos os módulos existentes

Ao selecionar uma peça, o site lê «nome da peça. Função: descrição» em português. O recurso usa a voz do navegador e dispensa configurar uma chave de API de áudio.

## Cobertura

| Módulo 3D                    | Identificações |
| ---------------------------- | -------------: |
| Suspensão / módulo dianteiro |             20 |
| Ar-condicionado / HVAC       |             13 |
| Compressor                   |             16 |
| Alternador                   |             16 |
| Arrefecimento                |             16 |
| Freios e ABS                 |             11 |
| Injeção eletrônica           |             19 |
| Ignição / partida autorizada |             11 |
| Direção hidráulica           |             20 |
| Direção elétrica EPS         |             19 |
| Ignição COP                  |             14 |
| Motor de partida             |             11 |

As 186 identificações incluem os elementos de contexto que já existiam nas visualizações. Cliques nas malhas 3D, etiquetas, listas e atalhos de seleção usam o mesmo comando de voz. O esquema alternativo do motor de partida também mantém a seleção com fala.

O atlas `/explodedview` oferece funções individuais para os 24 componentes de cada família, os oito marcadores da vista gerada e as sete regiões do esquema. Pistões/anéis e bielas têm nomes e funções separados na ficha. Itens sem marcador podem ser ouvidos pela lista, sem inventar uma localização na imagem. Itens não aplicáveis continuam identificados como N/A e a leitura inclui esse aviso. O esquema também oferece botões para seleção pelo teclado.

Nos seis catálogos ilustrados de artigos, os 103 componentes e 30 conjuntos podem ser ouvidos pela foto, pelo nome ou pelo botão da ficha. A narração para ao fechar a ficha, inclusive com Escape. Os 40 sensores e atuadores têm seleção pela foto e pelo nome; alterar seus filtros interrompe a voz e limpa a seleção anterior.

Os cartões de navegação em `/categorias` continuam abrindo as respectivas páginas. A fala está nas peças dos módulos e catálogos existentes; páginas que contêm apenas artigos ou vídeos não recebem peças fictícias.

## Controles e comportamento

- **Falar ao selecionar:** ativa ou desativa a leitura no módulo aberto.
- **Ouvir peça novamente:** repete a peça selecionada, inclusive após clicar nela novamente.
- **Interromper fala:** cancela a leitura atual.
- Não há fala automática ao abrir a página, animar o mecanismo ou alterar a vista.
- Uma nova seleção interrompe a leitura anterior. Sair da página ou ocultá-la também interrompe a fala.
- A preferência de voz continua sendo português brasileiro, priorizando uma voz local. Disponibilidade e timbre dependem do navegador e do dispositivo.
- Sem a API de voz, os controles informam a indisponibilidade e as funções continuam acessíveis em texto. Sem WebGL, a seleção por listas continua funcionando.

## Validação

Execução local em 08/11/2026, com Chromium em tamanhos de computador e celular. A suíte `all-systems-narration.spec.ts` passou nos 48 casos: todas as 186 identificações por lista, os atalhos de seleção, repetição, silêncio, etiquetas e cliques reais nas malhas dos 12 módulos, com WebGL real.

Os 22 casos de narração dos catálogos e as 42 regressões de busca, filtros, imagens, fichas, restauração pela URL e acessibilidade também foram validados. Total: 112 casos de navegador passaram, incluindo as reexecuções após sincronizar a hidratação no teste de sensores e corrigir os parâmetros da rota temporária de teste. A verificação de acessibilidade cobriu os temas claro e escuro.

Os 111 testes de componentes, modelos e renderização no servidor passaram. A checagem TypeScript dos módulos e testes alterados passou. ESLint dos arquivos alterados passou sem erros; permanecem dois avisos de imagens `<img>` já existentes no atlas. A checagem geral do repositório continua impedida pela ausência do Prisma Client gerado neste ambiente e por arquivos de depuração locais, sem relação com a narração. Não foi validado um build de produção nesta execução.

Os testes de voz usam um registrador da API para conferir texto, idioma, substituição e cancelamento. Eles não comprovam áudio audível em todos os aparelhos. Os testes de malha usam renderização e eventos de ponteiro reais.

As páginas de categorias e artigos dependem do banco. Na execução local, as verificações dessas páginas usam rotas temporárias com os mesmos componentes reais e o layout do site; essas rotas não fazem parte da entrega. As suítes apontam por padrão para as rotas reais e aceitam `ALL_VOICE_PREVIEW_PREFIX` apenas para essa execução isolada.

```bash
npx playwright test tests/browser/all-systems-narration.spec.ts tests/browser/catalogs-narration.spec.ts tests/browser/*reference-catalog.spec.ts tests/browser/sensor-actuator-catalog.spec.ts
npx tsx --test tests/part-narration.test.tsx
```

## Publicação

A alteração precisa ser implantada no serviço existente do Render. Enviar o commit ao GitHub não comprova que a versão pública mudou. Com implantação automática desativada, use **Manual Deploy → Deploy latest commit** no serviço Edson Oficina.
