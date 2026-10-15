// index：資料夾 README.md 的 frontmatter 設 index 時產生 INDEX.md，check 比對一致性
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const runner = require('../lib/runner')
const { writeIndexes } = require('../lib/check')
const { tmpdir, create } = require('./helpers')

const layout = (ade) => ({ knowledge: path.join(ade, 'hub/knowledge'), skills: path.join(ade, 'hub/skills'), section: path.join(ade, 'hub/CLAUDE.section.md') })
const prd = (ade, ...p) => path.join(ade, 'hub/knowledge/prd', ...p)

function enableIndex(ade, value = '[status, description]') {
  const readme = prd(ade, 'README.md')
  fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/^description: .*$/m, `$&\nindex: ${value}`))
  fs.writeFileSync(prd(ade, '2026-01-01-a.md'), '---\nid: aaaaaa\ndescription: 第一份 | 需求\nstatus: 草稿\n---\n\n# A\n')
}

test('index 依 README 的 index 欄位產生 INDEX.md，check 通過', () => {
  const ade = create(tmpdir())
  enableIndex(ade)
  const { errors, changed } = writeIndexes(ade, layout(ade))
  assert.deepStrictEqual(errors, [])
  assert.deepStrictEqual(changed, ['hub/knowledge/prd/INDEX.md'])
  const index = fs.readFileSync(prd(ade, 'INDEX.md'), 'utf8')
  assert.match(index, /^\| 檔案 \| status \| description \|$/m)
  assert.match(index, /^\| \[2026-01-01-a\.md\]\(\.\/2026-01-01-a\.md\) \| 草稿 \| 第一份 \\\| 需求 \|$/m)
  assert(!index.includes('_template.md'), '_ 開頭的範本不列入')
  assert.deepStrictEqual(runner.check(ade), [])
  assert.deepStrictEqual(writeIndexes(ade, layout(ade)).changed, [], '內容不變時不重寫')
})

test('check 擋下過期或缺少的 INDEX.md', () => {
  const ade = create(tmpdir())
  enableIndex(ade)
  assert(runner.check(ade).some((e) => e.includes('missing INDEX.md')))
  writeIndexes(ade, layout(ade))
  fs.writeFileSync(prd(ade, '2026-01-02-b.md'), '---\nid: bbbbbb\ndescription: 第二份\n---\n\n# B\n')
  assert(runner.check(ade).some((e) => e.includes('INDEX.md is out of date')))
})

test('沒有 index 卻有 INDEX.md、index 格式錯誤，都是錯誤', () => {
  const ade = create(tmpdir())
  fs.writeFileSync(prd(ade, 'INDEX.md'), '# 手寫的索引\n')
  assert(runner.check(ade).some((e) => e.includes('INDEX.md without index')))
  fs.rmSync(prd(ade, 'INDEX.md'))
  enableIndex(ade, 'status')
  const { errors } = writeIndexes(ade, layout(ade))
  assert(errors.some((e) => e.includes('invalid index "status"')))
  assert(!fs.existsSync(prd(ade, 'INDEX.md')), '設定有錯時不寫入')
})
