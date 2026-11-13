# Press kit Brunin Tks — Rodada 4 (design)

**Data:** 2026-11-13 · **Status:** aprovado na conversa. O Wesley escolheu as opções no protótipo e dispensou a aprovação de spec e plano.
**Base:** o site da rodada 3 na branch `feat/presskit`. Tudo que esta spec não muda continua valendo: modo estático (sem GSAP), movimento reduzido, sem JS, âncora no resize e acessibilidade.
**Referência visual aprovada:** `docs/identidade/rodada-4.html`, com hero na opção A, faixa na opção A e contorno fino. O protótipo lê o reel bruto em `bruto/reels/`, que não vai para o git, então só funciona na máquina que baixou os reels.

## 1. Objetivo da rodada

Pedidos do Wesley sobre a rodada 3:
1. **Card do hero.** O card já toca, mas mostra um pedaço ampliado do vídeo de tela cheia (uns 12% da imagem) e não se entende o que acontece. Ele quer o vídeo **inteiro** dentro do card, pequeno, crescendo junto com o card na rolagem. O trecho passa a ser o dos **primeiros 10 s** do reel.
2. **Viradas.** No pico, a linha de lado a lado fica toda preenchida de morcegos, correndo quase numa linha contínua. No fim eles saem da tela como hoje. Os morcegos ganham um **contorno preto fino**.
3. **Créditos.** No rodapé, sai "Fotos @clicksbylt" e entra o crédito do site.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Card do hero | Opção A: o vídeo fica inteiro do card até o fim. No fim, tem a altura da tela, encostado à direita, e o resto da janela fica preto. No celular, onde ele é mais largo que a tela, fica centralizado e corta só as laterais. |
| Trecho da janela | Reel `DW9lHDGkSo6`, de 0 a 10 s (hoje: 20,5–29,5 s). O pôster sai do mesmo trecho. |
| Viradas | Opção A: uma faixa cheia e ondulada, com **170** morcegos no desktop e **90** no celular. No pico ela cobre a largura toda e desacelera um pouco no meio. |
| Contorno | Linha preta (`--preto`) de **1 px de tela** em volta de cada morcego dos canvases (viradas e Assinatura, voando e pousados, inclusive o estado final parado). Os morcegos pequenos em SVG que separam textos ficam sem contorno. |
| Rodapé | `© 2026 Brunin Tks · Site por M. Wesley`, sem link. O alt da foto da Carreira mantém "Foto @clicksbylt". |

## 3. Card do hero

### 3.1 Geometria

O palco (`.hero__palco`, preso no scroll) mede `W × H`. O card (`.hero__card-ref`) é um retângulo 9:16 `C = {l, t, w, h}`, relativo ao palco. O vídeo da janela também é 9:16.

O retângulo final do vídeo é `F = fimDaJanela(W, H)`:
- `h = H` e `w = H · 9/16`;
- se `w ≤ W`: `l = W − w` (encostado à direita);
- senão: `l = (W − w) / 2` (centralizado);
- `t = 0`.

Exemplos:
- 1440 × 900 → `{ l: 933.75, t: 0, w: 506.25, h: 900 }`;
- 390 × 844 → `{ l: −42.375, t: 0, w: 474.75, h: 844 }`.

### 3.2 Animação (modo animado)

- **O que não muda.** A janela continua com o recorte (clip-path) do card até a tela inteira e com a rotação de −4° a 0°. É o mesmo trecho da linha do tempo (início 0,12, duração 0,58, `power2.inOut`).
- **Tamanho do vídeo.** O vídeo da janela tem sempre o tamanho de `F`: em CSS, `height: 100%`, `aspect-ratio: 9 / 16` e `width: auto`.
  - Ele é posicionado em `left: 0; top: 0`, com `transform-origin: 0 0`.
  - Só o `transform` anima (GPU): de `translate(C.l, C.t) scale(C.w / F.w)` até `translate(F.l, F.t) scale(1)`.
  - O tween fica no mesmo ponto da linha do tempo e com o mesmo ease do recorte.
- **Início.** No começo o vídeo cobre o card exatamente: o vídeo inteiro aparece dentro do card.
- **Fundo.** O fundo da janela no modo animado é `#000`, para emendar com o preto do trecho.
- **Bordas esfumadas.** As bordas laterais do vídeo são esfumadas por uma máscara: `mask-image: linear-gradient(90deg, transparent, #000 var(--borda), #000 calc(100% − var(--borda)), transparent)`, com `-webkit-` também.
  - `--borda` anima de `0%` (card nítido) até `14%` (no fim), junto do transform.
- **Recálculo.** Os valores de `C` e `F` são funções, recalculadas no refresh (`invalidateOnRefresh`, como o recorte já faz).
- **Frase da abertura.** Continua à esquerda, sobre o preto.
- **Movimento reduzido e modo estático:** nada muda. O card pequeno com pôster já mostra o vídeo inteiro, porque card e vídeo são 9:16.

### 3.3 Trecho

Em `tools/baixar-reels.sh` (tabela `TRECHOS`):
- `janela-720 DW9lHDGkSo6 0 10 720 30`;
- `janela-540 DW9lHDGkSo6 0 10 540 31`.

O pôster `janela-720.jpg` sai do quadro em 0,6 s, como os outros. Os orçamentos de tamanho continuam: 720 ≤ 1,8 MB e 540 ≤ 1,2 MB.

