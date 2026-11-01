# Motor 3D em funcionamento na abertura

A abertura carrega sob demanda um motor genérico de quatro cilindros em corte, modelado com geometria tridimensional no navegador usando Three.js. Materiais metálicos, reflexos de ambiente, iluminação quente/fria, sombras, superfícies arredondadas e perspectiva substituem o desenho plano quando WebGL está disponível. O modelo é procedural e didático: não é escaneamento nem réplica CAD validada de um motor comercial.

O mecanismo continua usando a restrição biela-manivela compartilhada com a versão SVG: pinos giram, pistões se deslocam verticalmente e bielas mantêm o comprimento. Os pares 1/4 e 2/3 e a ordem 1–3–4–2 são preservados. O modelo inclui anéis, pinos, bielas de seção composta, contrapesos, mancais, volante com dentes e parafusos, válvulas, molas comprimíveis e ressaltos de comando. A roda e os ressaltos de comando giram à metade da velocidade do virabrequim. Os perfis de comando, molas e distribuição são simplificações didáticas.

Uma volta dura aproximadamente 2,8 segundos no 3D: câmera lenta educativa, não uma indicação de marcha lenta real ou pressão de combustão. O brilho discreto nas câmaras é ilustrativo. Não há áudio automático.

O carregamento é assíncrono; o SVG animado permanece disponível durante a carga e em caso de falta de suporte a WebGL ou perda de contexto. O código respeita pausa e movimento reduzido, interrompe a animação fora da tela ou em aba oculta e libera recursos ao sair da página. O modelo usa agrupamento de geometria por material para limitar chamadas gráficas (70 meshes nesta versão), resolução de tela limitada e até 30 quadros/s em telas pequenas ou 60 em maiores. O desempenho efetivo depende do aparelho.

Verificação concluída: tipagem, renderização inicial sem GPU com alternativa SVG, invariantes mecânicos, encaixe tridimensional das bielas, dados geométricos finitos e enquadramento dos extremos do modelo na câmera. O ambiente não disponibiliza ferramenta de navegador: não foram executados teste visual WebGL nem medição de quadros/s em aparelhos reais. O build integral Next/Prisma também não foi executado aqui.

A renderização 3D usa o navegador do visitante, sem GPU ou serviço pago adicional no Render. A publicação requer implantar o último commit da branch main quando Auto-Deploy estiver desativado. Não há novas variáveis nem migrações.

Referência da biblioteca: [documentação oficial do Three.js](https://threejs.org/docs/). O cenário de iluminação usa o RoomEnvironment fornecido pelo pacote.
