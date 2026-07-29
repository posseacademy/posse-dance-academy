---
name: versions
description: new-app/ 配下の全ファイルの現在のキャッシュバスティングバージョン (?v=N) を一覧表示する。ユーザーが「バージョン確認」「versions 出して」「キャッシュバスティング一覧」「今のバージョンは？」と言ったとき、または CLAUDE.md の記載と実ファイルが乖離していないか確認したいときに使用。表形式で出力し、CLAUDE.md との差分も指摘する。
model: claude-sonnet-5
allowed-tools: Bash, Read, Grep
---

# versions — キャッシュバスティング一覧スキル

## 役割

`new-app/app.html` と `new-app/js/app.js` から `?v=N` を全て抽出し、CLAUDE.md の「現在のバージョン」セクションと比較して、差分があれば更新提案を出す。

## 手順

1. **app.html のバージョン取得**
   - `grep '?v=' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`
   - `style.css?v=N`, `app.js?v=N` を抽出

2. **app.js 内 import のバージョン取得**
   - `grep "from '.*?v=" /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/js/app.js`
   - `config.js`, `utils.js`, `firebase-service.js`, `home.js`, `customers.js`, `attendance.js`, `schedule.js`, `csv-export.js` の `?v=N` を抽出

3. **CLAUDE.md の記載と比較**
   - CLAUDE.md「現在のバージョン」セクションを読み込み、項目ごとに照合

4. **表形式で出力**
   - 各ファイル / 現在の v / CLAUDE.md 記載の v / 差分

## 出力フォーマット

```
📋 キャッシュバスティング一覧（YYYY-MM-DD 取得）

| ファイル | 現在 | CLAUDE.md記載 | 差分 |
|---------|------|--------------|------|
| app.html → style.css | v=24 | v=24 | ✅ |
| app.html → app.js | v=109 | v=109 | ✅ |
| app.js → config.js | v=15 | v=15 | ✅ |
| app.js → home.js | v=24 | v=23 | ⚠️ CLAUDE.md 古い |
| ...

[差分がある場合]
推奨: CLAUDE.md の「現在のバージョン」セクションを更新してください。
```

## 注意事項

- バージョンは数値のみ抽出（クォート・末尾空白に注意）
- CLAUDE.md の「現在のバージョン (YYYY-MM-DD)」の日付も古ければ更新を提案
- 差分がない場合は「✅ 全て一致」とだけ報告して短く終わる

## Gotchas（よくある失敗パターン）

- **抽出手法**: `?v=` の抽出には `grep -oE "\?v=[0-9]+"` を使う。
- **CLAUDE.md の表記ゆれ**: CLAUDE.md は人手で書かれているため、`app.js?v=109` と `'app.js?v=109'` のようなフォーマットの揺れがある。文字列マッチではなく **数値部分のみ** で比較する。
- **バージョン乖離を放置する**: CLAUDE.md と実ファイルが乖離していても警告で止まり修正しないケース。差分があれば **必ず CLAUDE.md の更新を提案** すること（自動更新はしない）。
- **app.html ↔ app.js の不整合**: app.html の `app.js?v=109` と app.js 内の自己参照が異なるケース（あり得ないが事故防止のため）も報告する。
