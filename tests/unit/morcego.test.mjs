import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUADROS, QUADROS_D, VIEWBOX, pose } from '../../js/morcego.js';

const nums = d => d.match(/-?\d+(\.\d+)?/g).map(Number);

test('32 quadros fechados', () => {
  assert.equal(QUADROS, 32);
  assert.equal(QUADROS_D.length, 32);
  assert.ok(QUADROS_D.every(d => d.startsWith('M') && d.trim().endsWith('Z')));
});

test('todos os quadros cabem no viewBox', () => {
  const [x, y, w, h] = VIEWBOX.split(' ').map(Number);
  for (const d of QUADROS_D) {
    const n = nums(d);
    for (let i = 0; i < n.length; i += 2) assert.ok(n[i] >= x && n[i] <= x + w && n[i + 1] >= y && n[i + 1] <= y + h);
  }
});

test('batida fluida: nenhum ponto pula mais de 10 unidades entre quadros vizinhos', () => {
  // a ponta anda ~8 unidades por quadro na batida normal; um salto de pose passaria bem de 10
  const ps = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI));
  for (let i = 0; i < 32; i++) {
    const a = ps[i], b = ps[(i + 1) % 32];
    assert.ok(a.every((p, k) => Math.hypot(p.x - b[k].x, p.y - b[k].y) < 10));
  }
});

test('a ponta da asa esquerda sobe e desce mais de 20 unidades', () => {
  const r = pose(0), iPonta = r.reduce((m, p, k) => (p.x < r[m].x ? k : m), 0); // mesmo índice em todos os quadros
  const ys = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI)[iPonta].y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 20);
});

test('o corpo só sobe e desce', () => {
  const corpo = f => pose(f).filter(p => Math.abs(p.x) < 2); // pontos perto do eixo do corpo
  const a = corpo(0), b = corpo(Math.PI);
  assert.ok(a.length > 0 && a.length === b.length && a.every((p, k) => Math.abs(p.x - b[k].x) < 0.01));
});

test('desenharMorcego: contorno só quando pedido, com espessura em px de tela', async () => {
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } }; // o cache de Path2D é criado no 1º desenho
  const { desenharMorcego } = await import('../../js/morcego.js');
  const falso = () => {
    const g = { fills: 0, strokes: 0, lineWidth: 1 };
    for (const k of ['save', 'restore', 'translate', 'rotate', 'scale']) g[k] = () => {};
    g.fill = () => { g.fills++; };
    g.stroke = () => { g.strokes++; g.larguraNoStroke = g.lineWidth; };
    return g;
  };
  const sem = falso();
  desenharMorcego(sem, 10, 10, 2, 0);
  assert.deepEqual([sem.fills, sem.strokes], [1, 0]);
  const com = falso();
  desenharMorcego(com, 10, 10, 2, 0, 0, 1, 1);
  assert.deepEqual([com.fills, com.strokes, com.larguraNoStroke], [1, 1, 0.5]);
});

// carimbos: os quadros já desenhados (preenchimento + contorno) em bitmaps reaproveitados — no canvas
// pintado na CPU o contorno desenhado na hora custava ~4× o quadro; o carimbo sai mais barato que o preenchimento
const telaFalsa = registro => (w, h) => {
  const ctx = { chamadas: [], lineWidth: 1 };
  for (const k of ['save', 'restore', 'translate', 'rotate', 'fill', 'drawImage']) ctx[k] = (...a) => ctx.chamadas.push([k, ...a]);
  ctx.scale = (...a) => ctx.chamadas.push(['scale', ...a]);
  ctx.stroke = () => ctx.chamadas.push(['stroke', ctx.lineWidth]);
  const tela = { width: w, height: h, getContext: () => ctx, ctx };
  registro.push(tela);
  return tela;
};
const destinoFalso = () => telaFalsa([])(1, 1).ctx;

test('carimbos: um bitmap por quadro e tamanho, criado uma vez', async () => {
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } };
  const { criarCarimbos } = await import('../../js/morcego.js');
  const telas = [], c = criarCarimbos({ cor: '#E8392F', contorno: '#0F1211', criarTela: telaFalsa(telas) });
  const g = destinoFalso();
  c.desenhar(g, 0, 0, 1, 0.01); c.desenhar(g, 5, 5, 1, 0.02); // mesmo quadro, mesmo balde
  assert.equal(telas.length, 1);
  c.desenhar(g, 0, 0, 1, Math.PI); // outro quadro
  assert.equal(telas.length, 2);
});

test('carimbos: contorno de 1 px no tamanho do balde e escala tam/balde no desenho', async () => {
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } };
  const { criarCarimbos } = await import('../../js/morcego.js');
  const telas = [], c = criarCarimbos({ cor: '#E8392F', contorno: '#0F1211', criarTela: telaFalsa(telas) });
  const g = destinoFalso();
  c.desenhar(g, 10, 20, 1, 0); // balde 1,2 (o menor ≥ 1)
  assert.deepEqual(telas[0].ctx.chamadas.find(x => x[0] === 'stroke'), ['stroke', 1 / 1.2]);
  assert.deepEqual(g.chamadas.find(x => x[0] === 'scale'), ['scale', 1 / 1.2, 1 / 1.2]);
  assert.equal(g.chamadas.filter(x => x[0] === 'drawImage').length, 1);
});

test('carimbos: aquecer cria todos os quadros dos baldes da faixa de tamanhos', async () => {
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } };
  const { criarCarimbos } = await import('../../js/morcego.js');
  const telas = [], c = criarCarimbos({ cor: '#E8392F', contorno: '#0F1211', criarTela: telaFalsa(telas) });
  c.aquecer(1.12, 2.56); // baldes 1,2 · 1,7 · 2,4 · 3,4
  assert.equal(telas.length, 4 * 32);
});
