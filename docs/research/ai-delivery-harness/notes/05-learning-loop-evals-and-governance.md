# 05 學習迴路：Evals、錯誤分析、記憶、交付指標與 Harness 自身治理

> 研究日期／所有 URL 存取日期：2026-10-12。證據分級標記：
>
> - 【官方全文】本次完整抓取並對照全文的一手來源（本次環境僅 Anthropic 自家網域 anthropic.com / claude.com / code.claude.com / platform.claude.com 可完整抓取）
> - 【一手／搜尋摘錄】一手來源（論文、官方文件）但只透過搜尋結果回傳的片段取得，未對照全文
> - 【二手】第三方整理、部落格、新聞、轉述
> - 【同儕審查】已刊於審稿會議（NeurIPS / ICLR / ICML / UIST / ICSE / MSR）
> - 【廠商主張】供應商自報數據，未獨立驗證
> - 【查無實證】找不到可驗證來源
>
> 方法限制（報告撰寫者請留意）：arxiv.org、hamel.dev、openai.com、dora.dev、getdx.com、sre.google、notion.com 等網域在本次環境 DNS 不可達，且共享的搜尋額度在研究中途耗盡。因此非 Anthropic 來源多為搜尋工具回傳的片段或二手摘要；所有英文引文保留原文不翻譯，凡未能對照全文者皆已標示，需要補核對的項目列於各節 Gaps。
>
> 對照使用者既有機制的提醒：使用者已有 (a) 每任務量測行（lines/files/time/compactions/interventions）、(b) 上游回饋機制、(c) spec-drift 稽核、(d) 每條規則附證據文件、(e) 每次規則變更記錄「若有效應看到的 expected trace」。以下 Inferences 都以「在這之上還缺什麼原則」為目標。

---

## KQ1 窄域 coding agent 的 eval 驅動開發：要幾個例子、怎麼從生產失敗建、怎麼避免飽和／過擬合、軌跡 vs 結果

### Takeaway
2025–2026 的主流共識是「小、真、二元、看資料」：20–50 個源自真實失敗的任務就能起步；先做錯誤分析再寫 grader；grader 以二元 pass/fail 為主、Likert 複合分數為戒；對會改變環境狀態的 agent 以最終狀態（outcome）評分、軌跡（transcript）只用於診斷；eval 通過率到 100% 即失去改進訊號、應「畢業」成回歸集而非丟棄；公開 benchmark（SWE-bench Verified）已因污染與飽和失去前沿鑑別力，窄域 harness 必須擁有自己的私有 eval。

### Cited Findings

**Anthropic 官方（evals）**

