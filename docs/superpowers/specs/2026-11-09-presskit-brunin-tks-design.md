# Press kit Brunin Tks — Design

**Data:** 2026-11-09 · **Status:** aguardando revisão

## 1. Objetivo

Site de press kit de uma página para o **Brunin Tks**: DJ e produtor de Porto Alegre (RS), à frente da Savage, Boiler Baile, Sonora Breck e Sinistro DNB.

- **Público:** contratantes, produtores de festa, casas noturnas e imprensa.
- **Sucesso:** em menos de um minuto, a pessoa sente a energia do artista, entende quem ele é (carreira, festas, números), escuta um set e encontra como contratá-lo.
- **Identidade:** fiel à do artista, com base no PDF do press kit 2026, no reel "2 REELS.mp4" e no logo.
- **Navegação:** inspirada em 13322566869.com, com smooth scroll, seções fixas na tela, imagens escalando e trocando por cortina e tipografia com blend sobre imagem. O elemento central é uma **galeria infinita em 3D**, com imagens em ângulos diferentes se mesclando.

Idioma: só português.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Stack | HTML, CSS e JS puros, sem etapa de build. GSAP + ScrollTrigger + Lenis via CDN com versão fixa. |
| Scroll infinito | Só a **galeria** é infinita. A página tem começo e fim normais. |
| Identidade | **Direção C, Híbrido**: base escura e brilho brasa do reel, vermelho chapado do PDF só em blocos-chave (ver `docs/identidade/direcoes.html`). |
| Fotos do ensaio | Versão tratada (P&B granulado ou duotone) por padrão; a cor original aparece no hover ou no toque. |
| Vídeo | Reel no topo da página, clipes de fundo nos sets e a "assinatura" do fim do reel como transição para o Contrate. **Não** entra na galeria nem na Carreira. |
| Logo | `LOGO STICKER PRETO.png`, já convertido em 5 variações em `assets/logo/`. |

## 3. Identidade visual

### Cores (tokens CSS em `:root`)

| Token | Hex | Uso |
|---|---|---|
| `--preto` | `#0F1211` | Fundo dominante. É o preto levemente esverdeado do reel. |
| `--creme` | `#F1E2C4` | Texto, logo, estrelas e botões. |
| `--vermelho` | `#E3302F` | **Só blocos chapados**: letreiro das festas, cortinas de transição, seção Contrate e cortina do preloader. |
| `--brasa` | `#E2512B` | **Só como luz**: brilhos radiais sobre vídeo e foto, glow no hover, névoa da galeria. |
| `--sangue` | `#5E1D19` | Fundos secundários e a névoa do fundo da galeria. |

Regras de contraste: texto pequeno (abaixo de 19 px bold ou 24 px regular) nunca fica sobre `--vermelho` nem sobre `--brasa`, porque o contraste ali é de cerca de 3,9:1. Os botões são creme com texto preto e ficam vermelhos no hover.

### Tipografia (Google Fonts)

- **Títulos:** Fraunces 900 itálico com `SOFT 100`. É a serifa pesada dos títulos do PDF.
- **Texto e interface:** Archivo com `wdth 125`, em caixa-alta e pesos de 400 a 800.
- **Acento:** Grenze Gotisch, o gótico do "Brunin" do reel. Usado nos numerais de seção ("Nº 001"), nos nomes das festas na seção Produções e na palavra "Brunin" da assinatura.

### Logo (`assets/logo/`)

| Arquivo | Onde |
|---|---|
| `logo-sticker-osso.png` (sticker creme, letras pretas) | Hero, girado −3° |
| `logo-creme.png` | Header e menu |
| `logo-preto.png` | Seção Contrate (fundo vermelho) |
| `logo-vermelho.png`, `logo-sticker-vermelho.png` | Reserva |

Se o logo não carregar, o fallback é o texto "BRUNIN TKS" em Grenze Gotisch.

### Texturas

- **Grão:** ruído SVG (`feTurbulence`) por cima de tudo, com `mix-blend-mode: overlay`, levemente animado em steps.
- **Estrelas:** 4 pontas, em SVG inline e creme. Ficam espalhadas, giram devagar e reagem ao scroll.
- **Recortes do PDF:** fotos já tratadas que não estão no ZIP (em moldura tribal) e texturas de chamas, recortadas das páginas e usadas na galeria e em fundos.

## 4. Estrutura da página

Seções numeradas no estilo da referência ("Nº 001 — Carreira"). O conteúdo vem do PDF. A seguir, seção por seção, com a página do PDF entre parênteses.

### 0. Preloader

