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
bash tools/baixar-reels.sh cortar     # janela do hero (720/540, os 10 s iniciais) e fundo dos sets 6–8
bash tools/baixar-sets.sh baixar      # vídeos dos sets no YouTube → bruto/sets/
bash tools/baixar-sets.sh cortar      # trechos de 4 s dos sets 1–5
python tools/gerar-texturas.py        # faixas de chamas (repetem sem emenda)
python tools/tracar-morcego.py docs/identidade/morcego_ref.jpg   # contorno do morcego (js/morcego.js)
```

No Windows, rode os scripts de download com `PY=<caminho do python.exe>`: o atalho `.bat` do pyenv estraga os argumentos do yt-dlp.

## Como os morcegos funcionam

- `js/morcego.js`: a silhueta (contorno do `morcego_ref`) com as asas articuladas; a batida tem 32 quadros pré-calculados, usados nos divisores (SVG) e nos canvases. Os morcegos vermelhos das viradas levam um contorno preto de 1 px, já desenhado em "carimbos" (bitmaps por quadro e tamanho, `criarCarimbos`): desenhar o contorno na hora custava ~4× o quadro no Safari.
- `js/ceu.js`: um canvas fixo por cima da página desenha as faixas das viradas (Produções e Sets) e os morcegos da Assinatura. Na virada, uma faixa ondulada (1,6× a largura da tela) atravessa da esquerda para a direita e, no pico, cobre a largura inteira. Só anima quando alguma cena está na tela.
- `js/assinatura.js`: a chegada pelos quatro lados e o "Brunin" formado; o palco desenha só a tinta das letras.
- Movimento reduzido ou sem GSAP: sem céu; a assinatura aparece pronta, com os pousados parados.

## Card do hero

O card mostra o reel inteiro (9:16) desde o começo. Na rolagem, a janela abre até a tela toda e o vídeo cresce junto: só `transform`, do retângulo do card até o final (`fimDaJanela` em `js/util.js`), com a altura da tela, encostado à direita no computador e centralizado no celular. As bordas do vídeo esfumam no preto da janela.

## Publicar

O site está no **GitHub Pages**: https://wesleymignot.github.io/siteTks/

- **Configuração:** em Settings → Pages, a fonte é "Deploy from a branch", com a branch `main` e a pasta `/ (root)`. Cada merge na `main` republica o site sozinho, em 1 ou 2 minutos.
- **Sem Jekyll:** o arquivo vazio `.nojekyll`, na raiz, faz o Pages servir os arquivos como estão, sem processá-los com o Jekyll.
- **Prévia do link:** `og:url`, `og:image` e `twitter:image`, no `<head>` do `index.html`, usam o endereço completo. WhatsApp, Instagram e X não montam a prévia com caminho relativo. Se o site mudar de endereço (um domínio próprio, por exemplo), troque os três e o teste `tests/unit/conteudo.test.mjs`.
- **Arquivos publicados:** o Pages publica o repositório inteiro, incluindo `docs/`, `tests/` e as fotos originais em `assets/fotos/`. O site só usa `index.html`, `css/`, `js/` e o resto de `assets/`.

Para publicar em outro lugar, envie só os arquivos do site, sem `node_modules/`, `tests/`, `docs/`, `tools/` e `.superpowers/`. No Netlify Drop, por exemplo, basta arrastar a pasta em https://app.netlify.com/drop. Na Vercel, importe o repositório como projeto estático, sem comando de build.
