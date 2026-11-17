# Press kit Brunin Tks — Rodada 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sets enquadrados no Bruno no celular em pé, o line-up como cartaz de festival e uma agenda de próximos shows atualizada sozinha pelo Ayon.

**Architecture:** Site estático (HTML/CSS/ES modules, GSAP + ScrollTrigger, Lenis).
- **Sets:** ganham versões verticais `-cel`. Um módulo escolhe a versão pela orientação, sem baixar nada antes da hora.
- **Cartaz:** substitui o bloco de nomes e anima com um `scrub` só.
- **Agenda:** é um bloco entre marcadores no `index.html`, gerado por funções puras (`tools/agenda-dados.mjs`). Quem chama essas funções é um robô Node (`tools/agenda.mjs`), que roda a cada 6 h num GitHub Actions, faz commit na `main` só quando algo muda e pede a publicação do Pages pela API.

**Tech Stack:**
- Já existentes: GSAP 3.12.5, ScrollTrigger, Lenis; `node --test`; puppeteer-core (e2e); ffmpeg + yt-dlp (vídeos).
- Novo: `sharp` (devDependency, só no robô).

**Spec:** `docs/superpowers/specs/2026-11-16-presskit-rodada-5-design.md`

## Global Constraints

- Caminhos sempre relativos: o site mora em `https://wesleymignot.github.io/siteTks/`.
- Movimento reduzido, modo estático (sem GSAP) e sem JS continuam funcionando em todas as mudanças.
- Testes:
  - unitários: `node --test "tests/unit/*.test.mjs"`;
  - e2e: `node --test --test-concurrency=1 tests/e2e/*.test.mjs`;
  - suíte: `npm test`.
- Nada novo carregado no navegador.
- Versões `-cel`:
  - vídeo: 540 × 960, 24 fps, sem áudio, `+faststart`, ≤ 700 KB;
  - pôster: em início + 0,6 s, ≤ 120 KB.
- Flyers da agenda: `assets/agenda/<slug>.jpg`, 640 px de largura, ≤ 120 KB.
- Datas da agenda: fuso `America/Sao_Paulo`, pt-BR. No máximo 6 eventos, do mais próximo ao mais distante.
- Fim de um evento: `endDate`, ou início + 6 h se não houver `endDate`.
- Textos fixos da agenda:
  - rótulo "Nº 005 — Agenda";
  - título "Próximos shows";
  - estado vazio: "Agenda aberta" e "Nenhuma data anunciada agora. Quer o Brunin Tks no seu line?", com o botão "Contrate ↓";
  - rodapé: "Agenda completa no Ayon ↗", apontando para `https://useayon.com/djbrunintks`.
- Robô:
  - User-Agent: `siteTks-agenda (+https://wesleymignot.github.io/siteTks/)`;
  - marcadores: `<!-- agenda:inicio -->` e `<!-- agenda:fim -->`;
  - mensagem de commit: "agenda: atualiza pelo Ayon".
- Tudo que vem do Ayon é dado não confiável:
  - texto entra no HTML escapado;
  - só URLs `https:` são aceitas.

## Review Focus

1. **Texto do Ayon com `&`, `<`, `"` ou uma URL `javascript:`:** tem de aparecer como texto e o link não pode ser criado. Teste na Task 3: `renderizarAgenda escapa texto e recusa URL que não é https`.
2. **Evento sem `endDate`, ou com `startDate` em outro fuso (`Z`):** o fim vira início + 6 h e a hora mostrada é a de São Paulo. Teste na Task 3: `lerPerfil: fim padrão e fuso`.
3. **Show que já começou e ainda não acabou:** continua na agenda. Teste na Task 3: `proximos mantém o show em andamento`.
4. **Girar o celular com o set tocando:** troca para a outra versão e continua tocando. Teste na Task 1: `girar com o set tocando troca a versão e segue tocando`.
5. **Nome de evento longo ou line-up enorme num celular de 320 px:** o carrossel rola por dentro e a página não ganha rolagem horizontal. Teste na Task 4: `agenda em 320 px sem rolagem lateral da página`.

---

### Task 1: Sets no celular (versões `-cel` enquadradas no Bruno)

