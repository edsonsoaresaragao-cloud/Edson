# Motor animado na abertura

A homepage substitui o SVG esquemático por uma ilustração realista original gerada por IA, sem associação a um fabricante específico. A arte mostra um motor de quatro cilindros em vista explodida. Três faixas transparentes são animadas por transformações CSS: cabeçote, bloco e conjunto inferior. É movimento ilustrativo de separação; não simula combustão nem o ciclo mecânico em funcionamento.

O componente `EngineHero` inclui descrição acessível, pausa/reprodução e suporte a `prefers-reduced-motion`. A animação reduzida fica estática e o controle de movimento é ocultado nessa preferência. Não usa WebGL, vídeo externo nem novos pacotes. As três camadas reutilizam o mesmo endereço de imagem e as versões responsivas são selecionadas pelo navegador.

Arquivos WebP com transparência: 1024×1024 (176.920 bytes) e 640×640 (80.410 bytes). Foram verificadas as linhas de separação transparentes nas duas versões, a tipagem do componente e sua renderização em servidor com descrição e controle. Não houve verificação visual da animação em navegador neste ambiente.

Publicação no Render: implantar o último commit da branch main quando Auto-Deploy estiver desativado. Não requer migrações nem variáveis de ambiente novas.
