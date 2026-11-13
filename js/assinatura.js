// Assinatura: saindo do Line-up, uma nuvem de morcegos chega dos quatro lados e toma a tela (sem véu:
// o fundo aparece nas frestas); a página troca por baixo dela e os mesmos morcegos formam o "Brunin".
// Os de "tinta" somem dentro das letras deixando manchas (recortadas pela máscara do texto); os
// "pousados" ficam nas bordas de cima, batendo as asas devagar. Ninguém sai.
// Referência: docs/identidade/morcegos-3.html. Funções puras + iniciarAssinatura(ctx, ceu) (DOM):
// a tinta é desenhada no palco; os morcegos, no céu (js/ceu.js).
import { criarRng } from './util.js';
import { desenharMorcego, QUADRO_REPOUSO, QUADROS } from './morcego.js';

const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = t => t * t * (3 - 2 * t);
const degrau = (a, b, v) => suave(lim((v - a) / (b - a)));
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

/** Um morcego por alvo (tinta, depois pousados), cada um entrando por um dos 4 lados. Determinístico. */
export function criarMorcegos({ tinta, pouso, W, H, esc, semente }) {
  const g = criarRng(semente);
  const borda = () => {
    const lado = Math.floor(g() * 4), v = g();
    return lado === 0 ? { x: -80, y: v * H } : lado === 1 ? { x: W + 80, y: v * H }
      : lado === 2 ? { x: v * W, y: -80 } : { x: v * W, y: H + 80 };
  };
  const novo = (alvo, pousado) => ({
    alvo, pousado,
    ini: borda(),
    meio: { x: W * (-0.05 + 1.1 * g()), y: H * (-0.05 + 1.1 * g()) },
    curva: (g() - 0.5) * 0.6,
    entra: g() * 0.12,
    pouso: g() * 0.5,
    tam: (pousado ? 0.85 + g() * 0.4 : 0.5 + g() * 0.9) * esc * 1.25,
    bateF: pousado ? 7 + g() * 4 : 13 + g() * 8,
    fase: g() * 6.28,
    pairar: 6 + g() * 14,
  });
  return [...tinta.map(a => novo(a, false)), ...pouso.map(a => novo(a, true))];
}

/** Progresso P (0–1) da seção: Bf = pouso nas letras; perto = escala dos que voam (até 1,6× na chegada). */
export function fases(P) {
  return {
    Bf: lim((P - 0.42) / 0.46),
    perto: 1 + 0.6 * (degrau(0.05, 0.3, P) - degrau(0.32, 0.6, P)),
  };
}

/** Raio da mancha que um morcego de tinta deixa ao chegar (0 = ainda não chegou). */
function raioMancha(m, Bf, raioMax) {
  const ja = Bf - m.pouso - 0.35;
  return ja < 0 ? 0 : raioMax * (0.35 + 0.65 * suave(lim(ja / 0.12)));
}

/**
 * Estado de um morcego no progresso P e no tempo t (s). `chegada` (0–1) é quanto ele já foi do voo
 * livre (coordenadas de tela) para o alvo (coordenadas do palco). `fase` é a fase da batida.
 */
export function estadoMorcego(m, P, t, { W, H, esc }) {
  const { Bf, perto } = fases(P);
  // chegada: sai da borda, faz uma curva e se espalha pela tela pairando
  const f = suave(lim((P - m.entra) / 0.26));
  let x = bez(m.ini.x, (m.ini.x + m.meio.x) / 2 + m.curva * H, m.meio.x, f);
  let y = bez(m.ini.y, (m.ini.y + m.meio.y) / 2 - m.curva * W * 0.3, m.meio.y, f);
  x += Math.sin(t * 1.3 + m.fase) * m.pairar * esc * 2;
  y += Math.cos(t * 1.7 + m.fase) * m.pairar * 1.4 * esc;
  // pouso: desce até o alvo (letra ou borda)
  const a = suave(lim((Bf - m.pouso) / 0.35));
  if (a > 0) {
    x = bez(x, (x + m.alvo.x) / 2 + Math.sin(m.fase) * W * 0.12, m.alvo.x, a);
    y = bez(y, Math.min(y, m.alvo.y) - H * 0.18, m.pousado ? m.alvo.y - 7 * m.tam : m.alvo.y, a);
  }
  const parado = m.pousado && a >= 1;
  return {
    x, y, chegada: a,
    visivel: f > 0 && !(!m.pousado && a >= 1), // a tinta some ao chegar (vira mancha)
    tam: parado ? m.tam : m.tam * perto,
    fase: t * m.bateF * (parado ? 0.5 : 1) + m.fase, // pousado bate devagar
    giro: parado ? 0 : Math.sin(t * 2 + m.fase) * 0.25,
    espelho: m.fase > 3.14 ? 1 : -1,
  };
}

