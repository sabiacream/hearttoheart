#!/usr/bin/env bash
# Generate .webp siblings next to JPGs (same basename). Requires Google libwebp: cwebp.
#
# .webp binaries are usually not committed in the same change as markup: run this locally,
# then commit the generated files separately—or <picture> WebP sources fall through to JPG.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if ! command -v cwebp >/dev/null 2>&1; then
  echo "Install cwebp (e.g. brew install webp) and re-run." >&2
  exit 1
fi
shopt -s nullglob
for dir in "$ROOT/tarot-images" "$ROOT/images"; do
  [[ -d "$dir" ]] || continue
  for jpg in "$dir"/*.jpg "$dir"/*.jpeg "$dir"/*.JPG "$dir"/*.JPEG; do
    [[ -f "$jpg" ]] || continue
    base="${jpg%.*}"
    out="${base}.webp"
    echo "cwebp: $jpg -> $out"
    cwebp -q 82 -m 6 -metadata none "$jpg" -o "$out"
  done
done
echo "Done."
