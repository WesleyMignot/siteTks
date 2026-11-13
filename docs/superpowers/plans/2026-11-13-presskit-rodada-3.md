# Press kit Brunin Tks — Rodada 3: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a rodada 3 do press kit:
- janela do hero com um reel novo, tocando desde o início;
- morcegos com silhueta e batida novas, nuvens cheias nas viradas e a entrada da Assinatura vindo de todos os lados;
- Produções com fotos novas, sem a Sinistro DNB;
- Sets com ordem nova, trecho novo do Sensi, reels e player do SoundCloud;
- as 8 pendências da rodada 2.

**Architecture:** Site estático em HTML, CSS e ES modules, sem build.
- `js/morcego.js` passa a ter o contorno do `morcego_ref`, o rig das asas e 32 quadros pré-calculados (path SVG e `Path2D`). Todos os morcegos usam esses quadros.
- Um canvas fixo, o "céu" (`js/ceu.js`), desenha as nuvens das viradas e os morcegos da Assinatura. O palco da Assinatura desenha só a tinta das letras.
- O SoundCloud entra por botão: o clique cria o iframe oficial e a Widget API pausa os outros players.

**Tech Stack:**
- GSAP 3.12.5 + ScrollTrigger (cdnjs) e Lenis 1.1.13 (jsDelivr);
- SoundCloud Widget (`w.soundcloud.com/player`, `w.soundcloud.com/player/api.js`);
- testes: `node --test` e puppeteer-core 25.16.0;
- ferramentas: Python (Pillow), yt-dlp e ffmpeg.

**Spec:** `docs/superpowers/specs/2026-11-13-presskit-rodada-3-design.md` (referência visual: `docs/identidade/morcegos-3.html`)

## Global Constraints

**Cores e fontes**
- Tokens: `--preto #0F1211`, `--creme #F1E2C4`, `--vermelho #E8392F`.
- Fontes: Pirata One e Space Mono.
- Scripts externos permitidos: os do GSAP/Lenis (versões acima) e `https://w.soundcloud.com/player/api.js`.

**Morcegos**
- Silhueta: os 107 pontos de `tools/tracar-morcego.py docs/identidade/morcego_ref.jpg 0.9`.
- Origem no corpo `(290, 300)`, escala `56/475`.
- 32 quadros por batida, com os parâmetros do rig da spec §3.1.
- Nuvem das viradas: 90 morcegos no desktop e 40 no celular (≤ 820 px), vermelhos.
- Assinatura: 460 de tinta + 34 pousados no desktop; 230 + 18 no celular. Sem véu preto. Crescimento máximo de 1,6×.
- Seção da Assinatura com 350vh no modo animado.
- DPR dos canvases limitado a 2.

**Orçamentos de tamanho**

| Arquivo | Limite |
|---|---|
| `janela-720.mp4` | 1,8 MB |
| `janela-540.mp4` | 1,2 MB |
| clipes dos reels nos sets | 450 KB |
| clipes do YouTube | 700 KB |
| `producao-*.webp` | 300 KB |

**Sinistro DNB**
- Sai do card, do letreiro do hero, do texto de abertura das Produções e da `meta description`.
- Fica na biografia da Carreira e no "4 festas criadas" (`data-contar="4"`).

**Reels** (nenhum se repete)
- `DW9lHDGkSo6` → janela do hero.
- `DRuX77XEWlI`, `DG_97MaOjeD`, `DO1bP5kEUF_` → sets 6, 7 e 8 (`sets/reel-a`, `reel-b`, `reel-c`).

**Modos**
- **Movimento reduzido ou estático:** sem céu, assinatura final parada, divisores parados, card do hero no pôster, Produções sem zoom.
- **Sem JS:** sem céu, sem player e com o card no pôster.

**Fluxo**
- Rulings no ledger.
- Os JPGs brutos da raiz ficam fora do git.

## Review Focus

1. **Pular pelo menu através das viradas e da Assinatura:** o céu não pode ficar com morcegos "presos" na tela quando nenhuma cena está ativa. Ao chegar no Contrate, ele está vazio. Teste: Task 2.
2. **Girar ou redimensionar no meio da Assinatura:** os morcegos do céu continuam alinhados com as letras do palco. Os alvos são recalculados, e a âncora da rodada 2 mantém o lugar. Teste: Task 3.
3. **SoundCloud bloqueado** (extensão de privacidade, rede): clicar em "Ouvir aqui" não gera erro na página, e o link para o SoundCloud continua. Teste: Task 6.
4. **Autoplay recusado** (economia de bateria, iOS): o `play()` do card rejeita, o pôster fica e não sai erro no console. Teste: Task 4.
5. **Celular com tela de alta densidade (DPR 3):** o céu e o palco não passam de 2× a tela em pixels. Teste: Task 2.

---

## Estrutura de arquivos

