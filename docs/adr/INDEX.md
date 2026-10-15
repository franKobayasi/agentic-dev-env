# ADR 索引

本檔由 `node scripts/adr.js sync` 產生，不得手動編輯。ADR 的用途、建立方式與狀態的意義見[決策紀錄的說明](./README.md)。

下表依編號由新到舊列出全部 ADR：

| ADR | 標題 | 狀態 | 結論 | 影響與備註 |
|---|---|---|---|---|
| [0001](./0001-no-depth-or-item-limits-in-knowledge-base.md) | 知識庫的層數與每層項目數不設上限 | `accepted` | 知識庫的層數與每層項目數不設上限；檢索效率不足時改善檢索方式，不限制結構 | runner 的檢查不得因層數或項目數報錯；改善檢索方式的觸發訊號是 ADE repo 回報導覽困難 |
