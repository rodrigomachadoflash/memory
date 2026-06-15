# Memory — Stack Pessoal do Rodrigo

Este repositório é a memória pessoal do Rodrigo Machado (rodrigo.machado@flashapp.com.br, Growth/Marketing na Flash). Funciona como copiloto para trabalho e vida pessoal. É **individual** — diferente do stack `growth/`, que é compartilhado com o time.

## Como usar esta memória (instruções para o Claude)

1. **Sempre que o Rodrigo mencionar uma pessoa, reunião ou projeto**, verifique se existe arquivo correspondente aqui antes de responder. Use o contexto.
2. **Links**: arquivos se conectam com wikilinks `[[nome-do-arquivo]]` (sem extensão). Ao criar/atualizar um arquivo, adicione links para pessoas, projetos e reuniões relacionados — e atualize o outro lado do link quando fizer sentido.
3. **Nada entra direto**: atualizações em lote (sync diário) passam por `_sistema/updates-pendentes.md` e só são aplicadas com aprovação explícita do Rodrigo. Edições pedidas diretamente por ele em conversa podem ser aplicadas na hora.
4. **Datas sempre absolutas** (2026-06-12, não "ontem").
5. **Idioma**: português brasileiro.
6. Após aplicar mudanças aprovadas, registre um resumo em `_sistema/changelog.md` e faça commit no git.

## Estrutura

| Pasta | O que guarda |
|---|---|
| `profile/` | Quem é o Rodrigo: papel, objetivos, preferências de trabalho |
| `people/team/` | Pessoas do time direto — um arquivo por pessoa |
| `people/stakeholders/` | Stakeholders importantes (liderança, outras áreas, externos) |
| `meetings/YYYY/MM/` | Notas de reunião (Granola + manuais), por ano/mês |
| `calendar/` | Snapshot da semana + compromissos e prazos futuros |
| `projects/work/` | Projetos de trabalho em andamento — um arquivo por projeto |
| `projects/personal/` | Projetos e metas pessoais |
| `notes/work/` e `notes/personal/` | Notas avulsas, ideias, aprendizados |
| `inbox/` | Zona de despejo: qualquer coisa jogada aqui é processada no próximo sync |
| `_system/` | Mecânica da memória: updates pendentes, changelog, templates |

## Convenções de nome

- Pessoas: `nome-sobrenome.md` (ex: `ana-silva.md`)
- Reuniões: `AAAA-MM-DD-assunto-curto.md` (ex: `2026-06-12-weekly-growth.md`)
- Projetos e notas: kebab-case descritivo (ex: `campanha-black-friday.md`)

## Ciclo de atualização (diário)

O Rodrigo roda `/memory` uma vez por dia. A skill:
1. Coleta reuniões novas do Granola (MCP), agenda do Google Calendar e arquivos do `inbox/`
2. Propõe atualizações em `_sistema/updates-pendentes.md`
3. Rodrigo aprova/rejeita item a item na conversa
4. Aplica o aprovado, atualiza links cruzados, registra no changelog, commit + push

## Fontes conectadas

- **Granola** (MCP `granola`) — notas e transcrições de reuniões
- **Google Calendar** (MCP claude.ai) — agenda e compromissos
- **Slack, Gmail, Drive, Notion** (MCP claude.ai) — sob demanda
- **Stack do time**: `~/Documents/Repos/growth/` (contexto de trabalho compartilhado)