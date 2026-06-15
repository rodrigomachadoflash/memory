const express = require('express')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { marked } = require('marked')

const app = express()
const PORT = 3737
const ROOT = path.resolve(__dirname, '..')

// Wikilink extension for marked
marked.use({
  extensions: [{
    name: 'wikilink',
    level: 'inline',
    start(src) { return src.indexOf('[[') },
    tokenizer(src) {
      const match = /^\[\[([^\]]+)\]\]/.exec(src)
      if (match) return { type: 'wikilink', raw: match[0], text: match[1] }
    },
    renderer(token) {
      return `<a href="#/file?name=${encodeURIComponent(token.text)}" class="wikilink">[[${token.text}]]</a>`
    }
  }],
  gfm: true,
  breaks: true
})

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

function safePath(rel) {
  const abs = path.resolve(ROOT, (rel || '').replace(/^[/\\]/, ''))
  if (!abs.startsWith(ROOT)) throw new Error('Acesso negado')
  return abs
}

function toSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

function walkMd(dir, depth = 0) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('.') || f === 'LEIA-ME.md') continue
    const fp = path.join(dir, f)
    const stat = fs.statSync(fp)
    if (stat.isDirectory() && depth < 3) {
      results.push(...walkMd(fp, depth + 1))
    } else if (f.endsWith('.md')) {
      results.push({ name: f.replace('.md', ''), path: path.relative(ROOT, fp), modified: stat.mtime.toISOString() })
    }
  }
  return results
}

// GET /api/file?path=...
app.get('/api/file', (req, res) => {
  try {
    const fp = safePath(req.query.path)
    const content = fs.readFileSync(fp, 'utf-8')
    res.json({ content, html: marked(content) })
  } catch (e) {
    res.status(404).json({ error: e.message })
  }
})

// GET /api/list?dir=...
app.get('/api/list', (req, res) => {
  try {
    const dir = safePath(req.query.dir || '')
    res.json(walkMd(dir))
  } catch (e) {
    res.status(404).json({ error: e.message })
  }
})

// GET /api/resolve?name=... (find a file by slug)
app.get('/api/resolve', (req, res) => {
  const slug = toSlug(req.query.name || '')
  const searchDirs = ['pessoas/time', 'pessoas/stakeholders', 'projetos/trabalho', 'projetos/pessoal', 'notas/trabalho', 'notas/pessoal', 'perfil']

  for (const dir of searchDirs) {
    const fp = path.join(ROOT, dir, slug + '.md')
    if (fs.existsSync(fp)) return res.json({ path: path.join(dir, slug + '.md') })
  }

  // Search in reunioes recursively
  function findInDir(d) {
    if (!fs.existsSync(d)) return null
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f)
      if (fs.statSync(fp).isDirectory()) { const r = findInDir(fp); if (r) return r }
      else if (f === slug + '.md') return path.relative(ROOT, fp)
    }
    return null
  }
  const found = findInDir(path.join(ROOT, 'reunioes'))
  if (found) return res.json({ path: found })

  res.status(404).json({ error: `"${req.query.name}" não encontrado na memória` })
})

// GET /api/updates
app.get('/api/updates', (req, res) => {
  try {
    const fp = path.join(ROOT, '_sistema/updates-pendentes.md')
    const content = fs.readFileSync(fp, 'utf-8')
    const isEmpty = content.includes('_Nenhum update pendente._')
    res.json({ sections: isEmpty ? [] : parseUpdates(content), isEmpty })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function parseUpdates(content) {
  const sections = []
  let current = null
  for (const line of content.split('\n')) {
    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim(), items: [] }
      sections.push(current)
    } else if (current && /^\d+\./.test(line.trim())) {
      const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*[→—]\s*(.+)$/)
      if (!match) continue
      const detail = match[3].trim()
      const folder = inferFolder(detail)
      current.items.push({
        number: parseInt(match[1]),
        name: match[2],
        detail,
        type: inferType(current.title),
        folder,
        ambiguous: folder === null && current.title.toLowerCase().includes('pessoa')
      })
    }
  }
  return sections.filter(s => s.items.length > 0)
}

