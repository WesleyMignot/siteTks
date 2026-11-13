// Revoadas: um bando de morcegos cruza a tela, da esquerda para a direita, na virada para
// Produções, Sets e Assinatura. Scrub no scroll; sem revoada no modo reduzido ou estático.
import { criarRng } from './util.js';
import { criarMorcegoSvg } from './morcego.js';

/** Monta e anima cada [data-revoada]. O contêiner tem overflow: hidden (sem rolagem lateral). */
export function iniciarRevoadas({ gsap, menosMovimento, CELULAR }) {
  if (menosMovimento) return;
  const celular = matchMedia(CELULAR).matches;
  document.querySelectorAll('[data-revoada]').forEach((caixa, i) => {
    const r = criarRng(101 + i * 17);
    const n = celular ? 3 + Math.floor(r() * 3) : 6 + Math.floor(r() * 5);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: caixa.closest('section'), start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true,
      },
    });
    for (let k = 0; k < n; k++) {
      const m = criarMorcegoSvg('morcego morcego--revoada');
      m.style.width = `calc(clamp(28px, 4vw, 64px) * ${(0.6 + r() * 0.7).toFixed(2)})`;
      m.style.top = `${(20 + r() * 60).toFixed(1)}%`;
      m.style.setProperty('--bate', `${(0.25 + r() * 0.2).toFixed(2)}s`);
      m.style.setProperty('--atraso', `${(-r()).toFixed(2)}s`);
      caixa.append(m);
      const atraso = r() * 0.3, giro = -10 + r() * 20;
      tl.fromTo(m, { x: () => -0.15 * innerWidth, rotation: giro }, { x: () => 1.15 * innerWidth, rotation: -giro, duration: 0.7 }, atraso)
        .fromTo(m, { y: 0 }, { y: () => -0.25 * innerHeight, duration: 0.35, ease: 'sine.out' }, atraso)
        .to(m, { y: () => -0.05 * innerHeight, duration: 0.35, ease: 'sine.in' }, atraso + 0.35);
    }
    tl.set({}, {}, 1); // duração 1 = progresso do scroll
  });
}
