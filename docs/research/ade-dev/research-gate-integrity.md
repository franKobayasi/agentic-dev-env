# Gate 體系完整性：前置條件與執行期煞車的分界

> **文件性質**：研究參考，不是流程規則。本文處理的是既有 gate 體系（`skills/ade-dev/SKILL.md` 的「Spec Ready 判定與 auto-pilot 模式」段）被 code review 找出的四個缺陷，並給出可直接落入 SKILL.md 的修訂全文。真正上線的判準以 skill 為準。
>
> 研究日期 2026-08-16。
>
> **採用標注（2026-08-16）**：§3 四項定案（G5 補號併入交付定義完整、規劃後重檢、G8 含 CI、閾值錨定）與 §1.3 的 B1 重驗已全數落入 `skills/ade-dev`、`skills/ade-dev-auto`。research-autopilot-readiness.md 依 research-skill-boundaries.md §4.4 的治理原則不回改——採用差異由 skill 的依據行標明。
>
> 前置文件：[research-autopilot-readiness.md](./research-autopilot-readiness.md)（G1–G8 的編號源頭與依據，本文的修訂需回頭同步該文）、[research-phase-sizing.md](./research-phase-sizing.md)（400 行／10 檔的來源）

---

## 1. 結論先行

### 1.1 一句話診斷

四個缺陷不是四個獨立的筆誤，是**同一個結構性缺漏的四種外顯**：gate 清單只寫了「檢查什麼」，沒有寫「什麼時候檢查」。

一條沒有標明評估時機的前置條件，會自動漂移成事後偵測——這正是缺陷 2（Phase 層檢查在 auto 模式無人執行）與缺陷 3（G8 的 CI 條款掉了以後沒人發現交付通道少了驗證）的共同機制。缺陷 1（編號斷孔）是同一件事的表面症狀：G5、G6 之所以會掉標籤，是因為它們被寫在「每個 Phase 逐顆檢查」那一段裡，而那一段在文件結構上長得不像 gate。缺陷 4（閾值錨定）則是同一條判準在 gate 與煞車兩處各寫一次數字、沒有互相錨定的必然後果。

所以修訂的主軸只有一條：**每一條 gate 都必須帶三個屬性——ID、評估時機、不過時的處置**，缺一不可。這也是本文所有外部依據指向的同一件事（§2）。

### 1.2 四個定案（摘要，全文見 §3）

| # | 缺陷 | 定案 |
|---|---|---|
| 1 | 編號斷孔 G4→G7 | **不重新編號、不改語意化 ID**。補回 **G5** 標籤，把目前未標號的「交付定義完整」折進 G5（它是 G5 的可評估前提），並改用「評估時機」而非「任務層／Phase 層」當分段依據——斷孔隨即消失（G5、G6 不是缺號，是評估時機不同）。追加一條 ID 穩定規則：發布後不重編、不回收，廢止留佔位。README 第 71 行的「G1–G8」補回 G5 後即成立，不需改 |
| 2 | Phase 層檢查在 auto 模式失去時機 | G5／G6 的評估時機明訂為 **`plan.md` 定稿當下**，不是任務啟動時。auto 模式在第 2 關產出 plan.md 後、進第 3 關前必須逐 Phase 重跑 G5／G6，結果寫進 `notes.md`。FAIL 二分處置：**規模超標可重切一次**、**資訊不足（列不出檔案／寫不清楚）零容忍立即停**。煞車清單新增對應條目 |
| 3 | G8 遺失「CI 必跑」 | G8 補回並拆成前置與執行期兩半：前置查「通道受限 ＋ 目標 repo 有會在 MR 上跑的 CI」；執行期把 CI 紅／CI 跑不起來分別接到既有的雙計數器。**目標 repo 無 CI ＝ G8 FAIL**（缺席不是通過），解法是加一條跑 G3 指令的最小 workflow；人可逐案明示豁免，但那是人工放行不是自動 PASS |
| 4 | 閾值錨定模糊 | 錨定在**該 Phase 適用的硬閾值**（基準 400 行／10 檔；命中 G6 折半為 200 行／5 檔）的 2 倍，任一維度超過即停；**不錨定** auto 加嚴的「> 3 檔要寫理由」——那是軟觸發不是上限。行數計法與豁免項沿用第 3 關，避免 gate 與煞車用兩把尺量同一件事 |

