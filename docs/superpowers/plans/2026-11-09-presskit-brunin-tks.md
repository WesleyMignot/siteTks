# Press kit Brunin Tks — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site de press kit de uma página, estático, para o Brunin Tks. Identidade "Híbrido" (pista + pôster), reel no hero e nos sets e uma galeria infinita em 3D.

**Architecture:** HTML semântico com todo o conteúdo no markup. Dois CSS (base e seções) e ES modules nativos, sem build. `js/main.js` monta um `ctx` (gsap, ScrollTrigger, lenis, flags) e chama um iniciador por seção. Lógica pura (hora, escolha de vídeo, contagem, matemática da galeria) fica em funções exportadas com teste unitário em `node --test`. O comportamento no navegador é testado com puppeteer-core contra o Chrome instalado.

**Tech Stack:** HTML/CSS/JS; GSAP 3.12.5 + ScrollTrigger (cdnjs); Lenis 1.1.13 (jsDelivr); Google Fonts (Fraunces, Archivo, Grenze Gotisch); Node 22 (`node --test`) + puppeteer-core 25.16.0; Python 3.10 + Pillow 12.3.0 + PyMuPDF 1.28.2 e ffmpeg para os assets.

**Spec:** `docs/superpowers/specs/2026-11-09-presskit-brunin-tks-design.md`. O mock aprovado da direção C está em `docs/identidade/direcoes.html`.

## Global Constraints

- `<html lang="pt-BR">`. Todo o texto visível vem do **Apêndice A**, sem inventar copy.
- Tokens em `:root`: `--preto:#0F1211; --creme:#F1E2C4; --vermelho:#E3302F; --brasa:#E2512B; --sangue:#5E1D19`.
- `--vermelho` aparece só em blocos chapados (letreiros, cortinas, Contrate, cortina do preloader). `--brasa` só como luz (gradientes radiais, glow).
- Texto menor que 19 px bold ou 24 px regular nunca fica sobre `--vermelho` nem `--brasa`. Botões: fundo creme, texto preto; no hover, fundo vermelho.
- Fontes: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Fraunces:ital,opsz,wght,SOFT@1,9..144,900,100&family=Grenze+Gotisch:wght@400..900&display=swap`.
  - Títulos: `Fraunces` itálico 900 com `font-variation-settings:"SOFT" 100`.
  - Texto: `Archivo` com `font-stretch:125%`, em caixa-alta.
  - Acento: `Grenze Gotisch`.
- Scripts (com `defer`, nesta ordem, antes do módulo):
  - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js`
  - `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js`
  - CSS `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.css`
- Breakpoint de celular: `(max-width: 820px)`, usado no CSS e em `ctx.celular`.
- Vídeos sempre com `muted playsinline loop aria-hidden="true"` e `poster`. Toda chamada `play()` passa por `tocar()` (Task 4), que engole a rejeição.
- Links externos com `target="_blank" rel="noopener"`.
- Contatos exatos:
  - `mailto:contato.bruninn@gmail.com`
  - `https://wa.me/5551980407711` (texto "51 98040-7711 · Wesley")
  - `https://www.instagram.com/djbrunintks`
  - `https://drive.google.com/drive/folders/1ggulWuIW_njZD_iznFLcxt8tv8GtZnso`
  - `assets/presskit.pdf`
- `prefers-reduced-motion: reduce`:
  - Adiciona a classe `menos-movimento` ao `<html>`, sem Lenis, sem scrub e sem túnel 3D.
  - Vídeos ficam só no pôster e os letreiros param.
- Contratos de teste:
  - `body.pronto` existe quando a página está utilizável.
  - `html[data-lenis="on"|"off"]` indica se o Lenis está ativo.
- Mudança em relação à spec: o header **não** usa `mix-blend-mode: difference`, porque o difference gera ciano sobre o vermelho. Sobre `#contrate` ele recebe `header--escuro` (texto `--preto`).

## Review Focus

1. Clicar num link do menu (ex.: "Contrate") com seções fixas no meio do caminho deve chegar na seção certa, sem parar no meio da pilha de sets. Teste na Task 3.
2. Autoplay recusado (iOS em modo economia, política do navegador) não pode gerar erro nem quebrar o layout: o pôster continua visível. Teste na Task 4.
3. Se o Google Fonts estiver bloqueado ou lento, o preloader termina mesmo assim (timeout) e o layout não estoura. Teste na Task 3.
4. Redimensionar ou girar a tela no meio da galeria deve recalcular o túnel, sem rolagem horizontal e com o número de itens certo para a nova largura. Teste na Task 6.
5. Ficar muito tempo parado na galeria (deriva contínua) não pode fazer `z` crescer sem limite nem perder precisão. Teste na Task 6 (`envolverZ` com valores enormes).

---

## Estrutura de arquivos

```
index.html                 Todo o conteúdo (Apêndice A), seções em <main>
css/base.css               Tokens, reset, tipografia, grão, estrelas, botões, preloader, header, menu
css/secoes.css             Hero, carreira, números, galeria, produções, sets, line-up, assinatura, contrate, rodapé
js/main.js                 Monta ctx, Lenis + ScrollTrigger, chama os iniciadores
js/util.js                 Puras: horaPOA, escolherHero, formatarContagem
js/videos.js               observarVideos, tocar, pausar
js/interface.js            iniciarPreloader, iniciarHeader (relógio, menu, header--escuro)
js/animacoes.js            iniciarHero, iniciarLetreiros, iniciarReveals, iniciarContadores, iniciarProducoes, iniciarAssinatura
js/dados.js                ITENS_GALERIA
js/galeria.js              criarRng, layoutGaleria, envolverZ, aparencia, iniciarGaleria
js/sets.js                 iniciarSets
tools/requirements.txt     Pillow==12.3.0, PyMuPDF==1.28.2
tools/tratar-fotos.py      Gera assets/img, assets/recortes, assets/og.jpg e assets/presskit.pdf
tools/cortar-video.sh      Comandos ffmpeg de assets/video
tests/unit/*.test.mjs      node --test
tests/e2e/ajuda.mjs        Servidor estático + Chrome
tests/e2e/*.test.mjs       Testes por seção
package.json, README.md
```

**Contexto passado a todo iniciador:** `ctx = { gsap, ScrollTrigger, lenis: Lenis|null, menosMovimento: boolean, celular: boolean }`.

---

### Task 1: Fundação e ambiente de teste

**Files:**
- Create: `package.json`, `tests/e2e/ajuda.mjs`, `tests/e2e/base.test.mjs`, `index.html`, `css/base.css`, `css/secoes.css`, `js/main.js`, `README.md`
- Modify: `.gitignore` (adicionar `node_modules/` e `tests/e2e/telas/`)

**Interfaces:**
- Produces:
  - `iniciarAmbiente(): Promise<{url:string, browser, fechar():Promise<void>}>`
  - `abrir(amb, {largura=1440, altura=900, menosMovimento=false, bloquear=[], antes}={}): Promise<{page, erros:string[]}>`
  - `rolarPara(page, seletor, deslocamento=0): Promise<void>`
  - `ctx` (formato acima), `body.pronto`, `html[data-lenis]`, `html.menos-movimento`

- [ ] **Step 1: `package.json` e dependência**

`{"type":"module","private":true,"scripts":{"test:unit":"node --test tests/unit/","test:e2e":"node --test --test-concurrency=1 tests/e2e/","test":"npm run test:unit && npm run test:e2e"}}`.

Rodar: `npm i -D puppeteer-core@25.16.0`.

- [ ] **Step 2: `tests/e2e/ajuda.mjs`**

**Servidor:** `http.createServer` serve a raiz do repo, com mime para html, css, js, mjs, webp, jpg, png, svg, mp4 e pdf. Range não é necessário. Porta 0.

**Navegador:** `puppeteer.launch({executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args:['--autoplay-policy=no-user-gesture-required']})`.

