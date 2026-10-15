// check：ADE repo 知識庫的語法檢查
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const runner = require('../lib/runner')
const { git, tmpdir, createAde, workdir } = require('./helpers')

const fm = (id, desc = '說明') => `---\nid: ${id}\ndescription: ${desc}\n---\n`

// 寫出 { 相對路徑: 內容 } 的 ADE repo；預設是一份能通過檢查的最小知識庫
function repo(overrides = {}) {
  const dir = tmpdir()
  const files = {
    'hub/CLAUDE.section.md': 'commit 前讀[commit 規範](kb:process/a1b2c3)\n',
    'hub/knowledge/README.md': '# 知識庫\n',
    'hub/knowledge/CONTEXT.md': '# 詞彙表\n',
    'hub/knowledge/process/README.md': fm('0f0f0f') + '# 流程\n',
    'hub/knowledge/process/git-commit.md': fm('a1b2c3') + '# commit\n',
    'hub/knowledge/process/_template.md': '# 範本\n',
    'hub/knowledge/process/flow/README.md': fm('bbbbbb') + '見[commit 規範](kb:process/a1b2c3)\n\n```md\n[例子](kb:bad)\n```\n寫成 `[文字](kb:<分類>/<id>)`\n',
    'hub/knowledge/process/flow/diagram.png': 'png',
    'hub/skills/ade-x/SKILL.md': '依[commit 規範](kb:process/a1b2c3)撰寫\n',
    ...overrides,
  }
  for (const [rel, body] of Object.entries(files)) {
    if (body === null) continue
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    fs.writeFileSync(path.join(dir, rel), body)
  }
  return dir
}

const errorsOf = (overrides) => runner.check(repo(overrides))

test('seed 的知識庫通過檢查', () => {
  assert.deepStrictEqual(runner.check(createAde(tmpdir())), [])
})

test('合法的知識庫通過檢查', () => {
  // 根目錄檔案、_ 開頭的範本不需要 id（INDEX.md 見 index.test.js）；附件不需要 id；程式碼內的 kb: 不檢查
  assert.deepStrictEqual(errorsOf(), [])
})

test('每個資料夾都必須有 README.md', () => {
  const errors = errorsOf({ 'hub/knowledge/process/flow/README.md': null })
  assert(errors.some((e) => e.startsWith(path.join('hub/knowledge/process/flow') + ': missing README.md')), errors.join('\n'))
})

test('需要 id 的檔案缺 id、id 格式錯誤、缺 description', () => {
  const errors = errorsOf({
    'hub/knowledge/process/a.md': '# 沒有 frontmatter\n',
    'hub/knowledge/process/b.md': fm('XYZ123'),
    'hub/knowledge/process/c.md': '---\nid: cccccc\n---\n',
  })
  assert(errors.some((e) => e.includes('a.md: missing id')), errors.join('\n'))
  assert(errors.some((e) => e.includes('b.md: invalid id "XYZ123"')), errors.join('\n'))
  assert(errors.some((e) => e.includes('c.md: missing description')), errors.join('\n'))
})

test('分類內的 id 不得重複，即使沒有被引用', () => {
  const errors = errorsOf({ 'hub/knowledge/process/dup.md': fm('0f0f0f') })
  assert.strictEqual(errors.filter((e) => e.includes('duplicate id 0f0f0f in category process')).length, 2, errors.join('\n'))
})

test('不同分類可以使用相同的 id', () => {
  assert.deepStrictEqual(
    errorsOf({ 'hub/knowledge/specs/README.md': fm('0f0f0f') }),
    []
  )
})

test('符號位址：語法錯誤、分類不存在、解析不到', () => {
  const errors = errorsOf({
    'hub/skills/ade-x/SKILL.md': '[a](kb:process/A1B2C3) [b](kb:nope/a1b2c3) [c](kb:process/ffffff)\n',
  })
  assert(errors.some((e) => e.includes('malformed symbol address kb:process/A1B2C3')), errors.join('\n'))
  assert(errors.some((e) => e.includes('unknown category in kb:nope/a1b2c3')), errors.join('\n'))
  assert(errors.some((e) => e.includes('kb:process/ffffff does not resolve')), errors.join('\n'))
})

test('符號位址對應到多份檔案', () => {
  const errors = errorsOf({ 'hub/knowledge/process/dup.md': fm('a1b2c3') })
  assert(errors.some((e) => e.includes('kb:process/a1b2c3 matches 2 files')), errors.join('\n'))
})

test('update 遇到檢查未通過只警告，照常更新', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const work = workdir(tmp, 'work')
  runner.init(work, ade)
  fs.writeFileSync(path.join(ade, 'hub/knowledge/process/no-id.md'), '# 缺 id 的知識\n')
  git('add -A', ade)
  git('commit -m no-id', ade)
  const warn = console.warn
  const warnings = []
  console.warn = (m) => warnings.push(m)
  try {
    runner.update(work)
  } finally {
    console.warn = warn
  }
  assert(warnings.some((w) => /knowledge base check problem/.test(w)), 'update 應印出檢查摘要')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')), 'update 應照常完成')
})
