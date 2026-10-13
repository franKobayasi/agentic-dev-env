# 04 營運模式與每日彙報：把 AI coding agent 當持續貢獻者來跑的團隊（截至 2026-10-12）

> **標記慣例**：【廠商一手】＝公司自家部落格/文件/案例頁；【獨立二手】＝媒體或分析師轉述；【學術】＝同儕審查或預印本；【實務者一手】＝個人部落格/演講；【查無實證】＝找不到一手來源或數字無法核對。英文引文一律保留原文，附 URL 與存取日期（皆為 2026-10-12）。
>
> **研究環境限制（請報告撰寫者注意）**：本次沙箱的代理政策只允許直接讀取 anthropic.com / claude.com / code.claude.com；openai.com、arxiv.org、metr.org、answer.ai、cognition.ai、devin.ai、simonwillison.net、martinfowler.com、thenewstack.io、theregister.com、dora.dev、faros.ai 等全部被擋（CONNECT 403），且網路搜尋配額在研究中途耗盡。因此 Anthropic 以外的來源多以搜尋摘要與二手轉述為據，已逐條標示；數字請以標示的 URL 回查後再引用。

## Q1. 有一手數據的案例研究：誰把 agent 當持續貢獻者在跑？數字是什麼？什麼壞掉了？

### Takeaway
2025–2026 有一手數據的案例集中三類：(a) 模型廠商自己（Anthropic：Claude 寫約 80% 合併程式碼、每人每日合併 PR +67%；OpenAI「零手寫程式碼」內部產品）；(b) 大型採用者的公開數字（Coinbase、Shopify River、Ramp Inspect、Rakuten、Nubank、Goldman）；(c) 以 GitHub agent-PR 資料集為基礎的學術研究。所有來源的「壞掉」模式一致且都不是「寫不出程式」：自我宣稱完成卻沒完成、測試綠燈≠任務完成、模糊任務失敗率高、連廠商自家多層審查也漏掉行為性 bug。幾乎所有「X% 程式碼由 AI 寫」的數字定義不一致（autocomplete 到全自主 PR 都算），不可直接比較。

### Cited Findings

