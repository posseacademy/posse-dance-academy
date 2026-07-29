# Decision Log — POSSE Dance Academy

このファイルは、プロジェクトの設計判断・成功/失敗パターンの履歴を記録します。
新しい判断や再発防止が必要なバグに遭遇したら追記してください。

## テンプレート（Appendix C 準拠）

```markdown
## YYYY-MM-DD: [Decision Title]

**Decision**: [何を決めたか]
**Reason**: [なぜそう決めたか]
**Impact**: [影響を受けるファイル・挙動]
**Pattern**: [success/failure] — [将来への教訓]
```

---

## 2026-04-XX: defaultSchedule で Firestore データを上書きしない

**Decision**: `app.js` の初期化時に `config.js` の `defaultSchedule` を Firestore へ書き戻さないよう、`Promise.allSettled` を用いて存在チェックを挟む構造に変更。
**Reason**: Firestore に既に保存されている当月の生徒名簿が、デフォルト値で意図せず上書きされる事故が発生したため。
**Impact**: `new-app/js/app.js`（初期化処理）, `new-app/js/firebase-service.js`（読み書きラッパ）。
**Pattern**: failure → success — 初期データはあくまで「Firestore が空のときのフォールバック」であり、書き戻しは絶対にしない。`config.js` を編集する際もこの原則は不変。

---

## 2026-04-XX: cleanupNonRegularStudents() の破壊的削除を停止

**Decision**: ビジター/初回プランの生徒を `schedule` コレクションから自動削除する関数 `cleanupNonRegularStudents()` を無効化し、表示フィルターで「当月 attendance に存在する生徒のみ表示」するロジックに置き換えた。
**Reason**: ビジターは将来再来店する可能性があるため、`schedule` から永続削除するのは過剰。表示制御で十分。
**Impact**: `new-app/js/views/attendance.js`, `new-app/js/views/customers.js`。
**Pattern**: failure → success — Firestore は破壊的操作よりも「条件付きフィルタリング」のほうが安全。削除前に必ず復元可能性を考慮する。

---

## 2026-04-XX: schedule コレクションは全月共通であることを明示化

**Decision**: `schedule` コレクションは曜日ごとのドキュメントで、月別には分かれていない。ある月で生徒を削除すると全月に影響することを CLAUDE.md と rules/firestore-safety.md に明記した。
**Reason**: 月別データだと誤認して削除した結果、過去月の名簿まで消える事故を防ぐため。
**Impact**: `new-app/js/firebase-service.js`（`saveScheduleData` の影響範囲）, ドキュメント全般。
**Pattern**: success — レギュラー生徒の追加/削除は schedule、ビジター/初回は attendance のみ操作という二系統運用が確立した。

---

## 2026-04-XX: migrateOrphanRegulars() を停止し cleanupAutoAddedStudents() を新設

**Decision**: 前月の attendance を見て「当月にいない生徒」を自動補完する `migrateOrphanRegulars()` を無効化（`app.js:117, 761, 782`）。代わりに初期化時に `enrolledFrom < '2026-04'` 条件で `cleanupAutoAddedStudents()` が一括削除する。
**Reason**: 自動補完が退会済み顧客を復活させ、出席名簿に幽霊生徒が湧く障害が継続発生していたため。
**Impact**: `new-app/js/app.js`（初期化フロー）。
**Pattern**: failure → success — 「親切な自動化」は退会データのような暗黙の状態を破壊する。退会判定は明示的フィールド（`enrolledFrom`, `withdrawnAt` 等）のみを信頼する。

---

## 2026-05-XX: cleanupAutoAddedStudents が場所変更前の attendance キーを参照していた

**Decision**: 5月からの場所変更（照葉→千早/九産大前）に伴い、`cleanupAutoAddedStudents` が新場所の attendance キーで照合するよう修正（commit `79dfdad`）。
**Reason**: attendance キーは `曜日_場所_クラス名_姓名` 形式のため、場所が変わると別キー扱いになり、cleanup 対象として誤判定される。
**Impact**: `new-app/js/app.js`（cleanup ロジック）。
**Pattern**: failure → success — 場所・曜日・クラス名のいずれかが変わる移行月では、attendance キー全件のマイグレーションを先に走らせる必要がある（`applyLocationMigrationOnce` 参照）。

---

## 2026-05-23: leftAt 表示フィルタの off-by-one を修正（当月削除即非表示）

