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
for (const f of ['package.json', 'README.md', 'CLAUDE.md', path.join('claude-md', 'section.md')]) {
  const p = path.join(dest, f)
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replaceAll('__ADE_NAME__', name))
}
execSync('git init', { cwd: dest, stdio: 'inherit' })

console.log(`
已建立 ADE repo: ${name}/

下一步:
  1. 填 ${name}/package.json 的 repository.url
  2. 開始填 knowledge/（服務格式見 knowledge/services/_template.md）
  3. push 後團隊即可: pnpm dlx github:ORG/${name} init
`)
