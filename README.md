# 🎵 posse dance academy 顧客管理システム

ダンススタジオの顧客管理・出席記録を行うWebアプリケーションです。

## 📋 目次

- [機能](#機能)
- [初回セットアップ](#初回セットアップ)
- [開発方法](#開発方法)
- [ファイル構成](#ファイル構成)
- [よくある質問](#よくある質問)

---

## ✨ 機能

- **顧客管理**: 会員情報の登録・編集・削除
- **出席記録**: クラスごとの出席状況管理
- **ダッシュボード**: 会員数・売上の可視化
- **CSVエクスポート**: データのバックアップ

---

## 🚀 初回セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/あなたのユーザー名/posse-dance-academy.git
cd posse-dance-academy
```

### 2. Firebase設定ファイルを作成

```bash
# config.example.js をコピー
cp js/config.example.js js/config.js
```

### 3. config.js を編集

`js/config.js` を開いて、Firebaseコンソールから取得した設定を貼り付けます。

```javascript
export const firebaseConfig = {
    apiKey: "あなたのAPIキー",
    authDomain: "あなたのプロジェクト.firebaseapp.com",
    projectId: "あなたのプロジェクトID",
    // ...以下同様
};
```

### 4. ローカルサーバーで起動

```bash
# Python 3を使用する場合
python3 -m http.server 8000

# または、VS CodeのLive Serverを使用
```

ブラウザで `http://localhost:8000` を開きます。

---

## 💻 開発方法

### ファイルを編集する

```bash
# 顧客管理機能を編集
code js/customer.js

# デザインを編集
code css/style.css
```

### GitHubにプッシュ

```bash
git add .
git commit -m "機能追加: ○○を実装"
git push origin main
```

⚠️ **重要**: `js/config.js` は `.gitignore` で除外されているため、GitHubにアップロードされません（セキュリティ対策）

---

## 📁 ファイル構成

```
posse-dance-academy/
├── index.html              # メインHTML
├── README.md               # このファイル
├── .gitignore              # アップロード除外設定
├── css/
│   └── style.css          # スタイルシート
├── js/
│   ├── config.example.js  # Firebase設定テンプレート
│   ├── config.js          # Firebase設定（Git除外）
│   ├── customer.js        # 顧客管理機能
│   ├── attendance.js      # 出席管理機能
│   └── main.js            # アプリ起動
└── legacy/
    └── index-full.html    # 旧バージョン（バックアップ）
```

---

## 📖 よくある質問

### Q1. エラーが出て起動しない

**A**: ブラウザの開発者ツール（F12）でエラー内容を確認してください。

よくあるエラー：
- `config.js not found` → config.jsを作成してください
- `Firebase initialization failed` → Firebase設定が間違っています

### Q2. GitHubにconfig.jsがアップロードされない

**A**: 正常です。`.gitignore` で除外されています（セキュリティ対策）

他の開発者には `config.example.js` をコピーして設定してもらいます。

### Q3. 既存のindex.htmlはどうなる？

**A**: `legacy/` フォルダにバックアップとして保存してください。

```bash
mkdir legacy
mv index-old.html legacy/index-full.html
```

### Q4. どのファイルをGitHubにアップロードすれば良い？

**A**: 以下をアップロードします：

✅ アップロードする：
- index.html
- README.md
- .gitignore
- css/style.css
- js/config.example.js
- js/customer.js
- js/attendance.js
- js/main.js

❌ アップロードしない：
- js/config.js（自動的に除外されます）

---

## 🔧 トラブルシューティング

### エラー: "CORS policy"

ローカルサーバーを使用してください（ファイルを直接開くとエラーになります）

```bash
python3 -m http.server 8000
```

### エラー: "Module not found"

ブラウザがES6モジュールに対応していない可能性があります。
最新版のChrome、Firefox、Safariを使用してください。

---

## 📞 サポート

問題が解決しない場合は、GitHubのIssuesで質問してください。

---

## 📝 ライセンス

MIT License

---

**開発者**: posse dance academy  
**最終更新**: 2025年11月