```
js/morcego.js      REESCRITO  contorno + rig + QUADROS_D/formas + desenharMorcego + divisores animados
js/ceu.js          NOVO       canvas fixo; cenas (nuvens das viradas, assinatura); posicaoNuvem, criarNuvem
js/assinatura.js   MUDA       criarMorcegos (4 lados), fases {Bf, perto}, estadoMorcego {…, tam}; tinta no palco; cena no céu
js/soundcloud.js   NOVO       urlPlayer(faixa) + iniciarSoundcloud(ctx)
js/revoadas.js     SAI
js/animacoes.js    MUDA       iniciarDivisores usa o novo SVG; iniciarHero sem etiqueta, janela tocando; Produções (toque/zoom)
js/util.js         MUDA       + escolherJanela(largura)
js/main.js         MUDA       céu, soundcloud, sai revoadas
tools/baixar-reels.sh   NOVO  reels → janela-720/540 + sets/reel-a/b/c
tools/baixar-sets.sh    MUDA  trecho novo do Sensi; sai o boiler-quadro
tools/tratar-fotos.py   MUDA  + producao-{savage,boiler,sonora}.webp
```

---

### Task 1: Silhueta nova, rig e divisores que batem as asas

**Files:**
- Modify: `js/morcego.js` (reescrito), `js/animacoes.js` (`iniciarDivisores`), `css/base.css` (sai `@keyframes bater`, `.morcego__asas` e `.morcego--div` com a proporção nova)
- Test: `tests/unit/morcego.test.mjs` (reescrito), `tests/e2e/rodada2.test.mjs` (teste dos divisores)

**Interfaces:**
- Produces:
  - `QUADROS: number` (32)
  - `pose(f: number) → {x,y}[]`
  - `QUADROS_D: string[]` (path `M… Z` de cada quadro)
  - `VIEWBOX: string` (calculado dos limites de todos os quadros, com 1 unidade de folga)
  - `quadro(fase: number) → number` (índice 0–31)
  - `desenharMorcego(g: CanvasRenderingContext2D, x, y, tam, fase, giro = 0, espelho = 1) → void` (usa um cache `Path2D` criado sob demanda)
  - `criarMorcegoSvg(classe = 'morcego') → SVGElement`, com um único `<path class="morcego__forma">`
  - `animarDivisores({ menosMovimento }) → void`
  - `QUADRO_REPOUSO = 6`, o quadro mais próximo da pose da referência, usado no movimento reduzido
- Consumes: os 107 pontos de `tools/tracar-morcego.py` (colar como constante `BRUTO` em `js/morcego.js`).

- [ ] **Step 1: Testes que falham**

```js
// tests/unit/morcego.test.mjs
import { QUADROS, QUADROS_D, VIEWBOX, pose } from '../../js/morcego.js';
const nums = d => d.match(/-?\d+(\.\d+)?/g).map(Number);
test('32 quadros fechados', () => {
  assert.equal(QUADROS, 32); assert.equal(QUADROS_D.length, 32);
  assert.ok(QUADROS_D.every(d => d.startsWith('M') && d.trim().endsWith('Z')));
});
test('todos os quadros cabem no viewBox', () => {
  const [x, y, w, h] = VIEWBOX.split(' ').map(Number);
  for (const d of QUADROS_D) { const n = nums(d);
    for (let i = 0; i < n.length; i += 2) assert.ok(n[i] >= x && n[i] <= x + w && n[i + 1] >= y && n[i + 1] <= y + h); }
});
test('batida fluida: nenhum ponto pula mais de 10 unidades entre quadros vizinhos', () => {
  // a ponta anda ~8 unidades por quadro na batida normal; um salto de pose passaria bem de 10
  const ps = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI));
  for (let i = 0; i < 32; i++) { const a = ps[i], b = ps[(i + 1) % 32];
    assert.ok(a.every((p, k) => Math.hypot(p.x - b[k].x, p.y - b[k].y) < 10)); }
});
test('a ponta da asa esquerda sobe e desce mais de 20 unidades', () => {
  const r = pose(0), iPonta = r.reduce((m, p, k) => (p.x < r[m].x ? k : m), 0); // mesmo índice em todos os quadros
  const ys = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI)[iPonta].y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 20);
});
test('o corpo só sobe e desce', () => {
  const corpo = f => pose(f).filter((p, k, arr) => Math.abs(p.x) < 2); // pontos perto do eixo do corpo
  const a = corpo(0), b = corpo(Math.PI);
  assert.ok(a.length > 0 && a.every((p, k) => Math.abs(p.x - b[k].x) < 0.01));
});
```

```js
// tests/e2e/rodada2.test.mjs — "divisores do letreiro do hero são morcegos" passa a procurar 'svg .morcego__forma'; e:
test('divisores batem as asas (o desenho muda com o tempo)', async () => {
  const { page } = await abrir(amb);
  const d = () => page.$eval('#hero .div-morcego path', p => p.getAttribute('d'));
  const a = await d(); await new Promise(r => setTimeout(r, 250));
  assert.notEqual(await d(), a);
});
test('movimento reduzido: divisores parados', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  const d = () => page.$eval('#hero .div-morcego path', p => p.getAttribute('d'));
  const a = await d(); await new Promise(r => setTimeout(r, 250));
  assert.equal(await d(), a);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:unit`. Esperado: FAIL (`QUADROS` não exportado).

