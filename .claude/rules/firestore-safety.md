---
paths:
  - "new-app/js/app.js"
  - "new-app/js/firebase-service.js"
---

# Firestoreデータ安全ルール

- `schedule` コレクションは全月共通。生徒の追加・削除は全月に影響する
- ビジター/初回プランの生徒を削除するときは `attendance_YYYYMM` のみ削除すること
- レギュラープランの生徒のみ `schedule` から削除してよい
- `schedule` データを一括上書きする操作（`saveScheduleData`）は慎重に行うこと
- `defaultSchedule` で Firestore データを上書きしないこと（`Promise.allSettled` で処理）
- 出席データのキー形式は `曜日_場所_クラス名_姓名`。キー変更はデータ消失のリスクあり

## Gotchas（よくある失敗パターン）
- **scheduleの破壊的書き込み**: `saveScheduleData()`は全曜日を一括保存。1曜日だけ変えたつもりが他曜日のデータを上書きするリスク
- **出席キーの場所不一致**: スケジュールの場所名（千早）と出席キーの場所名（照葉）が不一致だと出席が表示されない
- **ビジター削除の副作用**: scheduleから削除すると全月から消える。必ずattendanceのみ削除
