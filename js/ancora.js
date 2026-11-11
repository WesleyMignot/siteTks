// Mantém o lugar do visitante quando a tela muda de tamanho (girar o celular, redimensionar a janela).
// As seções altas (hero 250vh, pilha dos sets, assinatura 300vh) mudam de altura em px no resize, mas o
// scroll continua no mesmo px: sem isto o visitante cai em outra seção.

/**
 * Em qual bloco o topo da tela está e quanto dele já rolou. `rets` vem de getBoundingClientRect.
 * Blocos mais altos que a tela usam o curso (altura − tela) como 1; o que passa do curso fica em px (`resto`).
 */
export function medirAncora(rets, alturaTela) {
  for (let i = 0; i < rets.length; i++) {
    const { top, height } = rets[i];
    if (top <= 0 && top + height > 0) {
      const curso = height > alturaTela ? height - alturaTela : height;
      return { i, fracao: Math.min(1, -top / curso), resto: Math.max(0, -top - curso) };
    }
  }
  return null;
}

/** Posição de scroll (documento) que devolve a mesma âncora com as medidas novas do bloco. */
export function destinoAncora({ fracao, resto }, { topoDoc, height }, alturaTela) {
  const curso = height > alturaTela ? height - alturaTela : height;
  return topoDoc + fracao * curso + resto;
}

/**
 * Grava a âncora a cada scroll e, depois de um resize de verdade (largura mudou; ou altura, fora do toque —
 * a barra de endereço do celular só muda a altura), volta a ela quando o ScrollTrigger termina o refresh.
 */
export function iniciarAncora({ ScrollTrigger, lenis }) {
  if (!ScrollTrigger) return; // sem GSAP as seções não têm altura em vh (modo estático)
  // a pilha dos sets entra separada da abertura da seção, para manter o mesmo set na tela
  const blocos = [...document.querySelectorAll('main > section:not(#sets), #sets > .sets__topo, #sets > .sets__pilha, #sets > .destaques, body > footer')];
  const toque = matchMedia('(pointer: coarse)').matches;
  let ancora = null, pendente = false, fim = 0, largura = innerWidth, altura = innerHeight, agendado = false;

  const gravar = () => {
    agendado = false;
    if (!pendente) ancora = medirAncora(blocos.map(b => b.getBoundingClientRect()), innerHeight);
  };
  // Depois do resize, a página pode passar por mais de um refresh (ao cruzar 820 px o acordeão e os gatilhos
  // do celular se remontam): enquanto a janela estiver aberta, cada refresh volta à âncora e nada é gravado.
  const abrirJanela = () => { pendente = true; clearTimeout(fim); fim = setTimeout(() => { pendente = false; }, 1200); };
  addEventListener('scroll', () => { if (!agendado) { agendado = true; requestAnimationFrame(gravar); } }, { passive: true });
  addEventListener('resize', () => {
    const mudou = innerWidth !== largura || (!toque && innerHeight !== altura);
    largura = innerWidth; altura = innerHeight;
    if (mudou && ancora) abrirJanela();
  });
  ScrollTrigger.addEventListener('refresh', () => {
    if (!pendente) return;
    abrirJanela();
    const r = blocos[ancora.i].getBoundingClientRect();
    const y = Math.max(0, Math.round(destinoAncora(ancora, { topoDoc: r.top + scrollY, height: r.height }, innerHeight)));
    // o Lenis mede a página com atraso (ResizeObserver): sem resize() ele prende o destino no limite antigo
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); }
    else scrollTo(0, y);
    ScrollTrigger.update();
  });
  gravar();
}
