# Press kit Brunin Tks — Rodada 3 (design)

**Data:** 2026-11-13 · **Status:** aprovado na conversa (o Wesley dispensou nova aprovação de spec e plano)
**Base:** site da rodada 2 na branch `feat/presskit`. Tudo que esta spec não muda continua valendo: modo estático sem GSAP, modo de movimento reduzido, sem JS, foco do menu, `inert`, âncora no resize (`js/ancora.js`) e acessibilidade.
**Referência visual aprovada:** `docs/identidade/morcegos-3.html` (silhueta, batida, nuvem das viradas e entrada da assinatura sem véu preto).

## 1. Objetivo da rodada

Pedidos do Wesley sobre a rodada 2:
1. **Hero:** o card cresce e mostra o mesmo reel do fundo. Ele quer outro vídeo na janela e o card tocando antes do scroll (hoje fica congelado).
2. **Morcegos:** gostou da ideia e eles ficam, mas quer:
   - o desenho do `morcego_ref`;
   - uma batida de asa fluida e natural;
   - mais morcegos e trajetórias livres nas viradas;
   - na entrada da Assinatura, morcegos chegando de todos os lados, tomando a tela e formando o nome.
3. **Produções:** fotos descentralizadas (a da Sonora mostra só a testa). Entram fotos novas.
4. **Sinistro DNB:** a festa acabou e sai das produções atuais.
5. **Sets:**
   - o trecho do Live Sensi está ruim;
   - nos sets do SoundCloud, ouvir dentro do site sem hospedar o áudio;
   - reels do Instagram de fundo nos sets de áudio.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Janela do hero | Reel `DW9lHDGkSo6` (Instagram), trecho de ~9 s em loop. O card toca desde a abertura da página. O fundo do hero continua o reel atual. |
| Etiqueta do card | Sai a etiqueta "Boiler Baile". O vídeo novo não é do Boiler, e a etiqueta nunca aparecia no modo animado. |
| Silhueta | Contorno do `morcego_ref` (107 pontos), com asas articuladas em 32 quadros por batida. A mesma forma vale em todos os lugares. |
| Viradas (Produções, Sets) | Uma nuvem cheia: **90** morcegos no desktop e **40** no celular, vermelhos, com voo livre (soma de senos por morcego). O avanço segue o scroll. |
| Entrada da Assinatura | Os morcegos chegam dos quatro lados sobre o Line-up e tomam a tela **sem véu preto**: o fundo aparece nas frestas. Depois formam o "Brunin". Desktop: 460 de tinta e 34 pousados. Celular: 230 de tinta e 18 pousados. |
| Produções | 3 cards (Savage, Boiler Baile, Sonora Breck), com as fotos novas e foco por card (`--foco`). |
| Sinistro DNB | Sai do card, do letreiro do hero, do texto de abertura das Produções e da descrição do site. **Fica** na biografia da Carreira e no "4 festas criadas". |
| Sets | Ordem nova: os 5 do YouTube; Modelo Brasileño (reel, sem player); Rewind BR e Trinka (reel + player do SoundCloud). O trecho do Sensi é refeito. |
| SoundCloud | Botão "▶ Ouvir aqui" no card. No clique, carrega o player oficial compacto (`w.soundcloud.com/player`, cor `#E8392F`) e toca. Antes do clique nada é carregado do SoundCloud. Só um toca por vez (Widget API). |
| Reels | Os 4 reels sem repetir: `DW9lHDGkSo6` na janela do hero; `DRuX77XEWlI`, `DG_97MaOjeD` e `DO1bP5kEUF_` nos sets 6, 7 e 8. A distribuição entre os três é decidida pelas folhas de quadros. |
| Pendências da rodada 2 | Entram os 8 itens menores adiados (§9). |

## 3. Morcegos

### 3.1 Silhueta e batida (`js/morcego.js`)

**Contorno**
- 107 pontos tirados de `docs/identidade/morcego_ref.jpg` por `tools/tracar-morcego.py` (limiar, contorno de Moore, Ramer–Douglas–Peucker com ε 0,9 numa grade de 480 px).
- Normalização: origem no corpo `(290, 300)` e escala `56/475`.

**Rig das asas**
- Cada ponto pertence à asa esquerda ou à direita conforme o lado do meio entre os ombros.
- Ombros: esquerdo `(250, 300)`, direito `(330, 290)`. Pontas: esquerda `(1, 300)`, direita `(476, 71)`.
- Pesos: `braço = degrau(−0,02; 0,16; t)` e `mão = degrau(0,4; 0,92; t)`, onde `t` é a projeção do ponto no eixo ombro→ponta.

