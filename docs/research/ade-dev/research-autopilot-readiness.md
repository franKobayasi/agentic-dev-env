# Auto-pilot 就緒條件：研究報告

> **文件性質**：研究參考，不是流程規則。這裡整理的是「一個開發任務要滿足什麼條件，才適合交給 agent 全自主跑完」的證據盤點；真正上線的判準請寫進 auto-pilot 的 skill，並回頭標注採用了本文哪一組條件。
>
> 研究日期 2026-08-16。含時效性數字（LLM 能力相關）者已於文中標注。
> 相關文件：[research-phase-sizing.md](./research-phase-sizing.md)（Phase 大小閾值，本文的 §1 G5 直接沿用其結論）

---

## 1. 結論先行

### 設計取向

三個從證據裡浮出來、直接決定方案形狀的事實：

1. **規格完整度是已測到最大的單一槓桿，不是模型能力。** SWE-Bench Pro 的對照實驗中，同一批任務、同一個模型，只拿掉「requirements + interface」，GPT-5 從 25.9% 掉到 8.40%（§4.2）。所有實務指引（GitHub、OpenAI、Anthropic）的「不要指派」清單第一項都是 ambiguous。
2. **「人在中途簽核」這件事本身的安全價值，實證上接近零；真正有效的是 peer review 和可執行的驗證。** DORA 2014 原文：外部審批「had a big negative impact on throughput, with negligible impact on stability」（§3.1）。而 Microsoft 的 code review 研究顯示，review 意見中只有 14% 是 defect、0.9% 是 security（§3.4）——人審不是強防線。
3. **所以 auto-pilot 的安全來源必須換成「機器可判定的驗收」，不是換成「更多人看」。** Claude Code 官方文件的原話：「If you can't verify it, don't ship it.」（§2.2）

方案因此不是「打分數加總」，而是**全部 pass 才跑的硬清單**——理由同 phase-sizing 研究：算得出來的判準才會被執行。

---

### 1.1 任務層就緒條件（全部通過才自動跑）

| # | 條件 | 機械檢查方式 | 依據與強度 |
|---|---|---|---|
| **G1** | 需求來自**已確認**的 PRD，且 spec 有對應段落 | PRD 狀態欄 = 已確認；spec 存在指向此任務的 🚧 區塊 | **慣例（強）**：GitHub 明列「Tasks lacking clear definition」不要指派；OpenAI 建議 prompt 含 goal/context/constraints/completion criteria |
| **G2** | 驗收條件**已寫成可判定形式**，且指名受影響檔案／介面 | 每條 AC 是 Given/When/Then；任務描述含 ≥1 個具體檔案路徑或介面名 | **實證（中強）**：SWE-Bench Pro 規格完整度 ablation 約 3 倍差距；Agentless 實測「最難的問題是描述中不含任何位置線索的」 |
| **G3** | 有**可執行的驗證指令**，且動工前基準是綠的 | `test_cmd` 存在、退出碼 0、單次耗時 < 10 分鐘 | **實證（強）**：Agentless 加入生成的重現測試作為過濾，27.0% → 32.0%；SWT-Bench「doubling the precision of SWE-Agent」；GitHub 明說 agent 能在自己環境 build/test/validate 時「more likely to produce mergeable pull requests」 |
| **G4** | 驗收**由測試表達**，不是由文字表達 | 每條 AC 對應一個具名測試（可以是待寫的，但名字要在規格關就定好） | **實證（中）**：Agentless 只能為 ~31% 的任務合成出正確的重現測試，瓶頸就是描述品質——所以測試要人在規格關定，不能指望 agent 自己想 |
| **G5** | 規劃出的每個 Phase 在大小閾值內 | 沿用 [research-phase-sizing.md](./research-phase-sizing.md)：預估 > 400 行 或 > 10 檔 → 必拆。**auto-pilot 額外加嚴**：單一 Phase 觸及 > 3 個檔案要在計畫中寫明理由 | **實證（強／中強）**：400 行來自 Cisco 研究；> 3 檔的加嚴來自 SWE-Bench Pro「the performance gap between frontier and smaller models widens dramatically beyond 3 files」與 Multi-SWE-bench 的跨檔衰減曲線 |
| **G6** | Repo 規模在校準範圍內 | 目標 repo 檔案數與 LOC。**> 800 檔或 > 300K LOC 時，G5 的閾值折半** | **實證（中，單一來源）**：FeatBench 分箱實測——< 200 檔／< 50K LOC 時 resolve rate 60–70%，> 800 檔／> 300K LOC 時全模型收斂到 10–30% |
| **G7** | 不命中風險黑名單 | 規劃階段預期改動路徑 ∩ blocklist = ∅（建議清單：認證授權、金流、DB migration、CI/CD 設定、密鑰與環境變數、對外 API 契約）；PRD 未標記 production-critical / 涉及 PII | **慣例（強）**：GitHub 的 do-not-assign 清單「Production-critical issues / Tasks involving security, personally identifiable information, authentication repercussions / Incident response」；OpenAI「Actions that are sensitive, irreversible, or have high stakes should trigger human oversight」 |
| **G8** | 交付通道受限 | 只能開 PR、不得 push 主幹、CI 必跑、人 merge | **實證（強）**：DORA——peer review 型審批提升績效，外部審批不提升穩定性；Google 內部大規模遷移論文中即使 80% 程式碼由 AI 產出，仍每個 CL 人審後才 land |

**不列入的兩個常見候選，以及原因**：

- **「Open questions = 0」不單獨當條件**，理由見 §1.4 對候選條件二的評語——它是 G2 的必要但不充分條件，且 0 這個數字可以靠不提問直接刷出來。改用 G2 的正面產出物（AC 的形式）當判準。
- **「repo 熟悉度」不當 gate**，因為量不到。改用 G6 的 repo 規模當代理指標，且作用是**校準閾值**而不是否決任務——證據顯示大 repo 的傷害可以靠更小的步驟拿回來（§5.4）。

---

### 1.2 批次層就緒條件

| # | 條件 | 機械檢查方式 | 依據與強度 |
|---|---|---|---|
| **B1** | 批次內任務的預期改動檔案**互不相交** | 規劃階段的檔案清單兩兩取交集 = ∅ | **慣例（強）**：AWS bulkhead／cell-based——「If a workload uses 10 cells to service 100 requests, when a failure occurs in one cell, 90% of the overall requests would be unaffected」 |
| **B2** | 單次批次任務數 ≤ **5**，併發 ≤ **2** | 計數 | **推論 + 慣例**。1/N 論證來自 AWS；上限要壓在「人還審得完」的量——Anthropic 實測 permission prompt 通過率 93%，且「The more approvals a user sees, the less attention they pay to each」。一次丟 20 個 PR 給人 merge，等於 G8 的安全網自動失效 |
| **B3** | 每個任務都獨立通過 §1.1 全部條件 | 逐一評估，不合格者直接標記為手動、不影響其他任務 | **推論**。局部失敗不擴散是 §6 的核心設計原則 |
| **B4** | 批次有 wall-clock 總上限 | 建議單一任務 ≤ 60 分鐘 | **慣例（中）**：GitHub Copilot coding agent 的硬上限就是「maximum execution time of 59 minutes」，並建議「consider breaking the work into smaller, more focused tasks」 |

---

### 1.3 煞車與熔斷條件

設計上借用 Argo Rollouts 最值得抄的一個不對稱：**「它是壞的」與「我判斷不出來」要用完全不同的閾值**（`failureLimit: 0` vs `consecutiveErrorLimit: 4`，§6.2）。

