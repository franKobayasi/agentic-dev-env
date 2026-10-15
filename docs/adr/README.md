# 決策紀錄

本目錄存放生成器的架構決策紀錄（ADR，Architecture Decision Record），格式採用 [MADR](https://adr.github.io/madr/)。每份 ADR 記錄一個決策當時的限制、考慮過的方案，以及選擇的理由。現況的描述不在 ADR 內，而在對應的文件與程式碼中。

## 建立 ADR

ADR 由 `adr-madr` skill 引導建立，規則見 [`.claude/skills/adr-madr/SKILL.md`](../../.claude/skills/adr-madr/SKILL.md)。檔名格式為 `NNNN-kebab-case-slug.md`，`NNNN` 是四位數流水號，從 `0001` 開始連續編號。

下方的索引表由 pre-commit hook 執行 `node scripts/adr.js sync` 產生，不得手動編輯。

## 狀態

ADR 的 `status` 欄位使用下表的值：

| status | 意義 |
|---|---|
| `proposed` | 草擬中，尚未定案 |
| `accepted` | 已定案並採用，是目前有效的決策 |
| `rejected` | 評估後不採用；保留紀錄，避免同一個方向被重新提案 |
| `deprecated` | 曾經有效，已不再採用，且沒有單一的後繼 ADR |
| `superseded by ADR-NNNN` | 已被 `NNNN` 這份 ADR 取代 |

## 索引

下表依編號由新到舊列出全部 ADR：

<!-- BEGIN_ADR_INDEX -->
| ADR | 標題 | 狀態 | 結論 | 影響與備註 |
|---|---|---|---|---|
| [0001](./0001-no-depth-or-item-limits-in-knowledge-base.md) | 知識庫的層數與每層項目數不設上限 | `accepted` | 知識庫的層數與每層項目數不設上限；檢索效率不足時改善檢索方式，不限制結構 | runner 的檢查不得因層數或項目數報錯；改善檢索方式的觸發訊號是 ADE repo 回報導覽困難 |
<!-- END_ADR_INDEX -->
