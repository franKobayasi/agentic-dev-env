// init 與 update 在終端機上完成時印出的畫面；輸出不是終端機時由 runner 改印純文字
const LOGO = [
  ' █████╗ ██████╗ ███████╗',
  '██╔══██╗██╔══██╗██╔════╝',
  '███████║██║  ██║█████╗',
  '██╔══██║██║  ██║██╔══╝',
  '██║  ██║██████╔╝███████╗',
  '╚═╝  ╚═╝╚═════╝ ╚══════╝',
]

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'

const short = (commit) => (commit ? commit.slice(0, 7) : '?')

// summary 是 runner.init／runner.update 的回傳值；prevCommit 為 null 表示 init
function render(summary, { version, color }) {
  const paint = (text, ...codes) => (color ? codes.join('') + text + RESET : text)
  const { source, prevCommit, commit, skills, added, removed, workspaces } = summary
  const isUpdate = prevCommit !== null

  let commitLine = short(commit)
  if (isUpdate) {
    commitLine = prevCommit === commit ? `${short(commit)} ${paint('(up to date)', DIM)}` : `${short(prevCommit)} → ${paint(short(commit), BOLD)}`
  }
  const changes = [
    ...added.map((d) => paint(`+${d}`, GREEN)),
    ...removed.map((d) => paint(`-${d}`, RED)),
  ]
  const rows = [
    ['source', source],
    ['commit', commitLine],
    ['skills', `${skills} installed` + (changes.length ? `  (${changes.join(', ')})` : '')],
    ['workspaces', workspaces || './workspaces'],
  ]

  return [
    '',
    ...LOGO.map((line) => '  ' + paint(line, CYAN)),
    '',
    `  ${paint('v' + version, DIM)}  ·  ${paint(isUpdate ? 'Forge updated' : 'Forge initialized', BOLD)}`,
    '',
    ...rows.map(([k, v]) => `  ${k.padEnd(12)}${v}`),
    '',
    paint('  Next: open your agent in this directory.', DIM),
    '',
  ].join('\n')
}

module.exports = { render }
