const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')
const knowledgeCheck = require('./check')

const BEGIN = '<!-- ADE:BEGIN -->'
const END = '<!-- ADE:END -->'

function run(cmd, pkgDir) {
  try {
    const i = process.argv.indexOf('--workspaces')
    const ws = i !== -1 ? process.argv[i + 1] : undefined
    if (cmd === 'init') init(process.cwd(), pkgDir, ws)
    else if (cmd === 'update') update(process.cwd(), ws)
    else if (cmd === 'check') checkCmd(process.cwd())
    else if (cmd === 'index') indexCmd(process.cwd())
    else {
      console.error('Usage: init | update | check | index  [--workspaces <path>]')
      process.exit(1)
    }
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}

function init(cwd, srcDir, ws) {
  if (fs.existsSync(path.join(cwd, '.ade.json'))) {
    throw new Error('Already initialized here; run update instead')
  }
  const plan = prepare(cwd, srcDir, ws)
  transact(cwd, () => apply(cwd, plan))
  console.log('ADE init done')
}

function update(cwd, ws) {
  const cfgPath = path.join(cwd, '.ade.json')
  if (!fs.existsSync(cfgPath)) throw new Error('Not initialized here; run init first')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  if (!cfg.source) throw new Error('.ade.json is missing source (the ADE repo git url or local path); add it and retry')

  // pnpm dlx 有快取（預設 ~24h），cli.js 所在的套件目錄可能是舊版內容；
  // update 的任務是拿最新知識，因此一律無視 pkgDir、自行 clone source
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ade-'))
  try {
    // 本地路徑的 clone 不支援 --depth（只會印警告），其餘來源維持淺 clone
    const depth = fs.existsSync(cfg.source) ? [] : ['--depth', '1']
    const repo = path.join(tmp, 'repo')
    // 以參數陣列執行、source 放在 -- 之後：source 不經 shell，也不會被當成 git 的選項
    execFileSync('git', ['clone', ...depth, '--', cfg.source, repo], { stdio: 'inherit' })
    // 先驗證再清：clone 到沒有 commit 的 repo（本地模式常見）會是空目錄，此時清掉 managed 內容只會留下殘局
    assertAdeRepo(repo)
    warnCheck(repo)
    const plan = prepare(cwd, repo, ws)
    transact(cwd, () => apply(cwd, plan))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  console.log('ADE update done')
}

// 分層結構（hub/）與舊的扁平結構都要能讀：既存 ADE repo 升級 runner 時仍是舊結構
function layout(dir) {
  const hub = path.join(dir, 'hub')
  if (fs.existsSync(hub)) {
    return { knowledge: path.join(hub, 'knowledge'), skills: path.join(hub, 'skills'), section: path.join(hub, 'CLAUDE.section.md') }
  }
  return { knowledge: path.join(dir, 'knowledge'), skills: path.join(dir, 'skills'), section: path.join(dir, 'claude-md', 'section.md') }
}

function assertAdeRepo(dir) {
  const l = layout(dir)
  for (const rel of [path.relative(dir, l.knowledge), path.relative(dir, l.section)]) {
    if (!fs.existsSync(path.join(dir, rel))) {
      throw new Error(`${rel} not found in the ADE repo checkout — does the repo have a commit on its default branch?`)
    }
  }
  adeSkillDirs(dir)
}

// update 只清理 ade- 前綴，非前綴 skill 裝了就清不掉；update 在清除 managed 區域前就要擋下
function adeSkillDirs(dir) {
  const srcSkills = layout(dir).skills
  const dirs = fs.existsSync(srcSkills)
    ? fs.readdirSync(srcSkills).filter((d) => fs.statSync(path.join(srcSkills, d)).isDirectory())
    : []
  for (const d of dirs) {
    if (!d.startsWith('ade-')) {
      throw new Error(`${path.relative(dir, srcSkills)}/${d}: skill directories in an ADE repo must be prefixed with ade- (update only manages this prefix)`)
    }
  }
  return dirs
}

// 回傳 ADE repo 知識庫的檢查錯誤，每項一行
function check(repo) {
  return knowledgeCheck.check(repo, layout(repo))
}

function assertKnowledge(cwd, cmd) {
  if (!fs.existsSync(layout(cwd).knowledge)) {
    throw new Error(`knowledge base not found; run ${cmd} at the root of the ADE repo`)
  }
}

// 逐行印出有變動的 INDEX.md，供 pre-commit hook 加入 commit
function indexCmd(cwd) {
  assertKnowledge(cwd, 'index')
  const { errors, changed } = knowledgeCheck.writeIndexes(cwd, layout(cwd))
  if (errors.length) {
    for (const e of errors) console.error(e)
    throw new Error(`ADE index failed: ${errors.length} problem(s)`)
  }
  for (const f of changed) console.log(f)
}

function checkCmd(cwd) {
  assertKnowledge(cwd, 'check')
  const errors = check(cwd)
  if (errors.length) {
    for (const e of errors) console.error(e)
    throw new Error(`ADE check failed: ${errors.length} problem(s)`)
  }
  console.log('ADE check passed')
}

// update 的使用者無法在工作目錄修正 ADE repo，只印摘要、不中斷；檢查本身出錯也不得擋下更新
function warnCheck(repo) {
  try {
    const n = check(repo).length
    if (n) console.warn(`warning: the ADE repo has ${n} knowledge base check problem(s); run "node cli.js check" in the ADE repo for details`)
  } catch {}
}

function managedSkills(cwd) {
  const skillsDir = path.join(cwd, '.claude', 'skills')
  return fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((d) => d.startsWith('ade-')) : []
}

function removeManaged(cwd) {
  fs.rmSync(path.join(cwd, '.claude', 'ade'), { recursive: true, force: true })
  for (const d of managedSkills(cwd)) fs.rmSync(path.join(cwd, '.claude', 'skills', d), { recursive: true, force: true })
}

// 寫入途中失敗（磁碟、權限、目標路徑）時回復原狀：先把 managed 區域搬進 .claude/.ade-backup-*，
// 失敗就清掉寫到一半的內容、搬回備份並還原 CLAUDE.md；備份與 Forge 同一個檔案系統，rename 不需複製
function transact(cwd, fn) {
  const claudeDir = path.join(cwd, '.claude')
  const created = [claudeDir, path.join(claudeDir, 'skills')].filter((d) => !fs.existsSync(d))
  fs.mkdirSync(claudeDir, { recursive: true })
  // 程序中斷時備份會殘留；殘留時 managed 區域可能不完整，本次寫入會整份重建，備份已無用處
  for (const d of fs.readdirSync(claudeDir)) {
    if (d.startsWith('.ade-backup-')) fs.rmSync(path.join(claudeDir, d), { recursive: true, force: true })
  }
  const claudePath = path.join(cwd, 'CLAUDE.md')
  const md = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, 'utf8') : null
  const backup = fs.mkdtempSync(path.join(claudeDir, '.ade-backup-'))
  fs.mkdirSync(path.join(backup, 'skills'))
  const moves = managedSkills(cwd).map((d) => ['skills', d])
  if (fs.existsSync(path.join(claudeDir, 'ade'))) moves.unshift(['ade'])
  const moved = []
  let started = false
  try {
    for (const rel of moves) {
      fs.renameSync(path.join(claudeDir, ...rel), path.join(backup, ...rel))
      moved.push(rel)
    }
    started = true
    fn()
  } catch (e) {
    try {
      // 搬移備份途中失敗時還沒寫入任何內容，原地的 managed 檔案不得刪除
      if (started) removeManaged(cwd)
      for (const rel of moved) fs.renameSync(path.join(backup, ...rel), path.join(claudeDir, ...rel))
      if (started) {
        if (md === null) fs.rmSync(claudePath, { force: true })
        else fs.writeFileSync(claudePath, md)
      }
    } catch (restoreErr) {
      throw new Error(`${e.message}\nrestoring the previous installation also failed (${restoreErr.message}); the previous managed files are kept in ${backup}`)
    }
    fs.rmSync(backup, { recursive: true, force: true })
    // init 失敗時連同本次建立的空目錄一併移除，目錄回到 init 之前的樣子
    for (const d of created.reverse()) {
      if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmdirSync(d)
    }
    throw e
  }
  fs.rmSync(backup, { recursive: true, force: true })
}

// 只讀取與驗證、不寫入任何檔案：所有可預見的錯誤都在這裡擋下，目錄保持原狀
function prepare(cwd, srcDir, wsOverride) {
  // 解析不到 source 就整個不裝——目錄保持乾淨，init 可重跑
  const prevPath = path.join(cwd, '.ade.json')
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : {}
  let source = null
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(srcDir, 'package.json'), 'utf8'))
    source = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository || {}).url || null
    if (source) source = source.replace(/^git\+/, '')
    if (source && source.includes('FILL_ME')) source = null
  } catch {}
  if (!source && !prev.source) {
    throw new Error('repository.url is not set in the ADE repo package.json; update would not work — fill it in and retry')
  }
  // 工作目錄已設定的 source 優先（ade-config 可把它改成本地路徑或另一個 url）；ADE repo 的 repository.url 只在 init 時當初值
  const src = prev.source || source
  // srcDir 可能沒有 .git（pnpm dlx file:<本地路徑> 打包時不帶），退而問 source 本身；
  // 兩者都拿不到＝repo 還沒有 commit（或連不到），此時 .ade.json 的保鮮檢查永遠判定落後——寫任何檔案前先擋下
  let commit = null
  for (const args of [['rev-parse', 'HEAD'], ['ls-remote', '--', src, 'HEAD']]) {
    try {
      commit = execFileSync('git', args, { cwd: srcDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split(/\s/)[0] || null
      if (commit) break
    } catch {}
  }
  if (!commit) {
    throw new Error(`could not resolve the ADE repo commit from ${src} — make sure the repo has at least one commit (and is reachable), then retry`)
  }

  const l = layout(srcDir)
  const skillDirs = adeSkillDirs(srcDir)

  const section = fs.readFileSync(l.section, 'utf8').trim()
  const block = `${BEGIN}\n${section}\n${END}`
  const claudePath = path.join(cwd, 'CLAUDE.md')
  let md = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, 'utf8') : ''
  const b = md.indexOf(BEGIN)
  const e = md.indexOf(END)
  if (b !== -1 || e !== -1) {
    if (b === -1 || e === -1 || e < b) {
      throw new Error('ADE markers in CLAUDE.md are corrupted (unpaired or reversed BEGIN/END); fix them manually and retry')
    }
    md = md.slice(0, b) + block + md.slice(e + END.length)
  } else {
    md = md ? md.trimEnd() + '\n\n' + block + '\n' : block + '\n'
  }

  // 作業區固定叫 workspaces/；指定既有 repo 存放資料夾時（--workspaces 或 .ade.json 的
  // workspaces），workspaces 建成指向它的 symlink，cd workspaces 即達、已下載的 repo 直接沿用
  const ws = wsOverride || prev.workspaces || null
  const wsDir = path.join(cwd, 'workspaces')
  let wsAction = 'mkdir'
  if (ws && path.resolve(cwd, ws) !== wsDir) {
    let st = null
    try { st = fs.lstatSync(wsDir) } catch {}
    if (!st) wsAction = 'link'
    else if (st.isSymbolicLink()) wsAction = 'relink'
    // init 預設建的是空的實體目錄；之後改指向別處（ade-config）時空目錄直接換成 symlink，有東西才要人搬
    else if (st.isDirectory() && fs.readdirSync(wsDir).length === 0) wsAction = 'replace'
    else throw new Error('workspaces already exists and is not a symlink; move its contents into the target folder and remove it, then retry')
  }

  const giPath = path.join(cwd, '.gitignore')
  const gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : ''
  // 不帶斜線才涵蓋 symlink 形態（gitignore 的 `dir/` 不匹配 symlink）
  const gitignore = gi.split('\n').some((line) => line.trim() === 'workspaces') ? null : (gi ? gi.trimEnd() + '\n' : '') + 'workspaces\n'

  return { l, skillDirs, md, ws, wsAction, gitignore, config: { source: src, commit, workspaces: ws } }
}

// 依 prepare 的結果寫入；.ade.json 最後寫，失敗時保持前一次安裝的紀錄
function apply(cwd, plan) {
  const { l, skillDirs, md, ws, wsAction, gitignore, config } = plan
  fs.cpSync(l.knowledge, path.join(cwd, '.claude', 'ade', 'knowledge'), { recursive: true })
  for (const d of skillDirs) {
    fs.cpSync(path.join(l.skills, d), path.join(cwd, '.claude', 'skills', d), { recursive: true })
  }
  fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), md)

  const wsDir = path.join(cwd, 'workspaces')
  if (wsAction === 'mkdir') {
    fs.mkdirSync(wsDir, { recursive: true })
  } else {
    fs.mkdirSync(path.resolve(cwd, ws), { recursive: true })
    if (wsAction === 'relink') fs.unlinkSync(wsDir)
    else if (wsAction === 'replace') fs.rmdirSync(wsDir)
    fs.symlinkSync(ws, wsDir, 'dir')
  }
  if (gitignore !== null) fs.writeFileSync(path.join(cwd, '.gitignore'), gitignore)
  fs.writeFileSync(path.join(cwd, '.ade.json'), JSON.stringify(config, null, 2) + '\n')
}

module.exports = { run, init, update, check }