- [ ] **Step 3: Implementar `js/morcego.js`**
  - O rig é o de `docs/identidade/morcegos-3.html` (funções `PONTOS` e `pose`), com os parâmetros da spec §3.1.
  - `QUADROS_D[i]` vem de `pose(i/32·2π)`, com 1 casa decimal.
  - `VIEWBOX` = `floor(xmin)−1 floor(ymin)−1 ceil(w)+2 ceil(h)+2`, sobre todos os quadros.
  - `animarDivisores`:
    - rAF a 30 quadros/s;
    - só atualiza os `<path>` de divisores visíveis (IntersectionObserver no `.div-morcego`; usa a última entrada do lote);
    - fase própria por divisor (`i·1,7`) e velocidade de 9 rad/s;
    - com `menosMovimento`, fica em `QUADROS_D[QUADRO_REPOUSO]` e não roda rAF.
  - `iniciarDivisores()` passa a criar o SVG novo e chamar `animarDivisores(ctx)`. A assinatura muda para `iniciarDivisores(ctx)`, e `main.js` passa o `ctx`.
  - CSS:
    - sai `@keyframes bater` e as regras de `.morcego__asas`;
    - `.morcego { fill: currentColor; overflow: visible }`;
    - `.morcego--div { height: .9em; width: auto }` (a silhueta nova é mais larga).

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS. Os testes do cartaz contam `svg.morcego--div`, que continua existindo.

- [ ] **Step 5: Conferência visual.** Prints do letreiro do hero e do cartaz em 1440 e 390 px: morcegos inteiros, sem corte pelo `viewBox`, na altura do texto.

- [ ] **Step 6: Commit.** `git commit -m "feat: morcego novo do morcego_ref com batida articulada"`

---

### Task 2: Céu e nuvens nas viradas

**Files:**
- Create: `js/ceu.js`, `tests/unit/ceu.test.mjs`
- Modify: `index.html` (sai `.revoada` das 3 seções; entra `<canvas class="ceu" aria-hidden="true">` antes do `<main>`), `css/base.css` (`.ceu`), `css/secoes.css` (saem as regras de `.revoada`), `js/main.js`, `tests/e2e/rodada2.test.mjs` (os 5 testes de revoada viram os do céu)
- Delete: `js/revoadas.js`

**Interfaces:**
- Consumes: `desenharMorcego`, `QUADROS` (Task 1); `criarRng` (util).
- Produces:
  - `criarNuvem(n: number, semente: number) → Morcego[]`, com os campos `du, dy, a1, f1, p1, a2, f2, p2, tam, bate, fase`, os mesmos de `BANDO` no protótipo, com `du ∈ ±0,17` e `dy ∈ ±0,21`.
  - `posicaoNuvem(m, u, t, W, H) → {x, y, giro}`.
  - `iniciarCeu(ctx) → { registrar(cena) } | null`, onde `cena = { ativa(): boolean, desenhar(g, W, H, t): number }` (devolve quantos morcegos desenhou). Devolve `null` no movimento reduzido ou estático.
  - O canvas expõe `data-desenhados` com o total do último quadro.

- [ ] **Step 1: Testes que falham**

```js
// tests/unit/ceu.test.mjs
const W = 1440, H = 900;
test('nuvem: todos fora da tela no começo e no fim da virada', () => {
  const n = criarNuvem(90, 3);
  for (const u of [0, 1]) assert.ok(n.every(m => { const p = posicaoNuvem(m, u, 0, W, H); return p.x < -20 || p.x > W + 20; }), String(u));
});
test('nuvem: no meio da virada a maioria está na tela', () => {
  const n = criarNuvem(90, 3);
  const dentro = n.filter(m => { const p = posicaoNuvem(m, 0.5, 0, W, H); return p.x > 0 && p.x < W && p.y > -50 && p.y < H + 50; });
  assert.ok(dentro.length > 70);
});
test('criarNuvem é determinística', () => assert.deepEqual(criarNuvem(10, 7), criarNuvem(10, 7)));
```