#### A. 立即停（limit = 0，第一次命中就降回手動）

| 觸發 | 為什麼是零容忍 |
|---|---|
| 要改動產品行為，但 spec 無依據 | 這是規格問題不是實作問題，重試零幫助 |
| diff 觸及 G7 黑名單路徑（規劃時沒預期到、實作時才碰到） | GitHub／OpenAI 的 sensitive-action 清單 |
| **agent 修改既有測試的斷言以讓它變綠** | 最重要的一條。SWE-bench 的「weak test cases」問題（31.08% 的通過 patch 是測試太弱造成）證明測試一旦可被改，整個驗證體系歸零 |
| 審查 finding 標為 blocking 且未解 | 題目已定 |
| 實際規模超過 G5 閾值 2 倍 | 規劃錯了，繼續跑只是把錯誤放大 |

#### B. 有限重試後停（連續 3 次）

| 觸發 | 閾值 | 說明 |
|---|---|---|
| 測試轉不綠 | **連續 3 次修正嘗試** | 3 是工程判斷，見下方誠實標注 |
| 環境／工具本身失敗（test runner 掛、網路、依賴裝不起來） | **連續 3 次** | 對應 Argo 的 `consecutiveErrorLimit`：這是「判斷不出來」不是「壞的」 |
| context compaction 次數 | **> 1 次記錄、> 2 次停** | 沿用 phase-sizing 研究；另有 SambaNova 實測「successful agentic trajectories typically remain under 20k-30k tokens」與 Anthropic 觀察到的 context anxiety |

#### C. 批次級熔斷

| 觸發 | 動作 |
|---|---|
| **同一原因**連續 2 個任務失敗 | 停整批。共因失敗代表環境或判準本身壞了，繼續跑只是量產垃圾 PR |
| 累計 3 個任意任務失敗 | 停整批 |
| 單一任務失敗且原因獨立 | **只降該任務回手動，批次繼續** |

#### 關於這些數字的誠實標注

**沒有任何權威給出「連續 N 次失敗該熔斷」的規範數字。** Martin Fowler 文章裡的 `@failure_threshold = 5` 是範例程式碼，不是建議值；Microsoft、Nygard 都明說要依情境調（§6.1）。實作預設值的分布也極散：Hystrix 是 10 秒窗內 ≥20 次呼叫且錯誤率 ≥50%、Resilience4j 是 ≥100 次呼叫且 ≥50%、Polly 是 30 秒窗內 ≥100 次且 ≥10%。

更麻煩的是，**所有成熟實作都堅持「不要在低樣本量下跳閘」**，Hystrix 文件寫得最直白：

> "For example, if the value is 20, then if only 19 requests are received in the rolling window (say a window of 10 seconds) the circuit will not trip open even if all 19 failed."

我們的批次量只有 5，遠低於任何一個 minimum volume 門檻。這意味著：**我們是在成熟實作明確警告不要用的樣本量下，用純連續計數當熔斷器。** 這個取捨是刻意的——因為在批次量 5 的情況下算比率沒有意義，而「不熔斷」的代價（讓壞掉的環境量產 5 個垃圾 PR）遠高於「誤熔斷」的代價（人手動接手 3 個任務）。所以閾值刻意訂得**比工業預設保守**（2 / 3，而不是 5 / 20）。

Google SRE Book 的 Diskerase 事故給了同方向的教訓——事後補救是 **rate limiting 與 idempotency**，不是更好的偵測：

> "the empty set was used as a special value, interpreted to mean 'everything.' This means the automation sent almost all the machines we have in all colos to Diskerase. […] Within minutes, the highly efficient Diskerase wiped the disks on all machines in our CDN"

---

### 1.4 對既有四個候選條件的逐條評語

#### 候選一：需求來自已被人確認過的 PRD ✅ **支持，強化為兩條**

實證支撐比預期強。SWE-Bench Pro 的 ablation 是同任務同模型只換規格的乾淨對照：

| 模型 | Problem Statement + Requirements + Interface | Problem Statement Only |
|---|---|---|
| GPT-5 (high) | **25.9%** | **8.40%** |
| Claude Opus 4.1 | **22.7%** | **8.20%** |

OpenAI 建 SWE-bench Verified 時，93 名工程師標註 1,699 筆樣本，發現 **38.3% 的原始樣本問題描述 underspecified**。三家實務指引的「不要指派」清單第一項都是 ambiguous。

**修改建議**：拆成 G1（PRD 已確認，人為狀態）與 G2（AC 已寫成可判定形式，內容檢查）。理由是「PRD 被確認過」只證明有人看過，不證明規格對 agent 夠用——GitHub 要的三件事是「clear description of the problem」「Complete acceptance criteria」「Directions about which files need to be changed」，第三項是原候選完全沒涵蓋的，而 Agentless 的實測顯示位置資訊是最強的單一預測因子：

> "the highest solve rates are on problems where the location is provided in natural language followed by stack traces. **The most difficult problems are those that do not contain any clues about the location of the issue in the description.**"

#### 候選二：規格關 open questions = 0 ⚠️ **方向對，但這個指標不可靠，建議改寫**

三個問題：

1. **完全查無實證。** 沒有任何研究把「未決問題數」當預測因子。更廣地說，整個 requirements quality 研究領域的實證都很弱——Frattini 等人的 harmonized theory 論文直說：「requirements quality research focuses on normative rules and **mostly fails to connect requirements quality to its impact on subsequent software development activities**, impeding the relevance of the research.」Agile 的 Definition of Ready 同樣查無實證支撐。
2. **可被無成本地刷出來。** 不提問就是 0。這是所有「以缺席為判準」的指標的通病，判準應該對正面產出物生效。
3. **描述長度反而不是預測因子。** Multi-SWE-bench 實測「there is no consistent relationship between issue description length and resolved rate」——問得多不等於問得對。

**修改建議**：保留「open questions = 0」當**前置條件**（有未決問題當然不能跑），但**不當充分條件**。真正的 gate 換成 G2 的正面檢查：每條 AC 是 Given/When/Then，且任務描述含具體檔案路徑或介面名。這兩件事都能機械檢查，而且刷不出來——寫不出檔案路徑就是真的不知道要改哪裡。

#### 候選三：每個 Phase 在大小閾值內 ✅ **支持，且應在 auto-pilot 加嚴**

原有的 > 400 行 / > 10 檔沿用。新增的實證讓「檔案數」這一維度比原本更重要：

- SWE-Bench Pro：「Models maintain relatively stable performance for single-file problems but exhibit sharp declines as file count increases. Notably, **the performance gap between frontier and smaller models widens dramatically beyond 3 files**」
- Multi-SWE-bench：「resolved rate drops significantly as the number of modified files increases across all three methods」；且「the resolved rate for very long fix patches (>1000 tokens) drops significantly, **even reaching zero for Java**」
- SWE-bench 原始論文的中位數任務規模：**單一檔案、單一函式、約 15 行**——benchmark 上的高分是在這個尺度上取得的

**修改建議**：auto-pilot 模式下，> 3 檔要求計畫中寫明理由（軟觸發），> 10 檔維持必拆（硬觸發）。另加 G6：大 repo 時閾值折半，依據 FeatBench 的分箱結果。

#### 候選四：途中煞車三條 ✅ **支持，但缺三條關鍵的，且需要區分兩種失敗**

原有三條（審查 finding 未解、測試無法轉綠、要動產品行為無依據）方向都對。缺的是：

