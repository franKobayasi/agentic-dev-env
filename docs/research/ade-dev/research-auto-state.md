# 跨 session 可恢復的 agent workflow 狀態模型：簽核來源、接手判讀、批次層狀態

> **文件性質**：研究參考，不是流程規則。這裡整理的是「auto-pilot 模式下，哪些事實必須機器可讀、記在哪、接手者怎麼判讀」的證據盤點與定案建議；採用後請把規則寫進 `ade-dev` / `ade-dev-auto` skill，並回頭標注採用了本文哪一節。
>
> **前置**：本文承接 `research-devflow-state.md`（單一真相、frontmatter + checkbox、不另設 status.json）的結論，只處理它沒有涵蓋的三個缺口。該文的三條配套規則在此全數沿用。
>
> 研究日期 2026-08-16。引文保留英文原文。
>
> **採用標注（2026-08-16）**：§1.2 schema、§1.3 接手判讀、§1.4 auto-run.md 定案與 §6 逐條修訂已全數落入 `skills/ade-dev`、`skills/ade-dev-auto`；差異一處——`halted` 原因碼多一個 `plan-recheck`（規劃後 G5／G6 重檢不過，出自 research-gate-integrity.md 的新煞車）。

---

## 1. 結論先行

### 1.1 三個缺陷的定案

| 缺陷 | 定案 | 一句話理由 |
|---|---|---|
| **① `status: approved` 語意超載** | 加一個並列欄位 `approved_by: human \| spec-ready`，與 `status: approved` **同一次寫入**；不新增 `status` 取值 | 「達到什麼狀態」與「誰讓它達到」是兩個事實，塞進一個欄位就是把 §4 的單一真相原則反過來踩——**一份表述承載兩件事，跟兩份表述承載一件事一樣壞** |
| **② 接手規則錯誤** | 改寫成一條**依序判讀、讀到能決定下一步就停**的規則，從 `spec.md` 起步（它是唯一必然存在的檔案），plan.md 只在存在時才讀 | 現行規則假設 plan.md 一定存在，但它是第 2 關產物；卡在第 1 關的任務讀不到任何東西 |
| **③ `auto-run.md` 疑似第二份真相** | **瘦身，不廢除**。只記「不會變的決定」（本批選了誰、順序、剔除誰為什麼），**禁記「會變的狀態」**（各顆進度、卡在哪關、批次跑到哪、熔斷有沒有觸發）——後者全部從各任務 frontmatter＋checkbox 導出 | 批次成員資格沒有別的家（§5.1 盤點），但各顆狀態有；把兩者混在一個檔案才是缺陷來源。切線是 event log（不變）vs current state（導出），不是「這個檔案該不該存在」 |

另外補一個缺陷 ①② 沒點名、但同一個洞裡的問題：**auto-pilot 被煞車停下之後，「這顆已停、不得自動續跑」同樣沒有機器可讀紀錄**（現行只在 `notes.md` 留散文）。定案：`plan.md` frontmatter 加**存在即為真**的 `halted: <原因碼>`，人處理完刪掉該行。詳見 §3.5。

### 1.2 建議的 frontmatter schema（全文，可直接落入 SKILL.md）

```yaml
# spec.md / plan.md 檔頭
---
status: draft            # draft → approved，取值不變
approved_by: human       # 只在 status: approved 時出現；取值 human | spec-ready
---
```

```yaml
# plan.md 檔頭，被煞車停下時多這一行；人裁決處理完後刪除
---
status: approved
approved_by: spec-ready
halted: test-red         # 存在即為「已停，不得自動續跑」
---
```

`approved_by` 取值：

| 值 | 意義 |
|---|---|
| `human` | 人逐字看過並簽核（手動模式的過關方式） |
| `spec-ready` | auto-pilot 模式，由 Spec Ready 全 PASS 替代簽核，**無人看過此文件** |
| （欄位不存在） | 視同 `human`——既有檔案相容，且是 fail-closed 的安全側（§2.4） |

`halted` 取值（一一對應 `ade-dev` 既有煞車條款，不新造概念）：

| 值 | 對應煞車條款 |
|---|---|
| `test-tampering` | 修改既有測試的斷言使其變綠 |
| `blacklist-path` | diff 碰到 G7 黑名單路徑 |
| `spec-gap` | 要動產品行為但 spec 無依據 |
| `review-blocking` | 兩軸審查有 blocking finding |
| `oversize` | 實際規模超閾值 2 倍 |
| `test-red` | 測試紅了連續 3 次 |
| `test-env` | 測試跑不起來連續 3 次 |
| `compaction` | context compaction > 2 次 |

