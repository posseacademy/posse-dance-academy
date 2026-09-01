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

## 2026-08-10: 時間割と名簿の連動を writeBatch + scheduleName で作り直し、ロード失敗を参照同一性で検知する

**ユーザー意図 (User Intent)**: 「タイムスケジュールに登録したら、出席名簿やホームのレッスン一覧…すべての一貫性が連携されるようになってから、再度タイムスケジュールから私が手動で行い、すべて連動して設定されるか確認したい」。つまり依頼はクラス追加そのものではなく **連動の仕組みの修復**。9月のクラス登録はユーザーが手動で行う。

**Decision**:
1. `saveLessonForm` / `deleteLesson` の保存を `saveLessonAtomic()`（`writeBatch` で `timeSchedule/{曜日}` と `schedule/{曜日}` を1コミット）に置換。名簿保存も全曜日一括（`saveScheduleData`）から曜日単位（`saveScheduleDay`）へ。
2. 時間割の非alias エントリに **`scheduleName`（名簿での名前）を明示的に持たせる**。時刻や会場からの推測照合は実データで成立しない。
3. ロード成否を **参照同一性** で判定する（`results[n].value !== fallback`）。`loadScheduleData` / `loadTimeSchedule` は失敗時に**引数のオブジェクトをそのまま返す**ため、件数チェックも truthy チェックも常に真になる。
4. `readOnlyMode` + `assertWritable()` を11ハンドラの入口に、`_saveSchedule` / `_saveScheduleDay` の2本に全14箇所の schedule 保存を集約。
5. 時間割に無く当月受講者0名のクラスを表示側で自動的に隠す（`isClassInTimeSchedule`）。月フィルタは実装しない。

**Reason**: 時間割（曜日単位・軽い）と名簿（全6曜日・重い）を**逐次 `setDoc`** していたため、①成功→②失敗で時間割にだけ残る。実際にユーザーが登録した「ブレイキン　ミュージカリティ SHIN」がこれで消え、削除された（`calendar_202609` の 9/29 に休講キーだけが残存）。全曜日一括上書きのため、古い名簿を持つ別タブの操作でクラスごと消える経路もあった。調査中にも `timeSchedule/火曜日` が7→6件に変化し「ブレイキン入門 AYANO / HARUHIKO」の非alias が消失している。

**Impact**: `new-app/js/app.js`（+430行）, `firebase-service.js`, `utils.js`, `views/{attendance,home,schedule,customers}.js`, `csv-export.js`, `app.html`, `.gitignore`, `scripts/auto-commit.sh`。commit `80f7e1d` / `9a64358` / `9f252fa`、`app.js?v=118`。

**Pattern**: failure → success — **「失敗時にフォールバックを返す」ローダーの成否は、返り値の中身では絶対に判定できない**。件数・truthy・キー数はすべて素通りする。判定は `!==` による参照比較だけが効く。同型のローダーを追加するときは JSDoc に「失敗時は引数と同一参照を返す」と明記すること。

**追補（同日・PII）**: バックアップ JSON（顧客131名の氏名・住所・電話・生年月日）を置こうとした時点で、リポジトリが **PUBLIC** かつ `Stop` フックの `auto-commit.sh` が `git add -A` する構成のため、**無人で個人情報が公開される経路**が成立していた。`.gitignore` へ `/backups/` 等を追加し、`auto-commit.sh` に**内容ベース**のガード（`memberNumber` / `phone1` / `birthDate` 等を含む JSON/CSV/HTML を検出して中止）を追加。名前パターンだけのガードは無害な名前のダンプを通す。

**追補（同日・データ）**: 名簿0名の4クラスを復旧する際、当初リストにあった `小石原都美`（4クラス）は **2026-08 から大橋校へ移動**していることが attendance から判明し対象外にした。復旧対象は「当月 attendance に出席記録がある人」で機械的に決めるのが正しい。`モリミツキ` は7月フル出席・8月も継続しているが **customers に未登録**で、出席が1か月途切れると `cleanupAutoAddedStudents` の条件C（顧客無し＋参照月マーク無し）で無言削除される。

