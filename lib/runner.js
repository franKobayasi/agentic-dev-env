const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const BEGIN = '<!-- ADE:BEGIN -->'
const END = '<!-- ADE:END -->'

function run(cmd, pkgDir) {
  try {
    if (cmd === 'init') init(process.cwd(), pkgDir)
    else if (cmd === 'update') update(process.cwd())
    else {
      console.error('用法: init | update')
      process.exit(1)
    }
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}

function init(cwd, srcDir) {
  if (fs.existsSync(path.join(cwd, '.ade.json'))) {
    throw new Error('此目錄已 init 過，請改用 update')
  }
  install(cwd, srcDir)
  console.log('ADE init 完成')
}

function update(cwd) {
  const cfgPath = path.join(cwd, '.ade.json')
  if (!fs.existsSync(cfgPath)) throw new Error('此目錄尚未 init')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  if (!cfg.source) throw new Error('.ade.json 缺少 source（ADE repo 的 git url），請補上後重試')

  // pnpm dlx 有快取（預設 ~24h），cli.js 所在的套件目錄可能是舊版內容；
  // update 的任務是拿最新知識，因此一律無視 pkgDir、自行 clone source
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ade-'))
  try {
    execSync(`git clone --depth 1 "${cfg.source}" "${path.join(tmp, 'repo')}"`, { stdio: 'inherit' })
    removeManaged(cwd)
    install(cwd, path.join(tmp, 'repo'))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  console.log('ADE update 完成')
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

function install(cwd, srcDir) {
  fs.cpSync(path.join(srcDir, 'knowledge'), path.join(cwd, '.claude', 'ade', 'knowledge'), { recursive: true })

  const srcSkills = path.join(srcDir, 'skills')
  if (fs.existsSync(srcSkills)) {
    for (const d of fs.readdirSync(srcSkills)) {
      fs.cpSync(path.join(srcSkills, d), path.join(cwd, '.claude', 'skills', d), { recursive: true })
    }
  }

  const section = fs.readFileSync(path.join(srcDir, 'claude-md', 'section.md'), 'utf8').trim()
  const block = `${BEGIN}\n${section}\n${END}`
  const claudePath = path.join(cwd, 'CLAUDE.md')
  let md = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, 'utf8') : ''
  const b = md.indexOf(BEGIN)
  const e = md.indexOf(END)
  if (b !== -1 || e !== -1) {
    if (b === -1 || e === -1 || e < b) {
      throw new Error('CLAUDE.md 的 ADE 標記已損壞（BEGIN/END 不成對或順序顛倒），請手動修復後重試')
    }
    md = md.slice(0, b) + block + md.slice(e + END.length)
  } else {
    md = md ? md.trimEnd() + '\n\n' + block + '\n' : block + '\n'
  }
  fs.writeFileSync(claudePath, md)

  fs.mkdirSync(path.join(cwd, 'workspaces'), { recursive: true })
  const giPath = path.join(cwd, '.gitignore')
  const gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : ''
  if (!gi.split('\n').some((l) => l.trim().replace(/\/$/, '') === 'workspaces')) {
    fs.writeFileSync(giPath, (gi ? gi.trimEnd() + '\n' : '') + 'workspaces/\n')
  }

  const prevPath = path.join(cwd, '.ade.json')
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : {}
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
    JSON.stringify({ source: source || prev.source || null, commit }, null, 2) + '\n'
  )
  if (!source && !prev.source) {
    console.warn('警告: ADE repo 的 package.json 未設定 repository.url，update 將無法運作，請手動補 .ade.json 的 source')
  }
}

module.exports = { run, init, update }
