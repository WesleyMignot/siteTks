// Animações das seções (hero, letreiros, estrelas...). Cada função recebe o ctx de main.js.
import { escolherHero, formatarContagem, escolherJanela } from './util.js';
import { tocar, pausar } from './videos.js';
import { criarMorcegoSvg, animarDivisores } from './morcego.js';

/** Divide o texto de `el` em <span class="palavra"> (para revelar palavra por palavra). */
export function dividirPalavras(el) {
  const palavras = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  palavras.forEach((p, i) => {
    const span = document.createElement('span');
    span.className = 'palavra';
    span.textContent = p;
    el.append(span, i < palavras.length - 1 ? ' ' : '');
  });
  return el.querySelectorAll('.palavra');
}

/**
 * Hero: o card (.hero__janela recortada por clip-path no retângulo de .hero__card-ref) toca o reel da
 * janela desde o início e cresce com o scroll até cobrir a tela, virando a abertura da Carreira.
 */
export function iniciarHero({ gsap, menosMovimento }) {
  if (menosMovimento) return; // reduzido/estático: card pequeno com pôster, frase na própria Carreira
  document.querySelector('.hero__video').src = escolherHero(innerWidth);
  document.documentElement.classList.add('anima-hero');

  // o card toca desde o início. Não usa o observador geral (15% de área visível): recortado no tamanho
  // do card, o vídeo de tela cheia nunca passava disso e ficava parado até o scroll. Pausa fora do hero.
  const janela = document.querySelector('.hero__janela video');
  janela.src = escolherJanela(innerWidth);
  janela.preload = 'auto';
  new IntersectionObserver(es => (es[es.length - 1].isIntersecting ? tocar(janela) : pausar(janela)))
    .observe(document.getElementById('hero'));

  const palco = document.querySelector('.hero__palco');
  const ref = document.querySelector('.hero__card-ref');
  // Medidas relativas ao palco (valem mesmo se o refresh acontecer com a página rolada).
  const caixa = () => {
    const p = palco.getBoundingClientRect(), r = ref.getBoundingClientRect();
    return { t: r.top - p.top, l: r.left - p.left, b: p.bottom - r.bottom, d: p.right - r.right, cx: r.left - p.left + r.width / 2, cy: r.top - p.top + r.height / 2 };
  };
  const recorte = () => { const c = caixa(); return `inset(${c.t}px ${c.d}px ${c.b}px ${c.l}px round 10px)`; };
  const origem = () => { const c = caixa(); return `${c.cx}px ${c.cy}px`; };
  const palavras = dividirPalavras(document.querySelector('.hero__frase'));

  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
  })
    .fromTo('.hero__janela',
      { clipPath: recorte, rotation: -4, transformOrigin: origem },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', rotation: 0, duration: 0.58, ease: 'power2.inOut' }, 0.12)
    .to('.hero__logo', { scale: 1.35, opacity: 0, duration: 0.45 }, 0.12)
    .to(['.hero__topo', '.hero__base', '#hero .letreiro', '#hero .estrela'], { opacity: 0, y: 40, duration: 0.35 }, 0.12)
    .to('.hero__escuro', { opacity: 0.6, duration: 0.5 }, 0.12)
    .to('.hero__abertura', { opacity: 1, duration: 0.1 }, 0.7)
    .fromTo(palavras, { opacity: 0.15 }, { opacity: 1, stagger: 0.015, duration: 0.12 }, 0.74)
    .set({}, {}, 1); // timeline com duração 1 = progresso do scroll
}

/** Line-up em cartaz: os 20 nomes acendem em sequência com o scroll. Reduzido/estático: todos acesos (CSS). */
export function iniciarCartaz({ gsap, menosMovimento }) {
  if (menosMovimento) return;
  document.documentElement.classList.add('anima-cartaz');
  gsap.to('.cartaz__nome', {
    opacity: 1, stagger: 0.05, ease: 'none',
    scrollTrigger: { trigger: '.cartaz', start: 'top 75%', end: 'bottom 55%', scrub: true },
  });
}

/** Letreiros infinitos (.letreiro__trilho com o conteúdo duplicado). Aceleram com o scroll. */
export function iniciarLetreiros({ gsap, ScrollTrigger, menosMovimento }) {
  if (menosMovimento) return;
  const tweens = [...document.querySelectorAll('.letreiro__trilho')].map(trilho => {
    const sentido = Number(trilho.closest('.letreiro').dataset.sentido ?? 1);
    const duracao = Number(trilho.closest('.letreiro').dataset.duracao ?? 30);
    return sentido > 0
      ? gsap.to(trilho, { xPercent: -50, repeat: -1, ease: 'none', duration: duracao })
      : gsap.fromTo(trilho, { xPercent: -50 }, { xPercent: 0, repeat: -1, ease: 'none', duration: duracao });
  });
  let volta;
  ScrollTrigger.create({
    onUpdate(self) {
      const escala = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 4);
      tweens.forEach(t => t.timeScale(escala));
      clearTimeout(volta);
      volta = setTimeout(() => tweens.forEach(t => gsap.to(t, { timeScale: 1, duration: 0.6 })), 120);
    },
  });
}