**追補（同日・改名）**: 表示名を変更したときの連動が3系統で切れていたため `991da00`（`app.js?v=119`）で修正。①`saveLessonForm` の編集分岐で新名 ≠ 名簿名なら `scheduleName` に名簿名を固定する（これが無いと次回の編集で `old.name` から名簿を引けず、`isClassInTimeSchedule` も外れて受講者0名の月にクラスが消える。alias を持たないクラス＝新規追加したクラス全部で必発）②`attendance.js` のソート用 tA/tB・timeEntry と `home.js` の te を `(t.scheduleName || t.name)` で照合する（改名すると時刻バッジが消え `timeA='9999'` で末尾へ飛ぶ）③編集時に対の alias の `time` だけ同期する。**出席名簿と HOME は alias 側の `time` を読む**（非alias の venue「天神BUZZ校 2スタジオ」は `replace(/校$/)` が末尾に効かず名簿の場所「天神」と一致しないため）。`venue` は同期してはならない — alias の venue は名簿の場所表記で、それ自体が照合の鍵。**名簿のクラス名は今後も改名しない**方針は不変で、改名すると休講キー `${name}__${venue}`（`schedule.js:281`）が外れる制約も残る。運用は「改名」ではなく「新クラス追加 → 旧クラスを時間割から削除」。

**実行（同日）**: Step 3 — 火曜18:40「ブレイキン入門 AYANO / HARUHIKO」を alias の直前へ復旧、`timeSchedule/金曜日` を config から7件で実体化（それまで Firestore に不在）、13クラスへ `scheduleName` を付与。Step 1 — 火曜千早2・木曜九産大前2の計4クラスへ延べ15名を `enrolledFrom:'2026-08'` で追加（名簿 78→93名）。検証: 時間割5曜日すべて実在、非表示クラス0・時刻が引けないクラス0、9/29 の休講設定が復活。検証中に**ロード失敗ガードが実際に発火**（4回のうち初回のコールドスタート）— 47名削除事故と同一経路で、日常的に起きうることが実証された。

---

## 2026-08-12: Auto Mode 既定化（8/14）に備えて permissions に恒久境界を張る

**ユーザー意図 (User Intent)**: 統括 Clude開発 発行の受信ダイジェスト `HANDOFF_AutoMode既定化とv3.5.1反映_2026-08-12.md` に従い、8/14 期限の `/upgrade-project platform` を実行すること。判断が分かれた3論点はいずれもユーザーが推奨案を選択した — ①外部公開は `deny` ではなく **`ask`**（deploy スキルは従来どおり動かし、push の直前で人間に聞く）②秘匿は `deny` / PII バックアップは `ask`（`data-recovery` の復旧経路を殺さない）③削除・履歴改変は短縮形＋履歴改変系まで網羅。

**Decision**:
1. `.claude/settings.json` の `deny` を 5件 → 20件、`ask` を新設して 8件。`allow` は**一字も触らない**（評価順が `deny` → `ask` → `allow` なので、`allow` に `Bash(git push *)` が残っていても `ask` が先に効く）。`git push --force` 系は `deny`、通常の `git push` は `ask`。
2. 常設委譲に明示起動パスを併記（`@code-reviewer` を 0件 → 4件、スキル一覧に「起動」列、ループ表に起動列、Dynamic Workflows 候補に依頼文）。`PROACTIVELY` マーカーは**1件も消していない**（3件のまま）。
3. CLAUDE.md「委譲の上限」の対象外を、既存の実名3件を残したまま**5カテゴリの実名リスト**へ拡張。
4. CLAUDE.md に「権限モードのトラブルシューティング」節を新設（`Shift+Tab` / `--permission-mode` / ユーザーレベル `defaultMode`。**いずれもプロジェクト設定には書かない**ことを明記）。
5. `commands/deploy.md` の `/project:verify` を `/verify` へ是正（v2.1 以前の旧形式）。

**Reason**: 2026-08-14 から Auto Mode が Pro/Max/Team の新規セッション既定になり、`deny` と明示 `ask` が**分類器より前に評価される唯一の恒久境界**になる。本プロジェクトは PUBLIC リポジトリに顧客131名の個人情報を扱うシステムを置き、`Stop` フックが毎応答 `git add -A` する。2026-08-10 に入れた `.gitignore` と `auto-commit.sh` の二重防御は**どちらも「コミットさせない」層**で、「読ませない・送らせない」層は `.env` 2件しかなかった。加えて `allow` の `Bash(git push *)` は `auto-commit.sh:7`「push はしない（2026-07-29 ユーザー決定）」と食い違っていた。

**Impact**: `.claude/settings.json`, `CLAUDE.md`, `.claude/agents/code-reviewer.md`, `.claude/commands/deploy.md`, 本ファイル。**アプリコード（`new-app/`）は不変**のためキャッシュバスティングの更新は不要。

