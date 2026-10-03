# ADR-002 — Monorepo com pnpm workspaces e Turborepo

## Status

Aceito — 2026-10-02. Substitui a decisão 8 de `ADR-001-stack.md`.

## Contexto

A decisão 8 do ADR-001 manteve `apps/frontend` e `apps/backend` como aplicações independentes, sem workspace nem pacotes compartilhados, e registrou um gatilho para revisitar a decisão: a necessidade de compartilhar tipos e schemas entre frontend e backend.

Esse gatilho foi atingido com a Fase 1 (autenticação, RBAC, contratos de API):

- frontend e backend precisam dos mesmos schemas Zod (entrada de formulários = entrada da API) e dos mesmos enums de domínio (status de OS, papéis, permissões);
- manter cópias manuais desses contratos em dois lugares cria divergência silenciosa — exatamente o tipo de erro que a validação deveria evitar;
- duas instalações e dois lockfiles independentes dificultam CI, atualização de dependências e execução das validações (lint, typecheck, testes, build) em um único comando.

## Decisão

1. O repositório passa a ser um **monorepo com pnpm workspaces** (`pnpm-workspace.yaml` na raiz), com um único `pnpm-lock.yaml`.
2. **Turborepo** orquestra as tarefas `build`, `lint`, `typecheck`, `test` e `dev` (`turbo.json` na raiz), com cache local.
3. As aplicações **mantêm seus diretórios**: `apps/frontend` (pacote `@ztech/frontend`) e `apps/backend` (pacote `@ztech/backend`). Não há renomeação para `web`/`api`.
4. Pacotes compartilhados ficam em `packages/*` e são criados **somente quando houver código real para compartilhar** (o primeiro previsto é `packages/validation`, com schemas Zod e enums de domínio, na Fase 1B/1C).
5. `build` depende do `typecheck` do próprio pacote. No frontend, `typecheck` executa `next typegen && tsc --noEmit`, para não depender de artefatos gerados por um build concorrente.

## Alternativas consideradas

- **Manter apps separados** (ADR-001 decisão 8): rejeitada — o custo de contratos duplicados cresce a cada módulo.
- **Nx**: mais recursos (geradores, grafo de projetos), porém mais configuração e convenções próprias do que o projeto precisa hoje.
- **Somente pnpm workspaces, sem Turborepo**: viável, mas sem cache e sem ordenação de tarefas entre pacotes; Turborepo adiciona pouco custo (um arquivo de configuração) e é a escolha indicada no plano aprovado.

## Consequências

- Comandos na raiz: `pnpm install`, `pnpm check` (lint + typecheck + test + build), `pnpm dev`, `pnpm build`.
- Os lockfiles por aplicação e `apps/frontend/pnpm-workspace.yaml` foram removidos; o conteúdo deste último (dependências com scripts de instalação ignorados) foi movido para o `pnpm-workspace.yaml` da raiz.
- Scripts de instalação de dependências seguem bloqueados por padrão (pnpm 10); exceções são explícitas em `onlyBuiltDependencies`.
- `apps/frontend` e `apps/backend` continuam sendo implantados de forma independente — o monorepo é uma decisão de organização de código, não de deploy.
