"""Traça o contorno externo do morcego de referência e imprime JSON {n, pts} (grade de 480 px).

Uso: python tools/tracar-morcego.py docs/identidade/morcego_ref.jpg [epsilon]  (requer Pillow)
Os pontos alimentam a silhueta de js/morcego.js (origem no corpo em 290,300; escala 56/475).
"""
import sys, json
from PIL import Image

src, N = sys.argv[1], 480
img = Image.open(src).convert('L').resize((N, N), Image.LANCZOS)
px = img.load()
den = lambda x, y: 0 <= x < N and 0 <= y < N and px[x, y] < 128

# ponto inicial: primeiro pixel escuro varrendo linhas
start = next((x, y) for y in range(N) for x in range(N) if den(x, y))
# Moore neighbor tracing (sentido horário)
viz = [(-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1)]
contorno = [start]
atual, entrada = start, 0  # entrou vindo do oeste
while True:
    for k in range(8):
        d = (entrada + k) % 8
        nx, ny = atual[0] + viz[d][0], atual[1] + viz[d][1]
        if den(nx, ny):
            atual = (nx, ny)
            entrada = (d + 5) % 8  # volta dois passos no sentido anti-horário
            break
    if atual == start and len(contorno) > 2:
        break
    contorno.append(atual)
    if len(contorno) > 20000:
        raise SystemExit('contorno não fechou')

def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norma = (dx * dx + dy * dy) ** 0.5 or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / norma
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]

eps = float(sys.argv[2]) if len(sys.argv) > 2 else 0.9
# fecha o laço dividindo no ponto mais distante do início
far = max(range(len(contorno)), key=lambda i: (contorno[i][0] - start[0]) ** 2 + (contorno[i][1] - start[1]) ** 2)
pts = rdp(contorno[:far + 1], eps)[:-1] + rdp(contorno[far:] + [contorno[0]], eps)[:-1]

xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
print(json.dumps({'n': len(pts), 'bruto': len(contorno), 'xmin': min(xs), 'xmax': max(xs), 'ymin': min(ys), 'ymax': max(ys), 'pts': pts}))