/** Estrelas de 4 pontas giram conforme o scroll da página (sentido alternado). */
export function iniciarEstrelas({ gsap, menosMovimento }) {
  if (menosMovimento) return;
  document.querySelectorAll('main .estrela').forEach((estrela, i) => {
    gsap.to(estrela, {
      rotation: i % 2 ? -360 : 360, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
    });
  });
}

/** [data-revelar]: revela palavra por palavra com o scroll. [data-aparecer]: sobe e aparece ao entrar. */
export function iniciarReveals({ gsap, menosMovimento }) {
  if (menosMovimento) return;
  document.querySelectorAll('[data-revelar]').forEach(el => {
    gsap.fromTo(dividirPalavras(el), { opacity: 0.15 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 40%', scrub: true },
    });
  });
  document.querySelectorAll('[data-aparecer]').forEach(el => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
  document.querySelectorAll('[data-zoom] img').forEach(img => {
    gsap.fromTo(img, { scale: 1 }, {
      scale: 1.15, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/**
 * [data-contar]: conta de data-de (padrão 0) até o alvo quando entra na tela.
 * O número animado fica aria-hidden; o valor final vai num texto oculto para leitor de tela.
 */
export function iniciarContadores({ gsap, menosMovimento }) {
  if (menosMovimento) return; // o HTML já traz o valor final
  document.querySelectorAll('[data-contar]').forEach(el => {
    const final = el.textContent;
    const leitor = document.createElement('span');
    leitor.className = 'visualmente-oculto';
    leitor.textContent = final;
    el.after(leitor);
    el.setAttribute('aria-hidden', 'true');

    const alvo = Number(el.dataset.contar);
    const estado = { v: Number(el.dataset.de ?? 0) };
    const milhar = 'milhar' in el.dataset;
    const sufixo = el.dataset.sufixo ?? '';
    const mostrar = () => { el.textContent = formatarContagem(estado.v, { milhar }) + sufixo; };
    mostrar();
    gsap.to(estado, {
      v: alvo, duration: 1.6, ease: 'power2.out', onUpdate: mostrar,
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });
}

/** Fotos com versão colorida (.foto-dupla): toque alterna a cor no celular. */
export function iniciarFotosDuplas() {
  document.querySelectorAll('.foto-dupla').forEach(f => {
    f.addEventListener('pointerup', e => {
      if (e.pointerType !== 'mouse') f.classList.toggle('foto-dupla--cor');
    });
  });
}

/**
 * Produções. Cada faixa tem a foto da festa apagada no fundo, que acende no hover/foco (CSS)
 * ou, no celular, quando a faixa passa pelo meio da tela.
 * Desktop: painéis abertos. Celular: cada linha é um acordeão. O modo acompanha a largura (ex.: iPad girando).
 */
export function iniciarProducoes({ gsap, ScrollTrigger, CELULAR }) {
  const secao = document.getElementById('producoes');
  const linhas = [...secao.querySelectorAll('.producao')];
  const mql = matchMedia(CELULAR);
  const partes = linhas.map(l => [l.querySelector('.producao__botao'), l.querySelector('.producao__painel')]);

  const aplicarModo = () => partes.forEach(([botao, painel]) => {
    botao.setAttribute('aria-expanded', String(!mql.matches));
    painel.hidden = mql.matches;
  });
  aplicarModo();
  mql.addEventListener('change', aplicarModo);
  partes.forEach(([botao, painel]) => botao.addEventListener('click', () => {
    if (!mql.matches) return; // no desktop o painel fica sempre aberto
    const abrir = botao.getAttribute('aria-expanded') !== 'true';
    botao.setAttribute('aria-expanded', String(abrir));
    painel.hidden = !abrir;
    ScrollTrigger?.refresh(); // a página mudou de altura: recalcula os gatilhos daqui para baixo
  }));

  if (!gsap) return; // modo estático: a faixa acende só no hover e no foco (CSS)
  // Celular: a faixa que passa pelo meio da tela acende.
  gsap.matchMedia().add(CELULAR, () => {
    linhas.forEach(linha => ScrollTrigger.create({
      trigger: linha, start: 'top 55%', end: 'bottom 45%', toggleClass: 'producao--acesa',
    }));
    return () => linhas.forEach(l => l.classList.remove('producao--acesa'));
  });
}

/** Troca o ✦ de cada .div-morcego pelo morcego (o ✦ fica como fallback sem JS). */
export function iniciarDivisores(ctx) {
  document.querySelectorAll('.div-morcego').forEach(d => d.replaceChildren(criarMorcegoSvg('morcego morcego--div')));
  animarDivisores(ctx);
}
