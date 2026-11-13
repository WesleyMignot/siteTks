# Press kit Brunin Tks — Rodada 2: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a rodada 2 sobre o site da branch `feat/presskit`:
- identidade nova: Pirata One + Space Mono, blocos alternados de cor, chamas tribais;
- o card do hero que vira a abertura da Carreira;
- sai a galeria;
- Produções que acendem;
- sets com trechos do YouTube;
- line-up em cartaz;
- assinatura feita por morcegos;
- Contrate com ícones;
- morcegos como divisores e em revoadas.

**Architecture:** É o mesmo esqueleto da rodada 1 (HTML estático, `ctx` passado a iniciadores por seção, GSAP/ScrollTrigger/Lenis via CDN). Entram três módulos novos:
- `js/morcego.js`: silhueta única;
- `js/assinatura.js`: lógica pura da revoada + canvas;
- `js/revoadas.js`: revoadas nas viradas.

A geometria pura (alvos, estado de cada morcego) tem teste unitário. O comportamento no navegador é testado com puppeteer-core.

**Tech Stack:** HTML/CSS/ES modules; GSAP 3.12.5 + ScrollTrigger; Lenis 1.1.13; Google Fonts (Pirata One, Space Mono); Node 22 `node --test` + puppeteer-core; Python (Pillow, PyMuPDF, yt-dlp) e ffmpeg para assets.

**Spec:** `docs/superpowers/specs/2026-11-10-presskit-rodada-2-design.md`. Ela se apoia na spec da rodada 1, `docs/superpowers/specs/2026-11-09-presskit-brunin-tks-design.md`.

**Referências visuais:**
- `docs/identidade/revisao-2.html` (fontes B, cor A, cartaz, Produções, Contrate B);
- `docs/identidade/morcegos.html` (v2: o algoritmo da assinatura é portado daqui).

## Global Constraints

**Tokens**
- `--preto:#0F1211; --creme:#F1E2C4; --vermelho:#E8392F; --brasa:#E2512B; --sangue:#5E1D19`. O vermelho antigo `#E3302F` não aparece mais em CSS, JS nem tools.

**Fontes**
- URL: `https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Mono:wght@400;700&display=swap`, carregada com preload + onload + `<noscript>`, como hoje.
- Títulos: `.titulo`/`.gotica` → `"Pirata One", "UnifrakturCook", "Old English Text MT", serif`, peso 400, sem itálico.
- Texto: `"Space Mono", ui-monospace, "Courier New", monospace`.

**Contraste**
- Texto preto sobre vermelho: livre.
- Texto creme sobre vermelho e vermelho sobre preto: só ≥ 19 px bold ou ≥ 24 px.

**Seções**
- Ordem em `<main>`: `hero, carreira, numeros, producoes, sets, lineup, assinatura, contrate`.
- Menu (5 itens): Nº 001 Carreira, Nº 002 Produções, Nº 003 Sets, Nº 004 Line-up, Nº 005 Contrate.
- Seções vermelhas ou creme levam `data-tema="claro"`: `carreira`, `producoes`, `lineup`, `assinatura`, `contrate`.

**Contatos e links**
- Os `href` do Contrate e dos sets são exatamente os da rodada 1. Os testes atuais continuam valendo.

**Morcegos**
- `js/morcego.js` é a **única** fonte da silhueta. Copiar os paths para outro arquivo é proibido.
- Quantidades:

  | | Desktop | Celular (≤ 820 px) |
  |---|---|---|
  | Assinatura, "tinta" | 300 | 150 |
  | Assinatura, pousados | 34 | 18 |
  | Revoada (por virada) | 6–10 | 3–5 |

**Modos sem animação**
- Modo reduzido/estático (`html.menos-movimento`): sem pin no hero, janela no tamanho do card, cartaz todo aceso, assinatura no estado final sem scroll, nenhuma revoada, divisores parados.
- Sem JS: o HTML/CSS padrão mostra o card pequeno, a frase da Carreira visível e os divisores ✦.

**Robustez da rodada 1**
- `seguro()` em `main.js`, modo estático sem GSAP, `inert` no menu, foco nos sets e textos ocultos dos contadores: tudo continua funcionando e os testes de `revisao.test.mjs` seguem verdes (atualizados onde a spec removeu algo).

**Assets**
- O material bruto (vídeos baixados do YouTube) vai para `bruto/`, ignorado pelo git.

## Review Focus

1. **Rolar rápido ou pular pelo menu atravessando o hero preso, a pilha de sets e a assinatura de 300vh** deve chegar à seção certa. A janela e os morcegos ficam no estado coerente com a posição, sem "fantasmas" de estados intermediários. Teste: Task 11.
2. **Redimensionar ou girar com a assinatura na tela** recalcula a máscara e os alvos. O texto continua centralizado e os pousados continuam nas bordas. Teste: Task 8.
3. **Vídeos dos sets que não carregam** (rede lenta ou 404 de um clipe) não podem quebrar a pilha. O pôster fica e não há erro no console. Teste: Task 5.
4. **Leitor de tela:** a frase da abertura é lida uma vez só, a seção da assinatura tem nome e os ícones do Contrate não são lidos. Teste: Task 3 e Task 9.
5. **Hero no celular:** o card visível não pode cobrir o texto da base nem o letreiro, e a janela termina cobrindo a tela inteira. Teste: Task 3.

---

## Estrutura de arquivos

```
js/morcego.js        NOVO  ASAS_D, CORPO_D, VIEWBOX, criarMorcegoSvg(classe)
js/assinatura.js     NOVO  amostrarAlvos, criarMorcegos, fases, estadoMorcego (puras) + iniciarAssinatura(ctx)
js/revoadas.js       NOVO  iniciarRevoadas(ctx)
js/util.js           + criarRng (vinda de galeria.js)
js/animacoes.js      iniciarHero (janela), iniciarProducoes (acender), iniciarCartaz, iniciarDivisores; sai iniciarAssinatura
js/interface.js      iniciarHeader: header--escuro por [data-tema="claro"]
js/main.js           sem galeria; + divisores, cartaz, assinatura nova, revoadas
js/galeria.js, js/dados.js                     REMOVIDOS
css/base.css, css/secoes.css                   esquema novo
tools/gerar-texturas.py                        NOVO
tools/baixar-sets.sh                           NOVO (yt-dlp + ffmpeg)
tools/cortar-video.sh                          + janela-720, sets/maos|pista|cabine em 720 px
tools/tratar-fotos.py                          vermelho novo; sem recortes
assets/texturas/*.webp, assets/video/janela-720.*, assets/video/sets/*, assets/img/boiler-quadro.webp   NOVOS
assets/recortes/                               REMOVIDO
tests/unit/morcego.test.mjs, tests/unit/assinatura.test.mjs, tests/e2e/rodada2.test.mjs   NOVOS
tests/unit/galeria.test.mjs, tests/e2e/galeria.test.mjs                                  REMOVIDOS
```

