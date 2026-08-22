# 批次自主執行的安全模型：研究報告

> **文件性質**：研究參考，不是流程規則。這裡整理的是「多顆任務連續無人值守跑完，安全邊界該畫在哪」的證據盤點；上線判準寫進 `skills/ade-dev-auto/SKILL.md`，並回頭標注採用了本文哪一組結論。
>
> 研究日期 2026-08-16。含時效性數字（LLM 能力、AI 交付遙測）者已於文中標注。
>
> **採用標注（2026-08-16）**：§1.1 B1–B4 定案、§1.2 熔斷定案、§1.3 積壓扣減已全數落入 `skills/ade-dev-auto`；失敗類別不另設欄位，由 `halted` 原因碼導出（`test-env`＝ERROR，其餘＝FAIL）。
> 相關文件：[research-autopilot-readiness.md](./research-autopilot-readiness.md)（B1–B4 與熔斷的原始依據，本文是它 §1.2／§1.3／§7.3 的續作）、[research-phase-sizing.md](./research-phase-sizing.md)

---

## 1. 結論先行

### 設計取向

三個從證據裡浮出來、直接決定方案形狀的事實：

1. **併發加速的是非瓶頸。** 瓶頸是人 merge 的頻寬，不是 agent 的 wall-clock。Faros AI 2026 的兩年遙測（22,000 名開發者）測到：AI 高採用團隊 merge 的 PR 多 98%，但「**Pull requests merged without any review, human or agentic, are up 31.3%**」（§5.1）。在瓶頸前面加速，產出的不是交付，是庫存。
2. **「同一關」是位置，不是原因。** 用位置當共因代理指標同時會誤判與漏判。成熟實作分櫃的方式是按**錯誤來源**（Envoy 的 `split_external_local_origin_errors`）與**判定性質**（Argo 的 `failureLimit` vs `consecutiveErrorLimit`），不是按發生位置。而這個分類 `ade-dev` 的任務層煞車**已經在做**（兩個分開的計數器），批次層只要讀它就好，不必自己發明相似度。
3. **所有權威給的硬上限都是「單位上限」，批次總上限沒有人給。** GitHub Copilot 59 分鐘是單一 session，GitHub Actions 6 小時是單一 job，Argo 的 `progressDeadlineSeconds` 600 秒是單次更新。批次總上限只能自己訂，而唯一可用的錨點是**人**：SRE Book 的「2 incidents per 12-hour shift」是本研究找到唯一一個一手的「人在一個班次能吸收幾個需要全神貫注的事件」數字（§3.2）。

四個問題的裁定，一句話版本：

| 問題 | 裁定 |
|---|---|
| B2 併發 ≤ 2 | **刪掉。純依序。** 併發加速非瓶頸，且會污染熔斷訊號 |
| B4 批次總上限 | **加上：批次總 wall-clock ≤ 4 小時**，每顆開始前檢查，軟停 |
| 熔斷「同因」判定 | **值得改，且零新機制**——改讀 `ade-dev` 已經輸出的「煞車條款＋失敗類別」，不再用「同一關」 |
| MR 積壓背壓 | **採納，但不做新機制**——折進 B2 當入場扣減，不做批次中的監控 |

---

### 1.1 B1–B4 定案全文（可直接落入 SKILL.md）

```markdown
## 批次層判準（僅在此定義；依據 `research-autopilot-readiness.md` §1.2 與 `research-batch-safety.md`）

- **B1** 批次內任務的預期改動檔案互不相交（兩兩交集為空）。依序執行後這條不防併發寫入，
  防的是另外兩件事：MR 會被人以未知順序 merge，重疊檔案必然衝突；以及即使熔斷完全失效，
  一批最多也只污染 5 組不相交的檔案（cell 邊界）
- **B2** 一批 ≤ 5 顆，且**依序逐顆執行、不併發**——併發加速的是 agent 的 wall-clock，
  而瓶頸是人 merge 的頻寬；同時併發會讓「這顆為什麼失敗」的歸因失效，熔斷判不出共因。
  批次規模另受積壓扣減：**本批顆數 ≤ 5 −（目前由 auto-pilot 開出、尚未 merge 也未關閉的 MR 數）**，
  差額 ≤ 0 就不開批次，先請人清積壓
- **B3** 逐顆獨立評估與執行，單顆不合格或失敗只影響該顆
- **B4** 單顆任務 wall-clock ≤ 60 分鐘；**批次總 wall-clock ≤ 4 小時**——每顆任務**開始前**
  檢查批次累計時間，≥ 4 小時就不再啟動下一顆（軟停，不中斷進行中的任務），
  輸出總結與未跑的任務清單
```

### 1.2 批次熔斷定案全文（可直接落入 SKILL.md）

