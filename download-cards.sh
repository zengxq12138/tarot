#!/bin/bash
DIR="public/cards/rws"
BASE="https://upload.wikimedia.org/wikipedia/commons/thumb"

declare -A MAJOR=(
  ["00-fool"]="9/90/RWS_Tarot_00_Fool.jpg/960px-RWS_Tarot_00_Fool.jpg"
  ["01-magician"]="d/de/RWS_Tarot_01_Magician.jpg/960px-RWS_Tarot_01_Magician.jpg"
  ["02-high-priestess"]="8/88/RWS_Tarot_02_High_Priestess.jpg/960px-RWS_Tarot_02_High_Priestess.jpg"
  ["03-empress"]="d/d2/RWS_Tarot_03_Empress.jpg/960px-RWS_Tarot_03_Empress.jpg"
  ["04-emperor"]="c/c3/RWS_Tarot_04_Emperor.jpg/960px-RWS_Tarot_04_Emperor.jpg"
  ["05-hierophant"]="8/8d/RWS_Tarot_05_Hierophant.jpg/960px-RWS_Tarot_05_Hierophant.jpg"
  ["06-lovers"]="3/3a/RWS_Tarot_06_Lovers.jpg/960px-RWS_Tarot_06_Lovers.jpg"
  ["07-chariot"]="9/9b/RWS_Tarot_07_Chariot.jpg/960px-RWS_Tarot_07_Chariot.jpg"
  ["08-strength"]="f/f5/RWS_Tarot_08_Strength.jpg/960px-RWS_Tarot_08_Strength.jpg"
  ["09-hermit"]="4/41/RWS_Tarot_09_Hermit.jpg/960px-RWS_Tarot_09_Hermit.jpg"
  ["10-wheel-of-fortune"]="3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg/960px-RWS_Tarot_10_Wheel_of_Fortune.jpg"
  ["11-justice"]="b/b0/RWS_Tarot_11_Justice.jpg/960px-RWS_Tarot_11_Justice.jpg"
  ["12-hanged-man"]="2/2b/RWS_Tarot_12_Hanged_Man.jpg/960px-RWS_Tarot_12_Hanged_Man.jpg"
  ["13-death"]="d/d7/RWS_Tarot_13_Death.jpg/960px-RWS_Tarot_13_Death.jpg"
  ["14-temperance"]="f/f8/RWS_Tarot_14_Temperance.jpg/960px-RWS_Tarot_14_Temperance.jpg"
  ["15-devil"]="5/55/RWS_Tarot_15_Devil.jpg/960px-RWS_Tarot_15_Devil.jpg"
  ["16-tower"]="5/53/RWS_Tarot_16_Tower.jpg/960px-RWS_Tarot_16_Tower.jpg"
  ["17-star"]="d/db/RWS_Tarot_17_Star.jpg/960px-RWS_Tarot_17_Star.jpg"
  ["18-moon"]="7/77/RWS_Tarot_18_Moon.jpg/960px-RWS_Tarot_18_Moon.jpg"
  ["19-sun"]="1/17/RWS_Tarot_19_Sun.jpg/960px-RWS_Tarot_19_Sun.jpg"
  ["20-judgement"]="d/d0/RWS_Tarot_20_Judgement.jpg/960px-RWS_Tarot_20_Judgement.jpg"
  ["21-world"]="f/ff/RWS_Tarot_21_World.jpg/960px-RWS_Tarot_21_World.jpg"
)

for name in "${!MAJOR[@]}"; do
  path="${MAJOR[$name]}"
  url="$BASE/$path"
  echo "Downloading $name..."
  curl -sL -H "User-Agent: Mozilla/5.0" -o "$DIR/$name.jpg" "$url" --max-time 15
  if [ -f "$DIR/$name.jpg" ] && [ $(stat -c%s "$DIR/$name.jpg" 2>/dev/null || echo 0) -gt 1000 ]; then
    echo "  OK"
  else
    echo "  FAIL, trying alternative..."
    rm -f "$DIR/$name.jpg"
  fi
  sleep 1  # rate limit
done
echo "Major Arcana done!"
