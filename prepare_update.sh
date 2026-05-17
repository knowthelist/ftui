#!/bin/bash
# Generates controls_ftui.txt for the FHEM update mechanism.
# Run automatically via git pre-commit hook:
#   git config core.hooksPath .githooks   (one-time setup)

> controls_ftui.txt

git ls-files -z | while IFS= read -r -d '' f; do
  if [[ $f != *.git* && $f != *.eslintrc* && $f == *www/ftui* ]]; then

    if [[ ! -f "${f}" ]]; then
      echo "MOV ${f} unused" >> controls_ftui.txt
    else
      if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        read -r ts size <<< "$(stat -c '%Y %s' "$f")"
        out="$(date -d "@${ts}" +'%F_%T') ${size} ${f}"
      elif [[ "$OSTYPE" == "darwin"* ]]; then
        out="$(stat -f "%Sm %z" -t "%Y-%m-%d_%T" "$f") ${f}"
      else
        # other OSs need to be added
        out="${f}"
      fi
      if [[ $f == *index.html* ]]; then
        echo "CRE ${out//.\//}" >> controls_ftui.txt
      else
        echo "UPD ${out//.\//}" >> controls_ftui.txt
      fi
    fi
  fi
done

echo "controls_ftui.txt updated ($(wc -l < controls_ftui.txt | tr -d ' ') entries)"
