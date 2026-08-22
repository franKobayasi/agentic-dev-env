# Orchestrator 與 subagent 的分工：研究報告

> **文件性質**：研究參考，不是流程規則。這裡對照一手來源（Claude Code 官方文件、Anthropic engineering 原文、GitHub／OpenAI 官方文件）逐條檢驗一組關於「`ade-dev` auto 模式的 orchestrator 該怎麼派工、審查→修正要不要迴圈、orchestrator 的 context 有沒有價值」的設計建議；要落地的改動請寫進 `skills/ade-dev/SKILL.md`，並回頭標注採用了本文哪一組結論。
>
> 研究日期 2026-08-22。Claude Code 功能描述以官方文件該日內容為準（本機 `claude --version` 為 2.1.239）；文件標注了版本差異者，本文照抄版本號。含時效性的行為（subagent 巢狀深度預設、agent teams 的具名行為、Stop hook 上限）已於文中標注。
>
> **採用標注（2026-08-22）**：裁定表 1、2a、2b、2c（修正版）、3、4、5 已落入 `skills/ade-dev/SKILL.md`——第 3 關兩軸審查的派工規則（手動與 auto 同用）、第 4 關 auto 模式改派 subagent、auto-pilot 執行規則新增 orchestrator 可拋棄四條、煞車條款改為「經修正輪後仍有 blocking」。「不動 1–3」維持現狀，重評條件見 §2.7。
>
> 相關文件：[research-autopilot-readiness.md](./research-autopilot-readiness.md)（G1–G8 與煞車的原始依據）、[research-batch-safety.md](./research-batch-safety.md)（B1–B4、熔斷；本文 §2.6 延伸其 §2.3 的 worktree 結論）、[research-phase-sizing.md](./research-phase-sizing.md)。實戰資料：下游 ADE repo 兩顆任務的 `.ade-dev/<task>/notes.md`（共 15 個 Phase，全為手動模式）。

---

## 1. 結論先行

### 設計取向

三個從證據裡浮出來、直接決定方案形狀的事實：

1. **「審查有 blocking 即停」停在一個幾乎恆真的訊號上。** Claude Code 官方最佳實踐原話：「A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do.」（§3.6）官方給的處置不是停，而是**縮小 blocking 的定義＋讓實作者修掉再重審**；Anthropic 自己的長時程 harness 每個 sprint 的 QA 不過就回饋給 generator 再做，V2 跑了三輪 Build／QA（§3.2）。實戰 15/15 Phase 都有 blocking 且都是真問題，不是審查太嚴——是流程缺了修正這一步。
2. **Anthropic 每一套長時程 harness 都把 orchestrator 的記憶放在檔案，不放在 context。** 2025-11 的 harness 根本沒有常駐 orchestrator，每個 session 都是新 agent，靠 `claude-progress.txt`＋git log 接手（§3.1）；Research 系統的 lead agent 會「saving its plan to Memory」因為 context 超過 200K 會被截斷（§3.5）；context engineering 文把「sub-agent 只回傳 1,000–2,000 tokens 的濃縮摘要」寫成原則（§3.3）。Claude Code 本身的實作也一致：subagent「only its final message returns to the parent」，transcript 各自存檔，主對話 compaction 不影響 subagent（§2.3）。**「orchestrator 的長期 context 在設計上沒有價值」這個論點成立**；但要補一句——2026-03 的 harness 在 Opus 4.5 之後把 context reset 拿掉了、整場跑單一 session 靠 compaction（§3.2），所以「長駐 orchestrator 有害」沒有證據，「長駐 orchestrator 不必要」才有。
3. **兩次實戰事故都能在一手來源找到對應——一次是文件明寫的失效模式，一次是文件明寫的隔離邊界。** 具名 subagent 在 agent teams 開啟時會變成 teammate，而 teammate 完成只送「idle notification」不帶輸出，文件直說「An orchestration flow that waits on subagent results can stall」（§2.5）；根因在本機 `~/.claude/settings.json` 同時開了 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 與 `teammateMode: "tmux"`。worktree 的文件則明寫它隔離的是**檔案編輯**，`.git` 共用、對 port／DB 等執行期資源隻字未提（§2.6）——測試互踩不是 worktree 能解的。

### 裁定表

