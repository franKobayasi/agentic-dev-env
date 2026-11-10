---
status: accepted
date: 2026-11-10
decision-makers: Frank Lin
outcome: "runner 依 rulesync 的輸出位置支援 Claude Code、Codex、Cursor、Kiro：每個 agent 的 skill 目錄各複製一份 skill，常駐區段寫入 CLAUDE.md 與 AGENTS.md，知識庫改放 .ade/knowledge/"
notes: "Forge 的 managed 位置改變，屬於 breaking change，版本為 2.0.0；舊 Forge 在下一次 update 自動遷移，舊名稱 hub/CLAUDE.section.md 仍可讀取"
---

# Forge 同時支援多個 agent

## Context and Problem Statement

runner 只為 Claude Code 注入 Forge：skill 放在 `.claude/skills/`，常駐區段只寫進 `CLAUDE.md`，知識庫位於 `.claude/ade/knowledge/`。團隊成員也使用 Codex、Cursor 與 Kiro，這些 agent 讀取 skill 與常駐指引的位置各不相同，在 Forge 中讀不到 ADE 的 skill 與常駐指引。問題是：runner 應如何注入 Forge，才能讓這四個 agent 都讀到同一份 skill 與常駐指引？

## Decision Drivers

* 四個 agent 必須讀到內容相同的 skill 與常駐指引。
* 做法應已在其他工具中驗證可行，不依賴尚未確認的 agent 行為。
* 舊版 runner 留下的 Forge 必須能直接 update，不需要人工遷移。
* skill 本體不應為了個別 agent 改寫格式。

## Considered Options

* 依 rulesync 的輸出位置，每個 agent 的 skill 目錄各複製一份，常駐區段寫入 `CLAUDE.md` 與 `AGENTS.md`
* skill 只放一份，其他目錄以 symlink 指向它
* 依各 agent 的相容讀取，只寫 `.claude/skills/` 與 `.agents/skills/` 兩份
* 為 Cursor 與 Kiro 另外產生 `.cursor/rules/` 與 `.kiro/steering/` 的常駐規則檔

## Decision Outcome

Chosen option: "依 rulesync 的輸出位置，每個 agent 的 skill 目錄各複製一份，常駐區段寫入 `CLAUDE.md` 與 `AGENTS.md`", because rulesync 對這四個 agent 的輸出位置已在大量專案中使用，複製不依賴各 agent 對 symlink 與相容目錄的處理方式，並且沿用 runner 既有的 `ade-` 前綴清理機制。

下表列出各 agent 讀取的位置：

| agent | skill 目錄 | 常駐區段 |
|---|---|---|
| Claude Code | `.claude/skills/` | `CLAUDE.md` |
| Codex | `.agents/skills/` | `AGENTS.md` |
| Cursor | `.cursor/skills/` | `AGENTS.md` |
| Kiro | `.kiro/skills/` | `AGENTS.md` |

知識庫同時從 `.claude/ade/knowledge/` 移到 `.ade/knowledge/`，因為知識庫不屬於任何單一 agent。常駐區段的來源檔改名為 `hub/forge-section.md`，名稱不帶任何 agent 會自動載入的檔名。

### Consequences

* Good, because 四個 agent 在 Forge 中都讀得到全部 skill 與常駐區段。
* Good, because ADE 的 skill 只使用 `name`、`description` 與 `metadata` 三個 frontmatter 欄位，四個 agent 都接受，不需要轉換。
* Good, because update 刪除 `.claude/ade/`，舊 Forge 在下一次 update 自動遷移。
* Bad, because 每支 skill 在 Forge 中有四份相同的副本，佔用的磁碟空間變成四倍。
* Bad, because Cursor 也讀取 `.claude/skills/` 與 `.agents/skills/`，同一支 skill 可能在 Cursor 中出現多次；rulesync 同時輸出 Claude Code 與 Cursor 時也有相同情形。
* Bad, because 知識庫搬移屬於契約 B 的變更，必須 major bump，既存 ADE 升級時要把 hub 內容中的 `.claude/ade/` 改為 `.ade/`。

### Confirmation

`tests/init.test.js` 驗證四個 skill 目錄與兩份常駐區段；`tests/update.test.js` 驗證舊 Forge 的遷移與 marker 損壞時不破壞既有安裝；`tests/legacy-layout.test.js` 驗證舊區段檔名仍可讀取。

## Pros and Cons of the Options

### 依 rulesync 的輸出位置，每個 agent 的 skill 目錄各複製一份，常駐區段寫入 `CLAUDE.md` 與 `AGENTS.md`

* Good, because 輸出位置來自已驗證的工具，不需要逐一實測各 agent。
* Good, because Cursor 與 Kiro 原生讀取 `AGENTS.md`，常駐區段只需兩份。
* Bad, because skill 有四份副本。

### skill 只放一份，其他目錄以 symlink 指向它

* Good, because 只有一份 skill。
* Bad, because 只有 Codex 的文件明確支援 symlink，Cursor 與 Kiro 的行為未經確認。
* Bad, because Windows 建立 symlink 需要額外權限。

### 依各 agent 的相容讀取，只寫 `.claude/skills/` 與 `.agents/skills/` 兩份

* Good, because 副本較少，Cursor 讀取兩者，Codex 讀取 `.agents/skills/`。
* Bad, because Kiro 不讀取這兩個目錄，仍需要 `.kiro/skills/`。
* Bad, because 依賴 Cursor 的相容讀取，Cursor 移除相容行為時會失效。

### 為 Cursor 與 Kiro 另外產生 `.cursor/rules/` 與 `.kiro/steering/` 的常駐規則檔

* Good, because 使用各 agent 原生的規則機制。
* Bad, because Cursor 與 Kiro 已讀取 `AGENTS.md`，同一份常駐區段會被載入兩次，增加每個 session 的 context 成本。
* Bad, because rulesync 在專案層也不為這兩個 agent 產生 root 規則檔，而是依賴 `AGENTS.md`。

## More Information

輸出位置依 [rulesync](https://github.com/dyoshikawa/rulesync) 的 `src/features/skills/` 與 `src/features/rules/`。各 agent 的讀取位置見 [Codex 的 skill 文件](https://learn.chatgpt.com/docs/build-skills)、[Cursor 的 skill 文件](https://cursor.com/docs/context/skills)、[Kiro 的 skill 文件](https://kiro.dev/docs/skills/)與 [Kiro 的 steering 文件](https://kiro.dev/docs/steering/)。