**検証**: JSON 妥当性 OK。`PROACTIVELY` は編集前後とも 3件（`agents/code-reviewer.md:3` / `CLAUDE.md` / 本ファイル）。`@code-reviewer` 0→4件。`rm -f` の試行は実際に遮断された。なお `claude auto-mode config` が表示するのは**分類器の組込みルール**であり、プロジェクトの `deny`/`ask` はその出力には現れない（grep で 0件）— 実効性の確認は実操作で行うこと。

**Pattern**: success — **`.gitignore` とフックのガードは「コミットさせない」層にしかならない。「読ませない・送らせない」層は `permissions` の `deny`/`ask` にしか置けない**。両者は別レイヤーなので、片方があることをもう片方の代替と見なさない。また、**`allow` と実運用の食い違いは `allow` を削らずに `ask` を足すことで解消できる**（`deny` → `ask` → `allow` の評価順）。設定を消す前に、優先順位で上書きできないかを先に考える。

---

## 2026-08-12（第2版）: `alwaysThinkingEnabled` を削除し、gh 経由の外部送信を ask で塞ぐ

**ユーザー意図 (User Intent)**: 統括の受信ダイジェスト第2版（`alwaysThinkingEnabled: true` の残存を名指し・スキル側に検査項目 P6 を追加済み）を受けて `/upgrade-project platform` を再実行すること。判断が分かれた2件はいずれもユーザーが推奨案を選択した — ①`alwaysThinkingEnabled` は**削除する** ②`gh gist create` と `gh api` の**2つとも `ask` に追加する**。

**Decision**:
1. `.claude/settings.json` から `"alwaysThinkingEnabled": true` を削除（P6）。
2. `ask` に `Bash(gh gist create *)` と `Bash(gh api *)` を追加（8件 → 10件）。`allow` は**一字も触っていない**（23件のまま）。

**Reason**:
1. Opus 5 は thinking が既定 ON のため、このフィールドは効果を持たない旧世代の遺物。残っていると「設定済み」と誤読される。2026-06-01 に v2.2.3 適用で追加したもので、2026-07-29 の Opus 5 移行がモデルIDしか見ていなかったため生き残った。
2. `settings.local.json` の `allow` に `Bash(gh *)` があり、`ask` 側は `gh pr create` / `gh release` / `gh repo edit` の3つだけだった。**`gh gist create`（顧客131名の PII を含むファイルを公開 gist へ上げる経路）と `gh api`（任意の POST/PATCH）は無確認で通過していた**。PUBLIC リポジトリを扱う本部署では観点④（外部への送信・公開）の実質的な穴。統括のダイジェストは「四境界は充足済み ✅」と判定していたが、`settings.local.json` の存在を見ていない。

**Impact**: `.claude/settings.json`（+2 / -1）、本ファイル。**アプリコード（`new-app/`）は不変**のためキャッシュバスティングの更新は不要。

**検証**: JSON 妥当性 OK。`alwaysThinkingEnabled` / `defaultMode` / `autoMode` の混入 0件。ベースラインとの突き合わせで `PROACTIVELY` 2箇所（`agents/code-reviewer.md:3` / `CLAUDE.md:99`）・`@code-reviewer` 4件・モデルID 8箇所すべて編集前と同数、旧世代ID と haiku は 0件。`allow` 23件は不変。P1〜P5 は前回作業で充足済みのため今回の変更なし。

**Pattern**: success — **統括の機械検証は `settings.json` しか見ておらず、`settings.local.json` の `allow` を見ていない。恒久境界の実効性は2ファイルを合わせて評価しないと判定できない**（`Bash(gh *)` のような広い allow は local 側にあった）。また、モデル移行の機械検証を**モデルIDの grep だけで済ませると、旧世代固有の設定フィールドが生き残る** — 移行時は「置換すべきID」と「削除すべきフィールド」を別々のチェック項目として持つこと。

---

## 2026-09-01: standing authorization を実名記録し、deny/ask の残穴2件を塞ぐ（v3.6.0）

