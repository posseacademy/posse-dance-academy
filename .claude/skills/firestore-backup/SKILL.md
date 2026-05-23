---
name: firestore-backup
description: POSSE システムの Firestore データ（schedule / attendance_YYYYMM / customers）を修正する **前** に、必ず /tmp/claude/ にバックアップを取得する。ユーザーが「Firestore を変更」「データを修正する前に」「schedule を更新」「customers を整理」「attendance を編集」と言ったとき、または firebase-service.js の書き込み系関数（saveScheduleData / cleanup* / migrate*）を改修するときに自動的に起動する。バックアップなしの破壊的操作は禁止。
model: claude-opus-4-7
allowed-tools: Bash, Read, Write
---

# firestore-backup — 修正前 Firestore バックアップスキル

## 役割

`schedule` / `attendance_YYYYMM` / `customers` コレクションへの **書き込み・削除を伴う変更を行う前** に、現状を JSON ダンプし `/tmp/claude/firestore-backup-YYYYMMDD-HHMM/` に保存する。MEMORY の `feedback_backup_before_changes.md` ルールに従う。

## 手順

1. **バックアップディレクトリ作成**
   - `mkdir -p /tmp/claude/firestore-backup-$(date +%Y%m%d-%H%M)`

2. **対象コレクションの特定**
   - 修正対象を確認: schedule / attendance_YYYYMM（月）/ customers / calendar_YYYYMM
   - 複数月にまたがる場合は **全該当月** をダンプ

3. **ダンプ取得**
   - 既存の Firestore エクスポート手段（管理画面 / firebase CLI / スクリプト）で JSON 化
   - もしくはブラウザ上で `firebase-service.js` の読み込み系関数を呼び、結果を `console.log` → 手動コピー
   - 保存先: `/tmp/claude/firestore-backup-YYYYMMDD-HHMM/<collection>.json`

4. **検証**
   - 保存ファイルのサイズを確認（0 バイトなら失敗）
   - 主要キー（曜日 / 場所 / 姓名）が含まれていることを `grep` で確認

5. **記録**
   - バックアップパスをユーザーに報告
   - 「修正後にロールバックが必要なら、このパスから復元できます」と案内

6. **修正本体に着手**
   - バックアップ取得が確認できてから、初めて Firestore 書き込みを含むコード変更を実行する

## 出力フォーマット

```
🛡️ Firestore バックアップ完了
- ディレクトリ: /tmp/claude/firestore-backup-20260511-1430/
- ダンプ済みコレクション:
  - schedule.json (NN件)
  - attendance_202605.json (NN件)
  - customers.json (NN件)
- 検証: ✅ 全ファイル非空、主要キー存在
- 次のステップ: 修正に着手します
```

## 注意事項

- バックアップを **取らずに** schedule の書き換えや cleanup* / migrate* 関数の改修を行うのは厳禁
- `/tmp/claude/` 配下は揮発性。長期保存が必要なら `references/firestore-snapshots/` 等に明示的に移すこと
- 機密データ（顧客の連絡先・住所等）が含まれるため、絶対に外部送信しない・コミットしない
- バックアップ実行後 1 時間以上経過したら再取得を推奨（その間に他の操作で状態が変わっている可能性）

## Gotchas（よくある失敗パターン）

- **バックアップ「取ったつもり」**: `mkdir` だけ成功して dump コマンドが失敗していたケース。**ファイルサイズと主要キーの存在** を必ず検証する。
- **対象コレクションの取りこぼし**: schedule のみダンプして attendance を忘れる事故。修正対象が `firebase-service.js` 全体なら **schedule + attendance + customers + calendar** を全部取る。
- **複数月の attendance を1ヶ月分しか取らない**: `cleanupAutoAddedStudents` のような複数月にまたがる処理を扱う場合、過去6ヶ月分くらいは取得しておく。
- **個人情報の流出**: バックアップを `git add` してしまうと顧客データが GitHub に上がる。`/tmp/claude/` 配下は `.gitignore` 対象（worktree ルートに追記済み）。それ以外の場所に保存する場合は注意。
- **Firestore 書き込み中のバックアップ**: 修正が走っている最中にダンプすると整合性が崩れる。**修正前に1回、修正後に1回**（差分検証用）取るのがベスト。

## 参照

- `MEMORY.md` の `feedback_backup_before_changes.md`
- `.claude/rules/firestore-safety.md`
- `references/decision-log.md`（過去の Firestore 関連事故の経緯）