**Files:**
- Modify:
  - `tools/baixar-sets.sh` (1080p só do trecho, colunas `foco` e `topo`, saída `-cel`);
  - `tools/baixar-reels.sh` (colunas `foco` e `topo` em `sets/reel-c`, saída `-cel`);
  - `index.html` (os 6 `<video class="set__video">` horizontais);
  - `js/util.js`, `js/sets.js`, `js/main.js`.
- Create: `assets/video/sets/{senso,grau,ataque,veneno-lab,sensi,reel-c}-cel.{mp4,jpg}`.
- Test: `tests/unit/util.test.mjs`, `tests/unit/assets.test.mjs`, `tests/e2e/sets.test.mjs`.

**Interfaces:**
- Produces:
  - `escolherVersaoSet({ src, srcCel, poster, posterCel }, retrato: boolean) → { src: string, poster: string }`, em `js/util.js`;
  - `iniciarVersoesSets(): void`, em `js/sets.js`, chamado em `main.js` com `seguro('versoes-sets', …)` antes de `sets`.

**Valores (da spec §5.2):**

| nome | fonte | início | duração | foco | topo |
|---|---|---|---|---|---|
| senso | 5ackC9W3BIs | 1110 | 4 | 0.25 | 0 |
| grau | 2Z2gP9W9Epo | 600 | 4 | 0.47 | 0 |
| ataque | PuYyCp85V9U | 1515 | 4 | 0.86 | 0.14 |
| veneno-lab | SLUUZG8-oYA | 1440 | 4 | 0.50 | 0 |
| sensi | IP9V-06-QJw | 1355 | 4 | 0.84 | 0 |
| reel-c | DG_97MaOjeD (reel, `transpose=2`) | 1.5 | 4 | 0.50 | 0 |

**Recorte (filtro do ffmpeg):**
- altura do recorte `ch = ih·(1 − topo)`;
- largura `cw = ch·9/16`;
- `x = clamp(foco·iw − cw/2, 0, iw − cw)`;
- `y = ih·topo`;
- depois `scale=540:960`.

- [ ] **Step 1: Testes que falham**
  - `util.test.mjs`, teste `escolherVersaoSet: retrato usa a versão do celular quando existe`:
    - `escolherVersaoSet({src:'a.mp4',srcCel:'a-cel.mp4',poster:'a.jpg',posterCel:'a-cel.jpg'}, true)` deve ser `{src:'a-cel.mp4',poster:'a-cel.jpg'}`;
    - com `false`, deve ser `{src:'a.mp4',poster:'a.jpg'}`;
    - sem `srcCel` e `true`, mantém o `src` e o `poster` atuais.
  - `assets.test.mjs`, teste `versões -cel dos 6 sets horizontais cabem no orçamento`: para cada nome da tabela, `tam(…-cel.mp4) <= 700_000` e `0 < tam(…-cel.jpg) <= 120_000`.
  - `sets.test.mjs`:
    - `celular em pé escolhe a versão -cel sem pré-carregar`: em 390×844, todo `.set__video` com `data-src-cel` tem `dataset.src` terminando em `-cel.mp4`, `poster` terminando em `-cel.jpg` e nenhum atributo `src`;
    - `computador e celular deitado usam a versão atual`: em 1440×900 e 844×390, `dataset.src` não termina em `-cel.mp4`;
    - `girar com o set tocando troca a versão e segue tocando`: em 390×844, rola até o set 1 tocar e muda o viewport para 844×390; o `src` do vídeo 1 passa a não ter `-cel` e `!paused`;
    - `movimento reduzido no celular mostra o pôster -cel`: com `menosMovimento: true` e 390×844, o `poster` dos 6 termina em `-cel.jpg`.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `node --test tests/unit/util.test.mjs tests/unit/assets.test.mjs` e `node --test --test-concurrency=1 tests/e2e/sets.test.mjs`
  - Expected: FAIL. `escolherVersaoSet` não existe, faltam os arquivos `-cel` e falta `data-src-cel`. Os testes antigos de `sets.test.mjs` continuam passando.

