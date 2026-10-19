# platform — 多平台统一入口

Host 侧 **darwin / win32 / linux** 差异只从 [`index.js`](index.js) 出去。

## 职责

- `modulePath(url)` — `import.meta.url` → 本地路径（禁止 `URL.pathname`）
- `isPathInside(target, base)` — 路径穿越防护（win32 大小写不敏感）
- `dshHome` / `userHome` / `execOptions`
- `buildRevealCommand` / `revealInFileManager` / `fileManagerLabel`

## 调用方

`paths/`、`file-system/reveal.js`、blueprint/artifact 越界检查、`file-monitor` 前缀匹配。
