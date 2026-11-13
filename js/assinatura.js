// Assinatura: uma revoada de morcegos entra pela esquerda, toma a tela e forma o "Brunin".
// Os morcegos de "tinta" somem dentro das letras deixando manchas (recortadas pela máscara do texto);
// os "pousados" ficam nas bordas de cima das letras, batendo as asas devagar. Ninguém sai.
// Algoritmo: docs/identidade/morcegos.html (v2). Funções puras + iniciarAssinatura(ctx) (DOM).
import { criarRng } from './util.js';
import { desenharMorcego } from './morcego.js';

const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = t => t * t * (3 - 2 * t);
const bez = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

/**
 * Sorteia os alvos dentro da máscara (RGBA; alfa > 128 = dentro).
 * `tinta`: pontos dentro das letras. `pouso`: pontos da borda de cima (y-3 fora), espaçados ≥ distMin.
 */
export function amostrarAlvos(alfa, W, H, { nTinta, nPouso, distMin, semente }) {
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H && alfa[(y * W + x) * 4 + 3] > 128;
  const r = criarRng(semente);
  const tinta = [], topo = [];
  for (let k = 0; k < 400000 && (tinta.length < nTinta || topo.length < 4000); k++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (!dentro(x, y)) continue;
    if (tinta.length < nTinta) tinta.push({ x, y });
    if (!dentro(x, y - 3)) topo.push({ x, y });
  }
  const pouso = [];
  for (const q of topo) {
    if (pouso.length >= nPouso) break;
    if (pouso.every(o => Math.hypot(o.x - q.x, o.y - q.y) >= distMin)) pouso.push(q);
  }
  return { tinta, pouso };
}

/** Um morcego por alvo: primeiro os de tinta, depois os pousados. Determinístico pela semente. */
export function criarMorcegos({ tinta, pouso, W, H, esc, semente }) {
  const g = criarRng(semente);
  const novo = (alvo, pousado) => ({
    alvo, pousado,
    ini: { x: -60 - g() * W * 0.6, y: g() * H },
    meio: { x: W * (0.04 + 0.92 * g()), y: H * (0.04 + 0.92 * g()) },
    curva: (g() - 0.5) * H * 0.7,
    entra: g() * 0.16,
    pouso: g() * 0.55,
    tam: (pousado ? 0.85 + g() * 0.4 : 0.5 + g() * 0.9) * esc * 1.25,
    bateF: pousado ? 7 + g() * 4 : 15 + g() * 9,
    fase: g() * 6.28,
    pairar: 6 + g() * 14,
  });
  return [...tinta.map(a => novo(a, false)), ...pouso.map(a => novo(a, true))];
}

/** Fase 2 (pouso) em função do progresso p da seção. */
export function fases(p) {
  return { Bf: lim((p - 0.4) / 0.5) };
}

/** Raio da mancha que um morcego de tinta deixa ao chegar (0 = ainda não chegou). */
function raioMancha(m, Bf, raioMax) {
  const ja = Bf - m.pouso - 0.35;
  return ja < 0 ? 0 : raioMax * (0.35 + 0.65 * suave(lim(ja / 0.12)));
}

/** Posição e pose de um morcego no progresso p e no tempo t (s). */
export function estadoMorcego(m, p, t, { W, H, esc }) {
  const { Bf } = fases(p);
  // fase 1: entra pela lateral e se espalha pela tela
  const f = suave(lim((p - m.entra) / 0.3));
  let x = bez(m.ini.x, W * 0.25, m.meio.x, f);
  let y = bez(m.ini.y, m.ini.y + m.curva, m.meio.y, f);
  x += Math.sin(t * 1.3 + m.fase) * m.pairar * esc;
  y += Math.cos(t * 1.7 + m.fase) * m.pairar * 0.7 * esc;
  // fase 2: desce até o alvo (letra ou borda)
  const a = suave(lim((Bf - m.pouso) / 0.35));
  if (a > 0) {
    x = bez(x, (x + m.alvo.x) / 2 + Math.sin(m.fase) * W * 0.12, m.alvo.x, a);
    y = bez(y, Math.min(y, m.alvo.y) - H * 0.18, m.pousado ? m.alvo.y - 7 * m.tam : m.alvo.y, a);
  }
  const parado = m.pousado && a >= 1;
  const visivel = !(!m.pousado && a >= 1) && !(f <= 0 && a <= 0 && x < -40);
  const bate = parado
    ? 0.25 + 0.75 * Math.abs(Math.sin(t * m.bateF * 0.5 + m.fase)) // pousado: bate devagar
    : 0.3 + 0.7 * Math.sin(t * m.bateF + m.fase);
  const giro = parado ? 0 : Math.sin(t * 2 + m.fase) * 0.22;
  return { x, y, visivel, bate, giro };
}