**Pose na fase `f`**
- `g = f − 0,35·sen f`: a descida é mais rápida que a subida.
- `s = sen g`; `atraso = sen(g − 0,95)`.
- Ângulo de erguer:
  - esquerda: `(6 + 36s)°`
  - direita: `(−30 + 38s)°`
  - mão: `18°·atraso`
- Rotação em torno do ombro: `ângulo = (esquerda ? 1 : −1) · (erguer·braço + mão·peso da mão)`.
- Dobra na subida: o raio encolhe `1 − 0,1·max(0, cos g)·peso da mão`.
- O corpo sobe `−1,8·cos g`.

**Saída do módulo**
- 32 quadros pré-calculados, como strings de path SVG e como `Path2D`.
- `quadro(fase)` devolve o índice do quadro.
- `desenharMorcego(g, x, y, tam, fase, giro, espelho)` desenha no canvas.
- `criarMorcegoSvg(classe)` usa um `viewBox` que contém todos os quadros.

### 3.2 Divisores (letreiro do hero e cartaz)

- O `<path>` do SVG troca de quadro a ~30 quadros/s.
- Um único rAF anima só os divisores visíveis (IntersectionObserver).
- Cada divisor tem fase e velocidade próprias.
- No movimento reduzido fica parado num quadro fixo, próximo da pose da referência.
- Sai a animação CSS `bater`.

### 3.3 Céu (`js/ceu.js`): o canvas das revoadas

- Um `<canvas class="ceu" aria-hidden="true">` fixo, do tamanho da tela, com `pointer-events: none` e `z-index` abaixo do header e do menu.
- Ele desenha as duas nuvens das viradas e todos os morcegos da Assinatura (voando e pousados).
- Só tem rAF quando alguma cena está na tela; fora disso fica limpo e parado. DPR limitado a 2.
- Função pura `posicaoNuvem(m, u, t, W, H) → {x, y, giro}`:
  - `u` é o progresso da virada: de 0 com o topo da seção no fundo da tela até 1 com o topo no topo.
  - `x` vai de −15% a 115% de `W` (com deslocamento `du` por morcego).
  - `y` combina a linha base do bando, o espalhamento `dy`, uma onda própria `a1·sen(u·π·f1 + p1)` e um balanço no tempo `a2·sen(t·f2 + p2)`.
  - O giro acompanha a direção do voo (×0,45).
- Em `u` 0 e 1, o bando inteiro fica fora da tela.

### 3.4 Assinatura

**Progresso**
- `P` vai de 0 a 1, do topo de `#assinatura` no fundo da tela até o fim da seção.
- A seção passa a ter **350vh** no modo animado (palco sticky de 100svh). A chegada ocupa a 1ª tela (P 0 → ~0,29).

**Fases** (as do protótipo, em `P`)
1. **Chegada (0 → 0,3):** cada morcego sai de um ponto fora de um dos 4 lados (`ini`) e voa em curva até um ponto aleatório da tela (`meio`), pairando com seno. Ele cresce até 1,6× (`perto = 1 + 0,6·(degrau(0,05; 0,3; P) − degrau(0,32; 0,6; P))`). **Sem véu preto:** a página rola por baixo e o Line-up dá lugar ao palco creme no meio da nuvem.
2. **Pouso (`Bf = lim((P − 0,42)/0,46)`):** os morcegos de tinta voam até pontos dentro das letras, somem e deixam manchas recortadas pela máscara do texto. Os pousados vão para as bordas de cima, a pelo menos 46 px × escala uns dos outros.
3. **Final (`Bf ≥ 1`):** o texto inteiro fica formado e os pousados batem as asas devagar. Ninguém sai.

**Onde desenha**
- A tinta (máscara) fica no `canvas.assinatura__tela` do palco.
- Os morcegos ficam no céu.
- Os alvos são guardados em coordenadas do palco e desenhados em `alvo + topo do palco` (`getBoundingClientRect`). Assim, quando o palco descola no fim, letras, manchas e pousados sobem juntos.

**Funções puras** (`js/assinatura.js`, com teste)
- `amostrarAlvos` (como na rodada 2).
- `criarMorcegos` muda: `ini` nos 4 lados e os campos `curva` e `perto`.
- `fases(P) → {Bf, perto}`.
- `estadoMorcego(m, P, t, dims) → {x, y, visivel, bate, giro, tam}`.