- [ ] **Step 3: Gerar as versões `-cel`**
  - **`baixar-sets.sh`:**
    - `baixar` traz só o trecho em 1080p para `bruto/sets/<nome>-1080.mp4` (`yt-dlp -S res:1080 --download-sections "*INI-FIM" --force-keyframes-at-cuts`, FIM = início + duração + 1);
    - `cortar` gera `<nome>-cel.mp4` (crf 30, preset slow) e `<nome>-cel.jpg` (em 0,6 s, `-q:v 4`) com o recorte acima;
    - a tabela `TRECHOS` ganha as colunas `foco` e `topo`.
  - **`baixar-reels.sh`:** `sets/reel-c` ganha `foco`/`topo`, e o `cortar` gera também `reel-c-cel` a partir do reel endireitado.
  - **Conferência:** rode os dois, monte uma folha de quadros de cada `-cel` (`fps=1,tile=4x1`) e confira duas coisas:
    - o Bruno está dentro do quadro nos 4 s;
    - nenhuma marca de canal aparece fora dos 40% de baixo.
  - Se algo falhar, ajuste `topo`/`foco` e registre uma ruling.

- [ ] **Step 4: HTML, `escolherVersaoSet` e `iniciarVersoesSets`**
  - **HTML:** os 6 vídeos ganham `data-src-cel` e `data-poster-cel`.
  - **`iniciarVersoesSets`:**
    - na primeira chamada, guarda os valores originais em `data-src-pc` e `data-poster-pc`;
    - aplica `escolherVersaoSet` com `matchMedia('(orientation: portrait)').matches`, trocando `dataset.src` e `poster`;
    - se o vídeo já tem `src`, troca o `src` e, se estava tocando, chama `play()` (rejeição ignorada);
    - ouve `change` do `matchMedia`.

- [ ] **Step 5: Rodar e ver passar**
  - Run: os mesmos comandos do Step 2.
  - Expected: PASS, incluindo os testes antigos de `sets.test.mjs`.

- [ ] **Step 6: Commit**
  ```bash
  git add tools/baixar-sets.sh tools/baixar-reels.sh index.html js/util.js js/sets.js js/main.js assets/video/sets tests
  git commit -m "feat: sets no celular em pé com versões verticais enquadradas no Bruno"
  ```

### Task 2: Line-up em cartaz de festival

**Files:**
- Modify:
  - `index.html` (`.cartaz` e `.lineup__palcos` de `#lineup`);
  - `css/secoes.css` (regras `.cartaz*` e `.lineup__palcos*`);
  - `js/animacoes.js` (`iniciarCartaz`).
- Test: `tests/unit/conteudo.test.mjs`, `tests/e2e/final.test.mjs`, `tests/e2e/revisao.test.mjs`.

**Interfaces:**
- Consumes: `.div-morcego` (trocado por morcego em `iniciarDivisores`) e `.cartaz__nome`/`.cartaz__par` (nome + morcego `nowrap`).
- Produces: a estrutura abaixo, que é a usada pelos testes.
  - `.cartaz > .cartaz__folha` contém:
    - `.cartaz__topo`;
    - `.cartaz__n1`, `.cartaz__n2` e `.cartaz__n3`, cada um com `.cartaz__par`/`.cartaz__nome` e as vírgulas `visualmente-oculto` de hoje;
    - `.cartaz__pe`;
    - `.cartaz__selo`, com texto oculto "3 edições do Planeta Atlântida".

**Nomes (spec §6.1):**
- **n1:** KL Jay, Rincon Sapiência.
- **n2:** Pocah, Raffa Moreira, MC Binn, MC Felipinho, Wesley Gonzaga, Nanda Tsunami.
- **n3:** DJ Patife, Caio Prince, Bonekinha Iraquiana, Ramon Sucesso, Young Clubber, Carlos do Complexo, Idlibra, Dayeh, Bassan, Kenan e Kel, DJ Lorrany, Brum.
- **Rodapé:** "Palcos, festas e rádios", seguido de Onze Bar · Senso Radio · Trinka · Lóbulo · Function · Guilda · Veneno · Relativa (Madri).
- **Morcegos:** 1 + 5 + 11 = 17.

