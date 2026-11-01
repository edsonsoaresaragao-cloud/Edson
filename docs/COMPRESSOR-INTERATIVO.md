# Compressor de ar-condicionado interativo

Acesso por **Explorar compressor ↗**, ao lado de **Restaurar câmera** na barra do módulo HVAC de `/categorias/ar-condicionado`. Destino: `/categorias/ar-condicionado/compressor`, com link de retorno ao sistema completo.

Modelo procedural genérico de compressor axial com embreagem, inspirado na referência. Inclui polia com canais, rolamento, placa de embreagem, eixo, carcaças cilíndricas com nervuras e apoios, bobina com espiras, placa inclinada e seis pistões, placa de válvulas, tampa traseira, retentor, chicote, conexões, parafusos e O-rings. Geometrias estáticas agrupadas por material; membros móveis continuam independentes. Há 36 malhas após agrupamento.

A numeração preserva a referência. Como 11 e 14 apontam às mesmas conexões no cartaz, a interface identifica 11 como o fluxo ilustrativo de sucção/descarga e 14 como as portas físicas, sem inventar uma peça adicional. As 16 identificações têm etiquetas que acompanham a câmera e seleção por malha ou lista com descrição.

Modos: montado, corte em funcionamento, vista explodida e separação ajustável. Controles de pausa, velocidade didática, embreagem e restauração da câmera. Desacoplamento mantém a polia girando e conserva a posição do eixo, placa e pistões. A bobina permanece fixa. Pistões axiais acompanham o plano da placa inclinada, com deslocamento `0.5 + r·tan(α)·cos(φ−θ)` para raio `r=0.39` e inclinação `α=0.32` radianos, em unidades arbitrárias. Fluxos são representados por setas, sem cálculo de pressão, vazão ou temperatura.

Carcaça parcialmente aberta no corte; vista montada fecha a carcaça. Explosão é apenas visual e não corresponde a procedimento de desmontagem, tolerâncias, folgas, torques ou aplicação real. O exemplo não abrange compressores elétricos, sem embreagem ou de outros mecanismos.

Carregamento do renderizador apenas no cliente, com pausa ao ocultar aba/sair da área visível e respeito a movimento reduzido. Sem WebGL, esquema estático e descrições continuam disponíveis. Recursos de GPU são liberados no desmonte ou perda de contexto.

Validação: cinco testes do compressor (geometria, cinemática, desacoplamento, corte/seleção e acesso/HTML), mais quatro testes HVAC; TypeScript direcionado e lint aprovados. Sem validação visual em navegador/GPU nesta sessão. Build completo continua dependente da geração Prisma indisponível no ambiente.

Publicação pelo fluxo existente do Render: **Manual Deploy → Deploy latest commit** após o push no GitHub.