**Modo reduzido ou estático**
- O palco desenha uma vez a tinta completa e os pousados parados, no próprio canvas.
- Não há céu nem chegada.

## 4. Hero

- **Vídeo:** `tools/baixar-reels.sh` baixa os 4 reels em `bruto/reels/`, gera as folhas de quadros e corta.
- **Janela:** `assets/video/janela-720.mp4` passa a ser um trecho de ~9 s do reel `DW9lHDGkSo6`, em 720 px (≤ 1,8 MB), com pôster `janela-720.jpg`.
- **No celular:** usa `janela-540.mp4` (≤ 1,2 MB), escolhida por `escolherJanela(largura)`.
- **O card toca desde o início:** `src` definido na montagem e `play()`, com o erro de autoplay engolido. Não depende mais do observador de vídeos. No movimento reduzido fica só o pôster.
- **Sai:** `.hero__etiqueta`, a sua regra CSS e o tween dela na timeline.

## 5. Produções

| Card | Imagem | Foco (`background-position`) |
|---|---|---|
| Savage | `assets/img/producao-savage.webp` (de `Savage.jpg`) | definido no ajuste visual; começa em `50% 30%` |
| Boiler Baile | `assets/img/producao-boiler.webp` (de `boiler.jpg`) | começa em `50% 54%` |
| Sonora Breck | `assets/img/producao-sonora.webp` (de `Sonora.jpg`) | começa em `50% 42%` |

- **Imagens:** WebP q78, até 1400 px no lado maior, ≤ 300 KB cada. Geradas por `tools/tratar-fotos.py`.
- **Foco:** valor final conferido nos prints de 1440 e 390 px: rosto e olhos visíveis na faixa, sem o texto "Brunin TKs" da arte da Savage em destaque.
- **Arquivos:** os JPGs brutos da raiz ficam fora do git (`.gitignore`). O `morcego_ref.jpg` vai para `docs/identidade/`, porque o protótipo e o script de traçado usam ele.

## 6. Sinistro DNB

Sai de:
- o card das Produções;
- os dois `<span>` do letreiro do hero;
- o texto de abertura das Produções ("…Savage, Boiler Baile e Sonora Breck.");
- a `meta description`.

Fica em:
- a biografia da Carreira;
- o número "4 festas criadas".

## 7. Sets

**Ordem e conteúdo**

| # | Set | Fundo | Ação |
|---|---|---|---|
| 1 | Senso Rádio convida Brunin | `sets/senso.mp4` | link YouTube |
| 2 | Boiler Baile x Grau | `sets/grau.mp4` | link YouTube |
| 3 | Boiler Baile Ataque Sonoro | `sets/ataque.mp4` | link YouTube |
| 4 | Veneno Lab | `sets/veneno-lab.mp4` | link YouTube |
| 5 | Live Sensi por BSTV | `sets/sensi.mp4` (**trecho novo**) | link YouTube |
| 6 | Modelo Brasileño | `sets/reel-a.mp4` | link Rádio Relativa |
| 7 | Rewind BR | `sets/reel-b.mp4` | "▶ Ouvir aqui" + link SoundCloud |
| 8 | Trinka | `sets/reel-c.mp4` | "▶ Ouvir aqui" + link SoundCloud |

- **Sensi:** novo trecho de 4 s, escolhido na folha de quadros com pista e público animados (o atual é parado). O recorte de 76% continua.
- **Reels dos sets:** trechos de 4 s em 720 px (≤ 450 KB) com pôster. Saem os clipes `sets/maos`, `sets/pista` e `sets/cabine` do reel antigo.

**Player do SoundCloud** (`js/soundcloud.js`)
- Cada set 7 e 8 tem `<button class="set__ouvir" hidden data-faixa="URL do SoundCloud">▶ Ouvir aqui</button>`. O JS revela o botão; sem JS ele não aparece.
- No clique, o botão vira um `<iframe class="set__player" title="Player do SoundCloud: <set>">` com `https://w.soundcloud.com/player/?url=<faixa>&color=%23e8392f&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false`, com 166 px de altura e `allow="autoplay"`.
- O primeiro clique carrega `https://w.soundcloud.com/player/api.js` uma vez. Ao dar play num widget, os outros recebem `pause()`.
- Se o script ou o iframe falhar, o link "Ouvir no SoundCloud" continua lá. Nenhum erro aparece no console da página.
- **O áudio continua tocando** quando a pilha muda de set ou o visitante rola a página. Foi ele quem escolheu ouvir.
- O foco do teclado no botão leva ao set, como o foco nos links já faz.