完整情境（停在哪個 Phase、最後一次測試輸出）照舊寫 `notes.md`。frontmatter 放**短原因碼供機器判定**、notes.md 放**長敘述供人閱讀**，這個分工直接抄 Kubernetes 的 `reason` / `message`（§2.2）。

**Schema 的三條硬性約束**（違反就會開始踩 YAML 的坑，見 `research-devflow-state.md` §4.2）：

1. 全部是**單行純字串**，不用 list、不用巢狀、不用引號才安全的值
2. 欄位數上限就是這三個（`status` / `approved_by` / `halted`）。要加第四個欄位前，先證明那個事實無法從既有檔案導出
3. **不加 `date` 欄位**——git 已經記了誰在什麼時候改的，重記一次就是第二份真相

### 1.3 接手判讀規則（全文，可直接落入 SKILL.md）

> **接手判讀**（任何 session 讀檔即可接手；依序判斷，**讀到能決定下一步就停，不必往下讀**）：
>
> 1. 沒有 `spec.md` → 從第 1 關開始
> 2. `spec.md` 的 `status` 不是 `approved` → 卡在第 1 關
> 3. 沒有 `plan.md`，或其 `status` 不是 `approved` → 卡在第 2 關
> 4. `plan.md` 有 `halted:` → **停**。不論其他狀態如何都不得自動續跑；把該原因碼與 `notes.md` 最後一則交給人裁決，人刪掉該行才恢復
> 5. `plan.md` 有未勾的 Phase → 卡在第 3 關。該 Phase 已有 `phase-N.md` 就從未勾的 Task 續，沒有就展開它
> 6. Phase 全勾 → 底部三個收尾項第一個未勾者即所在的關（測試審視＝第 4 關、沉澱＝第 5 關、Ship＝第 6 關）
> 7. 全部勾完 → 已完成
>
> **執行模式判讀**：`spec.md` 與 `plan.md` 的 `approved_by` **皆為** `spec-ready`、且無 `halted:` → 續跑 auto-pilot；其餘一切情形（任一為 `human`、任一缺欄位、任一檔案不存在）→ **手動模式**。判不出來就是手動，不猜。

### 1.4 `auto-run.md` 定案（全文，可直接落入 `ade-dev-auto`）

> `.ade-dev/auto-run.md` 是**批次層的決定紀錄，append-only**，一個批次一個 `##` 區段。它只記**不會再變的決定**：
>
> - 批次 id（`YYYYMMDD-HHMM`）與建立時間
> - 選入本批的任務目錄名，**依執行順序排成有序清單**（順序本身就是批次層事實，導不出來）
> - 剔除或要求補齊的任務與一句話理由
>
> **禁記清單**（這些全部從各任務的 `spec.md` / `plan.md` frontmatter＋checkbox 導出，寫進來就是第二份真相）：各顆卡在哪一關、各顆完成與否、批次執行到第幾顆、進度數字、熔斷是否已觸發。**本檔不得出現 checkbox**——checkbox 是可變狀態的形狀，一出現就會有人去勾它。
>
> **接手續跑**：讀本檔取得清單與順序 → 對每顆跑 `ade-dev` 的接手判讀規則得到現況 → **重跑一次批次熔斷判定**（熔斷是各顆結果的函數，不是被儲存的狀態）→ 沒熔斷就從清單中第一顆未完成的任務續跑。

### 1.5 各主張的依據強度

| 主張 | 強度 | 出處 |
|---|---|---|
| 狀態值旁邊要有機器可讀的「原因／來源」欄位，人讀敘述另置 | **實證（強）**：K8s API 慣例明訂 `reason` 為 programmatic identifier | Kubernetes API conventions（§2.2） |
| 「同一個動作、不同的執行者」要用**並列欄位**記，不是覆用同一個值 | **實證（強）**：git 分開記 author / committer；MADR 分開記 `status` / `decision-makers` | git-commit(1)、MADR（§2.2） |
| 記「當下模式」會在降回手動時追溯性說謊；記「當時誰簽的」不會 | **原理（強）**：event log 不可變、current state 導出 | Fowler, Event Sourcing（§2.3） |
| 判不出來時預設走**限制較多**的那條路（缺欄位＝手動） | **原理（強）**：fail-safe defaults，1975 起的共識 | Saltzer & Schroeder（§2.4） |
| 接手要靠明確指定「讀哪幾個檔」的規則，不能靠 agent 自行摸索 | **實證（強）**：官方 harness 直接把讀什麼寫進 prompt | Anthropic harness（§3.2） |
| 崩潰後的狀態應由不可變紀錄**重建**，而非讀取被儲存的快照 | **實證（強）**：Temporal 的 replay 就是這個形狀 | Temporal Event History（§5.2） |
| 「父層擁有子層清單、子層自己擁有自己的狀態」是正確的分層 | **實證（中強）**：Temporal parent / child 各有獨立 Event History | Temporal Child Workflows（§5.2） |
| 加新 frontmatter 欄位不會破壞既有的逐字精確匹配 | **原理（強）**：YAML mapping 是無序 key/value 集合，`rg '^status:'` 行首錨定 | YAML 1.2 spec（§6） |
| `approved_by` 這個欄位名 LLM 不會拼錯 | **查無實證** | 見 §7 |

