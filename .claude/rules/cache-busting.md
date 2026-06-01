---
paths:
  - "new-app/**/*.js"
  - "new-app/**/*.css"
  - "new-app/app.html"
---

# キャッシュバスティングルール

JS/CSSファイルを修正した場合、必ず以下を実行すること:

1. 修正したファイルをimportしている**親ファイル**の `?v=N` を `?v=N+1` に更新
2. app.js の import を変更した場合は app.html の `app.js?v=N` も更新
3. バージョン番号はインクリメントのみ（飛ばさない）

## Gotchas（よくある失敗パターン）
- **3段階チェーン忘れ**: config.js変更 → app.jsのimport更新 → app.htmlのscript更新。中間を飛ばしやすい
- **CSS更新漏れ**: style.cssを修正してもapp.htmlのstyle.css?vを更新しないと反映されない
- **csv-export.js等の新規ファイル**: app.jsからdynamic importしている場合もバージョン管理対象