---

### Task 1: Identidade nova, chamas e saída da galeria

**Files:**
- Create: `tools/gerar-texturas.py`, `assets/texturas/{preto-no-vermelho,vermelho-no-preto,creme-no-preto,vermelho-no-creme}.webp`, `tests/e2e/rodada2.test.mjs`
- Modify: `index.html` (fontes, `data-tema`, menu de 5 itens, sem `#galeria`), `css/base.css`, `css/secoes.css`, `js/main.js`, `js/interface.js` (`iniciarHeader`), `js/util.js` (+ `criarRng`), `tools/tratar-fotos.py`, `tools/requirements.txt` (+ `yt-dlp`), `.gitignore` (+ `/bruto/`), `tests/unit/assets.test.mjs`, `tests/unit/util.test.mjs`, `tests/e2e/base.test.mjs`, `tests/e2e/revisao.test.mjs`, `tests/e2e/responsivo.test.mjs`
- Delete: `js/galeria.js`, `js/dados.js`, `tests/unit/galeria.test.mjs`, `tests/e2e/galeria.test.mjs`, `assets/recortes/`

**Interfaces:**
- Produces:
  - `criarRng(semente:number): () => number` em `js/util.js` (mulberry32, igual à de `galeria.js`);
  - a classe CSS `.chamas-topo`, com a variável `--chamas: url(...)` e `--chamas-giro: scaleY(-1)` opcional;
  - `.reticula`;
  - `data-tema="claro"` → `header--escuro`.

- [ ] **Step 1: Testes que falham**

```js
// tests/unit/util.test.mjs (+)
test('criarRng determinístico em [0,1)', () => {
  const a = criarRng(7), b = criarRng(7);
  for (let i = 0; i < 20; i++) { const v = a(); assert.equal(v, b()); assert.ok(v >= 0 && v < 1); }
});
// tests/e2e/base.test.mjs: a ordem passa a ser
//   ['hero','carreira','numeros','producoes','sets','lineup','assinatura','contrate']
// tests/e2e/rodada2.test.mjs
test('fontes novas: títulos em Pirata One, texto em Space Mono', async () => {
  const { page } = await abrir(amb);
  assert.match(await page.$eval('#t-producoes', e => getComputedStyle(e).fontFamily), /Pirata One/);
  assert.match(await page.$eval('body', e => getComputedStyle(e).fontFamily), /Space Mono/);
});
test('vermelho novo nas seções vermelhas', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('#carreira', e => getComputedStyle(e).backgroundColor), 'rgb(232, 57, 47)');
});
test('header fica escuro sobre a seção creme das Produções', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 120);
  assert.ok(await page.$eval('header', h => h.classList.contains('header--escuro')));
});
test('menu com 5 seções numeradas', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('#menu .menu__links a', l => l.map(a => a.getAttribute('href'))),
    ['#carreira', '#producoes', '#sets', '#lineup', '#contrate']);
});
// tests/unit/assets.test.mjs: sai RECORTES; entra
test('texturas ≤ 200 KB', () => {
  for (const t of ['preto-no-vermelho', 'vermelho-no-preto', 'creme-no-preto', 'vermelho-no-creme'])
    assert.ok(tam(`assets/texturas/${t}.webp`) <= 200_000, t);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL (`criarRng` não exportada; ordem de seções; fonte; cor; texturas ausentes).

- [ ] **Step 3: Texturas e fotos**

**`tools/gerar-texturas.py`:** porta a função `chamas()` usada na sessão de design. São 4 combinações (fundo → tinta):

| Arquivo | Fundo | Tinta | Semente |
|---|---|---|---|
| `preto-no-vermelho` | `#E8392F` | `#0F1211` | 11 |
| `vermelho-no-preto` | `#0F1211` | `#E8392F` | 13 |
| `creme-no-preto` | `#0F1211` | `#F1E2C4` | 12 |
| `vermelho-no-creme` | `#F1E2C4` | `#E8392F` | 14 |

O algoritmo:
1. Ruído de 14×34 ampliado e com blur 10.
2. A crista `|v−128| < largura` vira tinta, com largura 24 a 30.
3. Deslocamento vertical por coluna de ±60 px.
4. `MaxFilter(5)`, blur 2,5 e grão para dar borda.

Cada textura sai em 1400×900, WebP q78.

**`tools/tratar-fotos.py`:** `VERMELHO = "#E8392F"`; remover `RECORTES`/`recortes()`. Rodar os dois scripts.

- [ ] **Step 4: CSS e HTML da identidade**

**Fontes e tokens**
- Trocar o link de fontes e os tokens.
- `.titulo` e `.gotica` passam a usar Pirata One, peso 400, `font-style: normal`, `line-height: .9`, `letter-spacing: 0`.
- `body` usa Space Mono 14 px com `font-stretch: normal`.
- `.rotulo` usa Space Mono 700, 12 px, caixa-alta, `letter-spacing: .1em`.
- Rever os tamanhos dos títulos de seção para `clamp(48px, 7vw, 112px)`.

**Utilitários**
- `.chamas-topo::before`: `content:""; position:absolute; left:0; right:0; top:-1px; height:100px` (60 px no celular), `background: var(--chamas) center top / auto 300px repeat-x; transform: var(--chamas-giro, none); pointer-events:none`. Cada seção com a classe é `position:relative`.
- `.reticula::after`: `radial-gradient(circle, rgba(15,18,17,.5) 1px, transparent 1.3px) 0 0/7px 7px`, com `opacity:.18`.