**`abrir`:**
1. `setViewport`.
2. Se `menosMovimento`, `emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])`.
3. Com interceptação ligada, aborta as URLs que casam com `bloquear`.
4. Roda `antes(page)` se existir.
5. Coleta em `erros`: `console` do tipo error, `pageerror` e respostas ≥ 400. Ignora as abortadas de propósito.
6. Faz `goto(url + '/index.html')` e espera `body.pronto` (timeout 10 s).

**`rolarPara`:** faz `window.scrollTo(0, topoAbsoluto + deslocamento)` e espera 2 rAF + 400 ms.

- [ ] **Step 3: Teste que falha, `tests/e2e/base.test.mjs`**

```js
test('carrega sem erros, com as seções na ordem', async () => {
  const { page, erros } = await abrir(amb);
  assert.deepEqual(await page.$$eval('main > section', s => s.map(e => e.id)),
    ['hero','carreira','numeros','galeria','producoes','sets','lineup','assinatura','contrate']);
  assert.equal(await page.$eval('html', h => h.lang), 'pt-BR');
  assert.equal(await page.evaluate(() => typeof gsap + typeof ScrollTrigger + typeof Lenis), 'objectfunctionfunction');
  assert.equal(await page.$eval('html', h => h.dataset.lenis), 'on');
  assert.deepEqual(erros, []);
});
test('movimento reduzido: sem Lenis', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('html', h => h.classList.contains('menos-movimento') && h.dataset.lenis), 'off');
});
```

- [ ] **Step 4: Rodar e ver falhar**

Rodar: `npm run test:e2e`. Esperado: FAIL, com 404 em `index.html` e timeout em `body.pronto`.

- [ ] **Step 5: Esqueleto da página**

**`index.html`:**
- `<head>`:
  - `<title>Brunin Tks — DJ e produtor · Porto Alegre</title>`
  - description: "Press kit do Brunin Tks, DJ e produtor de Porto Alegre (RS). Funk, bruxaria, funk BH e drum and bass. Savage, Boiler Baile, Sonora Breck e Sinistro DNB."
  - `theme-color #0F1211`
  - Open Graph e Twitter com `assets/og.jpg`
  - Favicon: estrela SVG em data URI (creme)
  - Fontes, CSS do Lenis, `css/base.css` e `css/secoes.css`
  - Scripts das Global Constraints com `defer` e depois `<script type="module" src="js/main.js">`
- `<body>`:
  - `<div class="grao" aria-hidden="true">`, `<header>` vazio e `<main>` com as 9 `<section id>` da ordem do teste, cada uma com `aria-labelledby` apontando para um `<h2>` (pode ser `.visualmente-oculto` por ora).
  - `<footer>`.

**`css/base.css`:**
- Tokens, reset e `body{background:var(--preto);color:var(--creme)}`.
- Pilhas de fonte com fallback (`Archivo, "Arial Narrow", system-ui, sans-serif` etc.) e `.visualmente-oculto`.
- `.grao`: `position:fixed`, `inset:-50%`, fundo de ruído `feTurbulence` em data URI (copiar `--grain` de `docs/identidade/direcoes.html`), `opacity:.18`, `mix-blend-mode:overlay`, `pointer-events:none`, `z-index:90`, animação em 4 steps. Fica parado em `.menos-movimento`.
- `.botao`: creme/preto, hover vermelho.
- `.estrela` (SVG de 4 pontas, path em `direcoes.html`).
- `:focus-visible{outline:2px solid var(--creme);outline-offset:3px}`; dentro de `#contrate`, o outline é `var(--preto)`.

**`js/main.js`:**
1. Define `menosMovimento` por `matchMedia('(prefers-reduced-motion: reduce)')` e marca o `<html>`.
2. Faz `gsap.registerPlugin(ScrollTrigger)`.
3. Sem `menosMovimento`: `new Lenis({lerp:0.1})`, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t*1000))` e `gsap.ticker.lagSmoothing(0)`.
4. Define `data-lenis`, monta o `ctx` e adiciona `body.pronto`. A Task 3 troca esse passo pelo preloader.

- [ ] **Step 6: Rodar e ver passar**

Rodar: `npm run test:e2e`. Esperado: 2 testes PASS.

- [ ] **Step 7: `README.md`**

- **Rodar local:** `python -m http.server 8765`.
- **Testes:** `npm i`, `npm test` e a variável `CHROME_PATH`.
- **Regenerar assets:** `pip install -r tools/requirements.txt`, `python tools/tratar-fotos.py` e `bash tools/cortar-video.sh`.
- **Publicar:**
  - Netlify Drop: arrastar a pasta sem `node_modules`, `tests` e `docs`.
  - GitHub Pages: a partir da branch `main`, na raiz.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .gitignore index.html css js tests README.md
git commit -m "feat: fundação do site e ambiente de teste"
```

---

### Task 2: Assets (fotos tratadas, recortes, clipes, OG, PDF)

**Files:**
- Create: `tools/requirements.txt`, `tools/tratar-fotos.py`, `tools/cortar-video.sh`, `tests/unit/assets.test.mjs`
- Generate: `assets/img/foto-{21,22,29,31,32,39,43,57}-{cor,tks}.webp`, `assets/recortes/*.webp`, `assets/og.jpg`, `assets/presskit.pdf`, `assets/video/{hero-720,pista,cabine}.mp4` e os `.jpg`
- Rename: `git mv assets/video/hero.mp4 assets/video/hero-540.mp4` (o pôster continua `hero.jpg`)

**Interfaces:**
- Produces: os caminhos acima. Tasks seguintes referenciam exatamente esses nomes.

- [ ] **Step 1: Teste que falha, `tests/unit/assets.test.mjs`**

```js
const tam = p => statSync(p).size;
const FOTOS = ['21','22','29','31','32','39','43','57'];
const RECORTES = ['p1-capa','p2-moldura','p2-maos','p3-costas','p5-figura','p6-cadeira','p7-dreads','tex-chamas'];
const CLIPES = ['boiler','chamas','dj-luz','filme','grade','maos','pista','cabine'];
test('fotos cor e tks ≤ 350 KB', () => { for (const f of FOTOS) for (const v of ['cor','tks'])
  assert.ok(tam(`assets/img/foto-${f}-${v}.webp`) <= 350_000, `${f}-${v}`); });
test('recortes ≤ 350 KB', () => { for (const r of RECORTES) assert.ok(tam(`assets/recortes/${r}.webp`) <= 350_000, r); });
test('clipes ≤ 300 KB com pôster', () => { for (const c of CLIPES) {
  assert.ok(tam(`assets/video/${c}.mp4`) <= 300_000, c); assert.ok(tam(`assets/video/${c}.jpg`) > 0); } });
test('hero', () => { assert.ok(tam('assets/video/hero-720.mp4') <= 4_500_000);
  assert.ok(tam('assets/video/hero-540.mp4') <= 3_000_000); assert.ok(tam('assets/video/hero.jpg') > 0); });
test('og e pdf', () => { assert.ok(tam('assets/og.jpg') <= 300_000); assert.ok(tam('assets/presskit.pdf') > 1_000_000); });
```

- [ ] **Step 2: Rodar e ver falhar**

Rodar: `npm run test:unit`. Esperado: FAIL com ENOENT em `assets/img/...`.

- [ ] **Step 3: `tools/cortar-video.sh`**

Função `enc nome inicio duracao largura crf` igual à usada na sessão de design:
- ffmpeg: `-ss -t -i "2 REELS.mp4" -an -vf scale=L:-2,fps=24 -c:v libx264 -crf C -preset slow -pix_fmt yuv420p -movflags +faststart`
- Pôster JPG `-q:v 4` tirado em `inicio+0.6`.

| nome | início | duração | largura | crf |
|---|---|---|---|---|
| hero-720 | 0 | 38.2 | 720 | 30 |
| hero-540 | 0 | 38.2 | 540 | 31 |
| boiler | 5.8 | 3 | 360 | 30 |
| filme | 9.0 | 2.2 | 360 | 30 |
| grade | 11.0 | 2.5 | 360 | 30 |
| pista | 15.0 | 2.5 | 360 | 30 |
| chamas | 23.4 | 2.6 | 360 | 30 |
| cabine | 27.4 | 2.5 | 360 | 30 |
| maos | 31.6 | 2.5 | 360 | 30 |
| dj-luz | 35.0 | 2.6 | 360 | 30 |

