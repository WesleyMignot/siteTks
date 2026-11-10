"""Gera os assets de imagem do site a partir do material bruto.

- assets/img/foto-NN-cor.webp e foto-NN-tks.webp (versão tratada: duotone + grão)
- assets/recortes/*.webp (recortes das páginas do PDF do press kit)
- assets/og.jpg (imagem de compartilhamento 1200x630)
- assets/presskit.pdf (cópia do PDF para download)

Uso: python tools/tratar-fotos.py   (requer: pip install -r tools/requirements.txt)
"""
from pathlib import Path
import shutil

import pymupdf
from PIL import Image, ImageEnhance, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / "BRUNIN TKS PRESS KIT 2026.pdf"
FOTOS = RAIZ / "assets" / "fotos"
SAIDA_IMG = RAIZ / "assets" / "img"
SAIDA_REC = RAIZ / "assets" / "recortes"

PRETO, CREME, VERMELHO = "#0F1211", "#F1E2C4", "#E3302F"
FOTOS_VERMELHAS = {"22", "32", "43"}

# nome: (página, (esquerda, topo, direita, base)) na imagem 1080x1350 da página
RECORTES = {
    "p1-capa": (1, (0, 0, 1080, 1350)),
    "p2-moldura": (2, (150, 60, 540, 760)),
    "p2-maos": (2, (590, 860, 1080, 1350)),
    "p3-costas": (3, (560, 180, 1080, 1350)),
    "p5-figura": (5, (350, 320, 750, 1300)),
    "p6-cadeira": (6, (60, 760, 1020, 1290)),
    "p7-dreads": (7, (180, 190, 1000, 770)),
    "tex-chamas": (3, (640, 0, 1080, 230)),
}


def com_grao(img: Image.Image, intensidade: float = 0.10) -> Image.Image:
    ruido = Image.effect_noise(img.size, 48).convert("RGB")
    return Image.blend(img, ruido, intensidade)


def tratar(img: Image.Image, vermelha: bool) -> Image.Image:
    g = ImageOps.autocontrast(ImageOps.grayscale(img), cutoff=2)
    g = ImageEnhance.Contrast(g).enhance(1.6)  # P&B estourado, como no PDF
    if vermelha:
        cor = ImageOps.colorize(g, black=PRETO, mid=VERMELHO, white=CREME)
    else:
        cor = ImageOps.colorize(g, black=PRETO, white=CREME)
    return com_grao(cor)


def fotos() -> None:
    SAIDA_IMG.mkdir(parents=True, exist_ok=True)
    for arq in sorted(FOTOS.glob("*.jpg")):
        nn = arq.stem.rsplit("-", 1)[-1]
        img = Image.open(arq).convert("RGB")
        img = img.resize((round(img.width * 1200 / img.height), 1200), Image.LANCZOS)
        img.save(SAIDA_IMG / f"foto-{nn}-cor.webp", quality=80)
        tratar(img, nn in FOTOS_VERMELHAS).save(SAIDA_IMG / f"foto-{nn}-tks.webp", quality=80)
        print("ok foto", nn)


def recortes() -> None:
    SAIDA_REC.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)
    paginas: dict[int, Image.Image] = {}
    for nome, (pag, caixa) in RECORTES.items():
        if pag not in paginas:
            xref = doc[pag - 1].get_images(full=True)[0][0]
            dados = doc.extract_image(xref)["image"]
            tmp = SAIDA_REC / f".p{pag}.jpg"
            tmp.write_bytes(dados)
            paginas[pag] = Image.open(tmp).convert("RGB")
            tmp.unlink()
        recorte = paginas[pag].crop(caixa)
        recorte.thumbnail((720, 1080), Image.LANCZOS)  # a galeria exibe no máx. ~340px de largura
        recorte.save(SAIDA_REC / f"{nome}.webp", quality=82)
        print("ok recorte", nome)


def og() -> None:
    W, H = 1200, 630
    fundo = Image.new("RGB", (W, H), PRETO)
    quadro = Image.open(RAIZ / "assets" / "video" / "hero.jpg").convert("RGB")
    escala = max(W / quadro.width, H / quadro.height)
    quadro = quadro.resize((round(quadro.width * escala), round(quadro.height * escala)), Image.LANCZOS)
    x, y = (quadro.width - W) // 2, (quadro.height - H) // 2
    quadro = quadro.crop((x, y, x + W, y + H))
    fundo = Image.blend(fundo, quadro, 0.55)
    logo = Image.open(RAIZ / "assets" / "logo" / "logo-sticker-osso.png").convert("RGBA")
    logo = logo.resize((760, round(logo.height * 760 / logo.width)), Image.LANCZOS)
    logo = logo.rotate(3, expand=True, resample=Image.BICUBIC)
    fundo = fundo.convert("RGBA")
    fundo.alpha_composite(logo, ((W - logo.width) // 2, (H - logo.height) // 2))
    com_grao(fundo.convert("RGB"), 0.06).save(RAIZ / "assets" / "og.jpg", quality=85)
    print("ok og.jpg")


def pdf() -> None:
    shutil.copyfile(PDF, RAIZ / "assets" / "presskit.pdf")
    print("ok presskit.pdf")


if __name__ == "__main__":
    fotos()
    recortes()
    og()
    pdf()