### 1.3 順帶發現（本次 review 未列，但屬同一缺陷類）

**`ade-dev-auto` 的 B1 有一模一樣的時機問題。** B1 要求「批次內任務的預期改動檔案互不相交」，但任務啟動時只有預估清單，真正的檔案清單要到各任務 `plan.md` 定稿才確定。既然 G5／G6 要在 plan 定稿後重檢，B1 也該在同一個時點重驗一次（後定稿的任務與已定稿任務取交集），否則 cell 邊界同樣是靠猜的。建議與缺陷 2 一併修訂 `ade-dev-auto`；本文不改該檔。

---

## 2. 外部依據：五條原則

### 2.1 前置條件的定義就是「在事情發生之前」——不是「在清單上」

Kubernetes admission controller 是這條原則寫得最死的一手來源（[Admission Controllers Reference](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)）：

> "An admission controller is a piece of code that intercepts requests to the Kubernetes API server **prior to persistence of the resource**, but after the request is authenticated and authorized."

> "If any of the controllers in either phase reject the request, **the entire request is rejected immediately** and an error is returned to the end-user."

而當同一組規則失去這個時機、只能事後跑時，它就變成另一種東西——OPA Gatekeeper 明確地把它分開命名為 audit（[Gatekeeper Audit](https://open-policy-agent.github.io/gatekeeper/website/docs/audit/)）：

> "Audit performs **periodic evaluations of existing resources** against constraints, **detecting pre-existing misconfigurations**."

**對我們**：admission（拒絕寫入）與 audit（事後回報既存違規）是同一組 constraint 的兩種部署方式，效果完全不同。目前 auto 模式下的 Phase 層檢查就處在 audit 的位置——規則還在文件上，但只在超大 diff 已經寫出來、命中「實際規模超閾值 2 倍」煞車時才被動發現。缺陷 2 的本質就是 admission 靜默降級成 audit。

### 2.2 需要中途產物才能評估的 gate，時機就是「產物產出的當下」

HCP Terraform 的 run 生命週期是本研究找到最貼近我們處境的一手範例——它要檢查的東西（會改動哪些資源、規模多大）在啟動時並不存在，必須先跑出 plan 才知道，所以策略檢查被放在 plan 與 apply 之間（[Run States and Stages](https://developer.hashicorp.com/terraform/cloud-docs/run/states)）：

- Sentinel 策略檢查「occurs after a successful `terraform plan`」；OPA 策略檢查「after a successful `terraform plan` and before Cost Estimation」
- 不過時的處置分級寫得很清楚：「If any **hard-mandatory** policies failed, **the run does not continue** (Plan Errored state)」；「If any **soft-mandatory** policies failed, the run pauses in the **Policy Override** state」，需具備覆寫權限的人放行；advisory 失敗則只留警告續跑

**對我們**：`plan.md` 就是我們的 plan，第 3 關就是 apply。G5／G6 是「對 plan 內容生效的策略」，它的正確時機不是任務啟動，而是 plan 定稿之後、動工之前。Terraform 三級 enforcement 也給了 FAIL 處置的現成語彙：資訊不足型 = hard-mandatory（停）、規模超標型 = 可修正後重跑（改 config 再 plan 是 Terraform 的正常路徑）、auto 加嚴的「> 3 檔寫理由」= advisory（留痕續跑）。

同方向的第二個一手來源是 Argo Rollouts 的 `prePromotionAnalysis`（[Blue-Green Deployment Strategy](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/)）：它「Configures the Analysis **before it switches traffic** to the new version」，失敗則直接 abort、流量不切換；對照組 `postPromotionAnalysis` 在切換之後跑，失敗只能把流量切回去。**同一組指標，放在切換前是 gate，放在切換後是 rollback。** 我們現在的處境是後者。

### 2.3 gate 會過期，所以要重新評估——而不是評估一次就當永遠成立

Azure Pipelines 的 deployment gates 把這件事做成了機制（[Deployment gates concepts](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/approvals/gates)）：

> "Most of the health parameters vary over time, regularly changing their status from healthy to unhealthy and back to healthy. To account for such variations, **all the gates are periodically reevaluated until all of them are successful at the same time**. The release execution and deployment doesn't proceed if all gates don't succeed in the same interval and before the configured timeout."

它也把 gate 依時機命名成兩類：pre-deployment conditions（階段開始前）與 post-deployment conditions（階段結束後），並各自有 **Delay before evaluation**——「a time delay at the beginning of the gate evaluation process that allows the gates to initialize, stabilize, and begin providing accurate results」。

Flagger 的 webhook 清單則是把「同一件事在不同時機檢查」列得最細的一手來源（[Flagger Webhooks](https://fluxcd.io/flagger/usage/webhooks/)），每一個 hook 的失敗後果都不同：

| hook | 時機（原文） | 失敗後果（原文） |
|---|---|---|
| `confirm-rollout` | "executed before scaling up the canary deployment" | "The rollout is paused until the hook returns a successful HTTP status code." |
| `pre-rollout` | "executed before routing traffic to canary" | "The canary advancement is paused if a pre-rollout hook fails and **if the number of failures reach the threshold the canary will be rollback**." |
| `rollout` | "executed during the analysis on each iteration before the metric checks" | "the canary advancement is paused and eventfully rolled back" |
| `confirm-promotion` | "executed before the promotion step" | "The canary promotion is paused until the hooks return HTTP 200." |
| `post-rollout` | "executed after the canary has been promoted or rolled back" | "**the error is logged**"（不中止） |

**對我們**：成熟的漸進式交付系統沒有一個把 gate 寫成一張沒有時間軸的清單。每一條都綁死「在什麼動作之前／之中／之後」，且**同一條檢查在不同時機有不同的失敗後果**。我們的 gate 清單缺的就是這一欄。

### 2.4 缺席不是通過——「沒有訊號」必須算 FAIL 或另立第三種狀態

這是缺陷 3（無 CI 的 repo 算不算 PASS）的直接依據，兩家一手來源給了同一個答案。

GitLab 的 "Pipelines must succeed" 設定（[Auto-merge / merge checks](https://docs.gitlab.com/ee/user/project/merge_requests/auto_merge.html)）：

> "The setting **requires the existence of a successful pipeline, not the absence of failed pipelines**. A merge request with **no pipelines at all is not considered to have a successful pipeline, and cannot merge**."

GitHub 的 required status checks（[About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)）：

> "Required status checks must have a `successful`, `skipped`, or `neutral` status before collaborators can make changes to a protected branch."

而一個被要求、卻永遠不會回報的 check 會把 PR 卡死，官方 troubleshooting 文件直接示範了這個陷阱（[Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)）：

> "A pull request that only changes a file in the repository root will not trigger this workflow. If `build` is required, the pull request is blocked with **'Waiting for status to be reported.'**"

這與前置研究已引用的兩條完全同構：Argo Rollouts 用 `failureLimit: 0` / `consecutiveErrorLimit: 4` 把「它是壞的」與「我判斷不出來」分開；Google CAS 在 PASS/FAIL 之外設第三種 verdict `NONE`——「if underlying infrastructure was unavailable and CAS could not reach a verdict」（見 research-autopilot-readiness.md §5.3）。

**對我們**：「這個 repo 沒有 CI」不是 PASS，也不該偽裝成 PASS。它要嘛是 FAIL，要嘛必須有一個自己的名字。本文對 G8 選 FAIL（§3.3 說明理由）；對「尚未到評估時機」的 G5／G6 選第三種狀態 `DEFERRED`（§3.1）。

### 2.5 判準 ID 一旦發布就不要重編

CWE 的 schema 把這條寫成明文規則（[CWE XML Schema, StatusEnumeration](https://cwe.mitre.org/documents/schema/)）：

- "A value of **Deprecated** refers to an entity that has been removed from CWE, likely because it was a duplicate or was created in error."
- "A value of **Obsolete** is used when an entity is still valid but no longer is relevant, likely because it has been superseded by a more recent entity."
- 以及最關鍵的一句：當條目被廢止時，「**the ID should not be reused, and a placeholder for the deprecated category should be left in the catalog**」。

反方向的代價則有 OWASP ASVS 的實例（[ASVS 5.0, For Users of 4.0](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x05-For-Users-Of-4.0.md)）：

> "**Even requirements that were not substantively modified have different identifiers due to reordering or restructuring.**"
> "To facilitate adoption of version 5.0, **mapping documents are provided** to help users trace how requirements from version 4.x correspond to those in version 5.0."

一次重編號的代價是永久維護一份對照表。ESLint 的規則廢止政策則是另一種取向——乾脆不移除（[Rule Deprecation](https://eslint.org/docs/latest/use/rule-deprecation)）：「**Rules will never be removed from ESLint** unless one of the following is true: The rule has been replaced by another core rule. A plugin exists with a functionally equivalent rule.」

**對我們**：`ade-dev-auto` 要求逐 gate 輸出 PASS／FAIL，`notes.md` 會長期留下「G3 不過」這種紀錄，跨任務、跨批次比對都靠這些 ID。重新連續編號會讓所有歷史紀錄的語意改變且無法察覺（舊 notes 寫的 G7 是黑名單，新編號的 G7 可能是別的東西）——這比留一個號碼斷孔糟得多。**語意化 ID**（如 `SPEC-TESTABLE`）在可讀性上更好，但那是一次全面重編號，代價與 ASVS 相同，而我們的收益只有「不用記 G3 是什麼」——不划算。

---

## 3. 定案全文（可直接落入 SKILL.md）

以下三小節是替換文字，可整段取代 SKILL.md 現行的「Spec Ready 判定與 auto-pilot 模式」段。變更點以 ⚑ 標出。

### 3.1 Gate 清單定案

**編號方案**：維持 G1–G8 原編號與原語意，只做三件事——(a) 補回 G5 標籤；(b) 把未標號的「交付定義完整」折進 G5；(c) 分段依據從「任務層／Phase 層」改為**評估時機**。並新增一條 ID 穩定規則。

替換文字：

> **Spec Ready 判定**——逐條列 PASS／FAIL，不打分數；任一 FAIL 即不得 auto，並輸出一句話理由（如「G3 不過：沒有可執行的測試指令」）。依據與數字出處：ADE `knowledge/process/research-autopilot-readiness.md`、`research-gate-integrity.md`。
>
> ⚑ 每條 gate 都帶**評估時機**，時機到了才評；未到時機的 gate 輸出 `DEFERRED` 而非省略，讓清單永遠是完整的 G1–G8。⚑ **gate ID 一旦發布不重編、不回收**：廢止就留佔位（`G5（已廢止，由 Gn 取代）`），新增只往後加——歷史 `notes.md` 與批次總結靠 ID 比對，重編號會讓舊紀錄語意漂移且無法察覺。
>
> **任務啟動前評估**（資訊在 `spec.md` 就齊備）：
>
> - **G1** 需求來自已確認的 PRD，且產品規格有對應的 🚧 區塊
> - **G2** `spec.md` 每個行為描述可判定（可直接寫成測試）並指名 ≥ 1 個具體檔案路徑或介面名；無未決 open question（後者只是前提不是充分條件——它可以靠不提問刷出來）
> - **G3** 有可執行的驗證指令，動工前基準是綠的，單次執行 < 10 分鐘
> - **G4** 驗收測試在 `spec.md` 已定名（展開時只是細化成 Given/When/Then，不是現場發明）
> - **G7** 預期改動路徑不碰黑名單：認證授權、金流、DB migration、CI/CD 設定、密鑰與環境變數、對外 API 契約
> - **G8** ⚑ 交付通道受限且有 agent 以外的自動驗證（全文見下方 G8 專段）
>
> ⚑ **`plan.md` 定稿後評估**（需要 Phase 地圖才評得出來，逐 Phase 檢查，任一 Phase 不過＝整顆任務不 Ready）：
>
> - **G5** 每個 Phase 的交付定義完整到能估出規模（1–3 行寫得清楚、預期改動檔案列得出來），且估出的規模在該 Phase 適用的硬閾值內（400 行／10 檔）；auto 模式加嚴：> 3 檔要在 `plan.md` 寫明理由（寫了就算過，這是要求解釋不是上限）
> - **G6** repo > 800 檔或 > 300K 行時，G5 的硬閾值折半（200 行／5 檔）
>
> 手動模式下 G5／G6 由規劃關的人簽核涵蓋；auto 模式的重檢規則見下。

「交付定義完整」折進 G5 的理由：它不是一條獨立判準，而是 G5 可被評估的前提——列不出預期改動檔案就估不出行數與檔案數，G5 根本無從判定。折進去以後 Phase 層不再有無標號項目，`ade-dev-auto` 的逐 gate 輸出也就真的涵蓋全部判準。

**`ade-dev-auto` 的輸出格式建議**（該檔本文不改，僅建議）：任務啟動時的就緒報告固定列滿 G1–G8，G5／G6 標 `DEFERRED（待 plan.md 定稿）`；規劃關結束後補一次 `G5/G6: PASS|FAIL`。這樣批次總結任何時候都看得出「哪些已判、哪些待判、哪些不過」，不會再有「像是漏檢」的觀感。此處的 `DEFERRED` 與 Google CAS 的 `NONE` 精神相同（不能下判定就要有名字），但語意不同：`NONE` 是「判不出來」，`DEFERRED` 是「還沒到時機」——不要混用。

### 3.2 規劃後重檢點定案（缺陷 2）

替換／新增文字：

> ⚑ **規劃後就緒重檢（auto 模式必做）**：第 2 關產出 `plan.md` 後、進入第 3 關前，逐 Phase 重跑 G5／G6，結果逐條寫進 `notes.md`（auto 模式沒有人簽核，這份紀錄就是規劃關的過關證據）。全 PASS 才進實作關。FAIL 依成因二分處置：
>
> - **規模超標**（交付定義清楚，但估出的行數／檔案數超過適用硬閾值）→ 允許**重切一次**：只能把 Phase 拆更小，不得改 `spec.md`、不得靠合併或改寫交付定義來壓低估計值。重切後重跑 G5／G6，仍 FAIL 即停、降回手動。
> - **資訊不足**（交付定義 3 行內寫不清楚、或列不出預期改動檔案）→ **零容忍立即停**，不重切。這是規格層問題不是規劃層問題，重試零幫助——同「要動產品行為但 spec 無依據」。
> - 停下時照煞車格式輸出情境：停在哪個 Phase、哪條 gate、FAIL 的一句話理由與當時的估計值。

並在**煞車（任務層）**的零容忍清單加一條：

> - ⚑ 規劃後 G5／G6 重檢不過（規模超標者允許重切一次，仍不過即停；資訊不足者不重切）

設計理由：重切一次而不是無限重切，是 Terraform「策略不過就改 config 再 plan」與 Devin 實測「會在死路上耗到底」（research-autopilot-readiness.md §2.7）兩者的折衷。重切一次能救的是「Phase 切太粗」這個真實且常見的規劃瑕疵；重切兩次以上還壓不進閾值，代表問題在規格範圍而不在切法，繼續自動重切只會產生越切越碎、彼此依賴的假 Phase。

「不得靠改寫交付定義來壓低估計值」這條限制不能省——它與「不得修改既有測試斷言使其變綠」是同一類漏洞：如果 agent 可以改動被量測的對象來通過量測，整個判準體系歸零。

### 3.3 G8 定案（缺陷 3）

commit ac1f297 搬移時掉了「CI 必跑」，而 research-autopilot-readiness.md §1.1 的 G8 原文是「只能開 PR、不得 push 主幹、**CI 必跑**、人 merge」。舊文字本身也不完整：它沒說目標 repo 沒有 CI 時怎麼辦。定案把 G8 拆成前置可查的部分與執行期才知道的部分。

替換文字（任務啟動前評估段）：

> - **G8** ⚑ 交付通道受限，且 MR 上有 agent 以外的自動驗證：
>   - 只走 MR（`ade-ship`），不得 push 主幹、不得自行 merge，merge 由人執行
>   - 目標 repo 有 CI，且該 CI 會被本任務的 MR 觸發（能在 repo 設定或 CI 設定檔查到）
>   - ⚑ **目標 repo 無 CI、或 CI 不會在 MR 上跑 → G8 FAIL**，該任務不得 auto（手動模式不受影響）。解法是在目標 repo 加一條跑 G3 驗證指令的最小 workflow，加完重評即 PASS
>   - ⚑ 例外只能由人逐案明示並記進 `notes.md`：無 CI 但 MR 描述附上可一鍵重跑的驗證指令與預期輸出，由人在 merge 前自行重跑。這是**人工放行**，不是自動 PASS——不得由 agent 自行認定適用

並在**執行期**加上對應處置（接到既有的雙計數器，不新增機制）：

> - ⚑ 第 6 關 Ship 的過關判準補一句：MR 發出後 CI 必須轉綠才算交付完成（auto 模式下，CI 未跑完就結束的任務標記為未完成，不計入批次成功）
> - ⚑ 煞車：**CI 紅**併入「測試紅了」計數器（產出是壞的，重試有意義，連續 3 次停）；**CI 跑不起來或長時間 pending** 併入「測試跑不起來」計數器（判斷不出來，另計連續 3 次停）

**為什麼無 CI 判 FAIL 而不是放行**：三條證據指向同一結論。(a) GitLab 與 GitHub 的一手行為就是「沒有 pipeline ≠ 通過」（§2.4）；(b) 無人值守跑完的任務，其驗證證據若全部由執行者自己產生並自己回報，就落回 SWE-bench 的弱測試漏洞與 Anthropic 觀察到的「agents tend to respond by confidently praising the work」（research-autopilot-readiness.md §2.4）——CI 的價值不只是「有跑測試」，而是**在 agent 觸及不到的環境裡重跑一次**；(c) DORA 明確主張以 peer review ＋ 自動化取代審批，而不是兩者都不要（同前 §3.2）。既然 auto 模式已經拿掉了規格關與規劃關的人為簽核，把最後一道自動驗證也拿掉就沒有任何防線了。

判 FAIL 的代價也確實很低：加一條跑 G3 指令的 workflow 是一次性成本，而 G3 已經要求那條指令存在且是綠的。

### 3.4 閾值錨定定案（缺陷 4）

替換文字（煞車，零容忍清單那一條）：

> - ⚑ 實際規模超過**該 Phase 適用硬閾值的 2 倍**——適用硬閾值＝ 400 行／10 檔，命中 G6 時折半為 200 行／5 檔；故煞車線為 800 行／20 檔，命中 G6 時為 400 行／10 檔。**兩個維度分別判定，任一超過即停**。行數計法與豁免項沿用第 3 關（以「人要逐行讀的行數」計；整檔刪除、工具產生的機械 refactor、產生檔豁免）

三個要點：

1. **錨定的是硬閾值，不是 auto 加嚴的「> 3 檔」。** 後者是軟觸發——它要求的是「寫明理由」而不是「不准超過」，把一個「要求解釋」的門檻乘以 2 沒有語意。
2. **必須跟著 G6 走。** 若煞車固定寫死 800 行／20 檔，在大 repo（G6 命中、閾值折半為 200／5）就等於容許實際規模達到適用閾值的 4 倍，G6 的校準效果被煞車抵銷掉一半以上。寫成「適用硬閾值 × 2」是唯一不會漂移的表述。
3. **計法要與 gate 一致。** gate 用「人要逐行讀的行數」並豁免機械改動，煞車若用 raw diff 行數，同一個 Phase 會出現「gate 說 300 行過關、煞車說 900 行超標」的矛盾。兩處引用同一個計法定義即可。

---

## 4. 修訂後的覆蓋矩陣（自我檢查用）

把每條 gate 攤在時間軸上，就能看出體系是否完整——每一條「啟動前才查一次」的前置條件，若在執行期可能被打破，就必須有一條對應的執行期煞車，且煞車的閾值錨定回同一條 gate。

| gate | 評估時機 | 執行期會不會被打破 | 對應煞車 |
|---|---|---|---|
| G1 PRD 已確認 | 啟動前 | 不會 | 無需 |
| G2 規格可判定 | 啟動前 | 會（做到一半發現規格沒涵蓋） | 「要動產品行為但 spec 無依據」即停 |
| G3 驗證指令可執行且基準綠 | 啟動前 | 會（環境壞、測試被改） | 測試紅 3 次／跑不起來 3 次；改測試斷言零容忍 |
| G4 驗收測試已定名 | 啟動前 | 會（現場發明測試） | 併入兩軸審查的規格符合度 |
| ⚑ G5 Phase 交付定義完整且規模在閾值內 | **plan.md 定稿後** | 會（實作後才發現低估） | ⚑ 重檢不過即停（可重切一次）＋ 實際規模超適用硬閾值 2 倍即停 |
| ⚑ G6 大 repo 閾值折半 | **plan.md 定稿後** | 不會（repo 規模在一次任務內不變） | 無需（但煞車閾值要跟著折半，§3.4） |
| G7 不碰黑名單 | 啟動前（用預期路徑） | 會（實作時才碰到） | diff 觸及黑名單即停 |
| ⚑ G8 通道受限 ＋ 有 CI | 啟動前（查通道與 CI 存在） | 會（CI 紅、CI 掛掉） | ⚑ CI 紅併入測試紅計數器；CI 跑不起來併入環境計數器 |

修訂前，這張表有兩個空格：G5／G6 那一列沒有評估時機（所以 auto 模式下實際上沒人評），G8 那一列沒有執行期條目（所以 CI 條款掉了也沒有任何機制察覺）。**這張矩陣本身建議放進 SKILL.md 或本文，作為未來增修 gate 時的檢查表**——新增一條 gate 就要能填滿這四欄。

---

## 5. 誠實標注

1. **本文的外部依據全部是「基礎設施部署」領域的類比，不是 coding agent 的實測。** Terraform 的 plan／apply、Azure 的 gate 重評估、Flagger 的 hook 生命週期，都是在講機器部署而不是機器寫程式。這些來源能支撐的是**結構性主張**（前置條件必須綁定時機、缺席不是通過、觸發條件與影響範圍要分開），不能用來支撐任何數字。本文的數字（重切一次、2 倍閾值）沿用既有研究或屬工程判斷。
2. **「重切一次」的 1 沒有任何實證依據**，與 research-autopilot-readiness.md §1.3 標注的 2／3 同性質。建議上線後記錄「重切後是否通過」的比例，跑滿 10 次再回頭調——若重切幾乎都能過，可放寬到 2 次；若幾乎都不能過，就該直接停、省掉這一輪。
3. **「無 CI ＝ FAIL」是本文推論最強的一步，也是最可能被實務推翻的一條。** GitLab／GitHub 的引用證明「主流工具認為沒有 pipeline 不算通過」，但那是在講已經有 CI 文化的 repo；把它推論成「沒有 CI 的 repo 不准 auto」跨了一步。若團隊多數目標 repo 無 CI，實際效果會是 auto 模式幾乎不可用——那時該做的是補 CI，而不是放寬 G8，但這個取捨要由人決定。
4. **`DEFERRED` 第三態會讓 `ade-dev-auto` 的輸出格式變複雜。** 它換來的是「清單永遠完整、看得出哪些還沒判」。若實際使用後發現沒人看那一行，可以退回「就緒報告只列 6 條、規劃後補列 2 條」，但那時必須在報告裡寫明「G5／G6 待規劃後評估」，不能只是省略。
5. **未查到的一手來源**：CVE 的 ID 重用政策（cve.org 的 CNA Rules 頁面抓不到正文）、NIST SP 800-53 對已撤回控制項識別碼的處理（原文 PDF 未取得）。ID 穩定性的主張目前靠 CWE schema 的明文規則與 ASVS 5.0 的反面實例支撐，兩者已足夠，但若日後要強化，這兩處是可補的。
