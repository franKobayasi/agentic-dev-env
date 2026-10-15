# 決策紀錄

本目錄存放生成器的架構決策紀錄（ADR，Architecture Decision Record），格式採用 [MADR](https://adr.github.io/madr/)。每份 ADR 記錄一個決策當時的限制、考慮過的方案，以及選擇的理由。現況的描述不在 ADR 內，而在對應的文件與程式碼中。

## 建立 ADR

ADR 由 `adr-madr` skill 引導建立，規則見 [`.claude/skills/adr-madr/SKILL.md`](../../.claude/skills/adr-madr/SKILL.md)。檔名格式為 `NNNN-kebab-case-slug.md`，`NNNN` 是四位數流水號，從 `0001` 開始連續編號。

全部 ADR 列在 [ADR 索引](./INDEX.md)。索引由 pre-commit hook 執行 `node scripts/adr.js sync` 產生，不得手動編輯。

## 狀態

ADR 的 `status` 欄位使用下表的值：

| status | 意義 |
|---|---|
| `proposed` | 草擬中，尚未定案 |
| `accepted` | 已定案並採用，是目前有效的決策 |
| `rejected` | 評估後不採用；保留紀錄，避免同一個方向被重新提案 |
| `deprecated` | 曾經有效，已不再採用，且沒有單一的後繼 ADR |
| `superseded by ADR-NNNN` | 已被 `NNNN` 這份 ADR 取代 |