| # | 建議 | 裁定 | 一句話理由 | 依據 |
|---|---|---|---|---|
| 1 | auto 模式加「一輪修正」：blocking → 派 subagent 修一輪 → 重審 → 仍 blocking 才 `halted: review-blocking` | **支持，並修正細節** | 官方文件明寫審查者幾乎必報 gap、且實作 session「can fix them and re-review」；Anthropic harness 跑 3 輪；業界（GitHub／Codex）是人觸發修正、無自動輪數。定 **1 輪為預設、上限 2**，修正者**續用原 worker**（SendMessage resume，文件保證保留完整 context），重審換**新的乾淨審查者** | §3.6、§3.2、§3.4、§4、§2.2 |
| 2a | orchestrator 每個 Phase 邊界重跑接手判讀、不憑記憶 | **支持** | Anthropic 三篇 harness／context 文都把「每個 session 起手先讀檔」當基本動作；Claude Code 文件：context 越滿表現越差、「/clear between unrelated tasks」。代價為零（接手判讀本來就存在） | §3.1、§3.3、§3.5、§3.6 |
| 2b | subagent 回傳固定短格式（done／halted＋原因碼＋規模三數字＋測試摘要），細節寫檔 | **支持** | Research 文：每個 subagent 要有「an output format」、大輸出「store their work in external systems, then pass lightweight references back」；context 文：回傳「often 1,000–2,000 tokens」；Claude Code 文件警告多個 subagent 回傳細節「can consume significant context」；Codex 文件同樣「Return summaries from subagents instead of raw intermediate output」 | §3.5、§3.3、§2.4、§4.2 |
| 2c | `compaction` 煞車明定為 worker 自報次數 | **部分支持 → 修正** | 自報可行但不可靠（compaction 本身就在刪記憶）。官方文件提供**確定性來源**：subagent transcript 檔會寫入 `compact_boundary` 事件（含 `preTokens`），且 `PreCompact` hook 在 subagent 內觸發時帶 `agent_type`。改為：**orchestrator 用 agentId 數 transcript 裡的 `compact_boundary`**，自報只當備援 | §2.3 |
| 3 | 審查者由 orchestrator 派，只給 diff＋spec＋phase-N.md，不由 worker 派 | **支持，但理由要換** | 前提「subagent 可能無法巢狀派 subagent」**錯了**：v2.1.219 起預設可巢狀 3 層（v2.1.217–218 曾預設為 1）。真正的理由有二：(a) 獨立性——官方「the agent doing the work isn't the one grading it」；(b) 保真——巢狀時「Only the top-level subagent's summary returns to you」，worker 派的審查報告 orchestrator 永遠看不到原文 | §2.1、§3.6、§3.2 |
| 4 | 第 4 關（測試審視）在 auto 模式交給乾淨 subagent | **支持** | harness 文：「agents tend to respond by confidently praising the work」、「Out of the box, Claude is a poor QA agent」；官方：fresh context 的審查者「sees only the diff and the criteria you give it, not the reasoning that produced the change」。實戰第 4 關抓到的兩條假綠，正是這類「自己寫的自己看不出」 | §3.2、§3.6 |
| 5 | 派工資源規則：審查者之間不得同時跑全套測試；派出後實際確認在跑 | **支持；且應擴及手動模式** | worktree 文件只隔離檔案，`.git` 共用、執行期資源無著墨；agent teams 文件要求「partition the work」。「確認在跑」直接對應文件的 stall 警告；具體修法是**不傳 `name`**（resume 用 agentId 即可）或在專案 settings 設 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0`。兩次事故都發生在手動模式，規則不該只寫在 auto | §2.5、§2.6、§6 |
| 不動 1 | 不把 in-session orchestrator 換成外部 session loop（Stop hook／`claude -p`／cron） | **支持（現階段），附重評條件** | 官方把 `/goal`、Stop hook、`/loop` 定位為「keep the current session running」，且 Stop hook 連續 block 8 次即被覆寫、`/loop` 7 天到期；B4 ≤ 4h 之下單 session 夠用。Anthropic 2025-11 harness 用的確是外部迴圈＋每 session 新 agent，但那是為了 Sonnet 4.5 的「context anxiety」，2026-03 版已移除。**重評條件**：orchestrator 實測出現 compaction、或單批要超過 4h | §2.7、§3.1、§3.2 |
| 不動 2 | 不合併 orchestrator 與 worker 成單一長 session | **支持** | context 文：「Rather than one agent attempting to maintain state across an entire project, specialized sub-agents can handle focused tasks with clean context windows」；harness 文的 generator／evaluator 分離是整篇的核心槓桿。注意：worker 本身可以長（Opus 4.6 連續 2h+），要分開的是**做的人與評的人** | §3.3、§3.2 |
| 不動 3 | 手動模式不動 | **部分支持** | 流程本身不動（15/15 證明有效，且與官方 Writer／Reviewer pattern 同形）；但建議 5 的兩條規則必須**同時寫進手動模式**，因為事故都在那裡發生 | §3.6、§6 |

### 1.1 推翻或修正的地方（明說改成什麼）

- **建議 1 的輪數與角色**：原建議「新開或續用原 worker 皆可」→ 改為**預設續用原 worker**。理由：官方文件明寫 resume 的 subagent「retain their full conversation history, including all previous tool calls, results, and reasoning」，而修 blocking 需要的正是「為什麼當初這樣寫」；新開 subagent 等於重付一次讀碼成本。重審則**必換新的乾淨審查者**（§3.6 的獨立性論點）。輪數：**1 輪預設，最多 2**——Anthropic 的 3 輪是整個 app 的 QA，我們的單位是 Phase（≤ 400 行），1–2 輪夠；超過就是規格或規劃問題，該停。
- **建議 2c 的訊號來源**：原建議「worker 自報」→ 改為 orchestrator 讀 `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` 數 `"subtype": "compact_boundary"`，自報只做交叉比對。
- **建議 3 的理由**：刪掉「subagent 可能無法巢狀」，換成獨立性＋保真兩條。
- **建議 5 的適用範圍**：原列在 auto 模式的派工規則 → 手動模式同樣適用，寫進第 3 關兩軸審查的派工說明。
- **不動 1 補一條重評條件**（見表）。

---

## 2. 面向一：Claude Code subagent 機制（查證日期 2026-08-22）

來源：[Create custom subagents](https://code.claude.com/docs/en/sub-agents)、[Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)、[Run agents in parallel](https://code.claude.com/docs/en/agents)、[Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees)、[Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents)、[Hooks reference](https://code.claude.com/docs/en/hooks)、[Keep Claude working toward a goal](https://code.claude.com/docs/en/goal)、[Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks)、[Hooks guide](https://code.claude.com/docs/en/hooks-guide)、[Orchestrate subagents at scale with dynamic workflows](https://code.claude.com/docs/en/workflows)、[Run Claude Code programmatically](https://code.claude.com/docs/en/headless)。

### 2.1 巢狀：預設可以，3 層

> "By default, a subagent can spawn subagents of its own, up to three layers below the main conversation. At the depth limit, Claude Code withholds the `Agent` tool from every subagent except a fork, so a subagent at the limit does its delegated work itself and returns one summary."

版本史（文件原文）：「v2.1.172 through v2.1.216: subagents could nest by default, up to five layers deep, and the limit couldn't be changed」；「v2.1.217 through v2.1.218: the limit defaulted to one, so a subagent couldn't spawn its own unless you raised it; v2.1.219 raised the default to three」。可用 `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` 調整，設 `1` 關閉。

文件給的巢狀用例恰好是審查：「such as a reviewer subagent that dispatches a verifier per finding, so the intermediate output never reaches your main conversation. **Only the top-level subagent's summary returns to you.**」

**對我們的映射**：建議 3 的前提「subagent 可能無法巢狀派 subagent」在現版是錯的（但曾在兩個版本短暫為真，且可被環境變數關掉——不該依賴）。真正要注意的是最後一句：若由實作 worker 派審查者，兩份審查報告只會以 worker 的轉述抵達 orchestrator；worker 是被審的一方，轉述必然有過濾。這比「能不能派」更根本。

### 2.2 續用：SendMessage resume，保留完整 context

> "Each subagent invocation creates a new instance rather than continuing an earlier one. To continue an existing subagent's work instead of starting over, ask Claude to resume it."
>
> "Resumed subagents retain their full conversation history, including all previous tool calls, results, and reasoning. The subagent picks up exactly where it stopped rather than starting fresh."
>
> "Claude uses the `SendMessage` tool with the agent's ID or name as the `to` field to resume it. `SendMessage` doesn't require agent teams to be enabled"
>
> "A completed subagent that receives a `SendMessage` auto-resumes in the background without a new `Agent` invocation."

限制（文件原文）：「The built-in Explore and Plan agents are one-shot and return no agent ID, so they can't be resumed」；「Resuming a subagent that already finished takes a fresh slot without checking the limit」；resume 後的 subagent 對父 agent 的訊息「treats messages from the agent that launched it as normal task direction, including mid-task course corrections」（v2.1.198 起）。

**對我們的映射**：建議 1 的「修一輪」有現成機制——orchestrator 拿到 worker 的 agentId，把兩軸審查的 blocking 清單 SendMessage 給它，它帶著完整的實作脈絡去修。**不需要具名**（agentId 就能 resume），這點直接消掉 §2.5 的事故來源。Worker 要用 `general-purpose` 或自訂 subagent，不能是 Explore／Plan。

### 2.3 compaction 與回傳：各自獨立，父只拿最後訊息

回傳什麼：

> "Either way, intermediate tool calls and results stay inside the subagent; only its final message returns to the parent."（SDK subagents）
>
> "The parent receives the subagent's final message as the Agent tool result, but may summarize it in its own response."

compaction：

> "Subagents support automatic compaction using the same logic as the main conversation. Compaction triggers under the same conditions"
>
> "Compaction events are logged in subagent transcript files" —— 範例 JSON 為 `"subtype": "compact_boundary"`，`compactMetadata.trigger` 與 `preTokens`。
>
> "Main conversation compaction: when the main conversation compacts, subagent transcripts are unaffected. They're stored in separate files."

父 agent 能否觀察：回傳結果裡**沒有** compaction 資訊；但兩個確定性管道存在——(1) transcript 檔 `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` 的 `compact_boundary` 事件；(2) hooks 文件：`PreCompact`／`PostCompact` 的 matcher 為「what triggered compaction: manual, auto」，且 hook 輸入的 `agent_type` 欄位「Present when the session uses `--agent` or the hook fires inside a subagent」。

**對我們的映射**：建議 2c 改為 orchestrator 讀 transcript 數 `compact_boundary`（完成時有 agentId，路徑可推）；或加一個 `PreCompact` hook 把 `agent_type`＋時間 append 到 `notes.md`。Worker 自報只當交叉比對——被 compaction 刪掉記憶的 agent，對「我 compaction 過幾次」的自述本身就不可信。另外：「主對話 compaction 不影響 subagent transcript」也意味著 orchestrator 自己即使被壓縮，worker 的 transcript 仍可完整追溯——這是「orchestrator 可拋棄」的一個技術前提。

### 2.4 回傳量：官方明寫「只回摘要」

> "Use one when a side task would flood your main conversation with search results, logs, or file contents you won't reference again: the subagent does that work in its own context and returns only the summary."
>
> "Use a subagent to run the test suite and report only the failing tests with their error messages"
>
> Warning 原文："When subagents complete, their results return to your main conversation. Running many subagents that each return detailed results can consume significant context."

何時該用 subagent（文件清單）：「The task produces verbose output you don't need in your main context」、「The work is self-contained and can return a summary」。何時該留在主對話：「Multiple phases share significant context, such as planning, implementation, and testing」。

**對我們的映射**：建議 2b 有直接依據。每 Phase 的 worker 回傳應該是固定的短格式；AC 逐條的證據、測試輸出全文寫進 `notes.md`／`phase-N.md`，orchestrator 只拿結論。反面注意：「Multiple phases share significant context」那句是說**同一個 agent 內**的規劃→實作→測試不要拆成 subagent；我們的 Phase 之間刻意不共享 context（每 Phase 乾淨 subagent），這與文件並不衝突——Phase 的共享狀態已經在檔案裡。

### 2.5 具名 subagent → teammate → 靜默：文件明寫的失效模式

> "Claude can give a subagent a name by passing a `name` parameter on the Agent tool call, and may do so on its own, without asking you first."
>
> "In an interactive session with agent teams enabled, a subagent that Claude spawns from the main conversation with a `name` launches as a teammate instead, unless the call is a fork or passes `isolation` on the call itself."

teammate 與 subagent 回報方式不同（agent-teams 文件）：

> "Subagents: Claude receives the subagent's result when it completes."
> "Teammates: the idle notification reports that the teammate stopped, without its output."
> "**An orchestration flow that waits on subagent results can stall.** To make named subagents launch as subagents again, turn agent teams off by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to `0`"

顯示模式：「The default is `"in-process"`」；「The `"tmux"` setting enables split-pane mode and auto-detects whether to use tmux or iTerm2 based on your terminal」；「Split-pane mode requires either tmux or iTerm2 with the `it2` CLI」。非互動模式不受影響：「In non-interactive mode with the `-p` flag, including Agent SDK sessions, Claude doesn't spawn teammates, and a subagent that Claude names runs as an ordinary subagent even with agent teams enabled.」

**「沒有 tmux server 時 teammate 會怎樣」——無一手證據。** 文件只說 split-pane 模式「requires tmux」，以及 teammate 可能「stop after encountering errors instead of recovering」，沒有描述「tmux 未啟動 → teammate 從未啟動且無通知」這條路徑。

**對我們的映射**：實戰事故（傳 `name:` → 登記 tmux backend → 等一小時）的根因是本機 `~/.claude/settings.json` 同時有 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` 與 `teammateMode: "tmux"`。修法三選一，按侵入性排序：(1) 審查 subagent **不傳 `name`**（resume 用 agentId，§2.2）；(2) 專案 `.claude/settings.json` 設 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0`（文件說「rereads the variable each time Claude spawns a subagent」，不用重開）；(3) 把 `teammateMode` 改回 `in-process`。建議 5 的「派出後確認在跑」仍然值得留——文件自己承認 stall 是會發生的，而且 teammate 的 idle notification 不帶輸出，等通知等不到內容。

### 2.6 同一工作目錄多 agent 並行：worktree 只隔離檔案

> "Running each Claude Code session in its own worktree means edits in one session never touch files in another"
>
> "A worktree gets its own files and branch, but it shares the repository's `.git` directory, project-scope plugins, and saved permission approvals with the main checkout"
>
> "Worktrees handle file isolation."

Run-agents-in-parallel 頁的選型問題：「Do the tasks touch the same files? Isolate the work with worktrees. … Agent teams don't isolate teammates in worktrees, so partition the work so each teammate owns a different set of files.」

文件對 port、資料庫、測試 fixture 等**執行期共享資源**沒有任何描述。

**對我們的映射**：實戰的「三個 process 同時對同一顆 push-mode DB 做 schema sync → `42710 duplicate_object`」與「兩個 vitest 同 DB → boot 超時、測試標 skipped」都在 worktree 的隔離範圍之外，就算每個審查者各自一個 worktree 也會發生。建議 5 的規則（審查 prompt 明寫「不要跑全套、只跑單一 spec、跑之前確認沒有別人在跑」，或給獨立 DB）是唯一可行解，實戰 P9 起採用後「兩位審查者都沒有再遇到 P8 那種大量假紅」。這條與 `research-batch-safety.md` §2.3 的結論一致：B1 只保證檔案不相交，「它管不到共用的執行期資源」。

### 2.7 無人值守的驅動方式：官方各自的定位

`/goal` 頁的比較表（原文）：

| Approach | Next turn starts when | Stops when |
|---|---|---|
| `/goal` | The previous turn finishes, or an idle check-in comes due while background work keeps the goal waiting | A model confirms the condition is met or judges it impossible, or a turn fails on an error you have to fix, or you run `/goal clear` |
| `/loop` | A time interval elapses | You stop it, or Claude decides the work is done |
| Stop hook | The previous turn finishes | Your own script or prompt decides |

> "Three approaches keep the current session running between prompts."
>
> "`/goal` is a wrapper around a session-scoped prompt-based Stop hook."
>
> "If a subagent or a background shell command is still running when a turn ends, Claude Code skips the evaluation for that turn."

Stop hook 上限（hooks guide）：「Claude Code overrides a Stop hook after it blocks eight times in a row without progress.」可用 `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` 調高。`/loop`：「Tasks are session-scoped: they live in the current conversation and stop when you start a new one」，且有 7 天到期。

best-practices 對三者的取捨：「The prompt version works on any task today. The `/goal` and Stop hook versions are what let an unattended run finish correctly without you.」

Headless（`-p`）：文件把它定位為 CI／腳本用，「Loop through tasks calling `claude -p` for each」是 fan-out 遷移的建議，不是 orchestrator 的建議；`/goal` 也能在 `-p` 下跑：「Setting a goal with `-p` runs the loop to completion in a single invocation」。

Dynamic workflows：「A workflow script holds the loop, the branching, and the intermediate results itself, so Claude's context holds only the final answer.」比較表裡「Where intermediate results live」：subagents／skills／agent teams 都在「Claude's context window」或 task list，只有 workflows 在「Script variables」。

**對我們的映射**：官方沒有推薦任何一種當「長時間無人值守 orchestrator」的標準答案；三者都是「讓**當前 session** 繼續跑」的機制。這支持「不動 1」——我們的 orchestrator 本來就是當前 session，缺的不是驅動器。若日後需要，最貼近 ade-dev 的是 `/goal`（評估者是另一個模型、不是做事的那個，與兩軸審查同一哲學）而非 Stop hook 腳本；但 `/goal` 的評估只看「Claude's own output can demonstrate」的東西，不讀檔，與我們「狀態全在檔案」的設計有摩擦，需要 worker 把 plan.md 的 checkbox 狀態印進對話。Dynamic workflows 是另一個值得記的選項：它把 orchestrator 變成腳本、中間結果不進 context，正是「可拋棄 orchestrator」的極致形式，但代價是 Phase 間的判斷變成程式碼而非 agent 判斷——與 ade-dev「如何達成由 agent 自行決定」相違，現階段不採。

---

## 3. 面向二：Anthropic engineering 一手文章

每篇回答五個問題：orchestrator 長駐還是每 tick 重建？靠什麼記憶？evaluator 抓到問題後有無修正迴圈、幾輪、何時放棄？subagent 回傳有無壓縮／格式要求？

### 3.1 Effective harnesses for long-running agents（2025-11-26）

來源：[anthropic.com/engineering/effective-harnesses-for-long-running-agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

- **Orchestrator**：沒有。外層是 Agent SDK 的迴圈，每個 session 是一個新的 coding agent：「The core challenge of long-running agents is that they must work in discrete sessions, and each new session begins with no memory of what came before.」footnote 1：「We refer to these as separate agents in this context only because they have different initial user prompts. The system prompt, set of tools, and overall agent harness was otherwise identical.」
- **記憶**：全在檔案。「The key insight here was finding a way for agents to quickly understand the state of work when starting with a fresh context window, which is accomplished with the claude-progress.txt file alongside the git history.」每個 session 起手三步：`pwd`、「Read the git logs and progress files to get up to speed on what was recently worked on」、「Read the features list file and choose the highest-priority feature that's not yet done to work on」。
- **compaction 不夠**：「However, compaction isn't sufficient. … This happens even with compaction, which doesn't always pass perfectly clear instructions to the next agent.」
- **修正迴圈**：沒有獨立 evaluator；靠「Self-verify all features. Only mark features as 'passing' after careful testing」。失效模式表裡「Claude marks features as done prematurely」的解法就是自驗。
- **回傳格式**：不適用（無 subagent）。但 feature list 用 JSON 而非 Markdown：「the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files」。

**對我們的映射**：這篇是「可拋棄 orchestrator」最強的一手證據——它連 orchestrator 都沒有，每個 session 就是 ade-dev 的「任何 session 讀檔即可接手」。`plan.md` checkbox＋`notes.md`＝它的 `feature_list.json`＋`claude-progress.txt`。它也提醒一件事：我們的狀態檔是 Markdown frontmatter，文件明說模型對 Markdown 比 JSON 更容易誤改——`approved_by` 一經寫入不得修改的規則，靠的是指令而不是格式，這是已知弱點（`research-gate-integrity.md` 範圍）。

### 3.2 Harness design for long-running application development（2026-03-24）

來源：[anthropic.com/engineering/harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)

- **Orchestrator**：Agent SDK 腳本，不是 LLM：「I built the loop on the Claude Agent SDK, which kept the orchestration straightforward.」三個 agent 角色 planner／generator／evaluator。
- **context reset vs 長駐**：前一代用 context reset（「Context resets—clearing the context window entirely and starting a fresh agent, combined with a structured handoff … addresses both these issues」），理由是 Sonnet 4.5 的「context anxiety」；到 Opus 4.5「largely removed that behavior on its own, so I was able to drop context resets from this harness entirely. The agents were run as one continuous session across the whole build, with the Claude Agent SDK's automatic compaction handling context growth along the way.」
- **記憶／通訊**：檔案。「Communication was handled via files: one agent would write a file, another agent would read it and respond either within that file or with a new file that the previous agent would read in turn.」
- **修正迴圈**：有，而且是整篇的核心。前端實驗：「I ran 5 to 15 iterations per generation」。全端 V1：「Each criterion had a hard threshold, and if any one fell below it, the sprint failed and the generator got detailed feedback on what went wrong.」V2（Opus 4.6、移除 sprint）：成本表列出 **Build (Round 1)→QA (Round 1)→Build (Round 2)→QA (Round 2)→Build (Round 3)→QA (Round 3)**，三輪。QA 第二輪仍抓到「Remaining gaps: Audio recording is still stub-only … Clip resize by edge drag and clip split not implemented」。放棄條件：文中沒有寫明輪數上限或放棄規則——**無一手證據**。
- **自評不可信**：「When asked to evaluate work they've produced, agents tend to respond by confidently praising the work—even when, to a human observer, the quality is obviously mediocre.」「Separating the agent doing the work from the agent judging it proves to be a strong lever to address this issue.」「Out of the box, Claude is a poor QA agent. In early runs, I watched it identify legitimate issues, then talk itself into deciding they weren't a big deal and approve the work anyway.」
- **evaluator 何時值得**：「The practical implication is that the evaluator is not a fixed yes-or-no decision. It is worth the cost when the task sits beyond what the current model does reliably solo.」
- **harness 設計原則**：「every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress testing, both because they may be incorrect, and because they can quickly go stale as models improve.」

**對我們的映射**：建議 1 的依據在這裡最直接——Anthropic 自己的 harness 從來不是「QA 不過就停」，而是「不過就回饋給 generator 再做」，輪數 3（全端）到 15（前端）。建議 4 的依據也在這裡：「agents tend to respond by confidently praising the work」＋「talk itself into deciding they weren't a big deal」，正是第 4 關若由寫測試的同一個 session 來做會發生的事。對「不動 1」：這篇證明長駐 session＋compaction 在 Opus 4.5+ 上可行，所以不必急著換外部迴圈；但也證明那是因為 worker 變強，不是因為 orchestrator 需要記憶。最後那句「every component in a harness encodes an assumption about what the model can't do」值得寫進 ade-dev 的設計原則——兩軸審查、修正輪、compaction 煞車都該能回答「它補的是模型哪個缺口」。

### 3.3 Effective context engineering for AI agents

來源：[anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

- **context rot**：「as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases.」
- **三種長時程技術**：「compaction, structured note-taking, and multi-agent architectures」。
- **Structured note-taking**：「the agent regularly writes notes persisted to memory outside of the context window. These notes get pulled back into the context window at later times.」「After context resets, the agent reads its own notes and continues multi-hour training sequences」。適用：「Note-taking excels for iterative development with clear milestones」。
- **Sub-agent 架構**：「Rather than one agent attempting to maintain state across an entire project, specialized sub-agents can handle focused tasks with clean context windows. The main agent coordinates with a high-level plan while subagents perform deep technical work … Each subagent might explore extensively, using tens of thousands of tokens or more, but returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens).」
- **compaction 的風險**：「overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later.」

**對我們的映射**：建議 2b 的數字（回傳 1,000–2,000 tokens）有出處；「不動 2」（不合併 orchestrator 與 worker）的原話是「Rather than one agent attempting to maintain state across an entire project」。ade-dev 的三種技術分配：`notes.md`／`plan.md`＝note-taking、每 Phase 乾淨 subagent＝multi-agent、compaction 只當煞車不當手段——與文末的適用表一致（「Note-taking excels for iterative development with clear milestones」正是逐 Phase 交付）。

### 3.4 Building effective agents

來源：[anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents)

- **Orchestrator-workers**：「a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results.」適用：「complex tasks where you can't predict the subtasks needed (in coding, for example, the number of files that need to be changed and the nature of the change in each file likely depend on the task)」。
- **Evaluator-optimizer**：「one LLM call generates a response while another provides evaluation and feedback in a loop.」適用兩個訊號：「first, that LLM responses can be demonstrably improved when a human articulates their feedback; and second, that the LLM can provide such feedback.」
- **停止條件**：「The task often terminates upon completion, but it's also common to include stopping conditions (such as a maximum number of iterations) to maintain control.」「Agents can then pause for human feedback at checkpoints or when encountering blockers.」
- **原則**：「finding the simplest solution possible, and only increasing complexity when needed.」「you should consider adding complexity only when it demonstrably improves outcomes.」

**對我們的映射**：ade-dev 的兩軸審查本質上是 evaluator-optimizer 少了 optimizer 那一步——文中定義這個模式是「in a loop」，而且「maximum number of iterations」是它列出的標準停止條件。建議 1 不是加新模式，是把一個做了一半的模式補完整。同時這篇也是「不動 1／2」的依據：最簡單可行的方案優先，外部迴圈在沒有證據前不加。

### 3.5 How we built our multi-agent research system

來源：[anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)

- **Orchestrator**：長駐的 lead agent，但**記憶外置**。流程圖說明原文：「The LeadResearcher begins by thinking through the approach and saving its plan to Memory to persist the context, since if the context window exceeds 200,000 tokens it will be truncated and it is important to retain the plan.」
- **context 逼近上限時**：「When context limits approach, agents can spawn fresh subagents with clean contexts while maintaining continuity through careful handoffs. Further, they can retrieve stored context like the research plan from their memory rather than losing previous work when reaching the context limit.」
- **派工格式**：「Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries. Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information.」
- **回傳壓縮**：「Subagents facilitate compression by operating in parallel with their own context windows, exploring different aspects of the question simultaneously before condensing the most important tokens for the lead research agent.」
- **大輸出走檔案**：「Subagent output to a filesystem to minimize the 'game of telephone.' … Subagents call tools to store their work in external systems, then pass lightweight references back to the coordinator. This prevents information loss during multi-stage processing and reduces token overhead from copying large outputs through conversation history.」
- **修正迴圈**：lead 判斷「whether more research is needed—if so, it can create additional subagents or refine its strategy」；無固定輪數。
- **同步執行的瓶頸**：「Currently, our lead agents execute subagents synchronously, waiting for each set of subagents to complete before proceeding. … the lead agent can't steer subagents, subagents can't coordinate, and the entire system can be blocked while waiting for a single subagent to finish searching.」
- **對 coding 的保留**：「most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time.」

**對我們的映射**：這篇同時支持建議 2a（lead 的計畫存在外部記憶，因為 context 會被截斷）、2b（每個 subagent 要有 output format；大輸出存檔、回傳 lightweight reference）、以及「可拋棄」的技術路徑（「spawn fresh subagents with clean contexts … careful handoffs」）。「game of telephone」那段是建議 3 的第二個理由（§2.1）：審查報告經 worker 轉述就是 telephone。對 coding 的保留那句也提醒：我們的 orchestrator 派工單位是 Phase 級、依序、不做即時協調——正好避開它說 LLM 不擅長的部分。

### 3.6 Claude Code best practices

來源：[code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)（`anthropic.com/engineering/claude-code-best-practices` 現已 redirect 至此頁，標題「Best practices for Claude Code - Claude Code Docs」）

- **context 是根本約束**：「Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills.」「If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run `/clear` and start fresh」。
- **驗證與四種把關強度**：「Once the check exists, decide how hard it gates the stop」——In one prompt／`/goal`／Stop hook（「Claude Code overrides the hook and ends the turn after 8 consecutive blocks」）／「By a second opinion: a verification subagent or a dynamic workflow that checks its own findings has a fresh model try to refute the result, **so the agent doing the work isn't the one grading it**.」
- **Adversarial review step**（整段是建議 1、3、4 的核心依據）：
  > "The longer Claude works unattended, the more an independent check matters before you count the work as done. A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it evaluates the result on its own terms."
  >
  > "Because the reviewer runs as a subagent, the implementing session receives the gaps directly and **can fix them and re-review** without you copying findings between windows."
  >
  > Callout："A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering … Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional."
- **Writer／Reviewer pattern**：「A fresh context improves code review since Claude won't be biased toward code it just wrote.」表格第三步是 Writer 收到「Here's the review feedback: [Session B output]. Address these issues.」
- **規格→新 session**：「Once the spec is complete, start a fresh session to execute it. The new session has clean context focused entirely on implementation」。

**對我們的映射**：這頁一次給了三件事。(1) 建議 1：官方寫的流程就是「reviewer 報 gap → implementing session 修 → re-review」，而且明說 reviewer 幾乎一定會報東西——所以「blocking 即停」在 auto 模式下的預期產出趨近零，不是實戰的偶然，是文件預告的結果。ade-dev 現有的「僅限影響正確性或違反明訂需求者」與 Callout 的建議逐字同義，保留。(2) 建議 3／4：「sees only the diff and the criteria you give it, not the reasoning that produced the change」就是「只給 diff＋spec＋phase-N.md」的出處。(3) 建議 2a：「start a fresh session to execute it」與 ade-dev 每 Phase `/clear` 同源。

---

## 4. 面向三：業界一手做法——審查→修正迴圈與停止條件

### 4.1 GitHub Copilot cloud agent（原 coding agent）

來源：[About Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)、[Review output from Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/review-copilot-prs)、[Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)、[About Copilot automations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations)

- **審查意見怎麼回到 agent**：人觸發。「To request changes from Copilot on its pull request, mention @copilot in a comment, or push commits directly to the branch.」
- **自動審查→自動修**：只到「交給 agent 開新 PR」，不是迴圈。「The ability to pass suggestions to Copilot cloud agent. This automates creating a new pull request against your branch with the suggested fixes applied. Passing suggestions to Copilot cloud agent is in public preview and subject to change.」
- **重審**：預設只審一次。「Unless Copilot has been configured to review each push to a pull request, it will only review a pull request once. If you make changes to the pull request after it has been automatically reviewed and you want Copilot to re-review it, you can request this manually.」
- **迭代上限**：沒有輪數；只有時間。「Each Copilot cloud agent session has a maximum execution time of 59 minutes. This is a hard limit that cannot be extended or bypassed.」
- **無人值守**：automations 的觸發器含「When a pull request is synchronized: the automation runs each time new commits are pushed to a pull request」——理論上可組成「push→審→修→push」迴圈，但文件沒有描述這種用法，也沒有迴圈保護。

### 4.2 OpenAI Codex

來源：[Subagents](https://developers.openai.com/codex/subagents)、[GitHub integration（Codex code review）](https://learn.chatgpt.com/docs/third-party/github)（`developers.openai.com/codex/cloud/code-review` 現 308 redirect 至此）

- **審查→修**：人觸發。「After Codex posts a review, you can ask it to fix issues in the same pull request by leaving another comment: `@codex fix the P1 issue`」「Codex starts a cloud chat with the pull request as context and can push a fix back to the branch when it has permission to do so.」自動重審與輪數上限：**無一手證據**（頁面未涵蓋）。
- **subagent 回傳**：「Return summaries from subagents instead of raw intermediate output.」「Context pollution: useful information gets buried under noisy intermediate output. Context rot: performance degrades as the chat fills up with less relevant details.」建議用法：「use parallel agents for read-heavy tasks such as exploration, tests, triage, and summarization. Be more careful with parallel write-heavy workflows, because agents editing code at once can create conflicts and increase coordination overhead.」；審查範例：「Spawn one subagent for security risks, one for test gaps, and one for maintainability. Wait for all three, then summarize the findings by category with file references.」

### 4.3 Cursor／Devin

未查到可直接回答「審查抓到後是否自動修正、幾輪」的官方頁面——**無一手證據**，不引。

**對我們的映射**：業界兩家的一手做法都是「審查者報、**人**決定要不要叫 agent 修」，沒有自動的 N 輪迴圈、也沒有輪數上限；唯一的硬上限是 session 時間（GitHub 59 分鐘）。這與建議 1 不衝突——他們的「人」在我們的 auto 模式裡不在場，所以要有一個有限的替代（1 輪）＋明確的停止（`halted: review-blocking`）。輪數上限在業界一手文件裡找不到數字；Anthropic 自家 harness 的 3 輪（§3.2）與 Stop hook 的 8 次（§2.7）是僅有的兩個數字，皆非針對「Phase 級審查」。**1–2 輪是工程判斷，不是實證**，理由見 §1.1。

---

## 5. 面向四：orchestrator 該可拋棄還是該長駐？

一手來源裡**沒有**「orchestrator 應長駐以維持全局觀」的主張。找到的全部是反方向或中性的：

| 來源 | 主張 | 方向 |
|---|---|---|
| effective-harnesses（§3.1） | 沒有 orchestrator；每 session 新 agent，靠 progress 檔＋git log 接手；「compaction isn't sufficient」 | 可拋棄 |
| harness-design（§3.2） | orchestrator 是 SDK 腳本；agent 間通訊走檔案；Opus 4.5+ 移除 context reset、單 session＋compaction 可行 | 中性：長駐**可行**，但記憶仍在檔案 |
| context-engineering（§3.3） | 「Rather than one agent attempting to maintain state across an entire project」；note-taking 讓 agent「after context resets, reads its own notes and continues」 | 可拋棄 |
| multi-agent research（§3.5） | lead 長駐但「saving its plan to Memory … since if the context window exceeds 200,000 tokens it will be truncated」；逼近上限時「spawn fresh subagents with clean contexts … careful handoffs」 | 長駐但記憶外置＝可拋棄 |
| Claude Code docs（§2.3、§3.6） | subagent transcript 獨立存檔、主對話 compaction 不影響；「performance degrades as it fills」；`/clear` between tasks | 可拋棄 |
| dynamic workflows（§2.7） | 「A workflow script holds the loop … so Claude's context holds only the final answer」 | 可拋棄的極致形式 |

**對我們的映射**：核心論點「設計已把狀態全放檔案，orchestrator 的長期 context 在設計上沒有價值；缺的是讓它可拋棄」——**成立**，且與 Anthropic 每一套 harness 的做法同形。唯一要修正的語氣：證據支持的是「不必要」，不是「有害」；harness-design 證明長駐＋compaction 在現行模型上能跑完 4 小時的 build。所以 2a 的「每 Phase 邊界重跑接手判讀」是零成本的保險，不是修 bug；而「不動 1」在 compaction 0/15 的資料下是正確的不作為。

---

## 6. 對實戰資料的對照

15 個 Phase（手動模式）的事實，與一手來源的對應：

| 實戰事實 | 對應來源 | 含意 |
|---|---|---|
| 15/15 Phase 兩軸審查都有 blocking，且都是真問題，由主 session 同 context 修掉 | §3.6「A reviewer prompted to find gaps will usually report some」；「the implementing session receives the gaps directly and can fix them and re-review」 | 手動模式已經在跑「修一輪」，只是沒寫成規則；auto 模式照現行規格會 15/15 停 |
| 修正者是寫碼的同一個 context，修得快且對 | §2.2 resume 保留「all previous tool calls, results, and reasoning」 | auto 模式用 SendMessage 續用 worker 可複製這個條件 |
| compaction 0/15 | §3.2 Opus 4.5+ 單 session 可行；§2.3 subagent transcript 可數 `compact_boundary` | 煞車門檻（> 2 次停）目前沒被測過；訊號來源改為 transcript 不改門檻 |
| 具名審查 subagent → tmux backend → 未啟動、等一小時 | §2.5 文件明寫 named→teammate、idle notification 不帶輸出、「can stall」；根因 `~/.claude/settings.json` | 修法：不傳 `name`／專案設 `AGENT_TEAMS=0`；「確認在跑」規則保留 |
| 主 session＋審查者同跑 vitest → DB boot 超時、測試標 skipped | §2.6 worktree 只隔離檔案 | 規則寫進審查 prompt（P9 起實證有效），手動與 auto 同用 |
| 第 4 關抓到兩條假綠（fallback 測試、ETag 筆數） | §3.2「confidently praising the work」、§3.6 fresh context「not the reasoning that produced the change」 | 建議 4 成立；手動模式第 4 關由主 session 做仍抓到，是因為人（Frank）介入反問；auto 無人時更需要乾淨 subagent |

---

## 7. 無一手證據清單（查過、沒找到，不猜）

- `teammateMode: "tmux"` 但 tmux server 未啟動時 teammate 的確切行為（是否靜默不啟動、是否有錯誤通知）——agent-teams 文件只說 split-pane「requires tmux」與 teammate「may stop after encountering errors」。
- 「審查→修正」的**輪數上限**數字——GitHub／Codex 無；Anthropic 只有實跑紀錄（3 輪、5–15 次迭代）沒有規則。
- Codex code review 是否在 `@codex fix` 後自動重審。
- Cursor／Devin 的審查→修正官方描述。
- `/goal` 評估者能否讀檔（文件明說「It doesn't run commands or read files independently」——這是反證，不是缺證據；列在此提醒若採 `/goal` 需讓 worker 把狀態印進對話）。
- 「orchestrator 長駐比可拋棄更好」的任何一手主張。

---

## 附：引用索引（一手來源，查證日期 2026-08-22）

Claude Code 文件（code.claude.com）：[sub-agents](https://code.claude.com/docs/en/sub-agents)、[agent-teams](https://code.claude.com/docs/en/agent-teams)、[agents](https://code.claude.com/docs/en/agents)、[worktrees](https://code.claude.com/docs/en/worktrees)、[workflows](https://code.claude.com/docs/en/workflows)、[goal](https://code.claude.com/docs/en/goal)、[scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks)、[hooks](https://code.claude.com/docs/en/hooks)、[hooks-guide](https://code.claude.com/docs/en/hooks-guide)、[headless](https://code.claude.com/docs/en/headless)、[best-practices](https://code.claude.com/docs/en/best-practices)、[agent-sdk/subagents](https://code.claude.com/docs/en/agent-sdk/subagents)、[agent-sdk/agent-loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)

Anthropic engineering：[effective-harnesses-for-long-running-agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)（2025-11-26）、[harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)（2026-03-24）、[effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents)、[multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)

GitHub：[about-cloud-agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)、[review-copilot-prs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/review-copilot-prs)、[code-review](https://docs.github.com/en/copilot/concepts/agents/code-review)、[about-automations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations)

OpenAI：[codex/subagents](https://developers.openai.com/codex/subagents)、[Codex GitHub integration](https://learn.chatgpt.com/docs/third-party/github)
