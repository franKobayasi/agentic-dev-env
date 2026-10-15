# 詞彙表

本檔定義本 repo 文件共用的名詞，一個名詞一條，只寫名詞所指的對象，不寫行為說明。文件中直接使用這些名詞，不另行定義。ADE 的詞彙另在 `seed/hub/knowledge/CONTEXT.md`，隨 seed 複製到每個 ADE 並注入 Forge，與本檔互不重疊。

## 名詞

三個核心名詞構成一條產生鏈：Generator 建立 ADE，ADE 注入成 Forge。

**Generator**：
create-agentic-dev-env 這個 npm 套件，是 ADE 的框架：以 seed 建立 ADE，並提供 runner。
_Avoid_：生成器、本套件

**ADE（Agentic Dev Environment）**：
由 Generator 建立、團隊共同維護並持續迭代知識體系的 repository，是知識與 skill 的唯一事實來源。也可寫作 ADE repo。
_Avoid_：中央 ADE repo

**Forge**：
團隊成員實際運用 ADE 的知識，由人與 AI 協作產出程式碼、軟體或執行結果的目錄；由 runner 從 ADE 注入知識庫、skill 與 `CLAUDE.md` 的常駐區段，各服務的 repo 位於其中的 `workspaces/`。
_Avoid_：工作目錄、消費端、工作站、hub、以 ADE 指稱這個目錄

**runner**：
Generator 中執行 init 與 update 的程式 `lib/runner.js`，ADE 鎖定它的精確版本。
_Avoid_：CLI

**seed**：
Generator 建立 ADE 時複製的初始內容 `seed/`。
_Avoid_：template、範本

**hub**：
ADE 中注入 Forge 的部分，即 `hub/` 目錄。
_Avoid_：以 hub 指稱 Forge

**常駐區段**：
ADE 的 `hub/CLAUDE.section.md`，注入 Forge 後成為 `CLAUDE.md` 中 `<!-- ADE:BEGIN -->` 與 `<!-- ADE:END -->` 之間的區段。
_Avoid_：CLAUDE.md 區段

**工作副本**：
Forge 中 ADE 的 clone，用於修改知識或 skill 並送回 ADE。

**知識庫**：
ADE 的 `hub/knowledge/`，注入 Forge 後位於 `.claude/ade/knowledge/`；文件中以 `knowledge/…` 表示知識庫根目錄下的位置。

**詞彙表**：
定義一個領域內專有名詞的文件，檔名為 `CONTEXT.md`；Generator 的詞彙表是本檔，ADE 的詞彙表位於知識庫根目錄。
_Avoid_：術語表、glossary

**分類**：
知識庫根目錄下的第一層資料夾。

**符號位址**：
知識庫內引用知識檔案的寫法 `kb:<分類>/<id>`，id 是知識檔案建立時產生、寫在 frontmatter 的不可變隨機值。
_Avoid_：符號連結、kb 連結

**附件**：
知識單位內 `.md` 以外的檔案，不帶 id，由同一單位的 `.md` 以相對路徑引用。
