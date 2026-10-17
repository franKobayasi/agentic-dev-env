// update：從 source 重新取得 ADE repo，覆蓋 managed 區域
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const runner = require('../lib/runner')
const { git, tmpdir, createAde, workdir, readJson } = require('./helpers')

// 已 init 的工作目錄，source 指向本地 ADE repo
function installed() {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  const work = workdir(tmp, 'work')
  runner.init(work, ade)
  return { tmp, ade, work, cfgPath: path.join(work, '.ade.json') }
}

test('update 覆蓋 managed 內容、同步刪除上游移除的 skill', () => {
  const { ade, work, cfgPath } = installed()
  fs.appendFileSync(path.join(ade, 'hub/knowledge/services/README.md'), '\n上游新知識\n')
  fs.rmSync(path.join(ade, 'hub/skills/ade-add-service'), { recursive: true })
  fs.rmSync(path.join(ade, '.claude/skills/ade-add-service'))
  git('add -A', ade)
  git('commit -m update', ade)
  fs.writeFileSync(path.join(work, '.claude/ade/knowledge/services/README.md'), '本地竄改')

  runner.update(work)

  const idx = fs.readFileSync(path.join(work, '.claude/ade/knowledge/services/README.md'), 'utf8')
  assert(idx.includes('上游新知識') && !idx.includes('本地竄改'), 'update 應覆蓋 managed 內容')
  assert(!fs.existsSync(path.join(work, '.claude/skills/ade-add-service')), '上游刪除的 skill 應同步移除')
  const md = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')
  assert(md.includes('使用者原有內容'), 'update 不應動到使用者內容')
  assert(md.split('<!-- ADE:BEGIN -->').length === 2, '區段不應重複插入')
  assert(readJson(cfgPath).commit, '.ade.json 應記錄 commit')
})

test('工作目錄的 source 優先於 ADE repo 的 repository.url', () => {
  // ade-config 改來源後 update 不得蓋回
  const { ade, work, cfgPath } = installed()
  const pkgPath = path.join(ade, 'package.json')
  const pkg = readJson(pkgPath)
  pkg.repository = { type: 'git', url: 'git@example.com:org/moved.git' }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  git('add -A', ade)
  git('commit -m move-url', ade)
  runner.update(work)
  assert.strictEqual(readJson(cfgPath).source, ade, 'update 不應用 repository.url 蓋掉工作目錄設定的 source')
})

test('來源是沒有 commit 的 repo 時，update 失敗且不破壞既有安裝', () => {
  const { tmp, ade, work, cfgPath } = installed()
  const emptyAde = path.join(tmp, 'empty-ade')
  fs.cpSync(ade, emptyAde, { recursive: true, filter: (p) => path.basename(p) !== '.git' })
  git('init -q', emptyAde)
  fs.writeFileSync(cfgPath, JSON.stringify({ ...readJson(cfgPath), source: emptyAde }))
  assert.throws(() => runner.update(work), /commit/, '來源為空 repo 的 update 應報錯')
  assert(
    fs.existsSync(path.join(work, '.claude/ade/knowledge/services/README.md')) &&
      fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')),
    'update 失敗時既有 managed 內容必須原封不動'
  )
})

test('非 ade- 前綴的 skill 應被拒裝（在破壞前驗證）', () => {
  const { ade, work } = installed()
  fs.mkdirSync(path.join(ade, 'hub/skills/rogue'))
  fs.writeFileSync(path.join(ade, 'hub/skills/rogue/SKILL.md'), 'x')
  git('add -A', ade)
  git('commit -m rogue', ade)
  assert.throws(() => runner.update(work), /ade-/, '非 ade- 前綴 skill 應報錯')
  assert(
    fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')) &&
      fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')),
    '拒裝時既有 managed 內容必須原封不動'
  )
})

test('update 沿用 .ade.json 的 workspaces 設定並保留 symlink', () => {
  const tmp = tmpdir()
  const ade = createAde(tmp)
  fs.mkdirSync(path.join(tmp, 'shared-repos'))
  const work = workdir(tmp, 'work')
  runner.init(work, ade, '../shared-repos')
  runner.update(work)
  assert(
    fs.lstatSync(path.join(work, 'workspaces')).isSymbolicLink() &&
      readJson(path.join(work, '.ade.json')).workspaces === '../shared-repos',
    'update 應沿用設定並保留 symlink'
  )
})