- 起步規模：Anthropic 建議 "20-50 simple tasks drawn from real failures is a great start."，並指出團隊常誤以為需要數百個 — 【官方全文】[Anthropic, Demystifying evals for AI agents, Published Jan 09, 2026](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- 從生產失敗建：對已上線團隊 "Converting user-reported failures into test cases ensures your suite reflects actual usage."，再依使用者影響排序投入 — 同上
- 結果 vs 軌跡："it's often better to grade what the agent produced, not the path it took."（理由：避免懲罰設計者未預期的合法解法）；outcome 定義為環境的最終狀態，而非 agent 說了什麼 — 同上
- 飽和："An eval at 100% tracks regressions but provides no signal for improvement."；接近飽和時 "progress will also slow, as only the most difficult tasks remain"；建議飽和的 capability eval「畢業」為 regression suite — 同上
- 兩類 eval：capability eval 問 "What can this agent do well?"（起始通過率應低）；regression eval 問 "Does the agent still handle all the tasks it used to?"（應接近 100%）— 同上
- 非決定性：pass@k "measures the likelihood that an agent gets at least one correct solution in k attempts"；pass^k "measures the probability that all k trials succeed"；一致性重要的 agent 應看 pass^k — 同上。二手摘要補充 k=10 時兩者可呈相反敘事（pass@k→100%、pass^k→0%）— 【二手】[khaledea.substack.com](https://khaledea.substack.com/p/evals-for-agents-the-missing-bridge)
- Grader 弱點：code-based "Brittle to valid variations that don't match expected patterns exactly."；model-based "Model grading often takes careful iteration to validate accuracy."（非決定性、需與人類評分校準）；human "Relatively expensive and slow turnaround"，應保留給 "calibrating LLM graders or evaluating subjective outputs" — 同上
- 看資料："You won't know if your graders are working well unless you read the transcripts and grades from many trials."；路線圖以 "Read the transcripts!" 收尾 — 同上
- Anthropic 內部多 agent 研究系統的作法："Start evaluating immediately with small samples"（約 20 個真實查詢即足以看出改動效果）；LLM judge 以 rubric 評分（事實正確、引用正確、完整性、來源品質、工具效率），單一 judge prompt 輸出 0.0–1.0 分數加 pass/fail 最穩定；"We found success focusing on end-state evaluation rather than turn-by-turn analysis."；"Instead of judging whether the agent followed a specific process, evaluate whether it achieved the correct final state."；"Human evaluation catches what automation misses."；"Even in a world of automated evaluations, manual testing remains essential."（人工測試抓到 agent 偏好 SEO 內容農場而非權威來源）— 【官方全文】[Anthropic, How we built our multi-agent research system, Jun 13, 2025](https://www.anthropic.com/engineering/multi-agent-research-system)
- Claude Code 官方最佳實務把「可執行的驗證」列為第一原則："Give Claude a check it can run: tests, a build, a screenshot to compare. It's the difference between a session you watch and one you walk away from."；"Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal available, and you become the verification loop: every mistake waits for you to notice it."；"Have Claude show evidence rather than asserting success"；"If you can't verify it, don't ship it." — 【官方全文】[Claude Code docs, Best practices](https://code.claude.com/docs/en/best-practices)
- 對抗式 reviewer 的副作用："A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering" — 同上

**Hamel Husain（錯誤分析優先、二元優於 Likert）**

- 本次只取得二手轉述與其 evals-skills repo 的片段：eval 應為針對單一問題的 pass/fail；"Helpfulness: 4.2" 這類複合分數無意義且侵蝕信任（沒人知道 4.2→4.7 代表什麼）；每個失敗模式一個二元 judge，形成小型 judge 庫；先窮盡 code-based 檢查（關鍵字、regex、API 呼叫）再用 LLM judge；judge 的前置條件是完成錯誤分析並有人工標註 trace（repo 的 skill 寫明至少 20 Pass + 20 Fail）；以 TPR/TNR 而非 raw accuracy 驗證 judge（90% 通過率下「永遠說 Pass」的 judge 有 90% 準確率卻抓不到任何失敗）— 【二手】[chatprd.ai 轉述](https://chatprd.ai/how-i-ai/hamel-husains-guide-to-ai-evals-with-error-analysis)；【一手／搜尋摘錄】[hamelsmu/evals-skills: write-judge-prompt](https://tessl.io/registry/skills/github/hamelsmu/evals-skills/write-judge-prompt)、[eval-audit](https://tessl.io/registry/skills/github/hamelsmu/evals-skills/eval-audit)

**Shreya Shankar（Who Validates the Validators / EvalGen）**

- Shankar、Zamfirescu-Pereira、Hartmann、Parameswaran、Arawjo（UC Berkeley，UIST 2024）提出 "criteria drift"：依搜尋摘錄原文 "users need criteria to grade outputs, but grading outputs helps users define criteria"；並指出部分標準依賴所觀察到的具體輸出而非能事先定義，質疑「評估可與看輸出分離」的假設；EvalGen 讓人標註輸出子集，再挑選最符合人類判斷的 assertion 實作（Python 函式或 LLM grader prompt）— 【同儕審查／搜尋摘錄】[arXiv 2404.12272](https://arxiv.org/abs/2404.12272)、[UIST 2024 PDF](https://people.eecs.berkeley.edu/~bjoern/papers/shankar-validators-uist2024.pdf)；二手稱「沒有任何使用者的初始標準與最終操作性標籤一致」— 【二手】[emergentmind](https://api.emergentmind.com/topics/evalgen)

**Eugene Yan**

- 2023 起倡議 "eval-driven development"：以小型任務專屬 eval 集取代 MMLU 類通用 benchmark，能用 SQL/JSON 等決定性檢查就用；2025-11 的 "Product Evals in Three Simple Steps" 歸納為標註資料→對齊 LLM evaluator→每次改動跑 eval harness — 【一手／搜尋摘錄】[eugeneyan.com/speaking/ai-eng-summit](https://eugeneyan.com/speaking/ai-eng-summit)；【二手】[minifeed 索引](https://minifeed.net/blogs/NTyMhN)、[awesome-eval-driven-development](https://github.com/itsderek23/awesome-eval-driven-development)

**公開 benchmark 的飽和與污染（為何窄域要自建）**

- OpenAI 於 2026-02 宣布不再以 SWE-bench Verified 衡量前沿能力；其內部審計發現 GPT-5.2、Claude Opus 4.5、Gemini 3 Flash 皆能逐字重現部分 gold patch；Epoch AI 將該 benchmark 評為 "Flawed"，並引述 OpenAI 審計：常見未解題中過半的測試會拒絕功能正確的提交；同一模型在 Verified 約 81% 卻在抗污染的 SWE-bench Pro 掉到 23–54%；harness/scaffold 差異可移動約 12 分 — 【二手】[buildmvpfast 彙整](https://www.buildmvpfast.com/blog/benchmark-contamination-ai-coding-leaderboard-swe-bench-2026)、[Epoch AI review 頁](https://epoch.ai/benchmarks/swe-bench-verified/review)（Epoch 頁本次未能開啟全文）
- Anthropic 評測文章的二手轉述：Opus 4.5 在訂票 eval「失敗」是因為找到政策漏洞、對使用者反而更好 — 【二手】[inkeep.com](https://inkeep.com/blog/anthropic-s-guide-to-ai-agent-evals-what-support-teams-need)（本次抓取的原文摘要未見此例，列為待核）

### Inferences
- 使用者既有的「每條規則改動記錄 expected trace」本質上就是一條 regression eval 的規格；缺的是把它變成可自動執行的 grader（code-based 優先、LLM judge 次之），並在 trace 出現時自動打勾。Anthropic 的 capability/regression 二分提示：規則剛寫入時它是 capability eval（預期會失敗才有訊號），驗證通過後「畢業」為 regression eval（應長期 100%）——這正是「規則何時算已驗證」的判準。
- 窄域單一服務的 eval 不該追求規模而該追求「每個 case 都來自一次真實失敗」；20–50 個起步、每次 postmortem 加 1–3 個，是 Anthropic 與 Hamel 一致的節奏。
- Outcome 評分為主（最終環境狀態：測試通過、diff 範圍、spec 符合），transcript 只做錯誤分析用的診斷、不做評分依據——否則會懲罰 agent 的合法替代路徑，並讓 eval 與某一版 prompt 耦合（規則一改 eval 就壞）。
- criteria drift 意味著評分標準必須允許「邊看邊改」且有版本——這正好對應使用者「規則有證據文件、有變更紀錄」的框架，可把 grader rubric 納入同一版本控制與同一 changelog。
- 「Read the transcripts」與 Hamel 的錯誤分析優先，共同指向一個人力預算原則：人的時間花在看失敗 trace 並歸類，而不是花在手動驗收每個 PR（驗收交給 outcome grader）。
- 公開 benchmark 的 12 分 harness 效應反過來說明：對窄域 harness，自己的 eval 數字只能跟自己的歷史比，不能與外部 leaderboard 比。

### Gaps
- Hamel Husain 原站（hamel.dev）本次不可達，二元 vs Likert、「theoretical saturation」、「benevolent dictator」等原文未能逐字核對。
- Anthropic 評測文章對「eval 過擬合」與「退役標準」沒有正式論述（僅談飽和與畢業）。
- Epoch AI 與 OpenAI 審計的原始數字（過半測試拒絕正確解、12 分 harness 效應）只來自二手彙整，未能開啟原頁。
- 「窄域 agent 需要多少 eval」沒有任何同儕審查的實證研究；20–50 是 Anthropic 與 Hamel 的實務經驗值。
- OpenAI 的官方 evals 指南（platform docs）本次未能取得。

---

## KQ2 失敗分類（MAST、TRAIL、SWE-bench 軌跡分析）與「harness 可修 vs 需模型進步」

### Takeaway
跨研究反覆出現的類別是：規格／系統設計問題、agent 間（或 agent 與驗證者間）不對齊、驗證不足；在 coding agent 軌跡中最大宗是「已找到正確檔案與函式卻改錯／改壞／反覆推翻」（Coherence Collapse）、過早宣告完成、以及一次做太多導致 context 耗盡。MAST 的核心主張是失敗主要源於系統設計而非單純模型能力——這正是 harness 的可修範圍；而「定位正確但精確編輯失敗」類的推理錯誤較依賴模型進步，harness 只能用更短的驗證迴路與回退降低損害。

### Cited Findings
- MAST（Cemri、Pan、Yang 等，UC Berkeley，NeurIPS 2025）：分析 7 個 MAS 框架、200+ 任務，歸納 14 個失敗模式、3 大類（arXiv 版：specification issues／inter-agent misalignment／task verification；NeurIPS 版第一類改稱 system design issues）；標註者一致性 Cohen's κ=0.88；後續版本涵蓋 1,642 條執行軌跡（NeurIPS 摘要寫 1600+）；並提出 LLM-as-a-Judge 流程以擴充標註 — 【同儕審查／搜尋摘錄】[arXiv 2503.13657](https://arxiv.org/abs/2503.13657)、[NeurIPS 2025 poster](https://neurips.cc/virtual/2025/poster/121528)
- MAST 主要結論（二手轉述）：failures "primarily stem from system design issues and inter-agent misalignment, rather than solely from underlying large language model limitations" — 【二手】[alphaxiv overview](https://www.alphaxiv.org/overview/2503.13657)
- TRAIL（Deshpande 等，Patronus AI，2025-05，v1–v3）：148 條人工標註軌跡、841 個錯誤，分 reasoning／execution／planning 三類，軌跡取自 GAIA 與 SWE-Bench；最佳模型 gemini-2.5-pro 在「從軌跡定位錯誤」任務僅得 11% — 【一手／搜尋摘錄】[arXiv 2505.08638](https://arxiv.org/abs/2505.08638)
- SWE-Bench-Verified 失敗分類（arXiv 2509.13941）：人工標 150 個失敗實例，得 3 階段、9 類、25 子類；結論 "the majority of agentic failures stem from flawed reasoning and cognitive deadlocks" — 【一手／搜尋摘錄】[arXiv 2509.13941](https://arxiv.org/abs/2509.13941v1)
- Coherence Collapse（arXiv 2603.24631，預印本）：16,758 條軌跡、3 種 agent 架構、7 個模型；在 SWE-Agent 與 OpenHands 上，能力較強模型的失敗中 60–69% 已到達並編輯了正確函式卻仍產出錯誤 patch；最大失敗主題是到達正確程式碼後把它覆寫或來回震盪 — 【一手／搜尋摘錄】[alphaxiv 2603.24631](https://www.alphaxiv.org/abs/2603.24631.md)
- Majgaonkar 等（ICSE 2026，arXiv 2511.00197）：比較 OpenHands／SWE-agent／Prometheus，失敗軌跡一致地更長、變異更大；即使失敗，72–81% 仍正確定位檔案，成敗取決於「近似 vs 精確」修改 — 【同儕審查／搜尋摘錄】[arXiv 2511.00197](https://arxiv.org/abs/2511.00197v1)
- SWE-Bench Pro（arXiv 2509.16941）用 GPT-5 當 judge 對未解 rollout 的最後 20 回合分桶：語法正確但功能錯誤／不完整／未解決核心問題（"wrong solution"）、工具誤用、語法錯誤；引述前研究自動分類與人工 87% 一致 — 【一手／搜尋摘錄】[arXiv 2509.16941](https://arxiv.org/pdf/2509.16941)
- SWE-agent 原始論文（arXiv 2405.15793，2024）：失敗類別從觀察到的模型行為歸納，先人工標 15 例驗證集再用 LM 分類其餘 — 【一手／搜尋摘錄】[arXiv 2405.15793](https://arxiv.org/pdf/2405.15793)
- Anthropic 長時 agent harness 觀察到的失敗模式："Claude declares victory on the entire project too early."；"a later agent instance would look around, see that progress had been made, and declare the job done."；"the agent tended to try to do too much at once"；"Often, this led to the model running out of context in the middle of its implementation"；對策含 "Self-verify all features. Only mark features as "passing" after careful testing."、"It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."、以 git 回退 "This allowed the model to use git to revert bad code changes and recover working states of the code base." — 【官方全文】[Anthropic, Effective harnesses for long-running agents, Published Nov 26, 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Claude Code 官方列出的常見失敗樣態：kitchen sink session（不相關任務混在一個 context）；"Correcting over and over"（修法 "After two failed corrections, /clear and write a better initial prompt incorporating what you learned."）；"The over-specified CLAUDE.md"；"The trust-then-verify gap"；"The infinite exploration" — 【官方全文】[Claude Code Best practices](https://code.claude.com/docs/en/best-practices)
- 同頁："If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches."；"A clean session with a better prompt almost always outperforms a long session with accumulated corrections." — 同上
- 「可觀察性假健康」：實務文章指出 agent 的 HTTP/uptime 指標可以全綠而任務失敗，案例為靜默模型回歸仍回傳成功碼 — 【二手】[alexcloudstar, AI Agent Reliability Engineering in 2026](https://www.alexcloudstar.com/blog/ai-agent-reliability-engineering-2026/)

### Inferences
- 把各研究類別壓成對 harness 有操作意義的四格：
  - (a) 規格／設計缺陷（MAST 第一類；長時 harness 的「一次做太多」）→ harness 可修：任務切小、spec 自足、驗證標準寫進任務。
  - (b) 驗證不足／過早宣告完成（MAST 第三類；Anthropic 的 declare victory）→ harness 可修且效果最大：可執行的 pass/fail gate、Stop hook、禁止改測試、end-to-end 才算完成。
  - (c) 定位正確但編輯錯誤／震盪（Coherence Collapse、Majgaonkar）→ 主要靠模型進步；harness 能做的是縮短回饋迴路（每次編輯跑測試）、限制重試次數後回退或升級給人。
  - (d) 工具／環境錯誤（TRAIL execution 類）→ harness 可修：工具描述、錯誤訊息品質、沙箱、環境腳本。
- 「失敗軌跡更長、變異更大」給了一個可自動化的早期訊號：對使用者的 per-task measurement line，`time`、`compactions`、`interventions` 的異常偏離本身就是失敗前兆，可觸發自動中止與升級，而非等人發現。
- 「糾正兩次就重開」可轉為 harness 規則：同一議題被人工介入 ≥2 次即終止該 session、把學到的東西寫成更好的起始 prompt／任務規格，而不是在污染的 context 內繼續（這同時是 KQ3 記憶的寫入時機）。
- 失敗分類本身應成為 postmortem 模板的固定欄位（封閉枚舉、允許提案新增），這樣錯誤分析才能聚合成「本期最大失敗類別」並決定下一個改進目標（見 KQ6 的約束聚焦）。
- TRAIL 的 11% 說明：「讓 LLM 自動從軌跡找錯」目前不可靠，錯誤分析仍須人讀 trace；但 MAST／SWE-Bench Pro 的 LLM-judge 在「已知類別分桶」上可達 ~87% 一致——即「人定類別、模型分桶」可行，「模型找新類別」不可行。

### Gaps
- MAST 三大類各占比例（paper 內有百分比）本次未能自 arXiv 取回。
- MAST 是否明確援引 high-reliability organizations 文獻，本次未能核實（搜尋結果未見）。
- TRAIL 子類別與各類錯誤數本次未取得。
- OpenHands／Codex 團隊的正式公開 postmortem：查無實證（搜尋未見）。
- 哪些類別「可由 harness 修」尚無任何研究做過受控實驗；上述四格是依各研究結論的推論。

---

## KQ3 agent 記憶與制度知識：證據、失敗模式與治理

### Takeaway
證據顯示「可演化的 playbook／經驗記憶」確實能提升 agent 表現（ACE、ReasoningBank、Dynamic Cheatsheet、Anthropic memory tool 皆有正向數據，但多為自報），而文獻同時記錄了明確的失敗模式：brevity bias 與 context collapse（反覆重寫把細節磨掉）、記憶投毒（寫入即被信任、持久跨 session）、規則互相矛盾（模型任選其一）、過長即不遵守。治理共識是：常駐層極小（Claude Code 對 MEMORY.md 硬性只載入前 200 行／25KB）、細節按需載入、增量更新而非整體重寫、有寫入門檻（同一錯誤重複才入庫）、有過期與大小上限、有定期稽核工具、強制事項交給 hook 而非 prose。

### Cited Findings

**正面證據（記憶有用）**

- ACE（Zhang 等，Stanford／SambaNova／UC Berkeley；arXiv 2510.04618，v1 2025-10-06、v2 2026-01-29）：指出既有 context 自適應法有兩個失敗——依搜尋摘錄的摘要原文 "brevity bias, which drops domain insights for concise summaries, and from context collapse, where iterative rewriting erodes details over time"；ACE 把 context 當成持續增長、精煉的 playbook，以 Generator（產生推理軌跡）／Reflector（從成敗萃取教訓）／Curator（以增量更新併入）三角色運作，並以 grow-and-refine 依語意相似度合併或修剪條目以控制膨脹；自報在 agent benchmark +10.6%、金融任務 +8.6%，能從自然執行回饋學習而無需標註，在 AppWorld 以較小開源模型追平排名第一的生產級 agent 並在較難的 test-challenge 勝出 — 【一手／搜尋摘錄】[arXiv 2510.04618](https://arxiv.org/abs/2510.04618v2)；【二手】[InfoQ](https://infoq.com/news/2025/10/agentic-context-eng)
- Dynamic Cheatsheet（Suzgun、Yuksekgonul、Bianchi、Jurafsky、Zou，Stanford／Together AI，2025，arXiv 2504.07952）：generator + curator，維護自我策展的文字記憶（策略與程式片段）而不改權重；二手稱 GPT-4o 在 Game of 24 由 10% 升至 99% — 【一手／搜尋摘錄】[alphaxiv 2504.07952](https://www.alphaxiv.org/audio/2504.07952)；【二手】[papers.lunadong.com](https://papers.lunadong.com/paper/8635)
- ReasoningBank（Google；arXiv 2509.25140；ICLR 2026）：從 agent 自身成功與失敗經驗蒸餾可重用推理策略，由 agent 自判成敗、無需 ground truth；相較只存成功軌跡的方法，刻意從失敗萃取預防性教訓；提出 memory-aware test-time scaling（MaTTS）；自報在網頁瀏覽與軟體工程 benchmark 有提升 — 【同儕審查／搜尋摘錄】[arXiv 2509.25140](https://arxiv.org/abs/2509.25140)、[ICLR 2026](https://iclr.cc/virtual/2026/poster/10007887)；調查論文稱其延伸 Dynamic Cheatsheet 的 test-time curation — 【一手／搜尋摘錄】[arXiv 2512.16301](https://arxiv.org/pdf/2512.16301)
- Anthropic memory tool + context editing：內部 agentic search 評測中兩者合用較基線 +39%、僅 context editing +29%；100 回合網頁搜尋評測 token 消耗 −84%，並讓原本因 context 耗盡而失敗的流程得以完成 — 【官方全文／廠商主張】[Anthropic, Context management, September 29, 2025](https://claude.com/blog/context-management)

**Anthropic 的記憶設計原則（官方全文）**

- "Memory supports just-in-time context retrieval. Rather than loading all relevant information up front, an agent records what it learns in memory files and reads them back on demand." — [Memory tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- 工具存在時 API 自動注入的協定含 "ASSUME INTERRUPTION: Your context window might be reset at any moment, so you risk losing any progress that is not recorded in your memory directory." — 同上
- 建議的整潔提示："Note: when editing your memory folder, always try to keep its content up-to-date, coherent and organized. You can rename or delete files that are no longer relevant. Do not create new files unless necessary." — 同上
- 安全與治理條目："Track memory file sizes and cap how large a file can grow."；"Periodically delete memory files that haven't been accessed in a long time."；路徑遍歷防護（拒絕 `/memories/../../secrets.env` 類路徑）— 同上
- 多 session 開發模式的關鍵原則："Work on one feature at a time. Mark a feature complete only after end-to-end verification confirms it works, not when the code is written." — 同上
- Context engineering 原則：目標是 "finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome"；"context rot"（召回能力隨 context 增長下降）；"LLMs have an 'attention budget' that they draw on when parsing large volumes of context."；"Every new token introduced depletes this budget by some amount"；system prompt 要在 "The right altitude is the Goldilocks zone between two common failure modes."（硬編碼脆弱邏輯 vs 空泛指引）；建議 agent 維護 NOTES.md 類結構化筆記；指出 "CLAUDE.md files are naively dropped into context up front" — 【官方全文】[Anthropic, Effective context engineering for AI agents, Published Sep 29, 2025](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**Claude Code 的兩層記憶與硬性治理（官方全文）**

- 兩套互補系統：CLAUDE.md（人寫、指令與規則）與 auto memory（Claude 寫、學到的模式）；"Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead." — [Claude Code docs, How Claude remembers your project](https://code.claude.com/docs/en/memory)
- auto memory 記四類（frontmatter `type`）：`user`、`feedback`（"corrections you give Claude and approaches you confirm"）、`project`、`reference`；去重原則 "Claude skips anything it can derive from the codebase, such as architecture, file paths, or debugging fixes. It also skips anything your CLAUDE.md files already say." — 同上
- 硬性常駐上限："The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start."；接近上限時系統提醒 "keep one line per entry, move detail into topic files, and merge or drop stale entries"；超限則回傳錯誤要求重寫索引，因為超出部分下次載入會被丟棄 — 同上
- CLAUDE.md 規模建議："target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."；imports 不減少 context 成本（匯入檔也在啟動時載入）；"Consistency: if two instructions contradict each other, Claude may pick one arbitrarily."；建議定期檢視移除過時或矛盾指令 — 同上
- 何時寫入 CLAUDE.md（寫入門檻）："Claude makes the same mistake a second time"、"A code review catches something Claude should have known about this codebase"、"You type the same correction or clarification into chat that you typed last session"、"A new teammate would need the same context to be productive" — 同上
- 稽核工具：`/doctor prompt-audit` 檢查 "instructions written for older models, references to files or commands that don't exist, and files that contradict each other"，只提案不自動改 — 同上
- 不遵守的根因："CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions." — 同上
- Best practices 頁的修剪準則："Keep it concise. For each line, ask: "Would removing this cause Claude to make mistakes?" If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!"；"Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts."；"If you emphasize many lines, none of them stands out."；排除欄位含 "Information that changes frequently"、"Anything Claude can figure out by reading code" — 【官方全文】[Claude Code Best practices](https://code.claude.com/docs/en/best-practices)

**其他工具與社群模式**

- Cursor 官方：規則要聚焦、有大小上限、拆小、以引用檔案取代複製；memories 由 sidecar 模型觀察對話自動產生；建議只在發現 Agent 重複犯同一錯誤時才加規則 — 【一手／搜尋摘錄】[docs.cursor.com/context/rules](https://docs.cursor.com/context/rules)、[docs.cursor.com/context/memories](https://docs.cursor.com/context/memories)；社群指南稱 "a stale memory is worse than no memory" — 【二手】[localskills.sh](https://localskills.sh/blog/cursor-memories-guide)
- 社群 LESSONS／AGENTS.md 自我改進模式：self-improve 工具在同一教訓第 2 次（品味／誤讀類第 3 次）重現時才自動寫規則進受管區塊，不動人寫文字；Microsoft 論文把每則被接受的 review comment 固化為版本控制指令檔中的規則，35+ 服務部署中規則由 5 條長到 18 條並附提交前自檢清單；某 auto-improving AGENTS.md skill 將檔案上限設 150 條規則並建議活躍專案每月修剪；OpenCode 的 `learn` 命令把學習放到最接近相關程式碌的 AGENTS.md；MindStudio 以失敗 eval 餵 learnings.md — 【二手／搜尋摘錄】[glama self-improve](https://glama.ai/mcp/servers/ag6dbc31uo)、[arXiv 2607.13091](https://www.alphaxiv.org/abs/2607.13091.md)、[auto-improving-agents-md](https://sharedcontext.ai/skills/external/msewell/auto-improving-agents-md)、[opencode learn.md](https://upd.dev/anomalyco/opencode/src/branch/v2/.opencode/command/learn.md)、[mindstudio](https://www.mindstudio.ai/blog/self-improving-ai-agent-feedback-loop)；Addy Osmani 亦有專文 [Self-Improving Coding Agents](https://addyosmani.com/blog/self-improving-agents/)（本次未能開啟）
- Claude Code auto memory 推出時間（二手）：v2.1.59、2026-02，預設開啟 — 【二手】[engineerscodex](https://www.engineerscodex.com/claude-code-auto-memory)

**失敗模式：投毒與退化**

- Sleeper memory poisoning（ICML 2026，arXiv 2605.15338）：被毒文件或網頁誘使助理寫入虛構記憶、潛伏後在後續對話浮現；在 GPT-5.5 上毒記憶寫入率高達 99.8%，成功召回後 60–89% 導致攻擊者預期的 agentic 行為 — 【同儕審查／搜尋摘錄】[arXiv 2605.15338](https://arxiv.org/pdf/2605.15338)、[ICML 2026](https://icml.cc/virtual/2026/67842)
- 系統性研究（ICML 2026，arXiv 2606.04329）：四種記憶寫入通道、九種結構性弱點、六類攻擊、MPBench；關鍵發現「寫入與檢索記憶越積極的 agent 越易被利用」，既有 prompt-injection 防禦覆蓋不完整 — 【同儕審查／搜尋摘錄】[arXiv 2606.04329](https://arxiv.org/pdf/2606.04329)、[ICML 2026](https://icml.cc/virtual/2026/67964)
- MemoryGraft（arXiv 2512.16962）：透過 README 等看似無害檔案植入假「成功經驗」，日後相似任務被檢索並照做 — 【一手／搜尋摘錄】[arXiv 2512.16962](https://arxiv.org/html/2512.16962)
- MemPoison（arXiv 2607.14651）：評估十個 agent，無一能把攻擊達成率降到可忽略；未防禦為 0.5365–0.6687 — 【一手／搜尋摘錄】[arXiv 2607.14651](https://arxiv.org/pdf/2607.14651)
- 記憶操作的學術分類：Du 等（arXiv 2505.00675，2025-05，v3 2025-12）把記憶分參數式／脈絡式，定義六種操作 consolidation、updating、indexing、forgetting、retrieval、compression；2026 年調查（arXiv 2603.07670）以 write-manage-read 迴路建模，列 "learned forgetting" 與 "continual consolidation" 為開放問題 — 【一手／搜尋摘錄】[arXiv 2505.00675](https://arxiv.org/abs/2505.00675v3)、[arXiv 2603.07670](https://www.alphaxiv.org/abs/2603.07670)

### Inferences
- 證據結構：正向效果的數據幾乎都是論文自報或廠商內部評測（ACE／ReasoningBank／Anthropic 39%），獨立複現稀少；但失敗模式（collapse、poisoning、矛盾任選）有多篇獨立且同儕審查的研究支撐。治理設計應「假設記憶會壞」而非「假設記憶會幫」。
- 可直接轉為原則的 ACE 教訓：制度知識的更新應是「增量 delta + 合併修剪」，禁止由 LLM 整檔重寫（那正是 context collapse 的機制）。使用者的規則檔由人改、有 changelog，天然避開 collapse；但若未來讓 agent 自動提案，提案應是 diff／單條新增，而非整檔重寫。
- 寫入門檻的共識是「重現兩次」（Claude Code 官方「same mistake a second time」、Cursor、self-improve 工具一致），這直接回答「怎麼不淹沒」：第一次失敗只進 postmortem／issue，第二次才升級為規則；且規則入庫同時必須帶著 expected trace（使用者已有）與 evidence 連結（使用者已有）。
- 容量治理應是硬性而非道德勸說：Claude Code 對 MEMORY.md 的 200 行／25KB 強制截斷，是「常駐層有物理上限」的具體化。對使用者的 harness：為常駐規則層設行數／條數預算，超限即不能合併（見 KQ5 ratchet）。
- 投毒研究對「agent 可寫入制度知識」的含意：寫入通道必須經人審核（PR），來源需可追溯（哪個 session、哪個失敗），且記憶內容在使用時應被當作「提示而非事實」——Claude Code 自身就把 CLAUDE.md 定位為 advisory、把強制留給 hooks。對窄域單一服務，最大的投毒面是 agent 讀到的第三方 README／issue／網頁，而非內部規則檔。
- 「Claude skips anything it can derive from the codebase」是一條好的去重原則：制度知識只收「無法從程式碼與 git 歷史推得」的事（決策理由、環境怪癖、人際約定），其他交給按需檢索；這也與使用者 AGENTS.md 中「導航短細節深」的原則同構。
- 「stale」的治理目前沒有研究，只有工具實作：Anthropic 的「刪除長期未存取的記憶檔」、Claude Code 的 prompt-audit「引用不存在的檔案／命令」檢查、Cursor 的「引用而非複製」。可推論的原則：每條規則應宣告它依賴的事實（檔案路徑、命令、模型版本），稽核時機械檢查這些依賴是否仍成立。

### Gaps
- ACE 論文中 context collapse 的具體數字範例（token 數與準確率跌幅）本次未能自全文核對。
- ReasoningBank 在 WebArena／Mind2Web／SWE-Bench-Verified 的確切增幅本次未取得。
- Devin Knowledge 官方文件：查無實證（搜尋未回傳 docs.devin.ai 內容）。
- Mem0／Letta／Zep 的獨立評測：本次未涵蓋。
- 「stale memory」（過時但未被覆寫的記憶）作為獨立失敗模式的實證研究：查無實證；目前只有投毒與 collapse 有論文。
- Claude Code auto memory 推出版本與日期未能以官方 changelog 核實。
- Addy Osmani《Self-Improving Coding Agents》內容本次未能開啟。

---

## KQ4 agent 交付管線的指標：DORA／SPACE／DX Core 4 的改編與 agent 專屬訊號

### Takeaway
2025–2026 的指標研究一致指出：AI 放大既有系統（DORA 2025 把成效歸於七項組織能力而非工具本身）；結果層指標（吞吐、變更失敗率、重工、穩定性）仍是主軸，AI 專屬遙測只是診斷脈絡；接受率、採用率、感知速度是已被實證打臉的 vanity metric（METR RCT：開發者自覺快 20%、實測慢 19%；agent PR 接受率高不代表維護成本低）。agent 專屬指標中有資料支撐的是接受率／免修改率／審查往返數；revert rate、cost per merged change、time-to-escalation 等尚無公開實證。

### Cited Findings
- DORA 2025《State of AI-assisted Software Development》（近 5,000 受訪者）提出 DORA AI Capabilities Model——七項能放大 AI 效益、降低風險的基礎實務，執行摘要點名 clear AI policy、healthy data ecosystem、user-centric focus 等；Splunk 評論："these aren't exotic, AI-specific tricks. They are the same battle-tested principles of elite DevOps and product management" — 【一手／搜尋摘錄】[dora.dev/ai/capabilities-model](https://dora.dev/ai/capabilities-model)、[報告 PDF](https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf)；【二手】[Splunk review](https://www.splunk.com/en_us/blog/learn/state-of-devops.html)
- DX Core 4 以 speed／effectiveness／quality／impact 四維統合 DORA、SPACE、DevEx；DX 建議以系統資料而非自報為主，因其持續更新且為領先指標 — 【廠商主張／搜尋摘錄】[docs.getdx.com/dx-core-4](https://docs.getdx.com/dx-core-4/)
- DX AI Measurement Framework 分 utilization／impact／cost 三維，對應採用→影響→治理與成本效率的生命週期；impact 指標例為跨 SDLC 的 "AI-driven time savings" 與季度 CSAT；2026-06 的 DX 電子報主張 AI 專屬遙測應作為 "diagnostic context" 而非取代結果導向衡量 — 【廠商主張／搜尋摘錄】[getdx.com AI measurement](https://getdx.com/blog/how-to-implement-ai-measurement-framework/)、[Revisiting the DX Core 4 in the age of AI](https://newsletter.getdx.com/p/revisiting-the-dx-core-4)、[measuring AI code assistants and agents](https://getdx.com/research/measuring-ai-code-assistants-and-agents/)
- METR RCT（2025-02～06）：16 位資深開源開發者（平均 5 年經驗、1,500 commits）、246 個真實任務，使用 AI 時完成時間 +19%；事前預測 −24%，事後仍自認 −20%；作者強調只是一項研究、不具預測性 — 【二手轉述一手研究】[DX 摘要](https://getdx.com/blog/metr-study-on-how-ai-affects-developer-productivity/)（METR 原站本次不可達）
- Agentic PR 實證（AIDev 資料集，MSR 2026 系列）：
  - Pinna 等分析 5 個 agent 的 7,156 個 PR，Codex 在九類任務接受率 59.6%–88.6%，文件類 82.1% vs 新功能 66.1%，並警告 "short-term acceptance may mask long-term maintenance burdens" — 【同儕審查／搜尋摘錄】[Pinna et al. MSR'26 PDF](https://solar.cs.ucl.ac.uk/pdf/pinna2026msr.pdf)
  - Nakashima 等（arXiv 2602.04226，2026-02）：83.8% agentic PR 被接受 vs 人類 91.0%；免修改接受 54.9% vs 58.5% — 【一手／二手轉述】[arXiv 2602.04226](https://arxiv.org/abs/2602.04226) 經 [codex.danielvaughan.com](https://codex.danielvaughan.com/2026/06/27/why-agentic-prs-get-rejected-codex-cli-acceptance-rates-trust-attribution-open-source/) 轉述
  - Abujadallah 等（MSR 2026）：Copilot／Devin／Cursor／Claude 提出的修補 46.41% 被拒 — 【二手】[codex.danielvaughan.com](https://codex.danielvaughan.com/2026/06/18/why-agentic-pull-requests-get-rejected-codex-cli-ci-gates-review-hooks-defence/)
  - Rahman 等（MSR'26 Mining Challenge）：Codex 多數類別接受率高；Copilot PR 引發最多人工與自動審查討論 — 【搜尋摘錄】[arXiv 2602.08915](https://arxiv.org/abs/2602.08915)
  - 另有 [A Task-Level Evaluation of AI Agents in Open-Source Projects（arXiv 2602.02345）](https://arxiv.org/abs/2602.02345v1) — 僅見標題，內容未取得
- Benchmark 的 harness 效應（~12 分）與 Verified→Pro 的 81%→23–54% 落差（見 KQ1）說明「同一模型、不同 harness」差異可大於模型世代差 — 【二手】[buildmvpfast](https://www.buildmvpfast.com/blog/benchmark-contamination-ai-coding-leaderboard-swe-bench-2026)
- 一般 SRE 原則對 agent 的「uptime 全綠但任務失敗」警告（見 KQ2）— 【二手】[alexcloudstar](https://www.alexcloudstar.com/blog/ai-agent-reliability-engineering-2026/)
- Claude Code 官方把「驗證是否存在」而非「速度」當作第一設計變數；"Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills." — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- 對使用者的 per-task line（lines/files/time/compactions/interventions）：這些是「過程／成本」指標，應與兩個「結果」指標配對才有解釋力——(1) 合併後穩定性（revert／hotfix／回歸 eval 失敗，對應 DORA change failure rate 與 DX 的 rework）；(2) 首次通過 gate 率（first-pass acceptance by deterministic checks，而非人工接受率）。沒有結果指標，過程指標會被 Goodhart（例如為了壓低 interventions 就把人工 gate 拆掉）。
- 有實證支持可採用：接受率、免修改接受率、審查往返數（AIDev 研究）；但 Pinna 的警告意味著接受率必須與「合併後 N 天內被修改／回退」聯看。
- 查無實證但邏輯上重要、建議自建並標示為假設：intervention rate（使用者已有）、time-to-escalation（agent 卡住到求助的時間——Majgaonkar「失敗軌跡更長」支持它是失敗前兆）、cost per merged change（token + 人時 ÷ 合併數）。
- METR 的教訓：任何「感覺更快」的自報都不能當 KPI；量測行若含自評欄位，應與系統量測並列並定期對照偏差。
- DORA 2025 的「AI 是放大器」與 Deming 的系統觀一致：harness 指標先量系統（gate 完整度、eval 覆蓋率、常駐規則條數／預算使用率、規則平均存活期），再量單次任務。
- 「compactions」是使用者量測行中最接近 Anthropic「context 是第一約束」的指標；可推論它與失敗率正相關（長時 harness 文章的「context 耗盡在實作中途」），值得當作任務切分是否足夠的領先指標。

### Gaps
- DORA AI Capabilities Model 七項完整清單本次未能自 dora.dev 取回（僅三項由摘錄確認）。
- DORA 2025 關於 AI 提升吞吐同時增加不穩定性的具體敘述與數字：本次未取得。
- SPACE 框架的 2025–2026 改編：查無實證（搜尋未涵蓋）。
- agent PR 的 revert rate／合併後缺陷率：查無實證（搜尋明確未找到）。
- cost per merged change、time-to-escalation、autonomy %：查無公開實證或產業基準。
- DX 的 Booking.com 16% 吞吐提升為廠商行銷數據，未獨立驗證。
- METR 原始報告（metr.org）本次不可達。

---

## KQ5 Harness 自身治理：規則即程式碼、ratchet、修剪，以及長規則清單的遵守退化證據

### Takeaway
有多條獨立證據支持「指令越多越不遵守」：IFScale 顯示最強模型在 500 條指令時僅 68% 且偏向遵守較早的指令、退化呈門檻／線性／指數三型；多篇 2025–2026 論文顯示加一條多餘約束也會傷主任務；Anthropic 官方明言 bloated CLAUDE.md 會讓模型忽略真正重要的規則、矛盾規則會被任選。治理共識：規則「像程式碼」版本化、審查、稽核、修剪；能決定性執行的規則（hook／lint／CI）就不要寫成 prose；常駐層有硬預算。「ratchet」在 lint 治理有成熟實作（Notion eslint-seatbelt：違規數只能自動下降、上升需審批），但套用到 agent 流程規則尚無人正式論述。

### Cited Findings

**長規則清單的遵守退化（實證）**

- IFScale（arXiv 2507.11538，2025-07）：以商業報告任務測最多 500 條關鍵字包含指令，最佳前沿模型在 500 條時僅 68%；觀察到三種退化型態（threshold／linear／exponential）、對較早指令的偏好（primacy bias），與多類錯誤型態 — 【一手／搜尋摘錄】[arXiv 2507.11538](https://arxiv.org/abs/2507.11538)
- Constraint Saturation Evaluation（arXiv 2608.12426，Vasileva）：k=1～12 條同時約束；模型在 k=8 時單條約束通過率約 41%、八條全過僅 5.7% — 【二手／未核對 arXiv】[developersdigest 摘要](https://www.developersdigest.tech/papers/constraint-saturation-evaluation-instruction-following-collapse)
- 《On the Paradoxical Interference between Instruction-Following and Task Solving》（arXiv 2601.22047，Qi 等）：加入一條原本成功輸出已滿足的「不證自明」約束，仍會造成任務表現下降，含 Claude-Sonnet-4.5 — 【一手／搜尋摘錄】[arXiv 2601.22047](https://arxiv.org/pdf/2601.22047)
- 《When Thinking Fails》（NeurIPS 2025，arXiv 2505.11423）：15 個模型上顯式 CoT 可顯著降低 IFEval／ComplexBench 的指令遵守 — 【同儕審查／搜尋摘錄】[arXiv 2505.11423](https://papers.cool/arxiv/2505.11423)
- Anthropic 官方（CLAUDE.md）："Bloated CLAUDE.md files cause Claude to ignore your actual instructions!"；"If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost."；"The over-specified CLAUDE.md. If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise." → "Fix: Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook." — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)
- 官方對矛盾的描述："if two instructions contradict each other, Claude may pick one arbitrarily."；user 規則與 project 規則衝突時 "Claude may follow either one, so keep the two consistent." — 【官方全文】[How Claude remembers your project](https://code.claude.com/docs/en/memory)

**規則 vs 決定性機制（官方）**

- "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens."；Stop hook "runs your check as a script and blocks the turn from ending until it passes"；`/goal` 由獨立 evaluator 每回合重檢直到目標達成 — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)
- "If the instruction is something that must run at a specific point, such as before every commit or after each file edit, write it as a hook instead. Hooks execute as shell commands at fixed lifecycle events and apply regardless of what Claude decides to do." — 【官方全文】[How Claude remembers your project](https://code.claude.com/docs/en/memory)

**規則即程式碼、預算、稽核（官方）**

- "Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts."；"Check CLAUDE.md into git so your team can contribute. The file compounds in value over time." — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)
- 每檔 "target under 200 lines"；MEMORY.md 硬截 200 行／25KB；`/doctor prompt-audit` 找「為舊模型寫的指令、不存在的檔案／命令、互相矛盾的檔案」且只提案不自動改；`/doctor` 對 checked-in CLAUDE.md 提案刪除可由程式碼推得的內容；path-scoped `.claude/rules/` 只在碰到相符檔案時載入以省 context — 【官方全文】[How Claude remembers your project](https://code.claude.com/docs/en/memory)、[Best practices](https://code.claude.com/docs/en/best-practices)
- 強調的稀缺性："If Claude keeps skipping one instruction, add emphasis such as "IMPORTANT" to that line alone. If you emphasize many lines, none of them stands out." — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)

**實務者門檻（彼此不一致）**

- 80 行開始掉規則、200 行大段被忽略、300 行實際上限、建議修到 200 行以內；「instruction budget」說法稱前沿 LLM 可靠遵守約 150–200 條指令、Claude Code 系統提示已用約 50 條（來源自稱數字可議，且為二手引用研究）；修剪測試 "Would removing this cause Claude to make a mistake it can't recover from?"；「看似被忽略的規則常是機制問題（引用的檔案沒跟著走、路徑已不存在）」— 【二手】[tianpan.co](https://tianpan.co/blog/2026-04-13-claude-md-as-codebase-api)、[techsy.io](https://techsy.io/en/blog/claude-md-best-practices)、[tomevault.io](https://tomevault.io/fix/claude-md-ignored)；其中「AGENTbench 顯示自動產生的 context 檔反而降低成功率」一說 —【查無實證】

**OpenAI harness engineering 與 garbage collection**

- 《Harness engineering: leveraging Codex in an agent-first world》（Ryan Lopopolo，2026-02-11）：五個月實驗、內部 beta 產品無任何人手寫程式碼，Codex 連文件與 CI 設定都寫 — 【一手／搜尋摘錄】[openai.com/index/harness-engineering](https://openai.com/index/harness-engineering/)（全文本次不可達）
- 二手描述其 "garbage collection"：工程師把「黃金規則」編進 repo，Codex 定期掃描偏差並開重構 PR，讓小問題在累積成技術債前被清掉；另一綜述稱 AGENTS.md 應是指向深層文件的短目錄而非百科 — 【二手】[36kr](https://eu.36kr.com/en/p/3715546375188870)、[yage.ai 綜述](https://yage.ai/share/harness-engineering-survey-en-20260312.html)
- HN 討論質疑 garbage collection 是否真為 harness 要件，認為多數 harness 反而加劇 codebase drift — 【二手】[HN thread](https://hn.nuxt.dev/item/49464970)

**Ratchet 的成熟實作（lint 領域）**

- Notion 的 ratcheting 系統（開源為 eslint-seatbelt）：CI 擋新違規、按檔案記錄違規數，修掉後數字自動下降、要增加需審批；既有違規視為 warning、新違規為 error（因 warning 常被忽略）；代價是移動／重構檔案需同步更新 ratchet 檔 — 【一手／搜尋摘錄】[Notion Engineering](https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules)
- 「day-1 綠燈、逐類修、以 ratchet 鎖住進度」的提案 — 【二手】[GitHub issue](https://github.com/mojoatomic/eslint-plugin-ai-code-snifftest/issues/210)
- 早期導入 lint 可避免被迫選擇「修完所有歷史違規 vs 做 ratchet」 — 【二手】[understandingdata.com](https://understandingdata.com/posts/early-linting-prevents-ratcheting/)
- Cursor 官方：規則有大小上限、拆小、引用而非複製以免過時 — 【一手／搜尋摘錄】[docs.cursor.com/context/rules](https://docs.cursor.com/context/rules)

### Inferences
- 「規則層級化」原則：每條流程規則先問能否降級成決定性機制（hook／lint／CI／schema／測試），能就不要留在 prose；prose 只保留模型需要判斷的啟發式（Anthropic 的 right altitude）。這同時減少指令數（IFScale）、消除「遵守與否」的不確定性，並讓規則可被測試（test.js 已是使用者契約的可執行版本——同一邏輯可延伸到流程規則）。
- Ratchet 轉移到流程規則的具體形式（本研究推論，無人正式論述）：
  - 預算 ratchet——常駐規則條數／行數只能降不能升；升需人工審批並附理由、evidence 與 expected trace。
  - gate ratchet——某 eval／檢查一旦連續 N 次通過即自動從 advisory 升為 blocking（只緊不鬆）；放鬆需人決定並記錄（這對應 Notion「上升需審批」的方向）。
  - 違規 ratchet——spec-drift audit 的偏差計數像 Notion 一樣只准下降；新偏差擋合併、舊偏差列清單。
- 修剪的觸發條件可自動化（而非靠人記得）：規則的 expected trace 在最近 K 次任務中從未被觸發或檢查 → 候選刪除或降級為按需載入（Anthropic 的 "If Claude already does something correctly without the instruction, delete it"）；規則引用的檔案／命令／模型版本不存在 → 立即失效並開 issue（`/doctor prompt-audit` 的檢查項，可寫成 CI）。
- IFScale 的 primacy bias 有直接排版含意：最關鍵的少數規則放最前面，而非依主題分類排序；使用者 AGENTS.md 把「維護紀律」放首節是對的。
- OpenAI 的 garbage collection 概念值得借用但應改為「agent 提案、人合併」：掃描規則與現況偏差、開 PR，不自動改規則——這與 KQ3 投毒研究的「寫入通道需審核」一致，也與 Claude Code `/doctor` 的「只提案不改」一致。
- 「instruction budget 150–200 條」目前只有二手且來源自承可議；可用的硬數字只有 Anthropic 的「每檔 200 行」與「MEMORY.md 200 行／25KB」。建議以官方數字為預算起點，並以自己的 regression eval 通過率作為「預算是否過高」的實證（規則增加、回歸通過率下降即為超載訊號）。

### Gaps
- OpenAI harness engineering 全文（含 garbage collection 原文、追蹤的指標、PR 數）本次不可達，相關描述均為二手。
- 「ratchet 規則」套用於 agent 流程／prompt 規則：查無實證（無論文或知名實務文）。
- 「rules rot」作為正式研究主題：查無實證；只有工具文件與部落格。
- CLAUDE.md 長度與遵守率的受控實驗：查無實證；官方 200 行建議與實務者 80／200／300 行皆為經驗法則。
- IFScale 的退化起點（多少條指令開始掉）未自全文取得；Constraint Saturation 論文未在 arXiv 核對。
- Codex 官方 AGENTS.md 撰寫指南：本次未取得。

---

## KQ6 可轉移的持續改進紀律（Toyota Kata／PDCA、SRE postmortem 與 error budget、Deming、Goldratt、Accelerate）

### Takeaway
搜尋未找到任何可信來源正式論述「把 Toyota Kata／PDCA／Deming／Goldratt 轉移到 agent 交付 harness」；SRE 原則套用到 AI agent 只有定義性的詞彙表與個人實務文。因此本節的轉移多為推論，但 2025–2026 的 Anthropic 官方文件在不點名的情況下已內建了這些紀律的實體：可執行驗證（快速回饋）、根因而非症狀、看 transcript（去現場）、兩次糾正即重開（停止線）、規則像程式碼般修剪（標準作業的持續改訂）、一次只做一個功能（小批量）。

### Cited Findings
- SRE 套用於 AI 的定義（2026 詞彙表）："Site reliability engineering for AI applies SRE principles — error budgets, service level objectives, toil reduction, and blameless post-mortems — to the operation of AI agent systems."，並稱團隊須先定義 agent 的「可靠」（延遲、準確、成本、合規）— 【二手】[prefactor.tech glossary](https://prefactor.tech/glossary/sre-ai)
- 實務者指出 agent 的可靠性不能直接套一般服務的 SRE playbook："trying to retrofit one onto the other is the most common reason teams ship reliability dashboards that do not match user reality"；案例：靜默模型回歸仍回傳成功碼 — 【二手】[alexcloudstar](https://www.alexcloudstar.com/blog/ai-agent-reliability-engineering-2026/)
- 一般 SRE 背景：100% 可靠既不可能也無效率，可接受的失敗量定義為預算，預算內快速出貨與創新 — 【二手】[oneuptime SRE](https://oneuptime.com/solutions/sre)
- Toyota Kata：Mike Rother 2009 年提出，包含 improvement kata 與 coaching kata，強調 PDCA 與 mentor–mentee 對話；A3／PDCA 源於 Deming — 【二手】[TWI Institute](https://www.twi-institute.com/what-is-kata/)、[getAbstract Toyota Kata](https://www.getabstract.com/pt/resumo/toyota-kata/29910)、[getAbstract Understanding A3 Thinking](https://www.getabstract.com/zh/%E6%91%98%E8%A6%81/understanding-a3-thinking/40569)
- Anthropic 官方文件中與這些紀律同構的條文（原文見 KQ1／KQ2／KQ5）："Address root causes, not symptoms"（提示策略表）；"Give Claude a way to verify its work"；"Read the transcripts!"；"After two failed corrections, /clear"；"Treat CLAUDE.md like code: review it when things go wrong, prune it regularly" — 【官方全文】[Best practices](https://code.claude.com/docs/en/best-practices)、[Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- Anthropic 長時 harness 的「一次只做一個功能、端到端驗證才算完成」— 【官方全文】[Memory tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)、[Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- DORA 2025 以組織能力（而非工具）解釋 AI 成效（見 KQ4）— 【一手／搜尋摘錄】[dora.dev](https://dora.dev/ai/capabilities-model)
- MAST「失敗主要源於系統設計而非模型」（見 KQ2）— 【二手】[alphaxiv](https://www.alphaxiv.org/overview/2503.13657)

### Inferences（每條紀律的具體轉移；均為本研究推論，應標示為假設）
- Deming「結果由系統產生」→ 失敗歸因單位是 harness（規格、gate、context、工具），不是「模型這次笨」；postmortem 的 action item 只能是改 harness（規則／eval／hook／工具）或升級給人，不能是「下次提示它小心」。MAST「失敗主要源於系統設計」與 DORA「AI 是放大器」是這條的實證側影。
- SRE blameless postmortem → 對 agent 天然無責難，但要保留「contributing causes」的多因分析與有 owner 的 action item；每個 postmortem 固定產出 ≥1 個 regression eval（KQ1）與 1 個失敗分類標籤（KQ2），否則不算結案。無來源直接論述此轉移【查無實證】。
- SRE error budget → 以「每週可接受的人工介入次數／回退次數」當預算：預算內 harness 可自動放寬（例如允許更大任務、更少人工 gate）；耗盡則自動收緊（只做小任務、全程 blocking gate）直到回補。這是 KQ5 ratchet 的對偶：緊可自動、鬆需人。
- Toyota Kata（improvement kata：目標狀態→現況→障礙→實驗→學習）→ 使用者的「規則變更附 expected trace」正是 kata 的「預測實驗結果再驗證」步驤；缺的是 coaching kata 的節奏：固定週期（例如每週）只看一個障礙、一個實驗，避免一次改多條規則而無法歸因（Shankar 的 criteria drift 也暗示標準需要這種迭代節奏）。
- Goldratt 約束聚焦 → 用 KQ2 的失敗分類聚合找出本期最大類別，只針對它改 harness；其他類別不動。這是防止「每個失敗都加一條規則」導致規則膨脹（KQ5 的 IFScale 風險）的制度性煞車。
- Accelerate 小批量＋快回饋 → 任務切小（Anthropic 的 one feature at a time）、每次編輯跑測試（縮短 agent 的回饋迴路）、規則改動也小批量（一次一條、可歸因到 expected trace 的變化）。
- 「人不淹沒」的整體圖像：人只做三件事——(1) 讀失敗 transcript 並打分類標籤；(2) 審批規則／eval／hook 的 PR；(3) 決定何時放鬆 ratchet。其他（量測、分類聚合、候選修剪、eval 執行、偏差掃描、依賴失效檢查）由 harness 自動。

### Gaps
- Toyota Kata／PDCA／Deming／Goldratt 對 agent 交付的正式轉移論述：查無實證。
- Google SRE book／workbook 的 postmortem 章節原文本次不可達（sre.google DNS 失敗），未能引用原句（canonical 位置為 https://sre.google/sre-book/postmortem-culture/ ）。
- Accelerate（Forsgren／Humble／Kim，2018）四指標在 agent 情境的改編研究：本次未找到專文（DORA 2025 報告全文未讀）。
- error budget 概念套用於 agent 介入率／回退率：查無公開案例。
- Deming「94% 歸因於系統」的原始出處本次未能查證（搜尋額度耗盡前未執行）。
