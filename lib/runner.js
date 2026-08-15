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
  if (!cfg.source) throw new Error('.ade.json is missing source (the ADE repo git url); add it and retry')

  // pnpm dlx 有快取（預設 ~24h），cli.js 所在的套件目錄可能是舊版內容；
  // update 的任務是拿最新知識，因此一律無視 pkgDir、自行 clone source
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ade-'))
  try {
    execSync(`git clone --depth 1 "${cfg.source}" "${path.join(tmp, 'repo')}"`, { stdio: 'inherit' })
    removeManaged(cwd)
    install(cwd, path.join(tmp, 'repo'), ws)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  console.log('ADE update done')
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
  // 先驗證再動手：update 只清理 ade- 前綴，非前綴 skill 裝了就清不掉
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

  const prevPath = path.join(cwd, '.ade.json')
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : {}

  // 作業區固定叫 workspaces/；指定既有 repo 存放資料夾時（--workspaces 或 .ade.json 的
  // workspaces），workspaces 建成指向它的 symlink，cd workspaces 即達、已下載的 repo 直接沿用
  const ws = wsOverride || prev.workspaces || null
  const wsDir = path.join(cwd, 'workspaces')
  if (ws && path.resolve(cwd, ws) !== wsDir) {
    fs.mkdirSync(path.resolve(cwd, ws), { recursive: true })
    let st = null
    try { st = fs.lstatSync(wsDir) } catch {}
    if (st && st.isSymbolicLink()) fs.unlinkSync(wsDir)
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
  let source = null
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(srcDir, 'package.json'), 'utf8'))
    source = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository || {}).url || null
    if (source) source = source.replace(/^git\+/, '')
    if (source && source.includes('FILL_ME')) source = null
  } catch {}
  let commit = null
  try {
    commit = execSync('git rev-parse HEAD', { cwd: srcDir, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {}
  fs.writeFileSync(
    prevPath,
    JSON.stringify({ source: source || prev.source || null, commit, workspaces: ws }, null, 2) + '\n'
  )
  if (!source && !prev.source) {
    console.warn('Warning: repository.url is not set in the ADE repo package.json; update will not work — set source in .ade.json manually')
  }
}

module.exports = { run, init, update }
