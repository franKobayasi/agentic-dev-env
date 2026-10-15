// 測試共用：暫存目錄、git，以及建立可 init 的 ADE repo
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const git = (cmd, cwd) =>
  execSync(`git -c user.email=t@t -c user.name=t ${cmd}`, { cwd, stdio: 'pipe' })

function tmpdir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ade-test-'))
  process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

// create 出來、已 commit，但 repository.url 仍是 FILL_ME
function create(tmp, name = 'my-ade') {
  execSync(`node "${path.join(__dirname, '..', 'bin', 'create.js')}" ${name}`, { cwd: tmp, stdio: 'pipe' })
  const ade = path.join(tmp, name)
  git('add -A', ade)
  git('commit -m init', ade)
  return ade
}

function setUrl(ade, url) {
  const pkgPath = path.join(ade, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.repository = { type: 'git', url }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  git('add -A', ade)
  git('commit -m set-url', ade)
}

// 可直接 init 的 ADE repo：repository.url 指向自己（本地模式）
function createAde(tmp, name) {
  const ade = create(tmp, name)
  setUrl(ade, ade)
  return ade
}

// 帶有使用者原有 CLAUDE.md 的空工作目錄
function workdir(tmp, name) {
  const work = path.join(tmp, name)
  fs.mkdirSync(work)
  fs.writeFileSync(path.join(work, 'CLAUDE.md'), '# 我的專案\n\n使用者原有內容\n')
  return work
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

module.exports = { git, tmpdir, create, setUrl, createAde, workdir, readJson }
