const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const BEGIN = '<!-- ADE:BEGIN -->'
const END = '<!-- ADE:END -->'

function run(cmd, pkgDir) {
  try {
    const i = process.argv.indexOf('--workspaces')
    const ws = i !== -1 ? process.argv[i + 1] : undefined
    if (cmd === 'init') init(process.cwd(), pkgDir, ws)
    else if (cmd === 'update') update(process.cwd(), ws)
    else {
      console.error('Usage: init | update  [--workspaces <path>]')
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
  install(cwd, srcDir, ws)
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
    const depth = fs.existsSync(cfg.source) ? '' : '--depth 1 '
    const repo = path.join(tmp, 'repo')
    execSync(`git clone ${depth}"${cfg.source}" "${repo}"`, { stdio: 'inherit' })
    // 先驗證再清：clone 到沒有 commit 的 repo（本地模式常見）會是空目錄，此時清掉 managed 內容只會留下殘局
    assertAdeRepo(repo)
    removeManaged(cwd)
    install(cwd, repo, ws)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  console.log('ADE update done')
}

function assertAdeRepo(dir) {
  for (const rel of ['knowledge', path.join('claude-md', 'section.md')]) {
    if (!fs.existsSync(path.join(dir, rel))) {
      throw new Error(`${rel} not found in the ADE repo checkout — does the repo have a commit on its default branch?`)
    }
  }
}

function removeManaged(cwd) {
  fs.rmSync(path.join(cwd, '.claude', 'ade'), { recursive: true, force: true })
  const skillsDir = path.join(cwd, '.claude', 'skills')
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir)) {
      if (d.startsWith('ade-')) fs.rmSync(path.join(skillsDir, d), { recursive: true, force: true })
    }
  }
}

function install(cwd, srcDir, wsOverride) {
  // 先驗證再動手：解析不到 source 就整個不裝——目錄保持乾淨，init 可重跑
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
  for (const cmd of ['git rev-parse HEAD', `git ls-remote "${src}" HEAD`]) {
    try {
      commit = execSync(cmd, { cwd: srcDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split(/\s/)[0] || null
      if (commit) break
    } catch {}
  }
  if (!commit) {
    throw new Error(`could not resolve the ADE repo commit from ${src} — make sure the repo has at least one commit (and is reachable), then retry`)
  }

  // update 只清理 ade- 前綴，非前綴 skill 裝了就清不掉
  const srcSkills = path.join(srcDir, 'skills')
  const skillDirs = fs.existsSync(srcSkills)
    ? fs.readdirSync(srcSkills).filter((d) => fs.statSync(path.join(srcSkills, d)).isDirectory())
    : []
  for (const d of skillDirs) {
    if (!d.startsWith('ade-')) {
      throw new Error(`skills/${d}: skill directories in an ADE repo must be prefixed with ade- (update only manages this prefix)`)
    }
  }

  fs.cpSync(path.join(srcDir, 'knowledge'), path.join(cwd, '.claude', 'ade', 'knowledge'), { recursive: true })
  for (const d of skillDirs) {
    fs.cpSync(path.join(srcSkills, d), path.join(cwd, '.claude', 'skills', d), { recursive: true })
  }

  const section = fs.readFileSync(path.join(srcDir, 'claude-md', 'section.md'), 'utf8').trim()
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
  fs.writeFileSync(claudePath, md)

  // 作業區固定叫 workspaces/；指定既有 repo 存放資料夾時（--workspaces 或 .ade.json 的
  // workspaces），workspaces 建成指向它的 symlink，cd workspaces 即達、已下載的 repo 直接沿用
  const ws = wsOverride || prev.workspaces || null
  const wsDir = path.join(cwd, 'workspaces')
  if (ws && path.resolve(cwd, ws) !== wsDir) {
    fs.mkdirSync(path.resolve(cwd, ws), { recursive: true })
    let st = null
    try { st = fs.lstatSync(wsDir) } catch {}
    if (st && st.isSymbolicLink()) fs.unlinkSync(wsDir)
    // init 預設建的是空的實體目錄；之後改指向別處（ade-config）時空目錄直接換成 symlink，有東西才要人搬
    else if (st && st.isDirectory() && fs.readdirSync(wsDir).length === 0) fs.rmdirSync(wsDir)
    else if (st) throw new Error('workspaces already exists and is not a symlink; move its contents into the target folder and remove it, then retry')
    fs.symlinkSync(ws, wsDir, 'dir')
  } else {
    fs.mkdirSync(wsDir, { recursive: true })
  }
  const giPath = path.join(cwd, '.gitignore')
  const gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : ''
  // 不帶斜線才涵蓋 symlink 形態（gitignore 的 `dir/` 不匹配 symlink）
  if (!gi.split('\n').some((l) => l.trim() === 'workspaces')) {
    fs.writeFileSync(giPath, (gi ? gi.trimEnd() + '\n' : '') + 'workspaces\n')
  }
  fs.writeFileSync(prevPath, JSON.stringify({ source: src, commit, workspaces: ws }, null, 2) + '\n')
}

module.exports = { run, init, update }
