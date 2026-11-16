# Brunin Tks — Press kit

Site de press kit de uma página. HTML, CSS e JS puros, sem build. Usa GSAP + ScrollTrigger e Lenis via CDN.

- Spec: `docs/superpowers/specs/2026-11-09-presskit-brunin-tks-design.md`
- Direções de identidade (a escolhida foi a C): `docs/identidade/direcoes.html`

## Rodar localmente

```bash
python -m http.server 8765
# abrir http://localhost:8765
```

Abrir o `index.html` direto pelo explorador de arquivos (`file://`) não funciona, porque os ES modules exigem um servidor.

## Testes

```bash
npm i
npm test            # unitários + navegador
npm run test:unit   # só funções puras (node --test)
npm run test:e2e    # Chrome headless via puppeteer-core
```

Os testes de navegador usam o Chrome instalado em `C:/Program Files/Google/Chrome/Application/chrome.exe`. Para usar outro caminho, defina `CHROME_PATH`. Os prints da varredura final ficam em `tests/e2e/telas/` e não vão para o git.

## Regenerar os assets

O material bruto fica na raiz e não vai para o git: o PDF do press kit, o `2 REELS.mp4`, o logo, os ZIPs das fotos e as fotos das Produções (`Savage.jpg`, `boiler.jpg`, `Sonora.jpg`). Os vídeos baixados ficam em `bruto/`, também fora do git.

```bash
pip install -r tools/requirements.txt
python tools/tratar-fotos.py          # foto da Carreira, fotos das Produções, og.jpg, presskit.pdf
                                      # (ou só uma etapa: fotos | producoes | og | pdf)
bash tools/cortar-video.sh            # vídeo de fundo do hero, do 2 REELS.mp4 (precisa de ffmpeg)
bash tools/baixar-reels.sh baixar     # reels do Instagram → bruto/reels/ + folhas de quadros
bash tools/baixar-reels.sh cortar     # janela do hero (720/540, os 10 s iniciais), fundo dos sets 6–8 e reel-c-cel
bash tools/baixar-sets.sh baixar      # vídeos dos sets no YouTube (720p) + o trecho em 1080p → bruto/sets/
bash tools/baixar-sets.sh cortar      # trechos de 4 s dos sets 1–5 e as versões do celular (<nome>-cel)
bash tools/baixar-sets.sh celular     # só as versões do celular (também em baixar-reels.sh)
python tools/gerar-texturas.py        # faixas de chamas (repetem sem emenda)
node tools/agenda.mjs                 # agenda: lê o Ayon e atualiza a seção #agenda (ver "Agenda")
python tools/tracar-morcego.py docs/identidade/morcego_ref.jpg   # contorno do morcego (js/morcego.js)
```

No Windows, rode os scripts de download com `PY=<caminho do python.exe>`: o atalho `.bat` do pyenv estraga os argumentos do yt-dlp. O YouTube recusa versões antigas do yt-dlp ("The page needs to be reloaded"): atualize com `pip install -U yt-dlp` (precisa do Node no PATH, usado em `--js-runtimes node`).

## Como os morcegos funcionam

- `js/morcego.js`: a silhueta (contorno do `morcego_ref`) com as asas articuladas; a batida tem 32 quadros pré-calculados, usados nos divisores (SVG) e nos canvases. Os morcegos vermelhos das viradas levam um contorno preto de 1 px, já desenhado em "carimbos" (bitmaps por quadro e tamanho, `criarCarimbos`): desenhar o contorno na hora custava ~4× o quadro no Safari.
- `js/ceu.js`: um canvas fixo por cima da página desenha as faixas das viradas (Produções e Sets) e os morcegos da Assinatura. Na virada, uma faixa ondulada (1,6× a largura da tela) atravessa da esquerda para a direita e, no pico, cobre a largura inteira. Só anima quando alguma cena está na tela.
- `js/assinatura.js`: a chegada pelos quatro lados e o "Brunin" formado; o palco desenha só a tinta das letras.
- Movimento reduzido ou sem GSAP: sem céu; a assinatura aparece pronta, com os pousados parados.

## Card do hero

O card mostra o reel inteiro (9:16) desde o começo. Na rolagem, a janela abre até a tela toda e o vídeo cresce junto: só `transform`, do retângulo do card até o final (`fimDaJanela` em `js/util.js`), com a altura da tela, encostado à direita no computador e centralizado no celular. As bordas do vídeo esfumam no preto da janela.

## Sets no celular

