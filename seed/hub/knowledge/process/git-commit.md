---
id: beb6dc
description: 團隊預設的 git commit 訊息慣例，採用 Conventional Commits。
---

# Git commit 慣例

> 此為框架預載的預設值，請依團隊實況修改；與團隊既有慣例不符時，改這份文件而不是遷就它。

採用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

[body（選填）]
```

## 規則

- **type**（必填）：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- **scope**（選填）：影響範圍，如模組或子系統名，例：`feat(auth): ...`
- **subject**：英文、祈使句、小寫開頭、不加句號，例：`fix(order): prevent duplicate submission on retry`
- **body**：說明「為什麼改」而非「改了什麼」（diff 已經說了改什麼）；破壞性變更以 `BREAKING CHANGE:` 開頭註明
- 一個 commit 一件事；混雜多個意圖時拆開

## 適用範圍

- 在 `workspaces/` 下任何服務 repo commit 都遵守本慣例
- 服務 repo 自己的 CLAUDE.md、AGENTS.md、CONTRIBUTING.md 或 commitlint 設定另有 commit 規範時，以服務 repo 為準