- [ ] **Step 1: Testes que falham**
  - `conteudo.test.mjs`, teste `cartaz: níveis, rodapé e selo`: os nomes de `.cartaz__n1`, `.cartaz__n2` e `.cartaz__n3` (por regex no HTML) são exatamente as listas acima; `.cartaz__selo` contém "3 edições do Planeta Atlântida"; não existe `lineup__palcos`.
  - `final.test.mjs`: troque os três testes de cartaz por:
    - `cartaz: 2 + 6 + 12 nomes separados por 17 morcegos`;
    - `cartaz: leitor de tela ouve os nomes separados`, cobrindo n1, n2 e n3 (a junção dos textos é `nomes.join(', ')`);
    - `cartaz: legível no ponto de leitura`: rola até o centro do `.cartaz__folha` ficar no meio da tela; opacidade de n1, n2, n3, pé e selo > 0,95; `matrix` do `.cartaz__folha` com giro de −2° ± 0,5°;
    - `cartaz: nenhum nome quebrado nem morcego abrindo linha` em 1440, 390 e 320: cada `.cartaz__nome` tem uma única linha (`getClientRects().length === 1`), e nenhum `.div-morcego` tem `left` menor que o `left` do nome do mesmo par.
  - `final.test.mjs`, teste `line-up com todos os nomes`: as listas passam a ser n1 + n2 + n3, e o texto também precisa ter "Planeta Atlântida" e "Relativa".
  - `revisao.test.mjs`, teste `movimento reduzido: cartaz todo aceso e dentro da tela`: verifica `.cartaz__folha` parado (sem `translate`) e os nomes com opacidade 1 dentro da tela.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `node --test tests/unit/conteudo.test.mjs` e `node --test --test-concurrency=1 tests/e2e/final.test.mjs tests/e2e/revisao.test.mjs`
  - Expected: FAIL nos testes de cartaz.

- [ ] **Step 3: HTML e CSS do cartaz**
  - **Folha:** preta com grão e texto creme; `rotate(-2deg)` como estado final no CSS; largura `min(1080px, 100% - 2*var(--gutter))`.
  - **Tamanhos:** `clamp(46px, …, 104px)`, `clamp(29px, …, 64px)` e `clamp(10.5px, …, 15px)`. Os níveis 1 e 2 usam `text-wrap: balance`.
  - **Morcegos:** vermelhos.
  - **Selo:** vermelho, redondo, saindo do canto superior direito.
  - **O que sai:** as pílulas `.lineup__palcos`, o `.cartaz__rotulo` antigo e as regras `.anima-cartaz`.

- [ ] **Step 4: `iniciarCartaz({ gsap, menosMovimento })`**
  - Retorna cedo com `menosMovimento`.
  - Uma timeline com `scrollTrigger: { trigger: '.cartaz', start: 'top bottom', end: 'center center', scrub: true }`. As posições, numa duração total de 1, são:
    - folha de `{ yPercent: 75, rotate: -8 }` até `{ yPercent: 0, rotate: -2 }` em 0–0,32;
    - n1, n2, n3 e pé de `{ opacity: 0, scale: 1.25 }` até `{ opacity: 1, scale: 1 }` em 0,32, 0,42, 0,52 e 0,58 (duração 0,1 cada);
    - selo de `{ opacity: 0, scale: 2.2, rotate: -30 }` até `{ opacity: 1, scale: 1, rotate: 12 }` em 0,68;
    - `.set({}, {}, 1)`.

- [ ] **Step 5: Rodar e ver passar**
  - Run: os comandos do Step 2.
  - Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add index.html css/secoes.css js/animacoes.js tests
  git commit -m "feat: line-up vira cartaz de festival (Nanda Tsunami no destaque)"
  ```

### Task 3: Dados da agenda (funções puras)

**Files:**
- Create:
  - `tools/agenda-dados.mjs`;
  - `tests/fixtures/ayon/perfil.json` e `tests/fixtures/ayon/evento-{nimbo,boiler,sonora}.json`. Só os blocos JSON-LD já parseados, tirados das páginas reais de 16/11/2026, no formato `{ "jsonld": [ … ] }`.
- Test: `tests/unit/agenda.test.mjs`.

**Interfaces:**
- Produces, todas exportadas de `tools/agenda-dados.mjs`:
  - `lerJsonLd(html: string) → object[]`: todos os `<script type="application/ld+json">` válidos.
  - `lerPerfil(jsonld: object[]) → EventoBase[]`.
    - `EventoBase = { slug, nome, inicio, fim, local, cidade, imagem: string|null, pagina }`.
    - `slug` é o último trecho do caminho da `url`.
    - Lança `Error('formato do Ayon mudou: …')` sem `Person` com `@id` terminando em `#profile`, ou com um `Event` sem `name`, sem `startDate` válido ou sem `url`.
  - `lerEvento(jsonld: object[]) → { ingresso: string|null, line: string[] }`: `offers.url` e `performer[].name`, crus.
  - `limparLine(nomes: string[]) → string[]`: regra da spec §7.5.
  - `proximos(eventos: EventoBase[], agora: Date, max = 6) → EventoBase[]`.
  - `formatarData(iso: string) → { dia, mes, semana, hora }`: por exemplo `{ dia:'21', mes:'nov', semana:'sáb', hora:'19:00' }`.
  - `renderizarAgenda(eventos: Evento[]) → string`.
    - `Evento = EventoBase & { ingresso: string|null, line: string[], flyer: string|null }`.
    - `flyer` é um caminho relativo `assets/agenda/<slug>.jpg`, ou `null`.
  - `trocarBloco(html: string, bloco: string) → string`: lança erro sem os dois marcadores.

