---
name: memory
description: Sync diário da memória pessoal do Rodrigo (~/Documents/Repos/memory/). Coleta reuniões do Granola, agenda do Google Calendar e itens do inbox, propõe atualizações e aplica somente o que o Rodrigo aprovar. Use SEMPRE que o usuário pedir para "atualizar a memória", "rodar o sync", "processar o inbox", "puxar minhas reuniões", ou rodar /memory. Também use para consultas como "o que combinei com [pessoa]?" ou "qual o status do projeto X na minha memória?".
---

# Memory — sync diário da memória pessoal

A memória vive em `~/Documents/Repos/memory/`. Leia o `CLAUDE.md` de lá antes de qualquer coisa — ele define estrutura, convenções de nome e regras de link.

## Modos

- **Sync (padrão)**: `/memory` sem argumentos → executa o ciclo completo abaixo.
- **Consulta**: `/memory [pergunta]` → busca a resposta nos arquivos da memória (pessoas, reuniões, projetos) e responde com links para as fontes. Não propõe updates.

## Ciclo de sync

### 1. Coletar (em paralelo quando possível)

- **Granola** (MCP `granola`, carregar via ToolSearch): listar reuniões desde o último sync (ver data no topo do `_sistema/changelog.md`; na dúvida, últimas 48h). Puxar notas/resumo de cada uma.
- **Google Calendar** (MCP claude.ai, carregar via ToolSearch): eventos de hoje + próximos 7 dias.
- **Inbox**: ler todos os arquivos de `inbox/` (exceto LEIA-ME.md).
- Se o MCP do Granola não estiver autenticado, avisar o Rodrigo para rodar `/mcp` e autenticar — e seguir com as outras fontes.

### 2. Propor

Escrever as propostas em `_sistema/updates-pendentes.md`, agrupadas e numeradas:

```markdown
# Updates pendentes — {AAAA-MM-DD}

## Reuniões novas
1. **{título} ({data})** → criar `reunioes/{AAAA}/{MM}/{AAAA-MM-DD-assunto}.md` — participantes: X, Y. Resumo: ...

## Pessoas
2. **{nome}** → criar em `pessoas/time/` (apareceu em 3 reuniões; ainda não mapeado)
3. **{nome}** → atualizar histórico com decisão da reunião #1

## Projetos
4. ...

## Calendário
5. Atualizar `calendario/semana-atual.md` + novos prazos em `compromissos.md`

## Inbox
6. `inbox/{arquivo}` → mover conteúdo para `notas/trabalho/{nome}.md`
```

Regras de proposta:
- Reunião nova → sempre propor arquivo usando `_sistema/templates/reuniao.md`.
- Participante recorrente (2+ reuniões) sem arquivo em `pessoas/` → propor criação com `_sistema/templates/pessoa.md`. Perguntar ao Rodrigo se é `time/` ou `stakeholders/`.
- Decisão ou ação que envolve pessoa/projeto já mapeado → propor atualização no histórico do arquivo correspondente.
- Nunca aplicar nada nesta etapa.

### 3. Aprovar

Mostrar o resumo numerado na conversa e perguntar o que aprovar (tudo / números específicos / nada). Usar AskUserQuestion se ajudar.

### 4. Aplicar

Para cada item aprovado:
- Criar/editar os arquivos seguindo os templates e convenções do CLAUDE.md.
- Atualizar wikilinks nos dois sentidos (reunião ↔ pessoa ↔ projeto).
- Apagar do `inbox/` o que foi processado.
- Itens rejeitados: apenas remover de updates-pendentes.

### 5. Fechar

- Esvaziar `_sistema/updates-pendentes.md` (deixar "_Nenhum update pendente._").
- Adicionar entrada datada no `_sistema/changelog.md` com o que foi aplicado.
- `git add -A && git commit -m "sync: {AAAA-MM-DD}" && git push` no repo memory.
- Responder com resumo curto: o que entrou, o que ficou de fora, pendências detectadas (ações sem dono, conflitos de agenda).
