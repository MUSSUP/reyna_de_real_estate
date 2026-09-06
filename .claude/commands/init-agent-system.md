# Agent-System Initialization — Planning Mode (agent-team track)

You are initializing an **agent-system** project from LA-MAQUINARIA-APP-TEMPLATE: the deliverable is a **team of agents** (orchestrator + specialists), not (only) a web app.

CLAUDE.md is already loaded and governs your behavior. Follow it — do not repeat its rules. This is the agent-team variant of `/init-project`: same Planning Gate, same credential levels (1/2/3), same IT/UJ + milestone decomposition, same no-code-until-approved. Rule 9 (model provider portability) is the core requirement here.

Complete Planning Mode in order:

1. **Understand**: Read START_PROJECT_PROMPT.md / conversation. Purpose, who uses it, constraints.

2. **Ask** (write to planning/questions.md; wait on blocking items). Interview the user 2–3 questions at a time across these areas:
   - **Processes**: which weekly tasks repeat / cost time / get dropped. (Each process → one agent.)
   - **Org chart**: propose orchestrator + specialists, one role each; mark the 2–3 to build first.
   - **Memory & data** (guide the user): classify each data need → relational (Airtable/Postgres-Supabase) · knowledge/RAG (files+embeddings small; Supabase-pgvector/Pinecone large) · key-value (prefs/session) · second brain (notes). Recommend the concrete store AND justify (scale/cloud/multi-user). Say when a vector store is NOT needed yet.
   - **Platforms the user already has**: CRM, calendar, messaging, mail, billing → which MCPs/APIs each agent needs. Don't invent integrations.
   - **Tools & permissions**: per agent, read/write/execute and what it must never touch. Flag outward/dangerous actions.
   - **Model & cost**: model per agent (heavier reasoning → stronger model; simple → cheaper) + budget cap.
   - **Quality**: optional reviewer agent; global rules (no inventing, no mixing client data, brand tone).
   - **Channels**: Telegram/Slack/web/CLI and triggers.
   - **Runtime**: local vs cloud, single vs team, failover.

3. **Requirements & Scope & Risks**: planning/requirements.md, planning/scope.md, planning/risks.md. Risks must include outward actions (messages to clients, money, deletes).

4. **Design** (priority-based depth):
   - **design/agent_system.md** — fill the org chart + the per-agent table (role · memory/DB · integrations · model · credential level · permissions · build priority) + memory-per-agent decisions.
   - **design/architecture.md** — include the **Model Provider Layer** (Rule 9): the single adapter, config shape `{provider, model, apiKey, baseUrl?}`, supported providers, the swap test. Plus the **Credential Level Mapping** (model API keys = Level 3).
   - **design/data_model.md** — the stores chosen and what each holds.
   - **design/stack_selection.md** — fill the **AI / Model Provider** section (abstraction, default + alternates).
   - docs/nfr.md as needed.

5. **Decompose**: Infrastructure Tasks (provider adapter, memory/DB setup, channels, auth/admin) + one User Journey per agent ("user asks X → orchestrator routes → specialist answers end-to-end, tested"). Group into milestones in implementation/task_tracker.md and implementation/user_journeys.md. **The provider adapter is an early Infrastructure Task** so every agent is built on it from day one.

6. **Skills & MCPs** (do not skip): search registries + environment for the integrations named in step 2. Install and verify. Document in skills/inventory.md and mcps/inventory.md.

7. **Decisions**: record in docs/decision_log.md — especially the store choices (and what was rejected) and the provider/adapter choice.

8. **Memory & Summary**: update docs/project_memory.md. Generate design/design_summary.md (~50 lines): org chart, agent list, store map, provider adapter, credential map, channels.

9. **Present**: structured summary — org chart, per-agent table, IT list (adapter first), UJ list grouped by milestone in build order, the 2–3 agents built first, justified data decisions, top risks (outward actions). Wait for user approval.

**Quality check before presenting:**
- One role per agent (no todólogo). Every process maps to an agent or is explicitly out of scope.
- Every agent has: a memory/store, a model via the adapter, permissions, a credential level.
- Rule 9 satisfied: no provider hardcoded; swap test defined in architecture.md.
- Every outward/dangerous action has a confirmation gate.
- Every model API key assigned Level 3.

No code until the user approves. Then run `/start-execution` (build the provider adapter and stores first, then agents one at a time, testing each with 3 real prompts).
