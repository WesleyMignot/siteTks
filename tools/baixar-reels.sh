#!/usr/bin/env bash
# Reels do Instagram (@djbrunintks) para a janela do hero e o fundo dos sets 6–8.
# Uso:
#   bash tools/baixar-reels.sh baixar   # baixa os 4 reels (sem áudio) em bruto/reels/ e gera folhas de quadros
#   bash tools/baixar-reels.sh cortar   # corta os trechos da tabela TRECHOS em assets/video/
# Requer: yt-dlp (pip install yt-dlp) e ffmpeg. Nenhum reel se repete no site.
set -euo pipefail
cd "$(dirname "$0")/.."
BRUTO="bruto/reels"
OUT="assets/video"
mkdir -p "$BRUTO" "$OUT/sets"
# PY: o executável do Python (no Windows, use o python.exe real; atalhos .bat estragam os argumentos com < e %)
PY="${PY:-python}"
YTDLP="${YTDLP:-$PY -m yt_dlp --js-runtimes node}"
IDS="DW9lHDGkSo6 DRuX77XEWlI DG_97MaOjeD DO1bP5kEUF_"

# nome  id  início(s)  duração(s)  largura  crf  [giro]   — trechos escolhidos olhando bruto/reels/<id>-folha.jpg
# giro: valor do transpose do ffmpeg (2 = 90° anti-horário) para reel gravado deitado
#  janela      DW9lHDGkSo6 0–10 s: o DJ iluminado num palco escuro (P&B); aparece inteiro dentro do card do hero
#  set 6 (Modelo Brasileño) DO1bP5kEUF_: DJ nos CDJs, fumaça e público atrás
#  set 7 (Rewind BR)        DRuX77XEWlI: público de mãos para cima e lasers vermelhos
#  set 8 (Trinka)           DG_97MaOjeD: gravado deitado; endireitado vira horizontal (DJ de braços erguidos)
TRECHOS="
janela-720 DW9lHDGkSo6 0 10 720 30
janela-540 DW9lHDGkSo6 0 10 540 31
sets/reel-a DO1bP5kEUF_ 1.5 4 720 30
sets/reel-b DRuX77XEWlI 16 4 720 32
sets/reel-c DG_97MaOjeD 1.5 4 960 30 2
"

baixar() {
  for id in $IDS; do
    if [ ! -f "$BRUTO/$id.mp4" ]; then
      $YTDLP -q -f "bv*[ext=mp4]/b[ext=mp4]" -o "$BRUTO/%(id)s.%(ext)s" "https://www.instagram.com/reel/$id/" < /dev/null
    fi
    # um quadro a cada 2 s (os reels são curtos), 6 por linha: o quadro k (a partir de 0) é o instante 2k s
    # (sem drawtext: o ffmpeg deste Windows não tem fontconfig e cai com segfault)
    ffmpeg -nostdin -v error -y -i "$BRUTO/$id.mp4" \
      -vf "fps=1/2,scale=200:-1,tile=6x5" \
      -frames:v 1 "$BRUTO/$id-folha.jpg"
    echo "ok $id $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$BRUTO/$id.mp4")s"
  done
}

cortar() {
  while read -r nome id ini dur larg crf giro; do
    [ -z "$nome" ] && continue
    local gira=""
    [ -n "${giro:-}" ] && gira="transpose=${giro},"
    ffmpeg -nostdin -v error -y -ss "$ini" -t "$dur" -i "$BRUTO/$id.mp4" -an -vf "${gira}scale=${larg}:-2,fps=24" \
      -c:v libx264 -crf "$crf" -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$nome.mp4"
    case "$nome" in
      janela-540) ;; # o pôster da janela é um só (janela-720.jpg)
      *) ffmpeg -nostdin -v error -y -ss "$(awk "BEGIN{print $ini+0.6}")" -i "$BRUTO/$id.mp4" -frames:v 1 \
           -vf "${gira}scale=${larg}:-2" -q:v 4 "$OUT/$nome.jpg" ;;
    esac
    echo "ok $nome $(wc -c < "$OUT/$nome.mp4") bytes"
  done <<< "$TRECHOS"
}

case "${1:-}" in
  baixar) baixar ;;
  cortar) cortar ;;
  *) echo "uso: bash tools/baixar-reels.sh baixar|cortar"; exit 1 ;;
esac
