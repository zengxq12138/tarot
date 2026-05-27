#!/bin/bash
DIR="public/cards/rws"

# Use Wikimedia API to resolve filenames to URLs
get_url() {
  local filename="$1"
  local encoded=$(echo "$filename" | sed 's/ /%20/g')
  curl -sL -H "User-Agent: TarotDownloader/1.0" \
    "https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encoded}&prop=imageinfo&iiprop=url&format=json" \
    2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//'
}

suits=("Wands" "Cups" "Swords" "Pentacles")
ranks=("Ace" "02" "03" "04" "05" "06" "07" "08" "09" "10" "Page" "Knight" "Queen" "King")

id=22
for suit in "${suits[@]}"; do
  for rank in "${ranks[@]}"; do
    filename="RWS_Tarot_${rank}_${suit}.jpg"
    case $suit in
      Wands) suit_name="wands" ;;
      Cups) suit_name="cups" ;;
      Swords) suit_name="swords" ;;
      Pentacles) suit_name="pentacles" ;;
    esac
    case $rank in
      Ace) rank_name="ace" ;;
      Page) rank_name="page" ;;
      Knight) rank_name="knight" ;;
      Queen) rank_name="queen" ;;
      King) rank_name="king" ;;
      *) rank_name="$rank" ;;
    esac
    out_name=$(printf "%02d-%s-%s" $id "$rank_name" "$suit_name")
    
    echo "Downloading $out_name ($filename)..."
    url=$(get_url "$filename")
    
    if [ -n "$url" ]; then
      curl -sL -H "User-Agent: Mozilla/5.0" -o "$DIR/${out_name}.jpg" "$url" --max-time 15
      if [ -f "$DIR/${out_name}.jpg" ] && [ $(stat -c%s "$DIR/${out_name}.jpg" 2>/dev/null || echo 0) -gt 1000 ]; then
        echo "  OK"
      else
        echo "  FAIL (bad file)"
        rm -f "$DIR/${out_name}.jpg"
      fi
    else
      echo "  FAIL (no URL)"
    fi
    
    id=$((id + 1))
    sleep 1.5  # rate limit
  done
done
echo "Done!"
