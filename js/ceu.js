// Céu: um canvas fixo, do tamanho da tela, que desenha as faixas de morcegos das viradas (Produções e
// Sets) e os morcegos da Assinatura (cena registrada por js/assinatura.js). Só roda rAF enquanto alguma
// cena está ativa; fora disso fica limpo e parado. Não existe no movimento reduzido nem no modo estático.
import { criarRng } from './util.js';
import { criarCarimbos } from './morcego.js';

/** Faixa da virada: cada morcego com lugar na faixa, ritmo, onda e batida próprios (determinístico pela semente). */
export function criarFaixa(n, semente) {
  const r = criarRng(semente);
  return Array.from({ length: n }, (_, i) => ({
    q: (i + r()) / n,        // lugar ao longo da faixa, espalhado por igual (sem buracos no pico)
    dy: r() + r() - 1,       // -1..1, mais gente no meio da espessura
    j: (r() - 0.5) * 0.12,   // ritmo próprio: uns adiantam, outros atrasam
    a2: 0.006 + r() * 0.014, f2: 0.8 + r() * 1.4, p2: r() * 6.3,
    tam: 0.7 + r() * 0.9, bate: 9 + r() * 6, fase: r() * 6.3,
  }));
}

/**
 * Posição de um morcego da faixa no progresso u da virada (0 = topo da seção no fundo da tela, 1 = no topo) e
 * no tempo t. A faixa (1,6 × a largura) corre da esquerda para a direita por uma onda fixa na tela; em u 0 e 1
 * está toda fora, e no pico cobre a largura inteira (desacelera um pouco no meio para o pico durar mais).
 * Onda e espessura seguem o menor lado: no celular em pé a faixa não fica íngreme.
 */
export function posicaoFaixa(m, u, t, W, H, fase = 0.6) {
  // M: margem fora da tela no começo e no fim; cresce com a tela porque o morcego cresce (esc = W/900)
  const L = 1.6 * W, M = Math.max(140, 0.11 * W), B = Math.min(W, H);
  const e = u + 0.4 * Math.sin(2 * Math.PI * u) / (2 * Math.PI);
  const x = -M - m.q * L + e * (W + L + 2 * M) + m.j * W * (e - 0.5);
  const centro = xx => 0.48 * H + 0.07 * B * Math.sin(xx / W * 1.6 * Math.PI + fase);
  const y = centro(x) + m.dy * 0.11 * B + m.a2 * B * Math.sin(t * m.f2 + m.p2);
  return { x, y, giro: Math.atan2(centro(x + 10) - centro(x), 10) * 0.45 };
}

/**
 * O morcego desenhado com escala `tam` em (x, y) ainda pode aparecer numa tela W × H? Usa a meia envergadura
 * máxima do contorno (37 unidades) com folga para o giro: o recorte cresce com o morcego (telas largas).
 */
export function visivel(x, y, tam, W, H) {
  const r = 40 * tam;
  return x + r > 0 && x - r < W && y + r > 0 && y - r < H;
}

/**
 * Liga o céu. Devolve `{ registrar(cena), acordar() }` — cena = { ativa(): boolean, desenhar(g, W, H, t): number,
 * voando?(): boolean } (o número é quantos morcegos ela desenhou; sem `voando`, conta como voando) — ou null
 * quando não há céu (reduzido/estático).
 */
export function iniciarCeu({ gsap, ScrollTrigger, menosMovimento, CELULAR }) {
  const tela = document.querySelector('.ceu');
  if (!tela || menosMovimento || !gsap || !ScrollTrigger) return null;
  const g = tela.getContext('2d');
  if (!g) return null;

  const cenas = [];
  let W = 0, H = 0, dpr = 1, raf = 0;
  const medir = () => {
    // a caixa real do canvas (sem a barra de rolagem clássica, que innerWidth inclui)
    W = tela.clientWidth || innerWidth; H = tela.clientHeight || innerHeight;
    dimensionar(dpr);
  };
  const dimensionar = k => { dpr = k; tela.width = Math.round(W * k); tela.height = Math.round(H * k); };
  const laco = agora => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, tela.width, tela.height);
    const ativas = cenas.filter(c => c.ativa());
    if (!ativas.length) { tela.dataset.desenhados = '0'; raf = 0; return; }
    // com morcegos voando, resolução 1× (pintar o canvas na CPU — Safari, Android em blocklist — custa
    // ~40% menos); com todos parados, nítido no DPR do aparelho (até 2×). Trocar o tamanho limpa o canvas.
    const k = ativas.some(c => c.voando?.() ?? true) ? 1 : Math.min(2, devicePixelRatio || 1);
    if (k !== dpr) dimensionar(k);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = agora / 1000;
    let n = 0;
    for (const c of ativas) n += c.desenhar(g, W, H, t);
    tela.dataset.desenhados = String(n);
    raf = requestAnimationFrame(laco);
  };
  const acordar = () => { if (!raf) raf = requestAnimationFrame(laco); };
  const registrar = cena => { cenas.push(cena); acordar(); };

  medir();
  tela.dataset.desenhados = '0';
  addEventListener('resize', () => { medir(); acordar(); });

  // faixas das viradas: o avanço u acompanha o topo da seção atravessando a tela
  const celular = matchMedia(CELULAR).matches;
  const raiz = getComputedStyle(document.documentElement);
  const cor = raiz.getPropertyValue('--vermelho').trim() || '#E8392F';
  const preto = raiz.getPropertyValue('--preto').trim() || '#0F1211';
  // morcegos vermelhos com contorno preto fino (separa um do outro na faixa), já desenhados em carimbos
  const carimbos = criarCarimbos({ cor, contorno: preto });
  // cria os carimbos antes da 1ª virada, um tamanho por vez, quando o navegador está ocioso (os quadros
  // consecutivos ficam a menos de √2 um do outro: nenhum tamanho de referência fica de fora)
  const ocioso = window.requestIdleCallback ?? (f => setTimeout(f, 200));
  const tams = [0.7, 0.95, 1.3, 1.6].map(k => k * Math.max(0.8, W / 900));
  let k = 0;
  const aquecer = () => { carimbos.aquecer(tams[k], tams[k]); if (++k < tams.length) ocioso(aquecer); };
  ocioso(aquecer);
  ['#producoes', '#sets'].forEach((seletor, i) => {
    const secao = document.querySelector(seletor);
    if (!secao) return;
    const bando = criarFaixa(celular ? 90 : 170, 101 + i * 17);
    const fase = i ? 2.7 : 0.6; // ondas diferentes nas duas viradas
    let u = 0;
    ScrollTrigger.create({
      trigger: secao, start: 'top bottom', end: 'top top',
      onUpdate: s => { u = s.progress; acordar(); },
      onToggle: acordar,
    });
    registrar({
      ativa: () => u > 0 && u < 1,
      desenhar(g, W, H, t) {
        const esc = Math.max(0.8, W / 900);
        let n = 0;
        for (const m of bando) {
          const p = posicaoFaixa(m, u, t, W, H, fase);
          const tam = m.tam * esc;
          if (!visivel(p.x, p.y, tam, W, H)) continue; // inteiro fora da tela (recorte do tamanho do morcego)
          carimbos.desenhar(g, p.x, p.y, tam, t * m.bate + m.fase, p.giro);
          n++;
        }
        return n;
      },
    });
  });
  return { registrar, acordar };
}