```js
// tests/e2e/rodada2.test.mjs (substituem os de revoada)
test('céu: nuvem cheia na virada para os Sets', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#sets', -450); await new Promise(r => setTimeout(r, 300));
  assert.ok(await page.$eval('.ceu', c => +c.dataset.desenhados) >= 60);
});
test('céu no celular: nuvem menor, sem rolagem lateral e DPR no máximo 2', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await rolarPara(page, '#sets', -420); await new Promise(r => setTimeout(r, 300));
  const r = await page.$eval('.ceu', c => ({ n: +c.dataset.desenhados, w: c.width, iw: innerWidth }));
  assert.ok(r.n > 0 && r.n <= 45 && r.w <= 2 * r.iw);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
test('céu vazio quando nenhuma cena está ativa (pular pelo menu até o Contrate)', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2600));
  assert.equal(await page.$eval('.ceu', c => +c.dataset.desenhados), 0);
});
test('movimento reduzido: sem céu', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('.ceu', c => getComputedStyle(c).display === 'none'));
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:unit` e `node --test tests/e2e/rodada2.test.mjs`. Esperado: FAIL.

- [ ] **Step 3: Implementar `js/ceu.js`**
  - `posicaoNuvem` segue a função `voo` do protótipo, com `x = W·(−0,45 + 1,9·u + du)` (com `du ∈ ±0,17`, todo o bando fica fora da tela em `u` 0 e 1) e `y = H·(0,62 − 0,32·(u + du) + 0,6·dy) + H·a1·sen((u + du)·π·f1 + p1) + H·a2·sen(t·f2 + p2)`. O giro é a direção do voo (diferença finita em `u`) × 0,45.
  - `iniciarCeu`:
    - canvas `position: fixed; inset: 0; z-index: 70; pointer-events: none` (o header é 85 e o menu 80);
    - DPR ≤ 2, redimensionado no `resize`;
    - um rAF só enquanto alguma cena `ativa()`; quando a última sai, limpa o canvas, põe `data-desenhados = 0` e para.
  - Cenas de nuvem para `#producoes` e `#sets`:
    - `u` vem de um ScrollTrigger (`trigger` na seção, `start: 'top bottom'`, `end: 'top top'`);
    - a cena está ativa com `0 < u < 1`;
    - cor `--vermelho`;
    - contagem `celular ? 40 : 90`.
  - CSS: `.ceu { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 70; pointer-events: none }` e `.menos-movimento .ceu { display: none }`.
  - `main.js`: `const ceu = seguro('ceu', () => iniciarCeu(ctx));` (o céu precisa estar pronto antes da assinatura).

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Conferência visual.** Prints das viradas para Produções e Sets em 1440 e 390 px: nuvem cheia, vermelha e com voo livre.

- [ ] **Step 6: Commit.** `git commit -m "feat: céu com nuvens de morcegos nas viradas"`

---

### Task 3: Assinatura com chegada de todos os lados

**Files:**
- Modify: `js/assinatura.js`, `css/secoes.css` (`.anima-assinatura .assinatura { height: 350vh }`), `js/main.js` (passa o céu), `tests/unit/assinatura.test.mjs`, `tests/e2e/final.test.mjs`

**Interfaces:**
- Consumes: `iniciarCeu(ctx).registrar` (Task 2); `desenharMorcego` (Task 1).
- Produces:
  - `criarMorcegos({ tinta, pouso, W, H, esc, semente })`, agora com `ini` fora de um dos 4 lados e `curva ∈ ±0,3`.
  - `fases(P) → { Bf, perto }`, com `Bf = lim((P − 0,42)/0,46)` e `perto = 1 + 0,6·(degrau(0,05; 0,3; P) − degrau(0,32; 0,6; P))`.
  - `estadoMorcego(m, P, t, {W, H, esc}) → {x, y, visivel, bate, giro, tam}` (`tam` já multiplicado por `perto`; o pousado parado usa `perto = 1`).
  - `iniciarAssinatura(ctx, ceu) → void`.

- [ ] **Step 1: Testes unitários que falham** (`tests/unit/assinatura.test.mjs`)

```js
test('criarMorcegos: entram pelos 4 lados, de fora da tela', () => {
  const tinta = Array.from({ length: 200 }, (_, i) => ({ x: 300 + i, y: 350 }));
  const ms = criarMorcegos({ tinta, pouso: [], W: 1200, H: 700, esc: 1, semente: 7 });
  const lado = m => m.ini.x < 0 ? 'e' : m.ini.x > 1200 ? 'd' : m.ini.y < 0 ? 'c' : m.ini.y > 700 ? 'b' : '?';
  assert.deepEqual(new Set(ms.map(lado)), new Set(['e', 'd', 'c', 'b']));
});
test('fases: Bf e perto nos limites', () => {
  assert.equal(fases(0).Bf, 0); assert.equal(fases(0.42).Bf, 0); assert.equal(fases(0.88).Bf, 1);
  assert.equal(fases(0).perto, 1); assert.ok(Math.abs(fases(0.31).perto - 1.6) < 0.01); assert.equal(fases(1).perto, 1);
});
// 'estadoMorcego: começo fora, fim na assinatura' continua (P = 0 invisível; P = 1 pousado no alvo, tinta invisível)
```

