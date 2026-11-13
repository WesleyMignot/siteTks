// Morcego único do site: contorno do morcego_ref (docs/identidade/morcego_ref.jpg, traçado por
// tools/tracar-morcego.py, grade de 480 px) com asas articuladas. A batida tem 32 quadros
// pré-calculados: path SVG (divisores) e Path2D (canvas). Rig e parâmetros: spec da rodada 3, §3.1.

/** Contorno bruto (480 px) — saída de `python tools/tracar-morcego.py docs/identidade/morcego_ref.jpg 0.9`. */
const BRUTO = [[476,71],[459,89],[452,102],[448,117],[448,129],[452,145],[459,158],[474,176],[464,176],[448,182],[438,191],[433,205],[433,214],[438,230],[441,235],[450,243],[439,245],[425,250],[416,256],[410,262],[405,270],[401,283],[401,294],[400,295],[401,296],[401,307],[404,320],[393,315],[382,312],[366,311],[356,313],[347,317],[337,326],[330,340],[328,352],[329,373],[332,384],[328,377],[317,366],[311,362],[295,356],[279,355],[267,359],[256,370],[252,384],[253,397],[243,387],[230,380],[218,377],[204,376],[191,378],[173,386],[162,396],[155,407],[155,400],[149,386],[142,377],[134,370],[123,364],[113,361],[98,361],[89,364],[83,368],[82,356],[77,343],[71,334],[55,319],[29,306],[16,303],[1,303],[18,291],[39,282],[63,277],[89,276],[90,277],[112,278],[133,282],[166,291],[215,307],[238,311],[248,308],[251,305],[253,300],[252,280],[248,262],[259,272],[264,274],[272,274],[278,271],[282,267],[285,261],[286,255],[285,250],[291,259],[305,272],[315,276],[323,276],[330,274],[337,269],[342,260],[358,205],[367,181],[381,153],[393,135],[412,113],[428,99],[450,84]];

const CX = 290, CY = 300, K = 56 / 475, RAD = Math.PI / 180;
const nrm = (x, y) => ({ x: (x - CX) * K, y: (y - CY) * K });
const OMBRO_E = nrm(250, 300), PONTA_E = nrm(1, 300), OMBRO_D = nrm(330, 290), PONTA_D = nrm(476, 71);
const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = t => t * t * (3 - 2 * t);
const degrau = (a, b, v) => suave(lim((v - a) / (b - a)));

// Cada ponto pertence a uma asa (lado do meio entre os ombros) e tem pesos de braço e de mão pela
// projeção t no eixo ombro→ponta. Pontos do corpo (t < 0) ficam com peso 0: só sobem e descem.
const MEIO = (OMBRO_E.x + OMBRO_D.x) / 2;
const PONTOS = BRUTO.map(([x, y]) => {
  const p = nrm(x, y), esq = p.x < MEIO;
  const o = esq ? OMBRO_E : OMBRO_D, ponta = esq ? PONTA_E : PONTA_D;
  const ax = ponta.x - o.x, ay = ponta.y - o.y;
  const t = ((p.x - o.x) * ax + (p.y - o.y) * ay) / (ax * ax + ay * ay);
  return { ...p, esq, braco: degrau(-0.02, 0.16, t), mao: degrau(0.4, 0.92, t) };
});

/** Pose do contorno na fase f (0..2π) da batida. sen(f) > 0 = asas subindo. */
export function pose(f) {
  const g = f - 0.35 * Math.sin(f);               // descida mais rápida que a subida
  const s = Math.sin(g), atraso = Math.sin(g - 0.95);
  const ergueE = (6 + 36 * s) * RAD, ergueD = (-30 + 38 * s) * RAD;
  const mao = 18 * atraso * RAD;
  const dobra = 0.1 * Math.max(0, Math.cos(g));   // na subida a asa recolhe um pouco
  const sobe = -1.8 * Math.cos(g);                 // o corpo sobe na batida para baixo
  return PONTOS.map(p => {
    const o = p.esq ? OMBRO_E : OMBRO_D;
    const ang = (p.esq ? 1 : -1) * ((p.esq ? ergueE : ergueD) * p.braco + mao * p.mao);
    const enc = 1 - dobra * p.mao;
    const dx = (p.x - o.x) * enc, dy = (p.y - o.y) * enc;
    const c = Math.cos(ang), sn = Math.sin(ang);
    return { x: o.x + dx * c - dy * sn, y: o.y + dx * sn + dy * c + sobe };
  });
}

