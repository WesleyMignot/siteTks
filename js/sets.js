// Sets: pilha de cortinas fixa na tela; cada set entra sobre o anterior e só o ativo toca seu clipe.
import { tocar, pausar } from './videos.js';

export function iniciarSets({ gsap, lenis, menosMovimento }) {
  const pilha = document.querySelector('.sets__pilha');
  const sets = [...pilha.querySelectorAll('.set')];
  const videos = sets.map(s => s.querySelector('.set__video'));
  const contador = pilha.querySelector('.sets__contador');
  const total = sets.length;
  if (menosMovimento) return; // blocos empilhados, só pôster (CSS em .menos-movimento)

  let ativo = -1;
  const ativar = i => {
    if (i === ativo) return;
    ativo = i;
    videos.forEach((v, j) => (j === i ? tocar(v) : pausar(v)));
    contador.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  };

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pilha, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: self => ativar(Math.round(self.progress * (total - 1))),
      onToggle: self => {
        if (!self.isActive) { videos.forEach(pausar); ativo = -1; }
        else ativar(Math.round(self.progress * (total - 1)));
      },
    },
  });
  for (let i = 1; i < total; i++) {
    // clip-path (não scaleY): a cortina revela sem achatar o texto do slide
    tl.fromTo(sets[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' })
      .to(videos[i - 1], { yPercent: -15 }, '<');
  }

  // Teclado: focar o link de um set ainda coberto rola até o ponto em que aquele set está à mostra.
  pilha.addEventListener('focusin', e => {
    const i = sets.indexOf(e.target.closest('.set'));
    if (i < 0) return;
    const topo = pilha.getBoundingClientRect().top + window.scrollY;
    const y = topo + ((pilha.offsetHeight - innerHeight) * i) / (total - 1);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  });
}