Os testes antigos de `fases` (limites 0,4/0,9) e "no meio da revoada" são trocados pelos acima. O teste "no meio da revoada todos estão na tela" passa a valer em `P = 0,3`.

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:unit`. Esperado: FAIL.

- [ ] **Step 3: Funções puras.** Portar o protótipo (`desenha3`) para as assinaturas acima, sem o véu. Contagens da Global Constraints.

- [ ] **Step 4: Testes e2e que falham** (`tests/e2e/final.test.mjs`)

Mudam os deslocamentos dos testes da assinatura: fim = `2.5 * altura` a partir do topo da seção. Exemplos:
- "no fim": `rolarPara(page, '#assinatura', 2.5 * 900)`;
- "girar": `Math.round(0.95 * 2.5 * 844)`;
- "girar a tela no fim": `2.5 * 900`.

```js
const escurosCeu = p => p.$eval('.ceu', c => { const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n / (c.width * c.height); });
test('chegada da assinatura: nuvem cheia, mas o fundo aparece nas frestas', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', -Math.round(0.125 * 900)); // P ≈ 0,25
  await new Promise(r => setTimeout(r, 400));
  const f = await escurosCeu(page);
  assert.ok(f > 0.2 && f < 0.75, String(f));
});
test('assinatura: com a Pirata One lenta, o nome aparece com a reserva depois de 3 s', async () => {
  // atrasar (não bloquear): uma fonte bloqueada falha na hora e não exercita a espera de 3 s
  const { page } = await abrir(amb, { atrasar: [{ re: /fonts\.gstatic\.com/, ms: 15000 }], esperarPronto: false });
  await page.waitForFunction(() => document.body.classList.contains('pronto'), { timeout: 14000 });
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await new Promise(r => setTimeout(r, 3600));
  assert.ok(await escuros(page) > 5000);
});
test('girar no fim da assinatura: pousados do céu continuam sobre as letras', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await page.setViewport({ width: 900, height: 1200 });
  await new Promise(r => setTimeout(r, 1500));
  const r = await page.evaluate(() => ({ d: +document.querySelector('.ceu').dataset.desenhados,
    topo: document.querySelector('.assinatura__palco').getBoundingClientRect().top }));
  assert.ok(r.d >= 30 && Math.abs(r.topo) < 2);
});
```

- [ ] **Step 5: Rodar e ver falhar.** Rodar `node --test tests/e2e/final.test.mjs`. Esperado: FAIL.

- [ ] **Step 6: Implementar o DOM**

**Progresso**
- `P` vem de um ScrollTrigger com `trigger: '#assinatura'`, `start: 'top bottom'`, `end: 'bottom bottom'`.

**Palco**
- Desenha só a tinta.
- Recompõe a tinta apenas quando `Bf` muda.
- Com `Bf` em 0 ou ≥ 0,999 e já desenhado, não refaz nada.
- `willReadFrequently` só na amostra.

**Cena no céu**
- Ativa com `0 < P` e enquanto o palco estiver na tela.
- Desenha cada morcego em `(x, y + topoPalco)` (`getBoundingClientRect().top`) quando `a > 0` (voando para o alvo ou parado nele). Durante a chegada, a posição é de tela.

**Ciclo de vida**
- IntersectionObserver com a última entrada do lote.
- Fonte: espera `document.fonts.load` ou 3 s (`Promise.race`). Desenha com a reserva e refaz no `loadingdone`, como na rodada 2.

**Reduzido ou estático**
- O palco desenha a tinta completa e os pousados no próprio canvas (`desenharMorcego`, quadro `QUADRO_REPOUSO`).

- [ ] **Step 7: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS, inclusive os testes de âncora e de rotação da rodada 2.

- [ ] **Step 8: Conferência visual.** Prints em `P` 0,1, 0,25, 0,45, 0,7 e 1, em 1440 e 390 px, comparados com o protótipo:
  - chegada pelos 4 lados;
  - nuvem com frestas;
  - nome formado;
  - pousados nas bordas.

- [ ] **Step 9: Commit.** `git commit -m "feat: assinatura com morcegos chegando de todos os lados"`

---

### Task 4: Janela do hero com o reel novo, tocando desde o início

**Files:**
- Create: `tools/baixar-reels.sh`
- Modify: `index.html` (sai `.hero__etiqueta`; o vídeo da janela ganha `poster` novo e fica sem `data-src`), `css/secoes.css` (sai `.hero__etiqueta`), `js/animacoes.js` (`iniciarHero`), `js/util.js`, `tests/unit/util.test.mjs`, `tests/unit/assets.test.mjs`, `tests/e2e/hero.test.mjs`
- Create (assets): `assets/video/janela-720.{mp4,jpg}` (trocados), `assets/video/janela-540.mp4`, `assets/video/sets/reel-{a,b,c}.{mp4,jpg}`

**Interfaces:**
- Produces:
  - `escolherJanela(largura: number) → string`: `'assets/video/janela-720.mp4'` se `largura > 820`, senão `'assets/video/janela-540.mp4'`.
  - Os clipes `sets/reel-a|b|c`, consumidos na Task 6.

- [ ] **Step 1: Testes que falham**

```js
// util.test.mjs
test('escolherJanela', () => {
  assert.equal(escolherJanela(1440), 'assets/video/janela-720.mp4');
  assert.equal(escolherJanela(820), 'assets/video/janela-540.mp4');
});
// assets.test.mjs ("janela do hero" e "clipes dos sets" mudam)
assert.ok(tam('assets/video/janela-720.mp4') <= 1_800_000); assert.ok(tam('assets/video/janela-540.mp4') <= 1_200_000);
for (const n of ['reel-a', 'reel-b', 'reel-c']) { assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 450_000, n); assert.ok(tam(`assets/video/sets/${n}.jpg`) > 0, n); }
```

```js
// hero.test.mjs
test('card do hero toca antes do scroll', async () => {
  const { page } = await abrir(amb);
  const t = () => page.$eval('.hero__janela video', v => v.currentTime);
  const a = await t(); await new Promise(r => setTimeout(r, 900));
  assert.ok(await t() > a);
  assert.ok(await page.$eval('.hero__janela video', v => v.currentSrc.endsWith('janela-720.mp4')));
  assert.equal(await page.$('.hero__etiqueta'), null);
});
test('celular usa a janela de 540', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  assert.ok(await page.$eval('.hero__janela video', v => v.currentSrc.endsWith('janela-540.mp4')));
});
test('autoplay recusado: pôster fica e nenhum erro', async () => {
  const { page, erros } = await abrir(amb, { antes: p => p.evaluateOnNewDocument(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('bloqueado', 'NotAllowedError')); }) });
  assert.ok(await page.$eval('.hero__janela video', v => v.poster.endsWith('janela-720.jpg')));
  assert.deepEqual(erros, []);
});
test('movimento reduzido: card parado no pôster', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('.hero__janela video', v => v.paused));
});
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL.

