# 知識的流向

本文件記錄內容在 Generator、ADE 與 Forge 之間流動的原則：內容從單一來源向外發送，修改回到來源。名詞的定義見[詞彙表](../../CONTEXT.md)，runner、ADE 與 Forge 之間的契約細節見[依賴關係與相容性契約](../dependency-contract.md)。

流向有兩個迴圈，形狀相同。內容的迴圈讓團隊內的人與 agent 對同一件事保持一致，並讓知識持續迭代；機制的迴圈讓各 ADE 演化出的改良回到 Generator，讓所有 ADE 受益。下表列出兩個迴圈：

| 迴圈 | 來源 | 向外發送 | 回到來源 |
|---|---|---|---|
| 內容的迴圈 | ADE | 知識、skill 與常駐區段注入 Forge | 修改進入 ADE 的版控 |
| 機制的迴圈 | Generator | seed 與 runner 建立 ADE | 機制的改良以 issue 回饋 Generator |

## 內容的迴圈

ADE 是知識與 skill 的唯一事實來源，Forge 中的內容是它的副本。

### 流出

runner 注入 Forge 時，先刪除副本，再從 ADE 重新複製，並記錄來源的 commit。副本因此不會累積差異：以同一個 commit 注入的每個 Forge，內容完全相同。Forge 在每次 session 開始時比對記錄的 commit 與 ADE 的最新 commit，落後時提醒更新，讓不一致可以被看見。

### 流回

建立與修改知識或 skill 必須在 ADE 的版控中進行。直接修改 Forge 中的副本不會同步給其他人，下次更新時也會被覆蓋。ADE 放在程式碼託管平台時，修改以 PR 經過 review 後合併；只在本地使用時沒有 PR，修改直接以 commit 進入版控。

在 Forge 中發現知識需要修改時，agent 在工作副本建立分支並修改，再送回 ADE。

### 讀寫分離

Forge 中的副本用於讀取與導覽；修改知識時，必須以 ADE 或工作副本的內容為準。副本可能落後於 ADE，以副本為基準修改，會覆蓋其他人已合併的修改，或遺漏尚未注入的內容。

## 機制的迴圈

Generator 以 seed 建立 ADE，並把 ADE 依賴的 runner 鎖定在建立當下的精確版本。ADE 建立後即與 Generator 的迭代脫鉤：seed 的修改不會傳到既有的 ADE，runner 的升級由 ADE 修改版本號決定。每個 ADE 因此依自己的步調演化，Generator 發版不會讓既有的 ADE 失效。

ADE 在使用中演化出的機制改良，例如 skill 的寫法、範本的結構與流程的設計，以 issue 回饋 Generator，由 Generator 的維護者決定是否採納。回饋只限於機制：ADE 的知識屬於團隊，回饋的內容不得包含知識，也不得包含公司名稱、服務名稱等能辨識團隊的資訊。

## 落實方式

本文件的原則依下表落實：

| 原則 | 落實的機制 |
|---|---|
| 副本整個覆蓋、記錄來源的 commit | runner |
| 落後時提醒更新、副本不得直接修改 | seed：常駐區段在 session 開始時比對 commit，並寫明副本不得修改 |
| 修改進入 ADE 的版控、以 ADE 為基準 | skill：修改知識或 skill 的 skill 先判斷所在位置，在 Forge 中經工作副本送回 ADE |
| runner 鎖定版本 | Generator：建立 ADE 時寫入 runner 的精確版本 |
| 回饋只限於機制 | skill：回饋 Generator 的 skill 在送出前檢查內容不含知識與能辨識團隊的資訊 |