```markdown
## 批次熔斷

任務內何時停由 `ade-dev` 的煞車決定。一顆任務停下時，`ade-dev` 已被要求輸出「停在哪個 Phase、
哪條判準」——批次層只讀兩個欄位，不自己判斷相似度：

- **煞車條款**：命中的是哪一條煞車（不是停在哪一關——關是位置不是原因）
- **失敗類別**：`FAIL`（產出是壞的：測試紅、blocking finding、spec 無依據）或
  `ERROR`（判斷不出來：測試跑不起來、工具或依賴或網路壞了）。這正是 `ade-dev` 任務層
  兩個分開計數器的分類，批次層沿用

熔斷規則：

- **`ERROR` 類連續 2 顆 → 停整批**（不論停在哪一關）。環境問題會在不同關爆，用關來判會漏
- **`FAIL` 類連續 2 顆命中同一條煞車條款 → 停整批**。只是同一關但不同條款，不算同因
- 其餘單顆失敗 → 該顆降回手動，批次繼續下一顆
- **累計 3 顆失敗**（不分類別）→ 停整批
- **環境阻塞**（主幹紅、build 壞、依賴服務掛）→ 第一次命中即停整批
```

### 1.3 背壓：採納，但不新增機制

**結論：不是 YAGNI，但也不需要一套背壓機制。** 一行入場扣減就夠，已寫進 B2。

理由分三段：

- **不是 YAGNI**：Faros AI 2026 的遙測直接測到這個失效——reviewer 跟不上時，**沒被審查就 merge 的 PR 上升 31.3%**（§5.1）。這不是推測的風險，是量到的。而 `ade-dev` 的 G8（人 merge）是整條流程的最後一道防線，它失效等於 auto-pilot 的安全論證斷掉。
- **但不需要監控**：批次跑的時候人不在，積壓在批次中途**不可能減少**。所以中途檢查抓不到任何入場時抓不到的東西——那是純粹的複雜度。檢查點只需要一個：批次開始前。
- **而且不需要新數字**：DORA 對 WIP limit 的設法是「**Don't allow more WIP in any given part of the process than you have people to work on tasks**」（§5.2）——上限綁的是人的處理能力，而 B2 的 5 本來就是照「人還審得完」訂的（`research-autopilot-readiness.md` §2.8）。所以正確的做法不是另設一個積壓閾值 N，而是讓已開出未 merge 的 MR **佔用同一個 5 的額度**。系統中同時存在的 auto-pilot 未 merge MR 永遠 ≤ 5。

### 1.4 對四個問題的逐條裁定與理由

#### 問題一：B2 自相矛盾 → **定案純依序，刪掉「併發 ≤ 2」**

三條獨立的理由，任一條都足以定案：

1. **併發加速的是非瓶頸。** Faros 的結論原文是「a system moves only as fast as its slowest link」（§5.1）。在我們的流程裡最慢的一環是人 merge。併發 2 讓 5 顆從 5 小時變 2.5 小時，但 5 個 MR 落到人手上的時間沒變快——只是更早堆好而已，而更早堆好正是 §5.1 量到的失效誘因。
2. **併發污染熔斷訊號。** Google SRE Workbook 對 canary 的建議是「**We strongly advise running only one canary deployment at a time**」，理由正是併行會帶來追蹤系統狀態的心智負擔與**訊號污染**（§2.1）。我們的批次熔斷完全依賴「連續兩顆的失敗原因是不是同一個」，兩顆同時跑時「連續」失去定義，共因與各自的原因也分不開。
3. **併發的實作成本被嚴重低估，而且沒人願意付。** 真要併發 2，最少要：兩個 git worktree（Claude Code 的併行隔離就是靠 worktree，且會**強制阻擋**跨越到主 checkout 的寫入，§2.3）、兩套互不衝突的測試資源（port、DB、fixture）、兩條分支各自 `ade-ship`。B1 只保證「改動檔案不相交」，它管不到共用的執行期資源。Anthropic 16 個併行 Claude 的實測給了反面教材：協調要靠檔案鎖，「Merge conflicts are frequent」，而當工作沒被切開時「**every agent would hit the same bug, fix that bug, and then overwrite each other's changes**」（§2.2）。

**刪掉併發最大的收穫不是省下併發程式碼，是省下一整類規則。** 團隊 review 提到的「同一工作樹的 commit 疊加、測試互踩、煞車互動」——純依序之下這三個問題都不存在，一條規則都不用寫。

#### 問題二：B4 只有單顆上限 → **定案批次總 wall-clock ≤ 4 小時，軟停**

依據文件 §1.2 的 B4 原文是「批次有 wall-clock 總上限，建議單一任務 ≤ 60 分鐘」，skill 只抄了括號裡的建議值，把主詞弄丟了。

