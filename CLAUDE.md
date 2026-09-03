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

**現在のバージョン (2026-09-03):**
- `app.html`: `style.css?v=25`, `app.js?v=120`
- `app.js`: `config.js?v=16`, `utils.js?v=19`, `firebase-service.js?v=9`
- `app.js`: `home.js?v=30`, `customers.js?v=21`, `attendance.js?v=52`, `schedule.js?v=28`
- `app.js`: `csv-export.js?v=22`

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
- レッスンの開催期間（2026-09 追加）: 時間割エントリの `activeFrom` / `activeThrough`（ともに `YYYY-MM`・**包含**）。名簿も時間割も全月共通のため、月をまたぐ差し替えはこの2つで表現する。`isLessonActiveIn()` が判定し、`isClassEnded()`（**終了側のみ**）が「最終開催月を過ぎたクラスは受講者が残っていても隠す」を担う。開始前を隠さないのは、時間割から消えたクラスを再登録したときに過去の出席記録まで隠れるため

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

## モデル運用方針（2026-07-28）

創る=Opus / 運ぶ=Sonnet / Haiku=使用禁止。判断基準は「成果物が受け側に届く文章・判定なら Opus、材料集め・転記・操作なら Sonnet」。（業務的には Opus=判断や文章を任せる高性能モデル、Sonnet=確認や転記を任せる軽量モデル）

| `claude-opus-5` | `claude-sonnet-5` |
|---|---|
| settings.json / code-reviewer / deploy / firestore-backup / data-recovery / firestore-inspect | verify / versions |

正本: `/Users/ATSUSHITO_RYCE/CLAUDE/AD_シニア漫画/works/HANDOFF_モデル配分ポリシー_2026-07-02.md`

## スキル / コマンド / エージェント

- **`.claude/skills/`** が公式推奨の置き場所（`SKILL.md` 形式、Gotchas 付き）
- **`.claude/commands/`** は後方互換のため残置（v2.1 移行前の旧形式）
- **`.claude/agents/code-reviewer`** が `PROACTIVELY` で起動し、Firestore 操作・キャッシュバスティング・schedule 全月影響を重点チェック。自動起動しないときは **`@agent-code-reviewer` で明示指名**する

> **明示起動パス（2026-08-12 追加）**: Opus 5 では明示指名のない自動委譲が抑制される場合があるため（GitHub issue #80988・挙動自体は未検証）、常設の委譲にはスラッシュコマンド／`@エージェント名` を併記してある。トリガー例で発火しなかったら、下表の「起動」列を直接打つ。

スキル一覧:

| スキル | 起動 | 用途 | トリガー例 |
|--------|------|------|----------|
| `deploy` | `/deploy` | new-app/ の変更を本番に反映 | 「デプロイして」「pushして」 |
| `verify` | `/verify` | 本番反映状態を確認 | 「反映されてる？」「verify して」 |
| `versions` | `/versions` | キャッシュバスティング `?v=N` 一覧 | 「バージョン確認」「versions 出して」 |
| `firestore-backup` | `/firestore-backup` | 修正前に schedule/attendance/customers をダンプ | 「データを変更する前に」「Firestore を修正」 |
| `data-recovery` | `/data-recovery` | 消えたデータを attendance / schedule から復元 | 「データが消えた」「復元して」 |
| `firestore-inspect` | `/firestore-inspect` | Firestore の中身を調査・整合性を検証 | 「データを確認して」「売上が合わない」 |

エージェント: `@agent-code-reviewer`（`.claude/agents/code-reviewer.md`）

## 推奨ループ（Recurring Workflows）

| ループ | 推奨頻度 | 機構 | 起動 | 目的 |
|--------|---------|------|------|------|
| `deploy-verify` | push 後 5min | `/loop` | `/loop 5m /verify` | GitHub Pages 反映確認 |
| `attendance-snapshot` | 月初 1回 | `routines`（schedule trigger） | `/schedule`（登録）／単発は `/firestore-backup` | 前月 attendance を /tmp/claude/ にダンプ（バックアップ） |

ループは **3〜5本以内** に抑える（resource exhaustion 回避）。

## Dynamic Workflows 活用候補
独立した work-list がある一括処理のみ有効（逐次タスクには不要。並列＝トークン増に留意）。**自動では起動しない。実行するときは下記の依頼文で明示的に指示する**:
- 全 `attendance_YYYYMM` の整合性一括監査（月別ドキュメントを並列処理し、キー形式・場所不一致・`_plan` 欠落を検出） — 依頼文「**全 attendance を workflow で一括監査して**」
- 全 `customers` のプラン/料金整合チェック（顧客×プランを並列検証） — 依頼文「**全 customers のプラン整合を workflow で検証して**」

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

## Opus 5 運用指示（2026-07-28）