function inferType(title) {
  const t = title.toLowerCase()
  if (t.includes('pessoa')) return 'person'
  if (t.includes('projeto')) return 'project'
  if (t.includes('reuni')) return 'meeting'
  if (t.includes('perfil')) return 'profile'
  return 'other'
}

function inferFolder(detail) {
  const hasTime = detail.includes('`time/`')
  const hasStake = detail.includes('`stakeholders/`')
  if (hasTime && !hasStake) return 'pessoas/time'
  if (hasStake && !hasTime) return 'pessoas/stakeholders'
  return null
}

// POST /api/approve
app.post('/api/approve', (req, res) => {
  const { items } = req.body
  const applied = [], errors = []
  const today = new Date().toISOString().slice(0, 10)

  for (const item of items) {
    try { applyItem(item); applied.push(item.number) }
    catch (e) { errors.push({ number: item.number, error: e.message }) }
  }

  // Clear updates-pendentes
  fs.writeFileSync(path.join(ROOT, '_sistema/updates-pendentes.md'),
    '# Updates pendentes\n\nPropostas de atualização aguardando aprovação do Rodrigo. Preenchido pelo `/memory`, esvaziado após aprovação/rejeição.\n\n_Nenhum update pendente._\n')

  // Append to changelog
  if (applied.length > 0) {
    const clPath = path.join(ROOT, '_sistema/changelog.md')
    const cl = fs.readFileSync(clPath, 'utf-8')
    const entry = `\n## ${today}\n\n- Aprovados via web UI: itens ${applied.join(', ')} (${applied.length} criados)\n`
    fs.writeFileSync(clPath, cl.replace('# Changelog da memória\n', '# Changelog da memória\n' + entry))
  }

  // Git commit + push
  try {
    execSync('git add -A', { cwd: ROOT, stdio: 'pipe' })
    execSync(`git commit -m "sync: ${today} — ${applied.length} aprovados via web"`, { cwd: ROOT, stdio: 'pipe' })
    execSync('git push', { cwd: ROOT, stdio: 'pipe' })
  } catch (e) {
    errors.push({ error: 'git: ' + (e.stderr?.toString() || e.message).slice(0, 120) })
  }

  res.json({ applied, errors })
})

function personTemplate({ name, role, email, folder, notes }) {
  return `# ${name}

- **Papel**: ${role || '<!-- preencher -->'}
- **Relação**: ${folder?.includes('time') ? 'time direto' : 'stakeholder'}
- **E-mail / Slack**: ${email || '<!-- preencher -->'}
- **Desde**: <!-- preencher -->

## Contexto

${notes || '<!-- O que essa pessoa toca, estilo de trabalho, como se comunicar bem com ela. -->'}

## Acordos e pendências

<!-- nenhum ainda -->

## Histórico

<!-- Atualizado pelo sync: links para reuniões e decisões relevantes, mais recente primeiro -->

## Relacionados

<!-- [[projeto-exemplo]] -->
`
}

function projectTemplate({ name, notes }) {
  const today = new Date().toISOString().slice(0, 10)
  return `# ${name}

- **Status**: em andamento
- **Início**: ${today}
- **Objetivo**: <!-- preencher -->
- **Pessoas**: <!-- [[pessoa]] (papel) -->

## Situação atual

${notes || '<!-- preencher -->'}

## Linha do tempo

- ${today} — projeto mapeado pela memória

## Pendências

<!-- - [ ] pendência — dono — prazo -->
`
}

function applyItem(item) {
  if (item.type === 'person') {
    const folder = item.folder || 'pessoas/stakeholders'
    const dir = path.join(ROOT, folder)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const fp = path.join(dir, toSlug(item.name) + '.md')
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, personTemplate(item))
  } else if (item.type === 'project') {
    const dir = path.join(ROOT, 'projetos/trabalho')
    const fp = path.join(dir, toSlug(item.name) + '.md')
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, projectTemplate(item))
  }
  // profile/meeting/other: sem auto-criação — ficam para edição manual
}

app.listen(PORT, () => {
  console.log(`\n  🧠  Memory  →  http://localhost:${PORT}\n`)
})
