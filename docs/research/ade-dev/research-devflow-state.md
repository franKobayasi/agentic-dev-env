# 開發流程的狀態記錄方式：獨立狀態檔 vs 狀態內嵌

> **文件性質**：研究參考，不是流程規則。這裡整理的是「開發目錄的狀態該記在哪、依據是什麼」的證據盤點；決定後的規則請寫進 `ade-dev` skill，並回頭標注採用了本文哪一節。
>
> 研究日期 2026-08-16。引文保留英文原文。

## 1. 結論先行

### 建議：第三案「B 案 + frontmatter」——不開 `status.json`

具體說：**文件級生命週期狀態放 YAML frontmatter，項目級進度放 markdown checkbox，兩者都在工作文件本身，不另開 sidecar 狀態檔。**

不是「B 案贏了 A 案」這麼簡單。研究過程中最關鍵的發現是：**A 案的問題不在 JSON，在「兩份」**。下面第 2.1 節會看到，Anthropic 官方 harness 確實選了 JSON，理由也很明確；但他們的 `feature_list.json` **就是**那份計畫，沒有另一份 markdown checkbox 與它並存。他們是「單一真相，載體選 JSON」，不是「markdown 一份 + JSON 一份」。題目描述的 A 案（JSON 記 gate/簽核/phase 狀態，同時 plan.md 還有 checkbox）是 Anthropic 沒做的那種設計，它同時承擔了 JSON 的成本與雙份真相的漂移風險。

所以真正的問題是：**唯一那份真相要用什麼載體**。答案取決於誰讀誰寫——我們的 spec.md / plan.md 是**人要簽核、人要讀**的文件，人是主要讀者，agent 是主要寫者。這種組合下 markdown 本體 + frontmatter 是對的落點。

### 建議格式

**spec.md / phase-N.md 檔頭**（文件級狀態）：

```markdown
---
status: draft
---

# 實作規格：<需求名稱>
```

`status` 取值（沿用本 repo 既有詞彙，不新造）：

| 檔案 | 取值 | 意義 |
|---|---|---|
| `spec.md` | `draft` → `approved` | `approved` 即 ade-dev 第 1 關過關、此後凍結 |
| `plan.md` | `draft` → `approved` | `approved` 即第 2 關過關 |
| `phase-N.md` | `open` → `done` | 交付完成 |

**plan.md 本體**（Phase 級進度，維持現況不動）：

```markdown
---
status: approved
---

# Phase 地圖

- [x] Phase 1：<交付定義 1–3 行>
- [ ] Phase 2：<交付定義>（依賴 Phase 1）
```

**phase-N.md 本體**（Task 級收尾，維持現況不動）：checkbox 清單。

**查詢方式**（不需要新工具）：

```bash
rg '^status:' */spec.md */plan.md   # 各目錄卡在哪一關
rg -c '^- \[ \]' plan.md            # 還剩幾個 Phase
```

### 三條配套規則（缺了就會退化成兩份真相）

1. **Phase 狀態只寫在 `plan.md`**。`phase-N.md` 不重複記自己的 Phase 完成狀態——那正是 A 案漂移的成因，換個檔名一樣會漂。（`phase-N.md` 的 frontmatter `status` 是給「這份展開產物本身」用的，語意上與 plan.md 的 checkbox 重疊，若嫌重複，砍掉 `phase-N.md` 的 frontmatter、只留 plan.md checkbox 也完全成立。）
2. **格式逐字契約**。本 repo 已有先例：`knowledge/specs/README.md` 規定 `> 🚧 尚未實作（PRD: ...）` 的「格式必須逐字一致（工具與 skill 靠精確匹配移除）」。frontmatter 與 checkbox 沿用同一規格：`- [ ]` / `- [x]`，小寫 x，不用 `- [X]` 或 `~~刪除線~~` 表示完成。
3. **需要跨目錄彙總時，用產生的，不用手維護的**。要一份全域看板就從 markdown 掃出來重新產生（derived state），不要讓 agent 手動同步第二份檔案。這是 §4.1 的 SSOT 原理直接套用。

