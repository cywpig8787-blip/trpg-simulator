# TRPG Simulator 修改指南

這是一個繁體中文、手機與電腦皆可使用的 CoC 7e 創角網頁。

## 修改規則

- 網頁原始檔位於 `ui/web/`；規則核心位於 `src/`。
- `dist/` 是由 `npm run build` 產生的發布成品，不要只修改 `dist/`。
- 修改後依序執行 `npm test`、`npm run build`，並將原始檔與更新後的 `dist/` 一起提交。
- 介面文字使用繁體中文，並保持手機與電腦的響應式版面。
- 不要移除目前的擲骰次數、技能購點、職業限制及草稿儲存功能，除非使用者明確要求。
- 提交到 `main` 後，GitHub Actions 會自動測試並發布 GitHub Pages。

## 常用檔案

- `ui/web/app.js`：創角流程、互動與畫面內容。
- `ui/web/styles.css`：介面與響應式樣式。
- `ui/web/index.html`：頁面骨架。
- `src/index.js`：CoC 7e 數值計算與驗證。
- `test/`：自動測試。