---

## 2. 缺陷一：`status: approved` 語意超載

### 2.1 現況與為什麼「加一個 status 取值」是錯的解

`ade-dev` 第 27 行定義 `status: approved`＝人簽核、逐字精確匹配；第 91 行的 auto-pilot 卻寫「frontmatter 照標 `approved`，`notes.md` 留痕『由 Spec Ready 替代簽核』」。結果是同一個字串承載兩種截然不同的事實，而區分兩者的唯一線索是散文。

最直覺的修法是加取值：`status: auto-approved`。**這個修法要駁回**，理由有三：

1. **它會破壞既有的逐字精確匹配**。所有「檢查是否過關」的判斷現在是 `status == approved`；改成兩個取值後，每個消費端都得改成集合比對，而漏改的那個會靜默地把 auto 簽的任務判成沒過關。
2. **它把兩個維度壓成一個列舉**。之後若再出現第三種簽核來源（例如「人只簽了規格、規劃交給 auto」），取值就要變成笛卡兒積。
3. **它讓「過關了沒」這個最常被查詢的事實變複雜，只為了容納一個較少被查詢的事實**。正交的東西就該正交地記。

### 2.2 外部證據：狀態與「為什麼／誰」分欄，是各家的既定做法

**Kubernetes API conventions** 對 condition 的欄位分工講得最清楚。`reason` 是：

> "a programmatic identifier indicating the reason for the condition's last transition"，且應為 "a CamelCase string"，"required"、"may not be empty."

`message` 則是：

> "a human readable message indicating details about the transition"，"may be an empty string."

也就是說：**狀態值（`status`）保持窄而穩定，變化的成因用一個獨立的、機器可讀的短識別碼欄位承載，人讀的長敘述再獨立一個欄位。** 這正是本文 §1.2 的 `status` / `approved_by`＋`halted` / `notes.md` 三層分工的來源。

同一份文件對「之後還要加欄位怎麼辦」也有明示：

> "Additional fields may be added in the future."

以及對取值的規範方式：

> "Producers of specific condition types may define expected values and meanings for this field, and whether the values are considered a guaranteed API."

——所以 §1.2 把 `halted` 的八個取值一一對應既有煞車條款、寫死在 SKILL.md 裡，是符合這個慣例的做法，不是過度設計。

來源：[Kubernetes API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)

**MADR** 的 frontmatter 是更貼近我們的先例——它同樣是「人要簽核的 markdown 文件 + frontmatter 狀態」，而它把狀態與決策者**分成兩個欄位**：

```yaml
status: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123"
date: {YYYY-MM-DD when the decision was last updated}
decision-makers: {list everyone involved in the decision}
```

並註明 "These are optional elements. Feel free to remove any of them."——欄位可選、缺席合法，這與 §1.2 的「`approved_by` 缺席視同 `human`」相容。

值得注意 MADR **沒有**把 `accepted-by-committee` 之類的東西塞進 `status` 取值，儘管它的 status 列舉已經相當長。

