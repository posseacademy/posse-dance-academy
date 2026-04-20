# POSSE Dance Academy - 管理システム

## 概要
ダンスアカデミーの顧客管理・出席管理・売上管理SPA。GitHub Pages + Firebase Firestore。

- **本番**: https://posseacademy.github.io/posse-dance-academy/new-app/app.html
- **リポジトリ**: https://github.com/posseacademy/posse-dance-academy
- **スタック**: JavaScript (ES Modules), HTML, CSS, Firebase Firestore

## コマンド
```bash
git push origin main        # デプロイ（GitHub Pages、反映まで2-5分）
```

## ディレクトリ構造
```
new-app/
├── app.html              # エントリポイント
├── css/style.css         # メインCSS
└── js/
    ├── app.js            # SPA本体（ルーティング、状態管理）
    ├── config.js         # 設定（料金、タイムスケジュール、デフォルトデータ）
    ├── utils.js          # 売上計算ユーティリティ
    ├── csv-export.js     # CSV書き出し機能
    ├── firebase-service.js # Firestore接続
    └── views/            # 各ページのビューモジュール
        ├── home.js       # HOMEダッシュボード
        ├── attendance.js # 出席名簿
        ├── customers.js  # 顧客一覧
        ├── schedule.js   # タイムスケジュール
        └── revenue.js    # 売上
```

## キャッシュバスティング（必須）
GitHub Pagesはキャッシュが強い。JS/CSSを修正したら必ず `?v=N` を `?v=N+1` に更新すること。

**現在のバージョン (2026-04-20):**
- `app.html`: `style.css?v=23`, `app.js?v=71`
- `app.js`: `config.js?v=10`, `utils.js?v=6`, `firebase-service.js?v=8`
- `app.js`: `home.js?v=12`, `customers.js?v=12`, `attendance.js?v=35`, `schedule.js?v=24`, `revenue.js?v=11`
- `app.js`: `csv-export.js?v=4`

**手順:** ファイル修正 → 親ファイルの `?v=N+1` 更新 → コミット → push

## デプロイ
gitリポジトリのルートは `posse/` ディレクトリ。直接pushでデプロイ可能。

```bash
cd /Users/ATSUSHITO_RYCE/CLAUDE/posse
git add new-app/js/app.js
git commit -m "修正内容"
git push origin main
# 2-5分後にブラウザでハードリフレッシュ（Cmd+Shift+R）
```

## Firestoreアーキテクチャ
- `timeSchedule` コレクション: レッスン時間・場所・講師（曜日ごとにドキュメント、config.jsがフォールバック）
- `schedule` コレクション: 全月共通の生徒名簿（曜日ごとにドキュメント）
- `attendance_YYYYMM`: 月別出席データ（キー形式: `曜日_場所_クラス名_姓名`）
- `calendar_YYYYMM`: 月別カレンダーオーバーライド（休校・休講・WS）
- `customers`: 顧客マスターデータ

## 重要な仕様
- ビジター/初回プランの生徒は `attendance_YYYYMM` に出席データがある月のみ表示（翌月非引き継ぎ）
- 削除時: レギュラーは schedule + attendance 両方削除、ビジター/初回は attendance のみ削除
- `isRegularPlan()`: 1〜4クラス、1.5hクラスがレギュラー扱い

## 過去のバグ（再発防止）
- `defaultSchedule` 上書き: Firestoreデータを上書き → `Promise.allSettled` で解決済み
- `cleanupNonRegularStudents()`: ビジターを破壊的に削除 → 無効化済み、表示フィルターで代替
- schedule は全月共通: ある月で生徒を削除すると全月に影響 → ビジターは attendance のみ削除に変更
