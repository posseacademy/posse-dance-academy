---
name: verify
description: 本番サイト（GitHub Pages）に最新のキャッシュバスティングバージョンが反映されているか確認する。ユーザーが「反映されてる？」「verify して」「本番確認」「デプロイ完了したか」と言ったとき、または deploy スキル実行後 5 分経過したタイミングで使用。本番とローカルの ?v=N を比較する。
model: claude-sonnet-5
allowed-tools: Bash, Read, Grep
---

# verify — 本番デプロイ反映確認スキル

## 役割

GitHub Pages 上の本番サイトのキャッシュバスティングバージョンを取得し、ローカルの `new-app/app.html` と一致するか比較して、デプロイの反映状態を判定する。

## 手順

1. **本番のバージョン取得**
   - `curl -s "https://posseacademy.github.io/posse-dance-academy/new-app/app.html" | grep '?v='`
   - レスポンスから `app.js?v=N` と `style.css?v=N` を抽出

2. **ローカルのバージョン取得**
   - `grep '?v=' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`

3. **比較・判定**
   - 一致 → ✅ 反映完了
   - 不一致 → ⏳ 反映待ち（push 後 2-5 分かかる）or ⚠️ デプロイ未実行の可能性

4. **app.js 内 import バージョンも確認**（任意）
   - 本番の app.js を fetch して `import from '.*?v='` を grep
   - ローカルの app.js と比較

## 出力フォーマット

```
🔍 デプロイ反映状態
- 本番 app.html: app.js?v=109, style.css?v=24
- ローカル app.html: app.js?v=109, style.css?v=24
- 判定: ✅ 反映完了 / ⏳ 反映待ち / ⚠️ 不一致

[不一致の場合]
- 推奨: あと N 分待ってから再 verify
- または: deploy が未実行 → /deploy で実行してください
```

## 注意事項

- GitHub Pages の反映は **2-5 分** かかる。push 直後に verify しても不一致なのは正常
- ブラウザのハードリフレッシュ（Cmd+Shift+R）も併せて案内する
- 本番URL は `https://posseacademy.github.io/posse-dance-academy/new-app/app.html` で固定
- curl が失敗した場合（ネットワーク不調等）はその旨を明示し、再試行を提案

## Gotchas（よくある失敗パターン）

- **GitHub Pages のキャッシュ層**: CDN レイヤがキャッシュしていることがあり、curl では新版が返ってもブラウザ表示が古いことがある。ユーザーには **必ず Cmd+Shift+R** を案内する。
- **バージョン番号の読み違い**: `app.js?v=109` と `app.js?v=10` を見間違えて「OK」判定する事故。grep 結果は **完全一致** で比較すること。
- **app.html しか見ていない**: app.html のバージョンは合っていても、`app.js` 内の `import from './views/home.js?v=N'` がズレていると home が古いまま。**app.js 内のバージョンも fetch 比較すること**。
- **タイムアウト時の誤判定**: `curl` が timeout しただけなのに「未反映」と断定するケース。明示的にエラーハンドリングし、ネットワーク問題なら再試行する。
- **キャッシュバスティング無し時代のページ**: 万一 `?v=` が含まれない HTML が返ってきたら、デプロイが壊れている可能性が高い。即座にエラー報告する。

## 推奨ループ起動方法

このスキルは継続監視に向いています:
- ローカル: `/loop 5m /verify`（push 後の自動確認）
- サーバー: `routines` 経由でスケジュール化
