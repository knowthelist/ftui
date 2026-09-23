#!/bin/bash
# Generates controls_ftui.txt for the FHEM update mechanism from the Git index.
# Run automatically via git pre-commit hook:
#   git config core.hooksPath .githooks   (one-time setup)

set -eo pipefail

CONTROLS_FILE=${CONTROLS_FILE:-controls_ftui.txt}
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

git ls-files --stage -z > "$TEMP_DIR/index"
git diff --cached --name-only -z --diff-filter=U > "$TEMP_DIR/unmerged"
if [[ -s "$TEMP_DIR/unmerged" ]]; then
  echo 'Cannot generate controls_ftui.txt while the index has merge conflicts.' >&2
  exit 1
fi

declare -a paths=()
declare -a object_ids=()
declare -a sizes=()
declare -a old_paths=()
declare -a old_dates=()
declare -a changed_paths=()
declare -a deleted_paths=()

while IFS= read -r -d '' entry; do
  metadata=${entry%%$'\t'*}
  path=${entry#*$'\t'}
  read -r mode object_id stage <<< "$metadata"

  if [[ $stage != 0 ]]; then
    echo "Cannot generate controls_ftui.txt for unmerged path: $path" >&2
    exit 1
  fi
  if [[ $path == www/ftui/* && $path != *'.git'* && $path != *'.eslintrc'* ]]; then
    paths+=("$path")
    object_ids+=("$object_id")
  fi
done < "$TEMP_DIR/index"

printf '%s\n' "${object_ids[@]}" | git cat-file --batch-check='%(objectsize)' > "$TEMP_DIR/sizes"
while IFS= read -r size; do
  sizes+=("$size")
done < "$TEMP_DIR/sizes"

has_head=false
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  has_head=true
  if git cat-file -e HEAD:controls_ftui.txt 2>/dev/null; then
    git show HEAD:controls_ftui.txt > "$TEMP_DIR/previous-controls"
  else
    : > "$TEMP_DIR/previous-controls"
  fi
  git diff --cached --name-only -z --diff-filter=ACMRT HEAD -- www/ftui > "$TEMP_DIR/changed"
  git diff --cached --name-only -z --diff-filter=D HEAD -- www/ftui > "$TEMP_DIR/deleted"
else
  : > "$TEMP_DIR/previous-controls"
  : > "$TEMP_DIR/changed"
  : > "$TEMP_DIR/deleted"
fi

while IFS= read -r line; do
  read -r action timestamp size path <<< "$line"
  if [[ ( $action == UPD || $action == CRE ) && $path == www/ftui/* ]]; then
    old_paths+=("$path")
    old_dates+=("$timestamp")
  fi
done < "$TEMP_DIR/previous-controls"

while IFS= read -r -d '' path; do
  changed_paths+=("$path")
done < "$TEMP_DIR/changed"

while IFS= read -r -d '' path; do
  if [[ $path == www/ftui/* && $path != *'.git'* && $path != *'.eslintrc'* ]]; then
    deleted_paths+=("$path")
  fi
done < "$TEMP_DIR/deleted"

generated_at=$(date '+%Y-%m-%d_%H:%M:%S')
: > "$TEMP_DIR/controls"

for index in "${!paths[@]}"; do
  path=${paths[$index]}
  timestamp=''

  if [[ $has_head == true ]]; then
    is_changed=false
    for changed_path in "${changed_paths[@]}"; do
      if [[ $path == "$changed_path" ]]; then
        is_changed=true
        break
      fi
    done

    if [[ $is_changed == false ]]; then
      for old_index in "${!old_paths[@]}"; do
        if [[ $path == "${old_paths[$old_index]}" ]]; then
          timestamp=${old_dates[$old_index]}
          break
        fi
      done
    fi
  fi

  if [[ -z $timestamp ]]; then
    timestamp=$generated_at
  fi

  action=UPD
  if [[ $path == *index.html* ]]; then
    action=CRE
  fi
  printf '%s %s %s %s\n' "$action" "$timestamp" "${sizes[$index]}" "$path" >> "$TEMP_DIR/controls"
done

for path in "${deleted_paths[@]}"; do
  printf 'MOV %s unused\n' "$path" >> "$TEMP_DIR/controls"
done

cat "$TEMP_DIR/controls" > "$CONTROLS_FILE"
echo "${CONTROLS_FILE} updated ($(wc -l < "$TEMP_DIR/controls" | tr -d ' ') entries)"