- Fundo preto, contador `000 → 100` (Archivo) e uma estrela girando.
- O contador acompanha o carregamento real de fontes e do pôster do hero, com tempo mínimo de 1,2 s.
- Ao terminar, uma cortina `--vermelho` sobe e revela o hero.

### Header fixo

- À esquerda, `logo-creme` pequeno. No centro, o relógio de Porto Alegre ("POA 22:10", com dois-pontos piscando, como o "Currently in Miami" da referência). À direita, o botão "+".
- O "+" abre um menu em tela cheia com links para as seções em Fraunces grande e, no rodapé, contatos (WhatsApp, e-mail, Instagram).
- O header usa `mix-blend-mode: difference` para ficar legível sobre qualquer fundo.

### 1. Hero

- Fundo: o reel (`hero-720.mp4` no desktop, `hero-540.mp4` no celular) em loop, mudo, com a cor real do vídeo.
- Por cima: brilho radial `--brasa` e gradiente preto no topo e na base.
- No centro, `logo-sticker-osso` grande, com estrelas em volta.
- **Card vertical:** clipe `boiler.mp4` à direita, com a etiqueta "● BOILER BAILE" e um ponto piscando. É o equivalente do vídeo "Live" da referência e aparece só no desktop.
- Textos: no topo, "DJ & PRODUTOR — PORTO ALEGRE/RS"; na base, "FUNK · BRUXARIA · FUNK BH · DRUM AND BASS" e "↓ Scroll".
- **Letreiro:** uma faixa `--vermelho` na base corre continuamente com "Savage ✦ Boiler Baile ✦ Sonora Breck ✦ Sinistro DNB" em Fraunces itálico preto.
- No scroll, o vídeo escala de leve e escurece, e o logo sobe com parallax.

### 2. Nº 001 — Carreira (PDF p.2)

- Abertura em Fraunces grande, com revelação palavra por palavra no scroll: "Um DJ de funk que explora as vertentes mais agressivas e eufóricas."
- Bio em duas colunas (uma no celular), com o texto do PDF p.2: ativo desde 2017; funk, drum and bass e rap; clubs da capital; bruxaria, funk BH e a crueza do funk original; fundador da Savage e cofundador da Boiler Baile, Sonora Breck e Sinistro DNB; Planeta Atlântida por três edições; SP, SC e PR; faixas tocadas na França e na Espanha; vive integralmente da arte.
- Uma foto do ensaio com zoom no scroll (scale 1,15) e cor no hover.

### 3. Números

Faixa de contadores que animam ao entrar na tela:

- **288 mil+** plays em sets online
- **2017** início da carreira
- **3×** Planeta Atlântida
- **2.000+** pessoas numa edição da Boiler Baile
- **4** festas criadas
- **FR · ES** países onde suas faixas tocaram

### 4. Nº 002 — Galeria infinita

Detalhes na seção 5 desta spec.

### 5. Nº 003 — Produções e impacto (PDF p.3)

- Quatro linhas enormes, com o nome em Grenze Gotisch e o papel ao lado ("Fundador" ou "Cofundador · Curadoria · Direção criativa · DJ residente"). Cada linha tem uma descrição curta tirada do PDF:
  - **Savage:** o projeto mais longevo, uma das primeiras festas da cidade a levar bruxaria e drill para a pista, espaço da juventude e do funk agressivo.
  - **Boiler Baile:** fusão de funk e eletrônico, mais de 2 mil pessoas numa única edição, expansão para outros estados.
  - **Sonora Breck:** conecta vertentes das ruas e impulsiona artistas periféricos em palcos maiores.
  - **Sinistro DNB:** a nova geração do drum and bass na cidade.
- No desktop, uma foto inclinada segue o cursor sobre a linha. No celular, o toque abre a linha como acordeão, com a foto.
- O fundo tem brilho `--brasa` que acompanha a linha ativa.

### 6. Nº 004 — Sets que marcaram a trajetória (PDF p.4 e p.6)

**Pilha de cortinas:** a seção fica fixa na tela e cada set entra sobre o anterior com `scaleY 0→1` a partir da base, como no slider da referência. Cada slide tem:

- Um clipe do reel no fundo, tocando só quando o slide está ativo.
- Uma sombra em gradiente à esquerda.
- "SET 0X / 08", o título em Fraunces, o local, o ícone da plataforma e o botão "▶ Ouvir/Assistir" (abre em nova aba).

