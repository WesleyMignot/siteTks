// Brunin Tks — monta o contexto (GSAP, ScrollTrigger, Lenis) e inicia cada seção.
/* global gsap, ScrollTrigger, Lenis */

const raiz = document.documentElement;
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const celular = matchMedia('(max-width: 820px)').matches;

raiz.classList.toggle('menos-movimento', menosMovimento);
gsap.registerPlugin(ScrollTrigger);

let lenis = null;
if (!menosMovimento) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
raiz.dataset.lenis = lenis ? 'on' : 'off';

const ctx = { gsap, ScrollTrigger, lenis, menosMovimento, celular };

document.body.classList.add('pronto');

export default ctx;
