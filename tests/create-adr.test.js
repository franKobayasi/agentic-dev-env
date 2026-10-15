// create-adr：ADR 的 skill、範本與索引腳本，ADE 與 Forge 兩邊都可用
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const runner = require('../lib/runner')
const { git, tmpdir, createAde, workdir } = require('./helpers')

const script = path.join(__dirname, '..', 'seed/hub/skills/ade-create-adr/adr.js')
const adr = (cmd, dir, opts = {}) => spawnSync('node', [script, cmd, dir], { encoding: 'utf8', ...opts })

test('ade-create-adr 兩邊可用：ADE 內有 symlink 與 docs/adr/，init 注入 Forge', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  assert(fs.lstatSync(path.join(ade, '.claude/skills/ade-create-adr')).isSymbolicLink(), 'ADE 應有 symlink')
  assert.strictEqual(adr('check', path.join(ade, 'docs/adr')).status, 0, 'ADE 的空 ADR 目錄應通過檢查')
  const forge = workdir(tmp, 'forge')
  runner.init(forge, ade)
  for (const f of ['adr.js', 'template.md']) {
    assert(fs.existsSync(path.join(forge, '.claude/skills/ade-create-adr', f)), `${f} 應注入 Forge`)
  }
  assert(!fs.existsSync(path.join(forge, '.claude/ade/docs')), 'ADE 的 docs/ 不注入 Forge')
})

test('adr.js sync 依指定目錄產生索引，check 擋下不連續的編號', () => {
  const dir = tmpdir()
  const write = (file, title) => fs.writeFileSync(path.join(dir, file),
    `---\nstatus: accepted\ndate: 2026-01-01\noutcome: "${title}的結論"\n---\n\n# ${title}\n`)
  write('0001-first.md', '第一份')
  assert.strictEqual(adr('sync', dir).status, 0)
  assert.match(fs.readFileSync(path.join(dir, 'INDEX.md'), 'utf8'), /\| \[0001\]\(\.\/0001-first\.md\) \| 第一份 \| `accepted` \| 第一份的結論 \|/)
  assert.strictEqual(adr('check', dir).status, 0)
  write('0003-third.md', '第三份')
  const r = adr('check', dir)
  assert.notStrictEqual(r.status, 0)
  assert.match(r.stderr, /編號應為 0002/)
})

test('adr.js 在 git hook 的環境（設有 GIT_DIR）中不把既有 ADR 誤判為刪除', () => {
  const repo = tmpdir()
  const dir = path.join(repo, 'docs/adr')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '0001-first.md'), '---\nstatus: accepted\ndate: 2026-01-01\noutcome: "結論"\n---\n\n# 第一份\n')
  git('init -q -b main', repo)
  assert.strictEqual(adr('sync', dir).status, 0)
  git('add -A', repo)
  git('commit -qm init', repo)
  git('switch -qc feature', repo)
  const r = adr('check', 'docs/adr', { cwd: repo, env: { ...process.env, GIT_DIR: path.join(repo, '.git') } })
  assert.strictEqual(r.status, 0, r.stderr)
})