**Cor de cada seção** (spec §3):

| Seção | Fundo | Texto | `--chamas` | `--chamas-giro` |
|---|---|---|---|---|
| `carreira` | vermelho | preto | `preto-no-vermelho` | — |
| `numeros` | preto + textura `vermelho-no-preto` a 25% | creme | `vermelho-no-preto` | — |
| `producoes` | creme + retícula | preto | `creme-no-preto` | — |
| `sets` | preto | creme | `creme-no-preto` | `scaleY(-1)` |
| `lineup` | vermelho | preto | `preto-no-vermelho` | — |
| `assinatura` | creme + retícula | preto | `vermelho-no-creme` | — |
| `contrate` | vermelho | preto | `vermelho-no-creme` | `scaleY(-1)` |

**HTML**
- Remover a seção `#galeria`.
- Menu com 5 links e numeração nova; rótulos das seções renumerados.
- `data-tema="claro"` nas 5 seções da Global Constraints.

**`iniciarHeader`:** troca o gatilho único de `#contrate` por um ScrollTrigger por `[data-tema="claro"]` (`start:'top 60px'`, `end:'bottom 60px'`, `toggleClass: {targets:'.header', className:'header--escuro'}`).

**`main.js`:** sai a galeria (import, `iniciarGaleria`, listener de `change`).

