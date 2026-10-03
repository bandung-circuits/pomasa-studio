// dsh web 0.2.x e2e 适配：
// 1) token 鉴权：0.2.x 起 web host 强制 token，首次访问带 ?token= 的 URL 会
//    下发 HttpOnly cookie，之后同源导航与 fetch 自动携带。本 fixture 在每个
//    page 创建时先访问一次入口 URL（由 e2e/servers.mjs 写入 .dsh-e2e-url）。
// 2) 命中测试：dsh web 主界面是全屏 shell（空态引导层 _root/_mask 会拦截
//    指针事件），应用以 shell.overlay 覆盖其上，locator.click 的 actionability
//    检查会被 shell 压死。与 spec 内 click() helper 同思路，这里在 Locator
//    原型层统一降级为程序化派发（等待元素就绪后 el.click()），spec 无需逐处改。
import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const URL_FILE = join(dirname(fileURLToPath(import.meta.url)), '.dsh-e2e-url')

function entryUrl(): string {
  return readFileSync(URL_FILE, 'utf8').trim()
}

// 程序化点击：等元素出现再 el.click()（不经过 hit-testing）。命中测试语义由
// spec 断言保证；真实浏览器手工路径不受影响。@playwright/test 不直接导出
// Locator 类，从实例取原型打补丁（同一测试进程内所有 locator 共享该类）。
let clickPatched = false
function patchLocatorClick(page: Page) {
  if (clickPatched) return
  const proto = Object.getPrototypeOf(page.locator('body')) as {
    click: (options?: any) => Promise<void>
  }
  const origClick = proto.click
  proto.click = function (this: Locator, options?: any) {
    return this.evaluate((el) => (el as HTMLElement).click())
      .catch(() => origClick.call(this, options))
  }
  clickPatched = true
}

export const test = base.extend({
  page: async ({ page }, use) => {
    patchLocatorClick(page)
    const entry = entryUrl()
    await page.goto(entry, { waitUntil: 'domcontentloaded' })
    // 回到根路径，使 spec 里首个 goto('/') 行为与旧版一致。
    await page.goto(new URL('/', entry).toString(), { waitUntil: 'domcontentloaded' })
    await use(page)
  },
})

export { expect }
