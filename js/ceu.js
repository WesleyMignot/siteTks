// Céu: um canvas fixo, do tamanho da tela, que desenha as nuvens de morcegos das viradas (Produções e
// Sets) e os morcegos da Assinatura (cena registrada por js/assinatura.js). Só roda rAF enquanto alguma
// cena está ativa; fora disso fica limpo e parado. Não existe no movimento reduzido nem no modo estático.
import { criarRng } from './util.js';
import { desenharMorcego } from './morcego.js';

/** Bando da virada: cada morcego com deslocamento, onda e batida próprios (determinístico pela semente). */
export function criarNuvem(n, semente) {
  const r = criarRng(semente);
  return Array.from({ length: n }, () => ({
    du: (r() - 0.5) * 0.34, dy: (r() - 0.5) * 0.42,
    a1: 0.08 + r() * 0.16, f1: 1.5 + r() * 2.5, p1: r() * 6.3,
    a2: 0.02 + r() * 0.05, f2: 0.6 + r() * 1.2, p2: r() * 6.3,
    tam: 0.7 + r() * 0.9, bate: 9 + r() * 6, fase: r() * 6.3,
  }));
}

/**
 * Posição de um morcego da nuvem no progresso u da virada (0 = topo da seção no fundo da tela,
 * 1 = no topo) e no tempo t. Em u 0 e 1 o bando inteiro está fora da tela. O giro segue o voo.
 */
export function posicaoNuvem(m, u, t, W, H) {
  const S = Math.max(W, 0.9 * H); // espalhamento pelo maior lado: no celular em pé a nuvem não vira coluna
  const em = v => ({
    x: W * (-0.45 + 1.9 * v) + S * m.du,
    y: H * (0.62 - 0.32 * (v + m.du) + 0.6 * m.dy)
      + H * m.a1 * Math.sin((v + m.du) * Math.PI * m.f1 + m.p1)
      + H * m.a2 * Math.sin(t * m.f2 + m.p2),
  });
  const a = em(u), b = em(u + 0.01);
  return { x: a.x, y: a.y, giro: Math.atan2(b.y - a.y, b.x - a.x) * 0.45 };
}

/**
 * Liga o céu. Devolve `{ registrar(cena), acordar() }` — cena = { ativa(): boolean, desenhar(g, W, H, t): number }
 * (o número é quantos morcegos ela desenhou) — ou null quando não há céu (reduzido/estático).
 */
export function iniciarCeu({ gsap, ScrollTrigger, menosMovimento, CELULAR }) {
  const tela = document.querySelector('.ceu');
  if (!tela || menosMovimento || !gsap || !ScrollTrigger) return null;
  const g = tela.getContext('2d');
  if (!g) return null;

  const cenas = [];
  let W = 0, H = 0, dpr = 1, raf = 0;
  const medir = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
  };
  const laco = agora => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, tela.width, tela.height);
    const ativas = cenas.filter(c => c.ativa());
    if (!ativas.length) { tela.dataset.desenhados = '0'; raf = 0; return; }
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

  // nuvens das viradas: o avanço u acompanha o topo da seção atravessando a tela
  const celular = matchMedia(CELULAR).matches;
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--vermelho').trim() || '#E8392F';
  ['#producoes', '#sets'].forEach((seletor, i) => {
    const secao = document.querySelector(seletor);
    if (!secao) return;
    const bando = criarNuvem(celular ? 40 : 90, 101 + i * 17);
    let u = 0;
    ScrollTrigger.create({
      trigger: secao, start: 'top bottom', end: 'top top',
      onUpdate: s => { u = s.progress; acordar(); },
      onToggle: acordar,
    });
    registrar({
      ativa: () => u > 0 && u < 1,
      desenhar(g, W, H, t) {
        g.fillStyle = cor;
        const esc = Math.max(0.8, W / 900);
        let n = 0;
        for (const m of bando) {
          const p = posicaoNuvem(m, u, t, W, H);
          if (p.x < -120 || p.x > W + 120 || p.y < -120 || p.y > H + 120) continue; // fora da tela
          desenharMorcego(g, p.x, p.y, m.tam * esc, t * m.bate + m.fase, p.giro);
          n++;
        }
        return n;
      },
    });
  });
  return { registrar, acordar };
}