**Testes:** atualizar `revisao.test.mjs` (o teste de CDN fora do ar deixa de exigir `.galeria--estatica` e passa a exigir `#contrate .contato a` visível) e `responsivo.test.mjs` (sem `#galeria` na lista). Apagar os arquivos da galeria.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm test`. Esperado: tudo PASS.

- [ ] **Step 6: Conferência visual.** Prints de 1440 e 390 de Carreira, Números e Produções. As chamas devem aparecer nas emendas e o texto não pode ficar sobre fundo sem contraste.

- [ ] **Step 7: Commit.** Mensagem: `git commit -m "feat: identidade da rodada 2 (Pirata One + Space Mono, blocos de cor, chamas) e saída da galeria"`.

---

### Task 2: Morcego único e divisores

**Files:**
- Create: `js/morcego.js`, `tests/unit/morcego.test.mjs`
- Modify: `index.html` (✦ do letreiro do hero → `<span class="div-morcego" aria-hidden="true">✦</span>`), `js/animacoes.js` (+ `iniciarDivisores`), `js/main.js`, `css/secoes.css`, `tests/e2e/rodada2.test.mjs`

**Interfaces:**
- Produces:
  - `ASAS_D: string`, `CORPO_D: string`, `VIEWBOX = '-28 -14 56 26'`;
  - `criarMorcegoSvg(classe = 'morcego'): SVGSVGElement`, que devolve `<svg viewBox aria-hidden focusable="false">` com `<path class="morcego__asas">` e `<path class="morcego__corpo">`;
  - `iniciarDivisores({ menosMovimento }): void`, que troca o conteúdo de todo `.div-morcego` por `criarMorcegoSvg('morcego morcego--div')`.

- [ ] **Step 1: Testes que falham**

```js
// tests/unit/morcego.test.mjs
test('silhueta: paths fechados e simétricos', () => {
  assert.match(CORPO_D, /^M-4 -6 .* Z$/);
  assert.equal((ASAS_D.match(/Z/g) ?? []).length, 2);  // duas asas
  assert.ok(ASAS_D.includes(' 27 -9') && ASAS_D.includes(' -27 -9')); // pontas espelhadas
});
// tests/e2e/rodada2.test.mjs (+)
test('divisores do letreiro do hero são morcegos', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$$eval('#hero .div-morcego', l => l.length >= 4 && l.every(d => d.querySelector('svg .morcego__asas'))));
});
test('sem JS os divisores mostram ✦', async () => {
  const { page } = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.equal(await page.$eval('#hero .div-morcego', d => d.textContent.trim()), '✦');
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL (módulo inexistente; divisores sem `svg`).

- [ ] **Step 3: Implementar**

**Paths** (do protótipo v2):
- `CORPO_D = 'M-4 -6 L-3.2 -12 L-1.2 -7.4 L1.2 -7.4 L3.2 -12 L4 -6 L3.6 5 L0 11 L-3.6 5 Z'`
- `ASAS_D`: a asa direita `M3.4 -5 Q14 -13 27 -9 Q24.5 -4 21 2.5 Q18 -1 15 5.5 Q12 2.5 9 8 Q6 4.5 3.4 5.5 Z` seguida da mesma com x negado.

**CSS**
- `.morcego` usa `fill: currentColor`.
- `.morcego__asas` tem `transform-box: fill-box; transform-origin: center; animation: bater var(--bate, .5s) ease-in-out infinite alternate`, com `@keyframes bater { from { transform: scaleY(1) } to { transform: scaleY(-.35) } }`.
- `.morcego--div` tem `height: .8em; width: auto; display: inline-block; vertical-align: middle; margin: 0 .35em`. Asas mais lentas (`--bate: .9s`).
- `.menos-movimento .morcego__asas { animation: none }`.

**`main.js`:** chamar `iniciarDivisores` **antes** de `iniciarLetreiros` (as larguras do trilho mudam).

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: morcego único e divisores do letreiro"`.

---

### Task 3: Hero — o card que vira a abertura da Carreira

**Files:**
- Modify: `tools/cortar-video.sh` (+ `janela-720`: início 5,8 s, duração 4 s, largura 720, crf 30, pôster `janela-720.jpg`), `index.html` (`#hero` e `#carreira`), `css/secoes.css`, `js/animacoes.js` (`iniciarHero`), `tests/e2e/hero.test.mjs`, `tests/unit/assets.test.mjs`
- Create: `assets/video/janela-720.mp4`, `assets/video/janela-720.jpg`

**Interfaces:**
- Consumes: `iniciarReveals`, que divide `[data-revelar]` em `.palavra`.
- Produces:
  - `iniciarHero(ctx)`: escolhe o vídeo do hero, adiciona `html.anima-hero` e monta a timeline da janela;
  - `.hero__janela`, `.hero__card-ref`, `.hero__abertura`, `.carreira__abertura`.

- [ ] **Step 1: Testes que falham** (substituem os testes de `.hero__card` em `hero.test.mjs`)

```js
const insets = p => p.$eval('.hero__janela', e => (getComputedStyle(e).clipPath.match(/-?[\d.]+px/g) ?? []).map(parseFloat));
test('topo: a janela tem o tamanho do card', async () => {
  const { page } = await abrir(amb);
  const [t, r, b, l] = await insets(page);
  assert.ok(t > 100 && r >= 0 && b > 100 && l > 900, JSON.stringify([t, r, b, l]));
});
test('fim do pin: a janela cobre a tela e a frase aparece', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#hero', 2.5 * 900 - 900);
  assert.ok((await insets(page)).slice(0, 4).every(v => Math.abs(v) < 1));
  assert.ok(await page.$eval('.hero__abertura', e => +getComputedStyle(e).opacity > 0.9));
});
test('celular: card visível acima do letreiro, sem cobrir o texto da base', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  const { card, letreiro, base } = await page.evaluate(() => ({
    card: document.querySelector('.hero__card-ref').getBoundingClientRect().toJSON(),
    letreiro: document.querySelector('#hero .letreiro').getBoundingClientRect().toJSON(),
    base: document.querySelector('.hero__base').getBoundingClientRect().toJSON(),
  }));
  assert.ok(card.width > 60 && card.bottom <= letreiro.top && card.bottom <= base.top);
});
test('leitor de tela ouve a frase da abertura uma vez só', async () => {
  const { page } = await abrir(amb);
  const arvore = await page.accessibility.snapshot({ interestingOnly: false });
  const textos = []; (function andar(n) { if (n.name) textos.push(n.name); (n.children ?? []).forEach(andar); })(arvore);
  assert.equal(textos.filter(t => t.includes('vertentes mais agressivas')).length, 1);
});
test('movimento reduzido: hero sem pin e frase visível na Carreira', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('#hero', e => e.getBoundingClientRect().height <= innerHeight + 1));
  assert.ok(await page.$eval('.carreira__abertura', e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== 'absolute'));
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `node --test tests/e2e/hero.test.mjs`. Esperado: FAIL (não existe `.hero__janela`).

- [ ] **Step 3: Implementar**

**Vídeo:** gerar `janela-720` com o script.

**HTML**
- `#hero` passa a ter `.hero__palco`, que contém:
  - o reel;
  - o logo;
  - os textos;
  - o letreiro;
  - `.hero__card-ref` (vazio);
  - `.hero__janela`, com `<video data-auto muted playsinline loop preload="none" poster="assets/video/janela-720.jpg" data-src="assets/video/janela-720.mp4">`, o degradê e `.hero__abertura` (`aria-hidden="true"`, rótulo "Nº 001 — Carreira" e a frase com `data-revelar`).
- `#carreira` ganha `<p class="carreira__abertura titulo">` com a mesma frase, logo depois do rótulo.
- Sai o `.hero__card` antigo.

**CSS padrão** (sem JS, reduzido e estático)
- `.hero` com `height: 100svh` e `.hero__palco` com `position: relative; height: 100%`.
- `.hero__janela` com a geometria do card: `position:absolute; right:var(--gutter); top:44%; width:clamp(120px,11vw,168px); aspect-ratio:9/16; border-radius:10px; overflow:hidden; outline:2px solid var(--creme)`.
- No celular: `width: clamp(84px, 24vw, 110px)` e `top: auto; bottom: calc(altura do letreiro + 96px)`.
- `.hero__card-ref` tem a mesma geometria, com `visibility:hidden`.
- `.hero__abertura` fica com `display:none`.

**CSS animado (`.anima-hero`)**
- `.hero` com `height: 250vh` e `.hero__palco` com `position: sticky; top:0; height: 100svh`.
- `.hero__janela` com `inset:0; width:auto; height:auto; aspect-ratio:auto; border-radius:0; outline:none`. O `clip-path` é controlado pelo JS.
- `.hero__abertura` com `display:flex; opacity:0`.
- `.carreira__abertura` recebe as regras de `.visualmente-oculto`.

**`iniciarHero(ctx)`** (só sem `menosMovimento`):
1. Define o `src` do reel (`escolherHero`) e adiciona `anima-hero` ao `<html>`.
2. Função `recorte()`: lê `.hero__card-ref.getBoundingClientRect()` e devolve `inset(${top}px ${innerWidth-right}px ${innerHeight-bottom}px ${left}px round 10px)`.
3. Timeline com scrub (`trigger:#hero`, `start:'top top'`, `end:'bottom bottom'`, `invalidateOnRefresh:true`):

   | Posição | Animação |
   |---|---|
   | 0 | `.hero__janela` com `clipPath: recorte` (função), `rotation:-4`, `transformOrigin` no centro do card |
   | 0,12 → 0,70 | `clipPath: 'inset(0px 0px 0px 0px round 0px)'`, `rotation:0`. Em paralelo: logo `scale 1.35` e `opacity 0`; textos e letreiro `opacity 0` e `y 40`; `.hero__escuro` `opacity .6` |
   | 0,70 → 1 | `.hero__abertura` `opacity 1`; `.hero__abertura .palavra` com stagger de `opacity .15→1` |

4. O vídeo da janela usa `data-auto`, então é o `observarVideos` que toca.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Conferência visual.** Prints em 1440 e 390 em três pontos: 0, 0,4 e 1 do pin. A janela deve crescer a partir do card e a frase deve ficar legível.

- [ ] **Step 6: Commit.** Mensagem: `git commit -m "feat: card do hero cresce e vira a abertura da Carreira"`.

---

### Task 4: Carreira e Números no esquema novo

**Files:**
- Modify: `index.html`, `css/secoes.css`, `tests/e2e/carreira.test.mjs`

- [ ] **Step 1: Teste que falha**

```js
test('Carreira: foto em multiply sobre o vermelho', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('.carreira__foto .tks', e => getComputedStyle(e).mixBlendMode), 'multiply');
  assert.match(await page.$eval('.carreira__foto .tks', e => e.currentSrc), /foto-22-tks/);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `node --test tests/e2e/carreira.test.mjs`. Esperado: FAIL (a foto é a 31, sem multiply).

- [ ] **Step 3: Implementar**

**Carreira** (vermelho, texto preto):
- A foto `.foto-dupla` vira a `foto-22` (tks e cor) com `.tks{mix-blend-mode:multiply}`. A versão colorida no hover continua.
- Grade: texto à esquerda (2 colunas no desktop) e foto à direita.
- Bio em Space Mono 14 px, `line-height 1.7`.

**Números:**
- O `::before` usa `assets/texturas/vermelho-no-preto.webp` com `opacity:.25` (sai `tex-chamas`).
- Valores em Pirata One `clamp(56px, 8vw, 128px)`.

**Testes:** os de bio e de contadores continuam como estão.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: Carreira em vermelho e Números com chamas"`.

---

### Task 5: Sets com trechos do YouTube

**Files:**
- Create: `tools/baixar-sets.sh`, `assets/video/sets/{senso,grau,ataque,veneno-lab,sensi,maos,pista,cabine}.{mp4,jpg}`, `assets/img/boiler-quadro.webp`
- Modify: `tools/cortar-video.sh` (`maos`, `pista` e `cabine` também em 720 px para `sets/`), `index.html` (`data-src`/`poster` dos 8 sets), `tests/e2e/sets.test.mjs`, `tests/unit/assets.test.mjs`

**Interfaces:**
- Produces: os caminhos `assets/video/sets/*` e `assets/img/boiler-quadro.webp` (consumido na Task 6).

- [ ] **Step 1: Testes que falham**

```js
// sets.test.mjs (+)
test('vídeos dos sets: 5 do YouTube + 3 do reel em sets/', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set__video', l => l.map(v => v.dataset.src)),
    ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'maos', 'pista', 'cabine'].map(n => `assets/video/sets/${n}.mp4`));
});
test('clipe que não carrega não quebra a pilha', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/sets\/ataque\.mp4/] });
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60);
  await new Promise(r => setTimeout(r, 900));
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  assert.ok(await page.$eval('.set:nth-child(3) .set__video', v => v.poster.endsWith('sets/ataque.jpg')));
  assert.deepEqual(erros, []);
});
// assets.test.mjs (+)
test('clipes dos sets', () => {
  for (const n of ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi'])
    assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 700_000, n);
  for (const n of ['maos', 'pista', 'cabine'])
    assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 450_000, n);
  for (const n of ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'maos', 'pista', 'cabine'])
    assert.ok(tam(`assets/video/sets/${n}.jpg`) > 0, n);
  assert.ok(tam('assets/img/boiler-quadro.webp') <= 250_000);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL (arquivos ausentes; `data-src` antigos).

- [ ] **Step 3: Baixar e escolher os trechos**

**Download**
- `pip install yt-dlp`. Já está em `requirements.txt`; se faltar, usar `--target` numa pasta de rascunho com `PYTHONPATH`.
- Para cada id (`5ackC9W3BIs`, `2Z2gP9W9Epo`, `PuYyCp85V9U`, `SLUUZG8-oYA`, `IP9V-06-QJw`), `tools/baixar-sets.sh` roda `python -m yt_dlp -f "bv*[height<=720][ext=mp4]/b[height<=720]" -o "bruto/sets/%(id)s.%(ext)s"` sem áudio.

**Escolha dos trechos**
- Gerar a folha de quadros: `ffmpeg -i bruto/sets/ID.mp4 -vf "fps=1/10,scale=240:-1,tile=8x8" -frames:v 1 bruto/sets/ID-folha.jpg`.
- Ver a folha e escolher um trecho de 4 s com pista cheia ou DJ em ação, longe de vinhetas, textos e logos de canal.
- Registrar no script uma linha `nome id início duração` por set.
- Fixar `boiler-quadro`: um quadro de 1280×720 do `PuYyCp85V9U`, num instante com o painel "Boiler Baile" ou a pista. Sai em WebP q78. Isto difere da spec §4.4, que tirava o quadro do reel: o reel é vertical e só tem 720 px de largura, e a faixa das Produções é horizontal.

- [ ] **Step 4: Codificar.** `ffmpeg -ss INI -t 4 -i bruto/sets/ID.mp4 -an -vf "scale=960:-2,fps=24" -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/sets/NOME.mp4`. Pôster tirado em `INI+0.6`, em 960 px. Os clipes do reel (`maos`, `pista`, `cabine`) saem em 720 px pelo `cortar-video.sh`. Atualizar `data-src`/`poster` no HTML.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS. Se algum clipe passar do orçamento, subir o `crf` para 32 nele.

- [ ] **Step 6: Commit.** O `bruto/` fica ignorado.

```bash
git add tools assets/video/sets assets/img/boiler-quadro.webp index.html tests .gitignore
git commit -m "feat: sets com trechos dos vídeos originais"
```

---

### Task 6: Produções que acendem

**Files:**
- Modify: `index.html` (`#producoes`: `.producao__fundo` em cada linha; sai `.producoes__flutuante`), `css/secoes.css`, `js/animacoes.js` (`iniciarProducoes`), `tests/e2e/producoes.test.mjs`

**Interfaces:**
- Consumes: `assets/img/boiler-quadro.webp` (Task 5)
- Produces: `.producao__fundo`, `.producao--acesa`

- [ ] **Step 1: Testes que falham** (substituem "desktop: foto segue o cursor")

```js
const opac = (p, i) => p.$$eval('.producao__fundo', (l, i) => +getComputedStyle(l[i]).opacity, i);
test('desktop: a foto da faixa acende no hover', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 300);
  assert.ok(await opac(page, 1) < 0.3);
  await (await page.$$('.producao'))[1].hover();
  await new Promise(r => setTimeout(r, 700));
  assert.ok(await opac(page, 1) > 0.9);
  assert.equal(await page.$('.producoes__flutuante'), null);
});
test('celular: a faixa no centro da tela acende', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await page.evaluate(() => { const l = document.querySelectorAll('.producao')[2]; const r = l.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); });
  await new Promise(r => setTimeout(r, 700));
  assert.ok(await page.$$eval('.producao', l => l[2].classList.contains('producao--acesa')));
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `node --test tests/e2e/producoes.test.mjs`. Esperado: FAIL (`.producao__fundo` inexistente).

- [ ] **Step 3: Implementar**

**HTML:** `.producao__fundo` (com `aria-hidden`) e `background-image` por linha:

| Festa | Foto |
|---|---|
| Savage | `foto-21-tks` |
| Boiler Baile | `boiler-quadro` |
| Sonora Breck | `foto-57-tks` |
| Sinistro DNB | `foto-39-tks` |

**CSS**
- `.producao` ganha `position:relative; isolation:isolate; overflow:hidden`.
- Estado apagado de `.producao__fundo`: `position:absolute; inset:0; z-index:-1; background-size:cover; background-position:center 30%; opacity:.14; mix-blend-mode:multiply; filter:grayscale(1); transform:scale(1.04)`, com transições de 0,5 s.
- Aceso (`.producao:hover`, `.producao:focus-within`, `.producao--acesa`): `opacity:1; mix-blend-mode:normal; filter:none; transform:none`.
- Um `::after` com degradê preto à esquerda aparece no aceso.
- Nome, papel e descrição passam de `--preto` para `--creme`.

**JS (`iniciarProducoes`)**
- Remove a parte do cursor e do `quickTo`.
- Com `mql.matches` (celular), cria um ScrollTrigger por linha (`start:'top 55%'`, `end:'bottom 45%'`, `toggleClass:'producao--acesa'`).
- O acordeão continua igual.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: Produções com foto que acende"`.

---

### Task 7: Line-up em cartaz

**Files:**
- Modify: `index.html` (`#lineup`: sai o par de `.letreiro`, entra `.cartaz`), `css/secoes.css`, `js/animacoes.js` (+ `iniciarCartaz`), `js/main.js`, `tests/e2e/final.test.mjs`, `tests/e2e/revisao.test.mjs`

**Interfaces:**
- Consumes: `iniciarDivisores` (Task 2), que deve rodar antes, porque o cartaz usa `.div-morcego`.
- Produces: `iniciarCartaz(ctx)`, `.cartaz`, `.cartaz__nome`.

- [ ] **Step 1: Testes que falham**

```js
// final.test.mjs (+); o teste "line-up com todos os nomes" continua
const opacNomes = p => p.$$eval('.cartaz__nome', l => l.map(e => +getComputedStyle(e).opacity));
test('cartaz: nomes acendem com o scroll', async () => {
  const { page } = await abrir(amb);
  await page.evaluate(() => { const c = document.querySelector('.cartaz'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight * 0.85); });
  await new Promise(r => setTimeout(r, 500));
  assert.ok((await opacNomes(page))[0] < 0.5);
  await rolarPara(page, '.cartaz', 200);
  await new Promise(r => setTimeout(r, 500));
  const fim = await opacNomes(page);
  assert.equal(fim.length, 20); assert.ok(fim.every(o => o > 0.9));
});
// revisao.test.mjs: "movimento reduzido: todos os nomes do line-up cabem na tela" vira
test('movimento reduzido: cartaz todo aceso e dentro da tela', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  const { ops, dentro } = await page.evaluate(() => ({
    ops: [...document.querySelectorAll('.cartaz__nome')].map(e => +getComputedStyle(e).opacity),
    dentro: [...document.querySelectorAll('.cartaz__nome')].every(e => e.getBoundingClientRect().right <= innerWidth + 1),
  }));
  assert.ok(ops.every(o => o > 0.9) && dentro);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL (`.cartaz` inexistente).

- [ ] **Step 3: Implementar**

**HTML** (spec §4.6):
- `.cartaz` com `<p class="cartaz__rotulo">Já dividiu o line com</p>`.
- `.cartaz__nacionais`: 7 `<span class="cartaz__nome">` separados por `.div-morcego`.
- `.cartaz__under`: 13 `<span class="cartaz__nome">`, também separados por `.div-morcego`.
- Embaixo, a lista "Palcos, festas e rádios" em chips (Space Mono 13 px, borda de 2 px preta).

**CSS:** `text-align:center`, `white-space:nowrap` por nome e quebra entre nomes. `opacity:.18` só sob `.anima-cartaz`; sem a classe, tudo fica aceso.

**`iniciarCartaz(ctx)`** (só sem `menosMovimento`): adiciona `anima-cartaz` ao `<html>` e faz `gsap.to('.cartaz__nome', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.cartaz', start: 'top 75%', end: 'bottom 55%', scrub: true } })`.

**Limpeza:** remover o CSS dos letreiros do line-up e das regras `.menos-movimento .lineup`.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: line-up em cartaz que acende"`.

---

### Task 8: Assinatura com morcegos

**Files:**
- Create: `js/assinatura.js`, `tests/unit/assinatura.test.mjs`
- Modify: `index.html` (`#assinatura`: `height 300vh`, palco com `<canvas class="assinatura__tela" aria-hidden="true">` e `h2.visualmente-oculto` "Brunin"; saem os SVGs do traço e a cortina), `css/secoes.css`, `js/animacoes.js` (sai `iniciarAssinatura`), `js/main.js`, `tests/e2e/final.test.mjs`, `tests/e2e/revisao.test.mjs` (sai o teste do traço em retrato)

**Interfaces:**
- Consumes: `ASAS_D`, `CORPO_D` (Task 2); `criarRng` (Task 1)
- Produces (puras, exportadas):
  - `amostrarAlvos(alfa: Uint8ClampedArray, W:number, H:number, { nTinta:number, nPouso:number, distMin:number, semente:number }) → { tinta: {x,y}[], pouso: {x,y}[] }`. O `alfa` é o RGBA da máscara; o canal alfa > 128 conta como "dentro". Os pontos de `pouso` são pixels dentro cuja posição `y-3` está fora (borda de cima), escolhidos com espaçamento ≥ `distMin`.
  - `criarMorcegos({ tinta, pouso, W, H, esc, semente }) → Morcego[]`, com os campos do protótipo v2: `alvo, pousado, ini, meio, curva, entra, pouso, tam, bateF, fase, pairar`.
  - `fases(p) → { Bf }`, com `Bf = clamp((p - 0.4) / 0.5, 0, 1)`.
  - `estadoMorcego(m, p, t, { W, H, esc }) → { x, y, visivel, bate, giro }`. As fórmulas são as de `desenhar()` em `docs/identidade/morcegos.html` v2: entrada com `f = suave(clamp((p - m.entra) / 0.3))`, pouso com `a = suave(clamp((Bf - m.pouso) / 0.35))`. `visivel` é falso para tinta já pousada e para quem ainda está fora da tela (x < −40).
  - `iniciarAssinatura(ctx): void` (DOM).

- [ ] **Step 1: Testes unitários que falham**

```js
const dims = { W: 1200, H: 700, esc: 1 };
function mascaraRet(W, H, x0, y0, x1, y1) {
  const a = new Uint8ClampedArray(W * H * 4);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[(y * W + x) * 4 + 3] = 255;
  return a;
}
test('amostrarAlvos: tinta dentro, pouso na borda de cima e espaçado', () => {
  const { tinta, pouso } = amostrarAlvos(mascaraRet(200, 120, 40, 50, 160, 90), 200, 120, { nTinta: 60, nPouso: 5, distMin: 20, semente: 3 });
  assert.equal(tinta.length, 60);
  assert.ok(tinta.every(p => p.x >= 40 && p.x < 160 && p.y >= 50 && p.y < 90));
  assert.ok(pouso.length >= 3 && pouso.every(p => p.y >= 50 && p.y <= 52));
  for (const a of pouso) for (const b of pouso) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 20);
});
test('fases: limites', () => {
  assert.equal(fases(0).Bf, 0); assert.equal(fases(0.4).Bf, 0); assert.equal(fases(0.9).Bf, 1); assert.equal(fases(1).Bf, 1);
});
test('criarMorcegos determinístico', () => {
  const alvos = { tinta: [{ x: 600, y: 350 }], pouso: [{ x: 620, y: 300 }] };
  assert.deepEqual(criarMorcegos({ ...alvos, ...dims, semente: 7 }), criarMorcegos({ ...alvos, ...dims, semente: 7 }));
});
test('estadoMorcego: começo fora, fim na assinatura', () => {
  const ms = criarMorcegos({ tinta: [{ x: 600, y: 350 }, { x: 610, y: 360 }], pouso: [{ x: 620, y: 300 }], ...dims, semente: 7 });
  assert.ok(ms.every(m => estadoMorcego(m, 0, 0, dims).visivel === false));
  for (const m of ms) {
    const e = estadoMorcego(m, 1, 5, dims);
    if (m.pousado) { assert.ok(e.visivel); assert.ok(Math.abs(e.x - m.alvo.x) < 1e-6); assert.ok(Math.abs(e.y - (m.alvo.y - 7 * m.tam)) < 1e-6); }
    else assert.equal(e.visivel, false);
  }
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:unit`. Esperado: FAIL (módulo inexistente).

- [ ] **Step 3: Funções puras.** Portar do protótipo v2 para as assinaturas acima, usando `criarRng` de `util.js` e as constantes do protótipo.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm run test:unit`. Esperado: PASS.

- [ ] **Step 5: Testes e2e que falham** (substituem "assinatura desenha o traço com o scroll")

```js
const escuros = p => p.$eval('.assinatura__tela', c => {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const d = g.getImageData(w * 0.3, h * 0.4, w * 0.4, h * 0.25).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] < 60) n++; return n;
});
test('assinatura: no fim, o "Brunin" está formado no canvas', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 3 * 900 - 900);
  await new Promise(r => setTimeout(r, 400));
  assert.ok(await escuros(page) > 5000);
});
test('assinatura: girar a tela no fim mantém o texto formado', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 3 * 900 - 900);
  await page.setViewport({ width: 900, height: 1200 });
  await new Promise(r => setTimeout(r, 900));
  await rolarPara(page, '#assinatura', 3 * 1200 - 1200);
  await new Promise(r => setTimeout(r, 400));
  assert.ok(await escuros(page) > 3000);
});
test('assinatura no modo reduzido: estado final sem scroll', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  await rolarPara(page, '#assinatura');
  assert.ok(await escuros(page) > 5000);
});
test('assinatura tem nome para leitor de tela', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('#assinatura', s => document.getElementById(s.getAttribute('aria-labelledby')).textContent.trim()), 'Brunin');
});
```

- [ ] **Step 6: Rodar e ver falhar.** Rodar `node --test tests/e2e/final.test.mjs`. Esperado: FAIL.

- [ ] **Step 7: `iniciarAssinatura(ctx)`**

**Montagem (`medir()`)**
1. Canvas no tamanho do palco, com DPR limitado a 2.
2. Máscara offscreen com "Brunin" em Pirata One `min(W·0.27, H·0.5)`, centralizado a 52% da altura. O desenho espera `document.fonts.load('400 200px "Pirata One"')`.
3. `amostrarAlvos` com `nTinta`/`nPouso` da Global Constraints e `distMin = 46 × esc`.
4. `criarMorcegos` com `esc = max(0.55, min(W/1400, H/800))`.

**Progresso:** `p` vem de um ScrollTrigger (`trigger:#assinatura`, `start:'top top'`, `end:'bottom bottom'`).