export const QUADROS = 32;
const r1 = v => Math.round(v * 10) / 10 + 0; // 1 casa; + 0 evita "-0"
const POSES = Array.from({ length: QUADROS }, (_, i) => pose(i / QUADROS * 2 * Math.PI).map(p => ({ x: r1(p.x), y: r1(p.y) })));

/** Path SVG de cada quadro da batida. */
export const QUADROS_D = POSES.map(pts => `M${pts.map(p => `${p.x} ${p.y}`).join(' L')} Z`);

/** viewBox que contém todos os quadros (1 unidade de folga). */
export const VIEWBOX = (() => {
  const xs = POSES.flat().map(p => p.x), ys = POSES.flat().map(p => p.y);
  const x0 = Math.floor(Math.min(...xs)) - 1, y0 = Math.floor(Math.min(...ys)) - 1;
  return `${x0} ${y0} ${Math.ceil(Math.max(...xs)) + 1 - x0} ${Math.ceil(Math.max(...ys)) + 1 - y0}`;
})();

/** Quadro mais parecido com a pose da referência (usado parado no movimento reduzido). */
export const QUADRO_REPOUSO = POSES.reduce((melhor, pts, i) => {
  const erro = pts.reduce((s, p, k) => s + Math.hypot(p.x - PONTOS[k].x, p.y - PONTOS[k].y), 0);
  return erro < melhor.erro ? { i, erro } : melhor;
}, { i: 0, erro: Infinity }).i;

/** Índice do quadro para uma fase qualquer (radianos, cresce com o tempo). */
export function quadro(fase) {
  return ((Math.floor(fase / (2 * Math.PI) * QUADROS) % QUADROS) + QUADROS) % QUADROS;
}

let formas = null; // Path2D só existe no navegador: cache criado no primeiro desenho
/** Desenha um morcego no canvas (cor = fillStyle atual). `tam` = escala do contorno (56 de envergadura). */
export function desenharMorcego(g, x, y, tam, fase, giro = 0, espelho = 1) {
  formas ??= QUADROS_D.map(d => new Path2D(d));
  g.save();
  g.translate(x, y);
  if (giro) g.rotate(giro);
  g.scale(tam * espelho, tam);
  g.fill(formas[quadro(fase)]);
  g.restore();
}

const SVG = 'http://www.w3.org/2000/svg';

/** <svg> decorativo do morcego, com um único path (o quadro de repouso). */
export function criarMorcegoSvg(classe = 'morcego') {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', VIEWBOX);
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('class', 'morcego__forma');
  p.setAttribute('d', QUADROS_D[QUADRO_REPOUSO]);
  svg.append(p);
  return svg;
}

/**
 * Faz os divisores (.div-morcego) baterem as asas: um rAF a ~30 quadros/s troca o `d` só dos visíveis.
 * Cada divisor tem fase própria. No movimento reduzido ficam parados no quadro de repouso.
 */
export function animarDivisores({ menosMovimento } = {}) {
  if (menosMovimento || typeof IntersectionObserver === 'undefined') return;
  const itens = new Map();
  document.querySelectorAll('.div-morcego').forEach((d, i) => {
    const forma = d.querySelector('.morcego__forma');
    if (forma) itens.set(d, { forma, fase: i * 1.7, vel: 8.5 + (i % 5) * 0.4, atual: -1 });
  });
  if (!itens.size) return;
  const visiveis = new Set();
  let raf = 0, ultimo = 0;
  const laco = agora => {
    raf = visiveis.size ? requestAnimationFrame(laco) : 0;
    if (agora - ultimo < 33) return;
    ultimo = agora;
    for (const d of visiveis) {
      const it = itens.get(d), q = quadro(it.fase + agora / 1000 * it.vel);
      if (q !== it.atual) { it.forma.setAttribute('d', QUADROS_D[q]); it.atual = q; }
    }
  };
  // as entradas chegam em ordem: processar todas deixa valendo a última de cada divisor
  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
    if (visiveis.size && !raf) raf = requestAnimationFrame(laco);
  });
  itens.forEach((_, d) => io.observe(d));
}