## 4. Faixa das viradas

O código fica em `js/ceu.js`; `criarNuvem` e `posicaoNuvem` são substituídas.

### 4.1 Criar a faixa

`criarFaixa(n, semente)` é determinística. Para o i-ésimo morcego:

| Campo | Valor | Significado |
|---|---|---|
| `q` | `(i + r) / n` | lugar ao longo da faixa, distribuído por igual |
| `dy` | `r + r − 1` | de −1 a 1, mais denso no meio |
| `j` | `(r − 0,5) · 0,12` | ritmo próprio |
| `a2` | `0,006 + r · 0,014` | |
| `f2` | `0,8 + r · 1,4` | |
| `p2` | `r · 6,3` | |
| `tam` | `0,7 + r · 0,9` | |
| `bate` | `9 + r · 6` | |
| `fase` | `r · 6,3` | |

### 4.2 Posição

`posicaoFaixa(m, u, t, W, H, fase = 0.6) → { x, y, giro }`, com `L = 1,6 · W`, `M = 140` e `B = min(W, H)`:

```
e      = u + 0,4 · sin(2πu) / (2π)                  // mais devagar no meio: o pico dura mais
x      = −M − q·L + e·(W + L + 2M) + j·W·(e − 0,5)
centro(x) = 0,48·H + 0,07·B · sin(x/W · 1,6π + fase)
y      = centro(x) + dy · 0,11·B + a2·B · sin(t·f2 + p2)
giro   = atan2(centro(x+10) − centro(x), 10) · 0,45
```

Propriedades que os testes fixam:
- Em `u = 0` e `u = 1`, todos os morcegos estão a mais de 60 px fora da tela, no desktop e no celular.
- Por volta de `u = 0,5`, a faixa cobre a largura inteira, sem buracos.

### 4.3 Uso no céu

- Produções usa a fase 0,6 e Sets usa a fase 2,7, para as duas ondas não ficarem iguais.
- O resto continua como hoje: avanço `u` pelo topo da seção, recorte fora da tela em ±120 px e contagem em `data-desenhados`.

## 5. Contorno

- `desenharMorcego(g, x, y, tam, fase, giro = 0, espelho = 1, contorno = 0)`:
  - com `contorno > 0`, depois do `fill` faz `stroke` do mesmo `Path2D`, com `lineWidth = contorno / tam`, o que dá a espessura em px de tela;
  - a cor é o `strokeStyle` atual, definido por quem chama.
- O céu (viradas) e a Assinatura (voo, pousados e `desenharFinal`) definem:
  - `strokeStyle` = `--preto`;
  - `lineJoin = 'round'`;
  - `contorno = 1`.
- **Desempenho.** Medir o tempo de desenho da cena da Assinatura na chegada (P ≈ 0,25, 1440 × 900), com e sem contorno, no Chrome headless com a CPU 4× mais lenta.
  - Se o contorno somar mais de 50% ao tempo, a solução é pré-desenhar os quadros contornados em bitmaps e reaproveitá-los.
  - Fica registrado como decisão no ledger.

## 6. Rodapé

`<p class="rotulo">© 2026 Brunin Tks · Site por M. Wesley</p>`. O alt da foto da Carreira não muda.

## 7. Documentação

- **README:** descrever a faixa das viradas, o contorno e o card com o vídeo inteiro.
- **`tools/baixar-reels.sh`:** comentar o trecho novo da janela.
- **`js/ancora.js`:** o comentário "300vh" (minor adiado da rodada 3) passa a 350vh.

## 8. Testes

**Unitários:**
- `fimDaJanela`: desktop, celular e o limite `w = W`.
- Faixa:
  - todos fora da tela em 0 e 1 (1440 × 900 e 390 × 844);
  - cobertura sem buracos no pico (u 0,45 / 0,5 / 0,55; maior vão entre centros vizinhos, incluindo as bordas, < 60 px no desktop e < 40 px no celular);
  - faixa no meio da altura;
  - determinismo.
- `desenharMorcego` com e sem contorno (contexto falso): faz `stroke` só com contorno, e com `lineWidth = contorno / tam`.
- Rodapé e alt da foto em `index.html`.

**E2E:**
- **Topo:** o vídeo cobre o card (escala · F.w ≈ largura do card ±1 px; centros a menos de 2 px).
- **Fim do pin, desktop:** vídeo com altura 900 ±1, borda direita em 1440 ±1, largura ≈ 506 e `--borda` = 14%.
- **Fim do pin, celular:** altura 844 ±1, centro em x 195 ±1.
- **Trecho:** a janela dura 10 s ±0,3.
- **Faixa:** no pico ela desenha ≥ 100 morcegos no desktop e ≤ 95 no celular.
- **Contorno:** há pixels quase pretos e opacos no céu na virada e no palco da Assinatura no movimento reduzido.
- **Varredura de prints** (`responsivo`): atualizada.

## 9. Fora do escopo e riscos

- Os outros minors adiados da rodada 3 continuam adiados:
  - testes frouxos;
  - o "pop" na entrada por baixo com lvh;
  - reels de 720 ampliados no desktop;
  - autoplay do SoundCloud no iOS.
- **Risco:** a máscara animada no vídeo repinta a cada quadro durante a expansão. É um elemento só, aceitável. Fica para conferência em aparelho real, junto com o contorno.