- **簡潔に**: 説明の丁寧さは維持しつつ、前置きと要約の繰り返しを削る。免責・注意書きは短く、本題に大半を割く
- **成果物の長さ**: 生成する文書は水増しの節・重複要約・定型文で膨らませない
- **スコープ規律**: 頼まれた範囲を頼まれた粒度で完遂する。懸念は1文で述べて指示どおり進める。完了報告は本当に終わってから
- **委譲の上限**: サブエージェントは大きく独立した並列可能なトラックに限る。数回のツール呼び出しで終わる作業は自分で完遂する。自分の出力をもう一度確かめるためだけの委譲はしない。**ただし `code-reviewer` の PROACTIVE 起動（レビューゲート）と「Dynamic Workflows 活用候補」の一括監査2件は本プロジェクトの設計であり、この制限の対象外**
- **訂正の作法**: ユーザーの判断が変わる誤りだけを、簡潔に訂正して続行する

### 「委譲の上限」の対象外（保護ロール・2026-08-12 拡張）

抑制の対象は「**自分の出力をもう一度確かめるためだけの、その場で足した委譲**」だけ。次の5カテゴリは **review / audit / gate・approval / fact-check を担う保護ロール**であり、規模にかかわらず実行する。判定に迷ったら「常設のルールが要求しているゲートか／自分の安心のためにその場で足した確認か」で決める。

1. **常設の委譲** — `@agent-code-reviewer` の PROACTIVE 起動（レビューゲート）、Dynamic Workflows 活用候補の一括監査2件
2. **人間の承認ゲート** — `git push` と本番 Firestore 書き込みの手動実行（`settings.json` の `ask` / `scripts/auto-commit.sh` は push しない）、`.claude/rules/turn-ownership.md` §4 の停止
3. **機械チェック** — `scripts/auto-commit.sh` の秘匿ガード・PII ガード、`/versions` の `?v=N` grep 差分
4. **外部実態との照合** — `/verify` の本番 curl 比較、`firestore-backup` のバックアップ検証
5. **自走サイクルの「検証」ステップ** — `deploy-verify` ループ（`/loop 5m /verify`）

> 保護ロールであることは Opus への昇格を意味しない。`/verify` と `/versions` は保護ロールのまま `claude-sonnet-5` である。

### 常設委譲の standing authorization（ユーザー承認済み・2026-09-01 記録）

下表は **ユーザーが承認済みの standing request（恒常的な依頼）** である。セッションごとに確認を取り直す必要はなく、起動条件に合致したら実行する。「委譲は最小限に」のような裁量形の指示は、ここで名指しされた委譲には適用されない。

| 委譲 | 起動条件 | 明示起動パス | 承認日 |
|------|---------|------------|--------|
| `code-reviewer` エージェント | `new-app/` のコード変更後のレビュー。特に Firestore 操作・キャッシュバスティング・`schedule` 全月影響を含む変更 | `@agent-code-reviewer` | 2026-08-12（5カテゴリ実名リストとして承認）／2026-09-01 に standing request として記録 |
| 全 `attendance_YYYYMM` の整合性一括監査（Dynamic Workflow） | ユーザーが依頼文を出したとき | 「全 attendance を workflow で一括監査して」 | 同上 |
| 全 `customers` のプラン/料金整合チェック（Dynamic Workflow） | ユーザーが依頼文を出したとき | 「全 customers のプラン整合を workflow で検証して」 | 同上 |

出典: `references/decision-log.md` 2026-07-29 追補（保護対象として実名明示の初出）／2026-08-12（ユーザーが推奨案を選択して承認）。**承認記録のない委譲はこの表に書かない** — `deploy-verify` ループと `attendance-snapshot` は承認記録が無いため対象外（前者は上記5カテゴリの5番で保護済み）。

**無人経路の品質ゲート**: スケジュールタスク・routines・background 実行では常設委譲が発火しないとの報告があるため、無人時のゲートは `Stop` フックの `scripts/auto-commit.sh`（秘匿ファイルガード・PII ガード）が担う。`SessionStart` フックは注入経路として無効なので使わない。

## 権限モードのトラブルシューティング（2026-08-12）

2026-08-14 から Auto Mode が新規セッションの既定になる。`settings.json` の `deny` / `ask` は**分類器より前に評価される恒久境界**なので、Auto Mode でも必ず効く（評価順は `deny` → `ask` → `allow`）。

確認が煩わしいときの戻し方 — **いずれもプロジェクト設定ファイルには書かない**（`defaultMode` は project / local settings では無視される）:

- `Shift+Tab` … 権限モードを循環させる
- `claude --permission-mode <mode>` … その起動だけモードを指定する
- 個人の既定を変えるなら `~/.claude/settings.json` の `defaultMode`

現在の実効ルールは `claude auto-mode config`、組込みルールは `claude auto-mode defaults` で確認できる。

