# Press kit Rodada 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The plan has three parts:
- the hero card shows the whole video, which grows with the card (trecho 0–10 s);
- the viradas get a continuous band of bats with a thin black outline;
- the footer credits the site.

**Architecture:**
- **Hero:** the window keeps today's clip-path, while the video inside moves between two 9:16 rectangles using only `transform` (`fimDaJanela` in `js/util.js` gives the final one).
- **Band:** a pure function replaces the cloud in `js/ceu.js`.
- **Outline:** it is one optional parameter of `desenharMorcego`, used by the sky and the Assinatura.

**Tech Stack:** static HTML/CSS/ES modules, GSAP 3.12.5 + ScrollTrigger, canvas 2D, `node --test`, puppeteer-core e2e (`tests/e2e/ajuda.mjs`), ffmpeg/yt-dlp tools.

**Spec:** `docs/superpowers/specs/2026-11-13-presskit-rodada-4-design.md`

## Global Constraints

- Everything not changed keeps working:
  - static mode (no GSAP);
  - reduced motion;
  - no-JS;
  - anchor on resize;
  - accessibility.
- **Janela:** reel `DW9lHDGkSo6`, 0 s, 10 s. Size budgets: `janela-720` ≤ 1.8 MB, `janela-540` ≤ 1.2 MB.
- **Final video rect:** `h = H`, `w = H·9/16`. If `w ≤ W`, `l = W − w`; otherwise `l = (W − w)/2`. `t = 0`.
- **Video tween:** timeline position 0.12, duration 0.58, ease `power2.inOut`, transform-only, `--borda` 0% → 14%. Janela background in animated mode `#000`.
- **Band:**
  - `L = 1.6·W`, `M = 140`, `B = min(W, H)`;
  - ease `e = u + 0.4·sin(2πu)/(2π)`;
  - centre `0.48·H + 0.07·B·sin(x/W·1.6π + fase)`;
  - thickness `dy·0.11·B`;
  - giro ×0.45;
  - 170 bats desktop / 90 celular (`CELULAR`);
  - fases 0.6 (Produções) and 2.7 (Sets).
- **Outline:** 1 screen px, `--preto`, `lineJoin = 'round'`. Applies only to the canvas bats; the SVG dividers are unchanged.
- **Footer:** `© 2026 Brunin Tks · Site por M. Wesley`, no link. The Carreira photo alt keeps "Foto @clicksbylt".
- **Python and ffmpeg on this machine:**
  - `PY=/c/Users/migno/AppData/Local/Programs/Python/Python310/python.exe`;
  - run `ffmpeg -nostdin`;
  - do not use `drawtext`.

## Review Focus

1. **Resize or rotation in the middle or at the end of the hero pin.** The video must recompute both the card rect and the final rect: right-flush on wide screens, centred when it is wider than the screen. Test: Task 2, "girar no fim do pin".
2. **Autoplay refused or metadata late.** The video box comes from CSS (`aspect-ratio`), so the poster still fills the card exactly. Test: Task 2 adds a box assertion to "autoplay recusado no card".
3. **Safari.** The mask needs `-webkit-mask-image`, and GSAP tweens the custom property `--borda` on a `<video>`. Chrome tests cannot exercise this; the reviewer checks the CSS and the tween by reading them.
4. **Landscape phone (844×390, wider than `CELULAR`).** The band must still start and end off-screen and cover the width at the peak, with `B = min(W, H)` keeping it thin. Test: Task 3, unit test at 844×390.
5. **Outline in the static and reduced end state, and at DPR 2 with all bats settled.** The bats perched on the red letters must show the outline. Test: Task 4, e2e on the reduced-motion stage.

---

### Task 1: Janela with the 0–10 s trecho

**Files:**
- Modify: `tools/baixar-reels.sh` (TRECHOS janela lines and comment)
- Regenerate: `assets/video/janela-720.mp4`, `assets/video/janela-540.mp4`, `assets/video/janela-720.jpg`
- Test: `tests/e2e/hero.test.mjs`

**Interfaces:** Consumes nothing. Produces the same file names as before, with new content.

- [ ] **Step 1: Write the failing test** (in `tests/e2e/hero.test.mjs`)

```js
test('janela: trecho de 10 s do começo do reel', async () => {
  const { page } = await abrir(amb);
  await page.waitForFunction(() => document.querySelector('.hero__janela video').readyState >= 1);
  const d = await page.$eval('.hero__janela video', v => v.duration);
  assert.ok(Math.abs(d - 10) < 0.3, String(d));
});
```

