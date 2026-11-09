# Transmissão manual interativa

Disponível em `/categorias/transmissao-manual`, acima dos filtros e vídeos. O catálogo em `/artigos?catalog=transmissao-manual` aponta para essa interação, que também oferece acesso às fichas ilustradas.

Os 13 componentes principais mantêm a numeração, os nomes, as funções e as imagens do catálogo existente. Embreagem, alavanca e pedais aparecem como contextos C1, C2 e C3, sem alterar a referência. O item 10, tambor seletor, é apresentado separadamente como alternativa construtiva; não é o acionamento da alavanca em H deste exemplo.

## Modelo e controles

Modelo procedural de uma caixa longitudinal com três eixos e cinco marchas. Inclui dentes helicoidais com perfil aproximado de evolvente, furos centrais, eixos estriados, sincronizadores de latão, luvas, garfos curvos, hastes, rolamentos, retentores e carcaça com flanges, nervuras, fixações e bujão. Materiais metálicos e iluminação de ambiente distinguem as peças. As proporções são didáticas, sem correspondência com um CAD ou aplicação de fabricante.

- Vistas montada, em corte e explodida, com separação ajustável, foco individual, pausa, velocidade, restauração, zoom e rotação da câmera.
- Neutro, cinco marchas e ré. As rotações dependem dos dentes de cada par: relações aproximadas de 3,50; 2,10; 1,40; 1,00; 0,81 e −3,00. A quarta marcha liga diretamente entrada e saída; a ré usa uma engrenagem intermediária deslizante.
- O par permanente usa 24/36 dentes; os pares de marcha somam 60 dentes para manter a distância entre eixos de 1,16 unidades do modelo. Esses valores não são especificações de uma transmissão comercial.
- No neutro, os eixos de entrada e intermediário e as engrenagens livres giram, enquanto a saída permanece parada. Luvas, garfos e hastes acompanham a seleção da marcha. A animação da embreagem distingue volante e platô, movidos pelo motor, do disco ligado à entrada.
- A seleção de uma marcha abre a embreagem. O controle “Embreagem acoplada” permite retomar o movimento. A animação explica o caminho da potência, sem calcular carga, inércia, atrito ou o processo físico de sincronização.

## Identificação, imagens e voz

Clique nas malhas, etiquetas, fichas com miniaturas, imagem selecionada ou atalhos de conjunto para destacar a peça, mostrar sua função e narrar nome e função em português. Todas as seleções usam os controles compartilhados de narração, com silenciar e repetir. Não há fala automática ao abrir a página.

As imagens individuais e as vistas gerais reutilizam o atlas ilustrado existente em `public/images/manual-transmission-reference/catalog.webp`. São ilustrações de referência, não fotografias de peças OEM. A interação não modifica o arquivo fornecido nem anima diretamente os pixels da imagem.

Sem WebGL, permanecem as imagens, fichas, descrições e narração; controles exclusivos do modelo ficam indisponíveis. Sem síntese de voz, a função continua acessível em texto. Os controles possuem nomes acessíveis e funcionam por teclado. O conteúdo técnico do catálogo, incluindo funcionamento, relações, manutenção e sintomas, também fica disponível na seção de detalhes.

## Movimento e recursos

A preferência por movimento reduzido inicia a animação pausada; reproduzir explicitamente permite iniciá-la. A animação para fora da tela, em aba oculta, na pausa e com velocidade zero. As transições de montagem podem continuar durante a pausa dos eixos. O renderizador limita a resolução e a frequência de atualização e libera geometrias, materiais, eventos e controles ao desmontar ou perder o contexto WebGL.

## Validação

Passaram 85 testes de dados, geometria, imagens, controles e narração, além de TypeScript direcionado aos módulos envolvidos e ESLint dos arquivos alterados.

Foram validados 18 cenários distintos no navegador, entre desktop e emulação de iPhone 13: oito da nova interação, seis do catálogo e quatro da narração compartilhada. Após corrigir a associação dos rótulos aos controles deslizantes e ajustar o teste para colocar a cena na área visível, os oito cenários da nova interação passaram novamente. Incluem WebGL real, rotação dos eixos, neutro, ré, marcha direta, embreagem, pausa, explosão, seleção por malha e etiqueta, imagens, câmera, movimento reduzido, perda de contexto, ausência de WebGL ou voz, acessibilidade e largura da página.

A narração foi verificada pelas chamadas simuladas à API de síntese de voz; não houve audição em aparelhos físicos. O navegador usou uma rota temporária com o mesmo componente e layout real, removida antes do commit. A página ligada ao banco e o build completo não foram validados localmente devido à indisponibilidade do Prisma Client no ambiente.

## Publicação

O push envia a alteração ao GitHub. Como o deploy automático do Render está desativado, a publicação exige **Manual Deploy → Deploy latest commit** no serviço existente.
