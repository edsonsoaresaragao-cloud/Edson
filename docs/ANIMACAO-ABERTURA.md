# Motor em funcionamento na abertura

A abertura mostra um motor genérico de quatro cilindros em corte, com pistões, bielas, virabrequim, válvulas, roda de comando e volante em movimento. O SVG tem acabamento metálico com gradientes e uma representação didática do ciclo de quatro tempos. A animação não abre ou separa conjuntos.

O movimento usa um mecanismo biela-manivela: o pino do virabrequim gira, a posição do pistão é calculada pela restrição de comprimento constante da biela e os cilindros 1/4 e 2/3 se movimentam em pares. As fases seguem a ordem de ignição 1–3–4–2 neste exemplo. As válvulas acompanham admissão e escape, o volante gira na velocidade do eixo e a roda de comando na metade. O desenho simplifica geometria, distribuição e transmissão; não é procedimento de manutenção nem simulação de um modelo comercial específico.

Uma volta dura aproximadamente quatro segundos (velocidade didática, não marcha lenta real). Cor e rótulo distinguem admissão, compressão, combustão/expansão e escape. O texto da interface indica câmera lenta.

O componente atualiza diretamente os elementos SVG via requestAnimationFrame e interrompe o movimento quando pausado ou quando o usuário solicita movimento reduzido, incluindo alterações dessa preferência durante a visita. O tempo é preservado ao pausar; não há grandes saltos ao retornar de uma aba oculta. Não usa WebGL nem novos pacotes.

Verificação: tipagem do componente, invariantes do comprimento das bielas em vários ângulos, sincronismo dos pares, pontos mortos e ordem de ignição. Não houve teste visual em navegador neste ambiente.

Publicação: implantar a versão mais recente no Render. Não requer novas variáveis de ambiente nem migrações.
