// build-knowledge：seed 中第一份依新標準建立的知識與 skill
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const runner = require('../lib/runner')
const { tmpdir, createAde, workdir } = require('./helpers')

test('build-knowledge 的知識與 skill 通過 check', () => {
  const ade = createAde(tmpdir())
  // ponytail: 其餘 seed 尚未改寫（ade-jeb.21），只看與 build-knowledge 相關的錯誤；改寫完成後改成整份通過
  const errors = runner.check(ade).filter((e) => /build-knowledge|kb:process\/7caa6d|CLAUDE/.test(e))
  assert.deepStrictEqual(errors, [])
})

test('ade-build-knowledge 兩邊可用：ADE repo 內有 symlink，init 注入 ADE', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  assert(fs.lstatSync(path.join(ade, '.claude/skills/ade-build-knowledge')).isSymbolicLink(), 'ADE repo 應有 symlink')
  const work = workdir(tmp, 'work')
  runner.init(work, ade)
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-build-knowledge/new-id.sh')), 'skill 與附檔應注入 ADE')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/process/build-knowledge.md')), '規則應注入 ADE')
})

test('new-id.sh 輸出分類內未使用的 6 位十六進位 id', () => {
  const dir = tmpdir()
  fs.writeFileSync(path.join(dir, 'a.md'), '---\nid: aaaaaa\n---\n')
  const script = path.join(__dirname, '..', 'seed/hub/skills/ade-build-knowledge/new-id.sh')
  const id = execFileSync(script, [dir]).toString().trim()
  assert.match(id, /^[0-9a-f]{6}$/)
  assert.notStrictEqual(id, 'aaaaaa')
})
