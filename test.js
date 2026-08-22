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
  assert(fs.existsSync(path.join(ade, '.claude/skills/ade-feedback-upstream/SKILL.md')), 'dot-claude 應改名為 .claude')
  assert(fs.readFileSync(path.join(ade, 'CLAUDE.md'), 'utf8').includes('my-ade'), 'CLAUDE.md 名稱應被替換')
  for (const s of ['ade-add-service', 'ade-add-skill', 'ade-add-process', 'ade-create-prd', 'ade-prd-to-spec', 'ade-help', 'ade-list-service']) {
    assert(
      fs.lstatSync(path.join(ade, '.claude/skills', s)).isSymbolicLink() &&
        fs.existsSync(path.join(ade, '.claude/skills', s, 'SKILL.md')),
      `${s} 應 symlink 進 ADE repo 的 .claude/skills 且可解析`
    )
  }
  assert('upstream' in JSON.parse(fs.readFileSync(path.join(ade, 'package.json'), 'utf8')).ade, 'ade.upstream 應寫入')
  assert.strictEqual(
    JSON.parse(fs.readFileSync(path.join(ade, 'package.json'), 'utf8')).dependencies['create-agentic-dev-env'],
    require('./package.json').version,
    '依賴應鎖精確版本（create 時蓋章，建立後與上游解耦）'
  )
  assert(!fs.readFileSync(path.join(ade, 'package.json'), 'utf8').includes('__ADE_NAME__'), '名稱應被替換')
  assert(fs.existsSync(path.join(ade, 'CONTEXT.md')), 'CONTEXT.md 詞彙表應存在')
  git('add -A', ade)
  git('commit -m init', ade)

  // init（模擬 pnpm dlx: 直接以 ADE repo 目錄為套件目錄）
  const work = path.join(tmp, 'work')
  fs.mkdirSync(work)
  fs.writeFileSync(path.join(work, 'CLAUDE.md'), '# 我的專案\n\n使用者原有內容\n')

  // repository.url 未填（FILL_ME）→ init 應在寫任何檔案前失敗，目錄乾淨、可重跑
  assert.throws(() => runner.init(work, ade), /repository\.url/, '未填 repository.url 應報錯')
  assert(!fs.existsSync(path.join(work, '.ade.json')), '失敗的 init 不應留下 .ade.json')
  assert(!fs.existsSync(path.join(work, '.claude')), '失敗的 init 不應留下 .claude')

  const pkgPath = path.join(ade, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.repository = { type: 'git', url: ade }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  git('add -A', ade)
  git('commit -m fill-url', ade)

  runner.init(work, ade)

  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/index.md')), '知識庫應複製')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.yaml')), '服務 YAML 模板應存在')
  assert(!fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.md')), '舊 md 服務模板應移除')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')), '分層規則 canonical 應複製')
  for (const f of ['README', 'state', 'gates', 'review', 'auto-pilot', 'batch', 'CHANGELOG']) {
    assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/process/ade-dev-workflow', f + '.md')), `ade-dev 規則檔應複製：${f}.md`)
  }
  assert(!fs.existsSync(path.join(work, '.claude/ade/knowledge/process/ade-dev-workflow/research')), 'research 不應隨 template 複製')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')), 'skills 應複製')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-align-spec/SKILL.md')), 'align-spec skill 應注入')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-spec-audit/SKILL.md')), 'spec-audit skill 應注入')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-add-skill/SKILL.md')), 'add-skill skill 應注入')
  for (const s of ['ade-create-prd', 'ade-prd-to-spec', 'ade-update', 'ade-help', 'ade-commit', 'ade-ship', 'ade-list-service', 'ade-dev', 'ade-dev-auto']) {
    assert(fs.existsSync(path.join(work, '.claude/skills', s, 'SKILL.md')), `${s} 應注入工作目錄`)
  }
  assert(!fs.existsSync(path.join(work, '.claude/skills/ade-feedback-upstream')), 'ADE repo 專用 skill 不應注入工作目錄')
  for (const f of ['ade-help/list-skills.sh', 'ade-create-prd/validate-prd.sh', 'ade-ship/templates/mr.md']) {
    assert(fs.existsSync(path.join(work, '.claude/skills', f)), `skill 附檔應隨目錄注入：${f}`)
  }
  assert(fs.existsSync(path.join(work, 'workspaces')), 'workspaces 應建立')
  assert(fs.readFileSync(path.join(work, '.gitignore'), 'utf8').split('\n').includes('workspaces'), '.gitignore 應含 workspaces')
  const md1 = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')
  assert(md1.includes('使用者原有內容') && md1.includes('<!-- ADE:BEGIN -->'), 'CLAUDE.md 應保留原內容並插入區段')

  // 重複 init 應被拒
  assert.throws(() => runner.init(work, ade), /update/, '重複 init 應報錯')

  // 損壞的 marker 應明確失敗而非靜默寫壞
  const work2 = path.join(tmp, 'work2')
  fs.mkdirSync(work2)
  fs.writeFileSync(path.join(work2, 'CLAUDE.md'), '<!-- ADE:END -->\n內容\n<!-- ADE:BEGIN -->\n')
  assert.throws(() => runner.init(work2, ade), /corrupted/, '顛倒的 marker 應報錯')

  // 自訂作業區：workspaces 建成指向既有資料夾的 symlink，update 沿用設定重建
  const work3 = path.join(tmp, 'work3')
  fs.mkdirSync(work3)
  fs.mkdirSync(path.join(tmp, 'shared-repos'))
  fs.mkdirSync(path.join(tmp, 'shared-repos', 'existing-repo'))
  runner.init(work3, ade, '../shared-repos')
  assert(fs.lstatSync(path.join(work3, 'workspaces')).isSymbolicLink(), 'workspaces 應為 symlink')
  assert(
    fs.existsSync(path.join(work3, 'workspaces', 'existing-repo')),
    'cd workspaces 應等同進入指定資料夾（既有 repo 可見）'
  )
  assert.strictEqual(
    JSON.parse(fs.readFileSync(path.join(work3, '.ade.json'), 'utf8')).workspaces,
    '../shared-repos',
    '.ade.json 應記錄 workspaces 目標'
  )
  const cfg3Path = path.join(work3, '.ade.json')
  const cfg3 = JSON.parse(fs.readFileSync(cfg3Path, 'utf8'))
  cfg3.source = ade
  fs.writeFileSync(cfg3Path, JSON.stringify(cfg3))
  runner.update(work3)
  assert(
    fs.lstatSync(path.join(work3, 'workspaces')).isSymbolicLink() &&
      JSON.parse(fs.readFileSync(cfg3Path, 'utf8')).workspaces === '../shared-repos',
    'update 應沿用設定並保留 symlink'
  )

  // 本地 ADE repo（source 為路徑）經 pnpm dlx file: 安裝時套件目錄不帶 .git → commit 應退問 source 取得
  const work5 = path.join(tmp, 'work5')
  fs.mkdirSync(work5)
  const packed = path.join(tmp, 'packed-ade')
  fs.cpSync(ade, packed, { recursive: true, filter: (p) => path.basename(p) !== '.git' })
  runner.init(work5, packed)
  assert.strictEqual(
    JSON.parse(fs.readFileSync(path.join(work5, '.ade.json'), 'utf8')).commit,
    git('rev-parse HEAD', ade).toString().trim(),
    '套件目錄無 .git 時 commit 應由 source 取得（否則新鮮度檢查永遠判定落後）'
  )

  // 既有實體 workspaces/ 目錄＋指定路徑 → 應報錯而非蓋掉
  const work4 = path.join(tmp, 'work4')
  fs.mkdirSync(path.join(work4, 'workspaces'), { recursive: true })
  assert.throws(() => runner.init(work4, ade, '../shared-repos'), /not a symlink/, '實體目錄應報錯')

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
