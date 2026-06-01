---
name: deploy
description: new-app/ の変更を本番（GitHub Pages）にデプロイする。ユーザーが「デプロイして」「pushして」「本番に上げて」「リリースして」と言ったとき、または new-app/ 配下のファイル修正後に自動的にバージョン更新→コミット→push を行う。キャッシュバスティングの更新を必ずセットで実施する。
model: claude-opus-4-8
allowed-tools: Read, Edit, Bash, Glob, Grep
---

# deploy — POSSE Dance Academy デプロイスキル

## 役割

`new-app/` 配下の変更を、キャッシュバスティング更新も含めて安全に本番（https://posseacademy.github.io/posse-dance-academy/new-app/app.html ）にデプロイする。

## 手順

1. **変更ファイルの確認**
   - `git status` と `git diff --name-only HEAD -- new-app/` で対象ファイルを把握
   - 修正対象が JS / CSS / HTML のいずれかを確認

2. **キャッシュバスティング更新（必須）**
   - 修正したファイルを `import` している **親ファイル** の `?v=N` を `?v=N+1` に更新
   - `app.js` の import を変更した場合は `app.html` の `app.js?v=N` も更新
   - バージョンは **インクリメントのみ**（飛ばさない）
   - `.claude/rules/cache-busting.md` のルールに従うこと

3. **CLAUDE.md のバージョン一覧を更新**
   - 「現在のバージョン」セクションの該当行を新しい値に書き換え
   - 日付（YYYY-MM-DD）も更新

4. **コミット**
   - `git add new-app/...` で **個別指定**（`git add -A` は使わない）
   - コミットメッセージは 「修正概要」を1行で日本語、必要に応じて説明を続ける

5. **push**
   - `git push origin main`
   - 完了メッセージで「2-5分後に反映、ブラウザで Cmd+Shift+R」と案内

6. **デプロイ後検証**（推奨）
   - 5分待って `verify` スキルで本番反映を確認

## 出力フォーマット

```
✅ デプロイ完了
- 変更ファイル: <list>
- バージョン更新: <file>?v=N → ?v=N+1
- コミット: <hash> "<msg>"
- 反映予定: 2-5分後（ハードリフレッシュ Cmd+Shift+R）
- 次の確認: /verify で本番反映チェック
```

## 注意事項

- 旧二重パス構造（`posse/new-app/` と `new-app/` の二重管理）は **廃止済み**。`new-app/` を直接編集してデプロイする
- `git push --force` は禁止（`.claude/settings.json` の deny に登録済み）
- デプロイ前に `node --check` で構文チェックを推奨（`new-app/js/app.js` 等）
- Firestore データを変更する修正の場合、先に `firestore-backup` スキルでバックアップを取ること

## Gotchas（よくある失敗パターン）

- **キャッシュバスティング更新忘れ**: ファイルだけ修正して `?v=N` を更新せずに push すると、ユーザー画面にいつまでも古い JS が残る。**修正と同じコミットでバージョン更新も含めること**。
- **CLAUDE.md のバージョン一覧の更新漏れ**: ファイル本体は更新したが CLAUDE.md の記載が古いまま → 次回のセッションで Claude が古いバージョンを基準に動く。同じコミットで CLAUDE.md も更新する。
- **app.html ↔ app.js の片側更新**: `app.js` を修正した場合、`app.html` の `app.js?v=N` と、`app.js` 内の他モジュール `import from '...?v=N'` を **両方** 更新する必要がある。片方だけだとブラウザは古い app.js を読み続ける。
- **GitHub Pages 反映遅延**: push 直後に確認しても反映されていないことが多い。最低 2 分は待ってから `verify` する。`verify` スキル使用時は 5 分待ってから。
- **`git add -A` での意図しないステージ**: `node_modules/`, `.DS_Store`, 個人設定等が混入するリスクあり。**`git add new-app/...` で個別指定** を厳守。