Rodar só `hero-720`, `pista` e `cabine`; os outros já existem. Fazer o `git mv` de `hero.mp4`. O pôster do hero continua `hero.jpg`, tirado em 6.6 s.

- [ ] **Step 4: `tools/tratar-fotos.py`**

Os caminhos são relativos à raiz do repo (`Path(__file__).parent.parent`). Para cada foto `assets/fotos/DjbruninTKS por @clicksbylt-NN.jpg`:

1. Redimensionar para 1200 px de altura (LANCZOS).
2. Salvar `foto-NN-cor.webp` (q80).
3. Gerar o `tks`:
   - `grayscale` e depois `autocontrast(cutoff=2)`.
   - `colorize`: nas fotos 22, 32 e 43, `black=#0F1211 mid=#E3302F white=#F1E2C4`; nas outras, `black=#0F1211 white=#F1E2C4`.
   - Grão: `Image.blend(img, Image.effect_noise(size, 48).convert('RGB'), 0.10)`.
   - Salvar em q80.

**Recortes:** usar a imagem embutida de cada página do `BRUNIN TKS PRESS KIT 2026.pdf` (`doc.extract_image(page.get_images()[0][0])`, 1080×1350), cortar e salvar em webp q82:

| recorte | página | caixa (l,t,r,b) |
|---|---|---|
| p1-capa | 1 | 0,0,1080,1350 |
| p2-moldura | 2 | 150,60,540,760 |
| p2-maos | 2 | 590,860,1080,1350 |
| p3-costas | 3 | 560,180,1080,1350 |
| p5-figura | 5 | 350,320,750,1300 |
| p6-cadeira | 6 | 60,760,1020,1290 |
| p7-dreads | 7 | 180,190,1000,770 |
| tex-chamas | 3 | 640,0,1080,230 |

**`og.jpg`:**
1. Fundo `#0F1211` de 1200×630.
2. Por cima, `hero.jpg` em modo cover (corte central), escurecido 45%.
3. `logo-sticker-osso.png` com 760 px de largura, girado −3° e centralizado.
4. Salvar com q85.

**`presskit.pdf`:** cópia do PDF da raiz.

- [ ] **Step 5: Gerar e rodar o teste**

Rodar: `python tools/tratar-fotos.py && npm run test:unit`. Esperado: PASS. Para o teste de assets: `pip install -r tools/requirements.txt`, ou `PYTHONPATH` apontando para uma pasta com os pacotes.

- [ ] **Step 6: Conferência visual**

Abrir 3 imagens `-tks` (uma vermelha, a 22) e `og.jpg`. Devem lembrar o P&B granulado e o duotone do PDF, com o logo legível.

- [ ] **Step 7: Commit**

```bash
git add tools tests/unit/assets.test.mjs assets
git commit -m "feat: pipeline de assets (fotos tratadas, recortes do PDF, clipes, og)"
```

---

### Task 3: Preloader, header, relógio e menu

**Files:**
- Create: `js/util.js`, `js/interface.js`, `tests/unit/util.test.mjs`, `tests/e2e/interface.test.mjs`
- Modify: `index.html` (preloader, header, menu), `css/base.css`, `js/main.js` (`await iniciarPreloader(ctx)` no lugar de adicionar `pronto` direto; depois `iniciarHeader(ctx)`)

**Interfaces:**
- Produces:
  - `horaPOA(data: Date): string` (formato `"HH:MM"`, fuso America/Sao_Paulo)
  - `iniciarPreloader(ctx): Promise<void>` (resolve depois de adicionar `body.pronto`)
  - `iniciarHeader(ctx): void`
  - Botão `#menu-botao`, painel `#menu`, links `#menu a[href^="#"]`

- [ ] **Step 1: Testes que falham**

```js
// tests/unit/util.test.mjs
test('horaPOA', () => {
  assert.equal(horaPOA(new Date('2026-11-10T01:10:00Z')), '22:10');
  assert.equal(horaPOA(new Date('2026-07-01T12:05:00Z')), '09:05');
});
// tests/e2e/interface.test.mjs
test('preloader some', async () => { const { page } = await abrir(amb);
  assert.equal(await page.$eval('#preloader', e => getComputedStyle(e).display), 'none'); });
test('relógio de POA', async () => { const { page } = await abrir(amb);
  assert.match(await page.$eval('.relogio', e => e.textContent.replace(/\s+/g,' ').trim()), /^POA \d{2}:\d{2}$/); });
test('menu abre, foca e fecha com Esc', async () => { const { page } = await abrir(amb);
  await page.click('#menu-botao');
  assert.equal(await page.$eval('#menu-botao', b => b.getAttribute('aria-expanded')), 'true');
  assert.ok(await page.evaluate(() => document.getElementById('menu').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#menu-botao', b => b.getAttribute('aria-expanded')), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-botao'); });
test('link do menu chega ao Contrate atravessando as seções fixas', async () => { const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2500));
  const topo = await page.$eval('#contrate', e => e.getBoundingClientRect().top);
  assert.ok(topo > -5 && topo < 100, String(topo)); });
test('Google Fonts bloqueado: a página abre mesmo assim', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/fonts\.(googleapis|gstatic)\.com/] });
  assert.ok(await page.$eval('body', b => b.classList.contains('pronto'))); assert.deepEqual(erros, []); });
```

- [ ] **Step 2: Rodar e ver falhar**

Rodar: `npm run test:unit; npm run test:e2e`. Esperado: FAIL (`horaPOA` não existe; `#preloader` não encontrado).

- [ ] **Step 3: `horaPOA` em `js/util.js`**

Usar `Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})`.

- [ ] **Step 4: Preloader**

**Markup:** `#preloader`, em tela cheia e com `--preto`, contém:
- o contador `.preloader__numero` (Archivo 800, de `000` a `100`);
- uma `.estrela` girando;
- `.preloader__cortina` em `--vermelho`, com `scaleY(0)` e origem embaixo.

**`iniciarPreloader`:**
1. Espera `Promise.race([Promise.all([document.fonts.ready, carregarImagem('assets/video/hero.jpg')]), espera(6000)])`, com mínimo de 1200 ms. O contador anima de 0 a 100 nesse tempo.
2. A cortina sobe (0,6 s) e o preloader sai.
3. Adiciona `body.pronto` e põe `display:none` no preloader.

Com `menosMovimento`, o preloader só some (fade de 300 ms).

- [ ] **Step 5: Header e menu**

**Header** (`position:fixed`, Archivo de 12 px em caixa-alta):
- À esquerda, `logo-creme.png` com 26 px de altura, em link para `#hero`.
- No centro, `.relogio` com "POA " e a hora. Os `:` piscam a cada 1 s; o relógio atualiza a cada 15 s.
- À direita, `#menu-botao` (ícone "+" que vira "×") com `aria-controls="menu" aria-expanded`.

Um `ScrollTrigger` em `#contrate` (`start:'top 60px'`) liga `header--escuro`, que pinta o texto em `--preto`.

**Menu** (`#menu`, tela cheia, `--preto` e `hidden` quando fechado):
- Links para as 6 seções numeradas em Fraunces com `clamp(40px,8vw,112px)`, cada um com "Nº 00X" em Grenze Gotisch. Os rótulos são Carreira, Galeria, Produções, Sets, Line-up e Contrate.
- No rodapé, WhatsApp, e-mail e Instagram.

**Comportamento:**
- Ao abrir: `lenis?.stop()` e foco no primeiro link.
- Esc ou clique num link fecha: `lenis?.start()` e foco volta ao botão.
- Clique num link de âncora: `preventDefault`, fecha e chama `lenis ? lenis.scrollTo(alvo,{duration:1.4}) : alvo.scrollIntoView()`. Depois, `ScrollTrigger.refresh()` não é necessário.

