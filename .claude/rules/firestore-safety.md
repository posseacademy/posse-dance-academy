---
paths:
  - "new-app/js/app.js"
  - "new-app/js/firebase-service.js"
  - "posse/new-app/js/app.js"
  - "posse/new-app/js/firebase-service.js"
---

# Firestoreデータ安全ルール

- `schedule` コレクションは全月共通。生徒の追加・削除は全月に影響する
- ビジター/初回プランの生徒を削除するときは `attendance_YYYYMM` のみ削除すること
- レギュラープランの生徒のみ `schedule` から削除してよい
- `schedule` データを一括上書きする操作（`saveScheduleData`）は慎重に行うこと
- `defaultSchedule` で Firestore データを上書きしないこと（`Promise.allSettled` で処理）
- 出席データのキー形式は `曜日_場所_クラス名_姓名`。キー変更はデータ消失のリスクあり
