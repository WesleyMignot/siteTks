// Preloader, header (logo, relógio de POA, menu) e troca de cor do header sobre o Contrate.
import { horaPOA } from './util.js';

const espera = ms => new Promise(r => setTimeout(r, ms));

function carregarImagem(src) {
  return new Promise(ok => {
    const img = new Image();
    img.onload = img.onerror = () => ok();
    img.src = src;
  });
}

/** Esconde o preloader e marca a página como utilizável (também usado se algo falhar). */
export function liberarPagina({ lenis }) {
  document.getElementById('preloader').style.display = 'none';
  lenis?.start();
  document.body.classList.add('pronto');
}

/** Mostra o contador 000→100, sobe a cortina vermelha e libera a página (body.pronto). */
export async function iniciarPreloader(ctx) {
  const { gsap, lenis, menosMovimento } = ctx;
  const el = document.getElementById('preloader');
  const numero = el.querySelector('.preloader__numero');
  const cortina = el.querySelector('.preloader__cortina');
  if (!gsap) { liberarPagina(ctx); return; } // modo estático: sem animação de entrada
  const carregou = Promise.race([
    Promise.all([document.fonts.ready, carregarImagem('assets/video/hero.jpg')]),
    espera(6000),
  ]);

  lenis?.stop();
  if (menosMovimento) {
    await carregou;
    numero.textContent = '100';
    await gsap.to(el, { autoAlpha: 0, duration: 0.3 });
  } else {
    const estado = { v: 0 };
    const mostrar = () => { numero.textContent = String(Math.round(estado.v)).padStart(3, '0'); };
    gsap.to(estado, { v: 90, duration: 1.2, ease: 'power1.inOut', onUpdate: mostrar });
    await Promise.all([carregou, espera(1200)]);
    await gsap.to(estado, { v: 100, duration: 0.3, ease: 'power1.out', onUpdate: mostrar });
    await gsap.to(cortina, { scaleY: 1, duration: 0.6, ease: 'power3.inOut' });
    await gsap.to(el, { yPercent: -100, duration: 0.7, ease: 'power3.inOut' });
  }
  el.style.display = 'none';
  lenis?.start();
  document.body.classList.add('pronto');
}

function iniciarRelogio() {
  const h = document.querySelector('.relogio__h');
  const m = document.querySelector('.relogio__m');
  const atualizar = () => { [h.textContent, m.textContent] = horaPOA(new Date()).split(':'); };
  atualizar();
  setInterval(atualizar, 15_000);
}

function iniciarMenu({ gsap, lenis, menosMovimento }) {
  const botao = document.getElementById('menu-botao');
  const menu = document.getElementById('menu');
  const links = [...menu.querySelectorAll('.menu__links a')];
  const aberto = () => botao.getAttribute('aria-expanded') === 'true';

  // Com o menu aberto, o conteúdo atrás fica inerte: Tab não escapa para o que está escondido.
  const atras = [document.querySelector('main'), document.querySelector('footer')];

  function abrir() {
    botao.setAttribute('aria-expanded', 'true');
    botao.setAttribute('aria-label', 'Fechar menu');
    menu.hidden = false;
    atras.forEach(el => { el.inert = true; });
    document.body.classList.add('menu-aberto');
    lenis?.stop();
    if (!menosMovimento) {
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3 }); // opacity (não autoAlpha): visibility:hidden impediria o foco
      gsap.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
    }
    links[0].focus();
  }

  function fechar({ devolverFoco = true } = {}) {
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu');
    menu.hidden = true;
    atras.forEach(el => { el.inert = false; });
    document.body.classList.remove('menu-aberto');
    lenis?.start();
    if (devolverFoco) botao.focus();
  }

  botao.addEventListener('click', () => (aberto() ? fechar() : abrir()));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && aberto()) fechar(); });

  // Âncoras internas (menu, logo do header, botões "topo"): rolagem suave via Lenis.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const alvo = document.querySelector(a.getAttribute('href'));
    if (!alvo) return;
    e.preventDefault();
    if (aberto()) fechar({ devolverFoco: false });
    if (lenis) lenis.scrollTo(alvo, { duration: 1.4 });
    else alvo.scrollIntoView();
    // O foco vai junto: o próximo Tab continua na seção de destino, não volta ao topo.
    if (!alvo.hasAttribute('tabindex')) alvo.tabIndex = -1;
    alvo.focus({ preventScroll: true });
  });
}

/** Header: relógio, menu e texto escuro sobre a seção vermelha do Contrate. */
export function iniciarHeader(ctx) {
  iniciarRelogio();
  iniciarMenu(ctx);
  ctx.ScrollTrigger?.create({
    trigger: '#contrate',
    start: 'top 60px',
    end: 'bottom top',
    toggleClass: { targets: '.header', className: 'header--escuro' },
  });
}
