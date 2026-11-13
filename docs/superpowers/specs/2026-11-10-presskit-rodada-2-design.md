# Press kit Brunin Tks — Rodada 2 (design)

**Data:** 2026-11-10 · **Status:** aguardando revisão
**Base:** site da rodada 1 na branch `feat/presskit` (spec `2026-11-09-presskit-brunin-tks-design.md`). Tudo que esta spec não muda continua valendo, inclusive as correções da revisão final: modo estático sem GSAP, fontes que não bloqueiam a página, foco do menu, `inert` e acessibilidade.
**Referências visuais aprovadas:**
- `docs/identidade/revisao-2.html`: fontes B, cor A, line-up A, contrate B, demos da transição e das Produções.
- `docs/identidade/morcegos.html`: protótipo v2 da assinatura.

## 1. Objetivo da rodada

Feedback do Wesley sobre a versão 1:
- a continuação depois do hero ficou engessada;
- não gostou das fontes;
- a galeria 3D ficou óbvia;
- a foto que segue o cursor tampa o texto das Produções;
- faltam cor e textura;
- quer os vídeos originais dos sets, um line-up sem carrossel, uma assinatura que se constrói de forma orgânica e um Contrate mais vivo.

O objetivo é um site mais surpreendente e com mais cara de cartaz de baile, com o morcego como elemento recorrente.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Fontes | **Pirata One** (títulos, nomes das festas, assinatura) + **Space Mono** (texto, rótulos, botões). Saem Fraunces, Archivo e Grenze Gotisch. |
| Cor | **Blocos alternados** como no PDF: preto, vermelho chapado e creme "xerox", com faixas de chamas tribais nas viradas. |
| Vermelho | `#E3302F` → **`#E8392F`**. Assim, texto preto sobre vermelho passa a 4,5:1. |
| Hero | O card do Boiler Baile cresce com o scroll até virar a abertura da Carreira. |
| Galeria 3D | **Removida.** |
| Produções | Foto apagada no fundo de cada faixa, que acende no hover (desktop) ou no centro da tela (celular). Sai a foto que segue o cursor. |
| Sets | Trechos dos **vídeos originais do YouTube** nos 5 sets de vídeo; reel nos 3 de áudio. O Wesley confirmou a autorização dos canais. |
| Line-up | **Cartaz de festival** em vermelho; nomes acendem um a um com o scroll. |
| Assinatura | **Morcegos**: a revoada toma a tela e forma o "Brunin"; eles **ficam**, com alguns pousados nas bordas batendo as asas. Sem traço vermelho. |
| Contrate | **Linhas com ícone que gira**; no hover, a linha se enche de preto. |
| Morcego recorrente | A mesma silhueta é o divisor do letreiro do hero e do cartaz, e aparece em revoadas nas viradas de seção. |

## 3. Identidade

### Tokens (`:root`)

| Token | Hex | Uso |
|---|---|---|
| `--preto` | `#0F1211` | Fundo das seções escuras; texto sobre vermelho e sobre creme. |
| `--creme` | `#F1E2C4` | Fundo das seções "xerox"; texto sobre preto. |
| `--vermelho` | `#E8392F` | Fundo de blocos (bio, line-up, contrate), letreiro, cortinas. |
| `--brasa` | `#E2512B` | Só luz (brilhos radiais sobre vídeo). |
| `--sangue` | `#5E1D19` | Reserva. |

Regras de contraste:
- Texto preto sobre vermelho: permitido em qualquer tamanho (4,5:1).
- Texto creme sobre vermelho: proibido abaixo de 19 px bold ou 24 px regular.
- Texto vermelho sobre preto: só em ≥ 19 px bold ou 24 px.

### Fontes