| # | Set | Local | Link |
|---|---|---|---|
| 1 | Senso Rádio convida Brunin | Senso Radio NH | youtube.com/watch?v=5ackC9W3BIs |
| 2 | Boiler Baile x Grau | Veneno Live SP x Senso Rádio NH | youtube.com/watch?v=2Z2gP9W9Epo |
| 3 | Boiler Baile Ataque Sonoro | Veneno Live SP | youtube.com/watch?v=PuYyCp85V9U |
| 4 | Veneno Lab | São Paulo | youtube.com/watch?v=SLUUZG8-oYA |
| 5 | Live Sensi por BSTV | DnB set | youtube.com/watch?v=IP9V-06-QJw |
| 6 | Rewind BR | Function! SH · DnB set | soundcloud.com/functionfm/brunin-tks-rewind-br-04-functionfm-18102025 |
| 7 | Trinka | Porto Alegre | soundcloud.com/trinkabr/tkm11-brunin-tks |
| 8 | Modelo Brasileño | Madri · Radio Relativa | radiorelativa.eu/episode/modelo-brasileno-2 |

No PDF, os links dos sets 6 e 7 estão trocados entre os cards. Aqui cada um aponta para o link certo, conferido pelo nome na URL.

**Destaques depois da pilha:**

- Selo "Um dos melhores sets de funk de 2024 — Aquele Tuim", com link para aqueletuim.com.br/2024/11/os-melhores-dj-sets-de-funk-de-2024.html.
- Mais tocados: "15 minutinhos pra derrubar noia no submundo" (51 mil+), "13 minutinhos pra espancar ouvido de noite" (47 mil+), "Set espanca pedinte de música" (40 mil+). Ficam sem link até recebermos as URLs.

### 7. Nº 005 — Já compôs o line com (PDF p.5)

- Dois letreiros infinitos, em sentidos opostos e com velocidade reagindo ao scroll.
  - **Nacionais**, em Fraunces creme grande: KL Jay, Rincon Sapiência, Raffa Moreira, MC Binn, Pocah, MC Felipinho, Wesley Gonzaga.
  - **Underground**, em Archivo contornado: DJ Patife, Caio Prince, Bonekinha Iraquiana, Ramon Sucesso, Nanda Tsunami, Young Clubber, Carlos do Complexo, Idlibra, Dayeh, Bassan, Kenan e Kel, DJ Lorrany, Brum.
- Embaixo, a lista "Palcos, festas e rádios": Planeta Atlântida (3 edições), Onze Bar, Senso Radio, Trinka, Lóbulo, Function, Guilda, Veneno, Relativa (Madri).
- As fotos de outros artistas do PDF p.5 **não** são usadas, só os nomes.

### 8. Assinatura (transição)

- Tela preta fixa com "Brunin" em Grenze Gotisch creme no centro.
- Um rabisco vermelho (path SVG desenhado à mão) se desenha conforme o scroll (`stroke-dashoffset` com scrub), como no fim do reel.
- No fim do trecho, o vermelho toma a tela e entra o Contrate.

### 9. Nº 006 — Contrate (PDF p.7)

Fundo `--vermelho`, com "Contrate" gigante em Fraunces preto e `logo-preto`. Os links aparecem em lista grande, com seta e hover em creme sobre preto:

- **E-mail:** contato.bruninn@gmail.com (`mailto:`)
- **WhatsApp:** 51 98040-7711 (Wesley), via wa.me/5551980407711
- **Instagram:** instagram.com/djbrunintks
- **Material:** fotos, release e logos, na pasta do Drive drive.google.com/drive/folders/1ggulWuIW_njZD_iznFLcxt8tv8GtZnso
- **Download:** o PDF do press kit (`assets/presskit.pdf`)

Rodapé: "© 2026 Brunin Tks · Fotos @clicksbylt" e um botão "↑ Topo".

## 5. Galeria infinita (componente principal)

Fica isolada em `js/galeria.js` e expõe `iniciarGaleria(elemento, itens, opções)`, que retorna `{ destruir }`.

**Layout**

- A seção `#galeria` tem 400vh de altura. O palco interno é `position: sticky` com 100vh e `perspective: 900px`.
- Há cerca de 14 itens: as 8 fotos do ensaio (versão tratada, com a original para o hover) e uns 6 recortes de fotos do PDF.

**Posição de cada item**

- `x` e `y` seguem uma espiral de ângulo áureo, o que espalha os itens de forma orgânica sem grade.
- Rotação aleatória fixa (semente constante): `rotateX` e `rotateY` de ±25° e `rotateZ` de ±12°.
- `z` distribuído ao longo de uma profundidade `PROF` de cerca de 3000 px.

**Movimento**

- O `z` da câmera soma três coisas: uma deriva contínua (cerca de 0,25 px/ms), o progresso do scroll na seção vezes um fator, e a velocidade do Lenis como impulso.
- `z` é calculado em módulo `PROF`. Um item que passa da câmera volta para o fundo, então as fotos **nunca acabam**. Mesmo parado, o túnel continua derivando.

**Mescla**