**Decision**: `attendance.js` と `utils.js` の在籍範囲判定 `_selectedM > leftAt` を `_selectedM >= leftAt` に統一。pastRegulars 経由の再表示も同じガードで遮断（schedule に同名があり leftAt が当月以前なら過去在籍にも入れない）。
**Reason**: ユーザーが「削除しても消えない」と訴えていた問題の根本原因。`deleteStudent` 自体は `target.leftAt = this.selectedMonth` を Firestore に保存していたが、表示側が「leftAt と同じ月 = 在籍中」として描画していたため、削除実行月の名簿に生徒名が残り続けていた。
**Impact**: `new-app/js/views/attendance.js`, `new-app/js/utils.js`（ロジック修正）+ utils.js import 連鎖で `home.js / customers.js / csv-export.js / app.js / app.html` のキャッシュバスティング更新。
**Pattern**: failure → success — 「削除」「退会」「終了月」を扱う比較演算子は **`>=` が直感に近い**。同じ判定が複数ファイルにコピーされている場合、1 つ修正したら必ず `grep` で全箇所を網羅すること（今回 utils.js を見落とすと home.js 月別集計が壊れたまま残った）。

---

## 2026-05-XX: HOME 集計を当月ベースに統一

**Decision**: HOMEダッシュボードのレッスン人数とプラン別内訳を、出席名簿と同じ「当月ベース」のロジックに統一（commits `d2a7b0e`, `3ddbc76`）。「ハーフ」プランも正式対応した。
**Reason**: 集計ロジックが2系統存在し、HOME と出席名簿で人数が食い違うクレームが頻発していた。
**Impact**: `new-app/js/views/home.js`, `new-app/js/utils.js`。
**Pattern**: success — 同じ事実を表示する画面同士は、必ず同一のソースロジックから派生させる。

---

## 2026-06-01: v2.2.3 適用時にローカルが stale だった問題と統合（リモート優先）

**Decision**: Universal Base Prompt v2.2.3 をローカルで適用・コミット後、push 時に non-fast-forward を検出。原因はローカル main が stale で、リモートには既に「Claude Code 設定 v2.1 更新（`758e635`）」＋アプリ修正2件（attendance/mobile）が入っていた。リモートの `.claude` 設定の方が完成度が高かったため、**リモートを土台に採用**し、`git rebase --skip` で自分の重複コミット（`1207524`, `d76bbe0`）を破棄。`MANUAL.md` のみ残し、価値ある差分だけを再適用:
- 全 agent/skill/settings の `claude-opus-4-7` → `claude-opus-4-8`（v2.2.3 Model Policy・最新版）
- `settings.json` に `effortLevel: high` / `alwaysThinkingEnabled: true` を追加（`language` は既存）
- `CLAUDE.md` に「Dynamic Workflows 活用候補」節を追加
- rebase --skip で消えたローカル限定スキル `data-recovery` / `firestore-inspect` を復元（リモートに代替なし）

**Reason**: 開始時にリモートを fetch せず stale なローカルで作業したため、リモートの先行作業と重複・衝突した。リモート版が優れていたため、自分の成果に固執せずリモートを採用するのが正しい統合だった。

**Impact**: `.claude/settings.json`, `.claude/agents/code-reviewer.md`, `.claude/skills/{deploy,firestore-backup,verify,versions,data-recovery,firestore-inspect}/SKILL.md`, `CLAUDE.md`, `references/decision-log.md`。アプリコード（`new-app/js/`）は不変。

**Pattern (failure→lesson)**: **セットアップ/設定作業の前に必ず `git fetch origin` して divergence を確認する**。stale なローカルで作業するとリモートの先行作業と衝突し大幅な手戻りになる。リモートが優れている場合は自分のコミットを `rebase --skip` で捨て、価値ある差分だけ再適用するのが最短。

---

## 2026-06-19: 出席名簿CSVがビジター/体験を取りこぼす（schedule.students のみ反復）

**Decision**: 月別/年間CSV(`csv-export.js`)を `schedule.students` 反復から共通関数 `getClassStudentsForMonth`(`utils.js`) ベースに変更。画面(`attendance.js`)のインライン複製も同関数へ統一し、画面・HOME・CSV の3系統を単一ロジック化した。
**Reason**: CSVが `schedule.students` のみ反復していたため、`attendance_YYYYMM` にしか記録のないビジター/体験生徒が脱落（実データ202606で嶋川1名のみ表示）。画面表示は attendance スキャンで拾っていたため、画面とCSVが乖離していた。
**Impact**: `new-app/js/csv-export.js`, `new-app/js/views/attendance.js`, `new-app/js/app.js`（呼び出しに `customers` 追加・`isRegularPlan` 引数を削除）, `app.html`/`CLAUDE.md`（キャッシュバスティング）。
**Pattern**: failure → success — 「同じ事実を出す画面・帳票は必ず同一のソースロジックから派生させる」。`getClassStudentsForMonth` が唯一の生徒集約ロジックになった。年間CSVの `attData._plan`（月全体オブジェクト参照）バグも `att._plan`（個別レコード）に是正。実データ202606で非レギュラーが 1→11 名に増えることを preview で確認。