**Marcação que `renderizarAgenda` gera** (é ela que a Task 4 estiliza e o JS lê):
- `<div class="agenda__cartoes">` com um `<article class="evento" data-fim="ISO">` por evento.
- Cada `article` contém:
  - `img.evento__flyer`, com `alt="Flyer de NOME"`, `width="640"`, `height="336"`, `loading="lazy"` e `decoding="async"`, ou `div.evento__flyer.evento__flyer--vazio` com `aria-hidden`;
  - `p.evento__selo` com `aria-hidden`, contendo `span.titulo` (dia) e `span.rotulo` (mês);
  - `div.evento__corpo`, com:
    - `p.evento__quando.rotulo`, contendo `<time datetime=início>` com o dia da semana, a data oculta e a hora, seguido de " · " e do local;
    - `h3.evento__nome.titulo`;
    - `p.evento__line`, só se houver nomes, no formato "com <b>A, B, C</b> +N";
    - `a.evento__link.botao`, com o texto "Ingressos ↗" (ou "Ver evento ↗" sem ingresso) e o nome do evento em `visualmente-oculto`, `target="_blank"` e `rel="noopener"`.
- Depois vem sempre `<div class="agenda__vazia">`, com `hidden` quando há eventos e sem `hidden` quando a lista está vazia (aí `.agenda__cartoes` não sai). Ele contém "Agenda aberta", o texto e `a.botao` "Contrate ↓" com `href="#contrate"`.

- [ ] **Step 1: Testes que falham** (`tests/unit/agenda.test.mjs`)
  - `lerPerfil lê os 3 próximos do perfil real`: nomes `['ESTREIA NIMBO NO CÉU', 'Boiler Baile • Gran Finale', 'Última Sonora Breck Do Ano Ft Gp Da Zl']`, slugs a partir das urls, local "Céu zona sul" e cidade "Porto Alegre".
  - `lerPerfil: fim padrão e fuso`: um `Event` sem `endDate`, com `startDate` `2026-11-21T22:00:00Z`, dá `fim` 6 h depois, e `formatarData` dá `hora` "19:00", `semana` "sáb", `dia` "21" e `mes` "nov".
  - `lerPerfil recusa formato desconhecido`: lança erro com `[]`, sem `Person` e com `Event` sem `startDate`.
  - `lerEvento lê ingresso e line`: boiler dá ingresso `https://shotgun.live/events/boiler-baile-gran-finale` e 10 nomes.
  - `limparLine`:
    - `['Brunin TKS b2b Dalberth','Pedro Bala (SP)']` vira `['Dalberth (b2b)','Pedro Bala (SP)']`;
    - `['emersxxn — Warm-up','Brunin TKS — Contenção','TURVA — Convidada']` vira `['emersxxn','TURVA']`;
    - `['brunin tks']` vira `[]`.
  - `proximos mantém o show em andamento`: com `agora` entre início e fim, o show entra; com `agora` depois do fim, sai; ordena por início e corta em 6.
  - `renderizarAgenda gera cartões e estado vazio`:
    - com os 3 eventos (flyer `null`), dá 3 `class="evento"`, o `data-fim` certo, "Ingressos ↗" e `agenda__vazia" hidden`;
    - sem ingresso, dá "Ver evento ↗" apontando para a página do Ayon;
    - com `[]`, não tem `agenda__cartoes` e tem "Agenda aberta" visível.
  - `renderizarAgenda escapa texto e recusa URL que não é https`: um nome `<b>&"x"</b>` aparece escapado; ingresso `javascript:alert(1)` vira "Ver evento ↗"; imagem `http://…` vira `flyer` `null`.
  - `trocarBloco`: troca só o que está entre os marcadores e lança erro sem eles.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `node --test tests/unit/agenda.test.mjs`
  - Expected: FAIL (o módulo não existe).

