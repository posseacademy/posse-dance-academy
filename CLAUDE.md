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

**現在のバージョン (2026-03-24):**
- `app.html`: `style.css?v=13`, `app.js?v=38`
- `app.js`: `config.js?v=9`, `utils.js?v=5`, `firebase-service.js?v=5`
- `app.js`: `home.js?v=11`, `customers.js?v=10`, `attendance.js?v=28`, `schedule.js?v=8`, `revenue.js?v=10`

**手順:** ファイル修正 → 親ファイルの `?v=N+1` 更新 → コミット → push

## デプロイ（二重パス構造に注意）
ローカル作業は `posse/new-app/` だが、gitリポジトリのルートは `posse/` の親ディレクトリ。
デプロイ時は `posse/new-app/` → `new-app/` へコピーしてからコミットすること。

```bash
cp posse/new-app/js/app.js new-app/js/app.js
cd /Users/ATSUSHITO_RYCE/CLAUDE && git add new-app/ && git commit && git push
```

## Firestoreアーキテクチャ
- `schedule` コレクション: 全月共通の生徒名簿（曜日ごとにドキュメント）
- `attendance_YYYYMM`: 月別出席データ（キー形式: `曜日_場所_クラス名_姓名`）
- `customers`: 顧客マスターデータ

## 重要な仕様
- ビジター/初回プランの生徒は `attendance_YYYYMM` に出席データがある月のみ表示（翌月非引き継ぎ）
- 削除時: レギュラーは schedule + attendance 両方削除、ビジター/初回は attendance のみ削除
- `isRegularPlan()`: 1〜4クラス、1.5hクラスがレギュラー扱い

## 過去のバグ（再発防止）
- `defaultSchedule` 上書き: Firestoreデータを上書き → `Promise.allSettled` で解決済み
- `cleanupNonRegularStudents()`: ビジターを破壊的に削除 → 無効化済み、表示フィルターで代替
- schedule は全月共通: ある月で生徒を削除すると全月に影響 → ビジターは attendance のみ削除に変更
