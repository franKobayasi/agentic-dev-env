# Phase 大小閾值：研究報告

> **文件性質**：研究參考，不是流程規則。這裡整理的是「拆 Phase 判準該定多少、依據是什麼」的證據盤點；真正上線的判準請寫進負責拆 Phase 的 skill，並回頭標注採用了本文哪一組數字。
>
> 研究日期 2026-08-15。含時效性數字（LLM 能力相關）者已於文中標注。

## 1. 結論先行：閾值方案

### 設計取向

證據強度極不平均：**改動行數與改動檔案數有真實實證，AC 條數與測試複雜度沒有**。所以方案不是「五個維度各給一個分數再加總」——那種東西沒人算得出來，上線第一週就會被跳過。方案是：

- **硬觸發只放在兩個能機械檢查的維度**（預估行數、改動檔案數），命中就拆，不辯論
- 其他維度當**提示訊號**：命中時要求說明理由，不強制拆
- 規劃時因為量不到行數，改用**能估的代理指標**，且全部是軟判準

### 規劃時（粗估階段，軟判準）

此時只有 Phase 標題與一句話描述，任何行數估計都是幻覺。判準全部軟性，命中代表「回去看一下邊界畫對沒有」。

| 維度 | 預設值 | 超過時的動作 | 依據與強度 |
|---|---|---|---|
| **可獨立交付性** | Phase 合併後主幹仍可用、且該 Phase 的價值可單獨驗收 | 不成立 → **重畫邊界**（這是切錯不是切大，拆小救不了） | 慣例（強）：Google eng-practices「one self-contained change」；DORA trunk-based development |
| **觸及模組／子系統數** | ≤ 2 | ≥ 3 → 優先考慮橫切（依架構層拆）或縱切（依 feature 拆） | 推論。直接實證只到「檔案數」，模組數是外推；另有 merge 衝突面的獨立理由 |
| **預估 AC 條數** | ≤ 5 | 6–8 標記待觀察，> 8 直接規劃成兩個 Phase | **無實證**，由行數反推的工程慣例 |
| **預估人力當量工期** | ≤ 1–2 天 | 超過 → 拆 | 慣例（中）：trunk-based development「a couple of days」；DORA「超過一週就太大」 |
| **前置相依** | 不依賴另一個未完成 Phase 的產出 | 有相依 → 把被依賴的部分抽成獨立前置 Phase | 慣例：Google eng-practices 的 stacking／horizontal 拆法 |

### 展開時（AC 細化後，硬觸發）

此時 AC 已寫成 Given/When/Then、目標檔案大致可指認，估計才有意義。**前兩列命中就必須拆，不需要討論**。

| 維度 | 硬觸發值 | 動作 | 依據與強度 |
|---|---|---|---|
| **預估 diff 行數** | **> 400 行** 觸發必拆；目標值 200 行 | 必拆。拆不動時必須在 PR 描述寫明豁免理由 | **實證（強）**：SmartBear/Cisco 案例研究結論原文「LOC under review should be under 200, not to exceed 400」 |
| **改動檔案數** | **> 10 個** | 必拆，或在 PR 描述說明理由 | **實證（中強）**：Google 內部 90% 的 change 改動 < 10 檔；Microsoft 研究顯示 review 有效性隨檔案數下降 |
| **AC 條數** | > 8 條 | 提示訊號：要求說明為什麼不能拆 | **無實證**。與行數高度相關，當早期預警用，不當獨立閘門 |
| **測試基礎設施** | 需要新增 fixture／harness／測試環境才寫得出 AC | 把該基礎設施抽成獨立的前置 Phase | 推論。無量化實證，但符合「一個 Phase 一件事」 |
| **agent 執行成本** | 完成該 Phase 需要 > 1 次 context compaction | 事後判定：記錄下來，同類 Phase 下次拆更小 | **實證（強）**：context rot 系列研究（見 §3） |

### 豁免（不觸發拆分，直接放行）

以下情形即使超過行數／檔案數閾值也不拆——這是 Google eng-practices 明列的例外，不是我們自己發明的：

