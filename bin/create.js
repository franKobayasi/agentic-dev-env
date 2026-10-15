#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log(`create-agentic-dev-env v${require('../package.json').version}`)

const name = process.argv[2]
if (!name || !/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
  console.error('Usage: create-agentic-dev-env <repo-name>')
  process.exit(1)
}
const dest = path.resolve(name)
if (fs.existsSync(dest)) {
  console.error(`${name} already exists`)
  process.exit(1)
}

// seed/repo/ 攤平成 ADE repo 本身，seed/hub/ 原樣成為 ADE repo 的 hub/
const seed = path.join(__dirname, '..', 'seed')
fs.cpSync(path.join(seed, 'repo'), dest, { recursive: true })
fs.cpSync(path.join(seed, 'hub'), path.join(dest, 'hub'), { recursive: true })
// npm publish 會剝掉 dot 開頭的檔案/目錄，seed 內以無點名稱存放，複製後歸位
fs.renameSync(path.join(dest, 'gitignore'), path.join(dest, '.gitignore'))
fs.mkdirSync(path.join(dest, '.claude'))
fs.renameSync(path.join(dest, 'skills'), path.join(dest, '.claude', 'skills'))
fs.renameSync(path.join(dest, 'githooks'), path.join(dest, '.githooks'))
// npm 打包不保證保留執行權限，git 只執行可執行的 hook
fs.chmodSync(path.join(dest, '.githooks', 'pre-commit'), 0o755)
// 兩邊都用的 skill 單一真相在 hub/skills/，frontmatter 宣告 ade-scope: both 者 symlink 進 .claude/skills/
const skillsDir = path.join(dest, '.claude', 'skills')
for (const s of fs.readdirSync(path.join(dest, 'hub', 'skills'))) {
  const fm = (fs.readFileSync(path.join(dest, 'hub', 'skills', s, 'SKILL.md'), 'utf8').match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
  if (/^\s+ade-scope:\s*both\s*$/m.test(fm)) {
    fs.symlinkSync(path.join('..', '..', 'hub', 'skills', s), path.join(skillsDir, s), 'dir')
  }
}
for (const rel of fs.readdirSync(dest, { recursive: true })) {
  const p = path.join(dest, rel)
  if (!fs.statSync(p).isFile()) continue
  const s = fs.readFileSync(p, 'utf8')
  if (s.includes('__ADE_NAME__')) fs.writeFileSync(p, s.replaceAll('__ADE_NAME__', name))
}
// 記錄上游位址，供 ade-feedback-upstream skill 回饋機制改良
let selfRepo = (require('../package.json').repository || {}).url || null
if (selfRepo && selfRepo.includes('FILL_ME')) selfRepo = null
const destPkgPath = path.join(dest, 'package.json')
const destPkg = JSON.parse(fs.readFileSync(destPkgPath, 'utf8'))
destPkg.ade.upstream = selfRepo ? selfRepo.replace(/^git\+/, '') : null
// 鎖精確版本：ADE repo 建立後即與上游迭代解耦，升級是 ADE repo 內顯式改版號的決定
destPkg.dependencies['create-agentic-dev-env'] = require('../package.json').version
fs.writeFileSync(destPkgPath, JSON.stringify(destPkg, null, 2) + '\n')

execSync('git init', { cwd: dest, stdio: 'inherit' })

console.log(`
Created ADE repo: ${name}/

Next steps:
  1. Set repository.url in ${name}/package.json (git url; or an absolute path for a local-only ADE repo)
  2. Start filling hub/knowledge/ (service format: hub/knowledge/services/_template.yaml)
  3. After pushing, team members run: pnpm dlx "git+ssh://git@github.com/ORG/${name}.git" init
`)
