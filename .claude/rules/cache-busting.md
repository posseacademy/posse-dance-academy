---
paths:
  - "new-app/**/*.js"
  - "new-app/**/*.css"
  - "new-app/app.html"
  - "posse/new-app/**/*.js"
  - "posse/new-app/**/*.css"
  - "posse/new-app/app.html"
---

# キャッシュバスティングルール

JS/CSSファイルを修正した場合、必ず以下を実行すること:

1. 修正したファイルをimportしている**親ファイル**の `?v=N` を `?v=N+1` に更新
2. app.js の import を変更した場合は app.html の `app.js?v=N` も更新
3. バージョン番号はインクリメントのみ（飛ばさない）
4. CLAUDE.md のバージョン一覧は定期的に更新する
