# Sistema de arrefecimento interativo

Módulo inserido em `/categorias/arrefecimento`, acima dos filtros e vídeos, seguindo o padrão de Suspensão. Modelo procedural genérico inspirado no cartaz enviado; o arquivo original da imagem não foi incorporado.

Itens 1–15 mantêm a numeração da referência: radiador, eletroventilador, tampa, bomba, carcaça do termostato, termostato, mangueiras superior/inferior, reservatório, aquecedor, mangueiras de alimentação/retorno do aquecedor, blower, dreno e ECT. O motor e o bypass aparecem como contexto no item 16. Todos possuem seleção por malha, etiqueta projetada ou lista com descrição.

Geometria: radiadores com aletas, mangueiras curvas com abraçadeiras, reservatório translúcido com volume de líquido ilustrativo, bomba em corte com impulsor girante e termostato com mola e prato móvel. Geometrias estáticas agrupadas por material; o modelo possui 117 malhas, incluindo partículas e abraçadeiras.

Interação: vista montada/explodida, separação gradual, giro, pausa, restauração de câmera e atalhos de destaque para bomba, termostato, radiador e aquecedor. Estados frio/aquecido, abertura manual do termostato, velocidade didática e comando manual da ventoinha. Não há temperatura nominal nem estratégia automática de controle.

O circuito principal é bomba → motor → termostato → mangueira superior → radiador → mangueira inferior → bomba. No estado frio, o radiador fica sem partículas; motor, bypass e aquecedor continuam com indicação de circulação. Na abertura total, o bypass deste exemplo fecha. Na abertura parcial a indicação divide-se proporcionalmente, sem simulação hidráulica. O aquecedor tem ramal próprio motor → aquecedor → bomba. O reservatório possui linha de compensação sem partículas, não sendo tratado como trajeto principal.

Mangueiras são reconstruídas somente quando a separação muda e acompanham as conexões, inclusive as do motor contextual. Vermelho indica líquido relativamente mais quente; azul, retorno relativamente mais frio. Partículas indicam direção, sem medição de pressão, temperatura ou vazão. Capacidades, pressões, fluido, acionamento da bomba e ventoinha, temperaturas e manutenção dependem do fabricante. A tampa no radiador e a linha do reservatório representam apenas uma arquitetura genérica; não reproduzem todos os sistemas pressurizados.

Renderizador apenas no cliente, respeitando movimento reduzido, aba oculta, visibilidade e pausa. Fallback estático com seleção e descrições sem WebGL. Recursos são liberados no desmonte e na perda de contexto.

Validação: cinco testes do arrefecimento (geometria, caminhos frio/quente, mangueira ligada na explosão, válvula/bomba/ventoinha, HTML acessível) e nove testes de regressão do alternador e HVAC. TypeScript direcionado e lint aprovados. Sem conferência visual em navegador/GPU nesta sessão; build completo depende da geração Prisma indisponível neste ambiente.

Publicação: push no GitHub, seguido de Render → Manual Deploy → Deploy latest commit.
