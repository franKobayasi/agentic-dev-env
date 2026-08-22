---
name: ade-create-prd
description: 依統一範本建立標準化 PRD，寫入 knowledge/prd/。想法還模糊就先用 Discovery 問成形，已想清楚就直接填。使用者說「建 PRD」「寫需求文件」「幫我寫一份 PRD」「把這個想法變成 PRD」「新的開發需求」「這個需求整理一下」「create PRD」時使用。bug fix／refactor／文字調整不用開 PRD。
---

# 建立 PRD

PRD 的定位、生命週期與檔名規則見 `knowledge/prd/README.md`，欄位結構以 `knowledge/prd/_template.md` 為準。本檔只寫「怎麼跑」。

0. **判斷所在位置**：repo 根有 `knowledge/prd/` → 你在 ADE repo 內，直接編輯本 repo 檔案；只有 `.claude/ade/knowledge/` → 你在工作目錄，依 `ade-contribute` skill 的流程取得 ADE 工作副本並建立分支，以下所有 `knowledge/...` 路徑都指工作副本內的檔案（絕不直接改 `.claude/ade/` 副本）

## 1. Discovery——問到想法成形

**已經有答案的題目直接跳過，不要重問**；使用者一開口就把七題講完就整段略過，直接進第 2 步。

用 `AskUserQuestion` 分批問缺的題，**一批 2–3 題，等回答再追問**，不要一次丟完。七題都有實質答案（或明確說「這題不在範圍」）才能往下。

1. 想做什麼？（一句話）
2. 為誰做？（Persona 寫成敘述，不是人口統計）
3. 解決什麼痛點？（**只寫痛點，不寫解方**）
4. 為何是現在？（deadline／法規／客戶／競爭）
5. 怎麼算成功？（可量測：baseline + target + 量測方式）
6. 範圍：做什麼、**明確不做什麼**
7. 影響哪些服務、相依哪些既有 PRD／spec？

紅線：答案含糊就追問，不要幫使用者猜；沒答案的留著，第 3 步進「開放問題」；Discovery 階段不談實作與 schema。

## 2. 對照既有知識

讀 `knowledge/services/index.md`、相關 `knowledge/specs/`，以及 `knowledge/prd/` 下狀態非「已實作」的 PRD。用團隊既有詞彙、對照現有規格找出衝突；與進行中 PRD 重疊時當場請 PO 決定合併或劃清界線。

## 3. 建檔

複製 `knowledge/prd/_template.md` 為 `knowledge/prd/YYYY-MM-DD-<slug>.md`（slug 用 kebab-case，日期用今天），狀態設「草稿」，逐區塊填寫：

| 範本區塊 | 來源 |
|---|---|
| 背景與目標 | Q3 痛點 + Q4 時機 + Q5 成功標準 |
| 非目標 | Q6 明確不做的部分（**不可空白**） |
| 需求描述 | Q1/Q2 展開成使用者故事與操作流程，具體到能開發 |
| 影響服務 | Q7 對照 services/index.md，列出各服務要改什麼 |
| 驗收條件 | 每條可測試，形容詞（好用／快）換成可驗證敘述 |
| 開放問題 | Discovery 中沒答案、待 PO 拍板的 |

「Spec 異動摘要」留空，那是 `ade-prd-to-spec` 的欄位。

## 4. 盲點拷問

逐項問到 PO 每題都有明確答案或明確說「不在範圍」，結果回填文件（範圍外的寫進「非目標」，未定的寫進「開放問題」）：

- **邊界與錯誤**：輸入不合法、資源不存在、操作中斷、併發衝突時各是什麼行為？
- **跨服務影響**：對照 services 總覽，有沒有漏列受影響的服務？服務間的呼叫順序與失敗處理？
- **權限與安全**：誰能用這功能？資料存取邊界？
- **相容性**：既有資料要遷移嗎？舊版本客戶端／既有 API 使用者會壞嗎？
- **驗收條件**：每一條都可測試嗎？「好用」「快」這類形容詞要換成可驗證的敘述
- **非目標**：最容易被誤以為包含在內的相鄰功能是什麼？明確排除

## 5. 驗證與收尾

```bash
bash .claude/skills/ade-create-prd/validate-prd.sh <PRD 檔的實際路徑>
```

有缺漏就補完再跑。通過後**不要自動翻狀態**——狀態留在「草稿」，由 PO 確認後才改「已確認」。收尾：ADE repo 內 → 照一般 git 慣例 commit；工作目錄 → 依 `ade-contribute` 流程開 PR。最後提醒下一步跑 `ade-prd-to-spec` 更新規格。