No celular em pé, os 6 sets horizontais usam uma versão vertical própria (`assets/video/sets/<nome>-cel.mp4` e `.jpg`, 540×960), recortada do trecho em 1080p em cima do Bruno. Na tabela `TRECHOS` de `tools/baixar-sets.sh` (e `CELULAR` de `tools/baixar-reels.sh`), `foco` é o centro do recorte em fração da largura do quadro original e `topo` é quanto cortar em cima para tirar as marcas dos canais (Senso 0,09; Ataque 0,14). `iniciarVersoesSets` (`js/sets.js`) troca `data-src` e pôster pela orientação, sem baixar nada antes da hora; girar o aparelho troca a versão. Para conferir um recorte: `ffmpeg -i assets/video/sets/<nome>-cel.mp4 -vf "fps=1,tile=4x1" folha.png`.

## Line-up em cartaz

O "Já dividiu o line com" é um cartaz de festival (`.cartaz__folha` em `index.html`): nível 1 (`.cartaz__n1`, os maiores), nível 2 (`.cartaz__n2`) e nível 3 (`.cartaz__n3`, o underground), palcos no rodapé e o selo do Planeta Atlântida. Para mudar um nome de nível, mova o `<span class="cartaz__par">` inteiro (nome + morcego) e atualize as listas de `tests/unit/conteudo.test.mjs` e `tests/e2e/final.test.mjs`. A animação (`iniciarCartaz` em `js/animacoes.js`) só existe no modo animado; o estado final está no CSS.

## Agenda (robô do Ayon)

A seção **Próximos shows** vem da página do Brunin no Ayon (https://useayon.com/djbrunintks). Ninguém edita a agenda à mão: o Bruno cadastra os shows no Ayon e o robô traz.

- **Como funciona:** a cada 6 h, o workflow `.github/workflows/agenda.yml` roda `node tools/agenda.mjs`. O robô lê o perfil e a página de cada show (dados estruturados JSON-LD), grava os flyers em `assets/agenda/` (640 px, ≤ 120 KB) e reescreve o bloco entre `<!-- agenda:inicio -->` e `<!-- agenda:fim -->` no `index.html`. Se algo mudou, faz um commit "agenda: atualiza pelo Ayon" direto na `main` e pede a publicação ao Pages. Até 6 shows, do mais próximo ao mais distante; sem shows, aparece "Agenda aberta" com o botão Contrate.
- **Shows que passam:** o JS esconde na hora os que já acabaram (`data-fim`), mesmo antes do robô rodar de novo.
- **Rodar à mão:** no GitHub, Actions → Agenda → Run workflow. No computador, `node tools/agenda.mjs` (depois, commit de `index.html` e `assets/agenda/`).
- **Quando falha:** se o Ayon cair ou mudar o formato, o robô sai com erro sem mexer em nada: o site continua com a última agenda boa, e o GitHub manda um e-mail avisando que o workflow falhou. Se o formato mudou, o ajuste é em `tools/agenda-dados.mjs` (as fixtures em `tests/fixtures/ayon/` mostram o formato esperado).
- **Agendamento pausado:** o GitHub pausa agendamentos depois de 60 dias sem atividade no repositório (avisa por e-mail antes). Para reativar: Actions → Agenda → "Enable workflow".
- **Antes de criar uma branch:** rode `git pull` na `main`, porque o robô faz commits nela.
- **Lógica:** `tools/agenda-dados.mjs` (funções puras, testadas em `tests/unit/agenda.test.mjs`); rede e disco ficam em `tools/agenda.mjs`. Tudo que vem do Ayon é escapado, e só links https entram.

## Publicar

O site está no **GitHub Pages**: https://wesleymignot.github.io/siteTks/

- **Configuração:** em Settings → Pages, a fonte é "Deploy from a branch", com a branch `main` e a pasta `/ (root)`. Cada merge na `main` republica o site sozinho, em 1 ou 2 minutos.
- **Sem Jekyll:** o arquivo vazio `.nojekyll`, na raiz, faz o Pages servir os arquivos como estão, sem processá-los com o Jekyll.
- **Prévia do link:** `og:url`, `og:image` e `twitter:image`, no `<head>` do `index.html`, usam o endereço completo. WhatsApp, Instagram e X não montam a prévia com caminho relativo. Se o site mudar de endereço (um domínio próprio, por exemplo), troque os três e o teste `tests/unit/conteudo.test.mjs`.
- **Robô da agenda:** além dos merges, o site é republicado quando o robô da agenda faz commit (ver "Agenda").
- **Arquivos publicados:** o Pages publica o repositório inteiro, incluindo `docs/`, `tests/` e as fotos originais em `assets/fotos/`. O site só usa `index.html`, `css/`, `js/` e o resto de `assets/`.

Para publicar em outro lugar, envie só os arquivos do site, sem `node_modules/`, `tests/`, `docs/`, `tools/` e `.superpowers/`. No Netlify Drop, por exemplo, basta arrastar a pasta em https://app.netlify.com/drop. Na Vercel, importe o repositório como projeto estático, sem comando de build.
