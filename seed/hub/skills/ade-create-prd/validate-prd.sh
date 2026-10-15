#!/bin/bash
# 檢查 PRD 是否可送出。用法:bash .claude/skills/ade-create-prd/validate-prd.sh <prd.md>
set -u
f="${1:?用法: validate-prd.sh <prd.md>}"
[ -f "$f" ] || { echo "✗ 檔案不存在:$f"; exit 1; }
bad=0

# 檔名慣例：建立日期加 slug
basename "$f" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$' \
  || { echo "✗ 檔名不是 YYYY-MM-DD-<kebab-case slug>.md:$(basename "$f")"; bad=1; }

# 區塊內容:下一個 ## 之前的非空、非註解行
# 標題用 grep 定位:macOS 的 BSD awk 比較中文字串恆為真,會把每個區塊都當成命中
section() {
  start=$(grep -nxF "## $1" "$f" | head -1 | cut -d: -f1)
  [ -n "$start" ] || return 0
  tail -n +$((start + 1)) "$f" | awk '/^## /{exit} {print}' | grep -vE '^\s*(<!--.*)?$'
}

for sec in 背景與目標 非目標 需求描述 影響服務 驗收條件; do
  [ -n "$(section "$sec")" ] || { echo "✗ 區塊沒內容:$sec"; bad=1; }
done

# 需求描述只能是 GWT 決策表,每個情境列的 Fallback 都要填
req=$(section 需求描述)
if [ -n "$req" ]; then
  printf '%s\n' "$req" | head -1 | grep -qE '^\|.*Given.*\|.*When.*\|.*Then.*\|.*Fallback.*\|' \
    || { echo "✗ 需求描述第一行不是 Given/When/Then/Fallback 表頭"; bad=1; }
  prose=$(printf '%s\n' "$req" | grep -vE '^\|' || true)
  [ -z "$prose" ] || { echo "✗ 需求描述只能寫決策表,以下不是表格列:"; echo "$prose"; bad=1; }
  rows=$(printf '%s\n' "$req" | grep -E '^\|' | tail -n +3)
  if [ -z "$rows" ]; then
    echo "✗ 決策表沒有情境列"; bad=1
  else
    nofb=$(printf '%s\n' "$rows" | awk -F'|' '{c=$5; gsub(/[ \t]/,"",c); if (NF<6 || c=="") print}')
    [ -z "$nofb" ] || { echo "✗ 情境列缺 Fallback:"; echo "$nofb"; bad=1; }
  fi
fi

# frontmatter 頂層欄位的值（只讀第一組 --- 之間）
fm() { awk 'NR==1 && /^---$/ {f=1; next} f && /^---$/ {exit} f' "$f" | grep -E "^$1:" | head -1 | sed -E "s/^$1:[[:space:]]*//"; }

fm id | grep -qE '^[0-9a-f]{6}$' || { echo "✗ frontmatter 的 id 缺或不是 6 位小寫十六進位"; bad=1; }
[ -n "$(fm description)" ] || { echo "✗ frontmatter 的 description 未填"; bad=1; }
status=$(fm status)
case "$status" in
  草稿|已確認|已實作|已廢止) ;;
  *) echo "✗ frontmatter 的 status 缺或不是合法值(草稿/已確認/已實作/已廢止)"; bad=1 ;;
esac
if [ "$status" = 已廢止 ]; then
  [ -n "$(fm deprecation_reason)" ] || { echo "✗ 已廢止但未填 deprecation_reason"; bad=1; }
fi
[ -n "$(fm proposer)" ] || { echo "✗ frontmatter 的 proposer 未填"; bad=1; }
fm date | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' || { echo "✗ frontmatter 的 date 未填或格式不對"; bad=1; }
grep -qE '^- \[ \] .*\S' "$f" || { echo "✗ 驗收條件沒有 checkbox 項目"; bad=1; }
placeholders=$(grep -nE "<標題>|<提出者>|<一句話|<以 |<前置狀態>|<觸發>|<預期行為>|<例外處置>|YYYY-MM-DD|TODO|TBD|FIXME" "$f" || true)
[ -z "$placeholders" ] || { echo "✗ placeholder 未清:"; echo "$placeholders"; bad=1; }

[ "$bad" = 0 ] && echo "✓ 通過,PRD 可送出" || echo "✗ 未通過,補完再送"
exit $bad
