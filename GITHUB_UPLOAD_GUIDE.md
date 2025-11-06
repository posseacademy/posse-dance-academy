# 📤 GitHubアップロード完全ガイド

初心者向けに、GitHubへのアップロード手順を説明します。

---

## 🎯 このガイドのゴール

現在の単一HTMLファイルから、**メンテナンスしやすい分割構成**に変更してGitHubにアップロードします。

---

## 📝 事前準備

### 必要なもの

1. ✅ GitHubアカウント
2. ✅ Git（インストール済み）
3. ✅ テキストエディタ（VS Codeなど）

---

## 🚀 アップロード手順（3ステップ）

### ステップ1️⃣: ローカルにファイルを準備

#### 1-1. 既存のindex.htmlをバックアップ

```bash
# 既存のファイルをバックアップフォルダに移動
mkdir backup
cp index.html backup/index-backup-$(date +%Y%m%d).html
```

#### 1-2. 新しいファイルをダウンロード

Claudeから提供された以下のファイルをダウンロードして配置：

```
あなたのPC/posse-dance-academy/
├── index.html              ← 新しい軽量版
├── README.md               ← 使い方
├── .gitignore              ← ★重要
├── css/
│   └── style.css
├── js/
│   ├── config.example.js   ← テンプレート
│   ├── config.js           ← ★あなたが作成（後で）
│   ├── customer.js
│   ├── attendance.js
│   └── main.js
```

#### 1-3. Firebase設定ファイルを作成

```bash
# config.example.js をコピー
cd js
cp config.example.js config.js
```

**config.js を開いて、あなたのFirebase設定を貼り付けてください。**

---

### ステップ2️⃣: GitHubにアップロード

#### 2-1. ターミナルを開く

```bash
# プロジェクトフォルダに移動
cd /path/to/posse-dance-academy
```

#### 2-2. Gitリポジトリを初期化（初回のみ）

```bash
# 既にGitリポジトリの場合はスキップ
git init
```

#### 2-3. GitHubリポジトリと接続

```bash
# リモートリポジトリを設定（既に設定済みの場合はスキップ）
git remote add origin https://github.com/あなたのユーザー名/posse-dance-academy.git

# 確認
git remote -v
```

#### 2-4. ファイルをステージング

```bash
# 全てのファイルを追加
git add .

# 何が追加されるか確認
git status
```

**重要**: `js/config.js` が表示されていないことを確認してください！  
（`.gitignore` で自動的に除外されます）

#### 2-5. コミット

```bash
git commit -m "コード分割: メンテナンス性向上のためファイルを分割"
```

#### 2-6. プッシュ

```bash
# mainブランチにプッシュ
git push origin main
```

---

### ステップ3️⃣: GitHub上で確認

1. ブラウザで https://github.com/あなたのユーザー名/posse-dance-academy を開く
2. 以下のファイルが表示されていることを確認：

```
✅ index.html
✅ README.md
✅ .gitignore
✅ css/style.css
✅ js/config.example.js
✅ js/customer.js
✅ js/attendance.js
✅ js/main.js
```

3. **js/config.js が表示されていないことを確認**（セキュリティ対策で正常）

---

## 🎉 完了！

これで、以下のメリットが得られます：

✅ **エラーが見つけやすい**
- 問題のあるファイルだけ修正できる

✅ **機能追加が簡単**
- 新しい機能を別ファイルで追加

✅ **チーム開発可能**
- 他の人と同時に作業できる

✅ **セキュリティ向上**
- Firebase設定がGitHubに公開されない

---

## 📋 今後の作業フロー

### 機能を追加する場合

```bash
# 1. ファイルを編集
code js/customer.js

# 2. 動作確認
python3 -m http.server 8000

# 3. GitHubにアップロード
git add js/customer.js
git commit -m "機能追加: 検索機能を改善"
git push origin main
```

### 他のPCで作業する場合

```bash
# 1. リポジトリをクローン
git clone https://github.com/あなたのユーザー名/posse-dance-academy.git
cd posse-dance-academy

# 2. config.jsを作成
cp js/config.example.js js/config.js

# 3. config.jsにFirebase設定を貼り付け

# 4. ローカルサーバーで起動
python3 -m http.server 8000
```

---

## ❓ よくある質問

### Q1. git push でエラーが出る

```bash
# エラー: "Updates were rejected"
# 原因: リモートに新しい変更がある

# 解決策: 先にpullする
git pull origin main
git push origin main
```

### Q2. config.jsが間違ってアップロードされた

```bash
# GitHubから削除
git rm --cached js/config.js
git commit -m "Remove config.js from tracking"
git push origin main

# .gitignoreを確認
cat .gitignore  # js/config.js が含まれているか確認
```

### Q3. 変更を取り消したい

```bash
# まだcommitしていない場合
git checkout -- ファイル名

# 直前のcommitを取り消す
git reset --soft HEAD^
```

---

## 🆘 困ったときは

1. **ブラウザの開発者ツール（F12）でエラーを確認**
   - Console タブを見る
   - エラーメッセージをコピーして検索

2. **Gitのステータスを確認**
   ```bash
   git status
   git log --oneline
   ```

3. **GitHubのIssuesで質問**
   - エラーメッセージを添付
   - どの手順で問題が発生したか記載

---

**最終更新**: 2025年11月6日
