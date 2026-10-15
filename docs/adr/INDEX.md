# ADR 索引

本檔由 `node scripts/adr.js sync` 產生，不得手動編輯。ADR 的用途、建立方式與狀態的意義見[決策紀錄的說明](./README.md)。

下表依編號由新到舊列出全部 ADR：

| ADR | 標題 | 狀態 | 結論 | 影響與備註 |
|---|---|---|---|---|
| [0011](./0011-rename-ade-repo-to-ade-and-ade-to-forge.md) | ADE 指 repository，注入知識的目錄改稱 Forge | `accepted` | ADE 改指團隊維護知識體系的 repository（原 ADE repo，也可寫作 ADE repo）；注入知識的目錄改稱 Forge（原 ADE）；框架的正式名詞改為 Generator（原 生成器） | 契約識別字（.claude/ade/、.ade.json、ADE:BEGIN／END 標記、ade- 前綴）不變；ADR-0001 至 0010 與已推送的 issue 使用舊名詞，以本 ADR 的對照表解讀 |
| [0010](./0010-knowledge-system-state-in-injected-readmes.md) | 知識體系的現況寫在注入的入口檔，理由寫在 ADE repo 的 ADR | `accepted` | 知識體系的現況寫在注入 ADE 的入口檔：根目錄 README.md 導覽分類，各分類 README.md 寫定位、文件類型與範本；體系設計的理由寫在 ADE repo 的 ADR，不注入 | 不另寫一份知識體系設計文件；修正 ade-jeb.1「repo/ 層決定分類與定位」的說法，repo/ 層只保留理由 |
| [0009](./0009-frontmatter-fields-defined-by-reading-mechanism.md) | frontmatter 的欄位由讀取它的機制決定 | `accepted` | 框架只定義生成器的機制必須讀取的 frontmatter 欄位，即必填的 `id` 與 `description`；其他欄位由 ADE repo 依文件類型自行加入 | 分類、標題與 `status` 不由框架定義；會被程式或 skill 讀取的屬性應寫在 frontmatter；資料夾 README.md 開頭的一句話改由 `description` 擔任 |
| [0008](./0008-record-relation-on-dependent-side.md) | 知識之間的關聯由依賴方記錄 | `accepted` | 知識之間的關聯只記一側：由依賴方記錄，指向被依賴方；對等關係由後建立的一側記錄；反向查找以搜尋完成 | 新增知識時只需修改它自己；雙向記錄無法機械判斷，由 skill 與 seed 落實；由程式產生反向索引不在本決策的範圍內，日後可以加上 |
| [0007](./0007-knowledge-records-facts-skill-wraps-execution.md) | 知識記錄事實，skill 引用知識並封裝執行 | `accepted` | 知識記錄事實，skill 引用知識並封裝執行；人不透過 agent 做事時也需要知道的內容放在知識，只有 agent 執行時需要的放在 skill | skill 不得重述知識；腳本屬於 skill，知識庫不放可執行的腳本；取代 docs/research/ade-dev/research-skill-boundaries.md §1.2 的結論 |
| [0006](./0006-markdown-as-primary-file-of-knowledge-unit.md) | 知識單位以 Markdown 檔為主要檔案，其他格式作為附件 | `accepted` | 知識庫不限制檔案格式，每個知識單位以一份 `.md` 為主要檔案，id 只寫在 `.md` 的 frontmatter；其他格式是資料夾單位內的附件 | 附件不帶 id，無法以符號個別引用，需要時以名稱指稱；取代 ADR-0004 中 YAML 檔在頂層寫 id 的規則 |
| [0005](./0005-unify-ade-vocabulary-in-knowledge-root-context.md) | ADE 的詞彙表統一為知識庫根目錄的 CONTEXT.md | `accepted` | ADE 的詞彙表統一為一份，位於知識庫根目錄的 `CONTEXT.md` | seed 的 `repo/CONTEXT.md` 與 `specs/GLOSSARY.md` 收整進 `hub/knowledge/CONTEXT.md`；根目錄的檔案不屬於任何分類，不以符號引用 |
| [0004](./0004-address-knowledge-by-immutable-random-id.md) | 知識庫內的引用以不可變的隨機 id 定址 | `accepted` | 知識檔案建立時在 frontmatter 產生不可變的隨機 id，引用寫成 `[文字敘述](kb:<分類>/<id>)` | id 為 6 位小寫十六進位、在分類內唯一；檔名不再參與定址；不可更改只靠引用檢查保證；取代 ADR-0003 |
| [0003](./0003-reference-knowledge-by-symbol-address.md) | 知識庫內的引用改用符號位址 | superseded by ADR-0004 | 知識庫內的引用改用符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析，不用路徑連結 | 名稱在分類內唯一；改名時同一次變更改完所有引用，封存的文件也機械改寫；尚未實作標記改用符號並移除 emoji |
| [0002](./0002-separate-readme-and-generated-index.md) | 入口檔與索引檔分成 README.md 與程式產生的 INDEX.md | `accepted` | 資料夾的介紹寫在手寫的 README.md，索引寫在由程式產生的 INDEX.md；INDEX.md 不得手寫 | README.md 每個資料夾必備；INDEX.md 選用，用於集合型資料夾；runner 的檢查比對 INDEX.md 與各筆資料 |
| [0001](./0001-no-depth-or-item-limits-in-knowledge-base.md) | 知識庫的層數與每層項目數不設上限 | `accepted` | 知識庫的層數與每層項目數不設上限；檢索效率不足時改善檢索方式，不限制結構 | runner 的檢查不得因層數或項目數報錯；改善檢索方式的觸發訊號是 ADE repo 回報導覽困難 |
