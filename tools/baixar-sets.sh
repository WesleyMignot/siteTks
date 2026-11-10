#!/usr/bin/env bash
# Trechos dos vídeos originais dos sets (YouTube) para o fundo da pilha de sets.
# Uso:
#   bash tools/baixar-sets.sh baixar   # baixa os vídeos (sem áudio, até 720p) em bruto/sets/ e gera folhas de quadros
#   bash tools/baixar-sets.sh cortar   # codifica os trechos escolhidos (tabela TRECHOS) em assets/video/sets/
# Requer: yt-dlp (pip install yt-dlp) e ffmpeg. Autorização dos canais confirmada pelo Wesley (rodada 2).
set -euo pipefail
cd "$(dirname "$0")/.."
BRUTO="bruto/sets"
OUT="assets/video/sets"
mkdir -p "$BRUTO" "$OUT"
# PY: o executável do Python (no Windows, use o python.exe real; atalhos .bat estragam os argumentos com < e %)
PY="${PY:-python}"
YTDLP="${YTDLP:-$PY -m yt_dlp --js-runtimes node}"

# nome  id-do-youtube  início(s)  duração(s)   — trechos escolhidos olhando bruto/sets/<id>-folha.jpg
TRECHOS="
senso 5ackC9W3BIs 1110 4
grau 2Z2gP9W9Epo 600 4
ataque PuYyCp85V9U 1515 4
veneno-lab SLUUZG8-oYA 1440 4
sensi IP9V-06-QJw 1230 4
"
# Recorte central de 76%: tira as marcas dos canais nos cantos (logos, "BRUNIN TKS", bandeira).
RECORTE="crop=iw*0.76:ih*0.76"
# quadro da Boiler Baile usado no fundo das Produções (id, instante em s)
BOILER_QUADRO="PuYyCp85V9U 1518.9"

baixar() {
  while read -r nome id ini dur; do
    [ -z "$nome" ] && continue
    if [ ! -f "$BRUTO/$id.mp4" ]; then
      $YTDLP -q -f "bv[ext=mp4]" -S "res:720" -o "$BRUTO/%(id)s.%(ext)s" "https://www.youtube.com/watch?v=$id" < /dev/null
    fi
    ffmpeg -nostdin -v error -y -i "$BRUTO/$id.mp4" -vf "fps=1/30,scale=240:-1,tile=8x8" -frames:v 1 "$BRUTO/$id-folha.jpg"
    echo "ok $nome ($id)"
  done <<< "$TRECHOS"
}

cortar() {
  while read -r nome id ini dur; do
    [ -z "$nome" ] && continue
    ffmpeg -nostdin -v error -y -ss "$ini" -t "$dur" -i "$BRUTO/$id.mp4" -an -vf "$RECORTE,scale=960:-2,fps=24" \
      -c:v libx264 -crf "${CRF:-30}" -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$nome.mp4"
    ffmpeg -nostdin -v error -y -ss "$(awk "BEGIN{print $ini+0.6}")" -i "$BRUTO/$id.mp4" -frames:v 1 -vf "$RECORTE,scale=960:-2" -q:v 4 "$OUT/$nome.jpg"
    echo "ok $nome $(wc -c < "$OUT/$nome.mp4") bytes"
  done <<< "$TRECHOS"
  read -r id t <<< "$BOILER_QUADRO"
  ffmpeg -nostdin -v error -y -ss "$t" -i "$BRUTO/$id.mp4" -frames:v 1 -vf "$RECORTE,scale=1280:-2" "bruto/boiler-quadro.png"
  $PY -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=78)" \
    "bruto/boiler-quadro.png" "assets/img/boiler-quadro.webp"
  echo "ok boiler-quadro"
}

case "${1:-}" in
  baixar) baixar ;;
  cortar) cortar ;;
  *) echo "uso: bash tools/baixar-sets.sh baixar|cortar"; exit 1 ;;
esac