- [ ] **Step 3: Implementar `tools/agenda-dados.mjs`**
  - Sem dependências.
  - `formatarData` usa `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', … })` e tira os pontos ("sáb.", "nov.").
  - A validação de URL aceita só `new URL(u).protocol === 'https:'`.

- [ ] **Step 4: Rodar e ver passar**
  - Run: `node --test tests/unit/agenda.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add tools/agenda-dados.mjs tests/fixtures/ayon tests/unit/agenda.test.mjs
  git commit -m "feat: funções puras da agenda (leitura do Ayon, filtro, marcação escapada)"
  ```

### Task 4: Seção Agenda no site

**Files:**
- Modify:
  - `index.html`: seção `#agenda` entre `#lineup` e `#assinatura`; menu com "Nº 005 Agenda"; Contrate passa a "Nº 006" no menu e no `.contrate__num`.
  - `css/secoes.css`: `.agenda*` e `.evento*`.
  - `js/util.js`, `js/main.js`.
- Create: `js/agenda.js`.
- Test: `tests/unit/conteudo.test.mjs`, `tests/unit/util.test.mjs`, `tests/e2e/agenda.test.mjs` (novo), `tests/e2e/base.test.mjs`, `tests/e2e/rodada2.test.mjs`, `tests/e2e/responsivo.test.mjs`.

**Interfaces:**
- Consumes: `renderizarAgenda` e `trocarBloco` (Task 3).
- Produces:
  - `passou(fimIso: string, agora: Date) → boolean`, em `js/util.js`;
  - `iniciarAgenda(agora = new Date()): void`, em `js/agenda.js`, chamado em `main.js` com `seguro('agenda', …)` em qualquer modo.

**Seção** (o bloco interno vem da Task 3):
- `section#agenda.agenda.chamas-topo`, com `aria-labelledby="t-agenda"` e sem `data-tema` (escura). Contém:
  - `.agenda__topo`, com o rótulo e o `h2#t-agenda`;
  - `.agenda__conteudo`, com os marcadores;
  - `p.agenda__ayon.rotulo`, com o link do Ayon (nova aba, `noopener`).
- **Conteúdo inicial entre os marcadores:** `renderizarAgenda` dos 3 eventos das fixtures, com `flyer: null` (sem 404). A Task 5 troca pelo real.
- **CSS** (como no protótipo, opção B):
  - computador: grade de 3 colunas;
  - celular (`max-width: 820px`): `display:flex; overflow-x:auto; scroll-snap-type:x mandatory`, cartões `flex: 0 0 min(300px, 82%)`, `scroll-snap-align: start`.

