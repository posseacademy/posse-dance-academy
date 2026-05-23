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

## 2026-05-XX: HOME 集計を当月ベースに統一

**Decision**: HOMEダッシュボードのレッスン人数とプラン別内訳を、出席名簿と同じ「当月ベース」のロジックに統一（commits `d2a7b0e`, `3ddbc76`）。「ハーフ」プランも正式対応した。
**Reason**: 集計ロジックが2系統存在し、HOME と出席名簿で人数が食い違うクレームが頻発していた。
**Impact**: `new-app/js/views/home.js`, `new-app/js/utils.js`。
**Pattern**: success — 同じ事実を表示する画面同士は、必ず同一のソースロジックから派生させる。

---

## 追記時の注意

- 日付は **絶対日付**（YYYY-MM-DD）で記録する。「先週」「昨日」のような相対表現は使わない。
- `Pattern` 行は将来の Claude が読むものなので、再発防止の **教訓** を一文で書くこと。
- 過去のバグは CLAUDE.md「過去のバグ（再発防止）」にも要約版が残っています（情報損失を避けるため二重保持）。