const FONTE = '"Pirata One"';
const fontePronta = () => !document.fonts || [...document.fonts].some(f => f.family.replace(/["']/g, '') === 'Pirata One' && f.status === 'loaded');
const FASE_REPOUSO = (QUADRO_REPOUSO + 0.5) / QUADROS * 2 * Math.PI;

/**
 * Assinatura. Animado (com céu): P vem do scroll (seção de 350vh, palco sticky); o palco desenha só a
 * tinta (refeita quando Bf muda) e os morcegos vão para o céu. Reduzido/estático: o palco desenha uma
 * vez o estado final — tinta completa e pousados parados — e de novo no resize.
 */
export function iniciarAssinatura({ gsap, ScrollTrigger, menosMovimento, CELULAR }, ceu) {
  const secao = document.getElementById('assinatura');
  const palco = secao.querySelector('.assinatura__palco');
  const tela = secao.querySelector('.assinatura__tela');
  const g = tela.getContext('2d');
  if (!g) return; // sem canvas: o h2 continua visível como texto
  const animar = !menosMovimento && !!gsap && !!ScrollTrigger && !!ceu;
  secao.classList.add('assinatura--tela');
  if (animar) document.documentElement.classList.add('anima-assinatura');

  const cor = getComputedStyle(document.documentElement).getPropertyValue('--preto').trim() || '#0F1211';
  let W = 0, H = 0, dpr = 1, esc = 1, mascara = null, bats = [], P = animar ? 0 : 1, comFonte = false, ultimoBf = -1;

  function medir() {
    W = tela.clientWidth; H = tela.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
    esc = Math.max(0.55, Math.min(W / 1400, H / 800));
    comFonte = fontePronta();
    ultimoBf = -1;

    const escrever = (c, k, leitura) => {
      const m = c.getContext('2d', { willReadFrequently: leitura });
      m.setTransform(k, 0, 0, k, 0, 0);
      // em retrato o texto ganha largura (no celular, 27% deixava o nome pequeno no meio do vazio)
      m.font = `400 ${Math.min(W * (W < H ? 0.36 : 0.27), H * 0.5)}px ${FONTE}, serif`;
      m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#000';
      m.fillText('Brunin', W / 2, H * 0.52);
      return m;
    };
    // amostra em px CSS (alvos, lida uma vez); máscara em px do aparelho (recorte nítido)
    const amostra = document.createElement('canvas');
    amostra.width = W; amostra.height = H;
    const dados = escrever(amostra, 1, true).getImageData(0, 0, W, H).data;
    mascara = document.createElement('canvas');
    mascara.width = tela.width; mascara.height = tela.height;
    escrever(mascara, dpr, false);

    const celular = matchMedia(CELULAR).matches;
    const alvos = amostrarAlvos(dados, W, H, {
      nTinta: celular ? 230 : 460, nPouso: celular ? 18 : 34, distMin: 46 * esc, semente: 11,
    });
    bats = criarMorcegos({ ...alvos, W, H, esc, semente: 7 });
  }

  /** Tinta das letras no palco: manchas onde os morcegos de tinta pousaram, recortadas pelo texto. */
  function desenharTinta() {
    if (!W || !H) return;
    const { Bf } = fases(P);
    if (Bf === ultimoBf) return; // nada mudou (inclusive Bf parado em 0 ou 1)
    ultimoBf = Bf;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, tela.width, tela.height);
    if (Bf <= 0) return;
    g.fillStyle = cor;
    if (Bf >= 0.999) g.fillRect(0, 0, tela.width, tela.height);
    else {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const raioMax = Math.min(W, H) * 0.045;
      for (const b of bats) {
        if (b.pousado) continue;
        const r = raioMancha(b, Bf, raioMax);
        if (r > 0) { g.beginPath(); g.arc(b.alvo.x, b.alvo.y, r, 0, 6.283); g.fill(); }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mascara, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }

  /** Estado final parado (reduzido/estático): tinta completa e pousados no quadro de repouso. */
  function desenharFinal() {
    P = 1; ultimoBf = -1;
    desenharTinta();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = cor;
    for (const b of bats) {
      if (!b.pousado) continue;
      desenharMorcego(g, b.alvo.x, b.alvo.y - 7 * b.tam, b.tam, FASE_REPOUSO);
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
    if (animar) { desenharTinta(); ceu.acordar(); } else desenharFinal();
  };
  // espera a Pirata One no máximo 3 s; depois desenha com a reserva e refaz quando ela chegar
  const fonte = document.fonts?.load(`400 200px ${FONTE}`).catch(() => {}) ?? Promise.resolve();
  Promise.race([fonte, new Promise(r => setTimeout(r, 3000))]).then(montar);
  document.fonts?.addEventListener?.('loadingdone', () => { if (!comFonte && fontePronta()) montar(); });

  let espera = 0;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(montar, 200); });

  if (!animar) return;
  ScrollTrigger.create({
    trigger: secao, start: 'top bottom', end: 'bottom bottom',
    onUpdate: s => { P = s.progress; desenharTinta(); ceu.acordar(); },
  });

  // morcegos no céu: voo em coordenadas de tela; quem está chegando ao alvo acompanha o palco
  ceu.registrar({
    ativa() {
      if (P <= 0 || !bats.length) return false;
      const r = palco.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    },
    desenhar(gc, Wc, Hc, t) {
      const topo = palco.getBoundingClientRect().top;
      const dims = { W, H, esc };
      gc.fillStyle = cor;
      let n = 0;
      for (const b of bats) {
        const e = estadoMorcego(b, P, t, dims);
        if (!e.visivel) continue;
        const y = e.y + topo * e.chegada;
        if (e.x < -120 || e.x > Wc + 120 || y < -120 || y > Hc + 120) continue; // fora da tela: não desenha
        desenharMorcego(gc, e.x, y, e.tam, e.fase, e.giro, e.espelho);
        n++;
      }
      return n;
    },
  });
}