test('update 寫入途中失敗時，managed 內容、CLAUDE.md 與 .ade.json 回復原狀', () => {
  const { tmp, ade, work, cfgPath } = installed()
  fs.appendFileSync(path.join(ade, 'hub/knowledge/services/README.md'), '\n上游新知識\n')
  fs.rmSync(path.join(ade, 'hub/skills/ade-add-service'), { recursive: true })
  fs.rmSync(path.join(ade, '.claude/skills/ade-add-service'))
  git('add -A', ade)
  git('commit -m update', ade)
  // workspaces 的目標位於一般檔案之下，建立目錄時失敗；此時知識庫、skill 與 CLAUDE.md 都已寫入
  fs.writeFileSync(path.join(tmp, 'afile'), '')
  fs.writeFileSync(cfgPath, JSON.stringify({ ...readJson(cfgPath), workspaces: path.join(tmp, 'afile', 'sub') }))
  const cfg = fs.readFileSync(cfgPath, 'utf8')
  const md = fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8')

  assert.throws(() => runner.update(work), /ENOTDIR|EEXIST/)

  const idx = fs.readFileSync(path.join(work, '.claude/ade/knowledge/services/README.md'), 'utf8')
  assert(!idx.includes('上游新知識'), '失敗的 update 應回復原本的知識庫')
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-add-service/SKILL.md')), '失敗的 update 應回復原本的 skill')
  assert.strictEqual(fs.readFileSync(path.join(work, 'CLAUDE.md'), 'utf8'), md, '失敗的 update 應回復 CLAUDE.md')
  assert.strictEqual(fs.readFileSync(cfgPath, 'utf8'), cfg, '失敗的 update 不應改寫 .ade.json')
  assert(fs.lstatSync(path.join(work, 'workspaces')).isDirectory(), '失敗的 update 不應動到 workspaces')
  assert.deepStrictEqual(fs.readdirSync(path.join(work, '.claude')).filter((d) => d.startsWith('.ade-backup')), [], '回復後不應留下備份目錄')
})

test('update 清除前次中斷留下的備份目錄', () => {
  const { work } = installed()
  fs.mkdirSync(path.join(work, '.claude/.ade-backup-stale/ade'), { recursive: true })
  runner.update(work)
  assert(!fs.existsSync(path.join(work, '.claude/.ade-backup-stale')), '殘留的備份目錄應被清除')
})

test('source 不會被當成 shell 指令或 git 選項執行', () => {
  const { tmp, work, cfgPath } = installed()
  const cfg = readJson(cfgPath)
  const marker = path.join(tmp, 'pwned')
  for (const source of [`nowhere"; touch "${marker}`, `--upload-pack=touch ${marker}`]) {
    fs.writeFileSync(cfgPath, JSON.stringify({ ...cfg, source }))
    assert.throws(() => runner.update(work))
    assert(!fs.existsSync(marker), `source 不得被執行：${source}`)
  }
  assert(fs.existsSync(path.join(work, '.claude/skills/ade-contribute/SKILL.md')), '失敗時既有 managed 內容必須原封不動')
})

test('搬移備份途中失敗時，已搬走的 managed 內容搬回原處', () => {
  const { work } = installed()
  const before = fs.readdirSync(path.join(work, '.claude/skills')).sort()
  // 第二次 rename 失敗：知識庫已搬進備份，skill 還在原處
  const rename = fs.renameSync
  let calls = 0
  fs.renameSync = (...args) => {
    if (++calls === 2) throw new Error('EBUSY: injected')
    return rename(...args)
  }
  try {
    assert.throws(() => runner.update(work), /EBUSY: injected/)
  } finally {
    fs.renameSync = rename
  }
  assert(fs.existsSync(path.join(work, '.claude/ade/knowledge/README.md')), '已搬走的知識庫應搬回')
  assert.deepStrictEqual(fs.readdirSync(path.join(work, '.claude/skills')).sort(), before, '原處的 skill 不得被刪除')
  assert.deepStrictEqual(fs.readdirSync(path.join(work, '.claude')).filter((d) => d.startsWith('.ade-backup')), [], '回復後不應留下備份目錄')
})
