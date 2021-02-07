#!/bin/bash   

rm controls_ftui.txt

git ls-files -z | while IFS= read -r -d '' f; 
  do
    if [[ $f != *.git* && $f != *.eslintrc* && $f == *www/ftui* ]]; then

      if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        out="$(date -d "@$( stat -c '%Y' $f )" +'%F_%T') $(stat -c%s $f) ${f}"
        #out="$(git log -1 --pretty="format:%ci" -- examples/badge.html | cut -f1-2 -d' ') $(stat -c%s $f) ${f}"
      elif [[ "$OSTYPE" == "darwin"* ]]; then
        out="$(stat -f "%Sm" -t "%Y-%m-%d_%T" $f) "$(stat -f%z $f)" ${f}"
        #out="$(git log -1 --pretty="format:%ci" -- examples/badge.html | cut -f1-2 -d' ') $(stat -f%z $f) ${f}"
      else
        # other OSs needs to be added 
        out="${f}"
      fi
      if [[ $f == *index.html* ]]; then
        echo CRE ${out//.\//} >> controls_ftui.txt
      else
        echo UPD ${out//.\//} >> controls_ftui.txt
      fi
    fi 
  done
