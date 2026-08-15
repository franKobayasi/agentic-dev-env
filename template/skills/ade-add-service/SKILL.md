---
name: ade-add-service
description: 在 ADE 知識庫註冊新服務。使用者說「新增服務」「註冊服務」「把某某服務加進知識庫」時使用。
---

# 新增服務

1. 依 `ade-contribute` skill 的流程 clone ADE repo 並建立分支
2. 複製 `knowledge/services/_template.md` 為 `knowledge/services/<service-name>.md`
3. 逐區塊填寫。**「Repo」與「本地開發」為必填**——agent 之後要靠這兩塊自主 clone 與開發
   - 資訊不足時詢問使用者，不要留空、不要猜測
4. 在 `knowledge/services/index.md` 的總覽表加入該服務（一～兩行：定位與關係）
5. 依 `ade-contribute` 流程開 PR 回 ADE repo
