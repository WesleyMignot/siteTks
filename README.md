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

O material bruto fica na raiz e não vai para o git: o PDF do press kit, o `2 REELS.mp4`, o logo e os ZIPs das fotos.

```bash
pip install -r tools/requirements.txt
python tools/tratar-fotos.py   # fotos tratadas, recortes do PDF, og.jpg, presskit.pdf
bash tools/cortar-video.sh     # clipes do reel (precisa de ffmpeg)
```

## Publicar

O site é estático. Publique a pasta **sem** `node_modules/`, `tests/`, `docs/`, `tools/` e `.superpowers/`.

- **Netlify Drop:** arraste a pasta preparada em https://app.netlify.com/drop.
- **GitHub Pages:** suba o repositório e ative Pages a partir da branch `main`, na raiz.
- **Vercel:** importe o repositório como projeto estático, sem comando de build.
