// init 與 update 完成時印在終端機上的畫面
const test = require('node:test')
const assert = require('assert')
const banner = require('../lib/banner')

const summary = {
  source: 'git@example.com:org/my-ade.git',
  prevCommit: '1111111aaaa',
  commit: '2222222bbbb',
  workspaces: null,
  skills: 12,
  added: ['ade-new'],
  removed: ['ade-old'],
}

test('update 的畫面列出版本變化與 skill 的增減', () => {
  const out = banner.render(summary, { version: '9.9.9', color: false })
  assert(out.includes('Forge updated'), out)
  assert(out.includes('1111111 → 2222222'), out)
  assert(out.includes('12 installed  (+ade-new, -ade-old)'), out)
  assert(out.includes('./workspaces'), out)
})

test('版本沒有變化時標示已是最新', () => {
  const out = banner.render({ ...summary, prevCommit: summary.commit, added: [], removed: [] }, { version: '9.9.9', color: false })
  assert(out.includes('2222222 (up to date)'), out)
  assert(!out.includes('→'), out)
})

test('init 的畫面只列出安裝的版本', () => {
  const out = banner.render({ ...summary, prevCommit: null, added: [], removed: [], workspaces: '~/projects' }, { version: '9.9.9', color: false })
  assert(out.includes('Forge initialized'), out)
  assert(/commit\s+2222222\n/.test(out), out)
  assert(out.includes('~/projects'), out)
})

test('color 為 false 時不輸出色碼', () => {
  assert(!banner.render(summary, { version: '9.9.9', color: false }).includes('\x1b['))
  assert(banner.render(summary, { version: '9.9.9', color: true }).includes('\x1b['))
})