**Desenho** (`desenhar(p, t)`), como no protótipo v2:
1. Camada de tinta: manchas onde cada morcego de tinta pousou, recortadas com `destination-in` pela máscara. Com `Bf ≥ 1`, preenche tudo.
2. Por cima, os morcegos visíveis, desenhados com `Path2D(ASAS_D)` e `Path2D(CORPO_D)`.

**Ciclo de vida**
- O rAF só roda com a seção visível (IntersectionObserver).
- `resize` com debounce de 200 ms chama `medir()`.

**Sem animação:** com `menosMovimento` ou sem GSAP, `medir()` e um único `desenhar(1, 0)`. O redesenho acontece no `resize`.

- [ ] **Step 8: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 9: Conferência visual.** Prints em `p` 0,3 / 0,7 / 1, em 1440 e 390, comparados com `morcegos.html`.

- [ ] **Step 10: Commit.** Mensagem: `git commit -m "feat: assinatura formada por morcegos"`.

---

### Task 9: Contrate com ícones

**Files:**
- Modify: `index.html` (`#contrate .contato`), `css/secoes.css`, `tests/e2e/final.test.mjs`

- [ ] **Step 1: Teste que falha** (o teste dos `href` exatos continua)

```js
test('contrate: cada link tem ícone escondido do leitor de tela', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$$eval('#contrate .contato a', l => l.length === 5 && l.every(a => {
    const s = a.querySelector('svg.contato__icone'); return s && s.getAttribute('aria-hidden') === 'true'; })));
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `node --test tests/e2e/final.test.mjs`. Esperado: FAIL.

- [ ] **Step 3: Implementar**

**Ícones:** SVG inline 24×24, `fill:none; stroke:currentColor; stroke-width:2`, com os paths da seção 7 de `docs/identidade/revisao-2.html` (Instagram, WhatsApp, envelope, Drive, documento com seta).

**Estrutura de cada `<a>`:** ícone `.contato__icone` + `.contato__valor` + `.contato__rotulo`.

**CSS**
- `.contato a`: `display:flex; align-items:center; gap:18px; position:relative; isolation:isolate; overflow:hidden; padding:16px 12px; border-top:2px solid var(--preto)`.
- `::before` preto com `transform:scaleX(0); transform-origin:left`.
- Hover e foco: `::before` em `scaleX(1)` e texto creme. O ícone faz `rotate(360deg) scale(1.2)` com `transition .6s cubic-bezier(.2,1.6,.4,1)`.
- Valor em Pirata One `clamp(28px,3.6vw,48px)`; rótulo em Space Mono 700 de 14 px, alinhado à direita (`margin-left:auto`).
- Celular: o rótulo fica acima do valor.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: Contrate com ícones que giram"`.

