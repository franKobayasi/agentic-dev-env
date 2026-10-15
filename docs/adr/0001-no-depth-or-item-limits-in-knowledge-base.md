---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識庫的層數與每層項目數不設上限；檢索效率不足時改善檢索方式，不限制結構"
notes: "runner 的檢查不得因層數或項目數報錯；改善檢索方式的觸發訊號是 ADE repo 回報導覽困難"
---

# 知識庫的層數與每層項目數不設上限

## Context and Problem Statement

知識庫的形式原則規定了何時拆檔、何時分層，但沒有規定層數與每層項目數的上限。知識庫隨 ADE repo 長大後，層數過深或單層項目過多都可能降低檢索效率。問題是：是否要以數字限制知識庫的結構，並由 runner 的檢查強制執行？

## Decision Drivers

* 知識單位的邊界依管理成本決定：會一起修改的內容必須放在同一個單位。
* 生成器沒有任何 ADE repo 長大後的實際數據，現在訂出的數字只能是猜測。
* ADE repo 鎖定 runner 的版本，新版 runner 若把數字限制當成錯誤，已建立的 ADE repo 升級後會突然檢查失敗。
* agent 以搜尋直接定位知識的成本很低，檢索不必完全依賴樹狀結構。

## Considered Options

* 不設上限，檢索效率不足時改善檢索方式
* 設定層數與項目數的上限，由 runner 的檢查強制執行
* 暫不設定，取得實際數據後再訂上限

## Decision Outcome

Chosen option: "不設上限，檢索效率不足時改善檢索方式", because 數量限制與單位邊界的原則互相衝突：為了符合數字，內容必須被拆開或合併，違反「依修改範圍決定邊界」。檢索效率的問題由檢索方式解決，例如搜尋或由程式產生的索引，不需要限制結構。

### Consequences

* Good, because 結構完全由內容決定，單位邊界的原則沒有例外。
* Good, because runner 的檢查不會因 ADE repo 的規模成長而失敗，升級不受影響。
* Bad, because 沒有數字可以機械地判斷結構是否失控，只能依賴效率訊號：ADE repo 透過 `ade-feedback-upstream` 回報導覽困難、seed 的入口檔無法讓讀者一次選出下一步，以及 runner 檢查輸出的統計。

### Confirmation

runner 的檢查不包含任何層數或項目數的規則。

## Pros and Cons of the Options

### 不設上限，檢索效率不足時改善檢索方式

* Good, because 與單位邊界的原則一致。
* Good, because 不需要沒有依據的數字。
* Bad, because 結構失控時，要等到效率訊號出現才會察覺。

### 設定層數與項目數的上限，由 runner 的檢查強制執行

* Good, because 可以機械地檢查，結構不會無限擴張。
* Bad, because 數字沒有依據。
* Bad, because 迫使內容違反單位邊界。
* Bad, because 已建立的 ADE repo 升級 runner 後可能突然檢查失敗。

### 暫不設定，取得實際數據後再訂上限

* Good, because 避免在沒有數據時訂出錯誤的數字。
* Bad, because 預設了「數量上限」是正確的方向，有了數據後仍會與單位邊界的原則衝突。

## More Information

本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.11`，並取代同一張地圖上較早的決策 `ade-jeb.6`。
