#!/bin/bash
# 自動コミットフック（Stop イベント — Claude の応答完了ごとに実行）
# 未コミットの変更があれば「セッションチェックポイント」として自動コミットする。
# 意味のある節目では Claude が説明付きの手動コミットを別途作成する（併用運用）。
# フックとしてメイン処理を妨げないよう、いかなる場合も exit 0 で終了する。
#
# push はしない（2026-07-29 ユーザー決定）。push は取り消せないため手動のまま。
# 2026-07-29: 秘匿ファイルのガードを追加。`git add -A` は未追跡ファイルも取り込むため、
#             .gitignore の取りこぼしをここで二重に止める。

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT" || exit 0

# git リポジトリでなければ何もしない
git rev-parse --git-dir > /dev/null 2>&1 || exit 0

# 変更（未追跡ファイル含む）がなければ何もしない
[ -n "$(git status --porcelain 2>/dev/null)" ] || exit 0

# rebase / merge の途中なら触らない（安全側）
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
if [ -e "$GIT_DIR/MERGE_HEAD" ] || [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
  exit 0
fi

# ── 秘匿ファイルのガード（ファイル名ベース）────────────────────────
# コミット対象になりうるファイル名を検査し、認証情報らしきものがあれば中止する。
# ここで止めるのは「取り消せない事故」の手前で人間の目を入れるため。
# 誤検知しても実害は「自動コミットが1回見送られる」だけ（次の応答で再試行される）。
SECRET_RE='(^|/)\.env($|\.)|credential|secret|token|\.pem$|\.p12$|\.key$|service-?account.*\.json$|-key\.json$'
CANDIDATES=$(git status --porcelain 2>/dev/null | sed 's/^...//' | tr -d '"')
OFFENDERS=$(printf '%s\n' "$CANDIDATES" | grep -iE "$SECRET_RE" || true)

if [ -n "$OFFENDERS" ]; then
  mkdir -p .claude 2>/dev/null
  {
    echo "[$(date '+%Y-%m-%d %H:%M')] 自動コミットを中止しました（秘匿ファイルの疑い）"
    printf '%s\n' "$OFFENDERS" | sed 's/^/  - /'
    echo "  対応: .gitignore へ追加するか、意図した追跡なら手動でコミットしてください。"
    echo
  } >> .claude/auto-commit-blocked.log
  exit 0
fi

# ── 個人情報のガード（内容ベース）──────────────────────────────────
# 2026-08-10 追加。このリポジトリは PUBLIC で、Firestore のダンプには顧客131名の
# 氏名・住所・電話・生年月日が含まれる。ファイル名が無害でも中身で検出して止める。
# .gitignore との二重防御（秘匿情報と同じ方針）。
PII_RE='"memberNumber"|"phone1"|"birthDate"|"postalCode"|"guardianName"'
PII_OFFENDERS=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    *.json|*.csv|*.html|*.txt) ;;
    *) continue ;;
  esac
  [ -f "$f" ] || continue
  if grep -qE "$PII_RE" "$f" 2>/dev/null; then
    PII_OFFENDERS="${PII_OFFENDERS}${f}"$'\n'
  fi
done <<< "$CANDIDATES"

if [ -n "$PII_OFFENDERS" ]; then
  mkdir -p .claude 2>/dev/null
  {
    echo "[$(date '+%Y-%m-%d %H:%M')] 自動コミットを中止しました（個人情報の疑い）"
    printf '%s' "$PII_OFFENDERS" | sed 's/^/  - /'
    echo "  このリポジトリは PUBLIC です。顧客データを含むファイルはコミットしないでください。"
    echo "  対応: リポジトリ外へ移動するか、.gitignore へ追加してください。"
    echo
  } >> .claude/auto-commit-blocked.log
  exit 0
fi
# ────────────────────────────────────────────────────────────────

CHANGED=$(git status --porcelain | wc -l | tr -d ' ')
git add -A 2>/dev/null
git commit --quiet -m "auto: session checkpoint (${CHANGED} files, $(date '+%Y-%m-%d %H:%M'))" 2>/dev/null || true
exit 0
