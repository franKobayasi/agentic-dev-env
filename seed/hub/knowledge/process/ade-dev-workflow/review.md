# 兩軸審查：派工規則與審查者契約

適用手動與 auto 模式；審查者 prompt 只含本檔的契約段。依據 [research-orchestrator-subagent.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-orchestrator-subagent.md)。

- 審查者由**派工的一方**派，不由實作者派——做的人不評自己；經實作者轉述的審查報告必然失真。只給 diff＋`spec.md`＋`phase-N.md`，不給實作過程的推理
- 派 subagent **不傳 `name`**（agent teams 開啟時具名 subagent 會變成 teammate，完成只送不帶輸出的 idle 通知，等待結果的流程會卡死）；派出後**實際確認** transcript 在長，不被動等通知
- 審查者之間、審查者與實作者之間**不得同時跑全套測試**——worktree 只隔離檔案，共用的 DB／port 互踩會讓測試被標 skipped 而非 failed；審查 prompt 明寫只跑單一 spec、跑前確認沒人在跑
- 審查者**唯讀**（可跑指令重現，不得改 repo 檔案）、不再派 subagent。回傳**固定格式**：每條 finding 附 `file:line` 或「指令＋實際輸出片段」並標 blocking／建議；另列「查過但不存在」與「不確定、交派工方判斷」；未完成也按此格式回報已查部分。收到後**抽驗至少一條** finding 的證據真的存在——實戰有審查誤判。wall-clock 上限 20 分鐘（校準值），逾時重派一次
- 審查者**幾乎必定**會報 finding，這是它被要求做的事；只把影響正確性或違反明訂需求者視為 blocking。有 blocking → **實作者修正**（續用原 context，它知道當初為何這樣寫）→ **換新的乾淨審查者**重審，不回給原審查者