**數字：4 小時。這是工程判斷，不是實證，錨點如下**（誠實標注同 §3.4）：

- 5 顆 × 60 分 = 5 小時的隱含上限本來就在，但那是「批次規模上限恰好也是時間上限」的巧合，不是設計。它在任務跑得比預期慢時完全不咬——3 顆各花 80 分鐘就超過 4 小時，而 B2、B4 都不會叫停。
- 真正要綁的是「**啟動批次的人，要是回來 review 的人**」。4 小時 = 半個工作日，讓批次落在同一個上午或下午。這直接服務 §5.6（Endsley 的 out-of-the-loop 問題）：交還的時間離啟動越遠，人重建情境的成本越高。
- 唯一的一手人類吞吐數字：Google SRE Book 的「**the maximum number of incidents per day is 2 per 12-hour on-call shift**」，依據是一次 incident 的完整處理（root cause、修復、postmortem）約 6 小時（§3.2）。人在一個班次裡能完整吸收的「需要全神貫注的事件」是個位數，且遠低於直覺。

**觸發行為：軟停。** 每顆任務**開始前**檢查累計 wall-clock，≥ 4 小時就不啟動下一顆，輸出總結與未跑清單。不中斷進行中的任務——中斷會留下一個半完成的工作樹，違反依據文件 §5.6 的「交還時要附完整情境重建材料」。這對應 Argo Rollouts 把「超時」與「超時後要不要中止」拆成兩個旋鈕（`progressDeadlineSeconds` 與 `progressDeadlineAbort`，預設**不**中止，§3.3）——我們選的是不中止的那一邊，但入場封閉。

只檢查「已過多久」而不做「加上 60 分鐘會不會超過」的前瞻判斷，是刻意的：多一條前瞻只換到最壞情況從 4h59 降到 4h，不值一條規則。

#### 問題三：熔斷「同因」判定粗糙 → **值得改，且改法零新機制**

依據文件 §7.3 承認「連續 2 顆停在同一關」是刻意的粗糙近似，理由是當時沒有更好的機械判準。現在有了，而且不用新增任何東西——**`ade-dev` 的任務層煞車已經把失敗分成兩類計數器**（「測試紅了」連續 3 次 vs「測試跑不起來」另計連續 3 次），這個分類正是 Argo 的 `failureLimit`／`consecutiveErrorLimit` 不對稱，也正是 Envoy 的 `split_external_local_origin_errors`（§4.2）。批次層過去沒用它，是遺漏不是取捨。

改法（全文見 §1.2）把「同一關」換成兩個欄位：

- **失敗類別 `ERROR`（環境類）→ 關無關，連續 2 顆就停。** 這修掉**漏判**：同一個壞掉的依賴會在不同關爆（規格關讀不到檔、實作關裝不起來、測試關跑不動），舊規則因為關不同而不停。而環境類連續兩顆幾乎必然是共因——這正是 CCF 的教科書定義：「a single failure event that affects multiple components」（§4.1）——誤停的代價也最低（人重跑一次就知道）。
- **失敗類別 `FAIL`（產出類）→ 要同一條煞車條款才算同因。** 這修掉**誤判**：兩顆都停在第三關，一顆是「修改既有測試斷言」、一顆是「規模超閾值 2 倍」，這是兩個獨立問題，舊規則會誤停整批。條款相同才停，位置相同不算。

不做的改進（明確 YAGNI）：

- **不做失敗訊息的相似度比對／embedding 分群。** 樣本量是 2，任何統計方法在 n=2 上都沒有意義；依據文件 §5.2 已經記錄了所有成熟熔斷實作都堅持不在低樣本量下跳閘，我們是刻意在慣例外操作，再疊一層假精確只會讓判斷更難解釋。而 Google CAS 的教訓正好相反方向——「**CAS intentionally does not provide a confidence score, p-value, or the like**」，且判準必須可解釋，否則使用者會繞過它。
- **不做失敗原因的自由文字歸納。** 那會回到「靠 agent 自述」，就是 §7.3 一開始想避開的東西。

代價要標明：這個改法把「共因」的定義綁死在 `ade-dev` 的煞車條款清單上。條款清單改了，熔斷的行為就跟著變。這是可接受的耦合——兩份文件本來就是同一套流程的兩層，而唯一的替代品是批次層自己維護第二份分類，那必漂移（同 `research-devflow-state.md` 的單一真相原則）。

#### 問題四：人的 review 頻寬 → **採納背壓，但只是 B2 的一行扣減**

