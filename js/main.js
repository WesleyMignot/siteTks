// Brunin Tks — monta o contexto (GSAP, ScrollTrigger, Lenis) e inicia cada seção.
// Se o GSAP não carregar (CDN fora do ar), a página cai no modo estático: o conteúdo nunca fica preso.
/* global gsap, ScrollTrigger, Lenis */
import { iniciarPreloader, iniciarHeader, liberarPagina } from './interface.js';
import { observarVideos } from './videos.js';
import { iniciarSets } from './sets.js';
import {
  iniciarHero, iniciarLetreiros, iniciarEstrelas, iniciarReveals, iniciarContadores, iniciarFotosDuplas,
  iniciarProducoes, iniciarDivisores, iniciarCartaz,
} from './animacoes.js';
import { iniciarAssinatura } from './assinatura.js';
import { iniciarRevoadas } from './revoadas.js';

const CELULAR = '(max-width: 820px)';
const raiz = document.documentElement;
const temGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const menosMovimento = !temGsap || matchMedia('(prefers-reduced-motion: reduce)').matches;
const celular = matchMedia(CELULAR).matches;

raiz.classList.toggle('menos-movimento', menosMovimento);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
if (temGsap) gsap.registerPlugin(ScrollTrigger);

let lenis = null;
if (!menosMovimento && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
raiz.dataset.lenis = lenis ? 'on' : 'off';

const ctx = {
  gsap: temGsap ? gsap : null,
  ScrollTrigger: temGsap ? ScrollTrigger : null,
  lenis, menosMovimento, celular, CELULAR,
};

/** Uma seção com erro não pode impedir as outras nem o fim do preloader. */
function seguro(nome, fn) {
  try { return fn(); } catch (e) { console.error(`[${nome}]`, e); return undefined; }
}

seguro('header', () => iniciarHeader(ctx));
seguro('hero', () => iniciarHero(ctx));
seguro('divisores', () => iniciarDivisores()); // antes dos letreiros: muda a largura do trilho
seguro('letreiros', () => iniciarLetreiros(ctx));
seguro('cartaz', () => iniciarCartaz(ctx)); // depois dos divisores: os morcegos mudam a quebra das linhas
seguro('reveals', () => iniciarReveals(ctx));
seguro('contadores', () => iniciarContadores(ctx));
seguro('fotos', () => iniciarFotosDuplas());
seguro('producoes', () => iniciarProducoes(ctx));
seguro('sets', () => iniciarSets(ctx));
seguro('assinatura', () => iniciarAssinatura(ctx));
seguro('revoadas', () => iniciarRevoadas(ctx));

seguro('estrelas', () => iniciarEstrelas(ctx));
seguro('videos', () => observarVideos(document, ctx));

iniciarPreloader(ctx)
  .catch(e => { console.error('[preloader]', e); liberarPagina(ctx); })
  .then(() => ctx.ScrollTrigger?.refresh());

export default ctx;
