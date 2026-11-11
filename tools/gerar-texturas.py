"""Gera as texturas de chamas tribais (no espírito das chamas do PDF do press kit).

Saída: assets/texturas/{preto-no-vermelho,vermelho-no-preto,creme-no-preto,vermelho-no-creme}.webp
Uso: python tools/gerar-texturas.py   (requer Pillow)

As texturas são periódicas na horizontal (a borda direita emenda com a esquerda), porque o site as
repete com repeat-x. Para isso, o ruído e os filtros rodam numa faixa 3× mais larga, feita de três
cópias da mesma grade, e a imagem final é o terço do meio. A semente de cada textura alimenta um
random.Random próprio (Image.effect_noise não usa o random do Python).
"""
from pathlib import Path
import random

from PIL import Image, ImageChops, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "texturas"
PRETO, CREME, VERMELHO = "#0F1211", "#F1E2C4", "#E8392F"
W, H = 1400, 900

# nome: (fundo, tinta, semente, largura da crista)
TEXTURAS = {
    "preto-no-vermelho": (VERMELHO, PRETO, 11, 30),
    "vermelho-no-preto": (PRETO, VERMELHO, 13, 28),
    "creme-no-preto": (PRETO, CREME, 12, 24),
    "vermelho-no-creme": (CREME, VERMELHO, 14, 28),
}


def gauss(rng: random.Random, n: int, sigma: float) -> bytes:
    return bytes(max(0, min(255, int(rng.gauss(128, sigma)))) for _ in range(n))


def ruido_periodico(w: int, h: int, gx: int, gy: int, blur: float, rng: random.Random) -> Image.Image:
    """Ruído suave com período w na horizontal, numa imagem 3w × h (w precisa ser múltiplo de gx)."""
    assert w % gx == 0
    grade = Image.frombytes("L", (gx, gy), gauss(rng, gx * gy, 100))
    tripla = Image.new("L", (3 * gx, gy))
    for k in range(3):
        tripla.paste(grade, (k * gx, 0))
    img = tripla.resize((3 * w, h), Image.BICUBIC)
    return img.filter(ImageFilter.GaussianBlur(blur)) if blur else img


def chamas(semente: int, largura: int, warp: int = 60) -> Image.Image:
    """Crista de ruído esticado (|v-128| pequeno vira tinta), ondulada por coluna e com borda granulada."""
    rng = random.Random(semente)
    base = ruido_periodico(W, H, 14, 34, 10, rng)
    crista = ImageChops.difference(base, Image.new("L", base.size, 128)).point(lambda v: 255 if v < largura else 0)
    deslocamento = ruido_periodico(W, 1, 8, 1, 0, rng).load()
    ondulada = Image.new("L", base.size, 0)
    for x in range(3 * W):
        dy = int((deslocamento[x, 0] - 128) / 128 * warp)
        ondulada.paste(crista.crop((x, 0, x + 1, H)), (x, dy))
    grossa = ondulada.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.5)).crop((W, 0, 2 * W, H))
    grao = Image.frombytes("L", (W, H), gauss(rng, W * H, 60))
    return ImageChops.add(grossa.point(lambda v: v * 0.9), grao.point(lambda v: v * 0.25)).point(lambda v: 255 if v > 140 else 0)


def pintar(mascara: Image.Image, fundo: str, tinta: str, rng: random.Random) -> Image.Image:
    img = Image.composite(Image.new("RGB", mascara.size, tinta), Image.new("RGB", mascara.size, fundo), mascara)
    grao = Image.frombytes("L", mascara.size, gauss(rng, mascara.size[0] * mascara.size[1], 40)).convert("RGB")
    return Image.blend(img, grao, 0.07)


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    for nome, (fundo, tinta, semente, largura) in TEXTURAS.items():
        pintar(chamas(semente, largura), fundo, tinta, random.Random(semente + 1000)).save(SAIDA / f"{nome}.webp", quality=78)
        print("ok textura", nome)
