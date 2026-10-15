# 詞彙表

本檔定義本 ADE 共用的專有名詞，一個名詞一條。撰寫知識、skill 與規格時必須使用這裡的正式名詞，不得使用 `_Avoid_` 列出的同義詞；需要新的專有名詞時，先加入本檔。搜尋知識時，先以 `_Avoid_` 把用詞換成正式名詞再搜尋。

詞條的格式如下：

```md
**名詞（English）**：
一句話定義名詞所指的對象。
_Avoid_：實際發生過混淆的同義詞
```

## ADE 與 Forge

**ADE（Agentic Dev Environment）**：
團隊共同維護並持續迭代知識體系的 repository，是知識與 skill 的唯一事實來源；修改都在這裡進行。也可寫作 ADE repo。
_Avoid_：中央 ADE repo

**Forge**：
團隊成員實際運用 ADE 的知識，由人與 AI 協作產出程式碼、軟體或執行結果的目錄；由 ADE 注入知識庫與 skill，各服務的 repo 位於其中的 `workspaces/`。
_Avoid_：工作目錄、消費端、工作站、hub、以 ADE 指稱這個目錄

**工作副本（Working Copy）**：
Forge 中 ADE 的 clone，用於修改知識或 skill 並送回 ADE。

## 知識庫

**知識單位（Knowledge Unit）**：
一份知識，是一個 `.md` 檔，或一個帶有入口檔的資料夾；會一起修改的內容放在同一個單位。
_Avoid_：以文件指稱單位

**分類（Category）**：
知識庫根目錄下的第一層資料夾，例如 `process/`、`specs/`。

**入口檔（Entry File）**：
資料夾的 `README.md`，說明這一層並導覽下一層。
_Avoid_：index、首頁

**附件（Attachment）**：
知識單位內 `.md` 以外的檔案，不帶 id，由同一單位的 `.md` 以相對路徑引用。

**符號位址（Symbol Address）**：
知識的引用寫法 `kb:<分類>/<id>`，id 是建立知識時產生、寫在 frontmatter 的不可變隨機值。
_Avoid_：符號連結、kb 連結

**產品規格（Spec）**：
知識庫 `specs/` 內的長期資產，描述產品當前功能的整體規格，由 PO 持續迭代。
_Avoid_：規格（不加限定詞）

## 產品領域

產品規格與 PRD 共用的名詞，例如產品的屬性、家族、規格值與型號，由團隊依產品填寫。