- Itens distantes ficam escuros e com blur. Os próximos ficam nítidos e somem perto da câmera.
- O `mix-blend-mode` alterna entre normal, screen, lighten e difference.
- Ao centro, uma névoa radial `--sangue`/`--brasa` e o grão por cima.

**Interação**

- Hover ou toque numa foto do ensaio faz um crossfade para a cor original e um leve "lift". Os recortes do PDF não têm versão colorida.
- A legenda fixa mostra "Nº 002 — Galeria" e "Fotos @clicksbylt".

**Desempenho**

- O loop de `requestAnimationFrame` só roda com a seção visível (IntersectionObserver).
- Só se animam `transform` e `opacity`.
- No celular, são 10 itens, sem blur (escurecimento por opacidade) e com dispersão menor.

**`prefers-reduced-motion`:** em vez do túnel, uma grade estática de fotos com hover para cor.

## 6. Assets e processamento

```
index.html
css/style.css
js/main.js            Lenis + GSAP: preloader, header, relógio, reveals, contadores, letreiros,
                      produções, pilha de sets, assinatura
js/galeria.js         Galeria infinita (módulo isolado)
assets/logo/          5 variações do logo (prontas)
assets/video/         Clipes do reel (prontos): hero, boiler, chamas, dj-luz, grade, maos, filme, logo-fim
                      + 2 clipes a mais para completar 8 fundos de set + hero-720
assets/fotos/         Originais do ensaio (extraídas dos ZIPs)
assets/img/           Gerado: <nome>-cor.webp e <nome>-tks.webp (cerca de 1200 px de altura)
assets/recortes/      Gerado: recortes das páginas do PDF (fotos e texturas)
assets/presskit.pdf   Cópia do PDF para download
assets/og.jpg         Imagem de compartilhamento 1200×630 (frame do reel + logo)
tools/tratar-fotos.py Gera assets/img e assets/recortes (Pillow + PyMuPDF)
tools/cortar-video.sh Comandos ffmpeg que geraram assets/video
```

**Tratamento das fotos**

- Converte para P&B com contraste alto e grão.
- Cerca de 2/3 ficam em duotone preto-pista → creme e 1/3 em preto-pista → vermelho. É a mistura orgânica do PDF.
- Exporta em WebP com qualidade 80.

**Vídeo:** H.264 MP4, sem áudio, `faststart`, com pôster JPG.

- `hero-720` (cerca de 3,5 MB) e `hero-540` (cerca de 2,5 MB). A versão é escolhida por JS conforme a largura da tela.
- Clipes com cerca de 150 KB.
- Clipes fora do hero usam `preload="none"` e só tocam visíveis.

## 7. Comportamento geral

- **Lenis** com lerp de cerca de 0,1, integrado ao ScrollTrigger.
- **Âncoras do menu:** usam `lenis.scrollTo`.
- **Celular** (largura de 390 px como referência):
  - Fontes em `clamp()`, gutter de 16 px e nada de rolagem horizontal.
  - O hover vira toque e o card do hero some.
  - A pilha de sets usa cerca de 70vh de scroll por slide.
- **`prefers-reduced-motion`:**
  - Sem Lenis, sem túnel 3D e sem scrub. Os vídeos mostram só o pôster.
  - Os letreiros param.
  - Revelações viram simples aparições.
- **Acessibilidade:**
  - HTML semântico (`header`, `main`, `section` com `aria-labelledby`, `footer`), `alt` nas fotos e vídeos com `aria-hidden` (são decorativos).
  - Foco visível no creme e menu operável por teclado (Esc fecha).
  - Links externos com `rel="noopener"`.
- **Metatags:** `title`, `description`, Open Graph e Twitter card com `og.jpg`, favicon de estrela em SVG e `theme-color` `#0F1211`.

## 8. Verificação

- Servir localmente (`python -m http.server`) e capturar telas com o Chrome headless em 1440×900 e 390×844, nas seções Hero, Carreira, Galeria, Produções, Sets, Line-up e Contrate.
- Abrir no Chrome com o DevTools e confirmar o console sem erros.
- Conferir que não há rolagem horizontal no celular, que os vídeos tocam só quando visíveis e que o modo de movimento reduzido funciona.
- Conferir cada link externo contra a tabela de sets e a seção Contrate.

## 9. Fora do escopo

- Versão em inglês, CMS ou painel de edição, player de áudio embutido, deploy (o README vai explicar como publicar em Netlify, Vercel ou GitHub Pages) e analytics.

## 10. Pendências (não bloqueiam)

- URLs dos três sets mais tocados e do perfil do SoundCloud: por enquanto ficam sem link.
- Domínio: fica para quando for publicar.
