# Módulo dianteiro interativo

Inserido somente em `/categorias/suspensao`, acima dos filtros e vídeos existentes. Modelo procedural genérico McPherson com transmissão transversal, inspirado na referência visual fornecida. Não representa um CAD de fabricante nem uma aplicação específica.

- 20 grupos selecionáveis pela lista acessível ou pelo clique nas malhas 3D; descrição e destaque do componente selecionado.
- Vista montada e separação ajustável das peças, esterçamento de ±25°, amplitude de compressão, pausa e restauração da câmera; arraste para girar.
- Disco e cubo giram, pinças acompanham o esterçamento; molas mudam de comprimento com o curso. Na explosão, o movimento diminui até parar para facilitar o estudo.
- O diferencial é mostrado separado para fins didáticos, embora integre a transmissão transversal. Movimento ilustrativo: não calcula cargas, alinhamento, geometria Ackermann, frenagem ou diferenças de velocidade entre rodas em curvas.
- Renderizador carregado apenas no cliente, com iluminação de ambiente e materiais metálicos. Interrompe animação fora da tela, em aba oculta, na pausa e com preferência por movimento reduzido. Libera recursos no desmonte e em perda de contexto WebGL.
- Sem WebGL, preserva esquema SVG e lista com descrições; os ajustes de movimento ficam indisponíveis. O esquema não é uma reprodução da vista 3D.

Validação: testes de geometria finita nos 20 grupos, rotação disco/pinça, compressão, separação, limites dos controles e renderização HTML no servidor; TypeScript direcionado aos novos módulos. Sem validação visual de GPU/navegador nesta sessão. Build completo depende de geração do Prisma, cujo download está bloqueado no ambiente.

Publicação: o push atualiza o código no GitHub; o Render exige **Manual Deploy → Deploy latest commit** porque o deploy automático está desativado.
