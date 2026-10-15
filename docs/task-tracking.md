# 任務管理

本 repo 以 beads（命令列工具 `bd`）管理任務、EPIC 與任務之間的相依關係。本文說明 issue 資料的存放與同步方式、安裝 bd、第一次建立 issue 資料庫、在新電腦上接續、檢視與更新任務，以及 agent skill 的操作與 bd 指令的對應。閱讀前需要知道：bd 把 issue 存在本機的 Dolt 資料庫，Dolt 是具備版本控制的資料庫，可以像 git 一樣推送與拉取。

## 資料存放與同步方式

issue 資料不跟著 git 分支走，而是透過 `origin` 上一個獨立的 ref 同步。下表列出 bd 在本機與 `origin` 上的資料：

| 資料 | 位置 | 是否進入 git 分支 |
|---|---|---|
| 本機的 issue 資料庫 | `.beads/` | 否，`.gitignore` 以 `.beads*` 排除 |
| 同步用的資料庫正本 | `origin` 的 `refs/dolt/data` | 否，不屬於任何分支 |
| Dolt 的遠端資訊 | `origin` 的 `__dolt_remote_info__` 分支 | 由 Dolt 建立與維護 |

因此 `git push` 不會帶上 issue。換電腦接續時，程式碼以 git 同步，issue 以 `bd dolt push` 與 `bd dolt pull` 同步，兩者必須分別處理。

**警告**：`origin` 是公開 repo，issue 的標題、描述與留言推送後即公開。issue 內容不得包含公司名稱、內部服務名稱或其他公司知識。

## 安裝 bd

每台電腦安裝一次。在終端機執行下列指令：

```sh
brew install beads
bd config set metrics.disabled true
```

`brew install beads` 會一併安裝 Dolt。bd 預設會將使用統計傳送到外部端點；第二行指令在使用者層級的設定檔 `~/.config/bd/config.yaml` 關閉這項功能，作用於這台電腦上的所有專案。

執行 `bd version` 顯示版本，且 `bd config show` 中的 `metrics.disabled` 為 `true` 時，代表安裝完成。

## 第一次建立 issue 資料庫

本節只在 repo 尚未使用 bd 時執行一次。repo 已經有 issue 資料時，改依「在新電腦上接續」一節操作。

在 repo 根目錄依下列步驟建立資料庫：

1. 執行 `bd init --prefix ade --skip-agents --skip-hooks --non-interactive`。
2. 執行 `git log --oneline -1`，確認 bd 自行建立的 commit，再撤回它（見下方說明）。
3. 確認 `.gitignore` 包含 `.beads*`。
4. 執行 `bd dolt remote list`，確認 Dolt remote 指向 `origin`。
5. 建立第一個 issue 後，執行 `bd dolt push`。

第 1 步各參數的作用如下：

| 參數 | 作用 |
|---|---|
| `--prefix ade` | issue 編號的格式為 `ade-<hash>` |
| `--skip-agents` | 不產生 `AGENTS.md` 與 Claude、Codex 的設定，本 repo 已有自己的 `AGENTS.md` |
| `--skip-hooks` | 不安裝 git hook，本 repo 不使用 hook |
| `--non-interactive` | 不詢問任何問題，全部採用參數與預設值 |

**注意**：`bd init` 會自行建立一個 commit，內容是 `.beads/` 底下的檔案與 `.gitignore` 的修改。本 repo 不把 bd 的檔案納入 git，因此必須撤回這個 commit。

第 2 步撤回 commit 的指令如下：

```sh
git reset --soft HEAD~1
git restore --staged .beads .gitignore
git checkout -- .gitignore
```

第一行撤回 commit 但保留檔案，第二行取消暫存，第三行把 `.gitignore` 還原成 bd 修改前的內容。第 3 步的 `.beads*` 同時涵蓋 `.beads/` 目錄，以及 bd 在 repo 根目錄產生的 `.beads.gate.lock`。

執行 `git ls-remote origin` 的輸出包含 `refs/dolt/data` 時，代表資料庫已推送到 `origin`。

## 在新電腦上接續

完成「安裝 bd」一節後，執行下列指令取得程式碼與 issue：

```sh
git clone git@github.com:franKobayasi/agentic-dev-env.git
cd agentic-dev-env
bd bootstrap
```

`bd bootstrap` 會在 `origin` 上找到 `refs/dolt/data`，複製資料庫，並設定之後推送與拉取的目標。執行 `bd list` 能列出 issue 時，代表還原完成。clone 下來的是預設分支；開發中的分支必須另外以 `git checkout` 切換。

