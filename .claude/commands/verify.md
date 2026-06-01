---
description: 本番サイトのデプロイ状態を確認し、最新バージョンが反映されているかチェック。「デプロイ確認」「反映された？」と言われたときに使用。
---

## デプロイ状態確認
!`curl -s "https://posseacademy.github.io/posse-dance-academy/new-app/app.html" | grep 'app.js'`

## ローカルバージョン
!`grep 'app.js' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`

本番とローカルのバージョンを比較し、一致していればデプロイ完了。
不一致の場合はGitHub Pagesの反映を待つ（2-5分）。

## Gotchas（よくある失敗パターン）
- **curlキャッシュ**: curlでも古いバージョンが返ることがある。数分待って再実行
- **ブラウザキャッシュ**: バージョンが一致していてもブラウザが古いJSをキャッシュしている場合がある。Cmd+Shift+Rで確認を促す
- **GitHub Pagesビルド失敗**: pushが成功してもPagesビルドが失敗する場合がある。GitHubリポジトリのActionsタブを確認