- [ ] **Step 3: Baixar e escolher os trechos** (`tools/baixar-reels.sh`, no mesmo molde de `baixar-sets.sh`)
  - `PY` e `--js-runtimes node`.
  - `-f "bv*[ext=mp4]/b[ext=mp4]"`, sem áudio, saída em `bruto/reels/%(id)s.%(ext)s`.
  - Folhas de quadros com `fps=1/2`, porque os reels são curtos.
  - Tabela `nome id início duração largura crf`:
    - `janela-720 DW9lHDGkSo6 … 9 720 30`
    - `janela-540 DW9lHDGkSo6 … 9 540 31`
    - `reel-a`, `reel-b`, `reel-c` com 4 s em 720 px.
  - Pôsteres em `início + 0,6`.
  - `-nostdin` e `< /dev/null` em todos os comandos.
  - Escolha pela folha: movimento e gente, longe de textos e legendas sobrepostos.
  - A distribuição dos 3 reels entre os sets 6, 7 e 8 é decidida pelas folhas e registrada como ruling.

- [ ] **Step 4: Implementar o hero**
  - Na montagem (fora do modo reduzido): `video.src = escolherJanela(innerWidth)` e `video.play().catch(() => {})`.
  - Sai o atributo `data-auto` desse vídeo, para o observador não pausar.
  - Saem a etiqueta, o CSS dela e o `.to('.hero__etiqueta', …)`.
  - Sem JS ou no modo reduzido, fica o pôster.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 6: Commit.** `git commit -m "feat: janela do hero com reel novo tocando desde o início"`

---

### Task 5: Produções com fotos novas, foco por card e sem Sinistro DNB

**Files:**
- Modify: `tools/tratar-fotos.py`, `tools/baixar-sets.sh` (sai `BOILER_QUADRO`), `index.html` (card, letreiro, abertura, meta), `css/secoes.css`, `js/animacoes.js` (`iniciarProducoes`), `tests/e2e/producoes.test.mjs`, `tests/e2e/rodada2.test.mjs`, `tests/unit/assets.test.mjs`
- Create: `assets/img/producao-{savage,boiler,sonora}.webp`
- Delete: imagens de `assets/img` que deixarem de ser usadas (`boiler-quadro.webp` e as `foto-*` só das Produções)

**Interfaces:**
- Produces: `.producao__fundo` com `style="background-image: url(assets/img/producao-X.webp); --foco: …"`.

- [ ] **Step 1: Testes que falham**