- 整檔刪除（reviewer 讀成本接近一行）
- 工具產生的機械式 refactor（rename、codemod），且工具本身可信
- 產生檔／lockfile／schema dump

判準應該對「人要逐行讀的行數」生效，不是對 `git diff --stat` 的數字生效。

### 為什麼是這些數字

- **400** 是 Cisco 研究的原文上限，**200** 是原文的建議值。這是本方案唯一有第一手量化實證支撐的數字，所以放在硬觸發。
- **10 檔**取自 Google 的實際分布（約 90% 的 change < 10 檔）。注意這是**描述性**的——描述 Google 怎麼做，不是證明 10 是最佳值。當閾值用是工程判斷。
- **5／8 條 AC** 純粹是從行數反推：若一條 AC 對應 20–40 行實作加測試，5 條約落在 200 行的目標區、8 條約撞到 400 行的上限。**沒有任何研究支持 AC 條數本身**。
- **1–2 天**取自 trunk-based development 的 short-lived branch 定義，DORA 的一週上限則是更寬鬆的外圈。

---

## 2. 面向一：Code review 效果與 diff 大小

### 2.1 SmartBear / Cisco 研究（200–400 LOC 說法的原始來源）

**原始出處**：Jason Cohen 等人，*Best Kept Secrets of Peer Code Review*，其中 "Code Review at Cisco Systems" 一章。SmartBear 官方 PDF：[code-review-cisco-case-study.pdf](https://static0.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf)

**研究規模**（原文）：

> "In May of 2006 Smart Bear Software wrapped up a 10-month case study of peer code review in the Cisco MeetingPlace product group at Cisco Systems, Inc. With 2500 reviews of 3.2 million lines of code written by 50 developers, this is the largest case study ever done on what's known as a 'lightweight' code review process."

**結論原文**（這是 200–400 說法的真正出處）：

> - "LOC under review should be under 200, not to exceed 400. Anything larger overwhelms reviewers and defects are not uncovered."
> - "Inspection rates less than 300 LOC/hour result in best defect detection. Rates under 500 are still good; expect to miss significant percentage of defects if faster than that."
> - "Total review time should be less than 60 minutes, not to exceed 90. Defect detection rates plummet after that time."
> - "Given these factors, the single best piece of advice we can give is to review between 100 and 300 lines of code at a time and spend 30-60 minutes to review it."

**支撐數據**：整體平均 32 defects/kLOC；61% 的 review 沒找到任何缺陷；找到缺陷者密度落在 10–130 defects/kLOC。Figure 21 顯示 defect density 隨 LOC 上升而下降。慢於 400 LOC/hour 的 reviewer 缺陷發現能力高於平均；快於 450 LOC/hour 時，87% 的案例 defect density 低於平均。

**必須知道的三個限制**（都寫在原文裡，二手轉述通常略過）：

1. **因果假設是作者自己承認的假設**。原文腳註 5：
   > "The critical reader will notice we're tacitly assuming that true defect density is constant over both large and small code changes. That is, we assume a 400-line change necessarily contains four times the number of defects in a 100-line change, and thus if defect densities in code review fall short of this the review must be 'less effective.'"

   也就是說，「大 diff 找到的缺陷密度較低」被解讀成「review 較無效」，但也可能是大改動本身缺陷密度較低（例如新增介面、樣板碼）。

2. **樣本被裁切過**。研究丟棄了時長 < 30 秒、inspection rate > 1500 LOC/hour、以及**行數 > 2000** 的 review（共砍掉 21%）。所以結論的適用範圍是 0–2000 行，不能外推到更大的 diff。

3. **Defect rate（每小時缺陷數）不受 review 大小影響**。原文：
   > "From Figure 24 it is clear that review size does not affect the defect rate... 94% of all reviews had a defect rate under 20 defects per hour regardless of review size."

   整體 defect rate 13 defects/hour。這代表大 diff 的問題是「reviewer 讀不完」，不是「reviewer 變笨」。

**外部效度**：2006 年、單一公司、單一產品線、單一工具（Code Collaborator）、C/C++ 時代。20 年沒有等規模的複製研究。要注意這一點——它是同類研究裡最好的，但也就這麼一份。

### 2.2 Google

**論文**：Sadowski, Söderberg, Church, Sipko, Bacchelli, *Modern Code Review: A Case Study at Google*, ICSE-SEIP 2018. [PDF](https://sback.it/publications/icse2018seip.pdf) / [ACM DL](https://dl.acm.org/doi/10.1145/3183519.3183525)

實際規模數字（原文）：

> "At Google, over 35% of the changes under consideration modify only a single file and about 90% modify fewer than 10 files. Over 10% of changes modify only a single line of code, and the median number of lines modified is 24."

延遲數字：

> "developers have to wait for initial feedback on their change a median time of under an hour for small changes and about 5 hours for very large changes. The overall (all code sizes) median latency for the entire review process is under 4 hours."

reviewer 數：Google 少於 25% 的 change 有一位以上 reviewer，中位數是 1（其他公司普遍是 2）。

Google 自己對因果的表述是保守的（值得學）：

> "Both low review times and reviewer counts may result from code review being a required part of the developer workflow; they can also result from small changes."

以及：

> "A correlation between change size and review quality is acknowledged by Google and developers are strongly encouraged to make small, incremental changes (with the exception of large deletions and automated refactoring)."

**官方實務文件**：[Google eng-practices — Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)

裡面唯一的數字是刻意模糊的：

> "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large, but it's up to the judgment of your reviewer."

還有一句直接對應我們的「檔案數」維度：

> "A 200-line change in one file might be okay, but spread across 50 files it would usually be too large."

以及授權 reviewer 直接退件：

> "reviewers have discretion to reject your change outright for the sole reason of it being too large."

文件也列了四種拆法（stacking／by files／horizontally／vertically）和豁免情形（整檔刪除、可信的自動化 refactor）——我們的拆分建議直接沿用這套詞彙即可，不必自創。

### 2.3 Microsoft 與跨公司比較

**論文一**：Rigby & Bird, *Convergent Contemporary Software Peer Review Practices*, ESEC/FSE 2013. [PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/rigby2013convergent.pdf)

涵蓋 Android、Chrome OS、Bing、Office、SQL Server、AMD、Lucent 與六個 OSS 專案。核心發現之一直接叫 **"Convergent Practice 3: Change sizes are small"**：

> "From Figure 4, both Android and AMD have a median change size of 44 lines. This median change size is larger than Apache, 25 lines, and Linux, 32 lines, but much smaller than Lucent where the number of non-comment lines changed is 263 lines... For example, Chrome's median change is 78 lines and includes 5 files."

> "On the OSS projects studied by Rigby et al., the median change on OSS projects varies from 11 to 32 lines changed. They argued that the small change on OSS projects facilitates frequent review of small independent changes."

review interval：AMD 中位數 17.5 小時，Chrome OS 15.7 小時，三個 Microsoft 專案 14.7／19.8／18.9 小時。

**這份研究最有價值的一點**：文化、獎勵制度、時程壓力天差地遠的組織，change size 卻收斂到同一個量級（數十行）。這是「小改動」最強的間接證據——不是誰規定的，是多方獨立演化出同一個平衡點。

**論文二**：Bosu, Greiler, Bird, *Characteristics of Useful Code Reviews: An Empirical Study at Microsoft*, MSR 2015. [PDF](https://www.amiangshu.com/papers/CodeReview-MSR-2015.pdf)

分析約 150 萬則 Microsoft code review 留言。與大小直接相關的發現（原文）：

> "Figure 8 illustrates how comment usefulness density change with the number of files in a change under review. The trendline shows that as number of files in the change increases, the proportion of comments that are useful drops. This result supports Rigby's recommendation for smaller changesets. Developers have indicated that if there are more files to review, then a thorough review takes more time and effort. As a result, reviewers may opt for cursory review of large changesets and may miss some changes."

建議段落：

> "Our results suggest that review effectiveness decreases with the number of files in the change set. Therefore, we recommend that developers submit smaller and incremental changes whenever possible, in contrast to waiting for a large feature to be completed."

**這是「改動檔案數」維度最直接的實證**，而且圖 8 的 x 軸範圍是 0–40 檔，我們設的 10 檔閾值在有資料的區間內。

**論文三（延遲面）**：Zhang et al., *Pull Request Latency Explained: An Empirical Overview*, EMSE 2022. [arXiv](https://arxiv.org/abs/2108.09946) — 確認 size 相關因子是 PR 延遲的主要影響因素之一，但也顯示影響力隨情境變動（有留言時，reviewer 首次回應時間才是最重要因子）。用來說明「大 PR 比較慢」有支撐，但別把它當成單因子。

---

## 3. 面向二：LLM agent 產出品質與 context／任務範圍

這個面向的證據結構跟 code review 相反：**「context 變長品質變差」證據非常紮實，但沒有任何研究給得出「一個 agent 任務該多大」的數字**。所以我們只能拿它支持「拆」的方向，不能拿它訂閾值。

### 3.1 位置效應：Lost in the Middle

Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang, *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2024. [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)

多文件 QA 與 key-value 檢索的正確率隨相關資訊位置呈 U 形：資訊在頭尾時最高，在中段時掉超過 30%。跨六個模型家族複現。

**對我們的意義**：Phase 的 AC 若埋在長 context 中段，被漏掉的機率顯著升高。這支持「AC 少而集中」，不支持任何特定條數。

### 3.2 長度效應（與位置無關）：Same Task, More Tokens

Levy, Jacoby, Goldberg, *Same Task, More Tokens: the Impact of Input Length on the Reasoning Performance of Large Language Models*, ACL 2024. [ACL Anthology](https://aclanthology.org/2024.acl-long.818/) / [arXiv:2402.14848](https://arxiv.org/abs/2402.14848)

方法很乾淨：同一個推理樣本，用不同長度／類型／位置的無關 padding 撐長，其餘不變（FLenQA 資料集）。結論：推理表現在**遠低於模型最大長度**時就開始明顯下降。另一個發現值得注意——input 變長時，模型在 chain-of-thought 階段更常「沒把任務相關資訊講出來」。

**這是本節最關鍵的一篇**：它證明退化不是因為任務變難，是因為 context 變長。任務難度恆定，只加無關內容，表現照樣掉。

### 3.3 產業複現：Context Rot

Hong, Troynikov, Huber, *Context Rot: How Increasing Input Tokens Impacts LLM Performance*, Chroma, 2025-07. [報告](https://www.trychroma.com/research/context-rot)

18 個前沿模型（含 GPT-4.1、Claude 4、Gemini 2.5、Qwen3），刻意「hold task complexity constant while varying only the input length」。結論：

> "Model performance varies significantly as input length changes, even on simple tasks."

> "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."

另兩個對 agent 流程直接有用的發現：needle 與 question 的語意相似度越低，長 context 的退化越嚴重（真實任務正是低相似度情境）；且「Even a single distractor reduces performance relative to the baseline」。

**注意**：這是廠商發布的技術報告，不是同行評審論文，但方法公開、與 §3.2 的學術結論一致。

### 3.4 Anthropic 官方立場

[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)（2025-09）

> "Context, therefore, must be treated as a finite resource with diminishing marginal returns."

> "Like humans, who have limited working memory capacity, LLMs have an 'attention budget' that they draw on when parsing large volumes of context."

> "Good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."

> "Rather than one agent attempting to maintain state across an entire project, specialized sub-agents can handle focused tasks with clean context windows."

[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 講的是我們這種流程的具體失敗模式：

> "the next iteration of the coding agent was then asked to work on only one feature at a time"

原文指出這對抑制 agent「do too much at once」的傾向是關鍵；同時記錄了另一個相反方向的失敗——agent 過早宣稱完成。兩者都靠「明確的 feature 清單 + 逐項標記通過/失敗」處理。這正好是我們 Given/When/Then AC 的角色，可以直接引用作為 AC 必須可機械驗證的理由。

該文也提到 compaction「isn't sufficient」——光靠自動壓縮救不了範圍過大的任務，這支持我們把「需要多次 compaction」當成 Phase 過大的訊號。

### 3.5 任務長度與成功率：METR

METR, *Measuring AI Ability to Complete Long Tasks*, 2025-03. [blog](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) / [arXiv:2503.14499](https://arxiv.org/abs/2503.14499)

定義 50%-task-completion time horizon：模型能以 50% 成功率完成的任務，對應人類需要多久。原文：

> "Current models have almost 100% success rate on tasks taking humans less than 4 minutes, but succeed <10% of the time on tasks taking more than around 4 hours."

當時 Claude 3.7 Sonnet 的 50% horizon 約 50 分鐘至 1 小時；趨勢是**約每 7 個月翻倍**。

> ⚠️ **時效警告**：上述分鐘數是 2025-03 的量測。以每 7 個月翻倍推算，到 2026-08 已約 2.4 次翻倍（數小時量級）。**不要把任何分鐘／小時數字寫進流程**，會在半年內過期。可用的是形狀而非數值：成功率隨任務長度陡降，且下降區間比直覺窄。
>
> METR 自己也標注了 caveat：估計「may be off by a factor of 10x」，且高度依賴任務集與人類基準的選取。

**結論**：這篇支持「Phase 要小到 agent 能一次做完」的方向，但**不能**用來訂具體閾值。真要校準，唯一可靠的方法是量自己的流程——記錄各 Phase 的一次通過率與 compaction 次數。

---

## 4. 面向三：可量化維度逐一定性

| 維度 | 證據強度 | 判定與理由 |
|---|---|---|
| **改動行數** | **實證** | 唯一有第一手量化研究直接給出數字的維度（Cisco 200/400）。但只有一份研究、2006 年、單一公司，且因果詮釋是作者自承的假設。強度足以當硬觸發，不足以當物理定律 |
| **改動檔案數** | **實證** | Bosu et al. 150 萬則留言，usefulness density 隨檔案數單調下降；Google 分布佐證（90% < 10 檔）；eng-practices 明文（「200 行散在 50 檔就太大」）。證據品質實際上比行數更好——樣本更大更新——只是沒人給過乾淨的閾值數字 |
| **AC 條數** | **純 folklore** | 查不到任何把「需求條目數」與品質／缺陷／review 效果連起來的實證研究。敏捷估算文獻（planning poker、story point）本身就被指出缺乏準確度的實證基礎。我們用它只因為它是規劃階段唯一估得出來的東西，且與行數相關——當代理指標，不當閘門 |
| **測試複雜度** | **純 folklore** | 沒有可操作的定義，更沒有閾值研究。建議整個換成一個是非題：「這些 AC 能不能用現有測試基礎設施寫出來？」——不能就把基礎設施抽成前置 Phase。這是 Google eng-practices 的 horizontal 拆法，不是新發明 |
| **觸及模組／子系統數** | **推論**（有兩條間接支撐） | 沒有直接研究。但（a）檔案數的實證可外推，模組數是檔案數的粗粒度版本；（b）它有一條與 review 無關的獨立理由——觸及模組越多，與其他 Phase 平行開發時的 merge 衝突面越大，直接關係到 merge-safe 目標。用「≤ 2」作軟判準是工程判斷，要誠實標示 |
| **agent compaction 次數** | **實證（間接）** | §3 的退化證據紮實，但沒有研究說「幾次 compaction 算太多」。優點是它**免費且可自動記錄**，是唯一能從我們自己流程長出真實校準數據的維度。建議先只記錄不設閾值，累積幾十個 Phase 之後再回來訂 |

---

## 5. 面向四：small PR / small batch 的業界數字

| 來源 | 具體數字 | 性質 |
|---|---|---|
| [Google eng-practices](https://google.github.io/eng-practices/review/developer/small-cls.html) | 100 行合理，1000 行太大 | 官方實務文件，明說「it's up to the judgment of your reviewer」 |
| [Cisco/SmartBear](https://static0.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf) | < 200 行，不超過 400；單次 review 30–60 分鐘 | 實證研究結論 |
| [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/short-lived-feature-branches/) | branch「should only last a couple of days」；超過兩天就有變成長命分支的風險；分支上開發者數維持 1 人（結對則 2 人） | 實務主張，無量化研究支撐 |
| [DORA — Working in small batches](https://dora.dev/capabilities/working-in-small-batches/) | 單一 feature「no more than a few days」；「Any batch of code that takes longer than a week to complete and check is too big」；每天至少 check in 主幹一次 | DORA 調查（自陳問卷 + 統計建模），非直接量測 |
| [DORA 2025 State of AI-assisted Software Development](https://dora.dev/dora-report-2025/) | 無數字，但把「working in small batches」列為放大 AI 效益的七項基礎能力之一 | 近 5000 份問卷；**與我們的題目最相關的一筆**——它專門講 AI 輔助開發下 small batch 的作用 |

**重要的方法論分野**：Cisco 那條線量的是**人做 review 的認知極限**（有直接量測）；trunk-based / DORA 那條線講的是**交付流程的批次大小**（自陳問卷 + 相關性建模，因果較弱）。兩者數量級不同、機制不同，不要混著引用。我們的硬觸發用前者，規劃時的工期判準用後者，就是這個道理。

---

## 6. Folklore 清單：查不到實證的常見說法

寫進流程前請先確認不是以下任何一條。

1. **「200–400 LOC 的 review 可發現 70–90% 的缺陷」**
   最常被轉述的版本，出自 [SmartBear 的 best practices 頁面](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)，該頁把它歸給 Cisco 研究。**但 Cisco 案例研究全文查無 70–90% 這個數字**。研究實際報告的是：平均 32 defects/kLOC、61% 的 review 沒找到缺陷。「70–90% 缺陷發現率」需要知道缺陷總數才算得出來，而原文明說這是 in situ 研究、無法得知。**這是一個把行銷頁面當研究結論的誤引**。200–400 這個數字本身是真的，附加的百分比是假的。

2. **「大 PR 有更多 bug」**
   Cisco 研究顯示的是大 diff 中**被找到的**缺陷密度較低，不是實際缺陷較多。作者自己在腳註承認「true defect density 恆定」只是假設。正確說法是：**大 diff 讓 review 失效，不是讓程式碼變爛**。這個區別會影響對策——對策是拆 diff，不是加測試。

3. **「Miller 7±2，所以一個 Phase 最多 7 條 AC」**
   Miller 1956 談的是單維刺激的即時記憶廣度（音高、亮度這類），從來不是任務分解或工作項目數。把它拿來當任何工程閾值的依據都是誤用。我們的 5／8 就是工程慣例，別給它套一個假的認知科學外衣。

4. **「context window 夠大就能塞進整個大任務」**
   §3 全部三份研究都直接反駁：退化在遠低於上限處就發生。Chroma 的說法是 200K 窗口的模型可能在 50K 就已顯著退化。

5. **「AC 寫得越細，估算越準」**
   直覺合理，但敏捷估算文獻本身就被指出缺乏準確度實證（planning poker 的實證研究極少）。AC 細化的真正好處是**可驗證性**（Anthropic 的 feature 清單機制），不是估算精度。用對理由推銷這件事。

6. **「小 PR 讓 review 更快」的因果方向**
   相關性成立（多份研究），但 Google 自己的論文明白表示低延遲也可能來自「code review 是必經流程 + 快速回應的文化期待」，未必是 change 小造成的。我們照樣拆小——理由是 review 有效性（Bosu 的實證），不要拿延遲當主要理由。

7. **任何寫死的 agent 任務時長／token 數上限**
   METR 的 horizon 每 7 個月翻倍，任何以分鐘或 token 為單位的硬上限都會在半年內失效。要嘛用「單一 session 內、不需 compaction」這種相對判準，要嘛定期重新量測。

---

## 7. 給實作者的三句話

1. 硬觸發就兩條：**> 400 行**、**> 10 檔**。命中就拆，其餘維度只當訊號。
2. 規劃時別假裝估得出行數，改問「合併後主幹還能動嗎」「觸及幾個模組」「一兩天做得完嗎」。
3. 開始記錄每個 Phase 的實際行數、檔案數與 compaction 次數。三個月後我們會有**自己的**資料，屆時可以把上面所有借來的數字換成真的。
