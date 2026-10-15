# 詞彙表

本檔定義本 repo 文件共用的名詞，一個名詞一條，只寫名詞所指的對象，不寫行為說明。文件中直接使用這些名詞，不另行定義。ADE repo 開發流程的詞彙另在 `seed/repo/CONTEXT.md`，隨 seed 複製到每個 ADE repo，與本檔互不重疊。

## 名詞

三個核心名詞構成一條產生鏈：生成器建立 ADE repo，ADE repo 注入成 ADE。

**生成器（Generator）**：
create-agentic-dev-env 這個 npm 套件，以 seed 建立 ADE repo，並提供 runner。
_Avoid_：本套件、框架

**ADE repo**：
由生成器建立、團隊共同維護的 repo，是 ADE 的來源。
_Avoid_：中央 ADE repo、單獨以 ADE 指稱

**ADE（Agentic Dev Environment）**：
團隊成員開發時使用的目錄，由 runner 從 ADE repo 注入知識庫、skill 與 `CLAUDE.md` 的常駐區段；各服務的 repo 位於其中的 `workspaces/`。
_Avoid_：工作目錄、消費端、工作站、hub、hub 根

**runner**：
生成器中執行 init 與 update 的程式 `lib/runner.js`，ADE repo 鎖定它的精確版本。
_Avoid_：CLI

**seed**：
生成器建立 ADE repo 時複製的初始內容 `seed/`。
_Avoid_：template、範本

**hub**：
ADE repo 中注入 ADE 的部分，即 `hub/` 目錄。
_Avoid_：以 hub 指稱 ADE

**常駐區段**：
ADE repo 的 `hub/CLAUDE.section.md`，注入 ADE 後成為 `CLAUDE.md` 中 `<!-- ADE:BEGIN -->` 與 `<!-- ADE:END -->` 之間的區段。
_Avoid_：CLAUDE.md 區段

**知識庫**：
ADE repo 的 `hub/knowledge/`，注入 ADE 後位於 `.claude/ade/knowledge/`；文件中以 `knowledge/…` 表示知識庫根目錄下的位置。
