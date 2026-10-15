// 知識庫的語法檢查：入口檔、frontmatter 的 id／description、符號位址 kb:<分類>/<id>、INDEX.md
// 原則見 docs/core-concepts/knowledge/，語法契約見 docs/dependency-contract.md
const fs = require('fs')
const path = require('path')

const ID = /^[0-9a-f]{6}$/
const SYMBOL = /^kb:([^/]+)\/([^/]+)$/
const GEN_ID = `node -e "console.log(require('crypto').randomBytes(3).toString('hex'))"`

// 只讀頂層的 key: value，足以取得 id 與 description
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const fm = {}
  if (!m) return fm
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return fm
}

// 說明語法的範例寫在程式碼區塊或 code span 內，不視為引用
const stripCode = (s) => s.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '')

function walk(dir, onDir, onFile) {
  onDir(dir)
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, onDir, onFile)
    else if (e.isFile()) onFile(p)
  }
}

function mdFiles(dir) {
  const files = []
  if (fs.existsSync(dir)) walk(dir, () => {}, (p) => p.endsWith('.md') && files.push(p))
  return files
}

// 資料夾 README.md 的 frontmatter 寫 index: [欄位, …] 時，產生該資料夾的 INDEX.md；
// 回傳 [{ file, content }]，設定錯誤與沒有 index 卻有 INDEX.md 的資料夾交給 report
function indexes(kb, report) {
  const out = []
  walk(kb, (dir) => {
    const readme = path.join(dir, 'README.md')
    const file = path.join(dir, 'INDEX.md')
    const raw = fs.existsSync(readme) ? frontmatter(fs.readFileSync(readme, 'utf8')).index : undefined
    if (raw === undefined) {
      if (fs.existsSync(file)) report(file, 'INDEX.md without index in README.md frontmatter', 'add index: [field, ...] to README.md, or delete INDEX.md')
      return
    }
    const m = raw.match(/^\[(.*)\]$/)
    const fields = m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : []
    if (!fields.length) return report(readme, `invalid index "${raw}"`, 'write it as index: [field, ...]')
    out.push({ file, content: renderIndex(dir, fields) })
  }, () => {})
  return out
}

// 每筆資料一列：資料夾內直接的 .md，或帶入口檔的子資料夾（知識單位）
function renderIndex(dir, fields) {
  const cell = (s) => (s || '').replace(/\|/g, '\\|')
  const rows = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const n = e.name
    let rel
    if (e.isFile() && n.endsWith('.md') && !['README.md', 'INDEX.md'].includes(n) && !/^[._]/.test(n)) rel = n
    else if (e.isDirectory() && !n.startsWith('.') && fs.existsSync(path.join(dir, n, 'README.md'))) rel = `${n}/README.md`
    if (!rel) continue
    const fm = frontmatter(fs.readFileSync(path.join(dir, rel), 'utf8'))
    rows.push(`| [${rel}](./${rel}) | ${fields.map((f) => cell(fm[f])).join(' | ')} |`)
  }
  return [
    '# 索引',
    '',
    '本檔由 `node cli.js index` 依 `README.md` frontmatter 的 `index` 產生，不得手動編輯。',
    '',
    '下表每一列是本資料夾的一筆資料：',
    '',
    `| 檔案 | ${fields.join(' | ')} |`,
    `|---|${fields.map(() => '---|').join('')}`,
    ...rows,
    '',
  ].join('\n')
}

// 重新產生全部 INDEX.md，回傳有變動的檔案；設定有錯誤時不寫入任何檔案
function writeIndexes(repo, l) {
  const errors = []
  const out = indexes(l.knowledge, (p, problem, fix) => errors.push(`${path.relative(repo, p)}: ${problem}; ${fix}`))
  if (errors.length) return { errors, changed: [] }
  const changed = out.filter(({ file, content }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content)
  for (const { file, content } of changed) fs.writeFileSync(file, content)
  return { errors, changed: changed.map(({ file }) => path.relative(repo, file)) }
}

// l：runner 的 layout()，即 { knowledge, skills, section }
function check(repo, l) {
  const errors = []
  const report = (p, problem, fix) => errors.push(`${path.relative(repo, p)}: ${problem}; ${fix}`)
  const kb = l.knowledge
  const ids = {} // 分類 → id → 檔案

  walk(
    kb,
    (dir) => {
      if (!fs.existsSync(path.join(dir, 'README.md'))) {
        report(dir, 'missing README.md', 'every folder in the knowledge base needs an entry file README.md')
      }
    },
    (p) => {
      const relKb = path.relative(kb, p)
      const name = path.basename(p)
      if (!p.endsWith('.md') || !relKb.includes(path.sep) || name === 'INDEX.md' || name.startsWith('_')) return
      const fm = frontmatter(fs.readFileSync(p, 'utf8'))
      if (!fm.id) report(p, 'missing id in frontmatter', `generate one with: ${GEN_ID}`)
      else if (!ID.test(fm.id)) report(p, `invalid id "${fm.id}"`, `an id is 6 lowercase hex characters; generate one with: ${GEN_ID}`)
      else {
        const cat = relKb.split(path.sep)[0]
        ;((ids[cat] ||= {})[fm.id] ||= []).push(p)
      }
      if (!fm.description) report(p, 'missing description in frontmatter', 'add one sentence describing what this knowledge is')
    }
  )

  for (const [cat, byId] of Object.entries(ids)) {
    for (const [id, files] of Object.entries(byId)) {
      if (files.length > 1) {
        for (const p of files) {
          report(p, `duplicate id ${id} in category ${cat}`, `give the newer file a new id and update kb: links to it; files: ${files.map((f) => path.relative(repo, f)).join(', ')}`)
        }
      }
    }
  }

  const sources = [...mdFiles(kb), ...mdFiles(l.skills), ...(fs.existsSync(l.section) ? [l.section] : [])]
  for (const p of sources) {
    for (const [, target] of stripCode(fs.readFileSync(p, 'utf8')).matchAll(/\]\((kb:[^)\s]*)/g)) {
      const m = target.match(SYMBOL)
      if (!m || !ID.test(m[2])) {
        report(p, `malformed symbol address ${target}`, 'write it as kb:<category>/<id>, where id is 6 lowercase hex characters')
      } else if (!fs.existsSync(path.join(kb, m[1]))) {
        report(p, `unknown category in ${target}`, 'a category is a top-level folder of the knowledge base')
      } else {
        const hits = (ids[m[1]] || {})[m[2]] || []
        if (hits.length === 0) report(p, `${target} does not resolve`, `no file in ${m[1]}/ has this id; fix the id or remove the link`)
        else if (hits.length > 1) report(p, `${target} matches ${hits.length} files`, 'resolve the duplicate id first')
      }
    }
  }

  for (const { file, content } of indexes(kb, report)) {
    if (!fs.existsSync(file)) report(file, 'missing INDEX.md', 'run: node cli.js index')
    else if (fs.readFileSync(file, 'utf8') !== content) report(file, 'INDEX.md is out of date', 'run: node cli.js index')
  }
  return errors
}

module.exports = { check, writeIndexes }
