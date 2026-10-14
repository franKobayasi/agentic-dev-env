---
name: ade-list-service
description: 列出 ADE 知識庫目前所有已註冊的服務。使用者說「列出服務」「有哪些服務」「目前註冊了哪些服務」「list services」時使用。只讀不改；要新增或修改服務用 ade-add-service。
---

# 列出已註冊服務

1. **判斷所在位置**：repo 根有 `knowledge/services/` → 你在 ADE repo 內，讀 `knowledge/services/`；只有 `.claude/ade/knowledge/` → 你在工作目錄，讀 `.claude/ade/knowledge/services/`
2. 讀該目錄的 `index.md` 總覽表，同時列出目錄下的 `*.yaml`（排除 `_template.yaml`）
3. 兩者比對：`yaml` 存在但總覽表沒列（或反之）→ 一併回報為不一致，提示用 `ade-add-service` 補齊
4. 輸出服務清單：每列「服務名｜定位（取自總覽表）｜描述檔路徑」。要看某服務細節時再讀對應 `<service>.yaml`，不要預先全部載入