---

## 2026-07-29: Claude Opus 5 への移行（モデルID更新・旧 malformed 対策の撤回）

**ユーザー意図 (User Intent)**: 統括（Clude開発）発行の指示書 `works/opus5-rollout/09_posse.md` を読み、記載の手順で Opus 5 移行を実行すること。posse は 2026-07-02 の Sonnet 化では対象外だったが、今回は Opus 世代の追従という性質の違いから 2026-07-28 に対象へ含める判断がなされた。§4 の削除2件はユーザーが「両方削除する（指示書どおり）」を選択し承認済み。

**Decision**: モデルIDを8箇所置換（`settings.json` / `code-reviewer` / `deploy` / `firestore-backup` / `data-recovery` / `firestore-inspect` → `claude-opus-5`、`verify` / `versions` → `claude-sonnet-5` ⚡降格）。CLAUDE.md に「モデル運用方針（2026-07-28）」と「Opus 5 運用指示（2026-07-28）」の2節を新設。旧 Opus 4.8 対策の `turn-ownership.md` L23「compose/act ターン分離」と、`code-reviewer.md` L79「該当関数全体を Read してから判定」を削除。`versions` の「正規表現の取りこぼし」Gotcha は削除せず手法メモ1行（`grep -oE "\?v=[0-9]+"`）へ圧縮。

**Reason**: Opus 5（2026-07-24 リリース）は 3層構造（創る=Opus / 運ぶ=Sonnet / Haiku 禁止）を変えず生成層のモデルIDのみが移る。撤回した2件はいずれも Opus 4.8 固有の malformed tool call 対策および自己再検証指示であり、Opus 5 では不要かつスループット低下を伴う。`verify` / `versions` の Sonnet 降格は「デプロイ後の照合・バージョン確認＝転記・操作」という基準の双方向適用。

**Impact**: `.claude/settings.json`, `.claude/agents/code-reviewer.md`, `.claude/skills/{deploy,verify,versions,firestore-backup,data-recovery,firestore-inspect}/SKILL.md`, `.claude/rules/turn-ownership.md`, `CLAUDE.md`, 本ファイル。**アプリコード（`new-app/`）は不変**、CLAUDE.md「現在のバージョン」表も不変（`deploy` / `versions` の Source of Truth のため書式保全）。

**適用**: commit `7e25de3`（11ファイル / +65 -10）で push 済み。`.claude/rules/turn-ownership.md` はそれまで untracked だったため、このコミットで新規追跡になり CLAUDE.md の `@import` が他環境でも通るようになった。

**Pattern**: success — **「malformed」「必ず」「確認」で機械的に grep して一括削除しない**。同じ語で書かれていても turn-ownership §1〜§4（2026-06-16 に実発火した捏造防止ルール）・外部実態との照合（本番 curl・バックアップ検証・完全一致比較）は Opus 4.8 とは無関係の資産であり保全対象。削除は項目単位で取捨し、事前にユーザー承認を取る。

**追補（同日）**: 指示書 §5 のテンプレ「検証目的の委譲はしない」が、本プロジェクトの `code-reviewer`（`PROACTIVELY` 起動のレビュー専用エージェント）と「Dynamic Workflows 活用候補」の一括監査2件を丸ごと禁止していたため、保護対象を実名で明示する形に修正した（正本 §6 の keep 判定「レビューゲートは保全」とも矛盾していた）。REPORT_05 人生劇場放送局の申し送り「テンプレ適用直後に自部署の資産と照合せよ」で検出。**テンプレは最大公約数であり各部署の資産を知らない。貼った直後に必ず照合すること。**

---

## 追記時の注意

- 日付は **絶対日付**（YYYY-MM-DD）で記録する。「先週」「昨日」のような相対表現は使わない。
- `Pattern` 行は将来の Claude が読むものなので、再発防止の **教訓** を一文で書くこと。
- 過去のバグは CLAUDE.md「過去のバグ（再発防止）」にも要約版が残っています（情報損失を避けるため二重保持）。
