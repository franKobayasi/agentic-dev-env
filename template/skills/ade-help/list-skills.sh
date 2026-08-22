#!/bin/bash
# 列出指定目錄下可用的 ade-* skills(名稱 TAB description)。
# 用法:bash .claude/skills/ade-help/list-skills.sh [skills 目錄,預設 .claude/skills]
set -u
dir="${1:-.claude/skills}"
n=0
for f in "$dir"/ade-*/SKILL.md; do
  [ -f "$f" ] || continue
  n=$((n+1))
  name=$(sed -n 's/^name: *//p' "$f" | head -1)
  desc=$(sed -n 's/^description: *//p' "$f" | head -1)
  printf '%s\t%s\n' "${name:-$(basename "$(dirname "$f")")}" "$desc"
done
[ "$n" -gt 0 ] || echo "找不到 ade-* skills($dir)" >&2
exit 0