### 各主張的依據強度

| 主張 | 強度 | 出處 |
|---|---|---|
| 跨 session 狀態**必須**外部化到檔案，compaction 不夠 | **實證（強）**：官方踩坑後的設計 | Anthropic harness（§2.1） |
| 「兩份真相會漂移」 | **原理（強）**：DRY 的直接推論，四十年共識 | Hunt & Thomas（§4.1） |
| 大型枚舉清單（200+ 項）用 JSON 較不易被模型誤改 | **實證（中）**：官方明講，但無公開數字 | Anthropic harness（§2.1） |
| markdown checkbox 足以承載 spec-driven 流程的 Phase/Task 進度 | **各家實務收斂（中強）** | spec-kit（§3.1） |
| 結構化狀態要可靠，需要**變更介面**（CLI / tool），不能靠 LLM 手改 | **各家實務收斂（強）** | beads、Claude Code Task tools（§3.2、§3.3） |
| LLM 寫結構化欄位會拼錯 key，需要修復層 | **實證（中強）**：Claude Code 內建 key 修復 | Claude Code 官方文件（§5.1） |
| frontmatter 是比自創「狀態行」更標準的內嵌做法 | **各家實務收斂（強）** | MADR、Claude Code、Astro/Hugo/Obsidian（§4.2） |
| LLM 更新 markdown checkbox 比更新 JSON 欄位錯得少 | **查無直接實證** | 見 §5.3 |

---

## 2. 面向一：Anthropic 官方作法

### 2.1 Effective harnesses for long-running agents（2025-11-26）

這是整份研究裡最直接的一手來源，也是唯一明講「為什麼選這個格式」的官方文件。

**設計**：雙 agent harness。initializer agent 跑一次，把提示展開成 `feature_list.json`（claude.ai clone 的例子產出 **200+ 個 feature**，全部初始 `"passes": false`）、寫 `init.sh`、產 `claude-progress.txt`、建初始 commit。coding agent 之後被反覆喚醒，每次讀進度檔與 git log、做一個 feature、跑測試、更新進度、commit。

`feature_list.json` 的實際結構：

```json
{
    "category": "functional",
    "description": "New chat button creates a fresh conversation",
    "steps": [
      "Navigate to main interface",
      "Click the 'New Chat' button",
      "Verify a new conversation is created",
      "Check that chat area shows welcome state",
      "Verify conversation appears in sidebar"
    ],
    "passes": false
}
```

**選 JSON 的理由（原文）**：

> "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files."

**寫入權限被刻意鎖死（原文）**：

> "We prompt coding agents to edit this file only by changing the status of a `passes` field"

搭配 "It is unacceptable to remove or edit tests." 的強制指示。

**踩過的坑**：
- agent 想一次蓋完整個 app → context 爆掉
- **agent 過早宣告完成**（premature completion）→ 上面那條「只准改 `passes`」就是對策
- 進度沒留痕，下個 session 接不上
- agent 浪費 token 重新摸索怎麼跑起來 → `init.sh`
- 純 compaction 不夠：長工作要做**完整 context reset**，harness 拆掉 session、從結構化交接檔重建

**這對我們的意義（重要，別誤讀）**：

1. 「JSON 較不易被誤改」這句話的語境是**一份 200+ 項、只准翻布林值的機器清單**，不是「一份人要簽核的規格文件」。他們擔心的是模型改寫測試定義來作弊——所以把它鎖成不可改的形狀。我們的 plan.md 只有 3–8 個 Phase，且 Phase 定義本來就允許 agent 修訂（ade-dev 第 2 關明講「之後 agent 可修訂未來 Phase」），威脅模型完全不同。
2. **他們同時保留了 `claude-progress.txt`**——自然語言的敘事進度。所以官方作法其實是混合：**枚舉型檢核清單走結構化，敘事型脈絡走純文字**。對應到我們就是：checkbox 走 checkbox，`notes.md` 走散文，兩者本來就已經分開了。
3. **他們沒有兩份**。`feature_list.json` 沒有 markdown 分身。這是本文結論的支點。