1. **「agent 修改既有測試斷言」必須零容忍。** 這是原清單最大的漏洞。SWE-Bench+ 的分析發現 SWE-bench 上 **31.08% 的「通過」patch 是靠測試太弱矇過**；另有研究發現 7.8% 的 patch 在計為正確的同時實際上沒通過開發者寫的測試。若測試可被 agent 改，G3/G4 建立的整個驗證體系直接歸零。
2. **wall-clock / 步數上限。** Answer.AI 的 Devin 實測給出最鮮明的教訓：「The autonomous nature that seemed promising became a liability - **Devin would spend days pursuing impossible solutions rather than recognizing fundamental blockers.**」他們 20 個任務 3 成功 14 失敗，而且「we couldn't discern any pattern to predict which tasks would work」。GitHub 的處理方式是硬性 59 分鐘上限。
3. **context 用量煞車。** > 2 次 compaction 停。

另外，「測試無法轉綠」需要拆成兩種：**測試紅了**（產出是壞的，重試有意義，容忍 3 次）與 **測試跑不起來**（環境問題，判斷不出來，另計 3 次）。這是 Argo Rollouts 的 `failureLimit: 0` / `consecutiveErrorLimit: 4` 不對稱，也是 Google CAS 除了 PASS/FAIL 之外還有第三種 verdict `NONE` 的理由。兩者混在同一個計數器裡，會讓環境問題吃掉真失敗的重試額度。

---

## 2. 面向一：自主 coding agent 的實務 guardrails

### 2.1 Anthropic：long-running agent 的失效模式表

來源：[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)（Anthropic Engineering）

這份文件最有價值的是它把失效模式**明確列成表**，而且每一條都有對應的機械解法：

| 失效模式（原文） | 對應解法（原文） |
|---|---|
| "Claude declares victory on the entire project too early." | 初始化 agent 建立結構化的 feature list JSON；coding agent「Read the feature list file at the beginning of a session. Choose a single feature to start working on.」 |
| "Claude leaves the environment in a state with bugs or undocumented progress." | 「Start the session by reading the progress notes file and git commit logs, and run a basic test on the development server to catch any undocumented bugs. End the session by writing a git commit and progress update.」 |
| "Claude marks features as done prematurely." | 「Self-verify all features. **Only mark features as 'passing' after careful testing.**」 |
| "Claude has to spend time figuring out how to run the app." | 「Write an `init.sh` script that can run the development server.」 |

核心結論原文：

> "Given this initial environment scaffolding, the next iteration of the coding agent was then asked to **work on only one feature at a time**. This incremental approach turned out to be critical to addressing the agent's tendency to do too much at once."

> "One final major failure mode that we observed was Claude's tendency to mark a feature as complete without proper testing."

**對我們的映射**：三個失效模式（過早宣告完成、標記完成但沒測、環境狀態不明）分別對應我們的 G4（驗收由測試表達）、B 類煞車、以及「每 Phase 收尾必 commit」。

### 2.2 Anthropic：Claude Code 官方最佳實踐——「給它一個能跑的檢查」

來源：[Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)

這份文件把整個章節命名為 **"Give Claude a way to verify its work"**，是本研究中對 auto-pilot 最直接相關的一段官方陳述：

> "Claude stops when the work looks done. **Without a check it can run, 'looks done' is the only signal available, and you become the verification loop**: every mistake waits for you to notice it. Give Claude something that produces a pass or fail, and the loop closes on its own."

> "The check is anything that returns a signal Claude can read in the conversation: a test suite, a build exit code, a linter, a script that diffs output against a fixture, or a browser screenshot compared against a design."

關於無人值守時的差別（這句話幾乎是在描述 auto-pilot 模式）：

> "Each step trades setup for attention. The prompt version works on any task today. **The `/goal` and Stop hook versions are what let an unattended run finish correctly without you.**"

在「常見失效模式」清單裡有一條就是我們的 G3：

> "**The trust-then-verify gap.** Claude produces a plausible-looking implementation that doesn't handle edge cases.
> **Fix**: Always provide verification (tests, scripts, screenshots). **If you can't verify it, don't ship it.**"

另外兩段直接支持我們的規格關與審查關設計：

> "The most useful specs are self-contained: **they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works.** Time spent making the spec precise pays off more than time spent watching the implementation."

> "The longer Claude works unattended, the more an independent check matters before you count the work as done. A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, **not the reasoning that produced the change**, so it evaluates the result on its own terms."

還有一句對「審查 finding 未解就停」的反向警告，值得寫進判準以免誤煞車：

> "A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering… **Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional.**"

→ 這意味著「審查 finding 未解就停」必須限定在 **blocking finding**（影響正確性或違反 stated requirements），不能對所有 finding 生效，否則 auto-pilot 永遠停在第四關。

### 2.3 Anthropic：Building Effective Agents

來源：[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)（2024-12-19）

> "Agents can be used for open-ended problems where it's difficult or impossible to predict the required number of steps, and where you can't hardcode a fixed path."

> "it's also common to include **stopping conditions (such as a maximum number of iterations)** to maintain control."

> "During execution, it's crucial for the agents to gain **'ground truth' from the environment at each step** (such as tool call results or code execution) to assess its progress."

> "Agents' autonomy makes them ideal for scaling tasks in **trusted environments**. The autonomous nature of agents means higher costs, and **the potential for compounding errors**."

> "We recommend extensive testing in sandboxed environments, along with the appropriate guardrails."

### 2.4 Anthropic：三 agent 架構與 sprint 拆解

來源：[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)

- 架構：planner（把 1–4 句話展開成完整 spec）→ generator（「work in sprints, picking up one feature at a time from the spec」）→ evaluator（用 Playwright MCP 像使用者一樣點過去驗）
- Agent 間溝通全部走檔案：「Communication was handled via files: one agent would write a file, another agent would read it and respond either within that file or with a new file.」
- 判定方式：「Each criterion had a hard threshold, and **if any one fell below it, the sprint failed** and the generator got detailed feedback on what went wrong.」
- 失效模式：自評不可信——「agents tend to respond by **confidently praising the work**—even when, to a human observer, the quality is obviously mediocre」；以及 context 快滿時的 **"context anxiety"**（過早宣告完成）

**對我們的映射**：三點直接可用——(a) 狀態走檔案而非 context，這和 process/README.md 的「狀態外部化」原則一致；(b) 硬閾值任一不過即整體失敗（我們的 A 類立即停）；(c) 自評不可信 → 審視關必須由**不同 context 的 agent** 執行，不能讓寫的人自己打分。

### 2.5 GitHub：官方的「不要指派」清單

