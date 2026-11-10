// Animações das seções (hero, letreiros, estrelas...). Cada função recebe o ctx de main.js.
import { escolherHero } from './util.js';

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