- URL: `https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Mono:wght@400;700&display=swap`, carregada sem bloquear a página (preload + onload, como hoje).
- **Pirata One** (400): títulos de seção, frase da abertura, nomes das festas, números grandes, nacionais do cartaz, "Contrate" e "Brunin".
- **Space Mono** (400 e 700, caixa-alta nos rótulos): bio, descrições, rótulos "Nº 00X", botões, relógio, menu de contatos e underground do cartaz.
- Pilhas reserva: `"Pirata One", "UnifrakturCook", "Old English Text MT", serif` e `"Space Mono", ui-monospace, "Courier New", monospace`.

### Mapa de cores por seção

| Seção | Fundo | Texto | Faixa de chamas no topo |
|---|---|---|---|
| Hero (+ abertura da Carreira) | vídeo / preto | creme | — |
| Carreira (bio) | vermelho | preto | `preto-no-vermelho` |
| Números | preto + `vermelho-no-preto` a 25% | creme | `vermelho-no-preto` |
| Produções | creme + retícula | preto | `creme-no-preto` |
| Sets | preto (vídeos) | creme | `creme-no-preto`, invertida |
| Line-up | vermelho | preto | `preto-no-vermelho` |
| Assinatura | creme + retícula | preto | `vermelho-no-creme` |
| Contrate | vermelho | preto | `vermelho-no-creme`, invertida |
| Rodapé | preto | creme 60% | — |

**Faixa de chamas:** é um `::before` no topo da seção, com 100 px de altura (60 px no celular) e a textura em `background-repeat: repeat-x`, cobrindo a emenda entre as duas cores.

**Texturas** (`assets/texturas/*.webp`, cerca de 1400×900, menos de 200 KB cada): chamas tribais geradas proceduralmente por `tools/gerar-texturas.py`. O script é o mesmo algoritmo de `docs/identidade/tex/`, com o acréscimo de `vermelho-no-creme`.

**Retícula:** padrão CSS `radial-gradient` de 7 px, com opacidade de 0,15 a 0,35, nas seções creme.

**Header sobre fundo claro:** cada seção vermelha ou creme recebe `data-tema="claro"`. Um ScrollTrigger por seção (`start: 'top 60px'`, `end: 'bottom 60px'`) liga `header--escuro`, que deixa texto e logo pretos. Isso substitui o gatilho único do Contrate.

## 4. Estrutura da página

A ordem nova das seções em `<main>` é: `#hero`, `#carreira`, `#numeros`, `#producoes`, `#sets`, `#lineup`, `#assinatura`, `#contrate`.

O menu tem 5 itens: Nº 001 Carreira, Nº 002 Produções, Nº 003 Sets, Nº 004 Line-up, Nº 005 Contrate. Números e assinatura não levam número.

### 4.1 Hero → abertura da Carreira (card que vira página)

**Estrutura**
- `#hero` tem `height: 250vh`. O palco `.hero__palco` é `position: sticky; height: 100svh`.
- Ficam no palco: o reel de fundo, o logo, os textos, o letreiro e `.hero__janela`.
- `.hero__janela` é uma camada de tela cheia com o vídeo `assets/video/janela-720.mp4`, o mesmo trecho do Boiler Baile de hoje, cortado em 720 px.
- A janela é recortada por `clip-path: inset(...)` no retângulo do card: canto direito, `top` 44%, largura `clamp(120px,11vw,168px)`, 9:16, com `round 10px`.
- Um elemento invisível `.hero__card-ref` define esse retângulo no CSS. O JS lê o `getBoundingClientRect` dele para calcular os insets, inclusive no `ScrollTrigger.refresh`.
- No celular o card **aparece** com `clamp(84px, 24vw, 110px)` de largura, acima do letreiro, no canto direito.

**Timeline com scrub** (`trigger: #hero`, `start: top top`, `end: bottom bottom`)

