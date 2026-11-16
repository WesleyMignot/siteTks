// Sets: pilha de cortinas fixa na tela; cada set entra sobre o anterior e só o ativo toca seu clipe.
import { tocar, pausar } from './videos.js';
import { escolherVersaoSet } from './util.js';

/**
 * Celular em pé: os sets horizontais usam a versão vertical (-cel), enquadrada no Bruno. Só troca data-src e pôster
 * (nada é baixado antes da hora); roda em qualquer modo (o reduzido mostra só o pôster). Girar o aparelho troca a
 * versão, inclusive a do vídeo já carregado, que segue tocando se estava tocando.
 */
export function iniciarVersoesSets() {
  const retrato = matchMedia('(orientation: portrait)');
  const videos = [...document.querySelectorAll('.set__video[data-src-cel]')];
  for (const v of videos) {
    v.dataset.srcPc = v.dataset.src;
    v.dataset.posterPc = v.getAttribute('poster') ?? '';
  }
  const aplicar = () => videos.forEach(v => {
    const { src, poster } = escolherVersaoSet({
      src: v.dataset.srcPc, srcCel: v.dataset.srcCel, poster: v.dataset.posterPc, posterCel: v.dataset.posterCel,
    }, retrato.matches);
    if (v.dataset.src === src) return;
    v.dataset.src = src;
    v.setAttribute('poster', poster);
    if (!v.getAttribute('src')) return;
    const tocando = !v.paused;
    v.src = src;
    if (tocando) tocar(v);
  });
  aplicar();
  retrato.addEventListener('change', aplicar);
}

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
