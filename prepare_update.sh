#!/bin/bash   

rm update_ftui.txt

git ls-files -z | while IFS= read -r -d '' f; 
  do
    if [[ $f != *.git* && $f != *.eslintrc* && $f == *www/ftui* ]]; then
      out="$(stat -f "%Sm" -t "%Y-%m-%d_%T" $f) "$(stat -f%z $f)" ${f}"
      if [[ $f == *index.html* ]]; then
        echo CRE ${out//.\//} >> update_ftui.txt
      else
        echo UPD ${out//.\//} >> update_ftui.txt
      fi
    fi 
  done