| Progresso | O que acontece |
|---|---|
| 0–0,12 | Nada se mexe: dá tempo de ver o hero. |
| 0,12–0,7 | A janela vai de `inset(card) round 10px` para `inset(0) round 0`, com `rotate -4° → 0`. O logo vai de `scale 1→1.35` e `opacity 1→0`. Os textos e o letreiro somem (`opacity → 0`, `y +40`). O reel de fundo escurece. |
| 0,7–1 | Dentro da janela aparecem `.hero__abertura` ("Nº 001 — Carreira" e a frase "Um DJ de funk que explora as vertentes mais agressivas e eufóricas.") em Pirata One `clamp(44px, 7vw, 120px)`, revelados palavra por palavra. Atrás, um degradê preto à esquerda garante a leitura. |

**Acessibilidade e modos alternativos**
- O texto da abertura dentro do hero é `aria-hidden`. A mesma frase existe como `<p class="carreira__abertura">` no topo de `#carreira`, visível só no modo reduzido/estático, e é a que leitores de tela leem.
- **Modo reduzido ou estático:** o hero volta a 100svh sem pin, a janela fica só no tamanho do card com o pôster, e a frase aparece em `#carreira`.

### 4.2 Carreira (bio)

- Bloco vermelho, texto preto em Space Mono 14 px.
- Foto `foto-22-tks` (duotone vermelho) mesclada com `mix-blend-mode: multiply` à direita.
- Rótulo "Nº 001 — Carreira".
- A bio do Apêndice A.2 do plano anterior segue igual.

### 4.3 Números

Fundo preto com textura `vermelho-no-preto` a 25%. Valores em Pirata One, rótulos em Space Mono. Comportamento igual ao de hoje (contadores, texto oculto para leitor de tela).

### 4.4 Produções

- Fundo creme com retícula, título em Pirata One preto e intro em Space Mono.
- Cada `.producao` ganha `<div class="producao__fundo">` com a foto em `background-size: cover`:

  | Festa | Foto |
  |---|---|
  | Savage | `foto-21-tks` |
  | Boiler Baile | `assets/img/boiler-quadro.webp`, quadro do reel em 1280 px, gerado por `tools/cortar-video.sh` |
  | Sonora Breck | `foto-57-tks` |
  | Sinistro DNB | `foto-39-tks` |

- **Estado apagado:** `opacity: .14; mix-blend-mode: multiply; filter: grayscale(1)`.
- **Estado aceso** (`:hover`, `:focus-within` ou `.producao--acesa`): `opacity: 1`, blend normal, sem filtro, `scale 1.04 → 1`, e um degradê preto à esquerda. Nome, papel e descrição passam a **creme**. Transições de 0,5 s.
- **Celular:** um ScrollTrigger por linha (`start: 'top 55%'`, `end: 'bottom 45%'`) liga `.producao--acesa`. O acordeão continua igual.
- Sai `.producoes__flutuante` e todo o código de foto que segue o cursor.

### 4.5 Sets

A estrutura (pilha de cortinas por clip-path, só o ativo toca, foco leva ao set) não muda. Trocam os vídeos:

| # | Set | Clipe |
|---|---|---|
| 1 | Senso Rádio convida Brunin | `sets/senso.mp4` (YouTube 5ackC9W3BIs) |
| 2 | Boiler Baile x Grau | `sets/grau.mp4` (YouTube 2Z2gP9W9Epo) |
| 3 | Boiler Baile Ataque Sonoro | `sets/ataque.mp4` (YouTube PuYyCp85V9U) |
| 4 | Veneno Lab | `sets/veneno-lab.mp4` (YouTube SLUUZG8-oYA) |
| 5 | Live Sensi por BSTV | `sets/sensi.mp4` (YouTube IP9V-06-QJw) |
| 6 | Rewind BR | `sets/maos.mp4` (reel, 720 px) |
| 7 | Trinka | `sets/pista.mp4` (reel, 720 px) |
| 8 | Modelo Brasileño | `sets/cabine.mp4` (reel, 720 px) |