## 8. Modos e acessibilidade

- **Sem JS:** sem céu, sem player e com o card parado no pôster. Os links continuam.
- **Movimento reduzido ou estático:**
  - sem céu e sem nuvens;
  - a assinatura já formada, com os pousados parados;
  - os divisores parados;
  - o card do hero no pôster;
  - sem zoom nas Produções.
- **Leitor de tela:** céu e morcegos com `aria-hidden`. O botão "Ouvir aqui" tem nome acessível com o nome do set, e o iframe tem `title`.

## 9. Pendências da rodada 2 que entram

1. **Etiqueta do Boiler:** sai (§4).
2. **IntersectionObserver da assinatura e do céu:** usam a última entrada do lote.
3. **Canvas sem trabalho desnecessário:**
   - a tinta só é recomposta quando `Bf` muda;
   - com `Bf` em 0 ou 1, nada é refeito;
   - `willReadFrequently` só na amostra.
4. **Fonte lenta:** se a Pirata One não chegar em 3 s, desenha com a reserva e refaz no `loadingdone`.
5. **Produções em telas de toque acima de 820 px:** o acender pelo centro da tela vale para `(hover: none), (max-width: 820px)`.
6. **Zoom das Produções no movimento reduzido:** sai o `scale(1.04)` e a sua transição.
7. **Nome do teste do clipe que falha:** passa a dizer o que prova ("requisição abortada").
8. **`docs/identidade/revisao-2.html`:** aponta para mídias que existem.

## 10. Testes

**Unitários**
- **Rig:** 32 quadros fechados.
- **Viewbox:** todos os quadros cabem no `viewBox`.
- **Fluidez:** o deslocamento máximo de um ponto entre quadros vizinhos é pequeno.
- **Amplitude:** a ponta da asa esquerda sobe e desce mais de 20 unidades ao longo da batida.
- **Corpo:** os pontos do corpo só sobem e descem, sem girar.
- **Nuvem:** todos fora da tela em `u` 0 e 1; a maioria dentro em `u` 0,5.
- **Assinatura:** `ini` fora da tela pelos 4 lados; em `P = 1` os pousados estão no alvo e a tinta é invisível; `fases` nos limites.

**E2E**
- **Janela:** o vídeo do card toca antes do scroll (`currentTime` avança) e usa o reel novo.
- **Etiqueta:** não existe.
- **Produções:** são 3 cards com as fotos novas.
- **Sinistro DNB:**
  - fora do letreiro, das Produções e da `meta description`;
  - presente na biografia;
  - o número continua 4.
- **Sets:**
  - ordem e links novos;
  - os `data-src` novos;
  - "Ouvir aqui" escondido sem JS e visível com JS;
  - clicar cria o iframe com a URL e o `title` certos (com o SoundCloud bloqueado, a página não gera erro);
  - só um player por set.
- **Céu:**
  - na virada para os Sets há ≥ 60 morcegos desenhados no desktop (contagem exposta em `data-desenhados`);
  - no celular, ≤ 45;
  - sem rolagem lateral;
  - no movimento reduzido o céu não existe.
- **Assinatura:**
  - em `P` 0,25 o fundo aparece nas frestas (fração de pixels escuros < 75%);
  - no fim, o "Brunin" está formado;
  - girar a tela mantém o lugar (teste da rodada 2);
  - no modo reduzido, estado final sem scroll.
- **Divisores:** o `d` do path muda com o tempo no modo animado e não muda no reduzido.
- **Pendências:** um teste para cada item do §9 que é comportamento (2, 4, 5, 6).

## 11. Arquivos

```
js/morcego.js        silhueta + rig + quadros (SVG e Path2D) + animação dos divisores
js/ceu.js            NOVO  canvas fixo das nuvens e dos morcegos da assinatura
js/assinatura.js     funções puras novas + tinta no palco
js/soundcloud.js     NOVO  botão → iframe + Widget API
js/revoadas.js       SAI   (substituído pelo céu)
tools/tracar-morcego.py   NOVO
tools/baixar-reels.sh     NOVO  reels do Instagram → janela e sets 6–8
tools/baixar-sets.sh      novo trecho do Sensi
tools/tratar-fotos.py     fotos das Produções
```