- [ ] **Step 2: Run it.** `node --test --test-name-pattern="trecho de 10 s" tests/e2e/hero.test.mjs`. Expected: FAIL with `9.04…`.
- [ ] **Step 3: Edit TRECHOS.** Change the two lines to `janela-720 DW9lHDGkSo6 0 10 720 30` and `janela-540 DW9lHDGkSo6 0 10 540 31`. The comment above them says: the first 10 s, DJ lit on a dark stage, shown whole in the card.
- [ ] **Step 4: Cut.** Run `PY=… bash tools/baixar-reels.sh cortar`, then `git status --short assets/`. Expected: only the 3 janela files changed; x264 is deterministic, so the reel-a/b/c files are not changed. Look at `janela-720.jpg`: the DJ must be visible.
- [ ] **Step 5: Run the tests.** `node --test --test-name-pattern="trecho de 10 s|janela" tests/e2e/hero.test.mjs` and `node --test tests/unit/assets.test.mjs`. Expected: PASS (budgets hold).
- [ ] **Step 6: Commit.** `feat: janela do hero com os 10 s iniciais do reel`

### Task 2: Whole video growing with the card

**Files:**
- Modify: `js/util.js` (add `fimDaJanela`)
- Modify: `css/secoes.css` (animated-mode janela and video rules)
- Modify: `js/animacoes.js` (`iniciarHero`: `caixa()` also returns `w`/`h`; video tween)
- Test: `tests/unit/util.test.mjs`, `tests/e2e/hero.test.mjs`

**Interfaces:**
- Produces `fimDaJanela(W: number, H: number) → { l, t, w, h }` (px, relative to the palco).

- [ ] **Step 1: Write the failing unit test**

```js
test('fimDaJanela: altura da tela, à direita quando cabe, centralizado quando não', () => {
  assert.deepEqual(fimDaJanela(1440, 900), { l: 933.75, t: 0, w: 506.25, h: 900 });
  assert.deepEqual(fimDaJanela(390, 844), { l: -42.375, t: 0, w: 474.75, h: 844 });
  assert.deepEqual(fimDaJanela(450, 800), { l: 0, t: 0, w: 450, h: 800 }); // limite w = W
});
```

- [ ] **Step 2: Run it.** `node --test tests/unit/util.test.mjs`. Expected: FAIL (`fimDaJanela` is not exported).
- [ ] **Step 3: Implement `fimDaJanela` in `js/util.js`.**
- [ ] **Step 4: Run it.** `node --test tests/unit/util.test.mjs`. Expected: PASS.
- [ ] **Step 5: Write the failing e2e tests** (in `tests/e2e/hero.test.mjs`). They use this helper:

  ```js
  const videoJanela = p => p.$eval('.hero__janela video', v => {
    const m = new DOMMatrix(getComputedStyle(v).transform), r = v.getBoundingClientRect();
    return { escala: Math.hypot(m.a, m.b), w: v.offsetWidth, h: v.offsetHeight,
      cx: r.left + r.width / 2, cy: r.top + r.height / 2, direita: r.right, altura: r.height,
      borda: getComputedStyle(v).getPropertyValue('--borda').trim() };
  });
  ```

  The tests:
  - `topo: o card mostra o vídeo inteiro`:
    - at scroll 0, `escala * w` is within 1 px of the `.hero__card-ref` width;
    - the video centre is within 2 px of the card-ref centre;
    - `borda` is `0%`.
  - `fim do pin: vídeo inteiro com a altura da tela, encostado à direita`:
    - at 1440×900 after `rolarPara(page, '#hero', 2.5*900 - 900)`;
    - `altura` is 900 ±1, `direita` is 1440 ±1, `w` is 506.25 ±1, `borda` is `14%`.
  - `celular, fim do pin: vídeo centralizado com a altura da tela`:
    - at 390×844, `altura` is 844 ±1 and `cx` is 195 ±1.
  - `girar no fim do pin: o vídeo recalcula` (Review Focus 1):
    - at 1440×900 at the end of the pin, `setViewport(900, 1200)` and wait 1500 ms;
    - then `altura` is 1200 ±1 and `direita` is 900 ±1.
  - Extend the existing `autoplay recusado no card` test (Review Focus 2): also assert that `escala * w` matches the card width ±1.
- [ ] **Step 6: Run them.** `node --test tests/e2e/hero.test.mjs`. Expected: the new tests FAIL; today the video fills the stage, so `w = 1440`.
- [ ] **Step 7: CSS.**
  - In `.anima-hero .hero__janela`, add `background: #000`.
  - New rule `.anima-hero .hero__janela video`:
    - `position: absolute; left: 0; top: 0; height: 100%; width: auto; aspect-ratio: 9 / 16; max-width: none; transform-origin: 0 0; will-change: transform; --borda: 0%`;
    - `-webkit-mask-image` and `mask-image` set to `linear-gradient(90deg, transparent, #000 var(--borda), #000 calc(100% - var(--borda)), transparent)`.