- [ ] **Step 6: Rodar e ver passar**

Rodar: `npm run test:unit; npm run test:e2e`. Esperado: todos PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html css js tests
git commit -m "feat: preloader, header com relógio de POA e menu"
```

---

### Task 4: Hero

**Files:**
- Create: `js/videos.js`, `js/animacoes.js` (começa com `iniciarHero` e `iniciarLetreiros`), `tests/e2e/hero.test.mjs`
- Modify: `js/util.js` (+ `escolherHero`), `tests/unit/util.test.mjs`, `index.html` (`#hero`), `css/secoes.css`, `js/main.js`

**Interfaces:**
- Consumes: `ctx` e `iniciarPreloader` (Task 3)
- Produces:
  - `escolherHero(largura:number): string`
  - `observarVideos(raiz: ParentNode, {menosMovimento}): void`. Toca e pausa os `video[data-auto]` conforme a visibilidade.
  - `tocar(v: HTMLVideoElement): void`. Usa `data-src` → `src` se não houver `src`, e `play()?.catch(()=>{})`.
  - `pausar(v): void`
  - `iniciarLetreiros(ctx): void`. Anima todo `.letreiro__trilho`, cujo conteúdo é duplicado com `aria-hidden` na segunda metade.

- [ ] **Step 1: Testes que falham**

```js
// unit
test('escolherHero', () => {
  assert.equal(escolherHero(1440), 'assets/video/hero-720.mp4');
  assert.equal(escolherHero(820), 'assets/video/hero-540.mp4');
  assert.equal(escolherHero(390), 'assets/video/hero-540.mp4'); });
// e2e
test('desktop: hero-720 tocando e card visível', async () => { const { page } = await abrir(amb);
  await new Promise(r => setTimeout(r, 800));
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-720.mp4') && !v.paused));
  assert.notEqual(await page.$eval('.hero__card', e => getComputedStyle(e).display), 'none'); });
test('celular: hero-540 e sem card', async () => { const { page } = await abrir(amb, { largura: 390, altura: 844 });
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-540.mp4')));
  assert.equal(await page.$eval('.hero__card', e => getComputedStyle(e).display), 'none'); });
test('letreiro com as 4 festas', async () => { const { page } = await abrir(amb);
  const t = await page.$eval('#hero .letreiro', e => e.textContent);
  for (const f of ['Savage','Boiler Baile','Sonora Breck','Sinistro DNB']) assert.ok(t.includes(f), f); });
test('logo quebrado vira texto', async () => {
  const { page } = await abrir(amb, { bloquear: [/logo-sticker-osso\.png/] });
  assert.equal(await page.$eval('#hero .logo-texto', e => e.hidden), false); });
test('autoplay recusado não gera erro', async () => {
  const { page, erros } = await abrir(amb, { antes: p => p.evaluateOnNewDocument(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('x', 'NotAllowedError')); }) });
  assert.deepEqual(erros, []);
  assert.ok(await page.$eval('.hero__video', v => v.poster.endsWith('hero.jpg'))); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL, sem `escolherHero` e sem `.hero__video`.

- [ ] **Step 3: `escolherHero`.** Retorna `hero-720` quando `largura > 820`; caso contrário, `hero-540`.

- [ ] **Step 4: Markup e CSS do hero**

Seguir `.C .mock` de `docs/identidade/direcoes.html`, agora em tela cheia (`100svh`):

- **Vídeo:** `video.hero__video[data-auto]` com `poster="assets/video/hero.jpg"` e sem `src` no HTML. O `iniciarHero` define `src = escolherHero(innerWidth)`.
- **Camadas por cima:** brilho radial `--brasa` e gradiente preto no topo e na base.
- **Logo:** `img.logo` (`logo-sticker-osso.png`, `width:min(70vw,900px)`, girado −3°), com `onerror="this.hidden=true;this.nextElementSibling.hidden=false"`, seguido de `<span class="logo-texto" hidden>BRUNIN TKS</span>` em Grenze Gotisch.
- **Decoração:** 3 `.estrela`.
- **Textos:** no topo, "DJ & Produtor — Porto Alegre/RS" (abaixo do header); na base, "Funk · Bruxaria · Funk BH · Drum and Bass" e "↓ Scroll".
- **Card:** `.hero__card` com `video[data-auto]` (`boiler.mp4`/`.jpg`) e a etiqueta "● Boiler Baile". Fica com `display:none` no celular.
- **Letreiro:** `.letreiro` em faixa `--vermelho` com `.letreiro__trilho`. O texto em Fraunces, cor `--preto`, é "Savage ✦ Boiler Baile ✦ Sonora Breck ✦ Sinistro DNB ✦", repetido 2× e depois duplicado com `aria-hidden`.

- [ ] **Step 5: JS**

**`iniciarHero(ctx)`:**
- Define o `src`.
- Sem `menosMovimento`, um ScrollTrigger com scrub sobre `#hero`: o vídeo vai de `scale 1→1.12` e `brightness .9→.5`, e o logo faz `yPercent 0→-30`.

**`iniciarLetreiros(ctx)`:**
- Cada trilho anima com `gsap.to(trilho,{xPercent:-50,repeat:-1,ease:'none',duration:30})`.
- Um ScrollTrigger global usa `getVelocity()` para acelerar: `timeScale(1 + min(|v|/400, 4))`, voltando a 1 em 0,6 s.
- Com `menosMovimento`, não anima.

**Estrelas:** todas as `.estrela` da página giram com scrub ligado ao scroll da página inteira (`rotation: 0→360`, sentido alternado por índice). Com `menosMovimento`, ficam paradas.

**`main.js`:** chama `observarVideos(document, ctx)`.

- [ ] **Step 6: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 7: Commit.** Mensagem: `git commit -m "feat: hero com reel, card Boiler Baile e letreiro"`.

---

### Task 5: Carreira e Números

**Files:**
- Create: `tests/e2e/carreira.test.mjs`
- Modify: `js/util.js` (+ `formatarContagem`), `tests/unit/util.test.mjs`, `js/animacoes.js` (+ `iniciarReveals`, `iniciarContadores`), `index.html`, `css/secoes.css`, `js/main.js`

**Interfaces:**
- Produces:
  - `formatarContagem(valor:number, {milhar=false}={}): string`
  - `iniciarReveals(ctx)`:
    - `[data-revelar]`: o JS divide em `<span class="palavra">` e revela palavra por palavra com scrub.
    - `[data-aparecer]`: fade-up ao entrar.
  - `iniciarContadores(ctx)`: atua em `[data-contar]`, com `data-de` (padrão 0), `data-sufixo` e `data-milhar`.
  - A classe `.foto-dupla` (`img.tks` + `img.cor`; hover ou `.foto-dupla--cor` faz o crossfade), reutilizada nas Tasks 6 e 7.

- [ ] **Step 1: Testes que falham**

```js
test('formatarContagem', () => {
  assert.equal(formatarContagem(2000, { milhar: true }), '2.000');
  assert.equal(formatarContagem(287.6), '288'); assert.equal(formatarContagem(2017), '2017'); });
// e2e
test('bio completa', async () => { const { page } = await abrir(amb);
  const t = await page.$eval('#carreira', e => e.textContent);
  for (const s of ['ativo desde 2017', 'Planeta Atlântida por três edições', 'na França e na Espanha', 'fundador da Savage'])
    assert.ok(t.includes(s), s); });
test('contadores chegam ao valor final', async () => { const { page } = await abrir(amb);
  await rolarPara(page, '#numeros'); await new Promise(r => setTimeout(r, 2200));
  assert.deepEqual(await page.$$eval('#numeros .numero__valor', l => l.map(e => e.textContent.trim())),
    ['288 mil+', '2017', '3×', '2.000+', '4', 'FR · ES']); });
test('movimento reduzido: valores finais sem animar', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('#numeros .numero__valor', e => e.textContent.trim()), '288 mil+'); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm test`. Esperado: FAIL.