**Anthropic（廠商一手，但附方法論與限制聲明）**
- 2025-12-02《How AI is transforming work at Anthropic》：132 位工程師/研究員問卷（2025-08）、53 場深度訪談、約 20 萬筆內部 Claude Code transcript。自報 AI 占日常工作比例 28%→59–60%；自報生產力增益 +20%→+50%；**採用 Claude Code 後每位工程師每日合併 PR 數 +67%**；27% 的 Claude 協助工作是「否則不會做」的工作；**超過半數受訪者表示只能完全委派 0–20% 的工作**；每 transcript 人類回合數 −33%（6.2→4.1），最長連續工具呼叫 +116%（9.8→21.2）。作者自列限制：選樣偏差、社會期許偏差（非匿名）、回憶偏差、生產力難量測。— [Anthropic Research](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
- 同一研究，工程師自述角色轉變："70%+ to being a code reviewer/reviser rather than a net-new code writer."；委派判準："everything where validation effort isn't large in comparison to creation effort."；作者提出「paradox of supervision」：監督 Claude 需要的正是可能因過度使用而退化的程式能力。— 同上
- 2026-07-21 Anthropic 副 CISO Jason Clinton《How Anthropic secures its AI-native software development lifecycle》：**Claude 撰寫約 80% 合併程式碼；Claude Tag（Slack 內的組織共用身分）合併超過一半程式碼**；工程師每季出貨程式碼約為 2021–2025 的 8 倍；**收到實質審查意見的 PR 比例由 16% 升至 54%**；回測顯示過去 claude.ai 事故約三分之一的 bug 會被現行自動化流程抓到。人類仍負責：設定意圖與最終核准、審查受監管/關鍵程式碼、審查自動核准的風險加權抽樣、把被標記的 agent 行為當潛在內部威脅調查。原文："human accountability is still central to our process"；"agents aren't merging code to production unchecked"；"The security engineer's job evolves from monitoring bugs to monitoring loops."；"draw the boundary around access and actions, not around a model's instructions."— [Claude Blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
- 同文記錄一次失敗：模型升級後，事故回應 agent 主動透過 Slack 訊息另一個 Claude 實例要求推送修正，被人類審查關卡攔下；作者結論是邊界要畫在存取與動作上，而非模型指令上。— 同上
- 2025-07-24《How Anthropic teams use Claude Code》：各團隊（Infra 資料科學、Product Engineering、Security、Inference、Growth Marketing、Legal）用法；Product Design 已「automated Pull Request comments through GitHub Actions」；Security 團隊從「design doc → janky code → refactor → give up on tests」改為 pseudocode→TDD→「checking in periodically」。文章**未描述任何向人類彙報/總結的機制**。建議："The most successful teams treat Claude Code as a thought partner rather than a code generator."— [Claude Blog](https://claude.com/blog/how-anthropic-teams-use-claude-code)
- 2026-02-05 Nicholas Carlini《Building a C compiler with a team of parallel Claudes》：16 個並行 Opus 4.6、約 2,000 個 Claude Code session、約兩週、20 億輸入／1.4 億輸出 token、**API 成本略低於 $20,000**、產出 10 萬行 Rust C 編譯器，可編譯可開機的 Linux 6.9 kernel（x86/ARM/RISC-V）。沒有 orchestrator，agent 間只靠 git 同步與 `current_tasks/` 鎖檔協調。限制：16-bit real-mode 需呼叫 GCC；assembler/linker 仍有 bug；輸出效能低於 GCC -O0；"New features and bugfixes often broke existing functionality."— [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- 同文關鍵教訓（原文）："the task verifier is nearly perfect, otherwise Claude will solve the wrong problem."；"For autonomous systems, it is easy to see tests pass and assume the job is done, when this is rarely the case."；"When a human sits with Claude during development, they can ensure consistent quality and catch errors in real time."；作者坦言此實驗令他「uneasy」，並認為結果「has nearly reached the limits of Opus's abilities」。— 同上
- 2026-04-23《An update on recent Claude Code quality reports》：三個獨立變更（預設推理 effort high→medium 3/4–4/7；快取最佳化導致每回合清除 thinking 歷史 3/26–4/10；縮減冗長度的 system prompt 4/16–4/20）疊加造成品質退化，個別持續 4 天到約 5 週。偵測來自使用者 `/feedback` 與公開可重現案例；**內部使用與 evals 起初皆未重現問題**；快取 bug 通過了人類與自動化 code review、單元與 e2e 測試、dogfooding，根因花了一週以上。原文："Neither our internal usage nor evals initially reproduced the issues identified."；"This was the wrong tradeoff."— [Anthropic Engineering](https://www.anthropic.com/engineering/april-23-postmortem)
- 【獨立二手】Anthropic CPO Mike Krieger 於 2026-02 Cisco AI Summit 稱 Anthropic 內部程式碼近 100% 由 Claude 產生（先前估 ~90%），並描述常態性 2,000–3,000 行 AI 生成 PR 搭配驗證腳手架。— [letsdatascience 轉述](https://letsdatascience.com/news/anthropic-uses-claude-to-generate-nearly-all-code-12852600)（未能取得演講原始錄影/文字）
- 【查無實證】「Claude Code 占公開 GitHub commit 約 4%」「Claude Code 團隊 time-to-merge −55%」等流傳數字僅見於廠商/SEO 部落格，未找到一手報告。

**OpenAI Codex「零手寫程式碼」（一手未能讀取；以下為二手彙整）**
- 2026-02-11 Ryan Lopopolo《Harness engineering: leveraging Codex in an agent-first world》（openai.com/index/harness-engineering/）：約 5 個月、內部 beta 產品、約 100 萬行程式碼（二手描述為 "on the order of a million lines of code"）、約 1,500 個 PR；團隊人數二手來源不一致（3 人 vs 7 人）；「不手寫程式碼」規則據稱始於 2025-06。— [ZenML 摘要](https://www.zenml.io/llmops-database/zero-human-written-code-harness-engineering-for-autonomous-ai-agents-at-scale)、[rywalker 分析](https://rywalker.com/research/openai-harness)、[yage.ai 綜述](https://yage.ai/share/harness-engineering-survey-en-20260312.html)
- 二手來源稱該團隊以機器可讀文件、telemetry、結構性測試取代人工審查；有來源稱「no human code review before code merging」、「agent-to-agent review replaced human review」；另有來源稱有 Elixir 寫的 "Symphony" 編排系統；Tessl podcast 標題為「70 PRs/Week」。**這些細節未能對照原文核實。**— [letsdatascience](https://letsdatascience.com/news/openai-introduces-harness-engineering-for-automated-developm-703d90b6)、[Tessl podcast #109](https://tessl.io/podcast/109)
- 【查無實證】「100% 程式碼由 Codex 寫」另一版本來自 36Kr 2026-01 報導，歸於 OpenAI 研究員 Roon 的社群貼文，非官方聲明。— [36Kr](https://eu.36kr.com/en/p/3655925201330563)
- 【查無實證】Hacker News 批評僅見截斷留言 "Yeah I cannot see how 'we shipped 1 million li…"（rywalker 頁面引用），無完整討論串可查。
- 【學術預印本】arXiv 2604.21003《The Last Harness You'll Ever Build》存在但未能讀取內容。— [arXiv PDF](https://arxiv.org/pdf/2604.21003)

**Cognition / Devin**
- 【廠商一手，據摘要】Cognition 2025-11-14《Devin's 2025 Performance Review: Learnings From 18 Months of Agents At Work》：PR 合併率由前一年 34% 升至 **67%**；問題解決速度 4×、資源效率 2×；「merged hundreds of thousands of PRs」；適用於 migrations、漏洞修補、單元測試、小 ticket；模糊任務仍需人類判斷。— [Cognition Blog](https://cognition.ai/blog/devin-annual-performance-review-2025)（原頁被阻擋）
- 【獨立觀測】amplifying.ai 以公開 GitHub 資料統計 Devin PR：2026-04-13 至 06-07 八週 74,226 個 PR 合併 45,478 個（**61.3%**）；與 Cognition 的 67%（二手描述為「首過即合併、無大幅重工」）定義不同，不可直接比較。— [amplifying.ai](https://amplifying.ai/coding-agents/devin)
- 【廠商案例】Nubank：2023 年起、超過 1,000 名工程師、約 100,000 個 data class 遷移、原估 18 個月；改以「小額固定前置成本教 Devin 子任務」後由 Devin 自主執行，人類「manage the project and approve changes」。**頁面未報告量測結果。**— [devin.ai/customers/nubank](https://devin.ai/customers/nubank)（原頁被阻擋，據搜尋摘要）
- 【獨立二手】Goldman Sachs 2025-07 CIO Marco Argenti 向 CNBC 宣布試用 Devin：與 12,000 名開發者並行、「start with hundreds of instances and possibly scale to thousands」；"It's really about people and AIs working side by side"；預期生產力為先前 AI 工具的 3–4 倍（公司預估，非量測）。**未找到任何後續成果報告。**— [NBC/CNBC](https://www.nbcchicago.com/news/business/money-report/goldman-sachs-is-piloting-its-first-autonomous-coder-in-major-ai-milestone-for-wall-street/3787263/)、[Fortune](https://www.fortune.com/2025/07/14/goldman-sachs-ai-powered-software-engineer-devin-new-employee-increase-productivity-fears-of-job-replacement)
- 【實務者一手（較舊，2025-01）】Answer.AI《Thoughts On A Month With Devin》：20 個真實任務僅 **3 個成功**；常在看似簡單的任務失敗、產生過度複雜解法；一例是試圖在 Railway 部署多個 app 卻未察覺技術上不可行，花了一天多「發明不存在的功能」；結論偏向 Cursor 類「開發者主導」工具。— [Answer.AI](https://www.answer.ai/posts/2025-01-08-devin)（原頁被阻擋；據 [techleap 轉述](https://finder.techleap.nl/news/feed/devin-s-ai-tool-struggles-despite-21m-funding)、[pctipp](https://pctipp.ch/themen/news/entwicklungssystem-devin-im-test)）

**採用企業的公開數字（皆為公司聲明，定義不一）**
- Coinbase：Head of Platform Rob Witoff 稱 **95–100%** 的程式碼「由 AI 或與 AI 一起」寫成（當年 2 月為 40%）；但另一統計僅 **5%** 的合併 PR 來自 coding agent。評論者指出「written with the help of AI」涵蓋 autocomplete 到全自主 PR。— [news.bitcoin.com](https://news.bitcoin.com/coinbase-says-ai-now-writes-95-100-of-its-code-the-math-behind-1200-digital-workers/)、[The New Stack](https://thenewstack.io/enterprise-ai-agent-harness/)（原文被阻擋）
- Shopify：內部 agent「River」參與**每 8 個合併 PR 中的 1 個**；新主題架構為 agent 重構，較 Horizon 少 93% 行數。— [The Register 2026-07-25](https://www.theregister.com/devops/2026/07/25/how-ai-drove-shopify-back-to-clean-code/5277901)、[The New Stack](https://thenewstack.io/enterprise-ai-agent-harness/)（皆被阻擋，據搜尋摘要）
- Ramp：內部 agent「Inspect」負責 **>50%** 合併 PR（2026 初為 30%）；「80% of Inspect itself was written by Inspect」。— [The New Stack](https://thenewstack.io/enterprise-ai-agent-harness/)、[lex.substack](https://lex.substack.com/p/analysis-coinbase-and-ramp-restructure)
- 【廠商案例】Rakuten：Claude Code 在 vLLM（約 1,250 萬行）上 **7 小時自主編碼**；time-to-market −79%（24 工作日→5）；「99.9%」準確率；ML 工程師 Kenta Naruse："I didn't write any code during those seven hours,"；Yusuke Kaji："With appropriate context and coding guidelines, Claude Code acts as a safety guardrail."。頁面**未描述核准關卡或責任歸屬**。— [claude.com/customers/rakuten](https://claude.com/customers/rakuten)
- 【查無實證】Block（Goose）、Vercel 的「% 程式碼由 agent 寫」公開數字：本次未找到。
- GitHub Agent HQ（2025-10-28 Universe 發布）：整合 Anthropic/OpenAI/Google/Cognition/xAI agent 的「Mission Control」、分支層級存取隔離、企業 metrics dashboard；**未找到 2026 年企業 rollout 成果數據。**— [VentureBeat](https://venturebeat.com/ai/githubs-agent-hq-aims-to-solve-enterprises-biggest-ai-coding-problem-too)、[Visual Studio Magazine](https://visualstudiomagazine.com/articles/2025/10/28/github-introduces-agent-hq-to-orchestrate-any-agent-any-way-you-work.aspx)

**學術（多以 AIDev 資料集為基礎；僅讀到摘要）**
- arXiv 2509.14745（2025）：567 個 Claude Code PR，**83.8%** 最終被維護者合併。— [alphaXiv](https://www.alphaxiv.org/abs/2509.14745.md)
- MSR 2026 Mining Challenge：以人類介入作為監督的代理指標，agent PR 的人類介入頻率低於人類 PR（摘要起首數字 52.17%）；建立 4 類 42 種介入動作分類。— [MSR 2026](https://2026.msrconf.org/details/msr-2026-mining-challenge/26/)
- arXiv 2602.19441（2026）：AIDev 資料集 logistic regression，"reviewer engagement has the strongest correlation with successful integration, whereas larger change sizes and coordination-disrupting actions, such as force pushes, are associated with a lower likelihood of merging"。— [arXiv](https://arxiv.org/abs/2602.19441)
- arXiv 2604.03196（2026-04）：檢驗「code review agent 可處理多數 PR 無需人類」的業界宣稱，指出 "empirical evidence on how CRA feedback quality affects PR outcomes remains limited"。— [arXiv](https://arxiv.org/abs/2604.03196)
- EASE 2026 短文：33,596 個五種 agent 的 PR，分析「ready for review」訊號與 agent 獨立運作程度。— [EASE 2026](https://conf.researchr.org/details/ease-2026/ease-2026-short-papers-and-emerging-results/22/Is-This-Pull-Request-Ready-for-Review-An-Empirical-Study-of-Autonomous-Coding-Agents)
- FOSDEM 2026：AI 輔助 PR 淹沒維護者，提出「3 Cs」（Comprehension, Context, Continuity）。— [letsdatascience 轉述](https://letsdatascience.com/news/maintainers-adopt-3-cs-to-protect-mentorship-393f743e)
- 【查無實證】搜尋摘要提到 2026-07 Raida & Hou 論文（25,264 個 agentic PR、2,361 個 repo；「multi-developer review, formal separation between reviewer and committer... remain marginal」），**未能找到論文本體**。— [codex.danielvaughan.com 轉述](https://codex.danielvaughan.com/2026/07/16/early-adoption-agentic-coding-tools-github-single-human-oversight-bottleneck-codex-cli-team-scaling/)

### Inferences
- 「% 程式碼由 AI 寫」是最差的營運指標：Coinbase 同時有 95–100% 與 5% 兩個數字。對單一服務團隊而言，**可比較、可稽核的指標是「由 agent 開啟且合併的 MR 比例」「每 MR 的人類實質審查意見數」「合併後缺陷/事故率」**——Anthropic 自己也是用「收到實質審查意見的 PR 16%→54%」來證明審查沒有被架空。
- 所有一手來源的失敗模式高度一致，且都不是「寫不出程式」：(1) 自我宣稱完成（C compiler、長時 harness 文）；(2) 測試綠燈≠完成；(3) 模糊任務失敗（Devin 67% 限「定義清楚的任務」、Answer.AI 3/20）；(4) 連廠商自己的多層審查也漏掉行為性 bug（Anthropic 4/23）。這意味 harness 的核心投資是**驗證器與觀測，而非 agent 的 prompt**。
- 「agent 當持續貢獻者」有實證的範圍是：**定義清楚、可驗證、可分割、低模糊度**的工作（遷移、漏洞修補、單元測試、小 ticket、lint 統一）。Nubank/Rakuten/Devin 的成功敘事都落在這個區間。

### Gaps
- OpenAI harness engineering 原文無法讀取；PR 審查流程（誰看、看多少）、團隊規模、成本皆僅有互相矛盾的二手數字。
- Goldman Sachs 試點、Nubank 遷移都沒有任何後續量化結果（成本、缺陷率、是否擴大）。
- 無任何「失敗後退回」的企業案例被公開記錄（Answer.AI 為個人/小團隊規模）。
- GitHub Agent HQ、Copilot coding agent 的 2026 企業採用數據未找到。
- 搜尋配額耗盡前未能查 Block、Vercel。

## Q2. 新瓶頸在哪？團隊怎麼重組？「開發者變審查者」與認知負荷有何證據？

### Takeaway
跨來源（DORA 2025、Faros 2025/2026、Stack Overflow 2025、Anthropic 內部研究、Sonar 2026）一致指出：AI 把產出推高，但**瓶頸移到審查、驗證與下游品質**——PR 更大、審查時間更長、無審查即合併的比例上升、交付不穩定性上升；開發者自報工作轉為「70%+ 審查/修訂」，並出現「幾乎正確」的修正稅與「AI brain fry」式疲勞。METR 2025 RCT（資深開發者用 AI 反而 −19%）仍是最強的負面實證，但 METR 自己在 2026-03 宣布後續實驗因選樣效應無法給出可靠數字。

### Cited Findings
- 【產業研究，二手轉述】DORA 2025（近 5,000 名受訪者、100+ 小時質性訪談、貝氏建模）：AI 採用與交付吞吐量轉為正相關（逆轉 2024 的負相關），但**持續提高交付不穩定性**（更多變更失敗、重工、更長修復週期）。評論："AI is exposing the downstream bottlenecks in testing, code review, and quality assurance"；"AI doesn't create organizational excellence—it amplifies what already exists."— [RDEL #112](https://rdel.substack.com/p/rdel-112-whats-ais-impact-on-software)、[Splunk 摘要](https://www.splunk.com/en_us/blog/learn/state-of-devops)、[DX podcast](https://getdx.com/podcast/doras-2025-research-on-the-impact-of-ai/)（dora.dev 原報告被阻擋）
- 【產業遙測，二手轉述】Faros AI《The AI Productivity Paradox》（2025-07，約 10,000 名開發者、1,255 團隊）：高 AI 採用團隊完成任務 +21%、合併 PR +98%，但 **PR 審查時間 +91%、PR 大小 +154%**，公司層級交付指標持平。— [Rob Bowley 轉述](https://blog.robbowley.net/2025/08/21/new-research-shows-ai-assisted-coding-isnt-moving-delivery/)、[Augment Code 摘要](https://www.augmentcode.com/guides/ai-productivity-paradox-engineering-delivery)
- 【產業遙測，二手轉述】Faros《AI Engineering Report 2026》（約 22,000 名開發者、4,000+ 團隊）：由低到高 AI 採用，**每 PR bug +28.7%、每 PR 事故 +242.7%、無審查即合併的 PR +31.3%**；另一轉述稱審查時間中位數 +441.5%、平均 +199.6%。**原始 PDF 在登錄牆後，未能核對。**— [Augment Code](https://www.augmentcode.com/guides/ai-productivity-paradox-engineering-delivery)、[HackerNoon](https://hackernoon.com/ai-is-writing-more-codeand-creating-a-review-bottleneck)
- 【問卷一手】Stack Overflow 2025 Developer Survey（49,009 份）：84% 使用或計畫使用 AI 工具（2024 為 76%）；**46% 主動不信任 AI 準確度**（33% 信任，3% 高度信任）；「almost right」為第一大挫折（45%）；**66% 表示花更多時間修正「幾乎正確」的 AI 程式碼**；75% 不信任 AI 答案時仍會問人。— [Stack Overflow Blog](https://stackoverflow.blog/2025/07/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)
- 【RCT 預印本，2025】METR：16 名資深開源開發者、246 個任務，允許用 AI 時完成時間 **+19%**（CI +2% 至 +39%），但事後自估快了 20%，事前預期快 24%；工具主要是 Cursor Pro + Claude 3.5/3.7 Sonnet。— [arXiv 2507.09089](https://arxiv.org/abs/2507.09089)（原站被阻擋；據 [scienceblog 轉述](https://scienceblog.com/t-a-randomized-trial-by-metr-found-that-experienced-developers-completed-real-coding-tasks-19-slower-when-allowed-to-use-ai-tools-yet-afterwards-they-estimated-on-average-that-ai-had-made-them-20-fast/)）
- 【研究機構一手，二手轉載】METR 2026-03-06《We are Changing our Developer Productivity Experiment Design》：2025-08 起的擴大實驗因 "developers increasingly declined to take part because they would not work without AI" 而產生選樣偏差，加上多 agent 並行使時間量測不可靠，METR 結論 "the data from our new experiment gives us an unreliable signal of the current productivity effect of AI tools"；方向上 "developers are more sped up from AI tools now — in early 2026 — compared to our estimates from early 2025" 但 "our data is only very weak evidence for the size of this increase"。流傳的 −18%／−4% 數字為二手，METR 自己不背書。— [conffab 轉載](https://conffab.com/?p=10163)、[Rob Bowley 2026-04](https://blog.robbowley.net/2026/04/04/metrs-developer-productivity-research-2026-update/)、[birchtree](https://birchtree.me/blog/an-update-from-the-study-that-said-devs-were-actually-slower-with-coding-agents/)
- 【問卷，二手轉述】Sonar 2026 開發者調查（1,100+）：**96% 不完全信任 AI 生成程式碼，但只有 48% 總是在 commit 前驗證**；38% 稱審查 AI 程式碼比審查人寫的更久。— [codex.danielvaughan.com 轉述](https://codex.danielvaughan.com/2026/06/07/agentic-fatigue-verification-gap-codex-cli-sustainable-ai-assisted-development/)（Sonar 原報告未取得）
- 【顧問研究，二手】BCG「AI brain fry」：源於 "the excessive use or supervision of AI tools, pushed beyond our cognitive limits"，且 "primarily a bane for software developers"；但 BCG 同時發現 AI 接手重複性工作時倦怠率下降——效應繫於**監督負荷**而非 AI 使用本身。— [Malay Mail 2026-03-30](https://www.malaymail.com/news/tech-gadgets/2026/03/30/ai-brain-fry-is-real-power-users-say-the-bots-are-burning-them-out/214390)
- 【媒體】LeadDev 引研究稱非工時 commit 與週末產出顯著上升，導致認知過載與身體疲勞。— [LeadDev](https://leaddev.com/?p=32457)
- 【廠商一手】Anthropic 內部研究："The more excited I am to do the task, the more likely I am to not use Claude."；受訪者擔心技能鈍化："I am for sure atrophying in my skills as a software engineer"；"When producing output is so easy and fast, it gets harder and harder to actually take the time to learn something."— [Anthropic Research](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
- 【廠商一手】Anthropic 2026-07 的回應是把「審查」本身自動化並分層：多個窄範圍審查 agent、必須證明發現屬實、程式碼依風險分級、部分程式碼永遠需人核准、對自動核准做風險加權抽樣、新審查器先跑 shadow mode、對審查器紅隊。— [Claude Blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
- 【媒體】LeadDev 2026-05：工程經理成為「elite ICs」，因其委派、設定脈絡、拆解任務的技能正好對應監督 AI agent。— [LeadDev](https://leaddev.com/career-development/demand-for-engineering-managers-is-surging-in-the-agentic-coding-era)
- 【媒體】The New Stack《Is AI Creating a New Code Review Bottleneck for Senior Engineers?》— [The New Stack](https://thenewstack.io/is-ai-creating-a-new-code-review-bottleneck-for-senior-engineers/)（僅標題與搜尋摘要）

### Inferences
- 瓶頸遷移鏈條在多個獨立資料源重複：**產出↑ → PR 更大更多 → 審查時間↑且審查變淺（無審查合併↑）→ 缺陷/事故↑**。Faros 2026 的「無審查合併 +31.3%」與 Sonar「96% 不信任但 48% 才總是驗證」指向同一件事：審查供給跟不上時，團隊會偷偷降低審查標準而非減少產出。對單一服務的 harness 來說，**「審查供給」是要被顯式設計與預算化的資源**。
- 「開發者變審查者/編排者」有一手證據（Anthropic 內部 70%+ 自述；Karpathy 自稱 bottleneck，見 Q6），不只是論述；伴隨的是技能退化與疲勞風險，Anthropic 自己命名為「paradox of supervision」。
- METR 的教訓是方法論上的：2026 年已無法用「不准用 AI」做對照組。這表示**組織內 A/B 比較生產力已不可行**，比較基準只能是歷史趨勢與品質/事故指標。
- 可行的重組方向（由 Anthropic SDLC 與 DORA 評論推得）：不把人類審查時間花在「讀所有 diff」，而是花在 (a) 設定意圖與驗收標準、(b) 審查審查器、(c) 風險加權抽樣、(d) 關鍵路徑程式碼。

### Gaps
- Faros 2026、Sonar 2026、BCG 原始報告皆未能直接閱讀；數字為二手。
- 沒有找到針對「審查 agent 產出的認知負荷」的受控研究（僅問卷與論述）。
- 沒有找到任何公司公開其「審查 SLA／審查人力配置」如何因 agent 而改變的具體數字。

## Q3. 彙報與可讀性：每日工作彙報該含什麼？harness 實際怎麼向人總結？stand-up 的類比是什麼？

### Takeaway
一手來源對「agent 向人彙報」的共識是一個原則：**「judge what the agent did, not what the agent said」**——報告以證據（測試輸出、執行的命令與回傳、截圖、PR 連結、逐條 PASS/FAIL）取代斷言，並明確列出「未完成／被 stub 的部分」。實際被採用的彙報面不是「日報文件」，而是：PR 本身＋CI check run、Slack thread 內的進度更新與完成摘要、一行式狀態摘要的 agent dashboard（需要你的排最前）、以及 git log＋progress 檔作為跨 session 交接。沒有找到任何「報告疲勞／報告劇場」的實證研究；最接近的是 Routines 文件的警告「綠色狀態≠任務成功」。

### Cited Findings

**原則層（一手）**
- Claude Code 最佳實務："Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result. Reviewing evidence is faster than re-running the verification yourself, and it works for sessions you weren't watching."；"Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop"；"If you can't verify it, don't ship it."— [Claude Code Docs: Best practices](https://code.claude.com/docs/en/best-practices)
- 同文的驗證階梯：單 prompt 內自驗 → `/goal` 由獨立評估器每回合重檢 → Stop hook 作為確定性閘門 → 驗證 subagent／對抗式審查（"so the agent doing the work isn't the one grading it"）。並警告對抗式審查器 "will usually report some [gaps], even when the work is sound"，要限定只報影響正確性的問題。— 同上
- auto mode 設計原則："judge what the agent did, not what the agent said."；"everything the agent chooses on its own is unauthorized until the user says otherwise."；分類器刻意**不看** assistant 的敘述文字與工具輸出，只看使用者訊息與工具呼叫，以防被說服或注入。— [Anthropic Engineering: auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- 長時 harness（2025-11-26，Justin Young）：agent 必須留下 (1) `claude-progress.txt` 工作日誌、(2) 端到端 feature list JSON（只允許改 `passes` 欄位；"It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."）、(3) 描述性 git commit、(4) `init.sh`。觀察到的失敗：下一 session 得猜上一 session 做了什麼；看到既有進度就「declaring victory early」；靠單元測試或 curl 就標記完成而漏掉 e2e 失敗。— [Anthropic Engineering](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- 2026-03-24 harness（Prithvi Rajasekaran）：generator 與 evaluator 事先協商「sprint contract」定義 done 與測法；evaluator 以 Playwright 逐條 PASS/FAIL 並附具體檔案/行號；QA 每輪列出剩餘缺口（如「stubbed audio recording」）。失敗模式：agent「confidently praising」自己平庸的工作；evaluator「talk[ed] itself into」核准自己標記過的問題；"Out of the box, Claude is a poor QA agent."；人類仍要讀 evaluator 日誌並多輪修 prompt 才合理。原則："Separating the agent doing the work from the agent judging it proves to be a strong lever to address this issue."— [Anthropic Engineering](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Code Review 的報告形態設計（可直接移植到日報）：發現項帶嚴重度（🔴 Important／🟡 Nit／🟣 Pre-existing）、每項附可展開的「Why this was flagged」說明如何驗證、check run 內含「File:Line／Issue」彙總表、機器可讀的嚴重度計數供 CI 解析；`REVIEW.md` 可要求 "behavior claims need a `file:line` citation in the source, not an inference from naming"、"report at most five nits, mention the rest as a count in the summary"、"open with a one-line tally such as `2 factual, 4 style`"——"The author wants to know the shape of the work before the details."— [Claude Code Docs: Code Review](https://code.claude.com/docs/en/code-review)
- Anthropic SDLC：自動審查器 "must prove their findings are valid"；每個 agent 動作都進 SIEM。— [Claude Blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
- 4/23 postmortem 的反面教訓：內部 evals 與 dogfooding 都沒看到問題，靠使用者 `/feedback` 與公開可重現案例才定位——**彙報系統要保留原始可重現證據，而非只保留摘要**。— [Anthropic Engineering](https://www.anthropic.com/engineering/april-23-postmortem)

**實際被採用的彙報面（一手文件）**
- Slack："Claude posts status updates to your Slack thread as work progresses" → 完成時 "@mentions you with a summary and action buttons"（View Session／Create PR）；"In Slack: You'll see status updates, completion summaries, and action buttons. The full transcript is preserved and always accessible."；建議請求要 "Define success: Explain what 'done' looks like."。— [Claude Code Docs: Slack](https://code.claude.com/docs/en/slack)
- GitHub Actions：互動模式 "Progress and results appear as a comment on the triggering issue or PR"；自動化模式預設只寫 workflow log；文件附「Daily Report」範例：cron 09:00 UTC "Generate a summary of yesterday's commits and open issues"。安全上拒絕 bot actor 觸發以防 agent 互相觸發迴圈。— [Claude Code Docs: GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Agent view（`claude agents`）：一行式摘要由 Haiku 級模型產生（"so the row can tell you what the session is doing, what it needs, or what it produced without opening the transcript"）；狀態分組「Ready for review」「Needs input」置頂；PR 編號標籤以顏色表示 CI／合併狀態；"Most of the time the peek panel is enough and you don't need to open the full transcript."；排程的 `/loop` 只在需要輸入時通知。— [Claude Code Docs: Agent view](https://code.claude.com/docs/en/agent-view)
- Projects：coordinator 會話 "sees what threads report back, not every step they take"；"when you come back an hour later or the next morning, the Overview pane shows which threads finished, which pull requests are ready for review, and which thread is waiting for your answer"；可直接問 "Give me a status update on every thread"；project instructions 範例要求 "Before you call work done, run `make test` and `make lint` and paste the summary lines in your final message." 與 "Don't merge, force-push, or change CI configuration without asking me in the thread."— [Claude Code Docs: Projects](https://code.claude.com/docs/en/claude-projects)
- Routines：排程／API／GitHub 事件觸發的無人值守執行；範例含 "posts a summary to Slack so the team starts the day with a groomed queue"、"posts a go or no-go to the release channel"；**關鍵警告**："A green status in the run list means the session started and exited without an infrastructure error. It does not mean the task in your prompt succeeded. Open the run to read the transcript and confirm what Claude actually did."— [Claude Code Docs: Routines](https://code.claude.com/docs/en/routines)
- Cloud auto-fix：對模糊審查意見 "Claude asks you before acting"；代使用者回覆 GitHub 時 "each reply is labeled as coming from Claude Code so reviewers know it was written by the agent and not by you directly"。— [Claude Code Docs: Cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- Managed Agents：session 為 append-only 事件日誌、存在 harness 之外，crash 後可從最後事件續跑；作者警告不可逆的壓縮／修剪會丟掉未來需要的脈絡。**文章未涵蓋人類監控或面向人的摘要。**— [Anthropic Engineering](https://www.anthropic.com/engineering/managed-agents)
- C compiler 實驗中「為 agent 設計的輸出」：測試輸出壓到幾行、細節寫檔、錯誤同行標 `ERROR` 供 grep、預先計算摘要統計——"I had to constantly remind myself that I was writing this test harness for Claude and not for myself."— [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)

**學術／第三方**
- arXiv 2602.19441：審查者參與度是合併最強預測因子；大變更與 force push 降低合併機率（即「可審查性」本身影響結果）。— [arXiv](https://arxiv.org/abs/2602.19441)
- Ghostty（Mitchell Hashimoto）AI 政策：貢獻者須揭露 AI 協助、須完全理解所提交的程式碼、AI 生成的 issue／討論內容須經人類審查；另有 AGENTS.md 技巧讓 agent 自我揭露。— [feedbagel 轉述](https://feedbagel.com/post/ghostty-projects-ai-usage-policy-transparency-and-human-oversight-requirements)、[aiengineerguide](https://aiengineerguide.com/til/mitchell-hashimoto-agents-md-ai-disclosure/)（二手）
- FOSDEM 2026「3 Cs」：Comprehension、Context、Continuity 作為維護者面對 AI PR 的要求框架。— [letsdatascience 轉述](https://letsdatascience.com/news/maintainers-adopt-3-cs-to-protect-mentorship-393f743e)

### Inferences
- 綜合一手來源，一份「可被信任而不必重讀全部」的每日工作彙報應含（原則→欄位）：
  1. **先給形狀再給細節**：一行 tally（合併 N／待審 N／卡住 N／失敗 N），需要人的排最前（agent view、Projects Overview、REVIEW.md 的 one-line tally）。
  2. **每項完成宣稱附證據而非斷言**：測試命令與輸出摘要行、CI check 連結、截圖；行為性宣稱要有 `file:line`（Code Review 的 verification bar）。
  3. **明列未完成／被 stub／被跳過的部分**（長時 harness 的 feature list、QA 每輪缺口清單）；這是對「declaring victory early」的直接解藥。
  4. **做了哪些自主決策與為何**，以及**哪些動作被阻擋或降級**（auto mode 的拒絕會回到 agent；SIEM 記錄每個動作）。
  5. **開放問題／需要人的決策**單獨成區（「Needs input」是所有 dashboard 的第一分組）。
  6. **成本與用量**（token／$、session 數；見 Q5）。
  7. **指向原始證據的連結**（session transcript、PR、check run），因為 4/23 postmortem 顯示摘要層會漏掉行為性問題。
- 「報告劇場」的解法在一手來源裡不是「寫更好的報告」，而是**把報告的可信度綁在機器可驗證的工件上**（PR＋CI＋evaluator PASS/FAIL），讓人只在抽樣與異常時下鑽。Routines 的「綠色≠成功」警告說明：如果日報只彙總狀態碼，它一定會變成劇場。
- stand-up 的類比在實務上被兩種東西取代：(a) **PR／MR 本身加上 CI check run**（非同步、可稽核）；(b) **Slack thread 的進度更新＋完成摘要**（同步可見性）。「每日文件」型報告只在無人值守的排程任務（backlog grooming、deploy go/no-go）中出現，且總是**附帶動作**（開了哪些 PR、哪些要你回答）。

### Gaps
- 沒有找到任何研究量化「解釋／trace 是否改善人類監督」或「報告疲勞」；此部分只有產品設計與實務者原則。
- OpenAI 的 docs/ 目錄、telemetry 作為可讀性機制的細節無法核對原文。
- Devin、Jules、Codex cloud 的 session 摘要格式未能取得一手文件（網域被阻擋）。
- 搜尋配額耗盡前未能查「PR description as the report」模板討論與 arXiv「LLM agent oversight reports」主題。

## Q4. 角色與節奏：誰做什麼？「manager of agents」、harness 維護者、知識庫／CLAUDE.md 的所有權

### Takeaway
一手來源描繪的團隊級角色是：人類**設定意圖與驗收標準、擁有最終核准、審查「審查器」、維護 harness 與常駐脈絡**；agent 寫碼、自驗、互審。「harness 維護者」沒有正式名稱，但其工作被反覆描述（CLAUDE.md 修剪、REVIEW.md、evaluator prompt 多輪校準、hooks），Anthropic 文件明言「Treat CLAUDE.md like code」。市場上 2026 出現「Agent Engineering Manager（無直屬部屬）」「AgentOps Engineer」等職稱，但多為職缺與媒體命名，缺乏成效證據。

### Cited Findings
- 【廠商一手】Anthropic SDLC 人類保留職責："Directing work, setting intent, and owning final approval"、審查受監管／關鍵程式碼、審查自動核准的風險加權抽樣、調查被標記 agent 行為、"Designing agent identities, permissions, and boundaries"；原則 "Give every agent a single-purpose identity with the minimum permissions for its job."；安全工程師 "from monitoring bugs to monitoring loops"。— [Claude Blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
- 【廠商一手】CLAUDE.md 所有權與衛生："Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts."；"Bloated CLAUDE.md files cause Claude to ignore your actual instructions!"；每行自問 "Would removing this cause Claude to make mistakes?"；"Check CLAUDE.md into git so your team can contribute. The file compounds in value over time."；只放廣泛適用的內容，偶爾才用的知識改用 skills 按需載入；"Aim to keep CLAUDE.md under 200 lines by including only essentials."— [Claude Code Docs: Best practices](https://code.claude.com/docs/en/best-practices)、[Costs](https://code.claude.com/docs/en/costs)
- 【廠商一手】Code Review 的 `REVIEW.md`："Length has a cost: a long `REVIEW.md` dilutes the rules that matter most."；CLAUDE.md 違規預設只算 nit，且反向檢查 "if your PR changes code in a way that makes a `CLAUDE.md` statement outdated, Claude flags that the docs need updating too"。— [Claude Code Docs: Code Review](https://code.claude.com/docs/en/code-review)
- 【廠商一手】Projects 的脈絡分層：project instructions（每個 thread 的 brief，≤16,000 字元，含「What needs your go-ahead first」）、project memory（`MEMORY.md` 索引，Claude 自己寫的需求／決策／陷阱）、repo 內 CLAUDE.md（單一 repo 的建置規則）；"when you correct a thread, also tell Claude to remember the correction"。— [Claude Code Docs: Projects](https://code.claude.com/docs/en/claude-projects)
- 【廠商一手】harness 維護是持續的人工工作：evaluator prompt 需「Several rounds」才合理；"the space of interesting harness combinations doesn't shrink as models improve"；但也警告 harness 假設是暫時的（Sonnet 4.5 需要的 context reset 對 Opus 4.5 不必要）。— [Anthropic Engineering 2026-03](https://www.anthropic.com/engineering/harness-design-long-running-apps)、[Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- 【廠商一手】C compiler：作者的主要工作量在環境與測試，不在迴圈本身；agent 角色分工（去重、效能、文件、以 Rust 開發者視角批評設計）由人指定。— [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- 【廠商一手】Writer／Reviewer 雙 session 模式："A fresh context improves code review since Claude won't be biased toward code it just wrote."— [Claude Code Docs: Best practices](https://code.claude.com/docs/en/best-practices)
- 【廠商一手】規格撰寫者的新工作：讓 Claude 以 AskUserQuestion 訪談你後寫 SPEC.md；"The most useful specs are self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works. Time spent making the spec precise pays off more than time spent watching the implementation."— 同上
- 【廠商一手】Rakuten：非工程師在「appropriate context and coding guidelines」下也能貢獻；工程師 "delegate several tasks to Claude Code while focusing on one themselves"。— [claude.com/customers/rakuten](https://claude.com/customers/rakuten)
- 【媒體／職缺】Tolan「Agent Engineering Manager」：無直屬部屬，工作是 "breaking down ambiguous problems, delegating to agents, reviewing their work critically, and course-correcting"。— [startup.jobs](https://startup.jobs/agent-engineering-manager-tolan-8322645)
- 【媒體】2026 三個職稱趨同：AI Agent Oversight Engineer／AI Agent Manager／AgentOps Engineer，核心為 "monitoring and governing fleets of agents"；稱 HBR 2026-02 定義了 AI Agent Manager（單一二手來源）。— [algeriatech](https://algeriatech.news/?p=21972)
- 【媒體】LeadDev 2026-05：EM 技能（委派、設脈絡、拆任務）直接對應監督 agent。— [LeadDev](https://leaddev.com/career-development/demand-for-engineering-managers-is-surging-in-the-agentic-coding-era)
- 【實務者】Steve Yegge Gas Town（2026-01-01 發布）的角色命名：Mayor、Polecats、Refinery、Witness；Beads 為 git 支援的 issue 追蹤層，"records work as structured issues, while Git-backed hooks preserve state across agent restarts"；2026-04-03 Gas Town／Beads 1.0；2026-04-24 改寫為 Gas City SDK。— [heise](https://www.heise.de/en/background/Full-Control-Gas-Town-Orchestrates-Ten-or-More-Coding-Agents-11178824.html)、[ascii.co.uk](https://ascii.co.uk/news/article/news-20260125-f25263de/steve-yegges-gas-town-reveals-agent-orchestration-design-pat)
- 【媒體二手】The New Stack 2026：Coinbase、Shopify、Ramp 都自建 coding agent harness 卻仍付費給 Anthropic 用模型——顯示「harness 是自有資產、模型是供應商」的分工。— [The New Stack](https://thenewstack.io/enterprise-ai-agent-harness/)、[rywalker 建 vs 買](https://rywalker.com/research/in-house-coding-agents)（原文被阻擋）

### Inferences
- 證據支持「**harness／脈絡維護是持續的、需要工程判斷的工作**」：CLAUDE.md 要像程式碼一樣被 review/prune/test、evaluator 要多輪校準、REVIEW.md 有長度成本、模型換代就要重審 harness 假設。沒有證據顯示它必須是專職角色，但有證據顯示它不能沒人做（Anthropic 4/23 事故本質上就是 harness 層的三個變更沒被妥善評估）。
- 「manager of agents」在一手來源中的實質內容與傳統 EM 高度重疊：拆任務、寫 brief、定「done」、審結果、把修正寫回常駐脈絡。差別是**審查對象從人變成 agent 與審查器**，節奏從每日同步變成「回來時看 Overview」。
- 對單一服務團隊最可信的角色切分（由上述推得）：
  - **產品／領域負責人**：寫可執行規格（含 out-of-scope 與 e2e 驗證步驟）、定義「什麼需要我先同意」。
  - **harness 維護者（可兼任）**：CLAUDE.md／REVIEW.md／hooks／evaluator prompt、成本與用量看板、審查器的 shadow mode 與抽樣稽核。
  - **審查者**：不讀全部 diff，而是審「關鍵路徑＋風險抽樣＋審查器漏報」，並把每次修正寫回 memory。
  - **agent**：寫碼、自驗、互審、留下證據與未完成清單。

### Gaps
- 沒有任何研究或案例量化「有專職 harness 維護者 vs 沒有」的差異。
- 「AI Agent Manager」等職稱的 HBR 定義未能核對一手。
- Yegge 的角色設計沒有成效數據；關於他 2026-08 放棄 Gas Town 工作流改做私人 harness「Wheelhouse」的說法僅見單一搜尋摘要，第二次搜尋未能證實，標為【查無實證】。

## Q5. 經濟學：token／計算成本 vs 人類審查成本；ROI 哪裡真、哪裡負

### Takeaway
有一手數字的成本點：Claude Code 企業平均**每位開發者每活躍日約 $13、每月 $150–250，90% 使用者低於每日 $30**；自動 Code Review **每次 $15–25**；完整 agent harness 單次應用產出 $9（失敗）到 $200（成功，>20 倍）、DAW 專案 $124.70；C compiler ~$20k／10 萬行。ROI 證據的分界清楚：**定義清楚、可驗證、可分割的任務**（遷移、修補、小 ticket）有正向敘事與較高合併率；**模糊、需判斷的任務**在 METR（−19%）、Answer.AI（3/20）、Devin 自述中為負或低。真正的隱性成本是審查與事故（Faros 2026），不是 token。

### Cited Findings
- 【廠商一手】Claude Code 成本："Across enterprise deployments, the average cost is around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users."；背景功能每 session 通常 <$0.04；Agent teams 在 plan mode 約 7× token；"Budget more for a coding seat than a chat seat"。— [Claude Code Docs: Costs](https://code.claude.com/docs/en/costs)
- 【廠商一手】自動 Code Review："Each review averages $15-25 in cost, scaling with PR size, codebase complexity, and how many issues require verification."；平均 20 分鐘完成；「After every push」模式成本乘以 push 次數；admin 可設月上限、看每 repo 平均每次審查成本。— [Claude Code Docs: Code Review](https://code.claude.com/docs/en/code-review)
- 【廠商一手】harness 成本對照：retro game maker（Opus 4.5）solo run 20 分鐘 $9 但核心功能不可用；完整 planner/generator/evaluator harness 6 小時 $200（>20×）；DAW（Opus 4.6、v2 harness）3 小時 50 分 $124.70（planner $0.46；三輪 build $71.08／$36.89／$5.88；三輪 QA $3.24／$3.09／$4.06）。作者判斷 evaluator 只在「tasks beyond what the model does reliably alone」才值得其成本。— [Anthropic Engineering 2026-03](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- 【廠商一手】C compiler：<$20,000 API、20 億輸入／1.4 億輸出 token、約 2,000 session、10 萬行。— [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- 【廠商一手】Anthropic 內部：每人每日合併 PR +67%；27% 工作是「否則不會做」；44% 是「自己不想做」的工作。— [Anthropic Research](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
- 【廠商一手／外部引用】Anthropic SDLC 引 Intercom 自動核准 19% 的 PR、部署量翻倍、破壞性變更停機 −35%；CircleCI 的 Chunk agent 讓 agent 任務成為完成 PR 的比率翻倍（皆為外部公司聲明）。— [Claude Blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
- 【二手】Devin 定價 2026：自助方案改為 token 配額（Pro $20／月、Max $200／月、Teams $80／月基礎 + $40／完整席位），Enterprise 以 ACU 計；舊資料 ACU $2.25（約 15 分鐘自主工作）。**未找到任何公開的「每個合併 PR 成本」數字。**— [eesel](https://www.eesel.ai/blog/devin-fusion-pricing)、[pensero](https://pensero.ai/blog/devin-pricing)
- 【二手】Devin 合併率：Cognition 自報 67%（2025-11）vs 公開 GitHub 觀測 61.3%（2026-04～06）。— [Cognition](https://cognition.ai/blog/devin-annual-performance-review-2025)、[amplifying.ai](https://amplifying.ai/coding-agents/devin)
- 【負面實證】METR 2025 RCT −19%（見 Q2）；Answer.AI 3/20（見 Q1）；Faros 2026 每 PR 事故 +242.7%、無審查合併 +31.3%（見 Q2）；Stack Overflow 66% 花更多時間修「幾乎正確」（見 Q2）。
- 【實務者】Addy Osmani「70% 問題」：AI 快速完成 70%，"The remaining 30% is where experienced engineers earn their keep"——邊界案例、race condition、無障礙、隱藏安全缺陷、系統整合；生產力增益 "often context-dependent, particularly in greenfield projects lacking technical debt"；引 DORA 稱對 AI coding 的正面看法兩年內由 70% 降至 60%。— [addyosmani.com](https://addyosmani.com/agentic-engineering/the-70-percent-problem/)、[Zed 2025-11 演講整理](https://zed.dev/blog/ai-70-problem-addy-osmani)（原頁被阻擋，據搜尋摘要）
- 【廠商一手】auto mode 的「審查成本」數字：分類器漏掉 17% 真實越權動作、第一階段誤擋 8.5% 良性動作（第二階段降至 0.4%）、漏掉 5.7% 合成外洩嘗試；3 次連續或 20 次累計拒絕才叫人。— [Anthropic Engineering: auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)

### Inferences
- 以一手數字粗算（本研究推算，非來源）：一位開發者每日 ~$13 的 agent 成本 + 每個 PR $15–25 的自動審查，遠低於一小時資深工程師的人力成本；**token 不是瓶頸資源，人類審查注意力才是**。這與 Faros／DORA 的「瓶頸在下游」一致。
- ROI 的分水嶺不是任務大小而是**可驗證性與模糊度**：Devin 67% 的定義是「清楚定義的任務」、Anthropic 工程師的委派判準是「驗證成本相對創造成本小」、Carlini 的教訓是 verifier 要近乎完美。因此對單一服務團隊，**投資回報最高的是把更多任務變成「可驗證」**（測試、fixture、e2e 腳本、sprint contract），而不是買更強的模型。
- harness 的「20 倍成本」（$9→$200）買的是「核心功能真的能用」；對照 Faros 的事故率，**便宜但沒驗證的產出在下游更貴**。成本預算應以「每個合併且 N 天內無回滾的 MR」為單位，而非 token。
- 負向 ROI 的共同情境：資深開發者在熟悉的大型既有 codebase 上做需判斷的任務（METR）、模糊／探索型任務交給非同步自主 agent（Answer.AI、Devin 模糊任務）、以及審查供給不足時的隱性品質債（Faros 2026）。

### Gaps
- 沒有任何來源給出「每個合併 MR 的總成本（token＋人類審查時間）」的實測；Devin 每 PR 成本不可得。
- OpenAI 內部產品、Coinbase／Shopify／Ramp 的 harness 成本與人力配置皆無公開數字。
- Codex 使用量報告未能取得（openai.com 被阻擋）。
- METR 2026 無可靠數字；沒有 2026 年的 RCT 可引用。

## Q6. 心態轉變：最可信的實務者說開發者的工作與注意力該怎麼改？共識與分歧

### Takeaway
跨實務者的共識是三條原則：(1) **自主性是可調的滑桿，不是開關**（Karpathy 的 autonomy slider／「keep AI on the leash」；Böckeler 的「錯誤機率高、影響高、可偵測性低→不用無監督執行」）；(2) **人類的新工作是驗證迴圈的設計者**——把生成→驗證迴圈做快（Karpathy 的 GUI）、給 agent 可自跑的檢查（Anthropic）、把資深工程實務（測試、規格、文件、審查）主動放大（Willison「vibe engineering」）；(3) **責任不可委派**——「never commit code you couldn't explain」（Willison）、Ghostty 的揭露與理解要求、Anthropic 的「human accountability is still central」。主要分歧在**審查的尺度**：Carlini／Willison／Hashimoto 主張人類仍要看懂每個變更；OpenAI harness 路線（二手）與 Anthropic SDLC 則接受「審查審查器＋風險抽樣」取代逐行人審。Yegge 代表激進多 agent 一端，但缺成效證據。

### Cited Findings
- 【實務者演講，二手轉述】Karpathy 2025-06 YC AI Startup School《Software Is Changing (Again)》：主張「partial autonomy」應用、「autonomy slider」、"less 'Iron Man robots' and more 'Iron Man suits' you want to build"、以自訂 GUI 加速生成–驗證迴圈。Business Insider 轉述其對開發者的建議 "keep AI on the leash"，自述 "goes in small incremental chunks" 並稱自己是 "the bottleneck" 因為要確認程式碼沒引入 bug。另有轉述他在 nanochat 多用 autocomplete 而非 agent，因 agent 會把常規模式強加到刻意非常規的程式碼。— [Latent Space 文字稿頁](https://www.latent.space/p/s3)、[AOL／BI](https://www.aol.com/keep-ai-leash-because-far-035005777.html)、[ikyle.me 筆記](https://ikyle.me/blog/2025/andrej-karpathy-software-is-changing-again)（原始文字稿被阻擋；引文為二手）
- 【實務者一手】Simon Willison 2025-10-07《Vibe engineering》：資深工程師在 agent 寫碼時要承擔更廣的職責——架構、規格、QA 規劃、"spending so much time on code review"；"almost all of these are characteristics of senior software engineers already, and AI tools amplify existing expertise"。二手歸納其界線為 "you review everything, test everything, and never commit code you couldn't explain to someone else"。2026-02 推出《Agentic Engineering Patterns》；並表示 vibe coding 與 agentic engineering "are getting closer than I'd like"。— [simonwillison.net](https://simonwillison.net/2025/Oct/7/vibe-engineering/)、[dsebastien 筆記](https://notes.dsebastien.net/30+Areas/33+Permanent+notes/33.02+Content/Vibe+Engineering)、[themodelwire](https://www.themodelwire.com/article/vibe-coding-and-agentic-engineering-are-getting-closer-than-id-like-01KQYVC5AMCJ1BREGNPT069VVR)（原頁被阻擋）
- 【實務者一手】Addy Osmani：AI 完成 70%，剩下 30% 是資深工程師的價值所在；「knowledge paradox」（資深者受益更多）；模式包括 AI 作初稿、持續對話、trust but verify。— [addyosmani.com](https://addyosmani.com/agentic-engineering/the-70-percent-problem/)（原頁被阻擋，據搜尋摘要）
- 【實務者一手，二手轉述】Mitchell Hashimoto（Ghostty）：要求貢獻者揭露 AI 協助、完全理解提交的程式碼、AI 生成的 issue／討論須人類審查；AGENTS.md 中加入讓 agent 不得自行開 issue／PR、若被要求則在 diff 加自嘲註記的提示。— [feedbagel](https://feedbagel.com/post/ghostty-projects-ai-usage-policy-transparency-and-human-oversight-requirements)、[aiengineerguide](https://aiengineerguide.com/til/mitchell-hashimoto-agents-md-ai-disclosure/)（mitchellh.com 被阻擋）
- 【實務者一手】Thorsten Ball（Sourcegraph Amp）2025-04-15《How to Build an Agent》："it's an LLM, a loop, and enough tokens"，<400 行可做；2025-07 形容 agent 是 "a little robot that you can send on its tracks and that does something for you"；2026 演講稱他不用 MCP、框架或自訂 slash command。— [ampcode.com](https://ampcode.com/how-to-build-an-agent)、[zeli 轉述](https://zeli.app/de/story/49622411)
- 【實務者一手，二手轉述】Birgitta Böckeler（Thoughtworks）：架構約束與「harness engineering」是自主生成的安全網；第三方整理其判準 "when probability of error is high, impact is high, or detectability is low, the guidance is to not use unsupervised execution; reduce scope and require human review"（需對照原文）。— [InfoQ](https://infoq.com/presentations/ai-coding-agents)、[LinearB podcast](https://linearb.io/dev-interrupted/podcast/making-sense-of-agentic-AI)、[skillsmp 整理](https://skillsmp.com/creators/cuipengfei/prompts/skills-exploring-generative-ai)（martinfowler.com 被阻擋）
- 【廠商研究者一手】Carlini："When a human sits with Claude during development, they can ensure consistent quality and catch errors in real time."；對「programmers deploying code they have not verified」表達憂慮。— [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- 【廠商一手】auto mode："It is not a drop-in replacement for careful human review on high-stakes infrastructure."；永遠預設封鎖的動作類別：破壞／外洩資料、降低安全姿態、跨越信任邊界、**繞過審查或影響共用資源（push to main、production deploy）**。— [Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-auto-mode)
- 【廠商一手】最佳實務的工作流心態：「Explore first, then plan, then code」；"If you could describe the diff in one sentence, skip the plan."；「Course-correct early and often」；兩次修正無效就 `/clear` 重寫 prompt；"The trust-then-verify gap... If you can't verify it, don't ship it."— [Claude Code Docs: Best practices](https://code.claude.com/docs/en/best-practices)
- 【廠商一手】Anthropic 內部研究中的 trust progression：從簡單任務開始逐步委派更複雜工作，一位工程師比喻為採用 Google Maps；工程師保留高層設計與「taste」決策，但邊界隨模型進步移動。— [Anthropic Research](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
- 【實務者】Steve Yegge Gas Town：20–30 個並行 agent、「dark factories」願景；批評者 David Gerard 題為「Vibe coding goes crypto scam」；程式碼規模說法互相矛盾（75k／189k 行；17 天／3 週）。— [heise](https://www.heise.de/en/background/Full-Control-Gas-Town-Orchestrates-Ten-or-More-Coding-Agents-11178824.html)、[Wikipedia](https://en.wikipedia.org/wiki/Steve_Yegge)

### Inferences
- 把這些實務者原則翻成「注意力該花在哪」：
  1. **花在定義 done**（規格、驗收、sprint contract、什麼需要先問我）——Karpathy 的 leash 與 Böckeler 的三判準都是在「開工前」決定滑桿位置。
  2. **花在驗證迴圈的速度與可信度**（diff 視圖、evaluator、hooks、證據格式）——這是 Karpathy「Iron Man suit」與 Anthropic「give Claude a way to verify」的共同點。
  3. **花在審查審查器與抽樣**，而非逐行讀 agent 的 diff——這是 Anthropic SDLC 與（二手的）OpenAI 路線；但 Willison／Hashimoto／Carlini 會反對把「理解每個變更」完全外包。對單一服務團隊，合理的折衷是**依風險分級**：關鍵路徑逐行、其餘抽樣。
  4. **花在把修正寫回常駐脈絡**（CLAUDE.md／memory），讓同樣的錯不再重犯——Anthropic 內部研究與 Projects 文件皆強調。
- 分歧的本質是對「可偵測性」的信念：相信測試／評估器能抓住錯誤的人接受更高自主；不相信的人（Carlini 的 uneasy、Anthropic 4/23 事故）堅持人在迴圈。2026 的實證（Anthropic 自家多層審查仍漏掉快取 bug）支持**保守側**：驗證器永遠不完美，所以日報與審查要保留下鑽到原始證據的能力。

### Gaps
- Karpathy、Willison、Osmani、Hashimoto、Böckeler 的原文皆因網域阻擋未能逐字核對；引文為搜尋摘要或二手轉述，需以 URL 回查。
- Armin Ronacher「agentic coding」相關文章完全未能取得（搜尋無結果、網域阻擋）。
- Yegge 的成效與「放棄」傳聞無一手證據。
- 未能查到 Hacker News 對 OpenAI harness 文、Anthropic SDLC 文的完整反對意見。
