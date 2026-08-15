# PRD

一次開發需求一檔：`YYYY-MM-DD-<slug>.md`，依 [_template.md](./_template.md) 格式撰寫（用 `ade-create-prd` skill 建立）。

PRD 是**歷史文件**：狀態走到「已實作」後即封存，不再迭代。當前功能的真相在 `../specs/`。

生命週期：`草稿`（撰寫中）→ `已確認`（PO 定案，可跑 `ade-prd-to-spec`）→ `已實作`（開發完成，`ade-align-spec` 收尾時標記）。
