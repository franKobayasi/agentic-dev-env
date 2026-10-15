#!/bin/sh
# 用法：new-id.sh <分類資料夾>
# 輸出一個在該分類內尚未使用的 6 位小寫十六進位 id
dir="${1:?usage: new-id.sh <category-dir>}"
while :; do
  id=$(node -e "console.log(require('crypto').randomBytes(3).toString('hex'))")
  grep -rqs "^id: $id\$" "$dir" || { echo "$id"; exit 0; }
done