來源：[Best practices for using Copilot to work on tasks](https://docs.github.com/en/copilot/how-tos/agents/copilot-coding-agent/best-practices-for-using-copilot-to-work-on-tasks)

**適合指派的任務長什麼樣（原文）**：

> "An ideal task includes: A clear description of the problem to be solved or the work required. **Complete acceptance criteria on what a good solution looks like** (for example, should there be unit tests?). **Directions about which files need to be changed.**"

**不要指派的三類（原文，完整清單）**：

> **Complex and broadly scoped tasks** — "Broad-scoped, context-rich refactoring problems requiring cross-repository knowledge and testing; Complex issues requiring understanding dependencies and legacy code; Tasks that require deep domain knowledge; Tasks that involve substantial business logic; Large changes to a codebase requiring design consistency"

> **Sensitive and critical tasks** — "Production-critical issues; Tasks involving security, personally identifiable information, authentication repercussions; Incident response"

> **Ambiguous tasks** — "Tasks lacking clear definition: tasks with ambiguous requirements, open-ended tasks, tasks that require working through uncertainty to find a solution"

**環境與驗證**：agent 能在自己的開發環境 build/test/validate 時「more likely to produce mergeable pull requests」。

**硬限制**（[About coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)）：

> "Copilot cannot make changes across multiple repositories in one run."
> "Each Copilot cloud agent session has a **maximum execution time of 59 minutes**… For complex tasks that may require more time, **consider breaking the work into smaller, more focused tasks**."

2025 年 5 月發布時的定位陳述（現行文件已無此句，但當時是官方的能力邊界宣告）：

> "the agent excels at **low-to-medium complexity tasks in well-tested codebases**, from adding features and fixing bugs to extending tests, refactoring code, and improving documentation."

### 2.6 OpenAI：escalation 的兩個觸發

來源：[A Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)（2025），p.31

> **"Plan for human intervention"** — "Implementing a human intervention mechanism allows the agent to gracefully transfer control when it can't complete a task. […] For a coding agent, this means handing control back to the user."
> "Two primary triggers typically warrant human intervention:"
> **"Exceeding failure thresholds:** Set limits on agent retries or actions. If the agent exceeds these limits… escalate to human intervention."
> **"High-risk actions:** Actions that are sensitive, irreversible, or have high stakes should trigger human oversight until confidence in the agent's reliability grows."

p.26 的工具風險分級也可直接搬給 G7：

> "Assess the risk of each tool available to your agent by assigning a rating—low, medium, or high—**based on factors like read-only vs. write access, reversibility, required account permissions, and financial impact.**"

⚠️ OpenAI 沒有給任何數字（只說 "set limits"、"multiple attempts"）。Codex 官方文件（[Best practices](https://learn.chatgpt.com/guides/best-practices)）同樣沒有「什麼任務不要交」的清單，只有正面建議「create tests when needed, run the relevant checks, confirm the result, and review the work before you accept it」，四要素 prompt 結構「goal, context, constraints, and completion criteria」可拿來當 G2 的檢查表。**Codex 這一支對我們的參考價值低於 GitHub 與 Anthropic。**

### 2.7 Devin 獨立實測：最有價值的負面證據

來源：[Thoughts On A Month With Devin](https://www.answer.ai/posts/2025-01-08-devin.html)（Answer.AI；Hamel Husain、Isaac Flath、Johno Whitaker，2025-01-08）

> "The results were sobering. **Out of 20 tasks, we had 14 failures, 3 successes, and 3 inconclusive results.** Even more telling was that **we couldn't discern any pattern to predict which tasks would work.** Tasks that seemed similar to our early successes would fail in unexpected ways."

> "The autonomous nature that seemed promising became a liability - **Devin would spend days pursuing impossible solutions rather than recognizing fundamental blockers.**"

> "In contrast to Devin, we found workflows where developers drive more (like Cursor) avoid most issues we faced with Devin."

Johno Whitaker 的總結是對 auto-pilot 最尖銳的質疑，值得原文保留：

> "Tasks it can do are those that are so small and well-defined that I may as well do them myself, faster, my way. Larger tasks where I might see time savings I think it will likely fail at. So no real niche where I'll want to use it."

**如何看待這個反證**：這是 2025 年 1 月、單一產品、20 個任務的樣本，模型能力與 harness 都已迭代多輪，**不能直接外推到 2026 年的 auto-pilot**。但兩個結論是結構性的、與模型代際無關：(a) 自主 agent 會在死路上耗到底而不會自己承認卡住 → 支持 wall-clock 上限；(b) 「事前分不出哪個任務會成功」→ 這正是我們要建 readiness criteria 的理由，也提醒判準要**保守**：分不出來時預設走手動。

### 2.8 反直覺的一條：加關卡可能反而降低安全

來源：[How we contain Claude](https://www.anthropic.com/engineering/how-we-contain-claude)（Anthropic，2026-05-25）

> "Our telemetry showed users approved roughly **93%** of permission prompts."
> "**The more approvals a user sees, the less attention they pay to each, becoming over time much less diligent in their supervision.**"

Google SRE Book 從完全不同方向講同一件事：

> "it makes no sense to effectively require a human to intermittently press a button called 'Allow system to continue to run.' (Yes, it is true that sometimes automatic procedures can end up making a bad situation worse, but that is why such procedures **should be scoped over well-defined domains**.)"

**對我們的意義**：兩條合起來，答案是**收窄範圍（G7 黑名單、B1 檔案不相交、B2 批次上限）優於增加確認點**。而且這直接約束 B2——批次太大會讓 G8 的「人 merge」退化成 93% 那種橡皮圖章，安全網名存實亡。

---

## 3. 面向二：人工審批有效性的實證

### 3.1 DORA 的原始發現（2014，最乾淨的一手引用）

來源：[2014 State of DevOps Report](https://dora.dev/research/2014/2014-state-of-devops-report.pdf)，p.17，"Top 5 Predictors of IT Performance" 第 1 項：

> "**Peer-reviewed change approval process.** We found that when external approval (e.g., change approval boards) was required in order to deploy to production, IT performance decreased. But when the technical team held itself accountable for the quality of its code through peer review, performance increased. Surprisingly, **the use of external change approval processes had no impact on restore times, and had only a negligible effect on reducing failed changes.** In other words, external change approval boards had a big negative impact on throughput, with negligible impact on stability."

### 3.2 DORA 2019：量化與機制

來源：[Accelerate State of DevOps 2019](https://dora.dev/research/2019/dora-report/2019-dora-accelerate-state-of-devops-report.pdf)

p.50，量化：

> "We found that formal change management processes that require the approval of an external body such as a change advisory board (CAB) or a senior manager for significant changes have a negative impact on software delivery performance. **Survey respondents were 2.6 times more likely to be low performers if their organization had this kind of formal approval process in place.**"

p.50，null result：

> "we investigated whether a more formal approval process was associated with lower change fail rates and **we found no evidence to support this hypothesis**, consistent with earlier research."

p.50–51，**機制**——這段是本研究最重要的因果鏈條，因為它解釋了「為什麼加審批反而更不穩定」：

> "We also examined whether introducing more approvals results in **a slower process and the release of larger batches less frequently**, with an accompanying higher impact on the production system that is likely to be associated with higher levels of risk and thus higher change fail rates. **Our hypothesis was supported in the data.**"

p.51，建議：

> "Organizations often respond to problems with software releases by introducing additional process and more heavyweight approvals. **Analysis suggests this approach will make things worse.** We recommend that organizations move away from external change approval… Instead, organizations should 'shift left' to **peer review-based approval** during the development process. In addition to peer review, **automation can be leveraged to detect, prevent, and correct bad changes much earlier** in the delivery lifecycle."

p.49，DORA 自己認可的替代方案（正是我們的 G8）：

> "One approach is to require every change be approved by someone else on the team as part of code review, either prior to commit to version control (as part of pair programming) or prior to merge into master."

亦見 [dora.dev capability: Streamlining change approval](https://dora.dev/capabilities/streamlining-change-approval/)：

> "**Reliance on a centralized Change Approval Board (CAB)** to catch errors and approve changes. This approach can introduce delay and often error. CABs are good at broadcasting change, but **people that far removed from the change might not understand the implications of those changes.**"

### 3.3 對「拿掉中途簽核損失多少安全」的直接回答

**回答：從 DORA 的框架看，損失可能是零甚至負的——但這個結論需要一個關鍵限定，不能照搬。**

DORA 反對的是**外部人蓋章**（CAB、senior manager），主張的是**團隊內 peer review + 自動化檢查**。我們正常模式下的規格關／規劃關簽核，是**團隊內**的、由 PO 或 RD 執行的，性質上比 CAB 接近 peer review。所以「DORA 說審批沒用」不能直接推導成「我們的兩關沒用」——這是本報告最需要標明的外推風險。

可以成立的較弱推論有兩條：

1. **簽核的價值來自「有人真的看懂了改動」，不是來自「有人按了核准」。** 由 §3.4 的 code review 實證支撐。所以如果規格關的簽核只是 PO 掃一眼點頭，它的安全價值本來就接近 CAB。
2. **關卡本身有成本，而且成本會反噬穩定性。** DORA 2019 測到的機制是：審批 → 變慢 → 批次變大 → 變更失敗率上升。這意味著在 auto-pilot 設計裡，**把兩個關卡換成「自動判準 + 更小批次」是 DORA 明確推薦的方向**（"shift left" + "automation can be leveraged to detect, prevent, and correct bad changes much earlier"），而不是在鑽漏洞。

**但前提是那兩關的內容被自動檢查取代，而不是消失。** §1.1 的 G1–G4 就是規格關的機械化版本，G5–G6 是規劃關的機械化版本。若沒有這些，auto-pilot 就只是「拿掉審批」，那 DORA 的結論不支持它。

### 3.4 人審本身有多強？——兩篇一手研究

#### Bacchelli & Bird，ICSE 2013（Microsoft，[PDF](https://sback.it/publications/icse2013.pdf)）

方法：17 名開發者的觀察／訪談、**570 則 code review 意見的卡片分類**（取自 200 個隨機抽樣的 CodeFlow review thread）、873 份問卷。

> "Although defect finding is the top motivation and expected outcome of code review for many practitioners, **the category defect is only the fourth most frequent, out of nine items, with 78 (14%) comments.** Among defect comments, 65 are on logical issues…, **6 on high-level issues, 5 on security**, and 3 on wrong exception handling."

> "**Review comments about defects are few, comprising one-eighth of the total in our sample, and mostly address 'micro' level and superficial concerns**; while programmers and managers would expect more insightful remarks on conceptual and design level issues."

> "From our study, review does not result in identifying defects as often as project members would like and even more rarely detects deep, subtle, or 'macro' level issues. **Relying on code review in this way for quality assurance may be fraught.**"

換算：570 則意見中，security 相關 5 則（0.9%）、high-level 議題 6 則（1.1%）。

理解障礙是根因（這一條對 AI 產出的 diff 尤其致命）：

> "**Many interviewees eventually acknowledged that understanding is their main challenge when doing code reviews.**"
> 問卷（n=873）：**91%** 回答審不熟悉的檔案花更長時間；**82%** 回答檔案 owner 的意見「substantially deeper, more detailed and insightful」。

#### Sadowski et al.，ICSE-SEIP 2018（Google，[PDF](https://sback.it/publications/icse2018seip.pdf)）

資料：2014-01 至 2016-07 約 **900 萬個 change**、25,000 名作者與 reviewer、1,300 萬則意見。

> "At Google, **over 35% of the changes under consideration modify only a single file and about 90% modify fewer than 10 files.** Over 10% of changes modify only a single line of code, and **the median number of lines modified is 24.**"

> "**The majority of changes are small, have one reviewer and no comments other than the authorization to commit.**"

> "Expectations for code review at Google **do not center around problem solving**. Reviewing was introduced at Google to ensure code readability and maintainability… **Defect finding is welcomed but not the only focus.**"

**綜合意義**：Google 用「小 change + 一個 reviewer + 自動化分析」取代「深度人審」，而且明說 review 的主要目的不是抓 bug。這對 auto-pilot 的設計是雙向的——

- 支持面：G8 的「PR + 人 merge」符合 Google 的實務形態，不需要重型審查
- 警告面：**不能把 G8 當主要防線**。真正的防線是 G3/G4 的可執行驗證。人 merge 是最後一道，不是唯一一道

### 3.5 DORA 2024/2025：AI 與交付不穩定性（最直接的警訊）

[2024 報告](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf) p.40：

> "Contrary to our expectations, our findings indicate that AI adoption is negatively impacting software delivery performance. We see that the effect on delivery throughput is small, but likely negative (**an estimated 1.5% reduction for every 25% increase in AI adoption**). The negative impact on delivery stability is larger (**an estimated 7.2% reduction for every 25% increase in AI adoption**)."

DORA 自己的假說，和我們的 Phase 大小判準完全同構：

> "since AI allows respondents to produce a much greater amount of code in the same amount of time, it is possible, even likely, that **changelists are growing in size. DORA has consistently shown that larger changes are slower and more prone to creating instability.**"

[2025 報告](https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf) p.3——吞吐量翻正了，不穩定性**沒有**：

> "AI adoption now improves software delivery throughput, a key shift from last year. **However, it still increases delivery instability.** This suggests that while teams are adapting for speed, **their underlying systems have not yet evolved to safely manage AI-accelerated development.**"

p.40，明確駁回「不穩定是換速度的合理代價」：

> "Some might argue that instability is an acceptable trade-off for the gains in development throughput… **We found no evidence of such a moderating effect.** On the contrary, instability still has significant detrimental effects on crucial outcomes like product performance and burnout, which can ultimately negate any perceived gains in throughput."

p.58——2024 的假說在 2025 被驗證，而且小批次是**調節變數**：

> "**With a high degree of certainty, we found that AI adoption's positive benefits depend on teams working in small batches**, such that, when they do: 1. AI's positive influence on product performance is amplified; and 2. AI's neutral effect on friction is made beneficial."

[dora.dev capability: Working in small batches](https://dora.dev/capabilities/working-in-small-batches/) 有一句直接寫給我們這種場景：

> "**AI Note:** …Avoid the temptation to generate massive pull requests; **the cognitive load required to review a small chunk of machine-generated code may be higher per line than reviewing human-written code.**"

**對 auto-pilot 的意義（最重要的一段）**：DORA 連兩年測到 AI 提升交付不穩定性，而唯一被驗證有效的調節手段是**小批次**。這使得 G5（Phase 大小）與 B2（批次上限）**不是效率考量而是安全考量**——它們是目前唯一有實證支撐的、能抵銷 AI 加速帶來的不穩定的槓桿。

---

## 4. 面向三：任務可自動化的預測因子

### 4.1 規格不完整有多普遍——OpenAI 自己的量測

來源：[Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/)（OpenAI，2024-08）

93 名 Python 工程師標註 1,699 筆隨機樣本，每筆 3 人獨立標註：

> "We see that **38.3% of samples were flagged for underspecified problem statements**, and 61.1% were flagged for unit tests that may unfairly mark valid solutions as incorrect. Overall, our annotation process resulted in **68.3% of SWE-bench samples being filtered out** due to underspecification, unfair unit tests, or other issues."

他們用的問題描述評分尺度可以直接搬來當 G2 的評分表：

> "0: The issue is well-specified and it is clear what is required for a successful solution.
> 1: There are some blanks to fill in about the issue, but there is a sensible interpretation of what is required for a successful solution.
> 2: The issue is vague and there is room for ambiguity. It is unclear what a successful solution would look like.
> 3: It is almost impossible to understand what you are being asked to do without further information."

效果：同一個 GPT-4o 從原始 SWE-bench 的 16% 升到 Verified 的 33.2%——**光是把規格不清的任務濾掉，成功率就翻倍**。而且不是難度洗牌：「we observe that performance increases *within* individual difficulty categories when moving to SWE-bench Verified」。

⚠️ **重大時效性警告**：OpenAI 已於 2026 年[宣布停止使用 SWE-bench Verified](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)——他們審計了 138 個模型解不掉的題目，發現「**59.4% of the audited problems have flawed test cases that reject functionally correct submissions**」，並發現所有前沿模型都有訓練污染跡象。**本節引用的 Verified 相關數字應視為歷史訊號，不應拿來推估現在的能力水準。**（但「規格不清會拖垮成功率」這個定性結論不受影響，反而被 §4.2 更乾淨的對照實驗獨立證實。）

### 4.2 規格完整度的乾淨對照——SWE-Bench Pro

來源：[SWE-Bench Pro](https://arxiv.org/abs/2509.16941)（Scale AI，2025），§6.2 Table 3

同一批任務、同一個模型，唯一變數是規格內容：

| 模型 | Problem Statement + Requirements + Interface | Problem Statement Only |
|---|---|---|
| OpenAI GPT-5 (high) | **25.9%** | **8.40%** |
| Claude Opus 4.1 | **22.7%** | **8.20%** |

> "Without the requirements and interface, both models tested show significantly degraded performance. In this setting, **agents are less constrained and can submit more diverse solutions**… Since unit tests expect a narrow set of solutions, verifiers are prone to false negatives, resulting in lower pass rates."

作者自己標注了限制：部分效果來自 verifier 的 false negative 而非模型能力下降。**但這對我們反而是更貼切的類比**——真實世界裡「規格沒寫的驗收條件」和「測試沒表達的期望」造成的失敗，機制完全一樣。

同一篇對任務規模的觀察：

> "SWE-Bench Verified includes a substantial proportion of relatively trivial problems (**161 out of 500**) that require only **one- to two-line modifications**. In contrast, industrial software engineering, particularly in enterprise settings, often demands multi-file modifications spanning hundreds of lines."

他們自己的資料集：「the reference solutions span **107.4 lines of code across 4.1 files**」，前沿模型 resolve rate 只有 **≤23.3%**（對比 Verified 上的 >70%）。

### 4.3 規模是第二強的預測因子

**SWE-Bench Pro §6.1**：

> "Models maintain relatively stable performance for single-file problems but exhibit sharp declines as file count increases. Notably, **the performance gap between frontier and smaller models widens dramatically beyond 3 files**, with Claude Opus 4.1 and OpenAI GPT-5 maintaining above 10% resolve rates even for problems involving 10+ files, while open-source alternatives approach near-zero performance."

**[Multi-SWE-bench](https://arxiv.org/abs/2504.02605)**（ByteDance，2025）§6.2.3：

> "**Performance drops as fix patch length increases.** …the resolved rate for very long fix patches (>1000 tokens) drops significantly, **even reaching zero for Java**."
> "**Cross-file fix patches lead to reduced effectiveness.** …resolved rate drops significantly as the number of modified files increases across all three methods."

**基準線**——[SWE-bench 原始論文](https://arxiv.org/abs/2310.06770)（ICLR 2024）的中位數任務：

> "The corresponding reference solution will usually **edit a single function within a file, changing ∼15 lines**, and has a single fail to pass test to verify the correctness of the change along with 51 pass to pass tests to check whether existing behavior is preserved."

**這句話值得單獨記住**：所有 SWE-bench 上的漂亮分數，都是在「單檔、單函式、15 行」這個尺度上取得的。任何超出這個尺度的任務，公開資料無法為其成功率背書。

模型自己也知道——原論文的觀察：

> "compared to an average gold patch, model generated patch files that apply correctly are **less than half the total length (74.5 versus 30.1 lines)** of gold edit patch files, and **rarely edit more than a single file**."

### 4.4 可執行測試的價值——量化

**[Agentless](https://arxiv.org/abs/2407.01489)** Table 4，SWE-bench Lite 300 題，唯一變數是 patch 篩選方式：

| 篩選方式 | 解決題數 | 額外成本 |
|---|---|---|
| 僅多數決 | 77（25.67%） | $0.00 |
| ＋既有回歸測試 | 81（27.00%） | $0.01 |
| **＋生成的重現測試** | **96（32.00%）** | $0.25 |

**[SWT-Bench](https://arxiv.org/abs/2406.12952)**（ETH Zurich，NeurIPS 2024）摘要：

> "we find that generated tests are an effective filter for proposed code fixes, **doubling the precision of SWE-Agent**."

**但有天花板，這一點必須誠實寫進判準**——Agentless 對自動合成測試的實測：

> "Out of the 300 problems in SWE-bench Lite, Agentless is able to produce 213 reproduction tests that output the required reproduction message… We found that **only 94 tests correctly output the Issues resolved message after applying the ground truth patches.** This steep drop-off can be partially explained as sometimes **the issue description provided in the problem may not contain enough information to generate complete test cases**."

**只有約 31% 的任務能被自動合成出正確的重現測試，而瓶頸又回到描述品質。** 這直接支撐我們的 G4——驗收測試要在**規格關由人定名**，不能寄望 agent 執行時自己想出來。

還有一條反直覺的：

> "we found that the solve rate of all prior approaches **drop** when evaluated on the problems with reproducible code examples. Many agent-based approaches attempt to first reproduce the error, however, **this may not improve performance even on problems with already provided reproducible examples.**"

→ issue 裡貼了重現步驟，本身不提升成功率；**只有當 harness 真的把它變成一個會執行的檢查時才有用**。這是 G3（可執行指令）而非「有重現步驟」才是判準的原因。

**[R2E-Gym](https://arxiv.org/abs/2504.07164)** 的警告——測試不是萬能：

> "**Test-based verifiers suffer from low distinguishability**, while execution-free verifiers are biased and often rely on stylistic features. Surprisingly, we find that while each approach individually **saturates around 42-43%**…"

### 4.5 定位不是瓶頸了，跨元件推理才是

來源：[SWE-Lancer](https://arxiv.org/abs/2502.12115)（OpenAI，2025）

> "**Agents excel at localizing, but fail to root cause**, resulting in partial or flawed solutions. Agents pinpoint the source of an issue remarkably quickly… often far faster than a human would. However, **they often exhibit a limited understanding of how the issue spans multiple components or files, and fail to address the root cause**, leading to solutions that are incorrect or insufficiently comprehensive. **We rarely find cases where the agent… fails due to not finding the right file or location to edit.**"

**這推翻了一個常見假設**（也順帶影響 G2 的設計）：「告訴 agent 改哪個檔案」的價值不在於它找不到，而在於**檔案清單暗示了改動的邊界**——邊界明確，跨元件的錯誤就少。所以 G2 要求的是「指名受影響檔案／介面」而不是「指名要改的那一行」。

### 4.6 Repo 規模的量化衰減

來源：[FeatBench](https://arxiv.org/abs/2509.22237)（2025），§3.4——本研究找到唯一的分箱實測：

> "Model effectiveness is inversely correlated with repository complexity, as measured by both file count and LOC. While agents perform well on smaller projects (**fewer than 200 files or 50,000 LOC**), with **resolved rates reaching up to 60-70% for GPT-5**, their success degrades sharply with scale."
> "In large repositories (**more than 800 files or 300,000 LOC**), performance for all models **converges to a low of 10–30%**."

⚠️ 單一 benchmark、單一論文，強度標「中」。G6 因此設計成**校準**（大 repo 把 Phase 閾值折半）而非**否決**——因為 §4.7 顯示這個傷害是可以靠拆小步驟拿回來的。

### 4.7 Context 長度：傷害真實，但可靠拆解回收

- [Lost in the Middle](https://arxiv.org/abs/2307.03172)（Liu et al., TACL 2024）：「performance is often highest when relevant information occurs at the beginning or end of the input context, and **significantly degrades when models must access relevant information in the middle** of long contexts, even for explicitly long-context models.」
- [Chroma, Context Rot](https://www.trychroma.com/research/context-rot)（2025，18 個模型）：「models do not use their context uniformly; instead, their **performance grows increasingly unreliable as input length grows**」（廠商自研報告，非同儕審查）
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：「Context, therefore, must be treated as **a finite resource with diminishing marginal returns**.」
- [LLMs Get Lost In Multi-Turn Conversation](https://arxiv.org/abs/2505.06120)（Microsoft Research + Salesforce，2025）：「**an average drop of 39%** across six generation tasks… decomposes the performance degradation into **a minor loss in aptitude and a significant increase in unreliability**. …**when LLMs take a wrong turn in a conversation, they get lost and do not recover.**」
- **最直接支持「拆小」的一篇**——SambaNova 對 bug fixing 的長 context 研究：成功軌跡「typically remain **under 20k-30k tokens**」，且 agentic 的成功「primarily arises from **task decomposition into short-context steps** rather than effective long-context reasoning」。同一個 GPT-5-nano，在 64k 單次 context + oracle retrieval 下解出 **0** 題，拆成短步驟後可達 31%。

**綜合**：「上下文太長會壞」是真的，但解法是**拆步驟**而不是**放棄任務**。這是 G5/G6 設計成「拆更小」而非「不要跑」的證據基礎，也是 C 類 context 煞車（compaction > 2 次即停）的依據——需要多次 compaction 代表這個 Phase 一開始就拆錯了。

---

## 5. 面向四：降級與熔斷設計

### 5.1 沒有權威數字，只有實作預設值

**Martin Fowler、Nygard、Microsoft 都不給規範性的失敗次數門檻。** Fowler 文章裡的 `@failure_threshold = 5` 是 Ruby 範例碼；[Microsoft Azure 的 Circuit Breaker pattern 頁面](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)只說「You should configure the circuit breaker to match the likely recovery pattern of the operation that it protects」。

實際被廣泛使用的預設值（差異之大本身就是結論）：

| 實作 | 參數 | 預設值 |
|---|---|---|
| [Netflix Hystrix](https://github.com/Netflix/Hystrix/wiki/Configuration) | `requestVolumeThreshold` / `errorThresholdPercentage` / 統計窗 | **20 次 / 50% / 10 秒** |
| [Resilience4j](https://resilience4j.readme.io/docs/circuitbreaker) | `minimumNumberOfCalls` / `failureRateThreshold` / `slidingWindowSize` | **100 / 50% / 100** |
| [Polly v8](https://www.pollydocs.org/strategies/circuit-breaker.html) | `MinimumThroughput` / `FailureRatio` / `SamplingDuration` | **100 / 10% / 30 秒** |
| [Envoy outlier detection](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/outlier_detection.proto) | `consecutive_5xx` / `max_ejection_percent` | **5 / 10%** |

Azure 對「為什麼計數器要會自動重置」的說明，正好是我們批次熔斷計數器的設計依據：

> "The failure counter for the **Closed** state is time based. It automatically resets at periodic intervals. **This design helps prevent the circuit breaker from entering the Open state if it experiences occasional failures.**"

### 5.2 低量下不要用純連續計數——以及我們為什麼還是用了

每一個成熟實作都有 minimum volume 閘門。Hystrix 的說明最直白：

> "For example, if the value is 20, then if only 19 requests are received in the rolling window… **the circuit will not trip open even if all 19 failed.**"

Resilience4j 同義：「If only 9 calls have been recorded the Circuit Breaker will not transition to open even if all 9 calls have failed.」Polly：「If the `MinimumThroughput` is not reached during the `SamplingDuration` then the `FailureRatio` is ignored.」

**我們的處境與取捨已在 §1.3 標注**：批次量 5 遠低於任何 minimum volume，這是刻意在工業慣例之外操作。三個緩解手段：(a) 閾值訂得比工業預設保守（2/3 而非 5/20）；(b) 失敗與錯誤分開計數（§5.3）；(c) blast radius 獨立於觸發條件封頂（B1/B2）。

Envoy 的做法值得直接抄：它**保留**了原始的連續計數觸發（`consecutive_5xx: 5`），但用 `max_ejection_percent: 10%` 讓它「無論觸發多少次，最多只能拿掉十分之一」。**觸發條件與影響範圍分開設計**——這正是我們 B1（檔案不相交）與 B2（批次上限）在做的事。

### 5.3 「它是壞的」vs「我判斷不出來」——最值得抄的一條

[Argo Rollouts](https://argo-rollouts.readthedocs.io/en/stable/features/analysis/) 的 CRD 預設值：

- `failureLimit` — 「the maximum number of times the measurement is allowed to fail, before the entire metric is considered Failed **(default: 0)**」
- `consecutiveErrorLimit` — 「the maximum number of times the measurement is allowed to **error** in succession, before the metric is considered error **(default: 4)**」

**指標判定為失敗 → 零容忍立刻中止；指標量不到（監控掛了）→ 容忍連續 4 次。** Google 的 Canary Analysis Service 用另一種形式表達同一件事——除了 PASS/FAIL 之外還有第三種 verdict：

> "A third option, **NONE**, is also possible if underlying infrastructure was unavailable and CAS could not reach a verdict."

映射到我們：「測試紅了」是 FAIL（產出壞了，重試有意義但要限次），「test runner 起不來」是 NONE（判斷不出來，另計），「要改產品行為但 spec 無依據」是硬 FAIL（limit = 0，重試零意義）。**混在同一個計數器裡，環境問題會吃掉真失敗的重試額度。**

### 5.4 漸進式交付：最小資料量與時間下限

[Flagger](https://fluxcd.io/flagger/usage/how-it-works/) 的參數語意：`interval`（預設 60s）、`threshold`（"max number of failed metric checks before rollback"）、`maxWeight`、`stepWeight`。文件的標準範例是 `interval: 1m / threshold: 10 / maxWeight: 50 / stepWeight: 5`，最短驗證時間 = `interval * (maxWeight / stepWeight)` = **10 分鐘**。⚠️ `10/50/5` 是文件範例值，不是文件宣告的預設值。

Google CAS（[Davidovič with Beyer, *acmqueue* 16(1), 2018](https://sre.google/static/pdf/canary_analysis.pdf)）給了本節唯一的硬性最小資料量：

> "This means striking a balance between delaying the evaluation too much and not having enough data to reach a meaningful conclusion. **In practice, at least five minutes of data are required.**"

聚合方式（與 Anthropic 的 evaluator「任一 criterion 不過即 sprint 失敗」一致）：

> "**If any check in any trial fails, the entire evaluation is declared a failure**, and FAIL is returned."

兩條對我們特別有用的警告：

> "CAS **intentionally does not provide a confidence score, p-value, or the like**: that would imply that the rollout tool has logic to determine when to take a real-world action… removes the risk of creating artificial confidence scores from a meaningless heuristic."

→ **不要給任務算「就緒分數」。** CAS 的理由和我們拒絕加權評分的理由完全相同：假的信心分數比二元判定更危險。判準就該是 PASS/FAIL。

> "It has experienced incidents when users disregarded a canary failure and pushed a broken release. **User mistrust of complex automation is at the root of many of these issues.**"

→ 判準必須**可解釋**。CAS 的補救是「explicitly explaining, in human-friendly terms that don't require knowledge of statistics, why CAS reaches a particular conclusion」。我們的 auto-pilot 拒絕一個任務時，必須輸出「因為 G3 沒有可執行的測試指令」這種一句話理由，否則使用者會繞過它。

以及一條對「自動調整閾值」的警告：

> "**Adaptive behavior poses a risk if a user keeps retrying a push when an anomaly is actually dangerous**: CAS eventually starts treating this risky behavior as the new norm and no longer flags it as problematic."

→ 不要做「多次被人手動放行後就自動放寬判準」的設計。

### 5.5 Blast radius：自動化會放大錯誤，補救是限速不是偵測

[Google SRE Book, ch.7](https://sre.google/sre-book/automation-at-google/)，sidebar 標題就叫 "Automation: Enabling Failure at Scale"：

> "**the empty set was used as a special value, interpreted to mean 'everything.'** This means the automation sent almost all the machines we have in all colos to Diskerase. […] **Within minutes, the highly efficient Diskerase wiped the disks on all machines in our CDN**, and the machines were no longer able to terminate connections from users."

事後補救是「auditing and adding more sanity checks—including **rate limiting**—into our automation, and making our decommission workflow **idempotent**」。

[AWS, Reducing the Scope of Impact with Cell-Based Architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html)（2023）給出簡單的 1/N 算術：

> "**If a workload uses 10 cells to service 100 requests, when a failure occurs in one cell, 90% of the overall requests would be unaffected by the failure.**"
> "These fault boundaries can provide resilience against failure types that otherwise are hard to contain, such as **unsuccessful code deployments**…"

**對我們**：B1（任務改動檔案不相交）就是 cell 邊界，B2（批次 ≤ 5、併發 ≤ 2）就是 rate limiting。這兩條的價值不取決於熔斷器準不準——即使熔斷完全失效，一次批次最多也只污染 5 個 PR、5 組不相交的檔案。

### 5.6 全自動 → 出事才交還人類，是人因學上最差的組合

Endsley & Kiris (1995), "The Out-of-the-Loop Performance Problem and Level of Control in Automation," *Human Factors* 37(2), 381–394（[DOI](https://journals.sagepub.com/doi/10.1518/001872095779064555)，付費牆，以下取自公開摘要）：out-of-the-loop 問題使操作員在自動化失效時難以接手，源於技能與情境意識流失、從主動轉為被動的資訊處理；關鍵在於——**out-of-the-loop 的績效問題在「完全自動化」下顯著大於「中間自動化程度」**。

**對我們的意義**：這是對 auto-pilot 最根本的一條警告——一個全自主跑完、只在失敗時把爛攤子丟給人的設計，正是這份文獻裡最差的配置。緩解方式是讓「交還」時附帶完整的情境重建材料，而不是只丟一個 FAIL：

- 每個 Phase 收尾必 commit（Anthropic harness 文章的做法），人接手時可以逐 commit 讀
- 煞車時輸出「停在哪個 Phase、哪條判準、最後一次測試輸出是什麼」
- 這也是 §5.4 CAS 那條「可解釋性」要求的延伸

---

## 6. 明確標出查無實證的說法

| 常見說法 | 實際狀況 |
|---|---|
| 「Definition of Ready 能提升交付品質」 | **查無實證**。DoR 是慣例，沒有找到對照研究。更廣地說，整個 requirements quality 領域的實證都薄弱——[Frattini et al.](https://arxiv.org/abs/2309.10355)：「requirements quality research focuses on normative rules and **mostly fails to connect requirements quality to its impact on subsequent software development activities**」 |
| 「open questions = 0 代表規格夠清楚」 | **查無實證**，且指標本身可被「不提問」刷出來。見 §1.4 候選二 |
| 「連續 N 次失敗就該熔斷」有標準答案 | **沒有**。Fowler 的 5 是範例碼；工業預設值從 Hystrix 的 20 次到 Resilience4j 的 100 次不等，且全部搭配比率而非純計數 |
| 「GitHub Copilot coding agent 的 PR merge rate 是 X%」 | **GitHub 從未公布**。Octoverse 2025 只公布 PR 建立量（2025 年 5–9 月超過 100 萬個），並自己呼籲社群做 A/B 研究建立基線 |
| 「SWE-bench Verified 分數代表現在的 agent 能力」 | **已被 OpenAI 自己撤回**。2026 年審計發現模型解不掉的題目中 59.4% 是題目本身有缺陷，且所有前沿模型都有訓練污染跡象；OpenAI 建議其他開發者也停止回報此分數 |
| 「AI 寫了 Google 75% 的程式碼」 | **假的**。查遍 2024 Q3–2025 Q2 的 Alphabet 財報逐字稿都沒有。真實的一手數字是 Q3 2024「more than a quarter of all new code at Google is generated by AI, then reviewed and accepted by engineers」與 Q1 2025 的「well over 30%」，且兩次的分母定義不同 |
| 「補丁 > 7 個檔案就永遠解不掉」／「單檔 <5 行的解決率 48%」等具體數字 | **追不到一手來源**。這些數字流傳於 AI 聚合網站，非論文原文。可用的一手替代是 §4.3 的 SWE-Bench Pro 與 Multi-SWE-bench 的定性陳述 |
| 「有重現步驟的 issue，agent 成功率較高」 | **實測相反**（Agentless §4.4）。只有當 harness 把它變成會執行的檢查時才有用 |
| 「repo 熟悉度可以量化並當判準」 | **查無可操作的量測**。FeatBench 的 repo 規模分箱是本研究找到最接近的替代，且只有單一來源 |
| 2025 DORA 的「AI 對不穩定性影響 X%」 | **2025 報告沒有公布任何百分比數字**（刻意改用標準化 beta 權重）。流傳的百分比都是 2024 的數字被誤植 |
| Amazon 的「Andon Cord」（客服可下架商品） | **找不到 Amazon/AWS 官方來源**，只有二手部落格。Toyota 的 jidoka 有[官方來源](https://mag.toyota.co.uk/jidoka-toyota-production-system/)，但不要把 Amazon 版本當一手引用 |

---

## 7. 三個未解問題（留給實作後回頭補）

1. **G6 的 repo 規模折半係數沒有依據。** FeatBench 只告訴我們大 repo 成功率降到 1/3 到 1/2，沒告訴我們「Phase 縮小多少能補回來」。建議上線後記錄「repo 規模 × Phase 大小 × 是否成功」，自己長出資料。
2. **批次熔斷閾值（2/3）純屬工程判斷。** 見 §1.3 的誠實標注。建議記錄每次熔斷的事後判定（真陽性／假陽性），跑滿 20 個批次後回頭調。
3. **「同一原因」如何機械判定？** B4 的批次熔斷要求辨識共因失敗，但「同一原因」目前只能靠 agent 自述。粗糙但可行的近似：連續失敗的任務停在**同一關**（例如都停在第三關測試轉不綠）即視為同因。這是刻意的粗糙判準——寧可偶爾誤停整批，也不要因為判不出共因而讓壞掉的環境跑完全部 5 個任務。
