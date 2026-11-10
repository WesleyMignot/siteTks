// Controle dos vídeos decorativos: só tocam quando visíveis; play() nunca gera erro.

/** Toca o vídeo (carregando data-src na primeira vez). Rejeições de autoplay são ignoradas. */
export function tocar(video) {
  if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
  video.muted = true;
  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

export function pausar(video) {
  if (!video.paused) video.pause();
}

/** Toca/pausa todo video[data-auto] dentro de `raiz` conforme entra/sai da tela. */
export function observarVideos(raiz, { menosMovimento }) {
  if (menosMovimento) return;
  const io = new IntersectionObserver(
    entradas => entradas.forEach(e => (e.isIntersecting ? tocar(e.target) : pausar(e.target))),
    { threshold: 0.15 },
  );
  raiz.querySelectorAll('video[data-auto]').forEach(v => io.observe(v));
}
