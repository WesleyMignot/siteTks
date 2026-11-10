// Silhueta única do morcego (vista de frente, angulosa). Fonte única para SVG (divisores, revoadas)
// e canvas (assinatura). O corpo é fixo; as asas batem escalando no eixo Y.

const ASA = 'M3.4 -5 Q14 -13 27 -9 Q24.5 -4 21 2.5 Q18 -1 15 5.5 Q12 2.5 9 8 Q6 4.5 3.4 5.5 Z';
const espelhar = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-parseFloat(x)} ${y}`);

/** Asas direita e esquerda (path SVG). */
export const ASAS_D = `${ASA} ${espelhar(ASA)}`;
/** Corpo com orelhas pontudas (path SVG). */
export const CORPO_D = 'M-4 -6 L-3.2 -12 L-1.2 -7.4 L1.2 -7.4 L3.2 -12 L4 -6 L3.6 5 L0 11 L-3.6 5 Z';
export const VIEWBOX = '-28 -14 56 26';

const SVG = 'http://www.w3.org/2000/svg';

/** <svg> do morcego, decorativo, com asas e corpo em paths separados (as asas batem via CSS). */
export function criarMorcegoSvg(classe = 'morcego') {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', VIEWBOX);
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [d, nome] of [[ASAS_D, 'morcego__asas'], [CORPO_D, 'morcego__corpo']]) {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', nome);
    svg.append(p);
  }
  return svg;
}
