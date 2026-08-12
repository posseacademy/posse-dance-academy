---
description: キャッシュバスティングを更新し、GitHub Pagesにデプロイする。「デプロイして」「pushして」と言われたときに使用。
---

## 現在のバージョン確認
!`grep '?v=' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`
!`grep "from '.*?v=" /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/js/app.js`

## 変更ファイルの確認
!`cd /Users/ATSUSHITO_RYCE/CLAUDE/posse && git diff --name-only`

## デプロイ手順
1. 変更したJSファイルの親importの `?v=N` を `?v=N+1` に更新
2. app.jsを変更した場合は app.html の `app.js?v=N` も更新
3. `git add new-app/...` → コミット → `git push origin main`
4. `/verify` でデプロイ反映を確認（旧形式の `/project:verify` は廃止）

## Gotchas（よくある失敗パターン）
- **キャッシュバスティング忘れ**: pushしても変更が反映されない。必ず`?v=N+1`を更新する
- **GitHub Pages反映遅延**: push後2-5分かかる。焦ってコードを疑わないこと
- **旧コピー手順の混入**: `posse/`が独立リポジトリになったため、ファイルコピーは不要。直接push