**Pipeline** (`tools/baixar-sets.sh`):
1. `yt-dlp` baixa cada vídeo em até 720p para `bruto/sets/`, pasta fora do git.
2. Uma folha de quadros (1 quadro a cada 10 s) ajuda a escolher um trecho de 4 s com energia: pista cheia ou DJ em ação.
3. O início e a duração ficam registrados no script.
4. `ffmpeg` gera o clipe em **960×540**, `crf 30`, sem áudio, `faststart`, 24 fps, mais o pôster JPG.

**Orçamento de tamanho:** clipe do YouTube ≤ 700 KB; clipe do reel em 720 px ≤ 450 KB.

### 4.6 Line-up (cartaz)

- Bloco vermelho, rótulo "Nº 004 — Line-up" e título "Shows que já compôs o line" em Pirata One.
- O cartaz é centralizado:
  - **Nacionais:** Pirata One `clamp(36px, 6vw, 96px)`, `white-space: nowrap` por nome.
  - **Underground:** Space Mono 700 `clamp(13px, 1.4vw, 18px)`.
  - **Separadores:** morcegos (§4.9).
- Cada `.cartaz__nome` começa com `opacity: .18` e vai a `1` em sequência, com scrub (`trigger: .cartaz`, `start: 'top 75%'`, `end: 'bottom 55%'`, stagger igual entre os 20 nomes).
- **Modo reduzido:** todos acesos.
- A lista "Palcos, festas e rádios" fica embaixo, em chips de borda preta.

### 4.7 Assinatura com morcegos

**Estrutura**
- `#assinatura` tem `height: 300vh`. O palco sticky de 100svh é creme com retícula.
- Um `<canvas>` (`aria-hidden`) ocupa o palco. Um `<h2 class="visualmente-oculto">Brunin</h2>` dá o nome da seção.

**Morcegos**

| | Desktop | Celular (≤ 820 px) |
|---|---|---|
| "Tinta" (formam as letras) | 300 | 150 |
| Pousados (ficam nas bordas) | 34 | 18 |

**Texto:** "Brunin" em Pirata One, com tamanho `min(W·0.27, H·0.5)`, centralizado a 52% da altura.

**Fases** (p = progresso do scroll na seção, 0 a 1). O algoritmo é o de `docs/identidade/morcegos.html` (v2):
1. **Entrada (p de 0 a ~0,45):** cada morcego sai de fora da tela, à esquerda (`ini`), faz uma curva e se espalha até um ponto aleatório (`meio`) na tela inteira. Ele paira com um seno pequeno e bate as asas em função do tempo.
2. **Pouso (Bf = (p−0,4)/0,5):**
   - Cada morcego, com atraso `pouso` entre 0 e 0,55, voa em curva até o seu alvo.
   - Morcegos de "tinta" miram pontos dentro das letras; ao chegar, somem e deixam uma mancha preta que cresce.
   - As manchas são recortadas pela máscara do texto, e o "Brunin" vai se formando.
   - Os pousados miram pontos nas bordas de cima das letras, com espaçamento mínimo de 46 px × escala.
3. **Final (Bf ≥ 1):**
   - O texto fica inteiro (a máscara é preenchida).
   - Os pousados ficam parados no alvo, batendo as asas devagar.
   - **Ninguém sai.** Rolando de volta, tudo se desfaz na ordem inversa.

**Desempenho**
- O loop de rAF só roda com a seção visível.
- O DPR é limitado a 2.
- Em `resize`, a máscara e os alvos são recalculados (com debounce).

**Modo reduzido ou estático:** desenha uma vez o estado final (texto inteiro + pousados parados).

**Código**
- Funções puras, com teste unitário, em `js/assinatura.js`:
  - `criarMorcegos(alvosTinta, alvosPouso, dims, semente)`
  - `estadoMorcego(m, p, t, dims) → { x, y, visivel, bate, giro }`
  - `fases(p) → { Bf }`
- O DOM fica em `iniciarAssinatura(ctx)`.

