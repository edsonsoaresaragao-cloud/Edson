# Ignição atual COP

Acesso por **Explorar ignição atual ↗**, depois de **Restaurar câmera** no módulo de chave/imobilizador em `/categorias/ignicao`. Abre `/categorias/ignicao/atual`, com retorno à categoria.

Modelo procedural inspirado na referência, sem incorporar o arquivo original do cartaz. Mostra quatro bobinas individuais sobre as velas, sensores, ECU, alimentação e chicote; acima há uma cópia ampliada para estudo interno da bobina. Essa cópia não é uma quinta bobina do motor. Grupos 1–6: sistema; 7–13: conector, carcaça, driver, núcleo, primário, secundário e isolador/contato; 14: motor e referência CKP contextuais. Numeração própria da legenda interativa, separando os detalhes internos.

Geometria com corpos cilíndricos, helixes de cobre, núcleo, driver, conector, isolador, velas com nervuras e ECU com aletas. Corte abre janela na carcaça; explosão separa detalhes internos e conjuntos. Geometrias estáticas agrupadas mantendo centelhas, pistões e membros móveis independentes.

Modos montado/corte/explodido, separação contínua, câmera, pausa, seleção e demonstração ligada/desligada. Painel recebe a mesma fase usada na cena. O ciclo compartilha `engineMotion`: período de carga no fim da compressão e centelha no começo da expansão ilustrativa; ordem escolhida 1–3–4–2. Carga e centelha não ocorrem simultaneamente no mesmo cilindro. Desligamento congela o ângulo e elimina comandos/centelhas. Cor vermelha indica alimentação, verde sensores, azul comando, dourado descarga.

O primário armazena energia no campo magnético; a interrupção de corrente produz a elevação de tensão no secundário. Espiras, materiais, dimensões, sincronismo e velocidade são ilustrativos. Não há medição de tensão, corrente, tempo de carga, avanço ou mapa real. Não se presume ferrite ou material único para todos os núcleos. Driver pode estar na bobina ou em outro módulo. Outras arquiteturas podem usar conjuntos/réguas, estratégias e ordens diferentes. Não há procedimento de desmontagem ou diagnóstico.

Renderer apenas no cliente, pausa com aba/visibilidade e preferência por movimento reduzido, liberação de recursos. Enquadramento inicial adaptado à tela. Sem WebGL, esquema estático, lista e descrições continuam disponíveis.

Validação: cinco testes COP (geometria, carga/centelha, corte/desligamento, acesso/HTML e enquadramento) mais seis de regressão do imobilizador/partida. TypeScript direcionado e lint aprovados. Sem conferência visual no navegador/GPU; build completo depende de geração Prisma indisponível no ambiente.

Publicação: push no GitHub; Render → Manual Deploy → Deploy latest commit.
