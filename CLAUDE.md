# POSSE Dance Academy - 管理システム

## 概要
ダンスアカデミーの顧客管理・出席管理・売上管理SPA。GitHub Pages + Firebase Firestore。

- **本番**: https://posseacademy.github.io/posse-dance-academy/new-app/app.html
- **リポジトリ**: https://github.com/posseacademy/posse-dance-academy
- **スタック**: JavaScript (ES Modules), HTML, CSS, Firebase Firestore

## 最優先ルール（絶対遵守）
@.claude/rules/turn-ownership.md — ユーザー発言の捏造・一人芝居を禁止する統一ガード。他のどのルールよりも先に従うこと。

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
        └── schedule.js   # タイムスケジュール
```

## キャッシュバスティング（必須）
GitHub Pagesはキャッシュが強い。JS/CSSを修正したら必ず `?v=N` を `?v=N+1` に更新すること。

**現在のバージョン (2026-06-19):**
- `app.html`: `style.css?v=25`, `app.js?v=116`
- `app.js`: `config.js?v=16`, `utils.js?v=17`, `firebase-service.js?v=8`
- `app.js`: `home.js?v=27`, `customers.js?v=19`, `attendance.js?v=49`, `schedule.js?v=26`
- `app.js`: `csv-export.js?v=20`

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
- `migrateOrphanRegulars()`: 前月attendance自動補完で退会済み顧客を復活 → 無効化済み（app.js:117,761,782）。`cleanupAutoAddedStudents()` で初期化時に enrolledFrom < '2026-04' の生徒を一括削除
- CSV書き出しが `schedule.students` のみ反復 → ビジター/体験が脱落（嶋川1名のみ）→ 画面・HOME と同じ `getClassStudentsForMonth()` で集約し3系統を統一（`csv-export.js`/`attendance.js`、2026-06-19）

> 詳細な経緯は @references/decision-log.md を参照。

---

## 言語

応答・コミットメッセージ・コメントは日本語。設定は `.claude/settings.json` の `"language": "japanese"` を参照。

## スキル / コマンド / エージェント

- **`.claude/skills/`** が公式推奨の置き場所（`SKILL.md` 形式、Gotchas 付き）
- **`.claude/commands/`** は後方互換のため残置（v2.1 移行前の旧形式）
- **`.claude/agents/code-reviewer`** が `PROACTIVELY` で起動し、Firestore 操作・キャッシュバスティング・schedule 全月影響を重点チェック

スキル一覧:

| スキル | 用途 | トリガー例 |
|--------|------|----------|
| `deploy` | new-app/ の変更を本番に反映 | 「デプロイして」「pushして」 |
| `verify` | 本番反映状態を確認 | 「反映されてる？」「verify して」 |
| `versions` | キャッシュバスティング `?v=N` 一覧 | 「バージョン確認」「versions 出して」 |
| `firestore-backup` | 修正前に schedule/attendance/customers をダンプ | 「データを変更する前に」「Firestore を修正」 |

## 推奨ループ（Recurring Workflows）

| ループ | 推奨頻度 | 機構 | 目的 |
|--------|---------|------|------|
| `deploy-verify` | push 後 5min | `/loop 5m /verify` | GitHub Pages 反映確認 |
| `attendance-snapshot` | 月初 1回 | `routines`（schedule trigger） | 前月 attendance を /tmp/claude/ にダンプ（バックアップ） |

ループは **3〜5本以内** に抑える（resource exhaustion 回避）。

## Dynamic Workflows 活用候補
独立した work-list がある一括処理のみ有効（逐次タスクには不要。並列＝トークン増に留意）:
- 全 `attendance_YYYYMM` の整合性一括監査（月別ドキュメントを並列処理し、キー形式・場所不一致・`_plan` 欠落を検出）
- 全 `customers` のプラン/料金整合チェック（顧客×プランを並列検証）

## 非エンジニア向け技術用語対応表

技術判断は Claude に委任して構いません。以下は読み解きの補助です。

| 技術用語 | 業務的な意味 |
|----------|------------|
| Firestore | クラウド上の生徒・出席データ保管庫 |
| キャッシュバスティング (`?v=N`) | ブラウザに古い画面を見せないための更新印 |
| ビュー (`views/*.js`) | 各ページの画面（HOME / 出席名簿 / 顧客一覧 等） |
| commit / push | 変更を本番サイトに送る作業 |
| `schedule` コレクション | レギュラー生徒の名簿（全月共通） |
| `attendance_YYYYMM` | 月別の出席記録 |
| `customers` コレクション | 顧客マスター（住所・連絡先・プラン） |
| `Promise.allSettled` | 「全部試して、失敗したものだけ報告して」という安全な並列処理 |

## 設計判断の履歴

@references/decision-log.md