### 4.8 Contrate

- Bloco vermelho, "Contrate" em Pirata One `clamp(80px, 16vw, 260px)` e o logo preto.
- A lista `.contato` mantém **os mesmos 5 links e a mesma ordem**. Cada `<a>` tem:
  - um ícone SVG inline de 40 px (Instagram, WhatsApp, envelope, Drive, documento com seta), traço `currentColor`, `aria-hidden`;
  - o valor em Pirata One `clamp(28px, 3.6vw, 48px)` (handle, número, e-mail, "Pasta no Drive", "Baixar press kit");
  - o rótulo em Space Mono 700 de 14 px à direita ("Instagram ↗" etc.).
- **Hover e foco:** o `::before` preto vai de `scaleX 0→1` a partir da esquerda (0,45 s), o texto fica creme e o ícone gira 360° com `scale 1.2`.
- **Celular:** o rótulo fica acima do valor; o ícone continua à esquerda.

### 4.9 Morcego recorrente

**`js/morcego.js`** é a fonte única da silhueta:
- `ASAS_D` e `CORPO_D`, strings de path SVG das asas e do corpo, idênticas às do protótipo v2. O viewBox é `-28 -14 56 26`.
- `criarMorcegoSvg(classe)` devolve um `<svg>` com `<path class="morcego__asas">` e `<path class="morcego__corpo">`. A batida de asa é uma animação CSS `scaleY` em `.morcego__asas` (`transform-box: fill-box; transform-origin: center`), com duração e atraso variáveis por instância.
- O canvas da assinatura usa `new Path2D(ASAS_D)` e `new Path2D(CORPO_D)`.

**Divisores**
- No HTML, os separadores do letreiro do hero e do cartaz são `<span class="div-morcego" aria-hidden="true">✦</span>`. O ✦ é o fallback sem JS.
- `iniciarDivisores()` troca o conteúdo pelo SVG do morcego (cerca de 0,8 em de altura), na cor do texto.

**Revoadas** (`js/revoadas.js`, `iniciarRevoadas(ctx)`)
- Marcadores `<div class="revoada" data-revoada aria-hidden="true">` ficam no topo de `#producoes`, `#sets` e `#assinatura`.
- Cada marcador é uma caixa absoluta de 100vh, centrada na emenda, com `overflow: hidden` e `pointer-events: none`.
- O JS cria de 6 a 10 morcegos (3 a 5 no celular) com tamanho, altura e atraso variados.
- Um ScrollTrigger com scrub (`trigger: secao`, `start: 'top bottom'`, `end: 'top top'`) leva cada morcego de `x -15vw` até `x 115vw`, com arco em y (sobe ~25vh e desce) e leve rotação.
- **Cor dos morcegos:** preto sobre fundo creme ou vermelho, creme sobre fundo preto (a cor vem do fundo da seção de destino).
- **Modo reduzido ou estático:** nenhuma revoada é criada.

## 5. Remoções

- Seção `#galeria`, `js/galeria.js`, `js/dados.js` e o CSS da galeria.
- Os testes `tests/unit/galeria.test.mjs` e `tests/e2e/galeria.test.mjs`.
- `assets/recortes/` (só a galeria usava) e a parte de recortes de `tools/tratar-fotos.py`.
- `tex-chamas` dá lugar a `assets/texturas/`.
- `.producoes__flutuante` e o código de foto que segue o cursor.
- O letreiro duplo do line-up (`letreiro--nacional`/`--under`) e as regras dele no modo reduzido.
- `iniciarAssinatura` antiga (traço SVG) e os SVGs `assinatura__svg--*`.
- As fontes Fraunces, Archivo e Grenze Gotisch (URL, CSS e `docs` continuam como histórico).
- `tools/tratar-fotos.py` volta a gerar as fotos `-tks` com o vermelho novo `#E8392F`.

## 6. Arquivos