- [ ] **Step 8: JS.**
  - In `iniciarHero`, `caixa()` also returns `w` and `h` of the card-ref.
  - Add to the timeline, at 0.12:
    - a `fromTo('.hero__janela video', …)` with function-based values: from `{ x: C.l, y: C.t, scale: C.w / F.w, '--borda': '0%' }` to `{ x: F.l, y: F.t, scale: 1, '--borda': '14%', duration: 0.58, ease: 'power2.inOut' }`;
    - `F = fimDaJanela(palco.clientWidth, palco.clientHeight)`.
- [ ] **Step 9: Run the tests.** `node --test tests/e2e/hero.test.mjs tests/e2e/rodada2.test.mjs`. Expected: all PASS.
- [ ] **Step 10: Commit.** `feat: card do hero mostra o vídeo inteiro e cresce com ele`

### Task 3: Continuous band in the viradas

**Files:**
- Modify: `js/ceu.js` (replace `criarNuvem`/`posicaoNuvem` with `criarFaixa`/`posicaoFaixa`; counts; fases)
- Test: `tests/unit/ceu.test.mjs` (rewrite), `tests/e2e/rodada2.test.mjs`

**Interfaces:**
- Produces `criarFaixa(n, semente) → Array<{q, dy, j, a2, f2, p2, tam, bate, fase}>`.
- Produces `posicaoFaixa(m, u, t, W, H, fase = 0.6) → {x, y, giro}`.
- Consumes `criarRng` from `js/util.js`.

- [ ] **Step 1: Rewrite `tests/unit/ceu.test.mjs`.** It covers four sizes, `[[1440,900,170],[390,844,90],[1920,1080,170],[844,390,170]]`, with semente 101:
  - **`faixa: todos fora da tela no começo e no fim`:** for u 0 and 1, every bat has `x < −60 || x > W + 60`.
  - **`faixa: no pico cobre a largura inteira`:** for u 0.45, 0.5 and 0.55, take the sorted x of the bats with `0 ≤ x ≤ W`. The largest gap, including from 0 to the first bat and from the last bat to W, is < 60 px (desktop sizes) or < 40 px (390 wide).
  - **`faixa: no meio da altura`:** at u 0.5, every y is in `[0.25H, 0.75H]`.
  - **`criarFaixa é determinística`.**
- [ ] **Step 2: Run them.** `node --test tests/unit/ceu.test.mjs`. Expected: FAIL (`criarFaixa` is not exported).
- [ ] **Step 3: Implement.** Write `criarFaixa`/`posicaoFaixa` exactly per spec §4. Delete `criarNuvem`/`posicaoNuvem`.
- [ ] **Step 4: Run them.** `node --test tests/unit/ceu.test.mjs`. Expected: PASS.
- [ ] **Step 5: Update the e2e tests** (`tests/e2e/rodada2.test.mjs`):
  - `céu: faixa cheia na virada para os Sets` requires `desenhados ≥ 100`;
  - the phone test bound becomes `r.n > 0 && r.n <= 95`;
  - rename the tests from "nuvem" to "faixa".
- [ ] **Step 6: Run them.** `node --test --test-name-pattern="faixa" tests/e2e/rodada2.test.mjs`. Expected: FAIL; the desktop test sees about 90.
- [ ] **Step 7: Wire it in `iniciarCeu`.** Use `criarFaixa(celular ? 90 : 170, 101 + i * 17)`, and `posicaoFaixa(m, u, t, W, H, i ? 2.7 : 0.6)`.
- [ ] **Step 8: Run the tests.** `node --test tests/unit tests/e2e/rodada2.test.mjs`. Expected: PASS.
- [ ] **Step 9: Commit.** `feat: faixa contínua de morcegos nas viradas`

### Task 4: Thin black outline

**Files:**
- Modify: `js/morcego.js` (`desenharMorcego` with `contorno`)
- Modify: `js/ceu.js` (strokeStyle/lineJoin, contorno 1)
- Modify: `js/assinatura.js` (the sky scene and `desenharFinal`)
- Test: `tests/unit/morcego.test.mjs`, `tests/e2e/final.test.mjs`

**Interfaces:** Produces `desenharMorcego(g, x, y, tam, fase, giro = 0, espelho = 1, contorno = 0)`. When `contorno > 0`, it does `g.lineWidth = contorno / tam; g.stroke(path)` after the fill.