- [ ] **Step 3: `formatarContagem`.** `Math.round`; com `milhar`, `toLocaleString('pt-BR')`, senão `String`.

- [ ] **Step 4: Markup e CSS**

**`#carreira`:**
- Rótulo "Nº 001 — Carreira", com o numeral em Grenze Gotisch.
- Abertura `[data-revelar]` em Fraunces `clamp(36px,6vw,96px)` (Apêndice A.1).
- Bio (A.2) em 2 colunas `[data-aparecer]`, uma no celular.
- `.foto-dupla` com `foto-31` e scrub `scale 1→1.15`.

**`#numeros`:**
- 6 itens `.numero` com `.numero__valor` (Fraunces) e `.numero__rotulo` (Archivo de 12 px).
- O HTML já traz o valor final como texto.
- Faixa de fundo `tex-chamas.webp` com `opacity:.12` e `mix-blend-mode:luminosity`.
- Valores e rótulos:

| valor | atributos | rótulo |
|---|---|---|
| 288 mil+ | `data-contar=288 data-sufixo=" mil+"` | plays em sets online |
| 2017 | `data-contar=2017 data-de=2000` | início da carreira |
| 3× | `data-contar=3 data-sufixo="×"` | Planeta Atlântida |
| 2.000+ | `data-contar=2000 data-milhar data-sufixo="+"` | pessoas numa Boiler Baile |
| 4 | `data-contar=4` | festas criadas |
| FR · ES | sem `data-contar` | suas faixas tocaram na França e na Espanha |

- [ ] **Step 5: JS**

**`iniciarContadores`:** com um ScrollTrigger `once` em `top 80%`, faz o tween de `{v:de}` até o alvo em 1,6 s com `power2.out`, atualizando `textContent = formatarContagem(v,{milhar}) + sufixo`. Com `menosMovimento`, não faz nada.

**`iniciarReveals`:** palavras com `opacity .15→1` e scrub em `top 80%` → `bottom 40%`.

- [ ] **Step 6: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 7: Commit.** Mensagem: `git commit -m "feat: seções Carreira e Números"`.

---

### Task 6: Galeria infinita

**Files:**
- Create: `js/galeria.js`, `js/dados.js`, `tests/unit/galeria.test.mjs`, `tests/e2e/galeria.test.mjs`
- Modify: `index.html` (`#galeria`), `css/secoes.css`, `js/main.js`

**Interfaces:**
- Consumes: `ctx` e `.foto-dupla` (Task 5)
- Produces:
  - `criarRng(semente:number): () => number` (mulberry32, retorna valores em [0,1))
  - `layoutGaleria(n:number, {semente:number, prof:number}): Array<{x:number,y:number,z:number,rx:number,ry:number,rz:number,blend:string}>`
  - `envolverZ(z:number, prof:number, frente:number): number`
  - `aparencia(z:number, prof:number, frente:number): {opacidade:number, blur:number, brilho:number}`
  - `iniciarGaleria(el:HTMLElement, itens:Array<{tks:string, cor?:string, alt:string}>, {celular:boolean, menosMovimento:boolean, ScrollTrigger}): {destruir():void}`
  - `ITENS_GALERIA` (15 itens)

- [ ] **Step 1: Testes unitários que falham**

```js
test('layout determinístico e dentro dos limites', () => {
  const a = layoutGaleria(15, { semente: 7, prof: 3000 });
  assert.deepEqual(a, layoutGaleria(15, { semente: 7, prof: 3000 }));
  assert.notDeepEqual(a, layoutGaleria(15, { semente: 8, prof: 3000 }));
  for (const i of a) {
    assert.ok(Math.abs(i.x) <= 0.9 && Math.abs(i.y) <= 0.9);
    assert.ok(Math.abs(i.rx) <= 25 && Math.abs(i.ry) <= 25 && Math.abs(i.rz) <= 12);
    assert.ok(i.z <= 0 && i.z > -3000); }
  assert.equal(new Set(a.map(i => i.z)).size, 15); });
test('envolverZ', () => {
  assert.equal(envolverZ(400, 3000, 400), 400);
  assert.equal(envolverZ(401, 3000, 400), -2599);
  assert.equal(envolverZ(-2600, 3000, 400), 400);
  const z = envolverZ(1e9 + 0.5, 3000, 400); assert.ok(z > -2600 && z <= 400); });
test('aparencia: fundo apagado, meio cheio, frente some', () => {
  const fundo = aparencia(-2599, 3000, 400), meio = aparencia(-800, 3000, 400), frente = aparencia(400, 3000, 400);
  assert.ok(fundo.opacidade < 0.01 && fundo.blur > 5.9);
  assert.equal(meio.opacidade, 1); assert.equal(frente.opacidade, 0);
  assert.ok(fundo.brilho < meio.brilho && meio.brilho < frente.brilho); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:unit`. Esperado: FAIL, módulo inexistente.

- [ ] **Step 3: Funções puras em `js/galeria.js`**

```js
// layout: espiral de ângulo áureo para x,y; z distribuído; rotações pela semente
// para i em 0..n-1:
//   ang = i * 2.39996;  r = 0.35 + 0.55 * ((i * 0.618034) % 1)
//   x = cos(ang) * r;   y = sin(ang) * r * 0.8;   z = -i * prof / n
//   rx = (rng()*2-1)*25; ry = (rng()*2-1)*25; rz = (rng()*2-1)*12
//   blend = ['normal','screen','normal','lighten','normal','difference'][i % 6]
export const envolverZ = (z, prof, frente) => frente - ((((frente - z) % prof) + prof) % prof);
// aparencia: p = (z - (frente - prof)) / prof   (0 no fundo, 1 na frente)
//   opacidade = min(1, p * 2.2) * (z > frente - 250 ? max(0, (frente - z) / 250) : 1)
//   blur = (1 - p) * 6 ;  brilho = 0.35 + 0.65 * p
```

- [ ] **Step 4: Rodar e ver passar.** Rodar `npm run test:unit`. Esperado: PASS.

- [ ] **Step 5: Teste e2e que falha, `tests/e2e/galeria.test.mjs`**

```js
const transformDoPrimeiro = p => p.$eval('#galeria .galeria__item', e => e.style.transform);
test('desktop: 15 itens que se movem sozinhos', async () => { const { page } = await abrir(amb);
  await rolarPara(page, '#galeria', 200);
  assert.equal(await page.$$eval('#galeria .galeria__item', l => l.length), 15);
  const t1 = await transformDoPrimeiro(page); await new Promise(r => setTimeout(r, 500));
  assert.notEqual(t1, await transformDoPrimeiro(page)); });
test('celular: 10 itens', async () => { const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#galeria', 200);
  assert.equal(await page.$$eval('#galeria .galeria__item', l => l.length), 10); });
test('hover mostra a cor', async () => { const { page } = await abrir(amb); await rolarPara(page, '#galeria', 200);
  const temCor = await page.$eval('#galeria .galeria__item:has(img.cor)', e => {
    e.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' })); return e.classList.contains('foto-dupla--cor'); });
  assert.ok(temCor); });
test('movimento reduzido: grade estática', async () => { const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('#galeria', e => e.classList.contains('galeria--estatica')));
  assert.equal(await transformDoPrimeiro(page), ''); });
test('redimensionar 1440 → 390 refaz a galeria sem rolagem horizontal', async () => {
  const { page } = await abrir(amb); await rolarPara(page, '#galeria', 200);
  await page.setViewport({ width: 390, height: 844 }); await new Promise(r => setTimeout(r, 800));
  assert.equal(await page.$$eval('#galeria .galeria__item', l => l.length), 10);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); });
```

- [ ] **Step 6: Rodar e ver falhar.** Rodar `npm run test:e2e`. Esperado: FAIL.

- [ ] **Step 7: `ITENS_GALERIA`, markup e `iniciarGaleria`**

