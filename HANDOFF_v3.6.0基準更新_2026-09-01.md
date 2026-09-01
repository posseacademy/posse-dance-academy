# 【受信用ダイジェスト】v3.6.0 基準更新（価格恒久化・委譲抑制対策・CLI 制約）— posse

**発行**: 2026-09-01・統括 Clude開発
**正本（詳細はこちら）**: `/Users/ATSUSHITO_RYCE/CLAUDE/AD_シニア漫画/works/HANDOFF_v3.6.0基準更新_価格恒久化と委譲抑制対策_2026-09-01.md`

## やること（期限なし・次回セッションで）

```
/upgrade-project platform
```

検査 → レポート → **承認** → 修正 の順。承認前の勝手な編集はしない。**自部署の既存実装（独自の例外規定・フック・deny/ask）を上書きしない** — 照合してから適用。

## 要点4つ

1. **【即時・事実訂正】Sonnet 5 の値上げ（$3/$15）は中止** — $2/$10 が恒久標準価格（2026-08-10 発表・公式逐語確認済み）。値上げ前提のコスト試算があれば訂正。トークナイザー +30% は Claude 4.7 以降の全世代共通（相対コスト比は不変・絶対額のみ ~1.3×）
2. **委譲抑制（#80988）続報**: 抑制されるのは裁量形の指示で、エージェント名＋起動条件の名指し形は通る。CLAUDE.md に**「承認日つき standing-authorization ブロック」**を追加（検査項目 P7。**実際の承認なしに書かない・日付は自部署の実承認日**）。無人経路（スケジュール実行等）の品質ゲートは PreToolUse/Stop フックか外部 CI へ。SessionStart フックは注入経路として無効。既存の `@agent-` 明示起動パスは維持（置換ではなく追加）
3. **CLI 制約（検査項目 P8）**: Todo/Task 系ツールが現行モデルで既定オフ／project settings の env にパス系変数（TMPDIR 等）を書けない／sandbox.ripgrep は project から効かない／`Bash(git * main)` 型のワイルドカード前置 allow に警告
4. **外部共有スキルの6フィールド制約**（claude.ai / Skills API 等で使う予定があるスキルのみ）: name / description / license / compatibility / metadata / allowed-tools 以外はハードエラー