**ユーザー意図 (User Intent)**: 統括 Clude開発 発行の受信ダイジェスト `HANDOFF_v3.6.0基準更新_2026-09-01.md` に従い `/upgrade-project platform` を実行すること。判断が分かれた3件はいずれもユーザーが推奨案を選択した — ①standing-authorization ブロックは **decision-log に承認記録がある2件のみ**（`deploy-verify` / `attendance-snapshot` は承認記録が無いため載せない）②`Read(./secrets/**)` を deny に追加する ③`gh secret set` / `gh workflow run` / `gh repo create` の3つを ask に追加する。

**Decision**:
1. CLAUDE.md に「**常設委譲の standing authorization（ユーザー承認済み・2026-09-01 記録）**」節を新設。`code-reviewer` エージェントと Dynamic Workflows 一括監査2件を、実名＋起動条件＋明示起動パス＋承認日の表で記録した。既存の「「委譲の上限」の対象外（5カテゴリ）」は**削除せず併存**させる。
2. `deny` に `Read(./secrets/**)` を追加（20件 → 21件）。`ask` に `Bash(gh secret set *)` / `Bash(gh workflow run *)` / `Bash(gh repo create *)` を追加（10件 → 13件）。**`allow` は一字も触っていない**（23件のまま）。

**Reason**:
1. #80988 の続報（2026-09-01 時点も open・v2.1.251 で再現報告）で挙動が精密化し、抑制されるのは**裁量形の委譲指示**で、**エージェント名＋起動条件を名指しした指示は「ユーザーの要求」として通る**ことが分かった。既存の5カテゴリは「規則の側（何が対象外か）」を書いたもので、「ユーザーが恒常的に依頼している」という**承認の側**の記録が無かった。両者は別レイヤーなので置換せず併存させる。
2. 秘匿 Read の deny は全てファイル名パターン（`./**/*secret*` 等）で、`secrets/api.json` のように**ディレクトリ名だけが秘匿を示す**ファイルが素通りしていた。また `settings.local.json` の `Bash(gh *)` に対し ask 側は5つ（`pr create` / `release` / `repo edit` / `gist create` / `api`）で、PUBLIC リポジトリでの公開・実行経路である `repo create --public` と `workflow run`、秘密の書き込み `secret set` が無確認で通っていた。

**Impact**: `.claude/settings.json`（+4）、`CLAUDE.md`（standing authorization 節を新設）、本ファイル。**アプリコード（`new-app/`）は不変**のためキャッシュバスティングの更新は不要。

**充足済みのため変更なし**: P2（`defaultMode` 0件）・P4（5カテゴリ実名リスト）・P5（opus-5 × 6 / sonnet-5 × 2）・P6（`alwaysThinkingEnabled` 0件）・P8 の CLI 制約4項目（Todo/Task 依存 0件・`env` ブロック無し・`sandbox.ripgrep` 無し・ワイルドカード前置 allow 無し）。P7 の無人経路ゲートは `Stop` フックの `auto-commit.sh`（秘匿・PII ガード）が既に担っており、`SessionStart` フックは未使用。受信ダイジェスト要点1（Sonnet 5 値上げ中止の事実訂正）は、本プロジェクトに価格・コスト試算の記述が 0件のため該当なし。

**検証**: JSON 妥当性 OK（allow 23 / deny 21 / ask 13）。ベースライン突き合わせで `PROACTIVELY` 2箇所（`agents/code-reviewer.md:3` / `CLAUDE.md:99`）不変、モデルID 8箇所不変、旧世代ID・haiku 0件、`alwaysThinkingEnabled` / `defaultMode` / `autoMode` 0件。`@agent-code-reviewer` は 4件 → 5件（新設ブロックで1件増）、裸の `@code-reviewer` は 0件。

**Pattern**: success — **「規則の側」と「承認の側」は別レイヤーであり、片方があることをもう片方の代替と見なさない**。「委譲の上限の対象外」は Claude に規則を教えるが、モデル側の注入文に対しては「ユーザーが実際にそう依頼している」という記録のほうが効く。また、**standing authorization に書く承認日は必ず実在の承認に紐づける** — 記録が無い委譲（`deploy-verify` / `attendance-snapshot`）を「たぶん承認されている」で書き足すと、承認の捏造そのものになる。書けないものは載せない。

---

## 追記時の注意

- 日付は **絶対日付**（YYYY-MM-DD）で記録する。「先週」「昨日」のような相対表現は使わない。
- `Pattern` 行は将来の Claude が読むものなので、再発防止の **教訓** を一文で書くこと。
- 過去のバグは CLAUDE.md「過去のバグ（再発防止）」にも要約版が残っています（情報損失を避けるため二重保持）。
