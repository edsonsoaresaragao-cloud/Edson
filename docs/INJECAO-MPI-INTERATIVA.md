# Injeção eletrônica MPI interativa

Módulo inserido em `/categorias/injecao-eletronica`, acima dos filtros e vídeos. Segue o padrão de Suspensão. A imagem enviada foi usada como referência da interpretação procedural; o arquivo original da fotografia não foi incorporado.

16 itens numerados como na referência: bomba, filtro, regulador, flauta, injetores, MAF, TBI, IAT, IAC, lambda, ECU, purga, relé, bobinas, velas e cânister. Coletor (17), motor em corte (18) e CKP (19) são contexto. Seleção por malha, etiqueta ou lista exibe função e destaque. Formas cilíndricas, coletor com dutos curvos, aletas e conectores da ECU, flauta e bicos detalhados, bobinas individuais e velas. Geometrias estáticas agrupadas por material.

Arquitetura deliberadamente coerente: MPI sequencial de quatro cilindros, borboleta mecânica com IAC e regulador de retorno conectado à flauta. Não combina IAC como requisito de uma borboleta eletrônica; esse outro tipo pode dispensá-lo. Regulação não é apresentada como elemento em série antes da flauta. Circuito: bomba → filtro → flauta; retorno flauta → regulador → módulo da bomba. Ramais de alimentação de cada bico indicados durante seu pulso.

Ar passa pelo MAF e pela borboleta ao coletor. Com borboleta próxima de zero, a indicação de ar usa o desvio IAC; acima do limiar didático, o caminho principal aparece. Vapores: cânister → purga → admissão, separados do combustível líquido. Sinais de MAF, IAT, lambda e CKP seguem à ECU; comandos seguem a injetores, bobinas, purga e relé; relé segue à bomba. Esses sinais são uma representação visual, não leituras ou formas de onda de diagnóstico.

Injetores pulverizam nos dutos de admissão, antes das válvulas. Velas atuam dentro dos cilindros. O ciclo usa `engineMotion` compartilhado com a abertura do site: admissão no terceiro tempo e centelha no início da expansão (ponto morto superior ilustrativo), ordem de ignição 1–3–4–2. Injeção é mostrada durante parte da admissão; sistemas reais podem antecipar/injetar com válvula fechada, variar estratégia ou usar outra ordem. O tempo de pulso aumenta visualmente com a borboleta, sem mapa de calibração. A roda de referência do CKP acompanha a rotação; não há cálculo de dentes ou sinal real.

Controles: montado/explodido, separação, câmera, pausa, demonstração ligada/desligada e abertura da borboleta. Painel de injetores/centelhas recebe os mesmos eventos usados na cena. Desligar conserva posição e interrompe pulsos/fluxos. A animação está em câmera lenta, sem RPM, pressão, temperatura, vazão, AFR, torque, emissões ou dados medidos.

Renderer apenas no cliente, pausa por aba/visibilidade, preferência por movimento reduzido, enquadramento adaptado à tela e liberação de recursos. Sem WebGL, mantém esquema estático, lista e descrições. Foto não representa aplicação exata de fabricante; vista explodida não é procedimento de intervenção.

Validação: seis testes MPI para geometria, ciclo/ignição, borboleta/parada, circuitos, HTML e enquadramento; quatro testes de regressão do movimento do motor. TypeScript direcionado e lint aprovados. Sem conferência visual em navegador/GPU nesta sessão. Build completo depende da geração Prisma indisponível no ambiente.

Publicação pelo fluxo existente: push no GitHub; Render → Manual Deploy → Deploy latest commit.
