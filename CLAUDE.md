# CLAUDE.md - POSSE Dance Academy プロジェクトガイド

このファイルは Claude Code がプロジェクトを理解するためのガイドです。
リポジトリルートに配置して使用してください。

---

## プロジェクト概要

POSSE Dance Academy の顧客管理・出席管理・売上管理システム。
GitHub Pages でホスティングされた SPA（Single Page Application）。

- **本番URL**: https://posseacademy.github.io/posse-dance-academy/new-app/app.html
- **リポジトリ**: https://github.com/posseacademy/posse-dance-academy
- **Firebase**: https://console.firebase.google.com/project/posse-dance-academy
- **言語**: JavaScript (ES Modules), HTML, CSS
- **DB**: Firebase Firestore
- **ホスティング**: GitHub Pages

---

## ディレクトリ構造

```
new-app/                      ← メインアプリケーション（ここが作業対象）
├── app.html                  ← エントリポイント
├── css/style.css             ← メインCSS
├── js/
│   ├── app.js                ← SPA本体（ルーティング、初期化、状態管理）
│   ├── config.js             ← 設定（料金、デフォルトデータ）
│   ├── utils.js              ← 売上計算ユーティリティ
│   ├── firebase-service.js   ← Firestore接続
│   └── views/                ← 各ページのビューモジュール
│       ├── home.js           ← HOMEダッシュボード
│       ├── attendance.js     ← 出席名簿
│       ├── customers.js      ← 顧客一覧
│       ├── schedule.js       ← スケジュール
│       └── instructors.js    ← 講師プロフィール
└── backups/                  ← データバックアップ
```

---

## キャッシュバスティング（重要）

GitHub Pages はキャッシュが強いため、JSやCSSを更新する際は必ずバージョンを上げること。

**現在のバージョン (2026-03-14):**
- `style.css?v=6` ← app.html から参照
- `app.js?v=19` ← app.html から参照
- `config.js?v=6` ← app.js + 各viewから参照
- `utils.js?v=5` ← app.js + 各viewから参照
- `firebase-service.js?v=5` ← app.js から参照
- `home.js?v=6`, `customers.js?v=9`, `attendance.js?v=21`, `schedule.js?v=5`, `instructors.js?v=5`, `revenue.js?v=6` ← app.js から参照

**更新手順:**
1. 対象ファイルを修正してコミット
2. そのファイルをimportしている**親ファイル**の `?v=N` を `?v=N+1` に更新
3. 親ファイルもコミット
4. GitHub Pages デプロイ完了まで2-5分待つ

---

## 料金体系

config.js の pricing オブジェクトで管理:
- ビジター（会員）: ¥2,000
- ビジター（非会員）: ¥2,300
- ビジター1.5h（会員）: ¥2,200
- ビジター1.5h（非会員）: ¥2,500
- 月謝クラス振替: ¥1,000
- ビジター（振替）: ¥1,000
- 初回体験: ¥1,000
- 初回無料: ¥0
- 練習会: ¥500

---

## 既知の注意事項

1. **config.js の visitorRevenueOverrides は死にコード** — utils.js からインポートされていないが、config.js に残存。削除して問題ない。

2. **config.js の defaultSchedule は巨大** — 93名分のフォールバックデータ。Firestore読み込み失敗時のみ使用。

3. **ビジター（振替）の料金マッピング** — utils.js 内で `ビジター（振替）` → `月謝クラス振替` にマッピングして計算。

4. **出席データのキー形式** — `曜日_場所_クラス名_生徒名` の形式。`_plan` フィールドにプラン種別を格納。

5. **Firestore コレクション** — schedule（名簿）, attendance_YYYYMM（月別出席）, customers（顧客）

---

## 開発ワークフロー

```bash
# ファイル修正後
git add new-app/js/utils.js
git commit -m "fix: ビジター売上計算を修正"
git push origin main

# キャッシュバスティング更新
# app.js 内の import バージョンを更新
git add new-app/js/app.js
git commit -m "chore: utils.js キャッシュバスティング v4"
git push origin main

# 2-5分後にブラウザでハードリフレッシュして確認
```

---

## 過去のバグ（再発防止）

- **defaultSchedule上書き**: config.jsのdefaultScheduleがFirestoreデータを上書きしていた → Promise.allSettled で解決済み
- **visitorRevenueOverrides**: ハードコード値で売上を上書き → utils.jsから参照を完全削除済み
- **ビジター（振替）未設定**: pricingに未登録だった → ¥1,000で追加済み

---

## 詳細ドキュメント

移行ドキュメントは `claude-code-migration/` フォルダに格納:
- `MIGRATION_GUIDE.md` — 全体の移行指示書
- `docs/TECHNICAL_REFERENCE.md` — ファイル別詳細仕様
- `docs/CHANGELOG.md` — 全変更履歴
