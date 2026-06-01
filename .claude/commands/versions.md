---
description: 全ファイルの現在のキャッシュバスティングバージョンを一覧表示。「バージョン確認」「今のバージョンは？」と言われたときに使用。
---

## app.html のバージョン
!`grep '?v=' /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/app.html`

## app.js のimportバージョン
!`grep "from '.*?v=" /Users/ATSUSHITO_RYCE/CLAUDE/posse/new-app/js/app.js`

全バージョンを表形式で整理して表示してください。
CLAUDE.md のバージョン一覧が古い場合は更新を提案してください。

## Gotchas（よくある失敗パターン）
- **CLAUDE.mdとの乖離**: CLAUDE.mdのバージョン一覧は手動更新のため古くなりがち。実際のファイルが正
- **importチェーン見落とし**: config.jsを変更→app.jsのconfig.js?vを更新→app.htmlのapp.js?vも更新、の3段階を忘れやすい
