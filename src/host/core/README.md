# core

Host core now only materializes the packaged POMASA skill snapshot (`skill.js`).

Everything else moved out:

- `paths/` — path resolution
- `data/descriptor.js` — pomasa.json parsing
- `MAS-manager/registry.js` — registry.json
- `task-manager/state.js` — unit/task disk layout
- `MAS-creator/prompt.js` — user_input + session prompts
- `report-exporter/export.js` — docx export
- `runtime/bootstrap.js` — ~/.pomasa template seed
- `runtime/mcp-servers.js` — MCP YAML reader
