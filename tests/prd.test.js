// validate-prd.sh：PRD 的欄位在 frontmatter
const test = require('node:test')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { tmpdir } = require('./helpers')

const script = path.join(__dirname, '..', 'seed/hub/skills/ade-create-prd/validate-prd.sh')
const template = fs.readFileSync(path.join(__dirname, '..', 'seed/hub/knowledge/prd/_template.md'), 'utf8')

// 以範本填好一份可送出的 PRD，再套用 edit
function validate(edit = (s) => s) {
  const filled = template
    .replace(/^id: .*$/m, 'id: 3f9a2c')
    .replace(/^description: .*$/m, 'description: 讓顧客可以取消未出貨的訂單')
    .replace(/^date: .*$/m, 'date: 2026-10-16')
    .replace(/^proposer: .*$/m, 'proposer: PO')
    .replace('<標題>', '取消訂單')
    .replace('| <前置狀態> | <觸發> | <預期行為> | <例外處置> |', '| 訂單未出貨 | 顧客按取消 | 訂單取消 | 已出貨時拒絕 |')
  const f = path.join(tmpdir(), '2026-10-16-cancel-order.md')
  fs.writeFileSync(f, edit(filled))
  return spawnSync('bash', [script, f], { encoding: 'utf8' })
}

test('填好的 PRD 通過驗證', () => {
  const r = validate()
  assert.strictEqual(r.status, 0, r.stdout)
})

test('frontmatter 的欄位缺漏或不合法時不通過', () => {
  for (const [edit, msg] of [
    [(s) => s.replace('status: 草稿', 'status: 進行中'), 'status'],
    [(s) => s.replace('status: 草稿', 'status: 已廢止'), 'deprecation_reason'],
    [(s) => s.replace('id: 3f9a2c', 'id: XYZ'), 'id'],
    [(s) => s.replace('proposer: PO', 'proposer:'), 'proposer'],
  ]) {
    const r = validate(edit)
    assert.strictEqual(r.status, 1, `應不通過：${msg}`)
    assert(r.stdout.includes(msg), r.stdout)
  }
})