---

### Task 10: Revoadas nas viradas

**Files:**
- Create: `js/revoadas.js`
- Modify: `index.html` (`<div class="revoada" data-revoada aria-hidden="true"></div>` no início de `#producoes`, `#sets` e `#assinatura`), `css/secoes.css`, `js/main.js`, `tests/e2e/rodada2.test.mjs`

**Interfaces:**
- Consumes: `criarMorcegoSvg` (Task 2)
- Produces: `iniciarRevoadas(ctx): void`

- [ ] **Step 1: Testes que falham**

```js
test('revoada cruza a tela na virada para os Sets', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#sets', -450);
  await new Promise(r => setTimeout(r, 300));
  assert.ok(await page.$$eval('#sets .revoada svg', l => l.length >= 6 && l.some(s => {
    const r = s.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight; })));
});
test('revoada: celular com menos morcegos e sem rolagem lateral', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#sets', -420);
  assert.ok(await page.$$eval('#sets .revoada svg', l => l.length >= 3 && l.length <= 5));
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('.revoada')].every(r => getComputedStyle(r).overflow === 'hidden')));
});
test('movimento reduzido: sem revoadas', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$$eval('.revoada svg', l => l.length), 0);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `node --test tests/e2e/rodada2.test.mjs`. Esperado: FAIL.

- [ ] **Step 3: Implementar**

**CSS:** `.revoada { position:absolute; left:0; right:0; top:-50vh; height:100vh; overflow:hidden; pointer-events:none; z-index:6 }`. A cor é `currentColor` herdada; pôr `color` explícito por seção (preto em `#producoes` e `#assinatura`, creme em `#sets`).

