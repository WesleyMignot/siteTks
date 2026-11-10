// Animações das seções (hero, letreiros, estrelas...). Cada função recebe o ctx de main.js.
import { escolherHero, formatarContagem } from './util.js';

/** Hero: escolhe a versão do reel e aplica o parallax de saída. */
export function iniciarHero({ gsap, menosMovimento }) {
  if (menosMovimento) return; // movimento reduzido: só o pôster, sem baixar o vídeo
  document.querySelector('.hero__video').src = escolherHero(innerWidth);
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
    .fromTo('.hero__video', { scale: 1 }, { scale: 1.12, ease: 'none' }, 0)
    .fromTo('.hero__escuro', { opacity: 0 }, { opacity: 0.5, ease: 'none' }, 0)
    .to('.hero__logo', { yPercent: -30, ease: 'none' }, 0);
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
    const palavras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    palavras.forEach((p, i) => {
      const span = document.createElement('span');
      span.className = 'palavra';
      span.textContent = p;
      el.append(span, i < palavras.length - 1 ? ' ' : '');
    });
    gsap.fromTo(el.querySelectorAll('.palavra'), { opacity: 0.15 }, {
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
 * Produções. Desktop: painéis abertos e uma foto que segue o cursor sobre a linha.
 * Celular: cada linha é um acordeão. O modo acompanha a largura (ex.: iPad girando).
 */
export function iniciarProducoes({ gsap, menosMovimento, CELULAR }) {
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
  }));

  if (!gsap) return; // modo estático: sem foto flutuante
  const flut = secao.querySelector('.producoes__flutuante');
  const irX = gsap.quickTo(flut, 'x', { duration: menosMovimento ? 0 : 0.45, ease: 'power3.out' });
  const irY = gsap.quickTo(flut, 'y', { duration: menosMovimento ? 0 : 0.45, ease: 'power3.out' });
  const girar = gsap.quickTo(flut, 'rotation', { duration: 0.6, ease: 'power3.out' });
  let ultimoX = 0;

  secao.addEventListener('pointermove', e => {
    if (mql.matches) return;
    const caixa = secao.getBoundingClientRect();
    const x = e.clientX - caixa.left;
    const y = e.clientY - caixa.top;
    irX(x - flut.offsetWidth / 2);
    irY(y - flut.offsetHeight / 2);
    if (!menosMovimento) girar(Math.max(-12, Math.min(12, (x - ultimoX) * 0.6)));
    ultimoX = x;
  });
  linhas.forEach(linha => {
    linha.addEventListener('pointerenter', () => {
      if (mql.matches) return;
      linhas.forEach(l => l.classList.toggle('producao--ativa', l === linha));
      if (!flut.src.endsWith(linha.dataset.foto)) flut.src = linha.dataset.foto;
      gsap.to(flut, { opacity: 1, duration: 0.3 });
    });
  });
  secao.querySelector('.producoes__lista').addEventListener('pointerleave', () => {
    linhas.forEach(l => l.classList.remove('producao--ativa'));
    gsap.to(flut, { opacity: 0, duration: 0.3 });
  });
}

/** Assinatura do reel: o rabisco vermelho se desenha com o scroll e a cortina vermelha leva ao Contrate. */
export function iniciarAssinatura({ gsap, menosMovimento }) {
  if (menosMovimento) return; // CSS mostra o traço completo, sem cortina
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#assinatura', start: 'top top', end: 'bottom bottom', scrub: true },
  })
    .fromTo('.assinatura__traco', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7 })
    .fromTo('.assinatura__cortina', { scaleY: 0 }, { scaleY: 1, duration: 0.3 });
}