- [ ] **Step 1: Testes que falham**
  - `util.test.mjs`, teste `passou`: `passou('2026-11-22T02:00:00-03:00', new Date('2026-11-22T05:00:01Z'))` é `true`; com `…04:59:59Z`, `false`.
  - `conteudo.test.mjs`:
    - `agenda entre o line-up e a assinatura, com marcadores`: a ordem dos `<section id=` é hero, carreira, numeros, producoes, sets, lineup, agenda, assinatura, contrate. Há exatamente um `<!-- agenda:inicio -->` antes de um `<!-- agenda:fim -->`, dentro de `#agenda`.
    - `menu e numeração`: o menu tem `#agenda` com "Nº 005" e `#contrate` com "Nº 006", e o `.contrate__num` mostra "Nº 006".
  - `base.test.mjs` e `rodada2.test.mjs`: as listas de seções e de links do menu ganham `agenda`/`#agenda` na posição certa.
  - `responsivo.test.mjs`: `SECOES` ganha `#agenda` depois de `#lineup`.
  - `tests/e2e/agenda.test.mjs`:
    - **Relógio sempre controlado,** nunca o real. Use `abrir(amb, { antes: p => p.evaluateOnNewDocument(adiantarRelogio, ms) })`. `adiantarRelogio` desloca `Date` e `Date.now` por `ms` (diferença entre o instante simulado e o real). Os `data-fim` são lidos do `index.html` em disco; se não houver nenhum, os testes de cartão são pulados com `t.skip`.
    - `cartões aparecem antes do primeiro show`: o relógio fica 1 dia antes do primeiro início; todos os `.evento` estão visíveis; `.agenda__vazia` está `hidden`; cada `.evento__link` tem `target=_blank` e `rel` com `noopener`.
    - `show que passou some`: o relógio fica 1 min depois do `data-fim` do primeiro; ele fica `hidden` e os outros não. Se houver um só, aparece "Agenda aberta".
    - `todos passados: agenda aberta`: o relógio fica 1 dia depois do último `data-fim`; nenhum `.evento` visível; `.agenda__vazia` visível; o link "Contrate ↓" leva a `#contrate`.
    - `agenda em 320 px sem rolagem lateral da página`: em 320×640, `document.documentElement.scrollWidth <= innerWidth`, e `.agenda__cartoes` tem `scrollWidth > clientWidth` quando há mais de 1 cartão.
    - `sem JS a agenda aparece como veio do robô`: com `semJs: true` e `esperarPronto: false`, o número de `.evento` é igual ao do `index.html`.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `node --test "tests/unit/*.test.mjs"` e `node --test --test-concurrency=1 tests/e2e/agenda.test.mjs tests/e2e/base.test.mjs tests/e2e/rodada2.test.mjs`
  - Expected: FAIL (não há seção, `passou` nem `#agenda` no menu).

- [ ] **Step 3: Implementar**
  - **Seção e menu no `index.html`:** gere o bloco inicial com um script avulso que importa `tools/agenda-dados.mjs` (não vai para o git).
  - **CSS** da seção. O `.evento__flyer--vazio` tem fundo `--preto` com textura e o `logo-creme.png` centralizado (spec §7.7).
  - **`passou`.**
  - **`iniciarAgenda`:** dá `hidden` aos `.evento` com `passou(data-fim)`; se nenhum ficar visível, dá `hidden` em `.agenda__cartoes` e tira de `.agenda__vazia`.
  - **`main.js`:** a chamada `seguro('agenda', () => iniciarAgenda())`, antes de `ancora`.

- [ ] **Step 4: Rodar e ver passar**
  - Run: os comandos do Step 2, e depois `npm test`.
  - Expected: PASS em tudo.

- [ ] **Step 5: Commit**
  ```bash
  git add index.html css/secoes.css js tests
  git commit -m "feat: seção Agenda com flyers, eventos passados escondidos e menu renumerado"
  ```

### Task 5: Robô da agenda (Ayon → site) e workflow

**Files:**
- Create:
  - `tools/agenda.mjs`;
  - `.github/workflows/agenda.yml`;
  - `assets/agenda/*.jpg` (gerados pela primeira execução).
- Modify: `package.json` e `package-lock.json` (`sharp` em devDependencies); `index.html` (bloco real).
- Test: `tests/unit/assets.test.mjs`, `tests/unit/agenda.test.mjs`.

**Interfaces:**
- Consumes: todas as funções da Task 3.
- Produces: `node tools/agenda.mjs`. Ao terminar, imprime uma linha por evento e "sem mudanças" ou "agenda atualizada". Sai com código 1 em erro, sem gravar nada.

**Fluxo do `tools/agenda.mjs`:**
1. Busca o perfil e passa por `lerJsonLd` → `lerPerfil` → `proximos(…, new Date())`.
2. Para cada evento, busca a página e passa por `lerJsonLd` → `lerEvento` → `limparLine`. Se essa busca falhar, usa `{ ingresso: null, line: [] }`.
3. Baixa o `imagem` e o reduz com `sharp().resize({ width: 640 }).jpeg({ quality })`, baixando a qualidade de 5 em 5 a partir de 78 até caber em 120 KB. Grava em `assets/agenda/<slug>.jpg`. Se falhar, `flyer: null`.
4. Apaga de `assets/agenda/` os `.jpg` que não estão na lista.
5. Aplica `trocarBloco(index, renderizarAgenda(eventos))` e só grava se mudou.

