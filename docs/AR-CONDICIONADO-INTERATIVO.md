# Ar-condicionado interativo

Módulo inserido em `/categorias/ar-condicionado`, acima dos filtros e vídeos, seguindo a interação de Suspensão. Modelo procedural genérico inspirado na imagem enviada: 12 itens da legenda mais aquecedor opcional, identificado como 13.

Peças identificadas por etiquetas projetadas com a câmera e selecionáveis pela malha ou lista acessível. Inclui vista montada, separação ajustável, giro da câmera, pausa, controle da ventilação, acionamento do circuito A/C e explicação de cada fase. Modelo metálico com compressor cilíndrico, polia com canais, trocadores com aletas, secador arredondado, tubulações curvas, rotores, filtro plissado e caixa HVAC em corte. Aletas e fixações estáticas agrupadas por material para reduzir chamadas de desenho.

O circuito representado usa válvula de expansão e filtro secador na linha de alta. O acumulador de arquiteturas com tubo de orifício não é mostrado como peça equivalente. Partículas indicam compressor → condensador → filtro secador → válvula → evaporador → compressor, com mangueiras acompanhando a separação. Setas independentes mostram o ar da cabine do blower ao filtro, evaporador, aquecedor e saída. Polia e ventoinhas são ilustrativas; não simulam embreagem, termodinâmica, carga, sensores ou estratégias eletrônicas reais. Desligar A/C oculta partículas do refrigerante; a ventilação pode continuar funcionando.

Renderização carregada no cliente, respeitando movimento reduzido, aba oculta e visibilidade. Pausa mantém a cena e permite ajustar controles. No modo sem WebGL, ficam disponíveis esquema estático e descrições; ajustes de movimento são desabilitados. Não há pressão, temperatura ou quantidade de carga prescritas.

A imagem original não foi incorporada como fotografia: o anexo está visível na conversa, mas não há arquivo acessível no workspace. O modelo é uma interpretação 3D da referência, não uma animação da imagem original.

Validação: geometria finita dos 13 componentes, limites de separação, ciclo fechado, mangueiras seguindo posições, desligamento dos movimentos e HTML acessível sem WebGL. Testes de regressão de Suspensão, TypeScript direcionado e lint. Sem validação visual em navegador/GPU nesta sessão; build completo permanece dependente de geração Prisma indisponível no ambiente.

Publicar pelo fluxo existente: push no GitHub e Render → Manual Deploy → Deploy latest commit.

## Narração ao selecionar

Cliques na peça 3D, etiqueta, lista ou etapa do ciclo falam o nome e a função em português, com controles para repetir, interromper e desligar a narração. O áudio começa após uma ação do visitante e a fala anterior é cancelada ao escolher outra peça. Disponibilidade e voz dependem do navegador/dispositivo. A descrição em texto permanece acessível. Detalhes e validação em `docs/NARRACAO-PECAS-HVAC.md`.
