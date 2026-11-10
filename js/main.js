// Brunin Tks — monta o contexto (GSAP, ScrollTrigger, Lenis) e inicia cada seção.
/* global gsap, ScrollTrigger, Lenis */
import { iniciarPreloader, iniciarHeader } from './interface.js';
import { observarVideos } from './videos.js';
import { iniciarHero, iniciarLetreiros, iniciarEstrelas } from './animacoes.js';

const raiz = document.documentElement;
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const celular = matchMedia('(max-width: 820px)').matches;

raiz.classList.toggle('menos-movimento', menosMovimento);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
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

iniciarHeader(ctx);
iniciarHero(ctx);
iniciarLetreiros(ctx);
iniciarEstrelas(ctx);
observarVideos(document, ctx);

await iniciarPreloader(ctx);
ScrollTrigger.refresh();

export default ctx;
