# TRPG Simulator

可獨立運行、未來可嵌入《人生》的資料驅動 TRPG 執行模組。

## 第一階段

- 共用核心不綁定特定 TRPG 規則。
- Ruleset 與原創 Scenario 分離。
- 優先支援 CoC 7e 與 D&D 5.5e（SRD 5.2.1）。
- 角色與存檔保留明確的 Ruleset ID 及版本。

## 目前進度

已開始 CoC 7e 創角核心：

- 通用角色封裝與 Ruleset-specific sheet。
- Characteristics 的 Regular／Hard／Extreme 自動計算。
- HP、MP、SAN、Move、Damage Bonus 與 Build 衍生值。
- 技能 Base／Occupation／Personal 來源紀錄與創角 90 上限。
- Occupation 技能與 Credit Rating 範圍驗證。
- 自由故事與可多筆保存的結構化背景資料。

## 測試

需要 Node.js 20 或更新版本：

```bash
npm test
```
