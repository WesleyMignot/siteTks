// Galeria infinita em 3D: imagens num túnel, em ângulos diferentes, que nunca acabam.
// As funções puras (criarRng, layoutGaleria, envolverZ, aparencia) têm teste unitário.

const BLENDS = ['normal', 'screen', 'normal', 'lighten', 'normal', 'difference'];

/** Gerador pseudoaleatório determinístico (mulberry32): mesma semente, mesma sequência em [0,1). */
export function criarRng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Posição base de cada item: x,y numa espiral de ângulo áureo (espalha sem grade),
 * z distribuído na profundidade, rotações fixas pela semente.
 * x,y são frações de meia tela (−0.9..0.9); z em px (−prof..0].
 */
export function layoutGaleria(n, { semente, prof }) {
  const rng = criarRng(semente);
  return Array.from({ length: n }, (_, i) => {
    const ang = i * 2.39996;
    const r = 0.35 + 0.55 * ((i * 0.618034) % 1);
    return {
      x: Math.cos(ang) * r,
      y: Math.sin(ang) * r * 0.8,
      z: -(i * prof) / n || 0,
      rx: (rng() * 2 - 1) * 25,
      ry: (rng() * 2 - 1) * 25,
      rz: (rng() * 2 - 1) * 12,
      blend: BLENDS[i % BLENDS.length],
    };
  });
}

/** Leva z para o intervalo (frente − prof, frente]: o que passa da câmera volta para o fundo. */
export const envolverZ = (z, prof, frente) => frente - ((((frente - z) % prof) + prof) % prof);

/** Aparência pela profundidade: some no fundo, cheio no meio, some de novo ao passar da câmera. */
export function aparencia(z, prof, frente) {
  const p = (z - (frente - prof)) / prof; // 0 no fundo → 1 na frente
  const fade = z > frente - 250 ? Math.max(0, (frente - z) / 250) : 1;
  return {
    opacidade: Math.min(1, p * 2.2) * fade,
    blur: (1 - p) * 6,
    brilho: 0.35 + 0.65 * p,
  };
}

function criarItem({ tks, cor, alt }) {
  const fig = document.createElement('figure');
  fig.className = 'galeria__item foto-dupla';
  const img = document.createElement('img');
  Object.assign(img, { className: 'tks', src: tks, alt, loading: 'lazy', decoding: 'async' });
  fig.append(img);
  if (cor) {
    const c = document.createElement('img');
    Object.assign(c, { className: 'cor', src: cor, alt: '', loading: 'lazy', decoding: 'async' });
    fig.append(c);
    fig.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') fig.classList.add('foto-dupla--cor'); });
    fig.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') fig.classList.remove('foto-dupla--cor'); });
    fig.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') fig.classList.toggle('foto-dupla--cor'); });
  }
  return fig;
}

/**
 * Monta a galeria dentro de `el` (section com .galeria__palco > .galeria__itens).
 * Câmera = deriva contínua + progresso do scroll + impulso da velocidade; z em módulo → infinito.
 */
export function iniciarGaleria(el, itens, { celular, menosMovimento, ScrollTrigger }) {
  const palco = el.querySelector('.galeria__palco');
  const camada = el.querySelector('.galeria__itens');
  const n = Math.min(itens.length, celular ? 10 : 15);
  const nos = itens.slice(0, n).map(criarItem);
  camada.replaceChildren(...nos);

  if (menosMovimento) {
    el.classList.add('galeria--estatica');
    return { destruir() { camada.replaceChildren(); el.classList.remove('galeria--estatica'); } };
  }

  const prof = celular ? 2200 : 3000;
  const frente = 400;
  const base = layoutGaleria(n, { semente: 7, prof });
  nos.forEach((no, i) => { no.style.mixBlendMode = base[i].blend; });

  let w = palco.clientWidth;
  let h = palco.clientHeight;
  let progresso = 0;
  let impulso = 0;
  let raf = 0;
  const inicio = performance.now();

  const gatilho = ScrollTrigger.create({
    trigger: el, start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      progresso = self.progress;
      impulso = Math.max(-1200, Math.min(1200, impulso + self.getVelocity() * 0.05));
    },
  });

  function quadro(agora) {
    const cam = (agora - inicio) * 0.25 + progresso * prof * 1.5 + impulso;
    impulso *= 0.92;
    for (let i = 0; i < n; i++) {
      const b = base[i];
      const z = envolverZ(b.z + cam, prof, frente);
      const a = aparencia(z, prof, frente);
      const s = nos[i].style;
      s.transform = `translate3d(${(b.x * w / 2).toFixed(1)}px, ${(b.y * h / 2).toFixed(1)}px, ${z.toFixed(1)}px) `
        + `rotateX(${b.rx.toFixed(1)}deg) rotateY(${b.ry.toFixed(1)}deg) rotateZ(${b.rz.toFixed(1)}deg)`;
      s.opacity = a.opacidade.toFixed(3);
      s.filter = celular
        ? `brightness(${a.brilho.toFixed(2)})`
        : `blur(${a.blur.toFixed(1)}px) brightness(${a.brilho.toFixed(2)})`;
    }
    raf = requestAnimationFrame(quadro);
  }

  const visivel = new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (e.isIntersecting) raf = requestAnimationFrame(quadro);
  });
  visivel.observe(el);

  const medir = () => { w = palco.clientWidth; h = palco.clientHeight; };
  addEventListener('resize', medir);

  return {
    destruir() {
      cancelAnimationFrame(raf);
      visivel.disconnect();
      gatilho.kill();
      removeEventListener('resize', medir);
      camada.replaceChildren();
    },
  };
}
