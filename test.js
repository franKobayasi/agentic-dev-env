// 端到端自測: create → init → update
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')
const runner = require('./lib/runner')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ade-test-'))
const git = (cmd, cwd) =>
  execSync(`git -c user.email=t@t -c user.name=t ${cmd}`, { cwd, stdio: 'pipe' })

try {
  // create
  execSync(`node "${path.join(__dirname, 'bin', 'create.js')}" my-ade`, { cwd: tmp, stdio: 'pipe' })
  const ade = path.join(tmp, 'my-ade')
  assert(fs.existsSync(path.join(ade, '.gitignore')), 'gitignore 應改名為 .gitignore')
  assert(fs.existsSync(path.join(ade, '.claude/skills/ade-create-prd/SKILL.md')), 'dot-claude 應改名為 .claude')
  assert(fs.readFileSync(path.join(ade, 'CLAUDE.md'), 'utf8').includes('my-ade'), 'CLAUDE.md 名稱應被替換')
  assert(fs.existsSync(path.join(ade, '.claude/skills/ade-feedback-upstream/SKILL.md')), 'feedback-upstream skill 應存在')
  assert('upstream' in JSON.parse(fs.readFileSync(path.join(ade, 'package.json'), 'utf8')).ade, 'ade.upstream 應寫入')
  assert(!fs.readFileSync(path.join(ade, 'package.json'), 'utf8').includes('__ADE_NAME__'), '名稱應被替換')
  git('add -A', ade)
  git('commit -m init', ade)

  // init（模擬 pnpm dlx: 直接以 ADE repo 目錄為套件目錄）
  const work = path.join(tmp, 'work')
  fs.mkdirSync(work)
  fs.writeFileSync(path.join(work, 'CLAUDE.md'), '# 我的專案\n\n使用者原有內容\n')
  runner.init(work, ade)

  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/index.md')), '知識庫應複製')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.yaml')), '服務 YAML 模板應存在')
  assert(!fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.md')), '舊 md 服務模板應移除')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')), '分層規則 canonical 應複製')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')), 'skills 應複製')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-align-spec/SKILL.md')), 'align-spec skill 應注入')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-spec-audit/SKILL.md')), 'spec-audit skill 應注入')
  assert(!fs.existsSync(path.join(work, '.claude/skills/ade-create-prd')), 'ADE repo 專用 skill 不應注入工作目錄')
  assert(fs.existsSync(path.join(work, 'workspaces')), 'workspaces 應建立')
  assert(fs.readFileSync(path.join(work, '.gitignore'), 'utf8').includes('workspaces/'), '.gitignore 應含 workspaces/')
  const md1 = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')
  assert(md1.includes('使用者原有內容') && md1.includes('<!-- ADE:BEGIN -->'), 'CLAUDE.md 應保留原內容並插入區段')

  // 重複 init 應被拒
  assert.throws(() => runner.init(work, ade), /update/, '重複 init 應報錯')

  // 損壞的 marker 應明確失敗而非靜默寫壞
  const work2 = path.join(tmp, 'work2')
  fs.mkdirSync(work2)
  fs.writeFileSync(path.join(work2, 'CLAUDE.md'), '<!-- ADE:END -->\n內容\n<!-- ADE:BEGIN -->\n')
  assert.throws(() => runner.init(work2, ade), /損壞/, '顛倒的 marker 應報錯')

  // update: 指向本地 ADE repo，模擬上游更新
  const cfgPath = path.join(work, '.ade.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  cfg.source = ade
  fs.writeFileSync(cfgPath, JSON.stringify(cfg))
  fs.appendFileSync(path.join(ade, 'knowledge/services/index.md'), '\n上游新知識\n')
  fs.rmSync(path.join(ade, 'skills/ade-add-service'), { recursive: true })
  git('add -A', ade)
  git('commit -m update', ade)
  fs.writeFileSync(path.join(work, '.claude/ade/knowledge/services/index.md'), '本地竄改')

  runner.update(work)

  const idx = fs.readFileSync(path.join(work, '.claude/ade/knowledge/services/index.md'), 'utf8')
  assert(idx.includes('上游新知識') && !idx.includes('本地竄改'), 'update 應覆蓋 managed 內容')
  assert(!fs.existsSync(path.join(work, '.claude/skills/ade-add-service')), '上游刪除的 skill 應同步移除')
  const md2 = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')
  assert(md2.includes('使用者原有內容'), 'update 不應動到使用者內容')
  assert(md2.split('<!-- ADE:BEGIN -->').length === 2, '區段不應重複插入')
  assert(JSON.parse(fs.readFileSync(cfgPath, 'utf8')).commit, '.ade.json 應記錄 commit')

  // 非 ade- 前綴的 skill 應被拒裝（在破壞前驗證）
  fs.mkdirSync(path.join(ade, 'skills/rogue'))
  fs.writeFileSync(path.join(ade, 'skills/rogue/SKILL.md'), 'x')
  git('add -A', ade)
  git('commit -m rogue', ade)
  assert.throws(() => runner.update(work), /ade-/, '非 ade- 前綴 skill 應報錯')

  console.log('全部通過')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
