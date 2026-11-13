// Player do SoundCloud nos sets de áudio. O botão "▶ Ouvir aqui" vira o player oficial embutido
// (w.soundcloud.com) só no clique: antes disso nada é carregado do SoundCloud (página leve, sem cookies
// de terceiros). O áudio vem do SoundCloud; nada fica hospedado no site. Só um player toca por vez.

const PLAYER = 'https://w.soundcloud.com/player/';
const API = 'https://w.soundcloud.com/player/api.js';

/** URL do player compacto (vermelho, tocando ao abrir) para uma faixa do SoundCloud. */
export function urlPlayer(faixa) {
  const p = new URLSearchParams({
    url: faixa, color: '#e8392f', auto_play: 'true', hide_related: 'true',
    show_comments: 'false', show_reposts: 'false', show_teaser: 'false', visual: 'false',
  });
  return `${PLAYER}?${p}`;
}

/** Revela os botões "Ouvir aqui" (sem JS eles ficam escondidos) e troca cada um pelo player no clique. */
export function iniciarSoundcloud() {
  const botoes = [...document.querySelectorAll('.set__ouvir')];
  if (!botoes.length) return;
  const widgets = [];
  let api = null;
  // a Widget API só serve para pausar os outros; se não carregar, cada player ainda toca sozinho
  const carregarApi = () => (api ??= new Promise(ok => {
    const s = document.createElement('script');
    s.src = API; s.async = true;
    s.onload = () => ok(window.SC ?? null);
    s.onerror = () => ok(null);
    document.head.append(s);
  }));
  const ligar = (iframe, SC) => {
    if (!SC?.Widget) return;
    const w = SC.Widget(iframe);
    widgets.push(w);
    w.bind(SC.Widget.Events.PLAY, () => widgets.forEach(o => { if (o !== w) o.pause(); }));
  };

  for (const b of botoes) {
    b.hidden = false;
    b.addEventListener('click', () => {
      const nome = b.closest('.set')?.querySelector('.set__titulo')?.textContent.trim() ?? '';
      const f = document.createElement('iframe');
      f.className = 'set__player';
      f.title = `Player do SoundCloud: ${nome}`;
      f.height = '166';
      f.allow = 'autoplay';
      f.src = urlPlayer(b.dataset.faixa);
      b.replaceWith(f);
      f.focus(); // o foco do teclado continua no lugar do botão
      carregarApi().then(SC => ligar(f, SC));
    });
  }
}
