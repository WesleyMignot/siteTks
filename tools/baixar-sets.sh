#!/usr/bin/env bash
# Trechos dos vídeos originais dos sets (YouTube) para o fundo da pilha de sets.
# Uso:
#   bash tools/baixar-sets.sh baixar   # baixa os vídeos (sem áudio, até 720p) e o trecho em 1080p em bruto/sets/, e gera folhas de quadros
#   bash tools/baixar-sets.sh cortar   # codifica os trechos (tabela TRECHOS) em assets/video/sets/: <nome> e <nome>-cel
#   bash tools/baixar-sets.sh celular  # só as versões do celular (<nome>-cel)
# Requer: yt-dlp (pip install yt-dlp) e ffmpeg. Autorização dos canais confirmada pelo Wesley (rodada 2).
set -euo pipefail
cd "$(dirname "$0")/.."
BRUTO="bruto/sets"
OUT="assets/video/sets"
mkdir -p "$BRUTO" "$OUT"
# PY: o executável do Python (no Windows, use o python.exe real; atalhos .bat estragam os argumentos com < e %)
PY="${PY:-python}"
YTDLP="${YTDLP:-$PY -m yt_dlp --js-runtimes node}"

# nome  id-do-youtube  início(s)  duração(s)  foco  topo   — trechos escolhidos olhando bruto/sets/<id>-folha.jpg
# foco/topo: versão do celular em pé (<nome>-cel, 9:16). foco = centro horizontal do recorte, em fração da largura do
# quadro original (onde o Bruno está); topo = fração da altura cortada em cima (marcas de canal no topo).
#   senso: o topo 0.09 tira o texto "BRUNIN" do canto superior esquerdo (vai até 8,5% da altura)
#   ataque: o Bruno fica bem à direita, embaixo do letreiro "Boiler Baile · Ataque Sonoro" (que o topo 0.14 tira)
TRECHOS="
senso 5ackC9W3BIs 1110 4 0.25 0.09
grau 2Z2gP9W9Epo 600 4 0.47 0
ataque PuYyCp85V9U 1515 4 0.86 0.14
veneno-lab SLUUZG8-oYA 1440 4 0.50 0
sensi IP9V-06-QJw 1355 4 0.84 0
"
# Recorte central de 76%: tira as marcas dos canais nos cantos (logos, "BRUNIN TKS", bandeira).
RECORTE="crop=iw*0.76:ih*0.76"
# Recorte vertical 9:16 do celular (540×960): do topo até o pé, centrado no foco, preso dentro do quadro.
recorte_cel() { echo "crop=w='trunc(ih*(1-$2)*9/16/2)*2':h='trunc(ih*(1-$2)/2)*2':x='max(0,min(iw-ow,$1*iw-ow/2))':y='trunc(ih*$2)',scale=540:960"; }

baixar() {
  while read -r nome id ini dur foco topo; do
    [ -z "$nome" ] && continue
    if [ ! -f "$BRUTO/$id.mp4" ]; then
      $YTDLP -q -f "bv[ext=mp4]" -S "res:720" -o "$BRUTO/%(id)s.%(ext)s" "https://www.youtube.com/watch?v=$id" < /dev/null
    fi
    # só o trecho, em 1080p, para a versão do celular (o recorte vertical usa ~30% da largura: 720p ficaria borrado)
    if [ ! -f "$BRUTO/$nome-1080.mp4" ]; then
      $YTDLP -q -f "bv[ext=mp4]" -S "res:1080" --download-sections "*$ini-$(awk "BEGIN{print $ini+$dur+1}")"         --force-keyframes-at-cuts -o "$BRUTO/$nome-1080.%(ext)s" "https://www.youtube.com/watch?v=$id" < /dev/null
    fi
    ffmpeg -nostdin -v error -y -i "$BRUTO/$id.mp4" -vf "fps=1/30,scale=240:-1,tile=8x8" -frames:v 1 "$BRUTO/$id-folha.jpg"
    echo "ok $nome ($id)"
  done <<< "$TRECHOS"
}

cortar() {
  while read -r nome id ini dur foco topo; do
    [ -z "$nome" ] && continue
    ffmpeg -nostdin -v error -y -ss "$ini" -t "$dur" -i "$BRUTO/$id.mp4" -an -vf "$RECORTE,scale=960:-2,fps=24" \
      -c:v libx264 -crf "${CRF:-30}" -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$nome.mp4"
    ffmpeg -nostdin -v error -y -ss "$(awk "BEGIN{print $ini+0.6}")" -i "$BRUTO/$id.mp4" -frames:v 1 -vf "$RECORTE,scale=960:-2" -q:v 4 "$OUT/$nome.jpg"
    echo "ok $nome $(wc -c < "$OUT/$nome.mp4") bytes"
  done <<< "$TRECHOS"
}

# versão do celular: a partir do trecho em 1080p (que já começa no início do trecho)
celular() {
  while read -r nome id ini dur foco topo; do
    [ -z "$nome" ] && continue
    local vf; vf="$(recorte_cel "$foco" "$topo")"
    ffmpeg -nostdin -v error -y -ss 0 -t "$dur" -i "$BRUTO/$nome-1080.mp4" -an -vf "$vf,fps=24"       -c:v libx264 -crf "${CRF_CEL:-30}" -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$nome-cel.mp4"
    ffmpeg -nostdin -v error -y -ss 0.6 -i "$BRUTO/$nome-1080.mp4" -frames:v 1 -vf "$vf" -q:v 4 "$OUT/$nome-cel.jpg"
    echo "ok $nome-cel $(wc -c < "$OUT/$nome-cel.mp4") bytes"
  done <<< "$TRECHOS"
}

case "${1:-}" in
  baixar) baixar ;;
  cortar) cortar; celular ;;
  celular) celular ;;
  *) echo "uso: bash tools/baixar-sets.sh baixar|cortar|celular"; exit 1 ;;
esac