見 §1.3。補一條反面理由，說明為什麼**不**做更重的背壓：GitHub merge queue 是最接近我們場景的成熟佇列系統，它的節流旋鈕就是入場端的一個整數（build concurrency，1–100），以及「一次最多／最少 merge 幾個 PR」和一個等待逾時（§5.3）。它沒有「下游積壓到 N 就暫停佇列」這種回饋迴路——因為佇列本身的長度就是那個訊號。我們也一樣：未 merge 的 MR 數就是訊號，扣減額度就是反應，不需要第二套。

---

## 2. 面向一：併發 vs 依序

### 2.1 Google SRE Workbook：一次只跑一個 canary

來源：[The Site Reliability Workbook, ch.16 "Canarying Releases"](https://sre.google/workbook/canarying-releases/)

> "**We strongly advise running only one canary deployment at a time.**"

理由有兩條，都直接落在我們身上：

- **心智負擔**：同時多個 canary「adds significant mental effort to track system state」，在非常規情況下需要快速推理系統狀態時尤其致命。
- **訊號污染**：「increases the risk of signal contamination if the canaries overlap」——重疊時無法把觀察到的指標變化歸因到特定一次部署。

同一章對 canary 時長的取捨是「跟部署頻率對齊」：

> "If you release daily, you can't let your canary last for a week while running only one canary deployment at a time."

**對我們的映射**：訊號污染這一條是決定性的。批次熔斷的全部內容就是「連續兩顆的失敗是不是同一個原因」，這是一個歸因問題。兩顆同時在跑時，「連續」沒有定義，而共用的環境（同一台機器、同一份依賴、同一個測試 DB）讓 A 的失敗可能是 B 造成的——熔斷器會在自己製造的訊號上跳閘或漏跳。

### 2.2 Anthropic：16 個併行 Claude 的實測

來源：[Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)（Anthropic Engineering）

規模：「16 agents with writing a Rust-based C compiler, from scratch, capable of compiling the Linux kernel」。

- **協調方式**：沒有 orchestrator。「Claude takes a 'lock' on a task by writing a text file to `current_tasks/`」，每個 agent clone 一份本地 repo，完成後推回上游。
- **併發真正有效的條件**：工作**天然已經被切成互不相干的片**——「there are many distinct failing tests」時，每個 agent 認領不同的失敗。
- **併發失效的形態**：把單一大目標（編譯 Linux kernel）丟給所有 agent 時，「**every agent would hit the same bug, fix that bug, and then overwrite each other's changes**」。修法不是加協調，是回頭把問題切開（GCC oracle 讓 agent 分檔案work）。
- **恆常成本**：「Merge conflicts are frequent」（雖然 Claude 解得掉）。

**對我們的映射**：這是併發最有利的一手證據，而它的成立條件恰恰是我們**已經用 B1 保證了**的「工作互不相干」。但它也標出了代價：檔案鎖、每個 agent 一份 clone、頻繁的 merge conflict。這些成本在 16 個 agent 分攤到一個超大目標時划算；在 2 個 agent 分攤 5 顆已經互不相干的小任務時，換到的只有 2.5 小時，而那 2.5 小時落在非瓶頸上（§5.1）。

### 2.3 Claude Code：併行隔離的真實形狀

來源：[Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees)（Claude Code Docs）

> "Running each Claude Code session in its own worktree means **edits in one session never touch files in another**, so one session can build a feature while a second fixes a bug."

隔離是**強制**的，不是建議——在 worktree 中的 session，Claude Code 會擋掉四類跨界操作：對主 checkout 路徑的 `Edit`／`Write`／`NotebookEdit`；工作目錄解析到主 checkout 的 Bash 指令；把 git 重導向主 checkout 的指令（`git -C`、`--git-dir`、`GIT_DIR`、先 `cd` 再跑 git）；以及無法靜態確認會留在 worktree 內的指令形狀。

同時，worktree **不隔離**的東西同樣重要：

> "git commands in a worktree write to the main repository's shared `.git` directory"

而且 worktree 是全新 checkout，「untracked files like `.env` or `.env.local` from your main repository are not present」，要靠 `.worktreeinclude` 補。

GitHub 的併行 session 也是同一個形狀——[Copilot app 的 agent sessions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions) 文件說每個 session「runs in its own isolated workspace, so you can run multiple sessions in parallel and make progress on several tasks without conflicts」。

**對我們的映射**：「併發 ≤ 2」在同一個工作目錄裡是**沒有支援的組態**，不只是有風險。真要做，門票是每顆任務一個 worktree、每個 worktree 一次環境初始化（依賴安裝、`.env` 複製）、以及一組不會互踩的測試資源。這是一整條新的工作目錄生命週期，而 `ade-dev` 目前的模型是「每個 Phase 一個乾淨 context 的 subagent，commit 疊在同一條任務分支上」——沒有 worktree 的位置。

### 2.4 併發加速的是非瓶頸

Faros AI 2026 的結論原文（完整引用見 §5.1）：「**a system moves only as fast as its slowest link**」。在 ade-dev-auto 的流程裡，各環節的時間量級是：

| 環節 | 量級 | 誰在做 |
|---|---|---|
| 單顆任務執行 | ≤ 60 分鐘（B4） | agent，可併發 |
| MR 送出 | 分鐘 | agent |
| 人 review + merge | 數小時到數天 | **人，不可併發** |

併發 2 只縮短第一列。而第三列不但是最慢的，還是唯一一個在 AI 加速下**變得更慢**的：Faros 測到 median time to first PR review 上升 156.6%、average time spent in code review 上升 199.6%（§5.1）。往一個正在變慢的環節更快地推更多東西，得到的是庫存，不是交付——而庫存的具體形態就是那 31.3% 沒被審查就 merge 的 PR。

---

## 3. 面向二：批次 wall-clock 總上限

### 3.1 所有一手的硬上限都是「單位」，不是「批次」

| 系統 | 上限 | 適用單位 | 來源 |
|---|---|---|---|
| GitHub Copilot coding agent | **59 分鐘** | 單一 session | [About coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) |
| GitHub Actions（hosted runner） | **6 小時** | 單一 job | [Actions limits](https://docs.github.com/en/actions/reference/limits) |
| GitHub Actions（self-hosted） | **5 天** | 單一 job | 同上 |
| GitHub Actions workflow run | **35 天**（含等待與審批時間） | 單次 run | 同上 |
| GitHub Actions 佇列（self-hosted） | **24 小時**後自動取消 | 單一 job 排隊 | 同上 |
| Argo Rollouts `progressDeadlineSeconds` | **600 秒**（預設） | 單次更新的「無進展」時間 | [Rollout Spec](https://argo-rollouts.readthedocs.io/en/stable/features/specification/) |

Actions 的 workflow run 上限（35 天）是唯一一個涵蓋「一串工作」的數字，但它大到只能防失控，對批次節奏沒有指導意義。**批次總上限查無任何權威建議值**，只能自己訂。

GitHub 對 59 分鐘上限給的配套建議，反而是我們最該抄的態度：

> "For complex tasks that may require more time, **consider breaking the work into smaller, more focused tasks.**"

### 3.2 唯一的一手「人類吸收上限」數字

來源：[Google SRE Book, ch.11 "Being On-Call"](https://sre.google/sre-book/being-on-call/)

> "dealing with the tasks involved in an on-call incident—root-cause analysis, remediation, and follow-up activities like writing a postmortem and fixing bugs—**takes 6 hours**"

> "**the maximum number of incidents per day is 2 per 12-hour on-call shift**"

同章的整體負載上限：

> SRE 至少 50% 的時間要留給工程專案，on-call 不超過 25%，其他營運工作不超過另外 25%。

**對我們的映射**：這不是 PR review 的數字，外推要小心（一次 incident 遠比一次 review 重）。可以成立的較弱推論只有一條：**一個人在一個班次裡能完整吸收的「需要全神貫注的事件」是個位數，而且遠低於直覺**。5 個 AI 產出的 MR 是不是一個「事件」的量級？Faros 的資料說單一 PR 的 review 時間在 AI 之後上升了 199.6%（§5.1），所以 5 個 MR 落在同一天並不比「兩個 incident」輕鬆。這支持批次總上限應該綁在**半個工作日**的量級，而不是「反正 5 顆各 60 分鐘也就 5 小時」。

### 3.3 超時之後要不要中止，是另一個旋鈕

來源：[Argo Rollouts, Rollout Spec](https://argo-rollouts.readthedocs.io/en/stable/features/specification/)

Argo 把兩件事拆開：

- `progressDeadlineSeconds`：「The maximum time in seconds in which a rollout must make progress during an update, before it is considered to be failed.」預設 600。
- `progressDeadlineAbort`：「whether to abort the update when ProgressDeadlineSeconds is exceeded.」

關鍵在預設值：**超時預設只是標記 degraded、浮出 `ProgressDeadlineExceeded` 條件，不中止。** 要中止得另外明確打開。

**對我們的映射**：這正是「軟停」的設計依據。批次超時是一個「該收工了」的訊號，不是一個「現在立刻停手」的緊急事件——中途砍掉一顆進行中的任務，留下半完成的工作樹與沒有交待的狀態，違反依據文件 §5.6 對「交還必附情境」的要求，代價比多跑 40 分鐘高。所以檢查點放在任務**開始前**（入場封閉），不放在執行中（中途中止）。

### 3.4 關於 4 小時這個數字的誠實標注

**沒有任何權威給出批次總上限的建議值。** 4 小時是工程判斷，三個錨點：

1. 它必須小於 5 顆 × 60 分鐘的隱含上限，否則不咬（隱含上限只在「任務準時」時成立，而它咬不到「任務比預期慢」——那正是最需要叫停的情況）。
2. 半個工作日讓批次落在同一個上午或下午，啟動批次的人還是回來 review 的人（§5.6 的 out-of-the-loop 緩解）。
3. 與 SRE 的「一個班次 2 個 incident」量級不衝突。

建議上線後記錄每個批次的實際 wall-clock 與人開始 review 的時間差，跑滿 20 個批次後回頭調——與依據文件 §7 對熔斷閾值 2/3 的處置相同。

---

## 4. 面向三：共因失敗的判定

### 4.1 CCF 在可靠度工程裡的正式定義

共因失敗（common cause failure, CCF）的定義是「a single failure event that affects multiple components or functions of a system」，其重要性在於它**抵銷冗餘帶來的改善**——這是 CCF 存在於可靠度模型裡的全部理由。

量化上，IEC 61508 採用 **beta-factor 模型**：λ_cc = β·λ，β 是「兩個以上元件因共同壓力同時失效」的比例。IEC 61508 Part 6 Annex D 用一份約 40 題的檢查表估算特定場域的 β 值，題目分成 physical design（separation/segregation、diversity/redundancy、complexity）、analysis、human/operator issues、environmental issues 幾類；標準給出的 β 值範圍是 **0.5% 到 10%**。（來源：[NTNU, Risk Assessment ch.15 Common Cause Failures](https://www.ntnu.edu/documents/624876/1277591044/ccf.pdf/f435f724-469d-4492-860a-66eca10e6bd2)；[Rausand & Lundteigen, SIS book ch.10](https://lundteig.folk.ntnu.no/Presentations/SIS-book/chapt10-1-CCFs-new.pdf)）

**對我們的映射**：兩點。(a) 定義本身就說明為什麼「環境類失敗」該用 `ERROR` 那條規則——共用環境是教科書級的 common stress，兩顆連續因環境停下，先驗上就是共因，不需要更多證據。(b) β 的估算靠**分隔與多樣性**的結構性問題，不靠事後比對失敗訊息——這支持我們用「失敗類別＋煞車條款」這種結構性欄位判定，而不是做訊息相似度。

⚠️ 外推限制：CCF 的量化框架是為硬體冗餘設計的，我們的 5 顆任務不是冗餘元件（它們不是同一功能的備份）。這裡取用的只有定性的分類邏輯，不是 β 的數學。

### 4.2 Envoy：按錯誤**來源**分櫃，不是按位置

來源：[Envoy, Outlier detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier)、[outlier_detection.proto](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/outlier_detection.proto)

Envoy 有一個專門的開關 `split_external_local_origin_errors`，決定要不要把**本地端產生的錯誤**與**上游回的錯誤**分開計數：

- `consecutive_gateway_failure`：上游連續回 502/503/504 就 eject，預設門檻 **5** 次。
- `consecutive_local_origin_failure`：只在 `split_external_local_origin_errors` 為 true 時啟用，只計本地端產生的問題——timeout、TCP reset、ICMP error 等。

打開分櫃後，兩類錯誤各有獨立的 eject 門檻，而不是全部倒進同一個計數器。

**對我們的映射**：這是「同因判定」最直接可抄的一手做法，而且它的分類軸是**錯誤的來源／性質**，不是錯誤發生的位置。舊規則的「同一關」是位置軸——Envoy 沒有任何一個計數器是按「請求走到哪一段」分的。

### 4.3 Argo 與 Google CAS：同一個不對稱的兩種說法

依據文件 §5.3 已完整記錄，此處只複述結論以說明改法的血緣：

- Argo Rollouts：`failureLimit` 預設 **0**（指標判定為失敗 → 零容忍）vs `consecutiveErrorLimit` 預設 **4**（指標量不到 → 容忍連續 4 次）。
- Google Canary Analysis Service：PASS／FAIL 之外有第三種 verdict **NONE**，「if underlying infrastructure was unavailable and CAS could not reach a verdict」。

`ade-dev` 的任務層煞車已經實作了這個不對稱（「測試紅了連續 3 次停」與「測試跑不起來另計連續 3 次停」是兩個分開的計數器）。批次層過去把兩類混在「停在同一關」這個單一維度裡，等於把上游已經分好的櫃子又倒回一起。

### 4.4 這個改法會誤判與漏判什麼（誠實標注）

改完之後仍然存在的兩個缺口：

- **仍會誤判**：兩顆任務因為完全獨立的原因，恰好命中同一條煞車條款（例如兩顆都真的規模超估 2 倍，但一顆是估算失誤、一顆是需求本身變大）。此時會誤停整批。代價是人手動接手剩下的任務，可接受——同依據文件 §1.3 的取捨。
- **仍會漏判**：同一個根因在不同類別爆（例如一份壞掉的依賴讓 A 的測試跑不起來 `ERROR`、讓 B 的測試紅 `FAIL`）。此時兩個計數器各記 1，都不觸發。兜底是「累計 3 顆失敗停整批」，代價是多跑一顆。

這兩個缺口都不值得再加規則。判準要能被人在停批時一句話解釋（「連續兩顆都是環境類失敗」），這是 Google CAS 的可解釋性要求；再細分下去解釋不了，人就會繞過它。

---

## 5. 面向四：人的 review 頻寬與背壓

### 5.1 Faros AI 2026：reviewer 跟不上時，防線直接消失

來源：[The AI Engineering Report 2026: The Acceleration Whiplash](https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways)（Faros AI）、[The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering)

樣本：「**Two years of telemetry. 22,000 developers. More than 4,000 teams.**」方法上使用 Spearman 秩相關評估各指標與 AI 使用度的關係，只報告 p < 0.05 的結果。

高 AI 採用的團隊：

| 指標 | 變化 |
|---|---|
| 完成的任務數 | **+21%** |
| merge 的 PR 數 | **+98%** |
| 平均 PR 大小 | **+154%** |
| PR review 時間 | **+91%** |
| Median time to first PR review | **+156.6%** |
| Average time spent in code review | **+199.6%** |
| **沒有任何審查（人或 agent）就 merge 的 PR** | **+31.3%** |

最關鍵的一句：

> "**Pull requests merged without any review, human or agentic, are up 31.3%.**"

報告對這條的解釋是**能力不足而非刻意放棄**——reviewer 跟不上湧入的 AI 產出量。整體結論：

> "a system moves only as fast as its slowest link"

⚠️ **來源性質標注**：這是廠商自研的遙測報告，不是同儕審查研究，樣本來自使用 Faros 平台的組織（有選擇偏誤），且相關不等於因果。但它是本研究找到唯一直接量測「AI 加速後有多少 PR 完全沒被審查」的資料，而這個變數正是 G8 是否失效的操作型定義。

第一方的交叉印證來自 DORA——[Balancing AI tensions](https://dora.dev/insights/balancing-ai-tensions/)：

> "Reviewing [another's] code is so much harder than writing it. **AI tools are increasing the rate at which people can churn out code that needs to be reviewed…**"

DORA 給的對策與我們的 B2 同構：把大改動壓成「reviewable, testable units」，**working in small batches 是「critical countermeasure」**。

### 5.2 DORA：WIP limit 該怎麼設

來源：[DORA capability: Work in process limits](https://dora.dev/capabilities/wip-limits/)

設定方式：

> "**Don't allow more WIP in any given part of the process than you have people to work on tasks.**"

範例是四對開發者 → development 欄最多四張卡。

有效性的限定條件（這條同樣重要）：

> "WIP limits help drive improvements in software delivery performance, **particularly when they are combined with** [the use of visual displays] and [feedback loops from monitoring]."

即 WIP limit 單獨不是萬靈丹，要搭配「看得見」與「回饋」。

**對我們的映射**：兩點直接可用。(a) 上限要綁人的處理能力，而不是憑空的數字——所以未 merge 的 MR 應該**佔用同一個 5 的額度**，而不是另設一個積壓閾值。(b) 「看得見」對應 skill 已有的 `.ade-dev/auto-run.md` 與批次結束總結；扣減額度時要明說「本批只能開 2 顆，因為還有 3 個 MR 沒 merge」，否則人不知道系統為什麼變慢。

### 5.3 GitHub merge queue：成熟佇列系統的節流長什麼樣

來源：[Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)

三個旋鈕：

- **Build concurrency**：「The maximum number of `merge_group` webhooks to dispatch (between `1` and `100`)」——同時可以有幾組 CI 在跑。
- **一次 merge 幾個**：「Select the minimum and maximum number of pull requests to merge into the base branch at the same time (between `1` and `100`)」，外加「a timeout after which the queue should stop waiting for more entries and merge with fewer than the minimum number」。
- **只 merge 沒失敗的 PR**：開啟時「All pull requests must satisfy required checks to be merged」。

失敗處理：「When the GitHub API receives a failing status for `main/pr-1`, the merge queue automatically removes pull request #1 from the merge queue」，然後用排除該 PR 的內容重建暫時分支。

**對我們的映射**：兩點。(a) 節流是**入場端的一個整數**，沒有「下游積壓到 N 就暫停」這種回饋迴路——佇列長度本身就是訊號。這支持 §1.3 的「不做新機制」。(b) 失敗的處理是**把那一顆移出佇列、其餘照跑**，這正是我們的 B3（單顆失敗降回手動、批次繼續）；merge queue 沒有因為一顆失敗就停整個佇列，它只在更高層（人）介入時才停——我們比它保守，是因為我們的樣本量小到無法靠比率判斷（依據文件 §5.2）。

### 5.4 為什麼不做批次中的積壓監控

三條，任一條都足夠：

1. **抓不到新東西**：批次執行期間人不在，未 merge 的 MR 只會增加不會減少。批次中途的積壓 = 入場時的積壓 + 本批已交付數，而本批已交付數已經被 B2 的 5 顆上限管住了。
2. **要新增輪詢**：中途檢查意味著每顆任務之間去查一次遠端 MR 狀態，多一個網路依賴、多一類 `ERROR` 失敗來源，而它保護的東西是 (1) 說的空集合。
3. **與軟停重複**：真正需要中途叫停的情況（跑太久、共因失敗）已經由 B4 的總上限與熔斷覆蓋。

---

## 6. 明確標出查無實證的說法

| 說法 | 實際狀況 |
|---|---|
| 「批次自動化的併發度該設 N」有標準答案 | **沒有**。找到的一手指引只有 Google SRE Workbook 的「一次一個 canary」（定性），以及 GitHub merge queue 的 build concurrency（1–100，無建議值） |
| 「批次總 wall-clock 上限該是 N 小時」有依據 | **查無任何權威建議值**。所有一手上限都是單位級（Copilot 59 分、Actions job 6 小時、Argo 600 秒）。本文的 4 小時是工程判斷，錨點見 §3.4 |
| Google SRE 的「2 incidents per 12-hour shift」可直接推到 PR review | **不能直接推**。一次 incident 遠重於一次 review，這裡只取「人一個班次能吸收的高專注事件是個位數」這個定性推論 |
| Faros 的 31.3% 是同儕審查研究 | **不是**。廠商自研遙測報告，樣本為使用該平台的組織，有選擇偏誤；相關不等於因果。但它是唯一直接量到「無審查 merge 比例」的資料 |
| DORA 2025 有公布 PR 大小／review 時間的百分比 | **沒有**。§5.1 表格中的百分比全部出自 Faros，不是 DORA。DORA 2025 刻意改用標準化 beta 權重、不公布百分比（見依據文件 §6） |
| CCF 的 beta-factor 可以拿來算我們的批次共因機率 | **不能**。β 的數學是為硬體冗餘元件設計的，我們的 5 顆任務不是同一功能的冗餘備份。本文只取其定性分類邏輯 |
| 「同一關失敗」是業界的共因判定法 | **查無任何實作這樣做**。Envoy 按錯誤來源分櫃、Argo 按判定性質分櫃，都不是按位置 |
| 「未 merge PR 積壓 ≥ N 就該暫停」有先例 | **查無**。GitHub merge queue 沒有這種回饋迴路；Kanban 的 WIP limit 是入場端上限，不是下游積壓觸發的暫停 |

---

## 7. 未解問題（留給實作後回頭補）

1. **4 小時沒有實證。** 建議記錄每個批次的實際 wall-clock、以及「批次結束」到「人開始 review 第一個 MR」的時間差。若時間差普遍超過一天，說明 4 小時綁的「同一個工作時段」假設不成立，該改綁別的東西（例如直接綁「上一批的 MR 全部 merge 完才能開下一批」）。
2. **B2 的 5 從來沒被驗證過。** 它來自 `research-autopilot-readiness.md` §2.8 的 93% 橡皮圖章效應推論，加上本文 §5.1 的 31.3%——兩者都指向同一方向，但都沒告訴我們臨界點在 3 還是 8。建議記錄每批的 MR 從送出到 merge 的時間，以及有沒有出現「連續多個 MR 在幾分鐘內被 merge」的橡皮圖章跡象。
3. **失敗類別的分類品質沒有把關。** 新的熔斷規則完全信任 `ade-dev` 停下時自報的 `FAIL`／`ERROR`。若 agent 把環境問題誤報成產出問題，`ERROR` 那條規則就失效。目前沒有機械方法交叉驗證，建議在批次總結裡把每顆的類別與煞車條款列出來，讓人在事後能發現系統性的誤分類。
4. **併發被刪掉，但沒有量過它值多少。** 本文的論證是「加速非瓶頸無效」，這在 review 頻寬確實是瓶頸的前提下成立。若日後 review 端本身被自動化（例如 MR 由另一個 agent 先審一輪），瓶頸位置會移動，這個結論要重新檢視。
