#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const name = process.argv[2]
if (!name || !/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
  console.error('用法: create-agentic-dev-env <repo-name>')
  process.exit(1)
}
const dest = path.resolve(name)
if (fs.existsSync(dest)) {
  console.error(`${name} 已存在`)
  process.exit(1)
}

fs.cpSync(path.join(__dirname, '..', 'template'), dest, { recursive: true })
// npm publish 會剝掉 dot 開頭的檔案/目錄，template 內以無點名稱存放，複製後改名
fs.renameSync(path.join(dest, 'gitignore'), path.join(dest, '.gitignore'))
fs.renameSync(path.join(dest, 'dot-claude'), path.join(dest, '.claude'))
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
fs.writeFileSync(destPkgPath, JSON.stringify(destPkg, null, 2) + '\n')

execSync('git init', { cwd: dest, stdio: 'inherit' })

console.log(`
已建立 ADE repo: ${name}/

下一步:
  1. 填 ${name}/package.json 的 repository.url
  2. 開始填 knowledge/（服務格式見 knowledge/services/_template.yaml）
  3. push 後團隊即可: pnpm dlx "git+ssh://git@github.com/ORG/${name}.git" init
`)