注意：**不得**在已經有 issue 資料的 repo 執行 `bd init`。`bd init` 會建立一個新的空資料庫，而不是還原共用的資料庫。

## 日常同步

bd 不會自動同步，依下列時機手動執行：

- 開始工作前應執行 `bd dolt pull`。
- 修改 issue 之後，以及換電腦之前，應執行 `bd dolt push`。

推送需要和 `git push` 相同的 `origin` 寫入權限。Dolt 不讀取 repo 層級的 `core.sshCommand` 設定；需要指定 SSH 金鑰時，以環境變數 `GIT_SSH_COMMAND` 指定，例如：

```sh
GIT_SSH_COMMAND="ssh -i <金鑰路徑> -o IdentitiesOnly=yes" bd dolt push
```

`bd dolt pull` 與 `bd bootstrap` 同樣適用這個環境變數。推送成功時，輸出最後一行為 `Push complete.`。

## 檢視任務

任務有五種狀態：`open`（可開始）、`in_progress`（進行中）、`blocked`（被相依項目阻擋）、`deferred`（暫緩）、`closed`（已完成）。下表依想知道的資訊列出對應的指令：

| 想知道 | 指令 |
|---|---|
| 有哪些 EPIC | `bd list -t epic` |
| 現在可以開始的任務，即未關閉且沒有被阻擋 | `bd ready` |
| 某個 EPIC 底下可以開始的任務 | `bd ready --parent <epic-id>` |
| 某個 EPIC 的完整結構與各項狀態 | `bd children <epic-id> --pretty` |
| 被阻擋的任務，以及阻擋它的項目 | `bd blocked` |
| 某個任務的描述、標籤、上層項目與相依關係 | `bd show <id>` |
| 指定狀態的任務 | `bd list --status open,in_progress` |
| 包含已關閉項目的全部任務 | `bd list --all` |
| 已定案的決策 | `bd list -t decision --all` |
| 全部的 wayfinder 地圖 | `bd list -l wayfinder:map` |

`bd list` 預設不顯示已關閉的項目。指定多個狀態時，必須以逗號分隔寫在同一個 `--status` 參數內；重複寫 `--status` 時，只有最後一個生效。

## 建立與更新任務

下表列出常用的建立與更新指令：

| 動作 | 指令 |
|---|---|
| 建立任務 | `bd create "<標題>" -d "<描述>"` |
| 建立 EPIC | `bd create "<標題>" -t epic -d "<描述>"` |
| 建立 EPIC 底下的任務 | 在 `bd create` 加上 `--parent <epic-id>` |
| 設定相依關係 | `bd dep add <被阻擋的 id> <阻擋它的 id>` |
| 認領任務 | `bd update <id> --claim` |
| 留言 | `bd comments add <id> "<內容>"` |
| 關閉任務 | `bd close <id> --reason "<原因>"` |

更新之後，依「日常同步」一節執行 `bd dolt push`。

## agent skill 的對應操作

部分 agent skill 以通用的說法指稱 issue tracker 的操作。下表列出這些說法對應的 bd 指令：

| skill 的說法 | bd 指令 |
|---|---|
| publish to the issue tracker | `bd create "<標題>" -d "<描述>"`，屬於某個 EPIC 時加上 `--parent <epic-id>` |
| fetch the relevant ticket | `bd show <id>`，使用者通常會直接提供 issue 編號 |

`/wayfinder` skill 使用下列概念，在 bd 中的對應如下：

| 概念 | bd 中的對應 |
|---|---|
| Map | 一個 EPIC，標籤為 `wayfinder:map`；描述欄依序記錄 Destination、Notes、Decisions so far、Not yet specified 與 Out of scope |
| Child ticket | 以 `--parent <epic-id>` 建立的任務，並以 `-l wayfinder:<類型>` 標記類型，類型為 `research`、`prototype`、`grilling` 或 `task` |
| Blocking | `bd dep add <被阻擋的 id> <阻擋它的 id>` |
| Frontier | `bd ready --parent <epic-id>` 列出的任務 |
| Claim | `bd update <id> --claim`，必須在開始任何工作之前執行。認領後狀態變成 `in_progress`，平行的 session 執行 `bd ready` 時不會再挑到同一張 ticket |
| Resolve | 依序執行 `bd comments add <id> "<答案>"`、`bd close <id> --reason "<摘要>"`、`bd update <epic-id> --append-notes "<id>：<摘要>"` |
