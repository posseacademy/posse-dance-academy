---
description: 本番サイトのデプロイ状態を確認し、最新バージョンが反映されているかチェック
---

## デプロイ状態確認
!`curl -s "https://posseacademy.github.io/posse-dance-academy/new-app/app.html" | grep 'app.js'`

## ローカルバージョン
!`grep 'app.js' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`

本番とローカルのバージョンを比較し、一致していればデプロイ完了。
不一致の場合はGitHub Pagesの反映を待つ（2-5分）。