- [ ] **Step 1: Write the failing unit test.**
  - Set `globalThis.Path2D = class { constructor(d) { this.d = d; } }` before the dynamic import of `js/morcego.js` in that test file. The cache is lazy, so define it before the first draw.
  - Use a fake context that records `fill`, `stroke` and `lineWidth`.
  - Test `desenharMorcego: contorno só quando pedido, com espessura em px de tela`:
    - with no `contorno`, there are 0 stroke calls;
    - with `contorno = 1` and `tam = 2`, there is 1 stroke, and `lineWidth` is 0.5.
- [ ] **Step 2: Run it.** `node --test tests/unit/morcego.test.mjs`. Expected: FAIL (0 strokes).
- [ ] **Step 3: Implement it in `js/morcego.js`.**
- [ ] **Step 4: Run it.** `node --test tests/unit/morcego.test.mjs`. Expected: PASS.
- [ ] **Step 5: Write the failing e2e tests** (`tests/e2e/final.test.mjs`). Helper `pretos(page, sel)`: the number of pixels in the canvas with alpha > 200 and r, g, b < 60.
  - `contorno: morcegos da virada com linha preta`: `rolarPara(page, '#sets', -450)`, wait 300 ms, then `pretos('.ceu') > 500`.
  - `contorno: pousados do estado final (movimento reduzido)`: `abrir(amb, { menosMovimento: true })`, scroll to `#assinatura`, wait 500 ms, then `pretos('.assinatura__tela') > 100` (Review Focus 5).
- [ ] **Step 6: Run them.** `node --test --test-name-pattern="contorno" tests/e2e/final.test.mjs`. Expected: FAIL (0 dark pixels).
- [ ] **Step 7: Wire the outline.**
  - In `ceu.js`, the band scene sets `g.strokeStyle = preto` and `g.lineJoin = 'round'`, and calls with `contorno = 1`. `preto` comes from `--preto`, with fallback `#0F1211`.
  - In `assinatura.js`, the sky scene's `desenhar` and `desenharFinal` do the same; the perched bats pass `giro 0`, `espelho 1`, `contorno 1`.
- [ ] **Step 8: Run the tests.** `node --test tests/unit tests/e2e/final.test.mjs tests/e2e/rodada2.test.mjs`. Expected: PASS. The "frestas" test must still be in (0.2, 0.75); if the outline moves it out, rule on it.
- [ ] **Step 9: Measure performance.** This is a manual script, not part of the suite:
  - at 1440×900, with `page.emulateCPUThrottling(4)`, scroll to the Assinatura chegada (`rolarPara('#assinatura', −112)`);
  - wrap the sky's draw via `performance.now` around one `requestAnimationFrame` loop for 3 s, and record the mean frame time with `contorno` 1 and 0 (toggle through a temporary `window.__semContorno` flag, removed after);
  - if the outline adds more than 50%, implement cached outlined frames (bitmaps) and re-measure.
  - Ledger the numbers as a `Ruling:`.
- [ ] **Step 10: Commit.** `feat: contorno preto fino nos morcegos do céu e da assinatura`

### Task 5: Footer, docs and sweep

**Files:**
- Modify: `index.html` (footer)
- Modify: `README.md`
- Modify: `js/ancora.js` (comment "300vh" → "350vh")
- Add: `docs/identidade/rodada-4.html` (already in the tree, committed with the spec)
- Test: `tests/unit/assets.test.mjs` (or a new `tests/unit/conteudo.test.mjs`), `tests/e2e/responsivo.test.mjs`

**Interfaces:** none.

- [ ] **Step 1: Write the failing unit test `rodapé credita o site e a foto mantém o crédito no alt`.** It reads `index.html`:
  - the footer `<p class="rotulo">` text is `© 2026 Brunin Tks · Site por M. Wesley`;
  - the file has no `Fotos @clicksbylt`;
  - the `foto-22-tks.webp` img alt contains `Foto @clicksbylt`.
- [ ] **Step 2: Run it.** `node --test tests/unit/conteudo.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Edit the footer in `index.html`.**
- [ ] **Step 4: Run it.** `node --test tests/unit`. Expected: PASS.
- [ ] **Step 5: Update the README.** In "Como os morcegos funcionam", cover the band, the outline, and the card with the whole video. Fix the `ancora.js` comment, and the "nuvem" wording in the `responsivo` comment.
- [ ] **Step 6: Run the full suite.** `node --test tests/unit` and `node --test tests/e2e` (the latter redirected to a file in the workspace; read its tail). Expected: all PASS. Look at the `responsivo` prints of the hero mid-pin, the virada and the assinatura.
- [ ] **Step 7: Commit.** `docs: créditos do site, README e varredura da rodada 4`