Toda requisição usa o User-Agent fixado e um timeout de 20 s.

**Workflow `agenda.yml`:**
- `on: schedule: [{ cron: '17 */6 * * *' }]` e `workflow_dispatch`;
- `permissions: { contents: write, pages: write }`;
- `concurrency: { group: agenda, cancel-in-progress: false }`;
- um job `ubuntu-latest` com os passos:
  1. `actions/checkout@v5`;
  2. `actions/setup-node@v5` com `node-version: 'lts/*'` e `cache: npm`;
  3. `npm ci`;
  4. `node tools/agenda.mjs`;
  5. publicação: `if git status --porcelain -- index.html assets/agenda | grep -q .`, configura o autor `github-actions[bot]` (`41898283+github-actions[bot]@users.noreply.github.com`), faz `git add index.html assets/agenda`, `git commit -m "agenda: atualiza pelo Ayon"` e `git push`, e depois `gh api -X POST "repos/${{ github.repository }}/pages/builds"` com `GH_TOKEN: ${{ github.token }}`.

- [ ] **Step 1: Testes que falham**
  - `assets.test.mjs`, teste `flyers da agenda`: todo `assets/agenda/*.jpg` tem ≤ 120 000 bytes, e todo `src="assets/agenda/…"` do `index.html` existe em disco.
  - `agenda.test.mjs`, teste `workflow da agenda`: o texto de `.github/workflows/agenda.yml` contém `cron: '17 */6 * * *'`, `workflow_dispatch`, `contents: write`, `pages: write`, `node tools/agenda.mjs`, `agenda: atualiza pelo Ayon` e `pages/builds`.

- [ ] **Step 2: Rodar e ver falhar**
  - Run: `node --test tests/unit/assets.test.mjs tests/unit/agenda.test.mjs`
  - Expected: FAIL (o workflow não existe; o teste de flyers passa vazio até a execução real, e isso está certo).

- [ ] **Step 3: Implementar e rodar contra o Ayon real**
  - `npm install -D sharp`; escrever `tools/agenda.mjs` e o workflow.
  - Run: `node tools/agenda.mjs`
  - Expected: uma linha por evento futuro, "agenda atualizada", flyers em `assets/agenda/` e o bloco do `index.html` com os eventos reais.
  - Run de novo.
  - Expected: "sem mudanças", com o `git status` limpo para `index.html` e `assets/agenda`.

- [ ] **Step 4: Rodar e ver passar**
  - Run: `npm test`
  - Expected: PASS em tudo.

- [ ] **Step 5: Commit**
  ```bash
  git add tools/agenda.mjs .github/workflows/agenda.yml package.json package-lock.json index.html assets/agenda tests
  git commit -m "feat: robô da agenda lê o Ayon a cada 6 h, grava flyers e pede publicação do Pages"
  ```

### Task 6: Documentação e varredura

**Files:**
- Modify: `README.md`; `tests/e2e/responsivo.test.mjs` (só se a Task 4 não tiver coberto os prints da agenda e do cartaz).

O README cobre:
- **Sets:** versões `-cel`, colunas `foco`/`topo` e como regenerar.
- **Cartaz:** níveis e onde mudar os nomes.
- **Agenda:**
  - como funciona (Ayon → robô a cada 6 h → commit → publicação);
  - como rodar à mão (`node tools/agenda.mjs` local, ou Actions → Agenda → Run workflow);
  - o que fazer quando falha (e-mail do GitHub, agenda parada na última versão boa);
  - como reativar o agendamento pausado;
  - `git pull` antes de criar uma branch, porque o robô faz commits na `main`.

- [ ] **Step 1:** Escrever o README.
- [ ] **Step 2:** Run: `npm test`. Expected: PASS em tudo. Abra os prints de `responsivo` da agenda e do cartaz em 1440, 390 e 320 e confira.
- [ ] **Step 3: Commit**
  ```bash
  git add README.md tests
  git commit -m "docs: README da rodada 5 (sets -cel, cartaz, robô da agenda)"
  ```
