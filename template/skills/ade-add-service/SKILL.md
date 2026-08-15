---
name: ade-add-service
description: 在 ADE 知識庫註冊新服務。使用者說「新增服務」「註冊服務」「把某某服務加進知識庫」時使用。
---

# 新增服務

1. **先確認尚未註冊**：讀 `knowledge/services/index.md` 與 `services/` 目錄，該服務（或同 repo 的別名）已存在時，改走 `ade-contribute` 更新既有描述檔，不要另建
2. 依 `ade-contribute` skill 的流程 clone ADE repo 並建立分支
3. 複製 `knowledge/services/_template.yaml` 為 `knowledge/services/<service-name>.yaml`
4. 逐欄位填寫。**`repo`（url、branch）為必填**——agent 之後要靠它自主 clone；bootstrap 流程不要寫進來，那歸服務 repo 自己的文件（分層規則見 `knowledge/README.md`）
   - 資訊不足時詢問使用者，不要留空、不要猜測
5. 在 `knowledge/services/index.md` 的總覽表加入該服務（一～兩行：定位與關係）
6. 依 `ade-contribute` 流程開 PR 回 ADE repo
