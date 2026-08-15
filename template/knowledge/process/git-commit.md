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

## Agent 執行時

- 在作業區（`.ade.json` 的 `workspaces` 路徑）下任何服務 repo commit 都遵守本慣例
- 一個 commit 一件事；混雜多個意圖時拆開
- 服務 repo 自己的 CLAUDE.md／AGENTS.md 若另有 commit 規範，以服務 repo 為準（分層規則見 `../README.md`）