**`ITENS_GALERIA`:** 15 itens nesta ordem, alternando fotos e recortes:
- foto-21, p1-capa, foto-31, p2-moldura, foto-57, p6-cadeira, foto-22, p2-maos, foto-43, p3-costas, foto-29, p7-dreads, foto-39, p5-figura, foto-32
- As fotos têm `tks` + `cor`; os recortes, só `tks`.
- O `alt` é descritivo, por exemplo "Brunin Tks de moletom verde, foto @clicksbylt" ou "Arte do press kit 2026".

**Markup:** `#galeria` (`height:400vh`) contém:
- `.galeria__palco` (`position:sticky; top:0; height:100svh; overflow:hidden; perspective:900px`) com fundo `--preto`;
- a névoa `.galeria__nevoa`: radial `--sangue` nas bordas e `--brasa` a 25% no centro, no estilo do `.fog` de `direcoes.html`;
- a legenda fixa "Nº 002 — Galeria" e "Fotos @clicksbylt".

**`iniciarGaleria`:**
- `n = celular ? 10 : 15`, `prof = celular ? 2200 : 3000`, `frente = 400` e `semente = 7`.
- Cria os itens `.galeria__item.foto-dupla` (com `img` em `loading="lazy" decoding="async"`), com largura `clamp(140px,22vw,340px)` e proporção 2/3.

**A cada frame** (rAF ligado e desligado por IntersectionObserver no palco):
1. `cam = t*0.25 + progresso*prof*1.5 + impulso`. O `progresso` vem de um ScrollTrigger sobre `el` (`top top`→`bottom bottom`). O impulso soma `getVelocity()*0.05` e decai ×0,92 por frame.
2. Para cada item: `z = envolverZ(base.z + cam, prof, frente)`.
3. Aplica `transform = translate3d(x*w/2 px, y*h/2 px, z px) rotateX rotateY rotateZ`, mais `opacity` e `filter` (`blur(px) brightness()` no desktop; só `brightness()` no celular). O `mixBlendMode` é o `blend`.

**Interação e ciclo de vida:**
- `pointerenter`/`pointerleave` com mouse alternam `foto-dupla--cor`; `pointerup` em toque também alterna.
- Um `resize` com debounce de 200 ms recalcula `w,h`. Se cruzar 820 px, faz `destruir()` e recria com o novo `n`.
- Com `menosMovimento`, aplica `galeria--estatica`: grade CSS de 2 a 4 colunas, altura automática e nenhum transform.

`main.js` mantém a instância para recriar.

- [ ] **Step 8: Rodar e ver passar.** Rodar `npm test`. Esperado: PASS.

- [ ] **Step 9: Commit.** Mensagem: `git commit -m "feat: galeria infinita em 3D"`.

---

### Task 7: Produções

**Files:**
- Create: `tests/e2e/producoes.test.mjs`
- Modify: `index.html` (`#producoes`), `css/secoes.css`, `js/animacoes.js` (+ `iniciarProducoes`), `js/main.js`

**Interfaces:**
- Produces: `iniciarProducoes(ctx): void`. Linhas em `.producao` com `data-foto`, botão `.producao__botao[aria-expanded][aria-controls]` e painel `.producao__painel`.

- [ ] **Step 1: Testes que falham**

```js
test('4 produções na ordem, com os papéis', async () => { const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.producao__nome', l => l.map(e => e.textContent.trim())),
    ['Savage', 'Boiler Baile', 'Sonora Breck', 'Sinistro DNB']);
  const papeis = await page.$$eval('.producao__papel', l => l.map(e => e.textContent));
  assert.ok(papeis[0].includes('Fundador') && papeis.slice(1).every(p => p.includes('Cofundador'))); });
test('desktop: foto segue o cursor', async () => { const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 200); const linha = (await page.$$('.producao'))[1];
  await linha.hover(); await new Promise(r => setTimeout(r, 400));
  assert.ok(await page.$eval('.producoes__flutuante', (e) =>
    +getComputedStyle(e).opacity > 0.5 && e.src.includes('boiler'))); });
test('celular: toque abre e fecha', async () => { const { page } = await abrir(amb, { largura: 390, altura: 844 });
  const b = '.producao:first-child .producao__botao'; await rolarPara(page, '#producoes'); await page.click(b);
  assert.equal(await page.$eval(b, e => e.getAttribute('aria-expanded')), 'true'); await page.click(b);
  assert.equal(await page.$eval(b, e => e.getAttribute('aria-expanded')), 'false'); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:e2e`. Esperado: FAIL.

- [ ] **Step 3: Markup e CSS**

**Topo da seção:** rótulo "Nº 003 — Produções", `<h2>` "Suas produções e impactos na cena" (Fraunces) e intro (A.3, 1º parágrafo).

**4 linhas `.producao`** (nome em Grenze Gotisch `clamp(56px,11vw,180px)`, texto do Apêndice A.3):

| nome | `data-foto` | papel |
|---|---|---|
| Savage | `assets/img/foto-21-tks.webp` | Fundador · DJ residente |
| Boiler Baile | `assets/video/boiler.jpg` | Cofundador · Curadoria · Direção criativa · DJ residente |
| Sonora Breck | `assets/img/foto-57-tks.webp` | Cofundador · Curadoria · Direção criativa · DJ residente |
| Sinistro DNB | `assets/img/foto-39-tks.webp` | Cofundador · Curadoria · Direção criativa · DJ residente |

- O botão inteiro é o cabeçalho da linha (`.producao__botao`). O painel traz a descrição e, no celular, a foto.
- Ao final, o parágrafo de fechamento (A.3, último trecho).
- Uma única `img.producoes__flutuante` (com 280 px, `pointer-events:none` e opacidade 0) fica no desktop.
- O fundo da linha ativa ganha um brilho radial `--brasa`.

- [ ] **Step 4: `iniciarProducoes`**

**Desktop** (`!ctx.celular`):
- Os painéis ficam sempre abertos e o botão não alterna.
- `pointermove` na seção usa `gsap.quickTo` em x/y e rotação proporcional à velocidade horizontal, limitada a ±12°.
- `pointerenter` na linha troca o `src` para `data-foto` e anima a opacidade para 1; `pointerleave` na seção anima para 0.

**Celular:** o botão alterna `aria-expanded` e `hidden` no painel.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm run test:e2e`. Esperado: PASS.

- [ ] **Step 6: Commit.** Mensagem: `git commit -m "feat: seção Produções"`.

---

### Task 8: Sets (pilha de cortinas com vídeo)

**Files:**
- Create: `js/sets.js`, `tests/e2e/sets.test.mjs`
- Modify: `index.html` (`#sets`), `css/secoes.css`, `js/main.js`

**Interfaces:**
- Consumes: `tocar` e `pausar` (Task 4), `ctx`
- Produces: `iniciarSets(ctx): void`. Contém `.sets__pilha`, 8 `.set` (cada um com `video.set__video[preload="none"][data-src]`), `.sets__contador` e `.destaques`.

- [ ] **Step 1: Testes que falham**

```js
const SETS = [
  ['Senso Rádio convida Brunin', 'https://www.youtube.com/watch?v=5ackC9W3BIs'],
  ['Boiler Baile x Grau', 'https://www.youtube.com/watch?v=2Z2gP9W9Epo'],
  ['Boiler Baile Ataque Sonoro', 'https://www.youtube.com/watch?v=PuYyCp85V9U'],
  ['Veneno Lab', 'https://www.youtube.com/watch?v=SLUUZG8-oYA'],
  ['Live Sensi por BSTV', 'https://www.youtube.com/watch?v=IP9V-06-QJw'],
  ['Rewind BR', 'https://soundcloud.com/functionfm/brunin-tks-rewind-br-04-functionfm-18102025'],
  ['Trinka', 'https://soundcloud.com/trinkabr/tkm11-brunin-tks'],
  ['Modelo Brasileño', 'https://radiorelativa.eu/episode/modelo-brasileno-2'] ];
test('8 sets com os links certos', async () => { const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set', l => l.map(s => [s.querySelector('.set__titulo').textContent.trim(),
    s.querySelector('.set__link').getAttribute('href')])), SETS);
  assert.ok(await page.$$eval('.set__link', l => l.every(a => a.target === '_blank' && a.rel.includes('noopener')))); });
test('vídeos dos sets não pré-carregam', async () => { const { page } = await abrir(amb);
  assert.ok(await page.$$eval('.set__video', l => l.every(v => v.preload === 'none' && !v.getAttribute('src')))); });
test('só o set ativo toca', async () => { const { page } = await abrir(amb);
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60); await new Promise(r => setTimeout(r, 900));
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  assert.deepEqual(await page.$$eval('.set__video', l => l.map(v => !v.paused)),
    [false, false, true, false, false, false, false, false]); });
test('destaque do Aquele Tuim', async () => { const { page } = await abrir(amb);
  assert.ok(await page.$eval('.destaques', e => [...e.querySelectorAll('a')].some(a =>
    a.href === 'https://www.aqueletuim.com.br/2024/11/os-melhores-dj-sets-de-funk-de-2024.html'))); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:e2e`. Esperado: FAIL.

