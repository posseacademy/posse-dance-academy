---
name: firestore-inspect
description: >
  Firestoreのデータを調査・検証する。「データを確認して」「売上が合わない」「出席が正しいか確認」
  「Firestoreの中身を見て」と言われたときに使用。ブラウザコンソール経由でFirestoreに
  クエリを実行し、データの整合性を検証する。
allowed-tools: Read, Grep, Glob
model: claude-opus-5
---

## 手順

1. **対象の特定**: 確認したいコレクション・ドキュメントを特定
2. **ブラウザコンソールでクエリ実行**: 本番サイト上でFirebase SDKを使ってデータ取得
3. **データ検証**: スケジュール↔出席↔売上計算の整合性をチェック
4. **結果報告**: 問題があれば具体的な修正案を提示

## 出力フォーマット

```
## Firestore検査レポート
### [コレクション名]
- ドキュメント数: N件
- 検査項目: [何を確認したか]
- 結果: ✅ 正常 / ⚠️ 問題あり
- 詳細: [具体的なデータ]
```

## よく使うクエリパターン

### schedule確認
```javascript
const doc = await getDoc(doc(db, 'schedule', '火曜日'));
doc.data().classes.map(c => ({ name: c.name, students: c.students.length }));
```

### attendance確認
```javascript
const snapshot = await getDocs(collection(db, 'attendance_202603'));
snapshot.forEach(d => console.log(d.id, d.data()._plan));
```

### 売上検証
```javascript
// _plan付きのビジター/初回をカウント
snapshot.forEach(d => {
    const plan = d.data()._plan;
    if (plan?.includes('ビジター')) { /* カウント */ }
});
```

## 注意事項
- 読み取りのみ。書き込みは`data-recovery`スキルで行う
- Firestore接続は初回10秒程度かかる場合がある

## Gotchas（よくある失敗パターン）
- **初回接続タイムアウト**: ページロード直後はFirestoreが未接続の場合がある。手動クエリで先に接続を確立してからアプリをリロード
- **attendanceの_plan不在**: 古いデータには_planフィールドがない。studentNameベースで逆引きが必要
- **イベント用ドキュメント混入**: scheduleコレクションに「イベント」ドキュメントがある。曜日フィルター時に注意
