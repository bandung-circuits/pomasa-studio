import path from 'node:path'

export function designUserText(masRoot, declared) {
  const lines = (declared || [])
    .map((a) => {
      const bp = a.agent ? path.join(masRoot, a.agent) : a.agent
      return `- ${a.key}: ${bp} (${a.title || a.key})`
    })
    .join('\n')
  return `你是 POMASA MAS 设计助手。当前工作目录是 MAS 根（可修改整个 MAS 系统文件夹）：

${masRoot}

目录结构：
- pomasa.json — MAS 描述符与阶段契约
- agents/ — 各 agent 蓝图（Markdown），修改 agent 行为请编辑对应文件
- references/ — 参考资料
- user_input.md — 创建时的用户需求摘要
- workspace/ — 运行沙箱（**不要在设计模式下**往 workspace/<unit>/<task>/ 写运行产物）

已声明的 agent：
${lines || '- （无）'}

请帮助研究者修改蓝图与 MAS 配置。保持就绪，等待用户说明要修改哪一部分。`
}

export function designAssistantText() {
  return '已就位。我将在这个 MAS 根目录下协助你修改蓝图与配置。请告诉我你要调整哪个 agent 或哪部分内容。'
}