來源：[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)（另有[第三方摘要](https://businessdatasolutions.github.io/ai-wiki/sources/2025-11-26-anthropic-effective-harnesses-long-running-agents)）

### 2.2 Effective context engineering for AI agents

同一系列，講外部記憶時的用詞明顯寬鬆得多：

> "Structured note-taking, or agentic memory, is a technique where the agent regularly writes notes persisted to memory outside of the context window."

> "Like Claude Code creating a to-do list, or your custom agent maintaining a NOTES.md file, this simple pattern allows the agent to track progress across complex tasks"

> "This strategy provides persistent memory with minimal overhead."

注意這裡的 "structured" 指的是「有組織地做筆記」，不是「用結構化資料格式」——舉的例子是 `NOTES.md`。文件不規定格式，還提到 Pokémon agent "without any prompting about memory structure, it develops maps"。

**與 2.1 的張力怎麼解**：兩篇不矛盾，它們講的是狀態的兩種型別。**要被機械判定的驗收清單**（會被拿來當「做完了沒」的裁判）值得鎖成結構化並限制寫入權限；**幫助理解與接手的脈絡**用 markdown 就好、開銷最小。我們的 gate 簽核與 Phase 完成偏前者，`notes.md` 偏後者。

來源：[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### 2.3 Claude Code 官方文件：memory 與 CLAUDE.md

Claude Code 的 auto memory 是**檔案系統上的純 markdown**，`MEMORY.md` 當索引、主題檔按需載入。這與本 repo `knowledge/README.md` 的 context 管理原則是同一套（導航短、細節深）。

兩個對本題直接有用的細節：

- **它用 YAML frontmatter 存元資料**：「When Claude writes a memory file that begins with YAML frontmatter, Claude Code records the write time in a `modified` frontmatter field as an ISO 8601 timestamp.」——也就是說，第一方產品在需要給 markdown 掛機器可讀欄位時，選的就是 frontmatter。
- **frontmatter 被視為非內文**：「YAML frontmatter and block-level HTML comments are stripped before the index is loaded, so they don't count toward the limits.」——frontmatter 在載入時與內文分離處理。這對「狀態不該被當成散文一起被模型重寫」是有利的性質。

另外 `.claude/rules/` 用 frontmatter 的 `paths:` 欄位做條件載入，Claude Code skills 用 frontmatter 的 `name` / `description`——第一方生態裡 frontmatter 是既定慣例，不是我們自創。

來源：[How Claude remembers your project](https://code.claude.com/docs/en/memory)

### 2.4 Claude Code 的 todo 機制：從 TodoWrite 到 Task tools

值得注意的演進方向。TodoWrite 是 session 內、易失的；新的 Task tools（`TaskCreate` / `TaskUpdate` / `TaskGet` / `TaskList`）是結構化、tool 中介的，並且**改變了更新粒度**：

| TodoWrite | Task tools |
|---|---|
| 一次呼叫重寫整個 `todos` 陣列 | `TaskCreate` 加一項、`TaskUpdate` 依 `taskId` patch 一項 |

從「整份重寫」走向「單項 patch」，正是為了避免整份重寫時把其他項目寫壞或寫丟——這一點對我們有直接啟示：**如果狀態要結構化，就要有「只動一個欄位」的介面**。Anthropic harness 用 prompt 約束達成同一件事（只准改 `passes`）。

但要注意：這是 **tool 中介**的結構化，模型呼叫 tool、不是直接編輯 JSON 檔案。我們的 A 案沒有這一層，是讓 agent 用 Edit tool 直接改 JSON——不是同一件事。

來源：[Todo Lists（Agent SDK）](https://code.claude.com/docs/en/agent-sdk/todo-tracking)

---

## 3. 面向二：主流 agent 開發流程工具的實際選擇

### 3.1 GitHub spec-kit：狀態內嵌，無 sidecar

spec-kit 是與我們流程最像的一個（spec → plan → tasks 三份 markdown）。它的選擇很乾脆：

`templates/tasks-template.md` 的任務行格式：

```
- [ ] [ID] [P?] [Story] Description
```

實例：`- [ ] T001 Create project structure per implementation plan`、`- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py`。

**沒有獨立狀態檔**——進度只存在於 checkbox 狀態本身。階段之間用 `**Checkpoint**: Foundation ready - user story implementation can now begin in parallel` 這種文字標記當閘門。

`templates/plan-template.md` 沒有 Progress Tracking 區塊，檔頭只有一行 metadata：`Branch: [###-feature-name] | Date: [DATE] | Spec: [link]`，以及 `GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.` 這種階段閘門敘述。

**旁證**：第三方寫了 [speckit-status](https://github.com/mkatanski/speckit-status) 這支 CLI，「parses those files to give you various visualization and tracking capabilities」。這是 checkbox 可機器解析的實證——不需要 JSON 也能做出進度儀表板。它也正好示範了 §1 的第 3 條配套規則：**彙總是 derive 出來的，不是手維護的第二份**。

值得注意的是 spec-kit **沒有公開說明為什麼**選 checkbox。所以這條算「實務收斂」而非「有論證的選擇」。

來源：[github/spec-kit](https://github.com/github/spec-kit)、[tasks-template.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/tasks-template.md)、[plan-template.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md)

### 3.2 beads（Steve Yegge）：結構化，但重點是「有資料庫與 CLI」

beads 是本題最強的反方論證，而且作者有明確的失敗經驗背書——他在燒掉 35 萬行 TypeScript 的 vibecoding 專案、掙扎 37 天之後做了這東西。

**他對 markdown 計畫檔的批評（原文）**：

> "Markdown TODOs are fine for humans who can hold context across sessions and manually track dependencies. But agents have context limits, no persistent memory, and work best with structured data and explicit semantics."

他描述的失效現象是 agent 的 "context dementia"，症狀是「lose track of long-horizon tasks」與產生 "hundreds of useless markdown plan files"。

**技術選擇**：SQLite 當工作儲存，issue 以 **JSONL** 落到 git。選 JSONL 的理由講得很具體——「The format is JSONL (JSON Lines). Why? Because it's an ideal format for Git. If you add a new comment to a task, you append a new line at the end of the file.」即：**為了 git merge 行為而刻意避開單一 JSON 物件**。

**這對我們的意義**：

1. 他抱怨的失效模式（幾百份散落、沒人更新、無法查詢相依）是**規模與紀律**問題，不是 markdown 語法問題。我們是一個開發目錄一份 plan.md、有 skill 強制流程、Phase 個位數——不在他描述的失效區間。
2. beads 之所以可靠，是因為 agent 透過 **CLI 指令**改狀態（`bd update` 之類），有 schema、有相依圖、有「哪些工作 ready」的查詢。**它不是「讓 agent 用文字編輯器改 JSON」**。A 案沒有這一層，拿 beads 當 A 案的背書是不成立的——beads 支持的是「結構化 + 變更介面 + 相依查詢」這整包，不是「多放一個 JSON 檔」。
3. 反過來說：如果哪天我們真的需要跨目錄的相依查詢與 ready-work 計算，正確做法是**裝 beads**，不是自己手刻 status.json。

來源：[Introducing Beads: A coding agent memory system](https://steveyegge.spicytakes.org/post/2025-11-12-introducing-beads-a-coding-agent-memory-system)

### 3.3 AGENTS.md（OpenAI Codex 起源，現由 Agentic AI Foundation 托管）

刻意選擇純 markdown、無結構：「single file, plain markdown, optional metadata, human-first, and tool-agnostic, with no directory structure, no special syntax, and no custom extensions」，「agents simply parse the text you provide without requiring specific fields or strict formatting rules」。

**但這是指令，不是狀態**——AGENTS.md 說的是「怎麼做事」，不是「做到哪了」。拿它論證狀態該用 markdown 是偷換概念。它在本文的價值只有一個：確認業界對這兩類內容有**清楚分工**——指令走自然語言 markdown，進度狀態走別的機制。

來源：[AGENTS.md](https://agents.md/)、[openai/codex#1624](https://github.com/openai/codex/issues/1624)

### 3.4 Aider：沒有流程狀態的概念

Aider 的持久化只有 `.aider.chat.history.md`（聊天記錄，markdown）與動態產生的 repo map。它沒有 spec/plan/task 的流程模型，**因此在本題上沒有立場可引用**。它唯一相關的貢獻是 §5.2 的格式基準測試。

來源：[Aider FAQ](https://aider.chat/docs/faq.html)、[Repository map](https://aider.chat/docs/repomap.html)

### 3.5 各家收斂結果

| 工具 | 狀態載體 | 內嵌/sidecar | 有無變更介面 | 有講理由嗎 |
|---|---|---|---|---|
| Anthropic harness | `feature_list.json` + `claude-progress.txt` | sidecar（但**唯一**一份，無 md 分身） | prompt 約束「只准改 `passes`」 | **有**，明講 |
| spec-kit | tasks.md checkbox | 內嵌 | 無 | 無 |
| beads | SQLite + JSONL in git | sidecar | **有**，CLI | **有**，明講 |
| Claude Code Task tools | 內部 task store | sidecar | **有**，tool | 部分 |
| Claude Code auto memory | markdown + frontmatter | 內嵌 | 無 | 部分 |
| AGENTS.md | 不適用（指令非狀態） | — | — | 有 |

**收斂的模式不是「JSON 贏」或「markdown 贏」，而是：凡選結構化的，都同時提供了受限的變更介面（CLI、tool、或 prompt 層的欄位白名單）。沒有變更介面的結構化狀態檔，各家都沒有人做。** 這正是 A 案的形狀。

---

## 4. 面向三：軟體工程原理

### 4.1 Single source of truth / derived state

經典出處是 DRY，Hunt & Thomas《The Pragmatic Programmer》（1999）：

> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

原始表述明確講的是 **knowledge**（知識），不是程式碼複製貼上——正好涵蓋「同一件事的狀態被記在兩個地方」這種情況。推論很直接：有兩份表述，就會有一份先被更新；一旦分歧，讀者無從判斷哪份對。

對應的正解是 derived state：認定一份為權威，其他都用產生的、可隨時重建的。這在資料庫正規化（避免儲存衍生資料）、前端狀態管理（「不要把可計算的值放進 store」）都是同一條原則的不同穿著。

A 案的 status.json 與 plan.md checkbox 若都由 agent 手動維護，就是典型的雙權威。要救它只有兩條路：**要嘛 JSON 是唯一權威、markdown checkbox 全部刪掉**（＝Anthropic 的做法）；**要嘛 markdown 是唯一權威、JSON 由程式產生**（＝speckit-status 的做法）。「兩邊都手寫、靠紀律同步」不是一個選項，它只是把漂移排程到未來。

來源：[Don't Repeat Yourself（Principles Wiki）](http://principles-wiki.net/principles:don_t_repeat_yourself)

### 4.2 frontmatter 是不是比「狀態行」更標準？

**是。** 這題答案相當明確。

frontmatter 不在 CommonMark 或 GFM 規格內，嚴格說是**慣例**而非標準。但它是一個支援面極廣的慣例：Jekyll、Hugo、Astro、Next.js、Obsidian（UI 上叫 Properties，底層就是 YAML frontmatter）、Pandoc、GitHub Docs 都認。Astro 的 content collections 甚至提供 schema 驗證。

在 agent 生態裡它已經是事實預設：
- **MADR**（ADR 的主流模板）用 frontmatter 記決策狀態：`status: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123"}`，外加 `date: {YYYY-MM-DD}`。這幾乎就是我們要的東西的現成規格。
- **Claude Code** 的 skills（`name` / `description`）、`.claude/rules/`（`paths:`）、auto memory（`modified:`）全部用 frontmatter。
- 本 repo 自己的 skills 也已經在用。

相較之下「檔案開頭一行『狀態：草稿』」是我們自創的格式，沒有任何既有 parser 認得，還混在正文裡（模型改寫段落時比較容易一起動到）。**frontmatter 拿到的是幾乎全部的結構化好處（固定位置、固定 key、現成 parser、與正文分離），成本只有兩行 `---`。**

一個實務注意：frontmatter 是 YAML，YAML 有它自己的坑（縮排、`yes/no` 被解讀成布林、需要引號的字串）。**對策是把欄位壓到極少且全部用簡單字串**——我們只有一個 `status`，踩不到 YAML 的地雷。欄位一多就會開始踩。

來源：[MADR](https://adr.github.io/madr/)、[YAML frontmatter 用途整理](https://devbytes.co.in/news/all-about-yaml-frontmatter-how-it-works-and-where-it-is-used)、[Validating YAML frontmatter with JSONSchema](https://ndumas.com/2023/06/validating-yaml-frontmatter-with-jsonschema/)

---

## 5. 面向四：LLM 讀寫可靠性

這一節是本研究**證據最弱**的部分，必須小心引用。

### 5.1 有直接證據的：模型會拼錯結構化欄位名

Claude Code 官方文件對 Task tools 有這段：

> "Claude Code repairs some close-but-incorrect key names before execution, mapping `id` or `task_id` to `taskId` and `active_form` to `activeForm`, but that repair is not reflected in the stream. Read `TaskUpdate` input fields defensively, as the samples below do, rather than assuming the canonical name is always present."

這是第一方承認：**模型輸出結構化欄位時會用錯 key，頻率高到值得內建修復層**。這是本節唯一一條直接、可靠、與「LLM 寫結構化狀態」直接相關的證據。

推論：一份沒有修復層、沒有 schema 驗證的手寫 `status.json`，會累積這類靜默錯誤——`phase_status` 寫成 `phaseStatus`，讀取端 `undefined`，而檔案仍是合法 JSON、grep 也看不出異狀。**這比 parse 失敗更糟，因為 parse 失敗會炸，欄位名錯不會。**

來源：[Todo Lists（Agent SDK）](https://code.claude.com/docs/en/agent-sdk/todo-tracking)

### 5.2 有實證但**不能直接套用**的：格式稅

兩份常被引用的證據，都必須加上很大的但書：

**(a) Aider 的 code-in-JSON 基準測試（2024-08）**：用 Exercism 133 題測，「all of the models did worse on the benchmark when asked to return code in a structured JSON response」，「LLMs write worse code when they're asked to wrap it in JSON」。關鍵歸因是「Models can reliably produce valid JSON, but code inside is more prone to syntax errors」——問題出在 JSON 字串裡的**跳脫與引號**，不是 JSON 本身。GPT-4o 只掉 0.4%（誤差內），Claude 3.5 Sonnet 與 DeepSeek Coder 掉最多。

> **但書（重要）**：這測的是「把程式碼塞進 JSON 字串」。我們的 status.json 裡只有 `"phase_2": "done"` 這種短枚舉值，**沒有跳脫問題**。這份證據**不能**直接推論到本題。

**(b)「Let Me Speak Freely?」（arXiv 2408.02442）與後續研究**：限制 LLM 輸出結構化格式會讓推理準確度下降（常被引為 10–15% 的「format tax」），且退化主要來自 prompt 層而非 decoder 層。

> **但書（重要）**：這測的是「在格式約束下**生成推理**」。更新一個既有狀態檔的欄位不是推理任務。同樣不能直接套用。

**誠實的結論**：這兩份是本題**最常被拿來當論據、但其實射偏**的證據。它們證明的是「叫模型一邊思考一邊產結構化輸出有代價」，不是「模型改 JSON 狀態檔比改 checkbox 容易出錯」。本文不把它們算進決策依據。

來源：[LLMs are bad at returning code in JSON](https://aider.chat/2024/08/14/code-in-json.html)、[Let Me Speak Freely?](https://arxiv.org/pdf/2408.02442)

### 5.3 查無實證的部分（明說）

以下問題**沒有找到可信的公開量化研究**：

1. **LLM 更新既有 markdown checkbox（`- [ ]` → `- [x]`）vs 更新既有 JSON 欄位，哪個出錯率高。** 這是本題最核心的實證問題，查無直接研究。目前能拿到的最接近證據只有 §5.1 的欄位名修復，以及 Anthropic 那句未附數據的 "less likely to inappropriately change or overwrite JSON files"。
2. **agent 忘記更新狀態的漏更率**，無論哪種格式。Anthropic 把 premature completion 與 undocumented progress 列為失效模式，但沒給頻率。Yegge 描述 agent 產生「hundreds of useless markdown plan files」，是軼事不是數據。
3. **Anthropic「JSON 較不易被誤改」的量化支持**。這句話是斷言，文中沒有附實驗、對照或數字。權重應該給到「有實務經驗的第一方判斷」，不是「實證」。
4. **frontmatter vs 正文狀態行**的 LLM 更新可靠度比較。查無任何研究。§4.2 推薦 frontmatter 是基於生態支援與位置隔離的**原理推論**，不是實證。

**因此**：任何宣稱「格式 X 讓 agent 少犯錯 N%」的說法，在本題範圍內都沒有依據。我們的決策應該建立在**結構性論證**（單一真相、有無變更介面、merge 行為）上，那些論證的強度遠高於格式可靠度的傳聞。

---

## 6. 失效模式對照表

比較三案：A（status.json + 保留 md checkbox）、B（純內嵌狀態行 + checkbox）、C（建議案：frontmatter + checkbox）。

| 失效面向 | A：sidecar status.json | B：內嵌狀態行 + checkbox | C：frontmatter + checkbox（建議） |
|---|---|---|---|
| **漂移** | **最差**。兩份權威，agent 更新其一忘記其二。漂移**靜默**——兩份都是合法檔案，沒有任何機制會報錯 | 無結構性漂移（單一真相）。殘留風險只有「忘記更新」，這是所有方案共有 | 同 B。額外好處：狀態欄位在正文之外，改內文時較不易被順手覆寫 |
| **parse 失敗** | JSON 語法錯會**整份不可讀**（狀態全滅）。更陰險的是欄位名寫錯——檔案合法、讀取端拿到 `undefined`、無人察覺（§5.1 有第一方證據） | 自創格式無 parser，「parse 失敗」不成立，但也代表**沒有任何工具會驗證格式**。狀態行寫成「狀態:草稿」（半形冒號）就靜默失配 | frontmatter 壞掉時**只有 frontmatter 壞，正文照常可讀**（降級溫和）。且有現成 YAML parser 可驗。單欄位純字串，踩不到 YAML 坑 |
| **人讀性** | 差。人要開兩個檔才知道全貌，且 JSON 的 phase key 與 md 的 checkbox 對不上時不知信誰 | 好。一個檔看完 | 好。frontmatter 是公認的「這是元資料」視覺訊號，GitHub/Obsidian 會渲染成表格 |
| **grep / 工具可查性** | 結構化查詢最強（`jq`），但**得先有人維護它才有效**。而且我們目前沒有任何需要 `jq` 的查詢需求——YAGNI | 可 grep 但格式自創，pattern 要自己維護、容易與正文誤配（正文提到「狀態」也會被抓到） | `rg '^status:'` 錨定行首，誤配率低。需要時任何 YAML/frontmatter 函式庫可直接讀。跨目錄彙總靠 derive（見 §1 規則 3） |
| **merge 衝突行為** | **最差**。兩條分支各改一個 phase 狀態 → 同一個 JSON 物件的鄰近行衝突，且解衝突必須產出合法 JSON，**半解決的 JSON 直接爛掉**。beads 正是為了躲開這點才選 JSONL append-only（§3.2） | 好。checkbox 各佔一行、分散在不同 Phase 段落，衝突面小；半解決的 markdown 仍可讀可渲染 | 同 B。frontmatter 的 `status:` 只有一行，兩人同時改同一份文件的生命週期狀態本來就該衝突（那是真衝突，該讓人看見） |
| **新 session 接手成本** | 要讀 2 個檔並自行判斷不一致時信誰 | 讀 1 個檔 | 讀 1 個檔；`status` 在最前面，讀前幾行就知道卡在哪關 |
| **agent 誤改風險** | Anthropic 觀察到 JSON 較不易被模型誤動（無數據） | 狀態行混在正文，模型重寫段落時可能一起改掉 | frontmatter 與正文分離，是三案中對「順手覆寫」抵抗力最好的 markdown 方案 |

**一句話**：A 案在**每一個**面向上要嘛與 C 打平、要嘛更差，唯一勝出的「結構化查詢」是我們現在不需要的能力。這不是勢均力敵的取捨。

---

## 7. 給決策者的取捨提醒

**什麼情況下該改用 A 案（或直接上 beads）**——以下任一成立時，重新評估：

1. 開發目錄數量成長到需要**跨目錄查詢**（「所有卡在規格關的目錄」「誰擋著誰」）——但此時正解是裝 beads，不是自刻 status.json
2. Phase 之間出現**非線性相依圖**，需要計算 ready work——checkbox 表達不了 DAG
3. 出現**自動化消費者**（CI gate、儀表板）需要穩定 schema——但先試試從 markdown derive（spec-kit 的 speckit-status 就是這樣做的）
4. 實際觀察到 agent 頻繁誤改 plan.md 的既有 Phase 定義——這是 Anthropic 那句話描述的真實風險，若真的發生，對策是把 plan.md 鎖成「只准改 checkbox」的 prompt 約束（＝Anthropic 的解法），而不是換成 JSON

**現在不該做的事**：為了 1–4 的可能性提前建 status.json。四項都還沒發生，而每一項發生時都有比 status.json 更好的解法。

---

## 附錄：全部一手來源

**Anthropic 官方**
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code：How Claude remembers your project（memory / CLAUDE.md）](https://code.claude.com/docs/en/memory)
- [Claude Agent SDK：Todo Lists（TodoWrite → Task tools）](https://code.claude.com/docs/en/agent-sdk/todo-tracking)

**工具與流程**
- [github/spec-kit](https://github.com/github/spec-kit) — [tasks-template.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/tasks-template.md)、[plan-template.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md)
- [speckit-status（第三方 checkbox parser）](https://github.com/mkatanski/speckit-status)
- [Steve Yegge：Introducing Beads](https://steveyegge.spicytakes.org/post/2025-11-12-introducing-beads-a-coding-agent-memory-system)
- [AGENTS.md](https://agents.md/)
- [Aider：Repository map](https://aider.chat/docs/repomap.html)、[FAQ](https://aider.chat/docs/faq.html)

**原理與格式**
- [DRY / Single source of truth（Principles Wiki，原始表述出自 Hunt & Thomas, The Pragmatic Programmer, 1999）](http://principles-wiki.net/principles:don_t_repeat_yourself)
- [MADR（ADR 模板，frontmatter `status` 欄位）](https://adr.github.io/madr/)
- [YAML frontmatter 生態整理](https://devbytes.co.in/news/all-about-yaml-frontmatter-how-it-works-and-where-it-is-used)
- [Validating YAML frontmatter with JSONSchema](https://ndumas.com/2023/06/validating-yaml-frontmatter-with-jsonschema/)

**格式與 LLM 表現（本文標為射偏、未計入決策）**
- [Aider：LLMs are bad at returning code in JSON](https://aider.chat/2024/08/14/code-in-json.html)
- [Let Me Speak Freely? A Study on the Impact of Format Restrictions（arXiv 2408.02442）](https://arxiv.org/pdf/2408.02442)
