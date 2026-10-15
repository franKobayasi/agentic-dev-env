#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 用法：node adr.js check | sync <ADR 目錄>；規則見知識庫 process/adr-writing.md
const DIR = path.resolve(process.argv[3] || '')
const INDEX = path.join(DIR, 'INDEX.md')
const NAME = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/
const STATUS = /^(proposed|accepted|rejected|deprecated|superseded by ADR-\d{4})$/

function main(cmd) {
  if ((cmd !== 'check' && cmd !== 'sync') || !process.argv[3] || !fs.existsSync(DIR)) {
    console.error('Usage: node adr.js check | sync <adr-dir>')
    process.exit(1)
  }
  const adrs = load()
  const errors = validate(adrs)
  const current = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf8') : ''
  const updated = render(adrs)
  if (cmd === 'sync' && !errors.length && updated !== current) fs.writeFileSync(INDEX, updated)
  if (cmd === 'check' && !errors.length && updated !== current) {
    errors.push(`${path.join(process.argv[3], 'INDEX.md')} 不是最新的：執行 node adr.js sync ${process.argv[3]}`)
  }
  if (errors.length) {
    for (const e of errors) console.error(`ADR: ${e}`)
    process.exit(1)
  }
}

function load() {
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.md') && !['README.md', 'INDEX.md', '_template.md'].includes(f))
    .sort()
    .map(file => {
      const text = fs.readFileSync(path.join(DIR, file), 'utf8')
      const fm = {}
      const m = text.match(/^---\n([\s\S]*?)\n---/)
      for (const line of m ? m[1].split('\n') : []) {
        const i = line.indexOf(':')
        if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')
      }
      const title = (text.match(/^# (.+)$/m) || [])[1]
      return { file, id: (file.match(NAME) || [])[1], fm, title }
    })
}

function validate(adrs) {
  const errors = []
  adrs.forEach((a, i) => {
    if (!a.id) return errors.push(`${a.file}：檔名必須是 NNNN-kebab-case-slug.md`)
    const expected = String(i + 1).padStart(4, '0')
    if (a.id !== expected) errors.push(`${a.file}：編號應為 ${expected}，流水號必須從 0001 起連續`)
    if (!STATUS.test(a.fm.status || '')) errors.push(`${a.file}：status 必須是 proposed、accepted、rejected、deprecated 或 superseded by ADR-NNNN`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.fm.date || '')) errors.push(`${a.file}：date 必須是 YYYY-MM-DD`)
    if (!a.fm.outcome) errors.push(`${a.file}：必須填寫 outcome`)
    if (!a.title) errors.push(`${a.file}：缺少一級標題`)
  })
  for (const f of removedOrRenamed()) errors.push(`${f}：既有的 ADR 不得刪除或改名，被取代時改 status`)
  return errors
}

// 與主幹的分岔點比較；不在 git repo 內或找不到分岔點（例如淺層 clone）時略過這項檢查
function removedOrRenamed() {
  const sh = c => execSync(c, { cwd: DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  let base
  for (const ref of ['origin/HEAD', 'origin/main', 'main']) {
    try { base = sh(`git merge-base HEAD ${ref}`); break } catch {}
  }
  if (!base) return []
  return sh(`git diff --name-status ${base} -- .`).split('\n')
    .filter(l => /^[DR]/.test(l))
    .map(l => path.basename(l.split('\t')[1]))
    .filter(f => NAME.test(f))
}

function render(adrs) {
  const cell = s => (s || '').replace(/\|/g, '\\|')
  const rows = [...adrs].reverse().map(a => {
    const status = /^(proposed|accepted|rejected|deprecated)$/.test(a.fm.status) ? `\`${a.fm.status}\`` : cell(a.fm.status)
    return `| [${a.id}](./${a.file}) | ${cell(a.title)} | ${status} | ${cell(a.fm.outcome)} | ${cell(a.fm.notes)} |`
  })
  return [
    '# ADR 索引',
    '',
    '本檔由 `adr.js sync` 產生，不得手動編輯。' + (fs.existsSync(path.join(DIR, 'README.md')) ? 'ADR 的用途、建立方式與狀態的意義見[決策紀錄的說明](./README.md)。' : ''),
    '',
    '下表依編號由新到舊列出全部 ADR：',
    '',
    '| ADR | 標題 | 狀態 | 結論 | 影響與備註 |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n')
}

main(process.argv[2])
