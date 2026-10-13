# Harness Engineering 設計原則：長時程自主編碼 agent 的第一手證據盤點（截至 2026-10-12）

> 讀法說明：每條原則盡量以「**(a) 它要防的失效** → **(b) 他們實際用的機制** → **(c) 證據強度**」三段呈現。證據強度標記：`第一手＋數據`／`第一手軼事`／`同儕審查`／`廠商行銷`／`二手轉述`／`社群傳聞`／`查無實證`。所有英文引文一字不改，附 URL 與取用日期（全部為 2026-10-12）。
>
> 取用方式提醒：本研究環境的網路代理封鎖了 openai.com、cognition.ai、ghuntley.com、mitchellh.com、arxiv.org、simonwillison.net、martinfowler.com 等網域。對這些來源，我改讀 **GitHub 上他人保存的全文副本**（已逐段比對標題結構與作者署名，並在引用處標明 mirror 位置）；Anthropic engineering、code.claude.com、raw.githubusercontent.com 可直接讀取。無法取得全文、只靠搜尋摘要的條目一律標 `二手轉述` 或 `查無實證`。

---

## 1. OpenAI〈Harness engineering: leveraging Codex in an agent-first world〉（2026-02-11）說了什麼？

### Takeaway
OpenAI 一個 3→7 人團隊用 Codex 在五個月內「零手寫程式碼」交付一個內部 beta 產品（約 100 萬行、約 1,500 個 PR）。他們把工程師的工作重新定義為「設計環境、指定意圖、建立回饋迴路」，核心原則是：**agent 看不到的東西等於不存在；AGENTS.md 是目錄不是百科；架構用 linter 與結構測試機械化強制而非靠文件；熵用背景 agent 做「垃圾回收」；人類只在需要判斷時介入**。證據是第一手且有數字，但屬廠商自述、無外部稽核，且作者自己明言「不應假設可泛化」。

### Cited Findings

**來源與取得方式**：原文 https://openai.com/index/harness-engineering/（作者 Ryan Lopopolo, Member of the Technical Staff；2026-02-11）。本環境無法直連 openai.com，全文取自 GitHub 保存副本 https://github.com/Laksh-star/nonprofit-grants-agent-ops/blob/928cde22f2694b439b3683ee9b9b12703c48813e/Harness%20engineering_%20leveraging%20Codex%20in%20an%20agent-first%20world.md（取用 2026-10-12），已核對章節標題、作者署名與致謝。其他 GitHub 筆記（kzinmr/ai-topics、davoshack/wiki-agentic-engineering）亦記錄同一日期與作者。