const FONTE = '"Pirata One"';
const fontePronta = () => !document.fonts || [...document.fonts].some(f => f.family.replace(/["']/g, '') === 'Pirata One' && f.status === 'loaded');

/**
 * Canvas da assinatura. Com animação, o progresso vem do scroll (seção de 300vh, palco sticky) e o rAF
 * só roda com a seção visível. Reduzido/estático: desenha uma vez o estado final (e de novo no resize).
 */
export function iniciarAssinatura({ gsap, ScrollTrigger, menosMovimento, CELULAR }) {
  const secao = document.getElementById('assinatura');
  const tela = secao.querySelector('.assinatura__tela');
  const g = tela.getContext('2d');
  if (!g) return; // sem canvas: o h2 continua visível como texto
  const animar = !menosMovimento && !!gsap && !!ScrollTrigger;
  secao.classList.add('assinatura--tela');
  if (animar) document.documentElement.classList.add('anima-assinatura');

  const cor = getComputedStyle(document.documentElement).getPropertyValue('--preto').trim() || '#0F1211';
  let W = 0, H = 0, dpr = 1, esc = 1, mascara = null, tinta = null, bats = [], p = animar ? 0 : 1, comFonte = false;

  const novaTela = () => {
    const c = document.createElement('canvas');
    c.width = tela.width; c.height = tela.height;
    return c;
  };

  function medir() {
    W = tela.clientWidth; H = tela.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
    esc = Math.max(0.55, Math.min(W / 1400, H / 800));
    comFonte = fontePronta();

    const escrever = (c, k) => {
      const m = c.getContext('2d', { willReadFrequently: k === 1 });
      m.setTransform(k, 0, 0, k, 0, 0);
      // em retrato o texto ganha largura (no celular, 27% deixava o nome pequeno no meio do vazio)
      m.font = `400 ${Math.min(W * (W < H ? 0.36 : 0.27), H * 0.5)}px ${FONTE}, serif`;
      m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#000';
      m.fillText('Brunin', W / 2, H * 0.52);
      return m;
    };
    // amostra em px CSS (alvos); máscara em px do aparelho (recorte nítido)
    const amostra = document.createElement('canvas');
    amostra.width = W; amostra.height = H;
    const dados = escrever(amostra, 1).getImageData(0, 0, W, H).data;
    mascara = novaTela(); escrever(mascara, dpr);
    tinta = novaTela();

    const celular = matchMedia(CELULAR).matches;
    const alvos = amostrarAlvos(dados, W, H, {
      nTinta: celular ? 150 : 300, nPouso: celular ? 18 : 34, distMin: 46 * esc, semente: 11,
    });
    bats = criarMorcegos({ ...alvos, W, H, esc, semente: 7 });
  }

  function desenhar(p, t) {
    if (!W || !H) return;
    const { Bf } = fases(p);
    const raioMax = Math.min(W, H) * 0.045;
    // tinta das letras: manchas onde os morcegos pousaram, recortadas pelo texto
    const tc = tinta.getContext('2d');
    tc.setTransform(1, 0, 0, 1, 0, 0);
    tc.globalCompositeOperation = 'source-over';
    tc.clearRect(0, 0, tinta.width, tinta.height);
    tc.fillStyle = cor;
    if (Bf >= 0.999) tc.fillRect(0, 0, tinta.width, tinta.height);
    else {
      tc.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const b of bats) {
        if (b.pousado) continue;
        const r = raioMancha(b, Bf, raioMax);
        if (r > 0) { tc.beginPath(); tc.arc(b.alvo.x, b.alvo.y, r, 0, 6.283); tc.fill(); }
      }
      tc.setTransform(1, 0, 0, 1, 0, 0);
    }
    tc.globalCompositeOperation = 'destination-in';
    tc.drawImage(mascara, 0, 0);

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, tela.width, tela.height);
    g.drawImage(tinta, 0, 0);
    g.fillStyle = cor;
    const dims = { W, H, esc };
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const b of bats) {
      const e = estadoMorcego(b, p, t, dims);
      if (!e.visivel) continue;
      const parado = b.pousado && e.giro === 0; // pousado: bate devagar
      desenharMorcego(g, e.x, e.y, b.tam, t * b.bateF * (parado ? 0.5 : 1) + b.fase, e.giro);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // só refaz se algo mudou de fato (no celular, a barra de endereço dispara resize sem mudar o palco svh)
  let chave = '';
  const montar = () => {
    const nova = `${tela.clientWidth}x${tela.clientHeight}@${devicePixelRatio}:${fontePronta()}`;
    if (nova === chave) return;
    chave = nova;
    medir();
    if (!animar) desenhar(1, 0);
  };
  const carregar = document.fonts?.load(`400 200px ${FONTE}`) ?? Promise.resolve();
  carregar.catch(() => {}).then(montar);
  // a folha do Google Fonts pode chegar depois: refaz a máscara quando a Pirata One carregar
  document.fonts?.addEventListener?.('loadingdone', () => { if (!comFonte && fontePronta()) montar(); });

  let espera = 0;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(montar, 200); });

  if (!animar) return;
  const st = ScrollTrigger.create({ trigger: secao, start: 'top top', end: 'bottom bottom', onUpdate: s => { p = s.progress; } });
  p = st.progress;
  let raf = 0, rodando = false;
  const laco = agora => { desenhar(p, agora / 1000); raf = requestAnimationFrame(laco); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === rodando) return;
    rodando = e.isIntersecting;
    if (rodando) raf = requestAnimationFrame(laco); else cancelAnimationFrame(raf);
  }).observe(secao);
}