```
js/morcego.js        silhueta única + criarMorcegoSvg
js/revoadas.js       iniciarRevoadas
js/assinatura.js     funções puras da assinatura + iniciarAssinatura (canvas)
js/animacoes.js      hero (janela), letreiros, reveals, contadores, produções (acender), line-up (cartaz), divisores, estrelas
js/interface.js      preloader, header (tema claro por seção), menu
js/sets.js           sem mudança de lógica
js/main.js           orquestra; remove a galeria; inclui revoadas, divisores e assinatura nova
css/base.css         tokens, fontes, faixas de chamas, retícula, header--escuro
css/secoes.css       seções no esquema novo
assets/texturas/     4 texturas de chamas
assets/video/janela-720.mp4 (+ .jpg)
assets/video/sets/   8 clipes + pôsteres
assets/img/boiler-quadro.webp
tools/gerar-texturas.py, tools/baixar-sets.sh (yt-dlp + ffmpeg), tools/cortar-video.sh (+ janela-720, boiler-quadro)
```

## 7. Testes e verificação

Os testes existentes são atualizados para a ordem nova das seções, o menu com 5 itens e a galeria removida.

**Testes novos**

Unitários:
- `estadoMorcego`: em p=0 todos estão fora da tela à esquerda; em p=1 os de "tinta" estão invisíveis e os pousados estão no alvo e visíveis.
- `fases`: limites corretos.
- `criarMorcegos`: determinístico pela semente.

E2E — hero e Produções:
- Hero: no fim do pin, a janela cobre a tela (`clip-path` com inset 0) e a abertura tem opacidade 1.
- Hero: no topo, a janela tem o tamanho do card. Isso vale no desktop e no celular, onde o card aparece.
- Produções: o hover numa linha leva `.producao__fundo` a opacidade > 0,9; sem hover, < 0,3.
- Produções no celular: a linha no centro da tela recebe `.producao--acesa`.

E2E — sets e line-up:
- Sets: os 8 vídeos apontam para `assets/video/sets/*.mp4`; os 5 primeiros são os clipes do YouTube.
- Line-up: no fim do cartaz, todos os 20 nomes estão com opacidade > 0,9; no início, o primeiro está < 0,5.
- Line-up no modo reduzido: todos acesos.

E2E — assinatura:
- No fim de `#assinatura`, o canvas tem pixels escuros na região central do texto (amostragem com `getImageData`).
- No modo reduzido, o estado final aparece sem scroll.

E2E — Contrate, divisores e revoadas:
- Contrate: 5 links com o `href` atual, cada um com um ícone `svg`.
- Divisores: o letreiro do hero e o cartaz têm SVGs de morcego no lugar do ✦.
- Revoadas: no meio da emenda de `#sets`, há morcegos visíveis no viewport. No modo reduzido não existe nenhum `.revoada svg`.

E2E — geral:
- Header: sobre `#producoes` (creme), recebe `header--escuro`.
- Orçamento dos assets: `assets.test.mjs` passa a cobrir `assets/texturas/*.webp` (≤ 200 KB), `janela-720.mp4` (≤ 800 KB), `sets/*.mp4` (YouTube ≤ 700 KB, reel ≤ 450 KB) e `boiler-quadro.webp`.

**Verificação visual:** prints em 1440×900 e 390×844 de cada seção, mais três pontos da transição do hero e três da assinatura, comparados com `revisao-2.html` e `morcegos.html`.

## 8. Fora do escopo

Versão em inglês, CMS, deploy (o README já descreve), o passo de `og:image` absoluto (pendente de domínio) e os menores adiados da revisão final que esta spec não toca.

## 9. Pendências (não bloqueiam)

- URLs dos três sets mais tocados e do perfil do SoundCloud.
- Domínio, para `og:image`/`og:url` absolutos.
- Teste num celular real (desempenho dos ~170 morcegos no canvas e dos vídeos).
