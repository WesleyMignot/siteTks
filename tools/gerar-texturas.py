"""Gera as texturas de chamas tribais (no espírito das chamas do PDF do press kit).

Saída: assets/texturas/{preto-no-vermelho,vermelho-no-preto,creme-no-preto,vermelho-no-creme}.webp
Uso: python tools/gerar-texturas.py   (requer Pillow)
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


def ruido(w: int, h: int, gx: int, gy: int, blur: float, semente: int) -> Image.Image:
    random.seed(semente)
    return Image.effect_noise((gx, gy), 100).resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))


def chamas(semente: int, largura: int, warp: int = 60) -> Image.Image:
    """Crista de ruído esticado (|v-128| pequeno vira tinta), ondulada por coluna e com borda granulada."""
    base = ruido(W, H, 14, 34, 10, semente)
    crista = ImageChops.difference(base, Image.new("L", (W, H), 128)).point(lambda v: 255 if v < largura else 0)
    deslocamento = ruido(W, 1, max(2, W // 160), 1, 0, semente + 7).resize((W, 1)).load()
    ondulada = Image.new("L", (W, H), 0)
    for x in range(W):
        dy = int((deslocamento[x, 0] - 128) / 128 * warp)
        ondulada.paste(crista.crop((x, 0, x + 1, H)), (x, dy))
    grossa = ondulada.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.5))
    grao = Image.effect_noise((W, H), 60)
    return ImageChops.add(grossa.point(lambda v: v * 0.9), grao.point(lambda v: v * 0.25)).point(lambda v: 255 if v > 140 else 0)


def pintar(mascara: Image.Image, fundo: str, tinta: str) -> Image.Image:
    img = Image.composite(Image.new("RGB", mascara.size, tinta), Image.new("RGB", mascara.size, fundo), mascara)
    return Image.blend(img, Image.effect_noise(mascara.size, 40).convert("RGB"), 0.07)


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    for nome, (fundo, tinta, semente, largura) in TEXTURAS.items():
        pintar(chamas(semente, largura), fundo, tinta).save(SAIDA / f"{nome}.webp", quality=78)
        print("ok textura", nome)