來源：[MADR](https://adr.github.io/madr/)

**git** 是最強的類比：同一個 commit，git 分開記 author 與 committer 兩組身分（`GIT_AUTHOR_NAME` / `GIT_COMMITTER_NAME` 等六個環境變數），因為 cherry-pick、rebase、`git am` 這些情境下，「內容出自誰」與「這個物件由誰造出來」不是同一個人。git 沒有發明 `type: cherry-picked-commit` 這種列舉值，它加了一組欄位。

我們的情況一模一樣：`status: approved` 是「這份文件過關了」，`approved_by` 是「讓它過關的是人還是判準」。

來源：[git-commit(1)](https://git-scm.com/docs/git-commit)

### 2.3 為什麼記「誰簽的」而不是記「當下模式」

有一個看起來更省的替代案：在 `spec.md` frontmatter 記一個任務層的 `mode: auto | manual`，簽核來源由它推導。**駁回**，理由是它在「降回手動」時會追溯性說謊。

情境：一顆任務以 auto 起跑，`spec.md`、`plan.md` 都由 Spec Ready 替代簽核（**無人看過**），跑到第 3 關被煞車停下，`ade-dev-auto` 把它降回手動，人接手繼續做。此時 `mode` 應該改成 `manual`——改完之後，任何接手者讀到的都是「這顆是手動任務」，於是把那份從來沒人看過的 `spec.md` 當成人簽核過的。**這正是缺陷 ① 原本的失效模式，只是換了個欄位名重新發生一次。**

根因是 `mode` 是**可變的當下狀態**，而「這份文件當初是誰簽的」是**不可變的歷史事實**。Fowler 對 Event Sourcing 的表述點破了這個分野——系統同時有 "an application state and an event log"，而：

> "Event Sourcing ensures that all changes to application state are stored as a sequence of events."
>
> "We can discard the application state completely and rebuild it by re-running the events from the event log on an empty application."

不可變的那份是權威，可變的那份是導出。套到這裡：`approved_by` 寫下去就不再改（是歷史），「現在是不是 auto 模式」則每次接手時從它導出（是導出狀態）。這樣降回手動不需要改任何既有欄位——只要加上 `halted:`，§1.3 的模式判讀規則自然就會判成手動，而 `approved_by: spec-ready` 仍然誠實地說著「這份 spec 沒人看過」。

**推論（重要）**：`approved_by` 一旦寫入即不得修改，這條要寫進 SKILL.md。若人事後補看了那份 auto 簽的 spec 並認可，正確做法是**在 `notes.md` append 一則「人已補審」**，不是回頭竄改 `approved_by`——理由同上，改了就再也分不出當初有沒有人看過。

來源：[Martin Fowler, Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

### 2.4 缺欄位＝手動：fail-safe defaults

`approved_by` 缺席時該怎麼判？既有檔案沒有這個欄位，未來 agent 也可能忘記寫。Saltzer & Schroeder 1975 年的 fail-safe defaults 原則直接給了答案：

> "Base access decisions on permission rather than exclusion."
>
> "A design or implementation mistake in a mechanism that gives explicit permission tends to fail by refusing permission, a safe situation, since it will be quickly detected."

翻成本題：**只有在明確看到 `approved_by: spec-ready` 時才續跑無人模式；看不到就走手動。** 兩種失效方向的代價完全不對稱——誤判成手動只是多問人一次（會立刻被發現並修正），誤判成 auto 是讓沒人看過的規格無人監督地跑完六關並發出 MR（不會被發現，因為它看起來一切正常）。

同一條原則也解釋了為什麼 §1.3 的模式判讀要求 `spec.md` 與 `plan.md` **兩份都是** `spec-ready` 才續跑 auto：任一份是人簽的，代表這顆任務中途有人介入過，續跑無人模式就越過了那個人的預期。

順帶處理一個看似需要儲存的事實：「人說了這顆要 auto 跑」這個**意圖**，在第一次簽核發生之前無處可記。定案是**不記**——若 session 在「人下令 auto」與「第一次寫入 `approved_by`」之間死掉，意圖就是丟失，接手者走手動。這是 fail-safe 的正確方向，不值得為它新增一個欄位。

來源：[Saltzer & Schroeder, The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html)

---

## 3. 缺陷二：接手規則

### 3.1 現行規則錯在哪

`ade-dev` 第 31 行：

> 接手時讀 `plan.md` 即知進度（frontmatter 未 `approved` 就是還卡在對應的關）；有未完成的 `phase-N.md` 就從那裡繼續。

三個問題：

1. **plan.md 是第 2 關產物**。卡在第 1 關的任務目錄裡只有 `spec.md`，接手者按規則去讀 plan.md 會撲空，而規則沒說撲空時該怎麼辦。
2. **括號裡的推論是錯的**。「plan.md 的 frontmatter 未 approved 就是卡在對應的關」把兩個關的狀態綁在一個檔案上——`spec.md` 的狀態活在 `spec.md` 自己的 frontmatter，plan.md 對它一無所知。
3. **沒有涵蓋第 4–6 關**。plan.md 底部的三個收尾項（第 29 行才定義）在接手規則裡沒被提到，Phase 全勾之後接手者不知道要看那三項。

`ade-dev-auto` 第 12 行的掃描（「`spec.md`／`plan.md` frontmatter 非 `approved`、或有未勾項目者即未完成」）是對的——這正好說明兩支 skill 對同一件事有兩套說法，其中一套是錯的。定案：**規則只在 `ade-dev` 定義一次**（它是流程的擁有者），`ade-dev-auto` 引用它、不重述。這是把單一真相原則套用在**規則**上，不只是狀態上。

### 3.2 外部證據：接手要靠明寫的讀取順序，不能靠 agent 自行摸索

Anthropic 的 long-running agents harness 對這點的處理是把「接手先讀什麼」直接寫死在 prompt 裡：

> "Read the git logs and progress files to get up to speed."
>
> "Read the features list file and choose the highest-priority feature that's not yet done."

而它之所以需要這麼寫，是因為：

> "each new session begins with no memory of what came before"

且他們對 initializer 與 coding agent **用不同的 prompt**（"a different prompt for the very first context window"）——也就是「第一次進來」與「接手續跑」被當成兩種不同的情境明確區分。

對我們的意義：接手規則的價值不在於「說明狀態存在哪裡」，而在於**給出一條無歧義的判讀序列**，讓任何 session 讀完都得到同一個結論。§1.3 因此寫成編號的依序判斷，而不是描述性的「狀態記在這些檔案裡」。

來源：[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### 3.3 從最穩的錨點起步

判讀序列該從哪個檔案開始？答案是**唯一必然存在的那個**。任務目錄一旦建立，`spec.md` 就存在（它是第 1 關的產物，且第 1 關是入口）；`plan.md`、`phase-N.md`、`notes.md` 都可能缺席。所以序列從 `spec.md` 起步，且每一步都先判「檔案在不在」再判「欄位是什麼」——這也是為什麼 §1.3 的第 1、3 條都把「檔案不存在」寫成明確分支，而不是留給接手者自行處理。

### 3.4 「讀到能決定下一步就停」

規則明寫這句話有實際效益：接手者不需要把整個目錄讀進 context。卡在第 1 關的任務只要讀 `spec.md` 的前三行就能決定下一步——這與本 repo `knowledge/README.md` 的 context 管理原則（常駐最小化、按需載入）一致，也與 `ade-dev` 開頭「每個 Phase 交付後建議 `/clear` 換新 session」的設計同向。

### 3.5 `halted:` 為什麼是接手規則的一部分

煞車停下之後，任務目錄的狀態看起來與「正常做到一半」**完全相同**：`spec.md` approved、`plan.md` approved、某個 Phase 未勾。接手者按 §1.3 的第 5 條會判成「卡在第 3 關，續跑」——於是一顆已經因為碰到黑名單路徑而停下的任務，被下一個 session 若無其事地繼續跑完。

現行設計把停機情境寫在 `notes.md`，那是散文，機器判不了，而且人處理完之後 notes.md 是 append-only 的、那則記錄永遠留著，無法用「還在不在」表達「還停不停」。所以需要一個**存在即為真、處理完就刪除**的旗標，這正是 `halted:` 的形狀，而它的取值是機器可讀的原因碼——回到 §2.2 的 Kubernetes `reason` / `message` 分工。

順帶一提，這也解釋了為什麼 `halted:` 放在 `plan.md` 而不是 `spec.md`：兩份都還沒 approved 的任務，§1.3 的第 2、3 條已經會把它導向人（fail-closed 已覆蓋），不需要旗標；旗標只在「看起來一切正常、實際上已停」的區間（兩份都 approved 之後）才有作用，而那個區間 `plan.md` 必然存在。

---

## 4. 缺陷三：`auto-run.md`

### 4.1 事實盤點：每個事實的家在哪

判斷一個檔案是不是第二份真相，要逐個事實盤點，不是整檔一起裁決。

| 事實 | 是批次層還是任務層 | 可否從別處導出 | 家 |
|---|---|---|---|
| 哪些任務被選入本批 | 批次層 | **否** | `auto-run.md` |
| 執行順序 | 批次層 | **否** | `auto-run.md`（有序清單） |
| 誰被剔除／要求補齊、為什麼 | 批次層 | **否**（是歷史決定） | `auto-run.md`（append） |
| 某顆卡在哪一關 | 任務層 | 可（§1.3 判讀規則） | 各 `spec.md` / `plan.md` frontmatter |
| 某顆完成了沒 | 任務層 | 可（plan.md checkbox） | 各 `plan.md` |
| 某顆是否已停、為什麼停 | 任務層 | 需旗標（§3.5） | 各 `plan.md` 的 `halted:` |
| 批次執行到第幾顆 | 批次層 | **可**（清單順序 ＋ 各顆狀態） | 不記，導出 |
| 熔斷是否已觸發 | 批次層 | **可**（見 §4.3） | 不記，導出 |

上半四列沒有別的家，下半四列有。**缺陷不在於「auto-run.md 存在」，在於它同時裝了上下兩半。** 定案因此是切一刀，不是廢檔。

### 4.2 外部證據：不變的紀錄留著，會變的狀態導出

這一刀的位置有兩個一手依據。

**Event Sourcing**（§2.3 已引）給的是切線本身：event log 是 "the immutable record of what actually occurred"，current state 是可丟棄、可重建的導出物——"We can discard the application state completely and rebuild it by re-running the events from the event log on an empty application."

「本批選了這五顆、順序如此、剔除了那一顆因為 G3 不過」是已經發生的事，不會再變，屬於 log；「第三顆做完了沒」隨時在變，屬於 state。前者寫檔，後者每次接手重新導出。

**Temporal 的 parent / child workflow** 給的是分層的正確形狀。父 workflow 的 event history 記的是子 workflow 的**生命週期事件**：

> "A Parent Workflow Execution Event History contains Events that correspond to the status of the Child Workflow Execution."

但子 workflow 的內部狀態不在父那裡：

> "Child Workflow Executions have their own Event Histories."
>
> "A Parent Workflow Execution and a Child Workflow Execution do not share any local state."

對應到我們：`auto-run.md`（父）記「啟動了哪些任務、什麼順序」，各任務目錄（子）記自己走到哪。父不複製子的內部進度——**這正是現行第 35 行「各顆狀態記在 auto-run.md」違反的分層**。

來源：[Temporal: Child Workflows](https://docs.temporal.io/child-workflows)、[Martin Fowler, Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

### 4.3 熔斷狀態為什麼也不記

`ade-dev-auto` 的四條熔斷（同因連續 2 顆／累計 3 顆／環境阻塞）看起來像是需要儲存的批次層狀態，其實不是——**它們全部是既有事實的函數**：

- 「累計幾顆失敗」＝ 清單中帶 `halted:` 的任務數
- 「同因連續 2 顆」＝ 依 `auto-run.md` 的順序看相鄰兩顆的 `halted:` 原因碼是否相同（順序來自父、原因碼來自子，兩邊各司其職）
- 「環境阻塞」＝ 當下重新觀察主幹／build，本來就不該用快取的判斷來決定要不要繼續跑

所以接手時**重跑一次判定**即可，而且比讀取儲存值更正確：儲存值可能是上一個 session 在環境壞掉時寫的，環境修好之後那個值就過期了——這正是缺陷描述裡「任務被降回手動後人工完成，auto-run.md 會殘留過期狀態」的同一種病。

Temporal 的 replay 是這個做法的實證形狀：worker 崩潰後不是去讀某個狀態快照，而是「replays the Event History to reconstruct logical Workflow state」，從不可變紀錄重算出當下狀態。

來源：[Temporal: Events and Event History](https://docs.temporal.io/workflow-execution/event)

### 4.4 被否決的替代案：廢除 `auto-run.md`，把批次欄位下放到各任務

考慮過的方案：不要這個檔案，改在每個任務的 frontmatter 加 `batch: 20260816-1400` 與 `batch_seq: 3`，批次成員與順序用 `rg '^batch:'` 導出。它的吸引力是檔案數更少、每個事實都跟著它描述的對象走。

**駁回**，兩個理由：

1. **它得寫進 `spec.md`，而 `spec.md` 簽核後凍結**。批次選取發生在任務已經有 spec 之後（`ade-dev-auto` 第 12 步掃的就是既有任務），寫 `batch:` 就是動一份已凍結的文件。若改寫進 `plan.md`，則卡在第 1 關、還沒有 plan.md 的任務無處可寫——而那正是最需要被選入批次補齊的一群。
2. **批次本身的身分無處安放**。「剔除了誰、為什麼」不屬於任何被選入的任務（被剔除的那顆根本不在批次裡），它是批次這個對象的屬性。硬要塞就得在被剔除的任務裡寫「我曾被 batch X 剔除」，那才是真正的錯位。

另外它也違反 §1.2 的欄位數約束（一口氣加兩個純為批次服務的欄位到任務層文件），收益只有少一個檔案。留檔、瘦身、加禁記清單，是成本更低的解。

---

## 5. schema 擴充的相容性

新增 `approved_by` 與 `halted` 會不會破壞既有的「逐字精確匹配」？不會，有三層保證：

1. **YAML 層**：mapping 的定義是 "an unordered set of key/value node pairs, with the restriction that each of the keys is unique"。新增 key 不影響既有 key 的存在與取值，也沒有順序依賴。
2. **匹配層**：`research-devflow-state.md` §1 訂的查詢方式是 `rg '^status:'`——**行首錨定、冒號結尾**，`approved_by:` 不會被它匹配到（`^status:` 不匹配 `approved_by:`），`^status:` 的結果也不因多了幾行而改變。checkbox 的 `- [ ]` / `- [x]` 完全不受影響。
3. **慣例層**：Kubernetes 對同類 schema 明講 "Additional fields may be added in the future."；MADR 的 metadata 欄位 "These are optional elements. Feel free to remove any of them."——**加法式擴充、缺席合法**是這類 frontmatter schema 的既定契約，不是我們自創的特例。

唯一的真實風險是 §1.2 第 2 條在防的那個：欄位一多，YAML 的坑（縮排、`yes/no` 被解讀成布林、需要引號的字串）就會開始出現。三個單行純字串欄位踩不到，第四個開始要重新評估。

來源：[YAML 1.2.2 spec §3.2.1.1](https://yaml.org/spec/1.2.2/)、[Kubernetes API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)、[MADR](https://adr.github.io/madr/)

---

## 6. 逐條修訂建議（可檢查清單）

以下每條可獨立驗收。行號為研究當下（commit `ac1f297`）的位置。

### `skills/ade-dev/SKILL.md`

| # | 位置 | 改動 | 驗收 |
|---|---|---|---|
| **D1** | 第 27 行 | 把「人簽核時改為 `status: approved`」改為「**過關時**改為 `status: approved`（逐字一致，工具靠精確匹配）」——過關方式有兩種，這行不該只講一種 | 全文搜尋不再有「`approved`＝人簽核」的單一綁定敘述 |
| **D2** | 第 27 行後新增一條 | 「同一次寫入 `approved_by`：人簽核寫 `human`，auto-pilot 由 Spec Ready 替代簽核寫 `spec-ready`。**此欄位一經寫入不得修改**（它記的是當時誰簽的，不是現在的模式）；欄位缺席視同 `human`。人事後補審 auto 簽的文件，在 `notes.md` append 一則，不回頭改本欄位。」 | §1.2 的 schema 與此條一致 |
| **D3** | 第 31 行 | **整行換成** §1.3 的接手判讀規則全文（七條 ＋ 執行模式判讀） | 規則涵蓋六個關與「檔案不存在」分支；`ade-dev-auto` 不再重述判讀邏輯 |
| **D4** | 第 91 行 | 刪掉「frontmatter 照標 `approved`，`notes.md` 留痕『由 Spec Ready 替代簽核』」，換成「簽核點降為回報點（frontmatter 寫 `status: approved` ＋ `approved_by: spec-ready`）」——留痕從散文改為欄位 | 「由 Spec Ready 替代簽核」不再只存在於散文 |
| **D5** | 第 112–116 行（Auto-pilot 煞車） | 在「停下必附情境」那條**之前**加一條：「停下時在 `plan.md` frontmatter 寫 `halted: <原因碼>`（取值對應下列煞車條款：`test-tampering` / `blacklist-path` / `spec-gap` / `review-blocking` / `oversize` / `test-red` / `test-env` / `compaction`）；**存在即為不得自動續跑**，人裁決處理完刪除該行。」 | 八個原因碼與煞車條款一一對應，無孤兒 |
| **D6** | 第 116 行 | 「停下必附情境」維持不變，但補一句界定分工：「（frontmatter 記機器判讀用的原因碼，`notes.md` 記完整情境）」 | 兩處不重複記同一層級的資訊 |
| **D7** | 第 18–23 行的檔案樹註解 | `spec.md` 註解補「（frontmatter: `status` / `approved_by`）」、`plan.md` 補「（frontmatter: `status` / `approved_by` / 停機時 `halted`）」 | 讀檔案樹即知有哪些欄位 |

### `skills/ade-dev-auto/SKILL.md`

| # | 位置 | 改動 | 驗收 |
|---|---|---|---|
| **A1** | 第 12 行 | 掃描規則改為引用而非重述：「掃 `.ade-dev/*/`，對每個目錄套 `ade-dev` 的**接手判讀規則**得出卡在哪一關，供人多選。」 | 本檔不再有任何獨立的狀態判讀敘述 |
| **A2** | 第 8 行（職責宣告） | 現行寫「不定義任何任務內的判準、執行規則或煞車」，補上「**與狀態判讀規則**」 | 職責邊界與 A1 一致 |
| **A3** | 第 15 行 | 補續跑條件：「依序逐顆執行前，先確認該顆的執行模式判讀為 auto（兩份 `approved_by` 皆 `spec-ready` 且無 `halted:`）」 | 降回手動的任務不會被下一輪批次誤撿 |
| **A4** | 第 35 行 | **整條換成** §1.4 的 `auto-run.md` 定案全文（記什麼、禁記清單、接手續跑三段） | 檔案內不再出現 checkbox 或各顆狀態 |
| **A5** | 第 26–31 行（批次熔斷） | 段末補一條：「熔斷狀態不落檔——接手時依 `auto-run.md` 的順序與各顆 `halted:` **重跑一次本節判定**；環境阻塞當下重新觀察，不沿用上一個 session 的結論。」 | 與 §4.3 一致 |
| **A6** | 第 36 行 | 「Spec Ready 評估結果記進各任務自己的 `notes.md`」維持——這條本來就對（評估結果是任務層事實），無須改 | — |

### 交叉檢查

| # | 檢查 | 通過條件 |
|---|---|---|
| **X1** | 「這顆在 auto 模式」這個事實 | 只能從 `approved_by` 導出，全 repo 沒有第二處記載 |
| **X2** | 「這顆已停」這個事實 | 只有 `plan.md` 的 `halted:` 一處為權威；`notes.md` 的敘述是歷史紀錄不是狀態 |
| **X3** | 狀態判讀規則 | 全 repo 只有 `ade-dev` 一份全文 |
| **X4** | `auto-run.md` | 逐行檢查，沒有任何一行描述會隨時間改變的事實 |
| **X5** | frontmatter 欄位總數 | 三個（`status` / `approved_by` / `halted`），無 `date`、無 `mode`、無 `batch` |

---

## 7. 查無實證與已知風險

**查無實證**（明說，別當依據用）：

1. **LLM 寫 `approved_by` 這類新欄位的漏寫率**。`research-devflow-state.md` §5.1 引的 Claude Code key 修復層證明模型會拼錯欄位名（`active_form` vs `activeForm`），但沒有量化。我們的緩解只有兩個：欄位名全小寫加底線、以及 §2.4 的 fail-closed（漏寫 → 判成 `human` → 走手動，安全側）。
2. **「存在即為真」的旗標（`halted:`）比布林欄位（`halted: true/false`）可靠多少**。選前者的理由是原理性的——布林欄位有「忘記從 true 改回 false」的失效模式，而刪整行沒有中間態；查無實證。
3. **agent 忘記在停機時寫 `halted:` 的機率**。這是本方案最脆弱的一環：漏寫會讓已停的任務被判成可續跑，且方向是**不安全**的那側（與 §2.4 相反）。緩解建議是把寫 `halted:` 放進煞車條款的**第一個動作**（先寫旗標再報告），而不是收尾動作。

**已知殘留風險**：

- **人手動編輯 frontmatter 時的不一致**（例如刪了 `halted:` 卻沒處理根因）。這是流程紀律問題，任何 schema 都擋不住。
- **`auto-run.md` 的禁記清單靠紀律維持**。沒有工具會擋住有人在裡面寫進度。可檢查的緩解是 §6 的 X4：把「本檔不得出現 checkbox」寫成明文，因為 checkbox 是最容易被違規引入的形狀，也最容易被 `rg '^\s*- \[' auto-run.md` 抓出來。

---

## 附錄：全部一手來源

**Anthropic 官方**
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 跨 session 接手、明寫讀取順序、限制可改欄位

**狀態 schema 慣例**
- [Kubernetes API Conventions（conditions: `reason` / `message`、欄位擴充）](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
- [MADR（frontmatter `status` / `date` / `decision-makers`，欄位可選）](https://adr.github.io/madr/)
- [git-commit(1)（author 與 committer 分欄）](https://git-scm.com/docs/git-commit)
- [YAML 1.2.2 spec §3.2.1.1（mapping 為無序 key/value 集合）](https://yaml.org/spec/1.2.2/)

**耐久狀態與復原**
- [Martin Fowler, Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) — event log 不可變、application state 可重建
- [Temporal: Events and Event History](https://docs.temporal.io/workflow-execution/event) — append-only log、崩潰後 replay 重建狀態
- [Temporal: Child Workflows](https://docs.temporal.io/child-workflows) — 父記子的生命週期、子有自己的 Event History、不共享 local state

**設計原則**
- [Saltzer & Schroeder, The Protection of Information in Computer Systems（fail-safe defaults）](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html)

**本 repo 前置研究**
- [research-devflow-state.md](./research-devflow-state.md) — 單一真相、frontmatter + checkbox、不設 status.json