- [ ] **Step 3: Markup e CSS**

**Topo da seção:** rótulo "Nº 004 — Sets", `<h2>` "Sets que marcaram a trajetória" e intro (A.4, 1º parágrafo).

**Pilha:**
- `.sets__pilha` com altura de `8*100vh` (celular: `8*70vh`) e `.sets__palco` sticky com `100svh`.
- Cada `.set` é absoluto e preenche o palco. Os slides do 2º ao 8º começam com `transform:scaleY(0)` e `transform-origin:bottom`.

**Cada `.set`**, no estilo `.sets` de `direcoes.html`:
- vídeo (`data-src` e pôster);
- sombra em gradiente;
- "Set 0X / 08 · {local}", título `.set__titulo` em Fraunces, ícone (YouTube, SoundCloud ou rádio, em SVG inline) e o botão `.set__link.botao` ("▶ Assistir" no YouTube, "▶ Ouvir" nos outros).

**Locais e clipes:**

| # | local | clipe |
|---|---|---|
| 1 | Senso Radio NH | grade |
| 2 | Veneno Live SP x Senso Rádio NH | boiler |
| 3 | Veneno Live SP | chamas |
| 4 | São Paulo | dj-luz |
| 5 | DnB set | filme |
| 6 | Function! SH · DnB set | maos |
| 7 | Porto Alegre | pista |
| 8 | Madri · Radio Relativa | cabine |

**`.destaques`** (depois da pilha):
- Selo "Um dos melhores sets de funk de 2024 — Aquele Tuim", com link.
- Lista dos 3 mais tocados com os plays (A.4), sem link.
- Parágrafo A.4.

- [ ] **Step 4: `iniciarSets(ctx)`**

**Com movimento:** um timeline com ScrollTrigger `{trigger:'.sets__pilha', start:'top top', end:'bottom bottom', scrub:true}`. Para cada i de 1 a 7:
- `.to(set[i],{scaleY:1})`;
- em paralelo, `.to(set[i-1] video,{yPercent:-15})`.

No `onUpdate`, `ativo = Math.round(progress*7)`. Quando o ativo muda, chama `tocar(video[ativo])` e `pausar` nos outros, e atualiza o contador com o formato `"03 / 08"`.

**Com `menosMovimento`:** os sets viram blocos empilhados normais (`position:relative`, sem scaleY), sem vídeo tocando e com o pôster.

- [ ] **Step 5: Rodar e ver passar.** Rodar `npm run test:e2e`. Esperado: PASS.

- [ ] **Step 6: Commit.** Mensagem: `git commit -m "feat: pilha de sets com clipes do reel"`.

---

### Task 9: Line-up, Assinatura, Contrate e rodapé

**Files:**
- Create: `tests/e2e/final.test.mjs`
- Modify: `index.html` (`#lineup`, `#assinatura`, `#contrate`, `footer`), `css/secoes.css`, `js/animacoes.js` (+ `iniciarAssinatura`), `js/main.js`

**Interfaces:**
- Consumes: `iniciarLetreiros` (Task 4) e `header--escuro` (Task 3)
- Produces: `iniciarAssinatura(ctx): void`, com `#assinatura .assinatura__traco` (`<path>`)

- [ ] **Step 1: Testes que falham**

```js
const NACIONAIS = ['KL Jay','Rincon Sapiência','Raffa Moreira','MC Binn','Pocah','MC Felipinho','Wesley Gonzaga'];
const UNDER = ['DJ Patife','Caio Prince','Bonekinha Iraquiana','Ramon Sucesso','Nanda Tsunami','Young Clubber',
  'Carlos do Complexo','Idlibra','Dayeh','Bassan','Kenan e Kel','DJ Lorrany','Brum'];
test('line-up com todos os nomes', async () => { const { page } = await abrir(amb);
  const t = await page.$eval('#lineup', e => e.textContent);
  for (const n of [...NACIONAIS, ...UNDER, 'Planeta Atlântida', 'Relativa']) assert.ok(t.includes(n), n); });
test('assinatura desenha o traço com o scroll', async () => { const { page } = await abrir(amb);
  const off = () => page.$eval('.assinatura__traco', p => parseFloat(getComputedStyle(p).strokeDashoffset));
  await rolarPara(page, '#assinatura', 10); const a = await off();
  await rolarPara(page, '#assinatura', 900); assert.ok(await off() < a); });
test('contrate: contatos exatos e PDF disponível', async () => { const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('#contrate .contato a', l => l.map(a => a.getAttribute('href'))), [
    'mailto:contato.bruninn@gmail.com', 'https://wa.me/5551980407711', 'https://www.instagram.com/djbrunintks',
    'https://drive.google.com/drive/folders/1ggulWuIW_njZD_iznFLcxt8tv8GtZnso', 'assets/presskit.pdf']);
  assert.equal(await page.evaluate(() => fetch('assets/presskit.pdf').then(r => r.status)), 200); });
test('header fica escuro sobre o Contrate', async () => { const { page } = await abrir(amb);
  await rolarPara(page, '#contrate', 10);
  assert.ok(await page.$eval('header', h => h.classList.contains('header--escuro'))); });
```

- [ ] **Step 2: Rodar e ver falhar.** Rodar `npm run test:e2e`. Esperado: FAIL.

- [ ] **Step 3: `#lineup`**

- Rótulo "Nº 005 — Line-up" e `<h2>` "Shows que já compôs o line".
- Dois `.letreiro` (reaproveitam `iniciarLetreiros`):
  - nacionais em Fraunces creme `clamp(48px,9vw,140px)`, separados por "✦";
  - underground no sentido oposto (`data-sentido="-1"`, que inverte o `xPercent` em `iniciarLetreiros`), em Archivo 800 contornado (`-webkit-text-stroke:1px var(--creme); color:transparent`).
- Parágrafo A.5.
- Lista "Palcos, festas e rádios": Planeta Atlântida (3 edições) · Onze Bar · Senso Radio · Trinka · Lóbulo · Function · Guilda · Veneno · Relativa (Madri).

- [ ] **Step 4: `#assinatura`**

- `height:200vh`, com palco sticky de `100svh` em `--preto`.
- "Brunin" em Grenze Gotisch 800, creme, `clamp(64px,14vw,220px)`, no centro.
- SVG `viewBox="0 0 800 500" preserveAspectRatio="none"` com o path `M90 380C180 120 300 90 330 250S520 420 560 210 700 90 740 160` (`.assinatura__traco`, `stroke:var(--vermelho)`, `stroke-width:14`, `linecap round`).
- `.assinatura__cortina` em `--vermelho` com `scaleY(0)` e origem embaixo.

**`iniciarAssinatura`:**
1. Lê `getTotalLength()` e define `strokeDasharray = strokeDashoffset = L`.
2. Timeline com scrub: o dashoffset vai de L a 0 nos primeiros 70%, e a cortina faz `scaleY 0→1` nos últimos 30%.

Com `menosMovimento`, o traço já aparece desenhado e não há cortina.

