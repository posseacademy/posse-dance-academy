---
description: ファイルをデプロイ用パスにコピーし、キャッシュバスティングを更新してGitHub Pagesにデプロイ
---

## 変更ファイルの確認
!`cd /Users/ATSUSHITO_RYCE/CLAUDE && git diff --name-only HEAD -- posse/new-app/`

## デプロイ手順
1. posse/new-app/ から new-app/ にファイルをコピー
2. app.html と app.js のキャッシュバスティングバージョンを確認・更新
3. git add, commit, push

コピー対象は変更されたファイルのみ。キャッシュバスティングは CLAUDE.md の手順に従うこと。
