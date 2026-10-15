---
name: ade-list-service
description: 列出 ADE 知識庫目前所有已註冊的服務。使用者說「列出服務」「有哪些服務」「目前註冊了哪些服務」「list services」時使用。只讀不改；要新增或修改服務用 ade-add-service。
metadata:
  ade-scope: both
---

# 列出已註冊服務

1. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，讀 `hub/knowledge/services/`；只有 `.claude/ade/knowledge/` 時，讀 `.claude/ade/knowledge/services/`。
2. 列出目錄下的 `*.yaml`，排除 `_` 開頭的範本，每份只讀 `name` 與 `description`。
3. 輸出服務清單，每列「服務名稱｜定位（取自 `description`）｜描述檔路徑」。需要某個服務的細節時再讀該描述檔，不預先全部載入。
4. 描述檔的 `name` 與檔名不一致，或缺少 `repo` 的 `url`、`branch` 時，一併回報，並提示用 `ade-add-service` 修正。
