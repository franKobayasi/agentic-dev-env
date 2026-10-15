# ADR 索引

本檔由 `node scripts/adr.js sync` 產生，不得手動編輯。ADR 的用途、建立方式與狀態的意義見[決策紀錄的說明](./README.md)。

下表依編號由新到舊列出全部 ADR：

| ADR | 標題 | 狀態 | 結論 | 影響與備註 |
|---|---|---|---|---|
| [0003](./0003-reference-knowledge-by-symbol-address.md) | 知識庫內的引用改用符號位址 | `accepted` | 知識庫內的引用改用符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析，不用路徑連結 | 名稱在分類內唯一；改名時同一次變更改完所有引用，封存的文件也機械改寫；尚未實作標記改用符號並移除 emoji |
| [0002](./0002-separate-readme-and-generated-index.md) | 入口檔與索引檔分成 README.md 與程式產生的 INDEX.md | `accepted` | 資料夾的介紹寫在手寫的 README.md，索引寫在由程式產生的 INDEX.md；INDEX.md 不得手寫 | README.md 每個資料夾必備；INDEX.md 選用，用於集合型資料夾；runner 的檢查比對 INDEX.md 與各筆資料 |
| [0001](./0001-no-depth-or-item-limits-in-knowledge-base.md) | 知識庫的層數與每層項目數不設上限 | `accepted` | 知識庫的層數與每層項目數不設上限；檢索效率不足時改善檢索方式，不限制結構 | runner 的檢查不得因層數或項目數報錯；改善檢索方式的觸發訊號是 ADE repo 回報導覽困難 |
