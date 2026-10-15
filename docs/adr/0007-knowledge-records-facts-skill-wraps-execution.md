---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識記錄事實，skill 引用知識並封裝執行；人不透過 agent 做事時也需要知道的內容放在知識，只有 agent 執行時需要的放在 skill"
notes: "skill 不得重述知識；腳本屬於 skill，知識庫不放可執行的腳本；取代 docs/research/ade-dev/research-skill-boundaries.md §1.2 的結論"
---

# 知識記錄事實，skill 引用知識並封裝執行

## Context and Problem Statement

ADE 以知識與 skill 兩種形式提供內容，目的是讓團隊內的人與 agent 對同一件事有一致的認知。seed 中的 skill 對兩者的分工不一致：`ade-dev` 只寫觸發條件與指向知識的指標；`ade-commit` 重述了知識中的 commit 規則；`ade-create-prd` 在 skill 內寫了 PO 手寫 PRD 時也需要回答的問題清單。另一方面，`docs/research/ade-dev/research-skill-boundaries.md` §1.2 主張規範只能寫在 skill。問題是：一項內容應寫在知識還是 skill？

## Decision Drivers

* 人以知識理解一件事，agent 同時讀知識與 skill；人也需要知道的內容若只寫在 skill，人與 agent 的認知就不一致。
* 同一件事只應記錄一次，否則修改一處後另一處過期。
* 知識的讀者包括人，只和 agent 操作有關的細節會提高人讀知識的查找成本。

## Considered Options

* 依「人不透過 agent 做這件事時是否需要知道」劃分
* skill 只含觸發條件、指標與腳本，所有步驟寫在知識
* 規範寫在 skill，知識只放描述性內容

## Decision Outcome

Chosen option: "依「人不透過 agent 做這件事時是否需要知道」劃分", because 它直接對應 ADE 的目的：人與 agent 共同需要的事實只有一份，放在雙方都讀的知識；只有 agent 需要的操作細節留在 skill，不增加人讀知識的成本。

規則如下：

* 知識記錄事實，包括規則、判準、流程的定義、範本，以及每一步的產出。
* skill 記錄觸發條件、讀取知識的時機與順序、與工具互動的方式，以及呼叫的腳本。
* skill 需要知識的內容時，以引用指向知識，不得重述。
* 腳本屬於 skill，知識庫不得放可執行的腳本；知識的內文可以用程式碼區塊附上說明用的指令或範例。

### Consequences

* Good, because 人與 agent 讀到同一份事實，修改規則只需要改一處。
* Good, because 知識不含 agent 的操作細節，人閱讀時不受干擾。
* Bad, because 既有的 skill 必須改寫，例如 `ade-commit` 刪除重述的規則，`ade-create-prd` 把問題清單移到知識。
* Bad, because agent 執行 skill 時，需要多一次讀取知識的跳轉。
* Bad, because 劃分依賴判斷，除了腳本以外無法機械檢查。

### Confirmation

skill 是否重述知識、內容的歸屬是否正確，以 review 確認；知識庫內是否有可執行的腳本，由 runner 的檢查確認。

## Pros and Cons of the Options

### 依「人不透過 agent 做這件事時是否需要知道」劃分

* Good, because 判準直接對應 ADE 的目的，事實只有一份。
* Bad, because 少數內容難以判斷，需要撰寫者斟酌。

### skill 只含觸發條件、指標與腳本，所有步驟寫在知識

* Good, because 判斷最簡單，`ade-dev` 已經採用這種做法。
* Bad, because 只和 agent 操作有關的細節也寫進知識，提高人讀知識的查找成本。
* Bad, because 純屬 agent 操作的 skill，本文會變成只有指標的空殼。

### 規範寫在 skill，知識只放描述性內容

* Good, because agent 執行時不需要額外讀取知識。
* Bad, because 人不讀 skill，規範只寫在 skill 時，人與 agent 的認知不一致。

## More Information

本決策取代 [research-skill-boundaries.md](../research/ade-dev/research-skill-boundaries.md) §1.2「規範的唯一可修改處永遠是 skill」的結論；該研究的證據與「同一件事只記錄一次」的原則仍然成立。本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.16`（收錄邊界與文件類型的歸屬）。
