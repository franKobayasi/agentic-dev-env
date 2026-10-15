// create：由 seed 產生 ADE repo
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { tmpdir, create, readJson } = require('./helpers')

test('create 產出的 ADE repo 結構', () => {
  const ade = create(tmpdir())
  assert(fs.existsSync(path.join(ade, '.gitignore')), 'gitignore 應改名為 .gitignore')
  assert(fs.statSync(path.join(ade, '.githooks/pre-commit')).mode & 0o111, 'pre-commit hook 應歸位為 .githooks 且可執行')
  for (const d of ['repo', 'skills', 'githooks', 'dot-claude', 'claude-md']) {
    assert(!fs.existsSync(path.join(ade, d)), `seed 的分層與舊結構目錄不應出現在 ADE repo 根：${d}`)
  }
  // .claude/skills/：實體目錄是 ADE repo 專用（來自 seed/repo/skills/），symlink 是 hub/skills/ 中宣告 ade-scope: both 的
  const repoSkills = path.join(ade, '.claude/skills')
  for (const d of fs.readdirSync(repoSkills)) {
    assert(fs.existsSync(path.join(repoSkills, d, 'SKILL.md')), `.claude/skills/${d} 應可解析`)
  }
  assert(fs.readFileSync(path.join(ade, 'CLAUDE.md'), 'utf8').includes('my-ade'), 'CLAUDE.md 名稱應被替換')
  assert(fs.lstatSync(path.join(repoSkills, 'ade-feedback-upstream')).isDirectory(), 'ADE repo 專用 skill 應為 .claude/skills 下的實體目錄')
  assert.strictEqual(fs.readlinkSync(path.join(repoSkills, 'ade-create-prd')), path.join('..', '..', 'hub', 'skills', 'ade-create-prd'), 'ade-scope: both 的 skill 應 symlink 進 .claude/skills')
  assert(!fs.existsSync(path.join(repoSkills, 'ade-ship')), '未宣告 both 的 hub skill 不應出現在 ADE repo 的 .claude/skills')
  const pkg = readJson(path.join(ade, 'package.json'))
  assert('upstream' in pkg.ade, 'ade.upstream 應寫入')
  assert.strictEqual(pkg.scripts.check, 'node cli.js check', 'ADE repo 應提供 check 指令')
  assert.strictEqual(
    pkg.dependencies['create-agentic-dev-env'],
    require('../package.json').version,
    '依賴應鎖精確版本（create 時蓋章，建立後與上游解耦）'
  )
  assert(!fs.readFileSync(path.join(ade, 'package.json'), 'utf8').includes('__ADE_NAME__'), '名稱應被替換')
  assert(fs.existsSync(path.join(ade, 'hub/knowledge/CONTEXT.md')), '詞彙表應位於知識庫根目錄')
  assert(!fs.existsSync(path.join(ade, 'CONTEXT.md')), 'ADE repo 根目錄不應另有詞彙表')
  assert(fs.existsSync(path.join(ade, 'UPSTREAM-CANDIDATES.md')), 'UPSTREAM-CANDIDATES.md 應存在')
})

test('pre-commit hook 在尚未安裝依賴時略過檢查而不擋下 commit', () => {
  const ade = create(tmpdir())
  const r = spawnSync(path.join(ade, '.githooks/pre-commit'), { cwd: ade, encoding: 'utf8' })
  assert.strictEqual(r.status, 0)
  assert.match(r.stderr, /pnpm install/)
})