- [ ] **Step 5: `#contrate` e rodapé**

**`#contrate`:**
- Fundo `--vermelho` e rótulo "Nº 006" em preto.
- `<h2>` "Contrate" em Fraunces preto `clamp(80px,18vw,280px)` e `logo-preto.png`.
- Lista `.contato`, na ordem do teste: rótulo em Archivo 800 de 19 px, preto (o mínimo de "texto grande" para ficar sobre vermelho), e valor grande (Archivo 800 `clamp(24px,3.4vw,44px)`). A seta "↗" vira ↓ no PDF, que leva `download`.
  - E-mail: contato.bruninn@gmail.com
  - WhatsApp: 51 98040-7711 · Wesley
  - Instagram: @djbrunintks
  - Fotos, release e logos: pasta no Drive
  - Press kit em PDF: baixar
- Hover da linha: fundo preto e texto creme.

**Rodapé:** em `--preto`, com "© 2026 Brunin Tks · Fotos @clicksbylt" e o botão "↑ Topo" (`lenis.scrollTo(0)`).

- [ ] **Step 6: Rodar e ver passar.** Rodar `npm test`. Esperado: tudo PASS.

- [ ] **Step 7: Commit.** Mensagem: `git commit -m "feat: line-up, assinatura do reel e Contrate"`.

---

### Task 10: Passe responsivo e verificação final

**Files:**
- Create: `tests/e2e/responsivo.test.mjs`
- Modify: o CSS e o JS que precisarem de ajuste conforme o resultado

**Interfaces:**
- Consumes: todas as anteriores

- [ ] **Step 1: Teste que varre a página**

```js
for (const [largura, altura] of [[390, 844], [1440, 900]]) {
  test(`varredura ${largura}px: sem rolagem horizontal e sem erros`, async () => {
    const { page, erros } = await abrir(amb, { largura, altura });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(altura * 0.8)) {
      await page.evaluate(v => window.scrollTo(0, v), y); await new Promise(r => setTimeout(r, 120));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `y=${y}`); }
    assert.deepEqual(erros, []); });
  test(`telas ${largura}px`, async () => { const { page } = await abrir(amb, { largura, altura });
    for (const s of ['#hero','#carreira','#numeros','#galeria','#producoes','#sets','#lineup','#assinatura','#contrate']) {
      await rolarPara(page, s, s === '#galeria' || s === '#assinatura' ? altura : 0);
      await page.screenshot({ path: `tests/e2e/telas/${largura}-${s.slice(1)}.png` }); } });
}
test('movimento reduzido: página inteira sem erros e vídeos parados', async () => {
  const { page, erros } = await abrir(amb, { menosMovimento: true });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await new Promise(r => setTimeout(r, 500));
  assert.ok(await page.$$eval('video', l => l.every(v => v.paused))); assert.deepEqual(erros, []); });
```

- [ ] **Step 2: Rodar**

Rodar: `npm run test:e2e`. Esperado: PASS. Se falhar, corrigir na seção culpada (o `y` da mensagem diz onde) e rodar de novo.

- [ ] **Step 3: Revisão visual**

Abrir `tests/e2e/telas/*.png` e comparar com `docs/identidade/direcoes.html` (direção C). Conferir:
- contraste e as regras de cor das Global Constraints;
- textos sem corte no celular;
- logo legível;
- galeria com itens visíveis e mesclados;
- a pilha de sets legível sobre o vídeo.

Ajustar e repetir os Steps 2 e 3.

- [ ] **Step 4: Suíte completa**

Rodar: `npm test`. Esperado: todos os testes unitários e e2e PASS, com 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add -A css js index.html tests/e2e/responsivo.test.mjs
git commit -m "test: varredura responsiva, movimento reduzido e ajustes finais"
```

---

## Apêndice A — Textos (transcritos do PDF; a caixa-alta é via CSS)

**A.1 Abertura (Carreira):** "Um DJ de funk que explora as vertentes mais agressivas e eufóricas."

**A.2 Bio (Carreira):**

1. "Brunin Tks é DJ e produtor de Porto Alegre (RS), ativo desde 2017, transitando entre o funk, drum and bass e o rap. Sua trajetória começa dentro de clubs da capital, em festas onde o rap, o trap e o funk em sua essência moldaram sua identidade sonora. Hoje, se posiciona como um DJ de funk que explora vertentes mais agressivas e eufóricas, passeando entre a bruxaria, o funk BH e a crueza do funk original sem censura, entregando sets intensos, de pista e com personalidade."
2. "É fundador da Savage e cofundador de movimentos importantes da cena underground como Boiler Baile, Sonora Breck e Sinistro DNB, contribuindo diretamente para a construção e fortalecimento da cultura na cidade. Ao longo da carreira, já integrou line-ups de grandes projetos como o festival Planeta Atlântida por três edições, além de passagens por eventos em diferentes estados como São Paulo, Santa Catarina e Paraná, consolidando seu nome no circuito do sul do país."
3. "Como produtor, suas faixas com forte influência do funk paulista já ultrapassaram fronteiras, sendo tocadas em festas na França e na Espanha. Hoje, Brunin Tks faz parte de uma geração relevante de DJs de funk da capital, sendo reconhecido como referência dentro da cena e vivendo integralmente de sua arte há anos."

**A.3 Produções:**

- **Intro:** "Brunin Tks é responsável por alguns dos projetos mais relevantes da cena underground do sul do país, assinando a criação e direção de festas como Savage, Boiler Baile, Sonora Breck e Sinistro DNB. Seus eventos se destacam pela identidade forte, curadoria afiada e conexão direta com a cultura de rua, transitando entre o funk, o rap e a música eletrônica."
- **Savage:** "Seu projeto mais longevo, se consolidou como uma das primeiras festas da cidade a inserir sonoridades como bruxaria e drill em pista, mantendo até hoje sua essência crua e seu papel como espaço aberto para a juventude e o funk agressivo."
- **Boiler Baile:** "Se tornou um dos maiores movimentos underground de Porto Alegre, marcada pela fusão entre funk e eletrônico, chegando a reunir mais de duas mil pessoas em uma única edição e expandindo sua atuação para outros estados."
- **Sonora Breck:** "Vem ganhando destaque ao conectar diferentes vertentes das ruas e impulsionar artistas periféricos em palcos maiores."
- **Sinistro DNB:** "Representa a nova geração do gênero na cidade, promovendo encontros entre diferentes épocas e sonoridades."
- **Fechamento:** "À frente desses projetos, Brunin atua na curadoria, direção criativa e operação, além de ser DJ residente em todos eles, construindo uma cena cultural forte, diversa e em constante expansão no sul do país."

**A.4 Sets:**

- **Intro:** "Dos bailes que viraram memória aos sets que rodaram o Brasil e a Europa, cada apresentação representa um avanço na sua caminhada. Seja em vídeo ou nas plataformas, é onde sua identidade se transformou em som e conexão real com o público."
- **Mais tocados:**
  - "15 minutinhos pra derrubar noia no submundo": 51 mil+ plays
  - "13 minutinhos pra espancar ouvido de noite": 47 mil+ plays
  - "Set espanca pedinte de música": 40 mil+ plays
- **Parágrafo:** "Brunin Tks acumula mais de 288 mil plays em seus sets online, construindo uma presença sólida nas redes com mixes marcados por transições precisas, impacto e energia de pista. Seus trabalhos transitam entre o funk bruxaria, funk BH e o drum and bass, sempre com foco em intensidade e identidade sonora. Além das plataformas, já participou de projetos e rádios como Onze Bar, Senso Radio, Trinka, Lóbulo, Function, Guilda, Veneno e Relativa, em Madri. Seus lançamentos são pontuais e estratégicos, priorizando qualidade e impacto em cada entrega."

**A.5 Line-up:** "Brunin Tks já dividiu line-ups com nomes de destaque do cenário nacional e com artistas e DJs relevantes do circuito underground, reforçando sua presença tanto em grandes palcos quanto nos principais movimentos da cena alternativa."
