---
name: memory
description: Sync diário da memória pessoal do Rodrigo (~/Documents/Repos/memory/). Coleta reuniões do Granola, agenda do Google Calendar e itens do inbox, propõe atualizações e aplica somente o que o Rodrigo aprovar. Use SEMPRE que o usuário pedir para "atualizar a memória", "rodar o sync", "processar o inbox", "puxar minhas reuniões", ou rodar /memory. Também use para consultas como "o que combinei com [pessoa]?" ou "qual o status do projeto X na minha memória?".
---

# Memory — sync diário da memória pessoal

A memória vive em `~/Documents/Repos/memory/`. Leia o `CLAUDE.md` de lá antes de qualquer coisa — ele define estrutura, convenções de nome e regras de link.

## Modos

- **Sync (padrão)**: `/memory` sem argumentos → executa o ciclo completo abaixo.
- **Consulta**: `/memory [pergunta]` → busca a resposta nos arquivos da memória (people, meetings, projects) e responde com links para as fontes. Não propõe updates.

## Ciclo de sync

### 1. Coletar (em paralelo quando possível)

- **Granola** (MCP `granola`, carregar via ToolSearch): listar reuniões desde o último sync (ver data no topo do `_system/changelog.md`; na dúvida, últimas 48h). Puxar notas/resumo de cada uma.
- **Google Calendar** (MCP claude.ai, carregar via ToolSearch): eventos de hoje + próximos 7 dias.
- **Inbox**: ler todos os arquivos de `inbox/` (exceto LEIA-ME.md).
- Se o MCP do Granola não estiver autenticado, avisar o Rodrigo para rodar `/mcp` e autenticar — e seguir com as outras fontes.

### 2. Propor

Escrever as propostas em `_system/updates-pendentes.md`, agrupadas e numeradas:

```markdown
# Updates pendentes — {YYYY-MM-DD}

## Meetings
1. **{título} ({data})** → criar `meetings/{YYYY}/{MM}/{YYYY-MM-DD-topic}.md` — participantes: X, Y. Resumo: ...

## People
2. **{nome}** → criar em `people/team/` (apareceu em 3 reuniões; ainda não mapeado)
3. **{nome}** → atualizar histórico com decisão da reunião #1

## Projects
4. ...

## Calendar
5. Atualizar `calendar/semana-atual.md` + novos prazos em `compromissos.md`

## Inbox
6. `inbox/{arquivo}` → mover conteúdo para `notes/work/{nome}.md`
```

Regras de proposta:
- Reunião nova → sempre propor arquivo usando `_system/templates/reuniao.md`.
- Participante recorrente (2+ reuniões) sem arquivo em `people/` → propor criação com `_system/templates/pessoa.md`. Perguntar ao Rodrigo se é `team/` ou `stakeholders/`.
- Decisão ou ação que envolve pessoa/projeto já mapeado → propor atualização no histórico do arquivo correspondente.
- Nunca aplicar nada nesta etapa.

### 3. Aprovar

Mostrar o resumo numerado na conversa e perguntar o que aprovar (tudo / números específicos / nada). Usar AskUserQuestion se ajudar.

### 4. Aplicar

Para cada item aprovado:
- Criar/editar os arquivos seguindo os templates e convenções do CLAUDE.md.
- Atualizar wikilinks nos dois sentidos (meeting ↔ person ↔ project).
- Apagar do `inbox/` o que foi processado.
- Itens rejeitados: apenas remover de updates-pendentes.

### 5. Skill feedback (loop de aprendizado)

Antes de fechar, cheque se há outputs de skills sem rating:

```bash
# Outputs novos desde o último sync (data do último changelog)
grep -v "^#\|^$\|^|---" ~/Documents/Repos/growth/output/INDEX.md | tail -20
```

Para cada output novo que **não** aparece em nenhum `feedback.md` de skill:

1. Mostre: _"Novo output de /{skill}: `{nome-arquivo}` — quer registrar uma nota? (1-10 e uma linha, ou Enter para pular)"_
2. Se o Rodrigo responder:
   - Escreva a linha no `feedback.md` da skill correspondente (seção "Outputs de referência").
   - Se não existir `feedback.md`, crie a partir do template em `growth/skills/_sistema/feedback-template.md`.
3. Se pular: sem problema — registre o arquivo como "sem rating" para a próxima rodada.

Máximo **3 outputs por sync** para não virar um interrogatório. Priorize os mais recentes.

### 6. Fechar

- Esvaziar `_system/updates-pendentes.md` (deixar "_Nenhum update pendente._").
- Adicionar entrada datada no `_system/changelog.md` com o que foi aplicado.
- `git add -A && git commit -m "sync: {YYYY-MM-DD}" && git push` no repo memory.
- Responder com resumo curto: o que entrou, o que ficou de fora, pendências detectadas (ações sem dono, conflitos de agenda). Se capturou ratings de skills, mencionar quais skills foram atualizadas.
