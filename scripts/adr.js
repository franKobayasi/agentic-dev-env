#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DIR = path.join(__dirname, '..', 'docs', 'adr')
const README = path.join(DIR, 'README.md')
const BEGIN = '<!-- BEGIN_ADR_INDEX -->'
const END = '<!-- END_ADR_INDEX -->'
const NAME = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/
const STATUS = /^(proposed|accepted|rejected|deprecated|superseded by ADR-\d{4})$/

function main(cmd) {
  if (cmd !== 'check' && cmd !== 'sync') {
    console.error('Usage: node scripts/adr.js check | sync')
    process.exit(1)
  }
  const adrs = load()
  const errors = validate(adrs)
  const readme = fs.readFileSync(README, 'utf8')
  const updated = inject(readme, render(adrs), errors)
  if (cmd === 'sync' && !errors.length && updated !== readme) fs.writeFileSync(README, updated)
  if (cmd === 'check' && !errors.length && updated !== readme) {
    errors.push('docs/adr/README.md 的索引不是最新的：執行 node scripts/adr.js sync')
  }
  if (errors.length) {
    for (const e of errors) console.error(`ADR: ${e}`)
    process.exit(1)
  }
}

function load() {
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== '_template.md')
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

// 與 main 的分岔點比較；找不到分岔點（例如淺層 clone）時略過這項檢查
function removedOrRenamed() {
  const sh = c => execSync(c, { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  let base
  for (const ref of ['origin/main', 'main']) {
    try { base = sh(`git merge-base HEAD ${ref}`); break } catch {}
  }
  if (!base) return []
  return sh(`git diff --name-status ${base} -- docs/adr`).split('\n')
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
  return ['| ADR | 標題 | 狀態 | 結論 | 影響與備註 |', '|---|---|---|---|---|', ...rows].join('\n')
}

function inject(readme, table, errors) {
  const b = readme.indexOf(BEGIN)
  const e = readme.indexOf(END)
  if (b === -1 || e < b) {
    errors.push(`docs/adr/README.md 缺少 ${BEGIN} 與 ${END} 錨點`)
    return readme
  }
  return `${readme.slice(0, b + BEGIN.length)}\n${table}\n${readme.slice(e)}`
}

main(process.argv[2])
