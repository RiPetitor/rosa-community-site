#!/usr/bin/env bash
set -euo pipefail

out_dir="data"
out_file="${out_dir}/doc_dates.json"

mkdir -p "${out_dir}"

tmp_file=$(mktemp)

{
  echo "{"
  first=1
  while IFS= read -r -d '' file; do
    created=$(git log --reverse -1 --format=%cI -- "${file}")
    updated=$(git log -1 --format=%cI -- "${file}")

    if [[ -z "${created}" || -z "${updated}" ]]; then
      continue
    fi

    key=${file#content/}

    if [[ ${first} -eq 0 ]]; then
      echo ","
    fi

    printf '  "%s": {"created": "%s", "updated": "%s"}' "${key}" "${created}" "${updated}"
    first=0
  done < <(git ls-files -z "content/docs/**/*.md")
  echo
  echo "}"
} > "${tmp_file}"

mv "${tmp_file}" "${out_file}"

echo "Wrote ${out_file}"
