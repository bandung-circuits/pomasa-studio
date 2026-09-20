background services

This folder contains packaging methods of background services.
So that Client can use them as a local function.
Avoid exposing websocket/http to outside.
If someone try to use background interface, 
please import functions of this folder.

can accept the events from background as well, for example,
file monitoring.

## host-adapter.js
唯一直接接触 dsh 宿主环境的模块：gated ctx 服务探测（`sf`/`hostService`）、
宿主 DOM 钩子（`[data-conversation-scroll]`、`[class*="sidebarCol"]`）、
宿主 `<body>` class（`setHostBodyClass`）、`/pomasa/diag` 诊断上报。
其他模块需要宿主能力时一律从这里取，不自行 querySelector 宿主 DOM 或
直写 `document.body.classList`。