#!/usr/bin/env bash
# 本地 CI（被 .githooks/pre-commit 调用；也可手动跑）：
#
#   bash scripts/ci.sh          # 全量：verify + 包完整性 + 固定 dsh 版本 e2e
#   SKIP_CI=1 git commit ...    # 逃生口：跳过钩子 CI（默认不允许偷懒时用）
#
# dsh 版本唯一来源：scripts/dsh-version。升级适配的 dsh 时只改那一行，
# 钩子会自动装新版本并在提交前把兼容性回归挡下来。
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ "${SKIP_CI:-0}" = "1" ]; then
  echo "SKIP_CI=1 — local CI skipped"
  exit 0
fi

export DSH_VERSION="$(cat scripts/dsh-version)"

# ---- 固定版 dsh：装进仓库内缓存，不碰全局 ----
CACHE="$ROOT/.dsh-ci"
if [ ! -x "$CACHE/node_modules/.bin/dsh" ] \
  || ! "$CACHE/node_modules/.bin/dsh" -V 2>/dev/null | grep -qF "$DSH_VERSION"; then
  echo "== local CI: install dsh@$DSH_VERSION into $CACHE =="
  rm -rf "$CACHE"
  npm install --prefix "$CACHE" --no-save "@deepseek-ai/dsh@$DSH_VERSION" >/dev/null
fi
export PATH="$CACHE/node_modules/.bin:$PATH"

# dsh 的插件管理器依赖 pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable pnpm >/dev/null 2>&1 || npm install -g pnpm@10 >/dev/null
fi
command -v pnpm >/dev/null 2>&1 || { echo "FAIL: 需要 pnpm（dsh 插件管理器依赖）" >&2; exit 1; }

echo "== local CI: verify + pack integrity (dsh $(dsh -V)) =="
npm run verify
npm run test:pack

echo "== local CI: browser e2e on pinned dsh host =="
npx playwright --version >/dev/null 2>&1 || { echo "FAIL: @playwright/test 未安装（先 npm install）" >&2; exit 1; }
npx playwright install chromium >/dev/null 2>&1
npm run test:e2e

echo "local CI OK (dsh $DSH_VERSION)"
