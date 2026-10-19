# core

Host core now only materializes the packaged POMASA skill snapshot (`skill.js`).

Everything else moved out:

- `paths/` — path resolution
- `data/descriptor.js` — pomasa.json parsing
- `MAS-manager/registry.js` — registry.json
- `task-manager/state.js` — unit/task disk layout
- `MAS-creator/prompt.js` — user_input + session prompts（系统提词 i18n 见 [`../prompts/README.md`](../prompts/README.md)）
- `report-exporter/export.js` — docx export
- `runtime/bootstrap.js` — ~/.pomasa template seed
- `runtime/mcp-servers.js` — MCP YAML reader