```js
// producoes.test.mjs: '4 produções…' vira 3; 'fotos de fundo' espera producao-savage/boiler/sonora.webp
test('3 produções na ordem, com os papéis', async () => { /* nomes: Savage, Boiler Baile, Sonora Breck */ });
// rodada2.test.mjs
test('Sinistro DNB só na biografia; o número de festas continua 4', async () => {
  const { page } = await abrir(amb);
  const tem = s => page.$eval(s, e => e.textContent.includes('Sinistro'));
  assert.equal(await tem('#hero .letreiro'), false); assert.equal(await tem('#producoes'), false);
  assert.equal(await tem('#carreira'), true);
  assert.ok(!(await page.$eval('meta[name=description]', m => m.content)).includes('Sinistro'));
  assert.ok(await page.$$eval('[data-contar]', l => l.some(e => e.dataset.contar === '4' && e.parentElement.textContent.includes('festas criadas'))));
});
test('Produções em tela de toque larga acendem no centro da tela', async () => {
  const { page } = await abrir(amb, { largura: 1180, altura: 820, antes: p => p.evaluateOnNewDocument(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = q => (q.includes('hover: none') ? mm('(min-width: 0px)') : mm(q)); }) });
  await page.evaluate(() => { const l = document.querySelectorAll('.producao')[1], r = l.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); });
  await new Promise(r => setTimeout(r, 700));
  assert.ok(await page.$$eval('.producao', l => l[1].classList.contains('producao--acesa')));
});
test('movimento reduzido: foto das Produções sem zoom', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('.producao__fundo', e => getComputedStyle(e).transform), 'none');
});
// assets.test.mjs
test('fotos das produções ≤ 300 KB', () => { for (const n of ['savage', 'boiler', 'sonora']) assert.ok(tam(`assets/img/producao-${n}.webp`) <= 300_000, n); });
test('sem imagens órfãs em assets/img', () => {
  const usado = ['index.html', 'css/base.css', 'css/secoes.css', ...readdirSync(join(RAIZ, 'js')).map(f => `js/${f}`)]
    .map(f => readFileSync(join(RAIZ, f), 'utf8')).join('\n');
  assert.deepEqual(readdirSync(join(RAIZ, 'assets/img')).filter(f => !usado.includes(f)), []);
});
```

O teste de órfãs vai ler a lista de `assets/img` e considerar usados os nomes citados em HTML, CSS ou JS. Se algum arquivo for usado só por montagem de nome, adicionar o nome exato a uma lista de exceções, com ruling.

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL.

- [ ] **Step 3: Implementar**
  - **`tratar-fotos.py`:**
    - `producao-savage` de `Savage.jpg`, `producao-boiler` de `boiler.jpg` e `producao-sonora` de `Sonora.jpg`;
    - lado maior de 1400 px, WebP q78;
    - se passar de 300 KB, q70.
  - **HTML:**
    - sai o `<li>` da Sinistro;
    - fundos novos com `--foco` inicial da spec §5;
    - o letreiro do hero perde "Sinistro DNB" nos dois `<span>` (com o divisor ao lado);
    - abertura das Produções: "…festas como Savage, Boiler Baile e Sonora Breck.";
    - meta: "…Savage, Boiler Baile e Sonora Breck.".
  - **CSS:**
    - `.producao__fundo { background-position: var(--foco, center 30%) }`;
    - `.menos-movimento .producao__fundo { transform: none; transition: opacity .5s, filter .5s }`.
  - **JS:** o `gsap.matchMedia` das Produções passa a usar `(hover: none), (max-width: 820px)`.
  - **Limpeza:** sai `BOILER_QUADRO` e o bloco que gera o `boiler-quadro` em `baixar-sets.sh`; somem as imagens órfãs.

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 5: Ajuste do foco.** Prints das 3 faixas acesas em 1440 e 390 px. Ajustar `--foco` até rosto e olhos aparecerem (Savage sem o letreiro "Brunin TKs" no centro da faixa) e registrar os valores finais.

- [ ] **Step 6: Commit.** `git commit -m "feat: Produções com fotos novas e foco por card; Sinistro DNB sai das produções"`

---

### Task 6: Sets em ordem nova, Sensi novo, reels e SoundCloud

**Files:**
- Create: `js/soundcloud.js`, `tests/unit/soundcloud.test.mjs`
- Modify: `index.html` (ordem, vídeos e botões dos sets 6–8), `css/secoes.css` (`.set__ouvir`, `.set__player`), `js/main.js`, `tools/baixar-sets.sh` (início do Sensi), `tools/cortar-video.sh` (saem `sets/pista|cabine|maos`), `tests/e2e/sets.test.mjs`, `tests/unit/assets.test.mjs`
- Delete: `assets/video/sets/{maos,pista,cabine}.{mp4,jpg}`

**Interfaces:**
- Consumes: `sets/reel-a|b|c` (Task 4).
- Produces:
  - `urlPlayer(faixa: string) → string`.
  - `iniciarSoundcloud(ctx) → void`, que revela `.set__ouvir` e troca o botão pelo iframe no clique.

- [ ] **Step 1: Testes que falham**

```js
// soundcloud.test.mjs
test('urlPlayer', () => {
  const u = new URL(urlPlayer('https://soundcloud.com/trinkabr/tkm11-brunin-tks'));
  assert.equal(u.origin + u.pathname, 'https://w.soundcloud.com/player/');
  assert.equal(u.searchParams.get('url'), 'https://soundcloud.com/trinkabr/tkm11-brunin-tks');
  assert.equal(u.searchParams.get('color'), '#e8392f'); assert.equal(u.searchParams.get('auto_play'), 'true');
  assert.equal(u.searchParams.get('visual'), 'false');
});
```

