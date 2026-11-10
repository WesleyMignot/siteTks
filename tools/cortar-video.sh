#!/usr/bin/env bash
# Corta e comprime os trechos do reel usados no site.
# Uso: bash tools/cortar-video.sh            (gera todos)
#      bash tools/cortar-video.sh pista cabine  (só os nomes pedidos)
# Precisa de ffmpeg e do arquivo bruto "2 REELS.mp4" na raiz do repo.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="2 REELS.mp4"
OUT="assets/video"
mkdir -p "$OUT"

# nome inicio duracao largura crf
CLIPES="
hero-720 0 38.2 720 30
hero-540 0 38.2 540 31
janela-720 5.8 4 720 30
boiler 5.8 3 360 30
filme 9.0 2.2 360 30
grade 11.0 2.5 360 30
pista 15.0 2.5 360 30
chamas 23.4 2.6 360 30
cabine 27.4 2.5 360 30
maos 31.6 2.5 360 30
dj-luz 35.0 2.6 360 30
"

enc() {
  local nome=$1 ini=$2 dur=$3 larg=$4 crf=$5
  ffmpeg -v error -y -ss "$ini" -t "$dur" -i "$IN" -an \
    -vf "scale=${larg}:-2,fps=24" -c:v libx264 -crf "$crf" -preset slow \
    -pix_fmt yuv420p -movflags +faststart "$OUT/$nome.mp4"
  case "$nome" in
    hero-*) ;;  # o pôster do hero é único: hero.jpg (abaixo)
    *) ffmpeg -v error -y -ss "$(awk "BEGIN{print $ini+0.6}")" -i "$IN" -frames:v 1 \
         -vf "scale=${larg}:-2" -q:v 4 "$OUT/$nome.jpg" ;;
  esac
  echo "ok $nome"
}

while read -r nome ini dur larg crf; do
  [ -z "$nome" ] && continue
  if [ $# -eq 0 ] || [[ " $* " == *" $nome "* ]]; then enc "$nome" "$ini" "$dur" "$larg" "$crf"; fi
done <<< "$CLIPES"

if [ $# -eq 0 ] || [[ " $* " == *" hero "* ]]; then
  ffmpeg -v error -y -ss 6.6 -i "$IN" -frames:v 1 -vf "scale=540:-2" -q:v 4 "$OUT/hero.jpg"
  echo "ok hero.jpg"
fi