**`iniciarRevoadas`** (só sem `menosMovimento`), para cada `[data-revoada]`:
1. Criar `n` morcegos (`criarRng(semente por índice)`; n = 6 a 10 no desktop, 3 a 5 no celular).
2. Cada um tem largura `clamp(28px, 4vw, 64px)` × fator de 0,6 a 1,3, posição `top` de 20% a 80% e `--bate` de 0,25 a 0,45 s.
3. Uma timeline com scrub (`trigger: secao`, `start:'top bottom'`, `end:'top top'`) leva cada morcego de `x:'-15vw'` a `x:'115vw'` com atraso entre 0 e 0,3 da timeline, `y` em arco (keyframes `0 → -25vh → -5vh`) e rotação de −10° a 10°.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "feat: revoadas de morcegos nas viradas de seção"`.

---

### Task 11: Varredura final

**Files:**
- Modify: `tests/e2e/responsivo.test.mjs`, `tests/e2e/rodada2.test.mjs`, e o CSS/JS que precisarem de ajuste

- [ ] **Step 1: Testes de varredura**

**Saltos pelo menu** (Review Focus 1):

```js
test('pular pelo menu do topo ao Contrate deixa tudo no estado final coerente', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2600));
  const topo = await page.$eval('#contrate', e => e.getBoundingClientRect().top);
  assert.ok(topo > -5 && topo < 100);
  await page.click('#menu-botao'); await page.click('#menu a[href="#carreira"]');
  await new Promise(r => setTimeout(r, 2600));
  const ins = await page.$eval('.hero__janela', e => (getComputedStyle(e).clipPath.match(/-?[\d.]+px/g) ?? []).map(parseFloat));
  assert.ok(ins.slice(0, 4).every(v => Math.abs(v) < 1)); // passou do hero: janela aberta
});
```

**Lista de prints:** a lista de seções de `responsivo.test.mjs` passa a ser a nova. Entram prints extras do hero (0,4 do pin) e da assinatura (0,3 e 0,7).

- [ ] **Step 2: Rodar.** Rodar `npm run test:e2e`. Esperado: PASS. Se falhar, corrigir na seção culpada.

- [ ] **Step 3: Revisão visual.** Ver os prints e comparar com `revisao-2.html` e `morcegos.html`. Conferir:
  - as cores por seção da spec §3;
  - as chamas nas emendas;
  - o contraste;
  - que nenhum texto fica cortado em 390 px;
  - a janela cobrindo a tela no fim;
  - o "Brunin" formado, com morcegos nas bordas.

- [ ] **Step 4: Suíte completa.** Rodar `npm test`. Esperado: 0 falhas.

- [ ] **Step 5: Commit.** Mensagem: `git commit -m "test: varredura final da rodada 2"`.