```js
// sets.test.mjs: SETS nova ordem (… Live Sensi, Modelo Brasileño, Rewind BR, Trinka) e data-src
// ['senso','grau','ataque','veneno-lab','sensi','reel-a','reel-b','reel-c']
test('Ouvir aqui: só nos sets do SoundCloud, escondido sem JS', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set', l => l.map(s => !!s.querySelector('.set__ouvir:not([hidden])'))),
    [false, false, false, false, false, false, true, true]);
  const semJs = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.ok(await semJs.page.$$eval('.set__ouvir', l => l.every(b => b.hidden)));
});
test('clicar em Ouvir aqui troca o botão pelo player do SoundCloud', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/soundcloud\.com/] });
  await page.$eval('.set:nth-child(8) .set__ouvir', b => b.click());
  const f = await page.$eval('.set:nth-child(8) iframe.set__player', i => ({ src: i.src, title: i.title }));
  assert.ok(f.src.startsWith('https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Ftrinkabr'));
  assert.match(f.title, /SoundCloud.*Trinka/);
  assert.equal(await page.$$eval('.set:nth-child(8) iframe', l => l.length), 1);
  assert.ok(await page.$eval('.set:nth-child(8) .set__link', a => a.href.includes('soundcloud.com/trinkabr')));
  assert.deepEqual(erros, []);
});
// "clipe que não carrega não quebra a pilha" → "clipe com requisição abortada não quebra a pilha"
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL.

- [ ] **Step 3: Trecho novo do Sensi**
  - Gerar a folha de `IP9V-06-QJw` com `fps=1/15`, porque o vídeo já está em `bruto/sets/`.
  - Escolher 4 s com pista ou público animados e trocar o início na tabela `TRECHOS`.
  - Rodar `bash tools/baixar-sets.sh cortar`, que refaz também os outros 4 sets, iguais.
  - Registrar o instante como ruling.

- [ ] **Step 4: Implementar**
  - **HTML:**
    - sets 6–8 reordenados (Modelo Brasileño, Rewind BR, Trinka), com vídeos `sets/reel-a|b|c`;
    - nos sets 7 e 8, `<button class="set__ouvir" type="button" hidden data-faixa="…" aria-label="Ouvir <set> aqui">▶ Ouvir aqui</button>` antes do link.
  - **`iniciarSoundcloud`** (roda também no modo reduzido e no estático):
    - revela os botões;
    - no clique, cria o iframe (`width 100%`, `height 166`, `allow="autoplay"`, `title "Player do SoundCloud: <set>"`) e substitui o botão;
    - na primeira vez, injeta `<script src="https://w.soundcloud.com/player/api.js">`;
    - no `onload` do script, liga `SC.Widget(iframe).bind(SC.Widget.Events.PLAY, …)` para pausar os outros;
    - `onerror` do script: nada (o player ainda toca sozinho).
  - **CSS:** `.set__ouvir` é um botão creme com borda preta, como os chips; `.set__player` tem `max-width: 520px`.
  - **Limpeza:** saem os clipes antigos do reel em `sets/` e suas linhas no `cortar-video.sh`.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 6: Conferência manual.** Com rede, abrir o site, dar play no Trinka e depois no Rewind BR: o primeiro pausa.

- [ ] **Step 7: Commit.** `git commit -m "feat: sets com ordem nova, Sensi novo, reels e player do SoundCloud"`

---

### Task 7: Varredura final

**Files:**
- Modify: `docs/identidade/revisao-2.html` (mídias que existem), `tests/e2e/responsivo.test.mjs` (prints da chegada da assinatura e das viradas), `README.md` (nova ferramenta `baixar-reels.sh` e o céu)

- [ ] **Step 1:** Repontar no `revisao-2.html` as mídias removidas para `assets/video/janela-720.mp4` e `assets/video/sets/*`. Verificar: nenhuma URL relativa do arquivo aponta para arquivo inexistente (script de uma linha com `grep -o` + `test -f`).

- [ ] **Step 2:** Lista de prints do `responsivo.test.mjs`:
  - as seções;
  - `hero-0.4`;
  - `virada-sets`;
  - `assinatura-0.25` (chegada);
  - `assinatura-0.7`;
  - `assinatura` (fim).

- [ ] **Step 3:** Rodar `npm test`. Esperado: 0 falhas.

- [ ] **Step 4: Revisão visual dos prints**
  - morcegos novos em todos os lugares;
  - nuvens cheias;
  - chegada com frestas;
  - fotos com rosto na faixa;
  - players nos sets 7 e 8;
  - nada cortado em 390 px.

- [ ] **Step 5: Commit.** `git commit -m "test: varredura final da rodada 3"`
