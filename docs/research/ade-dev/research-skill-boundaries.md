# Skill 生態的分工邊界與 context engineering：研究報告

> **文件性質**：研究參考，不是流程規則。這裡整理的是「skill 之間怎麼引用、內容該住哪一份檔案、依據是什麼」的證據盤點；決定後的規則請寫進對應的 skill，並回頭標注採用了本文哪一節。
>
> 研究日期 2026-08-16。外部引文保留英文原文並附連結。
>
> **修訂（2026-08-22）**：T3-3「那個位置永遠是 skill」與 T3-3b「不拆 reference/」已被 `ade-dev-workflow/` 重構取代——規範的唯一可修改處改為 `knowledge/process/ade-dev-workflow/*.md`，skill 為純指標；§1.2 的單一位置原則不變。理由與預期痕跡見 [../CHANGELOG.md](../CHANGELOG.md)。
>
> **採用標注（2026-08-16）**：T3-1（改寫 ade-dev 第 5 關）、T3-2（ade-ship 查找鏈全文）、T3-3（歸屬原則套用於 README 兩則摘要）、T3-3b（不拆 reference/）與 §2.2 順手修已全數落版。本文所有對本 repo 現況的描述皆以 commit `ac1f297` 當時的檔案為準。

## 1. 結論先行

三個問題的定案，以及它們共用的那一條原則。

### 1.1 三個定案（可直接執行）

| # | 問題 | 定案 | 依據 |
|---|---|---|---|
| **T3-1** | ade-dev 第 5 關（第 78 行）指示用 `ade-feedback-upstream`，該 skill 不在注入面 | **改寫指令，不搬家**。機制層改良寫進 `notes.md`，並依 `ade-contribute` 在 ADE repo 開一則標題前綴 `[upstream-candidate]` 的 issue；是否送上游由 ADE repo 維護者事後用 `ade-feedback-upstream` 決定 | §2.3、§2.4 |
| **T3-2** | ade-ship 第 14 行查找鏈漏 GitHub 官方支援的位置 | **補齊為 §3.5 的全文**：GitHub 六個本地位置（三個單檔、三個目錄）＋ org `.github` fallback；GitLab 補 `Default.md` 大小寫不敏感、專案設定層優先於檔案層 | §3.1–3.4 |
| **T3-3** | SKILL.md 與 `knowledge/process/research-*.md` 重複、已漂移 | **規範性內容住 SKILL.md，描述性內容住 research 檔**，見 §1.2 的可檢查原則。已證實的漂移（G5 標號在 ade-dev 消失、README 第三份複述）須一併修 | §4.2–4.4 |
| **T3-3b** | ade-dev（116 行）是否該拆 `reference/` 子檔 | **不拆**。116 行是官方 500 行預算的 23%，且 ade-dev 的內容是「每次都要用的判準」，不是「按情境擇一的變體」——progressive disclosure 對前者是負收益 | §5 |

### 1.2 跨檔案內容歸屬：一條可檢查的原則

> **每一條「規範」（agent 必須遵守的判準、閾值、步驟、標號）只准有一個可修改處，那個位置永遠是 skill；其他任何檔案提到它時只能寫「指標」——去哪看、為什麼去——不得複述它的值。**
>
> **檢查方式**（DRY 的 acid test 的機械版）：任選一條判準，把它的值改掉，然後 `grep` 全 repo。命中 > 1 處即違規。

推論出的分工，三種角色不重疊：

| 載體 | 擁有什麼（唯一真相） | 禁止出現什麼 |
|---|---|---|
| **SKILL.md** | 被採用的判準、閾值、標號、執行步驟、煞車條件 | 證據、被否決的方案、數字的推導過程（只寫「依據見 `<path>`」） |
| **`knowledge/process/research-*.md`** | 證據盤點、方案比較、被否決的選項與理由、數字的出處與強度 | **最終判準的完整清單**。只能寫「本文 §X 的結論已被 `<skill>` 採用」 |
| **`README.md` 的 Skills 一覽** | 這支 skill 存在的理由、觸發時機、與其他 skill 的關係 | **任何判準的值**。「B1–B4」可以寫，「一批 ≤ 5 顆」不可以 |

這條原則直接來自 DRY 的原始定義，而 DRY 的作者明說它不只管程式碼：

> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."
> "DRY is about the duplication of knowledge, of intent. It's about expressing the same thing in two different places, possibly in two totally different ways. **Here's the acid test: when some single facet of the code has to change, do you find yourself making that change in multiple places, and in multiple different formats?** Do you have to change code and documentation, or a database schema and a structure that holds it, or…? If so, your code isn't DRY."
> — Thomas & Hunt, *The Pragmatic Programmer* 20th Anniversary Edition, ch. 9 "The Evils of Duplication"（[出版社公開節錄 PDF](https://media.pragprog.com/titles/tpp20/dry.pdf)）

「code 和 documentation 都要改」正是我們現在的狀況——改一個 gate 的定義，要動 SKILL.md、research 檔、README 三處。

### 1.3 跨界引用：一條可檢查的原則

> **一支 skill 的 body 裡出現另一支 skill 的名字，只有兩種合法形式：**
>
> **(a) 執行指令**（「依 `X` 執行」「走 `X` 流程」）——`X` 必須與本 skill 位於**同一注入面**，或該指令被明確的環境判斷句包住（「在工作目錄則依 `X`」）。
>
> **(b) 告知敘述**（「請 RD 之後在工作目錄跑 `X`」）——必須明寫**執行地點與角色**，讓讀者知道這不是叫當前 agent 現在做。
>
> **任何沒有地點限定的執行指令，指向不在同一注入面的 skill，即為缺陷。**

「注入面」在本 repo 有三種，由檔案系統決定，不需另設清單：

- `skills/<name>/`（非 symlink 目標以外）→ **工作目錄面**：init/update 注入各服務工作目錄的 `.claude/skills/`
- `.claude/skills/<name>/`（實體目錄）→ **ADE repo 面**：只活在本 repo
- `skills/<name>/` ＋ `.claude/skills/<name>` symlink → **兩面皆可**

機械檢查（可直接當 pre-commit 或人工抽查用）：

```sh
# 對每支注入面 skill，檢查它引用的 ade-* 是否也在注入面
inject=$(ls skills/)
for f in skills/*/SKILL.md; do
  s=$(basename $(dirname $f))
  for r in $(grep -o 'ade-[a-z][a-z-]*[a-z]' "$f" | sort -u); do
    [ "$r" = "$s" ] && continue
    echo "$inject" | grep -qx "$r" || echo "VIOLATION: $s -> $r"
  done
done
```

**2026-08-16 跑過一次的結果**：全 repo 只有一處違規，就是 `ade-dev -> ade-feedback-upstream`。其餘 6 處跨界提及都合法：`ade-add-service`／`ade-add-skill` 引用 `ade-contribute` 時全部被「只有 `.claude/ade/knowledge/` → 你在工作目錄」的環境判斷句包住（形式 a 的例外）；`.claude/skills/ade-prd-to-spec` 第 23 行的「提醒：RD 開發完成後**在工作目錄**跑 `ade-align-spec` 收尾」是標準的形式 (b)。

**這代表定案 T3-1 不是個案修補，而是把既有的隱性慣例寫成明文**——repo 裡九成的跨界引用早就照這條規則寫了，ade-dev 那一行是唯一的例外。

### 1.4 ade-ship 查找鏈全文

見 §3.5，可直接取代 `skills/ade-ship/SKILL.md` 的第 12–16 行。

---

## 2. 面向一：注入面與跨界引用

### 2.1 官方規格怎麼定義「skill 能引用什麼」

Agent Skills 開放標準（[agentskills.io/specification](https://agentskills.io/specification)，Anthropic 於 [anthropics/skills](https://github.com/anthropics/skills) 的 `spec/agent-skills-spec.md` 指向此處）對「引用」只規範了一件事，而且範圍只到 skill 目錄內：

> "**File references**
> When referencing other files in your skill, use relative paths from the skill root:
> ```
> See [the reference guide](references/REFERENCE.md) for details.
> ```
> Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains."

規格全文沒有任何「skill 引用另一支 skill」的機制——沒有 `depends_on`、沒有 `requires`、沒有跨 skill 的路徑解析。可宣告的欄位只有六個：`name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools`。

**推論**：在標準層面，「用 `ade-feedback-upstream`」這串字對 agent 而言不是引用，是**自然語言指令**。它會不會成功，完全取決於執行環境當下有沒有裝那支 skill。標準沒有提供任何讓它失敗時「乾淨地失敗」的機制——agent 只會找不到、然後自己想辦法（多半是硬幹或幻覺出一個流程）。

### 2.2 環境依賴的官方表達方式：`compatibility`

規格唯一為「這支 skill 需要特定環境」保留的欄位：

> "#### `compatibility` field
> The optional `compatibility` field:
> * Must be 1-500 characters if provided
> * Should only be included if your skill has specific environment requirements
> * Can indicate intended product, required system packages, network access needs, etc."
>
> "Most skills do not need the `compatibility` field."

本 repo 已經有一套等價且更省的做法：把限制寫進 `description`（研究當下 `ade-create-prd` 與 `ade-prd-to-spec` 都以「僅在 ADE repo 內使用」結尾；兩支後來改為兩地皆可用，限制句已移除，改在 body 第 0 步分流所在位置）。**`ade-feedback-upstream` 的 description 沒有這一句**——這是它會被誤引用的次要成因之一（一個只讀 metadata 的 agent 看不出它有地點限制）。

> **順手修**：`ade-feedback-upstream` 的 description 補上「僅在 ADE repo 內使用。」沿用既有慣例，不引進 `compatibility` 欄位。

### 2.3 為什麼是「改寫指令」而不是「搬家」

搬家（把 `ade-feedback-upstream` 移進 `skills/`，或加 symlink）看起來最直接，但三個理由都指向不該搬：

**理由一：它的輸入不在工作目錄。** 這支 skill 第一步就要讀 `package.json` 的 `ade.upstream`。init 注入工作目錄的是 `.claude/ade/knowledge/` 知識庫副本與 `.claude/skills/`，**沒有** ADE repo 的 `package.json`（README 第 39–44 行的 init 產出清單）。搬過去第一步就斷。

**理由二：它的鐵律在工作目錄無法執行。** 這支 skill 的核心約束是：

> 「**絕不回饋內容**：`knowledge/` 下的公司知識、服務資訊、規格、PRD 全屬機密，一個字都不能出現在上游 issue。送出前逐行檢查 issue 內文，公司名稱、服務名稱、內部詞彙都要抽換成通用範例」

在服務工作目錄執行 ade-dev 的 agent，context 裡裝的正是這次任務的實作規格、公司程式碼、服務名稱、內部詞彙。**讓這個 agent 直接對外部公開 repo 開 issue，是把最高洩漏風險的 context 接到最外部的輸出通道上。**「逐行檢查」這道防線由一個剛剛才在讀公司程式碼的 agent 自己執行，不是有效的防線。這條理由與 ADE 是否方便無關——它單獨就足以否決搬家。

**理由三：時機錯了。** 回饋上游是「一個機制被反覆使用後證明有效」才該做的判斷，不是單一任務收尾時做的。ade-dev 第 5 關的 agent 只見過這一次任務，沒有判斷「這是通則還是巧合」的資訊。這與官方最佳實踐對 skill 迭代的描述一致：改良應該來自**跨多次使用的觀察**，而非單次執行——

> "**Use the Skill in real workflows:** Give Claude B (with the Skill loaded) actual tasks, not test scenarios … **Repeat based on usage:** Continue this observe-refine-test cycle as you encounter new scenarios. Each iteration improves the Skill based on real agent behavior, not assumptions."
> — [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

### 2.4 改寫成什麼：復用 `ade-contribute`，不新增機制

`ade-contribute` 已經在注入面、已經被 README 定位為「知識回流的核心通道」，而且它**已經包含開 issue 的能力與查重步驟**（README 第 65 行：「先查 ADE repo 的 open issues／PRs 避免重複回流……沒有才開 issue 記錄缺口」）。機制層改良需要的三件事——記錄、查重、送進 ADE repo 讓人審——它全都有。

`ade-add-skill` 第 14 行早就把這條寫成通則了：

> 「skill 內需要『開 PR 回 ADE repo』的動作一律寫『依 `ade-contribute` 流程』，不要重複實作回流機制」

所以定案不是發明新流程，是讓 ade-dev 第 5 關**遵守本 repo 已經寫下的 meta 規則**。

**建議改寫（取代 `skills/ade-dev/SKILL.md` 第 78 行）：**

```markdown
- `notes.md` 收整成清單給人審視：關鍵發現、決策、流程摩擦與改良建議
- 清單中屬**機制層**的改良（skill 寫法、模板結構、流程設計，非本服務專屬），依 `ade-contribute`
  在 ADE repo 開一則標題前綴 `[upstream-candidate]` 的 issue，內文只描述機制、不含服務名稱與程式碼；
  是否回饋上游由 ADE repo 維護者判斷，不在本流程內執行
```

三處刻意的設計：

- **「依 `ade-contribute`」** 是同注入面的執行指令，符合 §1.3 形式 (a)
- **「不在本流程內執行」** 讓 agent 明確知道責任到此為止，不會嘗試找不存在的 skill
- **「內文只描述機制、不含服務名稱與程式碼」** 是把 `ade-feedback-upstream` 的鐵律**降級**成一道 ADE repo 內部的預過濾。真正的機密審查仍由 ADE repo 那一端執行，這裡只是不要讓明顯的洩漏進到 issue 裡。安全防線的位置沒有下移。

對應地，`ade-feedback-upstream` 的流程開頭應加一句「來源可以是 `[upstream-candidate]` issue」，讓兩端接得上。這是**指標**不是複述，符合 §1.2。

### 2.5 為什麼這個缺陷會發生：注入面在檔案系統上不可見

值得記一筆的根因：agent 在寫 ade-dev 時，看到的是 ADE repo 的目錄樹，`skills/` 與 `.claude/skills/` 並列，兩邊的 skill 對它而言一樣「存在」。**注入面的差別完全由 runner 的行為定義，在檔案本身沒有任何標記。** Claude Code 官方文件描述的載入規則也證實這一點——skill 能不能用只取決於它在哪個目錄，SKILL.md 內部沒有任何欄位可以宣告「我需要另一支 skill」：

> "Project skills load from `.claude/skills/` in the directory where you start Claude Code and in every parent directory up to the repository root."
> — [Extend Claude with skills](https://code.claude.com/docs/en/skills)

同一份文件也確認了 symlink 是官方支援的「兩面共用」手法，本 repo 的做法沒有走偏門：

> "A `<skill-name>` entry in the enterprise, personal, or project locations can be a symlink to a directory elsewhere on disk. Claude Code follows the symlink and reads `SKILL.md` from the target directory, and if the same target is reachable from more than one location, Claude Code loads the skill once."

**這代表這類缺陷會再犯**，除非有機械檢查。§1.3 的那段 shell 就是為此準備的——它便宜到可以每次改 skill 時順手跑一次。

---

## 3. 面向二：PR／MR 範本的查找鏈

### 3.1 GitHub 官方支援的位置（現況漏三個）

[GitHub 官方文件](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)（原始碼：[github/docs](https://raw.githubusercontent.com/github/docs/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository.md)）明列的單一範本位置有三個：

> "To make your pull request template visible in the repository's root directory, name the pull request template `pull_request_template.md`."
> "To make your pull request template visible in the repository's `docs` directory, name the pull request template `docs/pull_request_template.md`."
> "To store your file in a hidden directory, name the pull request template `.github/pull_request_template.md`."

多範本目錄同樣有三個：

> "To create multiple pull request templates and use the `template` query parameter to specify a template to fill the pull request body, type `.github/PULL_REQUEST_TEMPLATE/`, then the name of your pull request template."
> "You can also store multiple pull request templates in a `PULL_REQUEST_TEMPLATE` subdirectory within the root or `docs/` directories."

以及一條生效條件：

> "Templates are available to collaborators when they are merged into the repository's default branch."

**對照 ade-ship 現況第 14 行**（`.github/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE/` → `docs/pull_request_template.md`），漏掉的是：

1. **repo 根目錄的 `pull_request_template.md`** — 官方明列的三個位置之一，而且是對外開源專案最常用的（因為它「visible」，貢獻者看得到）
2. **`docs/PULL_REQUEST_TEMPLATE/` 目錄**
3. **repo 根的 `PULL_REQUEST_TEMPLATE/` 目錄**

漏掉第 1 項的實際後果最嚴重：一個把範本放在 repo 根的專案，ade-ship 會直接跳到「都沒有 → 用 ADE 預設」，發出一份不符合該專案慣例的 MR，而且沒有任何錯誤訊息。

### 3.2 GitHub 的兩個文件沒講清楚、但會咬人的點

**(a) 大小寫**：官方文件對單檔一律寫小寫 `pull_request_template.md`，對目錄一律寫大寫 `PULL_REQUEST_TEMPLATE/`，但**從未說明比對是否大小寫敏感**。實務上 `PULL_REQUEST_TEMPLATE.md`（大寫單檔）是極常見的寫法。

> **處理方式**：查找用大小寫不敏感的比對（`find . -iname 'pull_request_template.md'`），一步涵蓋兩種寫法，而不是把清單寫成六條。這是**證據不足時選較寬鬆的實作**，成本為零，且不會誤判——這兩個檔名不會撞到別的東西。本文不宣稱官方保證大小寫不敏感。

**(b) 多範本目錄不會自動套用**：官方文件對 `PULL_REQUEST_TEMPLATE/` 目錄的描述**永遠綁著 `template` query parameter**——它們不是「預設會被填進去」的範本，是「需要有人指定」的選項。所以 ade-ship 現行「多份時問人選哪份」的處理是**對的**，而且必須保留；不能因為只找到一份就當作預設範本自動套用——那份也可能只是三選一裡剛好唯一存在的那個。實際上「目錄裡只有一份」與「目錄裡有多份」對 GitHub 而言行為相同（都不自動套用），對人的意圖判讀則不同。折衷：目錄裡恰好一份時直接用並在回報中註明來源，多份才問人。

**(c) 組織層 `.github` repo 的預設**：[Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) 把 issue 與 PR 範本列在可預設的檔案裡：

> 可預設的檔案包含 "Issue and pull request templates *and* config.yml"
> 支援位置："The `.github` folder, the root of the repository, or the `docs` folder"
> "If no corresponding file is found in the current repository, GitHub will use the default file from the `.github` repository, following the same order of precedence."

**這份範本不在服務 repo 的 clone 裡。** ade-ship 目前完全不知道它存在。對有組織級 `.github` repo 的團隊，「本地找不到 → 用 ADE 預設」是錯的行為：正確答案就在 `<org>/.github` 裡。

> **處理方式**：只在 fallback 路徑上花這一次查詢——本地六個位置全空時，才 `gh api repos/<org>/.github/contents/.github/pull_request_template.md` 試一次。成本是「本來就要用預設範本」的那些情況多一次 API 呼叫，不影響常見路徑。

**(d) 精確度說明**：GitHub 的 PR 範本文件本身**沒有規定三個位置之間的優先順序**。上面引的 community health file 文件則明寫了 `.github` → root → `docs` 這個順序（"following the same order of precedence"）。本文採用該順序，並標記為**推論**：把同一 repo 內的順序外推自 fallback 情境的順序。實務上一個 repo 同時放三份的機率極低，這個推論的風險可以忽略。

### 3.3 GitHub CLI：`gh` 不會替你找範本

[gh pr create 官方手冊](https://cli.github.com/manual/gh_pr_create)只有一個相關旗標：

> "`-T`, `--template <file>` — Template file to use as starting body text"
> 範例："`gh pr create --template "pull_request_template.md"`"

手冊**沒有任何**關於自動探索或自動套用範本的敘述。

**這件事對 ade-ship 的設計有直接影響**：查找鏈不是「輔助資訊」，是**唯一**的範本來源。ade-ship 現行流程是「解析範本 → 依 diff 填寫 → `gh pr create`」，也就是它自己讀檔、自己填、用 `--body`／`--body-file` 送出——這個設計是對的，`--template` 旗標甚至用不到（它只提供空白起始文字，對非互動流程沒有價值）。查找鏈只要漏一個位置，就是靜默地掉到 ADE 預設。

### 3.4 GitLab：現況漏的是「檔案不是唯一來源」

[GitLab Description templates 官方文件](https://docs.gitlab.com/user/project/description_templates/) 的關鍵幾點：

> "create a new Markdown (`.md`) file inside the `.gitlab/merge_request_templates/` directory in your repository."
> "Create a merge request template named `Default.md` (**case-insensitive**) and save it in `.gitlab/merge_request_templates/`."
> "The `Default.md` template does **not** take priority over the default template set in project settings."

優先順序（GitLab 文件所述）：**專案設定的 default > 群組層 `Default.md` > 專案 repo 的 `Default.md`**，另有依 commit message 與分支名稱的繼承規則。專案設定層與群組／instance 層屬 Premium／Ultimate。

**對照 ade-ship 現況第 15 行**（`.gitlab/merge_request_templates/Default.md` → 該目錄其他 `.md`），漏掉的是：

1. **`Default.md` 大小寫不敏感**——`default.md`、`DEFAULT.md` 一樣生效，現行寫法會漏
2. **專案設定層的預設範本優先於檔案層**——這是 GitLab 文件明說的優先順序，而 ade-ship 目前把檔案層當最高優先。有設定層預設的專案，ade-ship 會用錯範本
3. **群組／instance 層範本**存在另一個 project 裡，本地 clone 看不到

第 2 點是真缺陷（會產出錯範本），第 3 點在成本效益上不值得追（要知道範本 repo 在哪、要有讀權限、還只影響 Premium 團隊）。

> **處理方式**：第 1 點用大小寫不敏感比對，成本為零。第 2 點在讀檔案層之前先查一次 `glab api projects/:id`，看 `merge_requests_template` 欄位是否非空——一次呼叫、一個欄位；非 Premium 團隊此欄永遠是空的，等於零影響。第 3 點不查，寫進「找不到就用 ADE 預設並在 MR 描述註明來源」的既有行為即可。

### 3.5 GitLab CLI：`glab --template` 只吃一個目錄

[glab mr create 文件](https://gitlab.com/gitlab-org/cli/-/raw/main/docs/source/mr/create.md)：

> "`--template string` — Name of a template in `'.gitlab/merge_request_templates/'` to pre-populate the description."
> "Templates are loaded from the local repository only."

`.md` 副檔名可省略。「local repository only」再次確認：設定層與群組層的範本，CLI 幫不上忙，要嘛走 API 要嘛放棄。

### 3.6 建議的查找鏈全文

以下可直接取代 `skills/ade-ship/SKILL.md` 第 12–16 行。刻意保持「找到第一個就停」的既有結構與詞彙，只補位置與兩個平台特例。

```markdown
## 2. 解析範本（找到第一個就停）

檔名比對一律**大小寫不敏感**（`find -iname`）——GitHub／GitLab 文件未保證大小寫敏感，實務上兩種寫法都常見。

**GitHub**（前六項在本地 clone 內，依序找）：

1. `.github/pull_request_template.md`
2. `pull_request_template.md`（repo 根）
3. `docs/pull_request_template.md`
4. `.github/PULL_REQUEST_TEMPLATE/` 目錄
5. `PULL_REQUEST_TEMPLATE/` 目錄（repo 根）
6. `docs/PULL_REQUEST_TEMPLATE/` 目錄
7. 前六項全空 → 查一次組織預設：`gh api repos/<org>/.github/contents/.github/pull_request_template.md`
   （也試 root 與 `docs/`；404 就是沒有，不重試）

目錄型（4–6）**GitHub 不會自動套用**，需人指定：恰好一份時直接用並在回報註明來源，多份時問人選哪份。

**GitLab**（依 GitLab 文件的優先順序，設定層高於檔案層）：

1. 專案設定的預設範本：`glab api projects/:id` 的 `merge_requests_template` 欄位非空 → 用它
   （Premium／Ultimate 才有此設定，其他方案此欄恆空，一次呼叫即可跳過）
2. `.gitlab/merge_request_templates/Default.md`（檔名大小寫不敏感）
3. `.gitlab/merge_request_templates/` 目錄下其他 `.md`（多份時問人）
4. 群組／instance 層範本存在另一個 project，本地查不到——不查，落到下一步

**都沒有** → 用本 skill 的 [`templates/mr.md`](templates/mr.md)（ADE 預設），並在回報中註明「未找到專案範本，使用 ADE 預設」。

範本一律由本 skill 自己讀檔填寫後以 `--body-file` 送出。`gh pr create --template` 只提供空白起始文字、
不做自動探索（官方手冊未描述任何自動套用行為），非互動流程用不到。
```

行數影響：原 5 行 → 約 24 行。ade-ship 從 24 行變約 43 行，仍遠低於 500 行預算（§5），不需要拆檔。

---

## 4. 面向三：跨檔案的重複與漂移

### 4.1 官方對「重複」講了什麼

Anthropic 的 skill authoring 文件沒有一節叫「不要重複」，但有三處把重複當成問題處理：

**(a) context 是公共財，重複是在花別人的預算：**

> "The context window is a public good. Your Skill shares the context window with everything else Claude needs to know … being concise in SKILL.md still matters: once Claude loads it, every token competes with conversation history and other context."

**(b) 反覆被讀的內容應該收回 SKILL.md，而不是兩邊都放：**

> "**Overreliance on certain sections:** If Claude repeatedly reads the same file, consider whether that content should be in the main SKILL.md instead."

**(c) 用詞不一致會傷害 agent 的解析：**

> "**Use consistent terminology.** Choose one term and use it throughout the Skill … Consistency helps Claude parse and follow instructions."

（b）特別值得注意：官方的處理方式是**把內容搬回單一位置**，不是「兩邊同步」。這與 §1.2 的原則同向。

### 4.2 本 repo 已經發生的漂移：G5 的標號消失了

`knowledge/process/research-autopilot-readiness.md` §1.1 的表格定義了 **G1–G8** 八個 gate，其中：

- **G5** ＝ 「規劃出的每個 Phase 在大小閾值內」（沿用 research-phase-sizing 的 400 行／10 檔，auto 模式加嚴到 > 3 檔要寫理由）
- **G6** ＝ 「Repo 規模在校準範圍內」（> 800 檔或 > 300K LOC 時 G5 閾值折半）

`skills/ade-dev/SKILL.md` 的 Spec Ready 段落（第 95–108 行）：

- 任務層只列 **G1、G2、G3、G4、G7、G8** 六條
- Phase 層列了「交付定義完整」「預估在大小閾值內；auto 模式加嚴：> 3 檔要在 `plan.md` 寫明理由」「**G6** repo > 800 檔或 > 300K 行時，大小閾值折半」

**G5 的內容還在，標號不見了。** 兩份文件對同一組 gate 的編號體系已經不一致。

這不是純美觀問題，因為**標號是使用者可見的輸出**。ade-dev 第 93 行自己規定：

> 「任一 FAIL 即不得 auto，並輸出一句話理由（如『G3 不過：沒有可執行的測試指令』）」

當 agent 因為 Phase 太大而拒絕一個任務，它會輸出什麼？依 SKILL.md，那條判準沒有標號，只能說「Phase 大小不過」；使用者拿這句話回去查 research 檔，要自己認出那是 G5。而 G6 又同時存在於兩份文件的**不同層級**（research 檔把它列在任務層表格，ade-dev 放在 Phase 層清單）。一個 gate 兩個位置、一個 gate 沒有名字——這正是 DRY 說的「同一件事在兩個地方用兩種不同的形式表達」。

### 4.3 第三份複述：README 的 Skills 一覽

漂移不只兩份，是三份。`README.md` 第 71 行描述 ade-dev：

> 「內建 **Spec Ready 判定與 auto-pilot 模式**：就緒條件（**G1–G8**＋逐 Phase 檢查）全 PASS 的任務……」

README 說任務層是 G1–G8；SKILL.md 的任務層只有六條且不含 G5、G6。README 對 ade-dev-auto（第 73 行）同樣複述了值：

> 「自身只定義批次層：B1–B4（改動檔案互不相交、一批 ≤ 5 顆、單顆 ≤ 60 分鐘）」

括號裡列了 B1、B2 的一半、B4，跳過 B3，也漏了 B2 的「併發 ≤ 2」。**這不是錯誤，是註定會過期的摘要。** 只要 B2 的數字改一次，README 就錯了，而且沒有任何機制會提醒。

依 §1.2，README 的正確寫法是保留「B1–B4」這種**指標**，刪掉括號裡的值：

```markdown
自身只定義批次層 B1–B4（改動檔案不相交、批次上限、獨立評估、單顆時限）與批次熔斷。
```

「不相交」「上限」「時限」是**類別**不是值，改數字不會讓它變錯。這是 README 該有的抽象層級——README 的讀者要判斷「這支 skill 管不管我這件事」，不需要知道上限是 5 還是 7。

### 4.4 依據文件該不該有「結論先行」

一個真實的張力：本 repo 三份 research 檔全都以「§1 結論先行」開場，而且 `research-phase-sizing.md` §1 的表格**完整列出了最終採用的閾值**（400 行、10 檔、5／8 條 AC、1–2 天）。依 §1.2 的原則，這是複述規範性內容，該刪。

**但不該刪。** 理由是這些檔案的檔頭已經宣告了自己的角色：

> 「**文件性質**：研究參考，不是流程規則。這裡整理的是……證據盤點；真正上線的判準請寫進負責拆 Phase 的 skill，並回頭標注採用了本文哪一組數字。」

這句話讓 §1 的表格變成「**研究建議的方案**」而不是「**上線的規則**」——兩者是不同的事實，各有各的唯一位置。研究建議 400、skill 決定採用 400，這是兩個獨立事實剛好同值；哪天 skill 因為實測改成 300，research 檔的 400 **不需要跟著改**，因為那是當初的研究結論，不是現行規則。

**這給出原則的精確措辭**（修正 §1.2 的表述）：

> research 檔擁有的是「**研究當下建議什麼、為什麼**」；SKILL.md 擁有的是「**現在的規則是什麼**」。兩者同值時不算重複，因為它們陳述的是不同時態的不同事實。
>
> **真正的違規是 research 檔用現在式敘述現行規則**（「每個 Phase 必須 ≤ 400 行」），或 **SKILL.md 複述證據**（「因為 Cisco 研究顯示……」）。
>
> **檢查方式**：research 檔的每個規範性句子都要能被改寫成「本研究建議…／依據是…」而不失真。改不動的那句，就是跑錯檔案了。

用這把尺回看 §4.2 的 G5 問題：research 檔的 G1–G8 表格是「研究建議這八個 gate」，合法；ade-dev 採用其中七個、改動一個的層級，**也**合法——但它必須**標明自己改了什麼**。目前它沒有，讀者只能靠比對兩份文件才發現差異。

> **修法（最小）**：ade-dev 的 Spec Ready 段落補回 G5 標號，並在依據行寫明採用範圍。例如把第 93 行的依據句改成：
>
> 「依據與數字出處：ADE `knowledge/process/research-autopilot-readiness.md`（採用其 §1.1 的 G1–G8，其中 G5、G6 移至逐 Phase 檢查）」
>
> 一句話同時解決標號遺失與層級差異，不需要動任何判準內容。

### 4.5 ade-dev 與 ade-dev-auto：ac1f297 的重劃是對的

commit `ac1f297` 把「任務內規則全在 ade-dev、批次層全在 ade-dev-auto」重劃了一次。用 §1.2 檢查現況：

- ade-dev-auto 開頭明寫「本 skill **不定義任何任務內的判準、執行規則或煞車**」——這是**負向邊界宣告**，比正向列舉更耐漂移，因為新增任務層規則時不需要回來改它
- B1–B4 只出現在 ade-dev-auto，G1–G8 只出現在 ade-dev，兩邊沒有交集
- 唯一的重複是「依據同 `research-autopilot-readiness.md`」這句指標，屬合法

**這個模式值得寫成通則**：兩支協作的 skill 之間，讓下游那支明寫「我不管什麼」，比讓上游那支列舉「我管什麼」更穩。前者在新增規則時自動維持正確，後者每次新增都要記得回來補。

---

## 5. ade-dev 該不該拆 reference/ 子檔

### 5.1 官方數字：116 行遠在預算內

三份 Anthropic 一手來源給的是同一個數字：

> "Keep SKILL.md body under 500 lines for optimal performance. If your content exceeds this, split it into separate files using the progressive disclosure patterns described earlier."
> — [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)（"Token budgets" 一節，checklist 亦列 "SKILL.md body is under 500 lines"）

> "Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files."
> — [Extend Claude with skills](https://code.claude.com/docs/en/skills)（"Add supporting files" 一節）

> "**SKILL.md body** - In context whenever skill triggers (<500 lines ideal) … Keep SKILL.md under 500 lines; **if you're approaching this limit**, add an additional layer of hierarchy along with clear pointers about where the model using the skill should go next to follow up."
> — Anthropic 官方 [`skill-creator` skill](https://github.com/anthropics/skills/tree/main/skills/skill-creator) 的 SKILL.md，"Skill Writing Guide" 一節

規格頁另給 token 版本：

> "**Instructions** (< 5000 tokens recommended): The full `SKILL.md` body is loaded when the skill is activated"

本 repo 全部 11 支注入面 skill 的行數：

| skill | 行數 | | skill | 行數 |
|---|---|---|---|---|
| ade-dev | **116** | | ade-align-spec | 20 |
| ade-dev-auto | 37 | | ade-commit | 19 |
| ade-add-process | 34 | | ade-spec-audit | 18 |
| ade-ship | 24（補完後約 43） | | ade-add-skill | 16 |
| ade-contribute | 20 | | ade-add-service | 14 |
| ade-list-service | 11 | | | |

最大的一支用掉預算的 **23%**。官方觸發條件是 "approaching this limit"（skill-creator 的措辭）——116 行不是接近，是還有四倍餘裕。**依官方判準，答案是不拆。**

### 5.2 更重要的理由：progressive disclosure 對「每次都要用的判準」是負收益

行數只是表面。真正的問題是 ade-dev 的內容**性質**適不適合放進按需載入的檔案。

官方對 reference 檔的三個範例——BigQuery 的 `finance.md`／`sales.md`／`product.md`、cloud-deploy 的 `aws.md`／`gcp.md`／`azure.md`、PDF 的 `FORMS.md`／`REDLINING.md`——共同點是**互斥的變體**：一次任務只會用到其中一個。官方把這個條件寫得很明白：

> "For Skills with multiple domains, organize content by domain to avoid loading irrelevant context. When a user asks about sales metrics, Claude only needs to read sales-related schemas, not finance or marketing data."
> — Skill authoring best practices, "Pattern 2: Domain-specific organization"

> "If certain contexts are mutually exclusive or rarely used together, keeping the paths separate will reduce the token usage."
> — [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

**ade-dev 的內容完全不是這個形狀。** 它的六關判準、Spec Ready 的 G1–G8、auto-pilot 煞車，全部是「這次任務從頭到尾都要遵守」的規則，沒有一條是「某類任務才需要」。把它們搬進 `reference/gates.md`，得到的是：

- **省不到 context**：每次都要讀回來，總量不變，還多一次工具呼叫
- **多一次漏讀的機會**：載入與否由 agent 判斷。判準漏讀的後果是**跳過煞車**——auto-pilot 的零容忍條件（改測試斷言即停、黑名單路徑）如果因為 agent 沒去讀 reference 檔而沒生效，這是安全問題不是效能問題
- **多一個漂移點**：判準與引用它的流程文字分家，§4 那組問題再來一次

官方文件對「反覆被讀的檔案」的處理建議正好指向反方向：

> "**Overreliance on certain sections:** If Claude repeatedly reads the same file, consider whether that content should be in the main SKILL.md instead."

一個必然每次都被讀的 `reference/gates.md`，依這條就該搬回 SKILL.md。**先拆再依此搬回，是白做工。**

### 5.3 什麼時候該重新評估

給一組可檢查的觸發條件，而不是「以後再看」：

- ade-dev **超過 300 行**（60% 預算）→ 開始評估。第一個該拆出去的**不是**判準，而是**變體型內容**：例如將來若出現「TDD 專案／既有無測試專案」兩套實作關做法，那才是 `reference/` 的正當用途
- Spec Ready 的 gate 數量**超過 12 條**、或每條開始需要多行說明 → 拆 `reference/spec-ready.md`，但 SKILL.md 必須保留**完整的 gate 清單標號與一行摘要**，reference 檔只放判定細節。判準的存在性不可延遲載入，判準的細節可以
- 若真要拆，遵守官方的兩條硬約束：引用**只能一層深**（"Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains."），**超過 300 行的 reference 檔要有目錄**（"For large reference files (>300 lines), include a table of contents"）

### 5.4 順帶：ade-dev 的 description 長度合規

規格對 `description` 的上限是 1024 字元。ade-dev 的 description 約 150 個中文字元，遠低於上限，且符合官方對「what + when」的要求（前半描述六關與 auto-pilot，後半列了六組觸發語）。無需調整。

---

## 6. 本文的弱點與待驗證

誠實標記，避免被當成比實際更強的依據：

1. **GitHub 三個單檔位置的優先順序是推論**（§3.2d）。官方 PR 範本文件沒寫順序，本文借用了 community health file 文件的 `.github` → root → `docs`。同一 repo 放兩份以上的情況本身就罕見，風險低但不是零。
2. **大小寫不敏感是實務觀察，不是官方保證**（§3.2a）。建議的 `-iname` 做法在兩種情況下都正確，所以這個不確定性不影響結論——但如果將來 GitHub 明文規定大小寫敏感，`-iname` 會比平台本身寬鬆（找到平台其實不會套用的檔案）。發生機率極低。
3. **GitLab 專案設定層的 API 欄位名**（`merge_requests_template`）未在本次研究中實測，來自 GitLab Projects API 的既有認知。上線前應對一個真實專案跑一次 `glab api projects/:id | jq .merge_requests_template` 確認欄位存在。
4. **500 行閾值沒有公開的實測依據**。三份 Anthropic 文件一致給這個數字，但都沒有附上「超過會怎樣」的量化資料，skill-creator 甚至明說 "These word counts are approximate and you can feel free to go longer if needed"。本文把它當**慣例（強）**而非實證——不過 ade-dev 只用了 23%，這個不確定性不影響 §5 的結論。
5. **§1.3 的 shell 檢查是粗糙比對**。它只看 `ade-` 前綴的字串，無法區分「執行指令」與「告知敘述」，也會被 `ade-` 這種前綴說明文字誤觸。它的價值是**列出所有跨界提及讓人看一眼**，不是自動判定。要做成 pre-commit hook 需要人工維護一份白名單。
6. **本文沒有研究「skill 數量上限」**。目前 11＋3 支，官方文件提到 Claude 需要從 "potentially 100+ available Skills" 中挑選，暗示這個規模還很寬鬆，但 description 之間的觸發衝突（例如 `ade-dev` 與 `ade-dev-auto`、`ade-ship` 與 `ade-commit`）沒有被測過。skill-creator 提供了 description 優化與觸發率 benchmark 的工具鏈，值得另開一題。

---

## 7. 一手來源

**Anthropic／Agent Skills**

- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — 500 行預算、progressive disclosure 三種 pattern、一層深引用、reference 檔目錄、description 寫法、degrees of freedom、迭代方法
- [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — 三層載入模型與各層 token 成本（metadata ~100 tokens／SKILL.md < 5k tokens／resources 讀取前為 0）
- [Agent Skills 規格](https://agentskills.io/specification) — frontmatter 六欄位、`compatibility` 用途、`scripts/`／`references/`／`assets/` 目錄慣例、相對路徑引用規則
- [anthropics/skills](https://github.com/anthropics/skills) — `spec/agent-skills-spec.md`（指向上列規格）、`skills/skill-creator/SKILL.md` 的 Skill Writing Guide
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) — 互斥情境才分檔的判準、跨平台可攜性
- [Extend Claude with skills（Claude Code）](https://code.claude.com/docs/en/skills) — skill 載入位置與優先序、symlink 支援、nested `.claude/skills/`、`${CLAUDE_SKILL_DIR}`、"Keep SKILL.md under 500 lines"

**GitHub**

- [Creating a pull request template for your repository](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)（[docs 原始碼](https://raw.githubusercontent.com/github/docs/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository.md)）— 三個單檔位置、三個目錄位置、`template` query parameter、預設分支生效條件
- [Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) — 組織 `.github` repo 的預設範本、`.github` → root → `docs` 優先序
- [gh pr create manual](https://cli.github.com/manual/gh_pr_create) — `--template` 旗標定義；無自動探索

**GitLab**

- [Description templates](https://docs.gitlab.com/user/project/description_templates/) — `.gitlab/merge_request_templates/`、`Default.md`（case-insensitive）、專案設定層優先於檔案層、群組／instance 層
- [glab mr create](https://gitlab.com/gitlab-org/cli/-/raw/main/docs/source/mr/create.md) — `--template` 只讀 `.gitlab/merge_request_templates/`、"Templates are loaded from the local repository only"

**文件治理**

- Thomas & Hunt, *The Pragmatic Programmer* 20th Anniversary Edition, ch. 9 "The Evils of Duplication"（[出版社公開節錄](https://media.pragprog.com/titles/tpp20/dry.pdf)）— DRY 的原始定義、"DRY is More Than Code"、acid test