- **規模數字（第一手＋數據，但為廠商自述）**："Over the past five months, our team has been running an experiment: building and shipping an internal beta of a software product with 0 lines of manually-written code." / "Five months later, the repository contains on the order of a million lines of code... roughly 1,500 pull requests have been opened and merged with a small team of just three engineers driving Codex. This translates to an average throughput of 3.5 PRs per engineer per day, and surprisingly the throughput has *increased* as the team has grown to now seven engineers." / "We estimate that we built this in about 1/10th the time it would have taken to write the code by hand." — [OpenAI via mirror](https://github.com/Laksh-star/nonprofit-grants-agent-ops/blob/928cde22f2694b439b3683ee9b9b12703c48813e/Harness%20engineering_%20leveraging%20Codex%20in%20an%20agent-first%20world.md)（原文 https://openai.com/index/harness-engineering/ ）

- **原則 0：人類的新角色 = 環境設計者**。(a) 防：把 agent 當打字員、失敗時只會「再試一次」。(b) 機制：工程師把每次失敗轉為「缺哪個能力、怎麼讓它對 agent 可見且可強制」。(c) 第一手軼事。引文："Humans steer. Agents execute." / "...what changes when a software engineering team's primary job is no longer to write code, but to design environments, specify intent, and build feedback loops that allow Codex agents to do reliable work." / "Early progress was slower than we expected, not because Codex was incapable, but because the environment was underspecified." / "When something failed, the fix was almost never "try harder." Because the only way to make progress was to get Codex to do the work, human engineers always stepped into the task and asked: "what capability is missing, and how do we make it both legible and enforceable for the agent?"" — [同上](https://openai.com/index/harness-engineering/)

- **原則 1：AGENTS.md 是地圖（目錄），不是百科；知識庫住在 repo 的 docs/**。(a) 防的失效（原文明列四條）："Context is a scarce resource. A giant instruction file crowds out the task, the code, and the relevant docs—so the agent either misses key constraints or starts optimizing for the wrong ones." / "Too much guidance becomes *non-guidance*. When everything is "important," nothing is. Agents end up pattern-matching locally instead of navigating intentionally." / "It rots instantly. A monolithic manual turns into a graveyard of stale rules. Agents can't tell what's still true, humans stop maintaining it, and the file quietly becomes an attractive nuisance." / "It's hard to verify. A single blob doesn't lend itself to mechanical checks (coverage, freshness, ownership, cross-links), so drift is inevitable." (b) 機制："give Codex a map, not a 1,000-page instruction manual." / "So instead of treating AGENTS.md as the encyclopedia, we treat it as the table of contents." / "A short AGENTS.md (roughly 100 lines) is injected into context and serves primarily as a map, with pointers to deeper sources of truth elsewhere." 目錄結構包含 `docs/design-docs/`（含 `core-beliefs.md`）、`docs/exec-plans/{active,completed,tech-debt-tracker.md}`、`docs/product-specs/`、`docs/references/*-llms.txt`、`QUALITY_SCORE.md`、`RELIABILITY.md`、`SECURITY.md` 等。"This enables progressive disclosure: agents start with a small, stable entry point and are taught where to look next, rather than being overwhelmed up front." (c) 第一手軼事（失敗模式是他們試過「one big AGENTS.md」後觀察到的）。— [同上](https://openai.com/index/harness-engineering/)

- **原則 2：文件即 agent 記憶，而且文件本身要被機械化驗證＋園丁 agent 維護**。(a) 防：文件腐爛、跨 session 失憶。(b) 機制："Plans are treated as first-class artifacts. Ephemeral lightweight plans are used for small changes, while complex work is captured in execution plans with progress and decision logs that are checked into the repository. Active plans, completed plans, and known technical debt are all versioned and co-located, allowing agents to operate without relying on external context." / "We enforce this mechanically. Dedicated linters and CI jobs validate that the knowledge base is up to date, cross-linked, and structured correctly. A recurring "doc-gardening" agent scans for stale or obsolete documentation that does not reflect the real code behavior and opens fix-up pull requests." (c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **原則 3：Agent legibility — 「看不到的就不存在」**。(a) 防：知識藏在 Slack/Google Docs/人腦裡，agent 無法取用。(b) 機制：把討論結論持續推進 repo；選「無聊」且可在 repo 內完整內化的依賴，必要時自己重寫小功能。引文："From the agent's point of view, anything it can't access in-context while running effectively doesn't exist. Knowledge that lives in Google Docs, chat threads, or people's heads are not accessible to the system." / "That Slack discussion that aligned the team on an architectural pattern? If it isn't discoverable to the agent, it's illegible in the same way it would be unknown to a new hire joining three months later." / "Technologies often described as "boring" tend to be easier for agents to model due to composability, api stability, and representation in the training set. In some cases, it was cheaper to have the agent reimplement subsets of functionality than to work around opaque upstream behavior from public libraries." (c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **原則 4：應用程式本身也要 legible（UI、logs、metrics 可被 agent 查詢）**。(a) 防：人類 QA 成為瓶頸。(b) 機制：每個 git worktree 可獨立啟動 app；Chrome DevTools Protocol 接進 runtime；每個 worktree 有拋棄式觀測堆疊，可用 LogQL/PromQL 查詢。引文："As code throughput increased, our bottleneck became human QA capacity." / "we made the app bootable per git worktree, so Codex could launch and drive one instance per change." / "Agents can query logs with LogQL and metrics with PromQL. With this context available, prompts like "ensure service startup completes in under 800ms" or "no span in these four critical user journeys exceeds two seconds" become tractable." / "We regularly see single Codex runs work on a single task for upwards of six hours (often while the humans are sleeping)." (c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **原則 5：架構約束用機器強制（custom linters＋structural tests），只管不變量、不管實作**。(a) 防：全 agent 生成的程式碼失去一致性與架構漂移。(b) 機制：每個業務領域固定分層、依賴方向被驗證；橫切關注點只能透過單一 `Providers` 介面進入；lint 錯誤訊息直接寫成「給 agent 的修復指令」。引文："Documentation alone doesn't keep a fully agent-generated codebase coherent. By enforcing invariants, not micromanaging implementations, we let agents ship fast without undermining the foundation." / "Each business domain is divided into a fixed set of layers, with strictly validated dependency directions and a limited set of permissible edges. These constraints are enforced mechanically via custom linters (Codex-generated, of course!) and structural tests." / "This is the kind of architecture you usually postpone until you have hundreds of engineers. With coding agents, it's an early prerequisite: the constraints are what allows speed without decay or architectural drift." / "Because the lints are custom, we write the error messages to inject remediation instructions into agent context." / "In a human-first workflow, these rules might feel pedantic or constraining. With agents, they become multipliers: once encoded, they apply everywhere at once." / "enforce boundaries centrally, allow autonomy locally." (c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **原則 6：人類品味「只捕捉一次，然後持續強制」；文件不夠就升格為程式碼**。引文："Human taste is fed back into the system continuously. Review comments, refactoring pull requests, and user-facing bugs are captured as documentation updates or encoded directly into tooling. When documentation falls short, we promote the rule into code" (c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **原則 7：垃圾回收（entropy GC）**。(a) 防：agent 複製 repo 既有（含不佳）模式造成漂移；人手清理不可擴展。(b) 機制：把「golden principles」寫進 repo，背景 Codex 任務定期掃描偏差、更新品質分級、開小型重構 PR 並自動合併。引文："Codex replicates patterns that already exist in the repository—even uneven or suboptimal ones. Over time, this inevitably leads to drift." / "Our team used to spend every Friday (20% of the week) cleaning up "AI slop." Unsurprisingly, that didn't scale." / "On a regular cadence, we have a set of background Codex tasks that scan for deviations, updates quality grades, and open targeted refactoring pull requests. Most of these can be reviewed in under a minute and automerged." / "This functions like garbage collection. Technical debt is like a high-interest loan: it's almost always better to pay it down continuously in small increments than to let it compound and tackle it in painful bursts. Human taste is captured once, then enforced continuously on every line of code." (c) 第一手軼事（含「每週五 20%」這個失敗前狀態的數字）。— [同上](https://openai.com/index/harness-engineering/)

- **原則 8：吞吐量改變合併哲學——但作者自己標明這在低吞吐環境是「不負責任的」**。引文："The repository operates with minimal blocking merge gates. Pull requests are short-lived. Test flakes are often addressed with follow-up runs rather than blocking progress indefinitely. In a system where agent throughput far exceeds human attention, corrections are cheap, and waiting is expensive." / "This would be irresponsible in a low-throughput environment. Here, it's often the right tradeoff." (c) 第一手軼事＋作者自設適用邊界。— [同上](https://openai.com/index/harness-engineering/)

- **人類還做什麼**："Humans may review pull requests, but aren't required to. Over time, we've pushed almost all review effort towards being handled agent-to-agent." / "Humans always remain in the loop, but work at a different layer of abstraction than we used to. We prioritize work, translate user feedback into acceptance criteria, and validate outcomes. When the agent struggles, we treat it as a signal: identify what is missing—tools, guardrails, documentation—and feed it back into the repository, always by having Codex itself write the fix." 自主清單末兩項："Escalate to a human only when judgment is required" / "Merge the change"。(c) 第一手軼事。— [同上](https://openai.com/index/harness-engineering/)

- **PR 完成迴路明示引用 Ralph Wiggum Loop**："To drive a PR to completion, we instruct Codex to review its own changes locally, request additional specific agent reviews both locally and in the cloud, respond to any human or agent given feedback, and iterate in a loop until all agent reviewers are satisfied (effectively this is a Ralph Wiggum Loop)." — [同上](https://openai.com/index/harness-engineering/)（連結指向 https://ghuntley.com/loop/ ）

- **作者自陳的限制與未知**："This behavior depends heavily on the specific structure and tooling of this repository and should not be assumed to generalize without similar investment—at least, not yet." / "What we don't yet know is how architectural coherence evolves over years in a fully agent-generated system. We're still learning where human judgment adds the most leverage and how to encode that judgment so it compounds." / "building software still demands discipline, but the discipline shows up more in the scaffolding rather than the code." — [同上](https://openai.com/index/harness-engineering/)

- **相關 Codex 寫作（僅能確認存在與日期）**：〈Unlocking the Codex harness: how we built the App Server〉（2026-02-04）、〈Unrolling the Codex agent loop〉（2026-01-23）、〈Inside OpenAI's in-house data agent〉（2026-01-29）— 列於原文「Keep reading」區；另 OpenAI Cookbook〈codex_exec_plans〉為原文所引的執行計畫格式來源。這些本環境皆無法開啟。— [同上 mirror 的頁尾連結](https://github.com/Laksh-star/nonprofit-grants-agent-ops/blob/928cde22f2694b439b3683ee9b9b12703c48813e/Harness%20engineering_%20leveraging%20Codex%20in%20an%20agent-first%20world.md)

- **獨立採用的旁證（非成效證據）**：Grafana `gcx` repo 在 2026-03-27 以 OpenAI 五項原則做自我差距分析（"Map, not manual"、"Repository as system of record"、"Enforce invariants mechanically"、"Application legibility"、"Entropy and garbage collection"），列出自己缺少的結構測試、ADR 索引、品質分級等。這證明原則被當成 checklist 採用，不證明成效。— [grafana/gcx docs/research](https://raw.githubusercontent.com/grafana/gcx/main/docs/research/2026-03-27-harness-engineering-gap-analysis.md)（二手轉述）

- **第三方批評性觀點（二手轉述）**：Simon Willison 2026-02-22〈How I think about Codex〉轉述 OpenAI 的 Gabriel Chua 將 Codex 拆為 model / harness / surfaces，並指出這是"the first acknowledgment I've seen from an OpenAI insider that the Codex model family are directly trained for the Codex harness"（此句來自搜尋摘要，simonwillison.net 本環境無法開啟）。含意：OpenAI 的 harness 成效部分來自 model 與 harness 的共同訓練，外部團隊照抄結構未必得到同等效果。— [Simon Willison](https://simonwillison.net/2026/Feb/22/how-i-think-about-codex/)

### Inferences
- OpenAI 的八條做法可以收斂成一個因果鏈：**人類注意力是唯一稀缺資源 → 所以要把一切（知識、架構規則、品味、QA）轉成 agent 可見且可機械強制的東西 → 轉完之後每條規則「一次編碼、處處生效」→ 於是人類只剩下優先排序、驗收標準、判斷升級**。這是「harness 即產品」的最完整第一手敘述。
- 「minimal blocking merge gates」是整篇最不可移植的一條：它依賴吞吐量遠超人力的前提，且作者自己劃出邊界。對單一服務、單一領域的小團隊，應保留合併門檻，只採用前七條。
- 「custom lint 錯誤訊息＝給 agent 的修復指令」是把 SWE-agent 的「guardrails 加速恢復」原則推到架構層級的具體做法，兩者可互相印證（見第 4 節）。

### Gaps
- 無法直接開啟 openai.com 原文；引文來自 GitHub 保存副本，已核對結構但未逐字比對全文。
- 「~1M LOC / ~1,500 PRs / 1/10 時間」皆為團隊自述，無外部稽核；「1/10」是估計值。
- 相關 Codex 寫作（App Server、agent loop、exec plans）內容未能取得 — `查無實證`（存在性已確認，內容未讀）。
- HN 討論：僅一篇部落格稱其「286 points、約 200 comments」，無法開啟 HN 驗證 — `查無實證`。

---

## 2. Anthropic 工程部落格說了什麼？（Effective harnesses 2025-11、Building effective agents 2024-12、Context engineering 2025-09、C 編譯器 2026-02、Harness design 2026-03）

### Takeaway
Anthropic 五篇文章合起來的主軸是：**模型的根本限制是「離散 session＋context 會腐爛」，所以 harness 的工作是把狀態搬到 context 之外（git、progress 檔、JSON feature list）、把「完成」的判定權從做事的 agent 手上拿走（瀏覽器 E2E、獨立 evaluator、近乎完美的 verifier），並且每個 harness 元件都是「對模型現階段做不到什麼」的假設，模型升級後要重新檢驗並拆除**。失敗模式有明確的第一手記錄：過早宣告完成、半成品無文件交接、自評偏正向、context anxiety、16 個 agent 撞同一個 bug。

### Cited Findings

**A.〈Effective harnesses for long-running agents〉（Justin Young，2025-11-26；直接讀取）** — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

- **根本限制**："they must work in discrete sessions, and each new session begins with no memory of what came before." 即使 Opus 4.5 加 compaction 在迴圈裡跑，只給高層 prompt 也做不出 production 品質 web app。(c) 第一手軼事。— [Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：initializer agent 與 coding agent 分工，但只差在 user prompt**。初始化 agent "sets up the environment on the first run"：建 `init.sh`、progress log、首次 git commit；之後每個 session 由 coding agent "making incremental progress in every session"。System prompt、工具、harness 完全相同。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：progress 檔＋git 作為跨 session 記憶**。"a claude-progress.txt file that keeps a log of what agents have done"；git 讓模型 "revert bad code changes and recover working states of the code base."。(a) 防："Claude leaves the environment in a state with bugs or undocumented progress."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：JSON feature list，全部初始標記 failing，agent 只能改 `passes` 欄位**。初始化 agent 為 claude.ai clone 寫了 200+ 個功能需求，"These features were all initially marked as 'failing'."；規則："It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."；選 JSON 的理由："the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files."。(a) 防："Claude declares victory on the entire project too early."。(c) 第一手軼事（格式選擇理由為觀察而非量測）。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：一次只做一個功能，交接時必須是「可合併到 main」的乾淨狀態**。"only one feature at a time"；clean state 定義為 "the kind of code that would be appropriate for merging to a main branch."。(a) 防：一次做太多導致 "led to the model running out of context in the middle of its implementation"，下個 session 面對半成品且無文件；compaction "doesn't always pass perfectly clear instructions to the next agent."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：session 啟動儀式＋先修既有壞掉再做新功能**。`pwd` → 讀 git log 與 progress → 讀 feature list 選最高優先未完成項 → `init.sh` 啟 dev server → 跑基本 E2E。(a) 防："Claude has to spend time figuring out how to run the app."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **原則：驗證要以「人類使用者的方式」做 E2E，不接受 unit test / curl 就宣告完成**。失效："mark a feature as complete without proper testing"；機制：要求瀏覽器自動化、"do all testing as a human user would."；Puppeteer MCP 測試 "dramatically improved performance"；限制："Claude can't see browser-native alert modals through the Puppeteer MCP"，依賴 alert 的功能 bug 較多。(a) 防："Claude marks features as done prematurely."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **開放問題**：單一通用 coding agent 是否優於「測試/QA/清理」專職多 agent 尚無結論。— [同上](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**B.〈Harness design for long-running application development〉（Prithvi Rajasekaran，Labs，2026-03-24；直接讀取）** — https://www.anthropic.com/engineering/harness-design-long-running-apps

- **原則：把「做」與「評」分開——自評一定偏正向**。"agents reliably skew positive when grading their own work." / "tuning a standalone evaluator to be skeptical turns out to be far more tractable"。但 evaluator 仍是 LLM、早期會 "talk itself into deciding they weren't a big deal and approve the work anyway."。(c) 第一手軼事。— [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **原則：主觀品質要先轉成可評分準則，且準則措辭會直接塑形輸出**。四準則：design quality、originality、craft、functionality；前兩者加權（因為模型預設已擅長後兩者）；originality 準則明確懲罰 "AI slop"；用 few-shot 與分項分數校準以減少 drift。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **原則：sprint contract——開工前先談好「done 是什麼、怎麼測」**。generator 與 evaluator 以檔案溝通（結構化交接物）。planner 刻意停留在高層，因為規格裡的細節錯誤會 "cascade into the downstream implementation."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **失效模式：context anxiety**。模型 "begin wrapping up work prematurely as they approach what they believe is their context limit."；Sonnet 4.5 需要 context reset＋結構化交接；Opus 4.5 大致消除此行為，於是拆掉 reset、改用 compaction。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **原則：每個 harness 元件都是對模型缺陷的假設，模型升級就要重測、拆除**。"every component in a harness encodes an assumption about what the model can't do on its own." 對 Opus 4.6 移除 sprints、保留 planner 與 evaluator；去掉 planner 則 generator 會 under-scope。Evaluator "It is worth the cost when the task sits beyond what the current model does reliably solo."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **數據**：retro game maker 單 agent 20 分鐘/$9（核心玩法壞掉） vs 全 harness 6 小時/$200（可玩且較精緻）；DAW 約 3h50m/$124.70。(c) 第一手＋數據（單案例）。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **人類還做什麼**：設計評分準則與權重；讀 evaluator log、找判斷分歧處、多輪改 prompt；為「在 app 內建 AI 功能」補充訓練資料稀少的 prompt；在多個 iteration 中挑選（有時中段版本優於最終）。限制：evaluator 漏掉細微 bug 與深層巢狀功能；模型缺產品直覺；跑得慢且貴。— [同上](https://www.anthropic.com/engineering/harness-design-long-running-apps)

**C.〈Building a C compiler with a team of parallel Claudes〉（Nicholas Carlini，Safeguards，2026-02-05；直接讀取）** — https://www.anthropic.com/engineering/building-c-compiler

- **規模**：16 個 agent、"nearly 2,000 Claude Code sessions"、"a total cost just under $20,000"、約兩週、2B 輸入 token / 140M 輸出 token、10 萬行 Rust，可編譯 Linux 6.9（x86/ARM/RISC-V）。無網路、只依賴 Rust 標準庫。(c) 第一手＋數據。— [Anthropic](https://www.anthropic.com/engineering/building-c-compiler)
- **原則：verifier 要「近乎完美」，否則 agent 會解錯問題**。"it's important that the task verifier is nearly perfect, otherwise Claude will solve the wrong problem."（這是整篇最重要的一句。）(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **原則：無協調者、以 git 鎖檔協調**。bash loop 用 `-p` 重跑：“When it finishes one task, it immediately picks up the next.”；每 agent 在自己 Docker 容器 clone 到 `/workspace`、push 到 `/upstream`；領任務＝在 `current_tasks/` 寫檔，"If two agents try to claim the same task, git's synchronization forces the second agent to pick a different one."；"Merge conflicts are frequent, but Claude is smart enough to figure that out."；沒有 orchestrator、沒有 agent 間通訊。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **失效模式與對策**：(1) 回歸——"New features and bugfixes frequently broke existing functionality." → 後來加 CI；(2) 大任務不可切分造成碰撞——"Every agent would hit the same bug, fix that bug, and then overwrite each other's changes." → 用 GCC 當 known-good oracle，大部分 kernel 檔用 GCC、少數用 Claude 的編譯器，delta debugging 隔離失敗檔；(3) 過度自信——"it is easy to see tests pass and assume the job is done, when this is rarely the case."；(4) 自殘——一個 agent 誤跑 `pkill -9 bash` 結束了自己的迴圈。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **原則：測試輸出是為模型設計的，不是為人**。只印幾行、細節寫入檔案、"ERROR" 與原因同行方便 grep、提供 `--fast` 1%/10% 抽樣對抗「time blindness」。作者自我提醒："I was writing this test harness for Claude and not for myself."。(c) 第一手軼事。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **人類還做什麼**：寫高層 spec（不寫實作細節）、建 harness/loop/git/容器、找與寫測試與 verifier、依失效模式設計新測試、建 CI、建 GCC oracle harness。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **限制與作者立場**：無 16-bit x86 codegen、無自製 assembler/linker、"it outputs less efficient code than GCC with all optimizations disabled."、Rust 品質 "nowhere near the quality of what an expert Rust programmer might produce"。作者說此事讓他 "uneasy"，自主開發 "comes with real risks"，人類驗證仍重要。— [同上](https://www.anthropic.com/engineering/building-c-compiler)
- **第三方對這類 demo 的限定**：Cognition（2026-04）指出 C 編譯器、瀏覽器、autoresearch 這些 demo "all share a property most real software doesn't: a simple, verifiable success criterion. Real software requires a system that scales human taste and decision-making"。— [Cognition via mirror](https://raw.githubusercontent.com/BobYeger/state-of-agents/16d41e42519797863f145f802eb2fb2b38c870a0/raw/articles/cognition-multi-agents-whats-actually-working.md)

**D.〈Effective context engineering for AI agents〉（2025-09-29；直接讀取）** — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

- 定義：context engineering 是 "the set of strategies for curating and maintaining the optimal set of tokens"；context rot："the model's ability to accurately recall information from that context decreases"（隨 context 變長）。(c) 第一手＋引用外部 needle-in-haystack 研究。— [Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- 指導原則："smallest possible set of high-signal tokens"；just-in-time retrieval："maintain lightweight identifiers (file paths, stored queries, web links, etc.)"；progressive disclosure："incrementally discover relevant context through exploration"；compaction："the practice of taking a conversation nearing the context window limit"；structured note-taking："a technique where the agent regularly writes notes persisted to memory outside of the context window"。Claude Code 的混合法："CLAUDE.md files are naively dropped into context up front"，其餘以 glob/grep 即時取。— [同上](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**E.〈Building effective agents〉（2024-12-19；直接讀取；較舊）** — https://www.anthropic.com/engineering/building-effective-agents

- "finding the simplest solution possible, and only increasing complexity when needed."；workflows = "systems where LLMs and tools are orchestrated through predefined code paths."；agents = "systems where LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks."；ACI 設計："Put yourself in the model's shoes"、"Poka-yoke your tools"（SWE-bench 工作中要求絕對路徑消除了相對路徑錯誤）；"stopping conditions (such as a maximum number of iterations) to maintain control."。三原則：simplicity、transparency、carefully craft ACI。文中註明 2024-12 以後工具生態已大幅改變。(c) 第一手軼事。— [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)

**F. 其他相關 Anthropic 一手文（補強）**
- 〈Demystifying evals for AI agents〉（2026-01-09）："When we evaluate 'an agent,' we're evaluating the harness _and_ the model working together."；agent harness 定義："the system that enables a model to act as an agent: it processes inputs, orchestrates tool calls, and returns results."；grader 選擇："choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility, and using human graders judiciously for additional validation."；"often better to grade what the agent produced, not the path it took."；"Source realistic tasks from the failures you see." / "development accelerates as failures become test cases."。— [Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- 〈Writing effective tools for agents — with agents〉（2025-09-11）："Tools are a new kind of software which reflects a contract between deterministic systems and non-deterministic agents."。— [Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)
- 〈Equipping agents for the real world with Agent Skills〉（2025-10-16）：三層 progressive disclosure——"This metadata is the first level of progressive disclosure" / "The actual body of this file is the second level of detail." / "These additional linked files are the third level (and beyond) of detail"；"many applications require the deterministic reliability that only code can provide."；"When the SKILL.md file becomes unwieldy, split its content into separate files and reference them." / "Monitor how Claude uses your skill in real scenarios and iterate based on observations"。— [Anthropic](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- 〈Scaling Managed Agents: Decoupling the brain from the hands〉（2026-04-08）：harness 定義 "the loop that calls Claude and routes Claude's tool calls to the relevant infrastructure."；單容器設計變成「寵物」——"if a container failed, the session was lost."；"a bug in the harness, a packet drop in the event stream, or a container going offline all presented the same."；改為 session log 外置、"nothing in the harness needs to survive a crash."、"The harness is never made aware of any credentials."。並重述 context-anxiety reset 因 Opus 4.5 而不再需要。— [Anthropic](https://www.anthropic.com/engineering/managed-agents)

### Inferences
- Anthropic 三篇 harness 文（2025-11、2026-02、2026-03）呈現同一條演化線：**從「用檔案與 git 對抗失憶」→「用近乎完美 verifier 讓 16 個 agent 無協調者並行」→「用獨立 evaluator 對抗自評偏正向」**；每一步都是先觀察到具體失效再加元件，且 2026-03 那篇明確主張模型升級後要拆元件。這與 OpenAI 的「規則一次編碼永久生效」形成有趣對照：Anthropic 更強調 harness 規則有半衰期。
- 「verifier 近乎完美」與「E2E 像人類使用者一樣測」是同一原則的兩面：**完成的判定不能交給做事的 agent，也不能交給它能輕易滿足的代理指標**。對業務系統而言，可驗證的成功準則是否存在，決定了可自動化的範圍（Cognition 的批評正中此點）。
- Anthropic 從未宣稱多 agent 編碼全面優於單 agent；2025-11 把它列為開放問題，2026-02 的並行成功仰賴「任務天然可切分＋oracle」。

### Gaps
- 所有 Anthropic 文章皆為單一案例或 demo，無對照實驗（除 game maker 的 solo vs harness 單次對比）；屬廠商第一手軼事而非可重現研究。
- 〈Effective harnesses〉未給出 feature list / progress 檔對成功率的量化貢獻。
- 使用者已有深度筆記的主題（phase/PR 大小、task-state schema、orchestrator vs subagent、readiness gates、batch safety）依指示未再展開。

---

## 3. Cognition〈Don't Build Multi-Agents〉主張什麼？與並行 agent 路線如何衝突或調和？

### Takeaway
Cognition（Walden Yan，2025-06）主張可靠性的核心是 context engineering，兩條原則——「共享完整 trace 而非訊息」「行動帶有隱性決策，衝突的決策產生壞結果」——使得預設應排除所有並行寫入的多 agent 架構，改用單線程線性 agent＋專用壓縮模型。2026-04 的續篇**沒有撤回**對並行寫入者的否定，但承認「多 agent 貢獻智慧、寫入保持單線程」的窄類模式在生產中有效（乾淨 context 的 reviewer、smart friend、map-reduce-and-manage）。與 Anthropic 的調和點很清楚：**可並行的是唯讀/可切分/有 oracle 的工作；需要共享品味與隱性決策的寫入必須單線程**。

### Cited Findings

**來源**：原文 https://cognition.ai/blog/dont-build-multi-agents（Walden Yan，2025-06；cognition.ai 本環境無法開啟），全文取自 GitHub 保存副本 https://raw.githubusercontent.com/zavoryn/java-notes/f315b351cb1970442afcff9daa351844b0b60d17/%E5%85%AB%E8%82%A1/agent/%E8%AE%BA%E6%96%87/Don't%20Build%20Multi-Agents.md（取用 2026-10-12；副本含完整英文段落與原始 URL/作者標注）。續篇 https://cognition.com/blog/multi-agents-working（2026-04-22）全文取自 https://raw.githubusercontent.com/BobYeger/state-of-agents/16d41e42519797863f145f802eb2fb2b38c870a0/raw/articles/cognition-multi-agents-whats-actually-working.md（取用 2026-10-12）。

- **主張：可靠性的核心是 context engineering，而非 prompt engineering**："At the core of reliability is Context Engineering." / ""Context engineering" is the next level of this. It is about doing this automatically in a dynamic system. It takes more nuance and is effectively the #1 job of engineers building AI agents." (c) 第一手軼事（Devin 團隊）。— [Cognition 2025 via mirror](https://cognition.ai/blog/dont-build-multi-agents)
- **原則 1**："Share context, and share full agent traces, not just individual messages"。(a) 防：子 agent 只收到子任務描述、誤解原任務（Flappy Bird 例：子 agent 1 做出 Super Mario 風背景）。— [同上](https://cognition.ai/blog/dont-build-multi-agents)
- **原則 2**："Actions carry implicit decisions, and conflicting decisions carry bad results"。(a) 防：即使共享前文，兩個並行子 agent 仍會做出風格不一致的產物——"The actions subagent 1 took and the actions subagent 2 took were based on conflicting assumptions not prescribed upfront."。— [同上](https://cognition.ai/blog/dont-build-multi-agents)
- **架構結論**："I would argue that Principles 1 & 2 are so critical, and so rarely worth violating, that you should by default rule out any agent architectures that don't abide by them." / "The simplest way to follow the principles is to just use a single-threaded linear agent"。長任務解法："we introduce a new LLM model whose key purpose is to compress a history of actions & conversation into key details, events, and decisions. This is *hard to get right.*"（Cognition 曾為此 fine-tune 小模型）。— [同上](https://cognition.ai/blog/dont-build-multi-agents)
- **對 Claude Code subagent 設計的解讀（2025-06 時點）**："it never does work in parallel with the subtask agent, and the subtask agent is usually only tasked with answering a question, not writing any code." 好處是調查過程不留在主 agent 歷史裡。— [同上](https://cognition.ai/blog/dont-build-multi-agents)
- **對多 agent 的整體判斷（2025）**："it is evident that in 2025, running multiple agents in collaboration only results in fragile systems. The decision-making ends up being too dispersed and context isn't able to be shared thoroughly enough between the agents."。— [同上](https://cognition.ai/blog/dont-build-multi-agents)

**續篇〈Multi-Agents: What's Actually Working〉（2026-04-22）**
- **立場修正而非反轉**："Our original observations still hold today for parallel-writer swarms: most of the sexy ideas in that space still don't see meaningful adoption. But we've found a narrower class of patterns that do: setups where multiple agents contribute intelligence to a task while writes stay single-threaded." / "As a consequence of principle 2, most multi-agent setups in the world are limited to "readonly" subagents, like web search subagents and code search subagents."。(c) 第一手軼事＋少量生產數據。— [Cognition 2026 via mirror](https://cognition.com/blog/multi-agents-working)
- **模式 1：乾淨 context 的 reviewer 迴路（有生產數據）**："even on PRs written by Devin, Devin Review catches an average of 2 bugs per PR, of which roughly 58% are severe (logic errors, missing edge cases, security vulnerabilities)." / "we found this technique to work best when the coding and review agents do not share any context beforehand." 理由是 context rot："The dedicated review agent gets to skip this extraneous context, only look at the diff, and re-discover any context it needs as it reads the code from scratch."；關鍵在溝通橋："does Devin properly use its broader context of user instructions, decisions, etc. to filter the bugs that come back from Devin Review? This is key to preventing looping, disobeying the user, doing work that is out of scope"。(c) 第一手＋數據（廠商自家產品、無方法細節）。— [同上](https://cognition.com/blog/multi-agents-working)
- **模式 2：smart friend（弱主模型諮詢強模型）**：SWE-1.5 當主模型時失敗——"The gap between it and Sonnet 4.5 was too wide in exactly the places that mattered for this setup: knowing when to escalate, knowing what to ask."；跨 frontier 模型（Claude＋GPT）有效，"The delegation logic becomes a capability router rather than a difficulty escalator."。— [同上](https://cognition.com/blog/multi-agents-working)
- **模式 3：manager Devin 拆派子 Devin（已上線但難）**："Getting it to feel coherent took more context engineering than we expected. Managers trained on small-scoped delegation default to being overly prescriptive, which backfires when the manager lacks deep codebase context. Agents assume they share state with their children when they don't." 無結構 swarm 是 "mostly a distraction"，實用形狀是 "map-reduce-and-manage"。— [同上](https://cognition.com/blog/multi-agents-working)
- **總結原則**："multi-agent systems work best today when writes stay single-threaded and the additional agents contribute intelligence rather than actions." / "The open problems are all communication problems."。— [同上](https://cognition.com/blog/multi-agents-working)

**與 Anthropic 並行路線的對照（第一手）**
- Anthropic〈How we built our multi-agent research system〉（2025-06-13，與 Cognition 文相隔一天）："Subagents facilitate compression by operating in parallel with their own context windows." 但明言 "not a good fit" 於 "some domains that require all agents to share the same context"，且 "most coding tasks involve fewer truly parallelizable tasks than research."。Cognition 續篇腳註也承認兩篇 "came to similar conclusions about the first area of applicability being in readonly agents"。— [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)；[Cognition 2026 via mirror](https://cognition.com/blog/multi-agents-working)
- Anthropic C 編譯器的 16 agent 並行之所以成立：任務是「大量彼此獨立的失敗測試」且 verifier 近乎完美；一旦遇到不可切分的 kernel 編譯，就出現 Cognition 預言的衝突——"Every agent would hit the same bug, fix that bug, and then overwrite each other's changes."。— [Anthropic](https://www.anthropic.com/engineering/building-c-compiler)
- Claude Code 官方文件同樣只推薦「分離 context 的審查者」而非並行寫入："A fresh context improves code review since Claude won't be biased toward code it just wrote."；並警告過度審查："A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do."。— [Claude Code docs](https://code.claude.com/docs/en/best-practices)

### Inferences
- 三方（Cognition、Anthropic、Claude Code 文件）在 2026 年收斂到同一條分界線：**唯讀/研究/切分明確且有 oracle 的工作可並行；帶隱性設計決策的寫入必須單線程；審查者必須乾淨 context**。對「單一服務、單一領域」的交付 harness，最安全的形狀是：一個 writer＋一個獨立 reviewer（不共享 context）＋唯讀的研究子 agent。
- Cognition 的「compress key details, events, and decisions」與 Anthropic 的 progress 檔、OpenAI 的 exec-plans decision log 是同一需求（把決策而非只把事實傳給下一個 context）的三種實作。
- Cognition 對 demo 的批評（簡單可驗證準則 vs 需要擴展人類品味）給出「領域窄化為何是自主化前提」的理論基礎：窄領域更可能寫出近乎完美的 verifier。

### Gaps
- cognition.ai 原文無法直接開啟；引文來自 GitHub 保存副本（兩篇皆含原始 URL 與作者，結構完整），未逐字比對原頁。
- 「2 bugs per PR、58% severe」無樣本數、時間範圍與判定方法——廠商自述。
- Cognition 的 compressor fine-tune 效果無公開數據 — `查無實證`。

---

## 4. SWE-agent（ACI，NeurIPS 2024）確立了什麼？後續工作（mini-SWE-agent、OpenHands、Terminal-Bench harness 變異）補充了「harness vs 模型」多重要？

### Takeaway
SWE-agent 以同儕審查證據確立：**不改模型權重、只改介面**，就能讓 GPT-4 Turbo 在 SWE-bench Lite 上從 shell-only 的 11.0% 升到 18.0%（相對 +64%），四條 ACI 原則（簡單動作、緊湊動作、資訊充分但精簡的回饋、護欄加速恢復）每拆一條掉 2–8 個百分點。後續證據分兩路：mini-SWE-agent 顯示**模型變強後許多 ACI 技巧不再必要**（100 行、只用 bash、>74%），而 2026 年的 Terminal-Bench 觀察與 Anthropic 的基礎設施噪音研究顯示**同一模型換 harness 仍可差 7–20 個百分點，但其中一部分是執行環境與 run-to-run 噪音**——harness 很重要，但要小心把噪音誤認為 harness 效果。

### Cited Findings

**A. SWE-agent 論文（Yang, Jimenez, Wettig, Lieret, Yao, Narasimhan, Press；NeurIPS 2024；arXiv 2405.15793）** — 本環境無法開啟 arxiv/neurips；論文全文取自 GitHub 保存的論文結構化文字 https://raw.githubusercontent.com/solatis/claude-config/6e72bc29e542f82f7936673f175a7cca5eee7499/skills/prompt-engineer/papers/structure/2024-11-02%20SWE-agent%20-%20Agent-Computer%20Interfaces%20Enable%20Automated%20Software%20Engineering.md 與筆記 https://raw.githubusercontent.com/BlazStojanovic/knowledge-smith/main/notes/papers/2024-swe-agent.md（取用 2026-10-12）。(c) 同儕審查。

- **核心主張**："we introduce the concept of the agent-computer interface (ACI) and demonstrate how careful ACI design can substantially improve LM agent performance without modifying the underlying LM's weights." — [SWE-agent via mirror](https://arxiv.org/abs/2405.15793)
- **四條 ACI 原則（原文）**：
  1. "Actions should be simple and easy to understand for agents. Many bash commands have documentation that includes dozens of options. Simple commands with a few options and concise documentation are easier for agents to use, reducing the need for demonstrations or fine-tuning."
  2. "Actions should be compact and efficient. Important operations (e.g., file navigation, editing) should be consolidated into as few actions as possible. Efficient actions help agents make meaningful progress towards a goal in a single step."
  3. "Environment feedback should be informative but concise. High quality feedback should provide the agent with substantive information about the current environment state (and the effect of the agent's recent actions) without unnecessary details."
  4. "Guardrails mitigate error propagation and hasten recovery. Like humans, LMs make mistakes when editing or searching and can struggle to recover from these errors. Building in guardrails, such as a code syntax checker that automatically detects mistakes, can help agents recognize and quickly correct errors." — [同上](https://arxiv.org/abs/2405.15793)
- **主結果**："SWE-agent w/ GPT-4 Turbo achieves the best performance all-around, successfully solving 12.47% (286/2294) of the full SWE-bench test set and 18.00% (54/300) of the Lite split." / "An LM-friendly ACI's value is confirmed by SWE-agent's 64% relative increase compared to Shell-only, both with GPT-4 Turbo."（Shell-only 在 Lite 為 11.00%）。注意：摘要寫 "SWE-agent solves 10.7 percentage points _more_ instances than the baseline agent, which uses only the default Linux shell"，與表格 18.00−11.00＝7.0 pp 不一致——論文內部數字有出入，引用時應標明。— [同上](https://arxiv.org/abs/2405.15793)
- **消融（SWE-bench Lite，GPT-4 Turbo，% resolved，相對 18.0）**：edit 無 linting 15.0（−3.0）；無 edit 工具（純 bash）10.3（−7.7）；iterative search 12.0（−6.0）；無 search 工具 15.7（−2.3）；file viewer 30 行 14.3（−3.7）；整檔顯示 12.7（−5.3）；完整歷史 15.0（−3.0，預設只留最後 5 個 observation）；無示範 16.3（−1.7）。— [knowledge-smith 筆記](https://raw.githubusercontent.com/BlazStojanovic/knowledge-smith/main/notes/papers/2024-swe-agent.md)
- **三個對 harness 設計特別重要的觀察**："Human user interfaces are not always suitable as agent-computer interfaces."（模仿 Vim/VSCode 的逐筆搜尋反而比沒有搜尋工具更差，因為 agent 會窮舉每個結果直到耗盡預算）/ "Compact, efficient file editing is critical to performance." / "Guardrails can improve error recovery."（lint 攔截壞 edit：無 linting 掉 3 pp）。— [SWE-agent via mirror](https://arxiv.org/abs/2405.15793)
- **錯誤會級聯**："Any attempt at editing has a 90.5% chance of eventually being successful. This probability drops off to 57.2% after a single failed edit." / "Agents succeed quickly and fail slowly."（成功的 run 中位數 $1.21、12 步；失敗的平均 $2.52、21 步）。— [同上](https://arxiv.org/abs/2405.15793)

**B. mini-SWE-agent（同團隊，2025–2026；GitHub README 直接讀取）** — https://github.com/SWE-agent/mini-swe-agent
- 設計："Just some 100 lines of python for the agent class" / "Does not have any tools other than bash" / "Has a completely linear history" / "every action is completely independent (as opposed to keeping a stateful shell session running)"。動機："What if our agent was 100x simpler, and still worked nearly as well?" / "one year later, as LMs have become more capable, a lot of this is not needed at all to build a useful agent!"。成績："Scores >74% on the SWE-bench verified benchmark"（PyPI 頁標 Gemini 3 Pro 達 74%；2025-07 新聞為 Claude Sonnet 4 65%）。批評他人："Some agents are overfitted research artifacts. Others are UI-heavy frontend monsters."。(c) 第一手＋leaderboard 數據（非同儕審查）。— [mini-swe-agent README](https://raw.githubusercontent.com/SWE-agent/mini-swe-agent/main/README.md)

**C. 同一模型、不同 harness 的分數差異（2025–2026；多為二手轉述，原頁被封鎖）**
- arXiv 2606.20683（agent system and harness design survey）的 Terminal-Bench 公開提交分析：同一模型跨 harness 差距約 14–21 pp，例 Claude Opus 4.6 在 Claude Code 58.0% vs Meta-Harness 76.4%（差 18.4）；作者註明是觀察性而非隨機消融。— [arXiv 2606.20683](https://arxiv.org/pdf/2606.20683)（二手轉述，僅搜尋摘要）
- Terminal-Bench 2.1（2026-06）：GPT-5.5 在 Codex CLI 83.4% vs Terminus 2 76.4%。— [codex.danielvaughan.com](https://codex.danielvaughan.com/2026/06/11/terminal-bench-2-1-june-2026-benchmark-landscape-codex-cli-harness-engineering-model-scores/)（二手轉述）
- Kimchi（廠商）：GLM-5.2 跑 4 個 coding agent、89 題，差距 13 pp。— [kimchi.dev](https://kimchi.dev/blog/same-model-different-harness-terminal-bench)（廠商部落格、二手轉述）
- LessWrong 分析：Opus 4.5 四種 scaffold 相差 15 pp，Gemini 3 Pro 僅 4 pp（scaffold 敏感度因模型而異）。— [LessWrong](https://www.lesswrong.com/posts/terminal-bench-leaderboard-rankings-luck-or-skill)（社群分析、二手轉述）
- GitHub Copilot 團隊的跨 harness 評估：多數跨 harness 差異落在 ±1σ run-to-run 噪音內。— [GitHub Blog](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)（廠商、二手轉述）
- LangChain〈Improving Deep Agents with harness engineering〉（2026-02-17）：模型不變、只改 system prompt / tools / middleware / tracing / self-verification，Terminal-Bench 2.0 從 Top 30 進到 Top 5。— [LangChain](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)（廠商、二手轉述；僅見於 walkinglabs 參考索引）
- **Anthropic〈Quantifying infrastructure noise in agentic coding evals〉（Gian Segato，2026-02-05；直接讀取；第一手＋數據）**："Infrastructure configuration can swing agentic coding benchmarks by several percentage points"，可超過榜首模型間差距。Terminal-Bench 2.0 最高/最低資源配置差 6 pp（p<0.01）；基礎設施錯誤率 1x 5.8% → 3x 2.1% → 無上限 0.5%；1x→3x 分數在噪音內（p=0.40）；SWE-bench 5x RAM 僅 +1.54 pp。建議："specify both parameters per task, not a single pinned value."、低於 3 pp 的榜單差距應存疑、多日多次執行取平均。— [Anthropic](https://www.anthropic.com/engineering/infrastructure-noise)
- **Anthropic 評測定義**："When we evaluate 'an agent,' we're evaluating the harness _and_ the model working together."。— [Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

**D. OpenHands** — 本環境只能讀到 GitHub README（已改版為 Agent Canvas 產品頁），未含論文引用與 event-stream/sandbox 設計原則；論文（arXiv 2407.16741）無法開啟 — `查無實證`（未能取得一手內容）。— [OpenHands README](https://raw.githubusercontent.com/All-Hands-AI/OpenHands/main/README.md)

### Inferences
- SWE-agent 四原則在 2026 年的對應物：原則 1–2 → Claude Code 的少量高階工具與 mini-SWE-agent 的「只用 bash」（模型變強後，動作簡單性由模型自己補足）；原則 3 → Carlini 的「測試輸出是為模型設計」、OpenAI 的「lint 錯誤訊息注入修復指令」；原則 4 → Claude Code hooks 的確定性攔截、OpenAI 的結構測試。**ACI 原則沒有過時，而是從「編輯器層」上移到「repo/CI 層」**。
- 「harness 影響 7–20 pp」的觀察性數據與「基礎設施本身就能造成 6 pp 噪音」的實驗數據合併讀：harness 重要，但在自己的交付 harness 裡做 A/B 時，必須固定資源配置並多次執行，否則會把噪音當成 harness 改進。
- mini-SWE-agent 的存在是對「harness 元件有半衰期」（Anthropic 2026-03）的獨立佐證：2024 年值 7.7 pp 的 edit 工具，到 2025 年可以整個拿掉。

### Gaps
- 無法開啟 arXiv/NeurIPS 原頁；論文文字來自 GitHub 保存副本（結構與數字與多份獨立筆記一致）。
- Terminal-Bench 跨 harness 數據全部來自搜尋摘要，未能讀原文核對方法。
- OpenHands 論文與其 microagents / repo instructions 設計未能取得一手內容。
- 未找到任何對「長時程、多 PR、真實產品交付」的 harness 做對照消融的研究；現有量化證據全在單題 benchmark 層級。

---

## 5. 社群模式：Ralph Wiggum loop、Claude Code 官方最佳實踐、Factory Droids、Devin Knowledge/Playbooks、Hashimoto 的 harness engineering —— 各自體現什麼原則？作者自述之外有何證據？

### Takeaway
這些模式幾乎都在重複同一套原則的不同切面：**每次迭代用新鮮 context（Ralph）、把每個觀察到的錯誤轉成永久機制（Hashimoto、Claude Code 的 hooks/CLAUDE.md 修剪）、用可機械判定的檢查關閉迴圈（Claude Code 「給它一個能跑的檢查」）、知識按需載入而非常駐（Devin Knowledge 的 trigger、Agent Skills）**。作者自述之外的證據多半是「被他人採用」（OpenAI 明示採用 Ralph loop、Anthropic 將 Ralph 做成官方 plugin），而非獨立量測；Factory 與 Devin 的資料本環境無法取得一手文件。

### Cited Findings

**A. Ralph Wiggum loop（Geoffrey Huntley，2025-07-14）** — 原文 https://ghuntley.com/ralph/ 無法開啟，全文取自 GitHub 保存副本 https://raw.githubusercontent.com/celesteanders/harness/d83e523af8295b66b2a269d9511c51e84f7dba75/docs/research/250714_huntley_ralph_wiggum_technique.md（取用 2026-10-12）；操作手冊 README 直接讀取 https://github.com/ghuntley/how-to-ralph-wiggum 。
- **定義**："Ralph is a technique. In its purest form, Ralph is a Bash loop." 手冊版一行：`while :; do cat PROMPT.md | claude ; done`。— [Huntley via mirror](https://ghuntley.com/ralph/)；[how-to-ralph-wiggum](https://raw.githubusercontent.com/ghuntley/how-to-ralph-wiggum/main/README.md)
- **原則：接受「可預期地壞」，用迭代與調音修正而非追求一次正確**。"the technique is deterministically bad in an undeterministic world. Ralph can be done with any tool that does not cap tool calls and usage." / "Building software with Ralph requires a great deal of faith and a belief in eventual consistency. Ralph will test you." / "Each time Ralph does something bad, Ralph gets tuned - like a guitar."；「立牌子」比喻："one then tunes Ralph by adding a sign next to the slide saying "SLIDE DOWN, DON'T JUMP, LOOK AROUND,""。(a) 防：把 LLM 的隨機失敗歸咎於工具而不改環境。(c) 第一手軼事。— [同上](https://ghuntley.com/ralph/)
- **原則：一個迴圈只做一件事；主 context 當排程器；驗證只交給單一子 agent 以免反壓失控**。"To get good outcomes with Ralph, you need to ask Ralph to do one thing per loop. Only one thing." / "The name of the game is that you only have approximately 170k of context window to work with." / "Your primary context window should operate as a scheduler" / "only a single subagent should be used for validation"。— [同上](https://ghuntley.com/ralph/)
- **原則：backpressure——型別、測試、lint、掃描器都是拒絕壞生成的反壓；輪子要轉得快**。"Anything can be wired in as back pressure to reject invalid code generation." 並要求 agent 在測試旁寫下「為何這個測試重要」，因為未來迴圈沒有這段推理的 context。— [同上](https://ghuntley.com/ralph/)
- **失效模式（第一手）**：搜尋不確定導致重複實作——"This nondeterminism is the Achilles' heel of Ralph."；佔位實作——"Claude has the inherent bias to do minimal and placeholder implementations." / "The models have been trained to chase their reward function, and the reward function is compiling code."；"you'll wake up to a broken codebase that doesn't compile from time to time"；規格錯誤（lexer spec 定義同一關鍵字兩次）浪費一個月；TODO 計畫會過期，作者多次整個刪掉重生。— [同上](https://ghuntley.com/ralph/)
- **作者自設邊界**："There is no way this is possible without senior expertise guiding Ralph. Anyone claiming that engineers are no longer required and a tool can do 100% of the work without an engineer is peddling horseshit." / "This works best as a technique for bootstrapping Greenfield, with the expectation you'll get 90% done with it."；坦承 CURSED repo "is full of garbage, temporary files, and binaries."。— [同上](https://ghuntley.com/ralph/)
- **作者自述之外的證據**：(1) OpenAI 在正式工程部落格把自家 PR 完成迴路稱為 "effectively this is a Ralph Wiggum Loop"（見第 1 節）；(2) Anthropic 將其做成 Claude Code 官方 plugin（Stop hook 阻止結束、重餵同一 prompt、`--max-iterations`、exact-match 的 completion promise），README 列哲學 "Iteration > Perfection"、"Failures Are Data"、"Operator Skill Matters"、"Persistence Wins"，並列不適用情境：需要人類判斷/設計決策的任務、一次性操作、成功準則不明、production debugging。(c) 採用證據，非量測。— [anthropics/claude-code ralph-wiggum plugin](https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/ralph-wiggum/README.md)；(3) Huntley 文中引用 VentureBeat 標題「We Put a Coding Agent in a While Loop and It Shipped 6 Repos Overnight」（hackathon 報導，第三方但非受控）。— [Huntley via mirror](https://ghuntley.com/ralph/)

**B. Claude Code 官方最佳實踐（code.claude.com，2026 版；直接讀取）** — https://code.claude.com/docs/en/best-practices （2025-04-18 原文 https://www.anthropic.com/engineering/claude-code-best-practices 已 308 轉址至此）
- **一切最佳實踐的根**："Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills."。— [Claude Code docs](https://code.claude.com/docs/en/best-practices)
- **原則：給 agent 一個它能自己跑的檢查，否則你就是驗證迴路**。"Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal available, and you become the verification loop: every mistake waits for you to notice it." / "Give Claude something that produces a pass or fail, and the loop closes on its own." / "Have Claude show evidence rather than asserting success"。門檻等級：單 prompt → `/goal`（獨立 evaluator 每輪重檢）→ Stop hook（確定性阻擋結束）→ 驗證子 agent（"so the agent doing the work isn't the one grading it"）。失效命名："The trust-then-verify gap." / "If you can't verify it, don't ship it."。(c) 第一手（Anthropic 內部團隊實踐彙整）。— [同上](https://code.claude.com/docs/en/best-practices)
- **原則：CLAUDE.md 要短，像程式碼一樣維護與修剪；規則不被遵守通常是檔案太長**。"Keep it concise. For each line, ask: "Would removing this cause Claude to make mistakes?" If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" / "Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts." / "If you emphasize many lines, none of them stands out." / "The over-specified CLAUDE.md. If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise." → "Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook."；只放「廣泛適用」的內容，偶爾才需要的知識放 skills 按需載入。— [同上](https://code.claude.com/docs/en/best-practices)
- **原則：建議（advisory）與保證（deterministic）分層**。"Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens."。— [同上](https://code.claude.com/docs/en/best-practices)
- **原則：規格先行、新鮮 context 執行**。"Once the spec is complete, start a fresh session to execute it." / "The most useful specs are self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works." / "A clean session with a better prompt almost always outperforms a long session with accumulated corrections."。— [同上](https://code.claude.com/docs/en/best-practices)
- **原則：Writer/Reviewer 分 session；對抗式審查但要約束審查者**。"A fresh context improves code review since Claude won't be biased toward code it just wrote." / "A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering"。— [同上](https://code.claude.com/docs/en/best-practices)
- **無人值守的權限設計（Anthropic auto mode，2026-03-25）**：使用者核准 93% 的提示（"approval fatigue"）；auto mode "delegates approvals to model-based classifiers—a middle ground between manual review and no guardrails."；原則 "everything the agent chooses on its own is unauthorized until the user says otherwise."；連續 3 次或累計 20 次拒絕升級給人；"not a drop-in replacement for careful human review on high-stakes infrastructure."；量測：真實流量 FPR 0.4%、真實越權行為 FNR 17%（n=52）。(c) 第一手＋數據。— [Anthropic](https://www.anthropic.com/engineering/claude-code-auto-mode)

**C. Mitchell Hashimoto〈My AI Adoption Journey〉Step 5「Engineer the Harness」（2026-02-05）** — 原文 https://mitchellh.com/writing/my-ai-adoption-journey 無法開啟，全文取自 GitHub SimpRead 保存副本 https://raw.githubusercontent.com/askming/SimpRead/7249b46bccf3d11e384f28c7e8060318126dbf27/Saved_Reading/My%20Ai%20Adoption%20Journey%20Mitchell%20Hashimoto.md（取用 2026-10-12）。多份獨立筆記認為此文是「harness engineering」一詞的叫響者，早 OpenAI 六天。
- **定義**："I don't know if there is a broad industry-accepted term for this yet, but I've grown to calling this "harness engineering." It is the idea that anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again." / "The most sure-fire way to achieve this is to give the agent fast, high quality tools to automatically tell it when it is wrong."。— [Hashimoto via mirror](https://mitchellh.com/writing/my-ai-adoption-journey)
- **兩種形式**："Better implicit prompting (AGENTS.md)." ... "Each line in that file is based on a bad agent behavior, and it almost completely resolved them all."（Ghostty `src/inspector/AGENTS.md`）；"Actual, programmed tools."（截圖腳本、過濾測試等，並在 AGENTS.md 告知其存在）。總結："I'm making an earnest effort whenever I see an agent do a Bad Thing to prevent it from ever doing that bad thing again. Or, conversely, I'm making an earnest effort for agents to be able to verify they're doing a Good Thing."。(c) 第一手軼事（單人、單 repo）。— [同上](https://mitchellh.com/writing/my-ai-adoption-journey)
- **Step 2 的三條自學原則**："Break down sessions into separate clear, actionable tasks. Don't try to "draw the owl" in one mega session." / "For vague requests, split the work into separate planning vs. execution sessions." / "If you give an agent a way to verify its work, it more often than not fixes its own mistakes and prevents regressions."。— [同上](https://mitchellh.com/writing/my-ai-adoption-journey)
- **誠實的邊界**："I'm not [yet?] running multiple agents, and currently don't really want to." / "maybe effective at having a background agent running 10 to 20% of a normal working day."。— [同上](https://mitchellh.com/writing/my-ai-adoption-journey)
- **可檢驗的工件**：Ghostty 根目錄 `AGENTS.md` 約 45 行，規則如 "Prefer to run targeted tests with `-Dtest-filter`"、"Never create an issue"、"Never create a PR"——每條讀起來都是對過去錯誤行為的回應。(c) 第一手工件。— [ghostty AGENTS.md](https://raw.githubusercontent.com/ghostty-org/ghostty/main/AGENTS.md)

**D. Böckeler / Thoughtworks（martinfowler.com，2026-02-17 與 2026-04-02）** — 原頁無法開啟，僅二手轉述：將 harness 控制分為 **guides（feedforward，行動前：AGENTS.md、規則、codemod）** 與 **sensors（feedback，行動後：測試、靜態分析、LLM reviewer）**，每一項又分 **computational（確定性程式）** 或 **inferential（模型判斷）**；sensors 依成本分佈（本地→pre-commit→每週維護掃描）；列出開放問題：如何量測 sensor 效果、規則衝突、guides 隨模型進步而過期、markdown 檔案蔓延。— [chewcorp wiki 轉述](https://raw.githubusercontent.com/chewcorp/agentic-engineering-wiki/main/wiki/harness/guides-and-sensors.md)（二手轉述）

**E. Factory.ai Droids** — 僅搜尋摘要：Sequoia 專訪稱每個 Droid 有自己的 cognitive architecture 以平衡固定流程與適應性；第三方指南描述三級漸進自主（從多數變更需人工核准到完全自主，建議由低到高）。無法取得 Factory 一手文件 — `二手轉述／查無實證`。— [Sequoia](https://sequoiacap.com/?p=17663)；[sidbharath 指南](https://sidbharath.com/blog/factory-ai-guide/)

**F. Devin Knowledge / Playbooks（Cognition）** — docs.devin.ai 無法開啟，僅第三方指南轉述官方文件：Knowledge = 「trigger 描述＋短內容」，當前工作符合 trigger 時才被取回，可 pin 到無/單一/所有 repo；Playbooks = 可重複任務的自訂 system prompt；官方建議先讀 Knowledge 文件再決定是否需要 Playbook。體現原則：**按需觸發載入 vs 常駐**。— [fast.io 指南](https://www.fast.io/resources/devin-knowledge-guide.md)（二手轉述）。Cognition 的 Devin Review 數據見第 3 節。

**G. Sweep 等** — 本次未查得任何一手資料 — `查無實證`。

### Inferences
- Ralph、Hashimoto、Claude Code 文件、OpenAI 四者在「失敗→機制」上是同一條迴路，差別在機制的層級：Ralph 把它放在 prompt 的「牌子」、Hashimoto 放在 AGENTS.md 與腳本、Claude Code 區分 advisory（CLAUDE.md）與 deterministic（hooks）、OpenAI 再推到 custom lint 與 CI。**成熟度階梯可以直接寫成：prompt 牌子 → 規則檔 → 腳本工具 → hook/lint/CI 強制**，且文件只放「還沒升格成機制」的規則。
- Ralph 的「fresh context 每迴圈」與 Anthropic 的「每 session 乾淨交接」是同一招；差別是 Ralph 把狀態幾乎全部外置到 plan 檔與 git，代價是「每迴圈重燒規格 token」（Huntley 自己說 wasteful）。
- 「作者自述之外的證據」最強的是採用鏈：Huntley → OpenAI 工程部落格引用 → Anthropic 官方 plugin。這是社群模式少見的跨廠商背書，但仍不是對照量測。

### Gaps
- Factory、Devin、Sweep：無一手文件 — `查無實證`。
- Ralph 的「6 repos overnight」「wildest ROI」皆為轉述/軼事，無成本或品質量測。
- Böckeler 兩篇 Thoughtworks 文章無法開啟，框架描述來自二手。

---

## 6. 跨領域：(1)「repo 即 harness」；(2) 領域窄化作為自主化的前提；(3) 人類坐在哪裡；(4) harness 規則如何維護與修剪

### Takeaway
四個跨領域問題在一手來源中有一致答案：(1) **repo 必須是 agent 唯一的現實**（OpenAI「看不到就不存在」、Anthropic 以 git/progress 檔/JSON 當記憶、Ralph 的 plan 檔）；(2) **自主化的範圍等於「可寫出近乎完美 verifier」的範圍**（Carlini、Cognition 對 demo 的批評、Anthropic 用 evaluator 把主觀品質轉成可評分）；(3) **人類從「迴路內逐步核准」移到「迴路上」：排優先序、寫驗收準則、校準 evaluator、在需要判斷時被升級**（OpenAI、Anthropic auto mode、Rajasekaran）；(4) **規則檔要像程式碼一樣被 lint、修剪、升格，且每條規則都有半衰期**（OpenAI 的 doc-gardening agent 與「promote the rule into code」、Claude Code 的「刪掉或轉成 hook」、Anthropic 的「每個元件都是對模型缺陷的假設」）。

### Cited Findings

**(1) 環境即產品／repo 即 harness**
- OpenAI："From the agent's point of view, anything it can't access in-context while running effectively doesn't exist." / "building software still demands discipline, but the discipline shows up more in the scaffolding rather than the code." / "Our most difficult challenges now center on designing environments, feedback loops, and control systems"。— [OpenAI via mirror](https://openai.com/index/harness-engineering/)（第一手軼事）
- Anthropic（Carlini）的結論被摘要為：環境設計（測試、回饋、文件）比迴圈本身更重要；原文自我提醒 "I was writing this test harness for Claude and not for myself."。— [Anthropic](https://www.anthropic.com/engineering/building-c-compiler)（第一手軼事）
- Anthropic 評測定義："When we evaluate 'an agent,' we're evaluating the harness _and_ the model working together."。— [Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- Anthropic 工具觀："Tools are a new kind of software which reflects a contract between deterministic systems and non-deterministic agents."。— [Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)
- Ralph：plan 檔與 specs 是跨迴圈唯一狀態；手冊原則「Fresh context: each iteration starts clean and rebuilds state from the same files」。— [how-to-ralph-wiggum](https://raw.githubusercontent.com/ghuntley/how-to-ralph-wiggum/main/README.md)（第一手軼事）
- Simon Willison 轉述 Codex 模型與 harness 共同訓練（見第 1 節）：提示「repo 即 harness」的可移植性受模型—harness 耦合限制。（二手轉述）

**(2) 領域窄化作為自主化的前提**
- Carlini："it's important that the task verifier is nearly perfect, otherwise Claude will solve the wrong problem."；並行成功的前提是大量獨立失敗測試＋GCC oracle。— [Anthropic](https://www.anthropic.com/engineering/building-c-compiler)（第一手軼事）
- Cognition："These are exciting but they all share a property most real software doesn't: a simple, verifiable success criterion. Real software requires a system that scales human taste and decision-making"。— [Cognition 2026 via mirror](https://cognition.com/blog/multi-agents-working)（第一手軼事）
- Rajasekaran：把主觀品質轉為四項可評分準則、權重與 few-shot 校準；evaluator "It is worth the cost when the task sits beyond what the current model does reliably solo."。— [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)（第一手軼事）
- OpenAI：架構上「每個業務領域固定分層、依賴方向被驗證」是把領域邊界機械化；"This behavior depends heavily on the specific structure and tooling of this repository and should not be assumed to generalize"。— [OpenAI via mirror](https://openai.com/index/harness-engineering/)
- Huntley：Ralph 自限於 greenfield，"with the expectation you'll get 90% done with it."；Anthropic plugin 列出不適用：成功準則不明、需要設計判斷、production debugging。— [Huntley via mirror](https://ghuntley.com/ralph/)；[plugin README](https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/ralph-wiggum/README.md)
- Anthropic 多 agent 研究："most coding tasks involve fewer truly parallelizable tasks than research."。— [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)

**(3) 人類坐在哪裡**
- OpenAI："Humans always remain in the loop, but work at a different layer of abstraction than we used to. We prioritize work, translate user feedback into acceptance criteria, and validate outcomes." / 自主清單 "Escalate to a human only when judgment is required" / "Humans may review pull requests, but aren't required to."。未知："We're still learning where human judgment adds the most leverage and how to encode that judgment so it compounds."。— [OpenAI via mirror](https://openai.com/index/harness-engineering/)（第一手軼事）
- Anthropic auto mode：93% 核准率顯示逐步核准失效；分類器原則 "everything the agent chooses on its own is unauthorized until the user says otherwise."；3 連續/20 累計拒絕才升級給人；"not a drop-in replacement for careful human review on high-stakes infrastructure."。— [Anthropic](https://www.anthropic.com/engineering/claude-code-auto-mode)（第一手＋數據）
- Rajasekaran：人類設計評分準則、讀 evaluator log 校準、在多個 iteration 中挑選。— [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Carlini：人類寫高層 spec、建 harness、寫 verifier、依失效設計新測試；並對結果 "uneasy"。— [Anthropic](https://www.anthropic.com/engineering/building-c-compiler)
- Cognition：reviewer 迴路的目標是 "most bugs are already resolved by the time a human opens the PR"；整體願景 "a coordinated system that scales human taste."。— [Cognition 2026 via mirror](https://cognition.com/blog/multi-agents-working)
- Huntley：人類「像鷹一樣盯著 TODO 清單」、早上判斷 `git reset --hard` 或寫救援 prompt；"engineers are still needed."。— [Huntley via mirror](https://ghuntley.com/ralph/)
- Claude Code 文件：人類在 `/verify`、計畫審核（plan mode）、對抗審查的「只報影響正確性的 gap」約束。— [Claude Code docs](https://code.claude.com/docs/en/best-practices)

**(4) harness 規則本身如何維護與修剪**
- OpenAI：單一大 AGENTS.md "rots instantly" 且 "hard to verify"；對策是把知識庫本身納入 lint/CI（"validate that the knowledge base is up to date, cross-linked, and structured correctly"）與 "doc-gardening" agent；規則升格路徑 "When documentation falls short, we promote the rule into code"；品味 "captured once, then enforced continuously"。— [OpenAI via mirror](https://openai.com/index/harness-engineering/)（第一手軼事）
- Claude Code 文件："Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts." / "If Claude already does something correctly without the instruction, delete it or convert it to a hook." / `/doctor` 會建議刪除可由程式碼推得的內容。— [Claude Code docs](https://code.claude.com/docs/en/best-practices)（第一手）
- Anthropic Agent Skills："When the SKILL.md file becomes unwieldy, split its content into separate files and reference them." / "Monitor how Claude uses your skill in real scenarios and iterate based on observations"。— [Anthropic](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Anthropic（Rajasekaran）："every component in a harness encodes an assumption about what the model can't do on its own."——模型升級後重測、拆除（sprints、context reset 皆被拆）。— [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)（第一手軼事）
- Anthropic 評測："Source realistic tasks from the failures you see." / "development accelerates as failures become test cases."——規則的來源與淘汰都應由失效案例驅動。— [Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- Hashimoto：每條 AGENTS.md 規則對應一次壞行為；Ghostty 根 AGENTS.md 僅約 45 行。— [Hashimoto via mirror](https://mitchellh.com/writing/my-ai-adoption-journey)；[ghostty AGENTS.md](https://raw.githubusercontent.com/ghostty-org/ghostty/main/AGENTS.md)
- Huntley：plan 檔是可拋棄的，"I have deleted the TODO list multiple times."；prompt 是「持續依觀察調音」的產物，照抄無效。— [Huntley via mirror](https://ghuntley.com/ralph/)
- Böckeler（二手）：開放問題包含 "guides going stale as models improve" 與 markdown 檔案蔓延。— [chewcorp wiki 轉述](https://raw.githubusercontent.com/chewcorp/agentic-engineering-wiki/main/wiki/harness/guides-and-sensors.md)

### Inferences
- 對「單一服務、單一有界領域、agent 交 MR、每日工作報告、人只在需要時審查」的目標，一手來源指向的最小 harness 形狀是：**(i) repo 內有 ~100 行入口地圖＋按需載入的領域知識與決策日誌；(ii) 領域邊界與架構不變量用 lint/結構測試/hook 機械化；(iii) 每個任務有可機械判定的完成準則（E2E 或 oracle），否則就不該自動化；(iv) 一個 writer＋一個不共享 context 的 reviewer；(v) 每個 session 乾淨開始、乾淨交接（可合併狀態＋進度檔）；(vi) 定期 GC agent 掃描漂移與文件過期；(vii) 人類做優先序、驗收準則、evaluator 校準，並只在升級時介入**。
- 「每日工作報告」在一手來源中最接近的對應是 OpenAI 的 exec-plans progress/decision log 與 Anthropic 的 claude-progress.txt——報告應是 harness 的副產品（從進度檔與 git log 生成），而不是另一個要維護的文件。
- 規則維護的共同隱含原則是「**規則有三種歸宿：被證明多餘而刪除、被升格為機械檢查、或留在文件裡等待下一次失效證明它仍需要**」；文件應只承載第三類。

### Gaps
- 沒有任何一手來源給出「規則修剪頻率／規則數量上限」的量化建議；~100 行（OpenAI）與 ~45 行（Ghostty）是兩個觀察值，不是研究結論。
- 「人類只在需要判斷時被升級」的判定機制，除 Anthropic auto mode 的分類器數據外，無人給出可操作的升級準則。
- 「每日工作報告」作為 harness 元件，未見任何一手來源專文討論 — `查無實證`。
- 本次因網域封鎖與搜尋額度耗盡，未能閱讀：Simon Willison 原文、HN 討論串、Böckeler 兩篇、LangChain harness 文、Terminal-Bench 變異分析原文、Factory/Devin 官方文件、OpenHands 論文、OpenAI 其他 Codex 文章。
