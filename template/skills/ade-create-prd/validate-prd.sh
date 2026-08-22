#!/bin/bash
# 檢查 PRD 是否可送出。用法:bash .claude/skills/ade-create-prd/validate-prd.sh <prd.md>
set -u
f="${1:?用法: validate-prd.sh <prd.md>}"
[ -f "$f" ] || { echo "✗ 檔案不存在:$f"; exit 1; }
bad=0

# 每個必填區塊都要有實質內容(下一個 ## 之前有非空、非註解行)
for sec in 背景與目標 非目標 需求描述 影響服務 驗收條件; do
  body=$(awk -v s="## $sec" '$0==s{f=1;next} /^## /{f=0} f' "$f" | grep -vE '^\s*(<!--.*)?$')
  [ -n "$body" ] || { echo "✗ 區塊沒內容:$sec"; bad=1; }
done

grep -qE '^- 狀態: (草稿|已確認|已實作)' "$f" || { echo "✗ 狀態欄位缺或不是三種合法值之一"; bad=1; }
grep -qE '^- 提出者: *\S' "$f" || { echo "✗ 提出者未填"; bad=1; }
grep -qE '^- 日期: [0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" || { echo "✗ 日期未填或格式不對"; bad=1; }
grep -qE '^- \[ \] .*\S' "$f" || { echo "✗ 驗收條件沒有 checkbox 項目"; bad=1; }
placeholders=$(grep -nE "<標題>|YYYY-MM-DD|TODO|TBD|FIXME" "$f" || true)
[ -z "$placeholders" ] || { echo "✗ placeholder 未清:"; echo "$placeholders"; bad=1; }

[ "$bad" = 0 ] && echo "✓ 通過,PRD 可送出" || echo "✗ 未通過,補完再送"
exit $bad
