# MAS-creator (host)

## 职责
MAS 生成脚手架：`mas.create`、生成状态/日志、`masSummary` 列表态推导。

## 现实现
[`create.js`](create.js)：
- 写 `workspace/`、`agents/`、`references/`、`user_input.md`
- 正常路径返回 `generation: 'client'` + `generationPrompt`（会话由 client 经 workspace 创建；提词语言跟表单蓝图语言，见 [`../prompts/README.md`](../prompts/README.md)）
- `fastGeneration` mock（verify / 测试）
- `isGenerationComplete`：pomasa.json + 全部 stage blueprint 存在

## 二期
- 生成器写入每阶段 `max_subagents`
- 多 orchestrator 命名 `00_orchestrator` / `10_orchestrator` 并登记
- 与 task-runner 预注册联动
