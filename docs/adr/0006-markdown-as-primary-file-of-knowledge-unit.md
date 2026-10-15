---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識庫不限制檔案格式，每個知識單位以一份 `.md` 為主要檔案，id 只寫在 `.md` 的 frontmatter；其他格式是資料夾單位內的附件"
notes: "附件不帶 id，無法以符號個別引用，需要時以名稱指稱；取代 ADR-0004 中 YAML 檔在頂層寫 id 的規則"
---

# 知識單位以 Markdown 檔為主要檔案，其他格式作為附件

## Context and Problem Statement

能以文字描述的內容都是知識，但知識不一定只以 `.md` 呈現，例如服務清單以 YAML 記錄各服務的欄位，架構以圖片呈現。[ADR-0004](./0004-address-knowledge-by-immutable-random-id.md) 規定 `.md` 檔把 id 寫在 frontmatter，YAML 檔寫在頂層；每多允許一種格式，就要定義該格式寫入 id 的位置，而圖片這類格式無法寫入 id。問題是：知識庫允許哪些格式，非 `.md` 的檔案如何被引用？

## Decision Drivers

* 知識不應因格式而無法收錄。
* 關聯以 id 建立，每個知識單位都必須有 id。
* runner 的檢查應只需要解析一種寫入 id 的方式。

## Considered Options

* 格式不限，每個單位以 `.md` 為主要檔案，其他格式作為附件
* 只允許 `.md` 與 `.yaml`，兩者各自寫入 id
* 格式不限，各格式各自定義寫入 id 的位置

## Decision Outcome

Chosen option: "格式不限，每個單位以 `.md` 為主要檔案，其他格式作為附件", because 它讓任何格式的內容都能收錄，同時讓 id 只有一種寫法，每個單位仍能以符號引用。

規則如下：

* 每個知識單位必須有一份 `.md` 作為主要檔案，id 只寫在 `.md` 的 frontmatter。
* 包含非 `.md` 檔案的單位必須是資料夾，主要檔案是資料夾的 `README.md`。
* 非 `.md` 的檔案是附件，不帶 id，由同一單位的 `.md` 以相對路徑引用；其他單位引用時，指向附件所屬單位的符號。
* 需要指稱個別附件時，以名稱指稱，例如服務清單中的服務名稱。

### Consequences

* Good, because 圖片、資料檔等任何格式的內容都能收錄。
* Good, because runner 只需要解析 `.md` 的 frontmatter。
* Bad, because 附件無法以符號個別引用；以名稱指稱的附件不經過引用檢查，附件改名或刪除後，舊的提及不會報錯。
* Bad, because 圖片這類附件無法以 grep 搜尋，內容過期時不易察覺。
* Bad, because 原本單獨成為單位的 YAML 檔，必須放進帶有 `README.md` 的資料夾。

### Confirmation

runner 的檢查只從 `.md` 的 frontmatter 讀取 id，並檢查每個非 `.md` 檔案所在的資料夾都有 `README.md`。

## Pros and Cons of the Options

### 格式不限，每個單位以 `.md` 為主要檔案，其他格式作為附件

* Good, because 收錄不受格式限制，id 只有一種寫法。
* Bad, because 附件只能透過所屬單位引用。

### 只允許 `.md` 與 `.yaml`，兩者各自寫入 id

* Good, because 兩種格式都是純文字，可以 grep，YAML 檔可以單獨成為單位。
* Bad, because 無法收錄圖片等格式的內容。
* Bad, because runner 必須解析兩種寫入 id 的方式。

### 格式不限，各格式各自定義寫入 id 的位置

* Good, because 每個檔案都能以符號個別引用。
* Bad, because 圖片等格式無法寫入 id，這個做法無法對所有格式成立。
* Bad, because 每新增一種格式，runner 就要支援一種新的解析方式。

## More Information

本決策取代 [ADR-0004](./0004-address-knowledge-by-immutable-random-id.md) 中「YAML 檔寫在頂層的 `id` 欄位」一條；ADR-0004 的其餘決定，包括以不可變的隨機 id 定址與引用的寫法，仍然有效，因此 ADR-0004 維持 accepted。本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.16`（收錄邊界與文件類型的歸屬）。
