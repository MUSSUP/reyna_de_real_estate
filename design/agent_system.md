# Agent System Design

> For projects whose deliverable is a **team of agents** (orchestrator + specialists), not (only) a web app.
> Populated during Planning Mode via `/init-agent-system`. Complements architecture.md, data_model.md, mcps/inventory.md, skills/inventory.md.

## Org Chart (orchestrator + specialists)

(Diagram/description: one orchestrator that receives and routes; specialists with one role each. Mark the 2–3 to build first.)

## Agents

| Agent | Role (one process) | Memory / DB | Integrations (MCP/API) | Model (provider · model) | Credential level | Permissions (read / write / never) | Build priority |
|-------|--------------------|-------------|------------------------|--------------------------|------------------|------------------------------------|----------------|
| [orchestrator] | … | … | … | … | L3 | … | 1 |
| [specialist] | … | … | … | … | L3 | … | 2 |

## Memory & Data per Agent

For each agent, classify every data need and pick the store (justify by scale / cloud / multi-user):
- **Exact/relational** (clients, orders, numbers) → Airtable / Postgres·Supabase
- **Knowledge for semantic search (RAG)** → files+embeddings (small) / Supabase-pgvector / Pinecone (large or cloud)
- **Preferences & conversation** → key-value
- **Living notes** → second brain (Obsidian/markdown)
State explicitly when a vector store is NOT needed yet.

## Model Provider Layer (Rule 9)

See architecture.md → "Model Provider Layer". Every agent's brain is a config field `{ provider, model, apiKey, baseUrl? }` behind the shared adapter. A provider swap touches only config — not the agents' manuals, skills, memory, or integrations.

## Quality & Guardrails

- Optional **reviewer agent** that checks output before publishing/sending.
- Global rules: never invent data, never mix one client's data with another's, brand tone.
- **Outward/dangerous actions** (send messages to clients, move money, delete) require explicit human confirmation — map each to a credential level and a confirmation gate.

## Channels & Runtime

- **Channels**: how the user talks to the agents (Telegram / Slack / web / CLI) and how each is triggered.
- **Runtime**: local vs server/cloud · single vs team users · what happens if it goes down (availability + backup).

## Per-agent build artifacts (filled during execution)

For each agent: its **manual** (system prompt: role, memories consulted, behavior, rules, tone) + its **config** (model via the provider adapter, integrations, permissions, budget). Test each with 3 real prompts before moving on.
