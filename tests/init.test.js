// init：把 ADE repo 注入工作目錄（以 ADE repo 目錄模擬 pnpm dlx 的套件目錄）
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const runner = require('../lib/runner')
const { git, tmpdir, create, setUrl, createAde, workdir, readJson } = require('./helpers')

test('repository.url 未填時，init 在寫任何檔案前失敗，目錄乾淨、可重跑', () => {
  const tmp = tmpdir()
  const ade = create(tmp)
  const work = workdir(tmp, 'work')
  assert.throws(() => runner.init(work, ade), /repository\.url/, '未填 repository.url 應報錯')
  assert(!fs.existsSync(path.join(work, '.ade.json')), '失敗的 init 不應留下 .ade.json')
  assert(!fs.existsSync(path.join(work, '.claude')), '失敗的 init 不應留下 .claude')
  setUrl(ade, ade)
  runner.init(work, ade)
  assert(fs.existsSync(path.join(work, '.ade.json')), '補上 url 後 init 應可重跑')
})

test('init 注入知識庫、skill 與常駐區段', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const work = workdir(tmp, 'work')
  runner.init(work, ade)

  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/index.md')), '知識庫應複製')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.yaml')), '服務 YAML 模板應存在')
  assert(!fs.existsSync(path.join(work, '.claude/ade/knowledge/services/_template.md')), '舊 md 服務模板應移除')
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')), '分層規則 canonical 應複製')
  for (const f of ['README', 'state', 'gates', 'review', 'auto-pilot', 'batch', 'CHANGELOG']) {
    assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/process/ade-dev-workflow', f + '.md')), `ade-dev 規則檔應複製：${f}.md`)
  }
  assert(!fs.existsSync(path.join(work, '.claude/ade/knowledge/process/ade-dev-workflow/research')), 'research 不應隨 seed 複製')
  assert(!fs.existsSync(path.join(work, '.claude/ade/UPSTREAM-CANDIDATES.md')), 'ADE repo 根目錄檔案不應複製進工作目錄')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')), 'skills 應複製')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-align-spec/SKILL.md')), 'align-spec skill 應注入')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-spec-audit/SKILL.md')), 'spec-audit skill 應注入')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-add-skill/SKILL.md')), 'add-skill skill 應注入')
  for (const s of ['ade-create-prd', 'ade-prd-to-spec', 'ade-update', 'ade-help', 'ade-commit', 'ade-ship', 'ade-list-service', 'ade-dev', 'ade-dev-auto', 'ade-config']) {
    assert(fs.existsSync(path.join(work, '.claude/skills', s, 'SKILL.md')), `${s} 應注入工作目錄`)
  }
  assert(!fs.existsSync(path.join(work, '.claude/skills/ade-feedback-upstream')), 'ADE repo 專用 skill 不應注入工作目錄')
  for (const f of ['ade-help/list-skills.sh', 'ade-create-prd/validate-prd.sh', 'ade-ship/templates/mr.md']) {
    assert(fs.existsSync(path.join(work, '.claude/skills', f)), `skill 附檔應隨目錄注入：${f}`)
  }
  assert(fs.existsSync(path.join(work, 'workspaces')), 'workspaces 應建立')
  assert(fs.readFileSync(path.join(work, '.gitignore'), 'utf8').split('\n').includes('workspaces'), '.gitignore 應含 workspaces')
  const md = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')
  assert(md.includes('使用者原有內容') && md.includes('<!-- ADE:BEGIN -->'), 'CLAUDE.md 應保留原內容並插入區段')

  assert.throws(() => runner.init(work, ade), /update/, '重複 init 應報錯')
})

test('損壞的 marker 應明確失敗而非靜默寫壞', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const work = path.join(tmp, 'work')
  fs.mkdirSync(work)
  fs.writeFileSync(path.join(work, 'CLAUDE.md'), '<!-- ADE:END -->\n內容\n<!-- ADE:BEGIN -->\n')
  assert.throws(() => runner.init(work, ade), /corrupted/, '顛倒的 marker 應報錯')
})

test('自訂作業區：workspaces 建成指向既有資料夾的 symlink', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  fs.mkdirSync(path.join(tmp, 'shared-repos', 'existing-repo'), { recursive: true })

  const work = workdir(tmp, 'work')
  runner.init(work, ade, '../shared-repos')
  assert(fs.lstatSync(path.join(work, 'workspaces')).isSymbolicLink(), 'workspaces 應為 symlink')
  assert(fs.existsSync(path.join(work, 'workspaces', 'existing-repo')), 'cd workspaces 應等同進入指定資料夾（既有 repo 可見）')
  assert.strictEqual(readJson(path.join(work, '.ade.json')).workspaces, '../shared-repos', '.ade.json 應記錄 workspaces 目標')

  // 既有實體 workspaces/：空的直接換成 symlink（init 預設就建空目錄，之後改位置不該卡住）；非空才報錯
  const empty = path.join(tmp, 'work-empty')
  fs.mkdirSync(path.join(empty, 'workspaces'), { recursive: true })
  runner.init(empty, ade, '../shared-repos')
  assert(fs.lstatSync(path.join(empty, 'workspaces')).isSymbolicLink(), '空的實體 workspaces 應被換成 symlink')
  const full = path.join(tmp, 'work-full')
  fs.mkdirSync(path.join(full, 'workspaces', 'my-repo'), { recursive: true })
  assert.throws(() => runner.init(full, ade, '../shared-repos'), /not a symlink/, '非空實體目錄應報錯')
})

test('套件目錄無 .git 時，commit 由 source 取得', () => {
  // 本地 ADE repo 經 pnpm dlx file: 安裝時套件目錄不帶 .git
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const packed = path.join(tmp, 'packed-ade')
  fs.cpSync(ade, packed, { recursive: true, filter: (p) => path.basename(p) !== '.git' })
  const work = workdir(tmp, 'work')
  runner.init(work, packed)
  assert.strictEqual(
    readJson(path.join(work, '.ade.json')).commit,
    git('rev-parse HEAD', ade).toString().trim(),
    '套件目錄無 .git 時 commit 應由 source 取得（否則新鮮度檢查永遠判定落後）'
  )
})

test('沒有 commit 的 ADE repo，init 在寫檔前失敗', () => {
  // 本地模式：create 之後忘了 commit
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const emptyAde = path.join(tmp, 'empty-ade')
  fs.cpSync(ade, emptyAde, { recursive: true, filter: (p) => path.basename(p) !== '.git' })
  git('init -q', emptyAde)
  const pkg = readJson(path.join(ade, 'package.json'))
  fs.writeFileSync(path.join(emptyAde, 'package.json'), JSON.stringify({ ...pkg, repository: { type: 'git', url: emptyAde } }))
  const work = workdir(tmp, 'work')
  assert.throws(() => runner.init(work, emptyAde), /commit/, '無 commit 的 ADE repo 應報錯')
  assert(!fs.existsSync(path.join(work, '.ade.json')) && !fs.existsSync(path.join(work, '.claude')), '失敗的 init 不應留下檔案')
})
