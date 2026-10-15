# frontmatter 的欄位

本文件規範知識檔案 frontmatter 的欄位：哪些由框架定義，哪些由 ADE 自行加入。需要 frontmatter 的檔案見[符號位址](./addressing.md)，考慮過的其他做法見[frontmatter 欄位的決策紀錄](../../adr/0009-frontmatter-fields-defined-by-reading-mechanism.md)。

## 判準

框架只定義 Generator 的機制，即 runner 的檢查或 Generator 提供的 skill，必須讀取的欄位。每個欄位都是需要維護的內容，沒有讀取者的欄位只增加管理成本。其他欄位由 ADE 依文件類型自行加入。

## 框架定義的欄位

下表列出框架定義的欄位，兩者在需要 id 的檔案中都必須填寫：

| 欄位 | 內容 | 讀取者 |
|---|---|---|
| `id` | 6 位小寫十六進位的隨機值，規則見[符號位址](./addressing.md) | runner：解析符號位址 |
| `description` | 一句話說明這份知識是什麼，寫內容，不寫何時閱讀 | 查找知識的 skill：搜尋命中多份檔案時先讀它篩選；`INDEX.md` 可以從它取值 |

`description` 必須填寫，因為選填時搜尋無法依賴它，agent 仍須逐份讀全文才能判斷。資料夾 `README.md` 說明這一層收錄什麼的一句話就是它的 `description`，內文不重述。

## 不由框架定義的欄位

下表列出常見但不由框架定義的欄位，以及理由：

| 欄位 | 理由 |
|---|---|
| 分類 | 資料夾位置已經表達，寫在 frontmatter 是第二份副本 |
| 標題 | 一級標題已經表達，寫在 frontmatter 是第二份副本 |
| 狀態，例如 `status` | 生命週期由 ADE 定義，框架的機制不讀取它，見[收錄範圍](./scope.md) |

## ADE 自行加入的欄位

ADE 依文件類型自行加入欄位，例如需求文件的日期、提出者與狀態。會被程式或 skill 讀取的屬性應寫在 frontmatter，內文不重述。屬性集中在 frontmatter，程式只需要一種讀取方式，`INDEX.md` 也才能從中取值。

## 落實方式

本文件的原則依下表落實：

| 原則 | 落實的機制 |
|---|---|
| 需要 id 的檔案都有 `id` 與 `description` | runner 的檢查 |
| `description` 的寫法、屬性寫在 frontmatter | skill：建立知識的 skill 依本文件撰寫 frontmatter；seed：初始知識作為範例 |
