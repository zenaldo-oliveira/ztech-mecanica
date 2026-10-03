# AutoForge ERP

Sistema SaaS de gestão para oficinas de veículos (carros, motos, utilitários e oficinas multimarca).

> Gestão completa da oficina, do orçamento ao financeiro, com CRM, manutenção preventiva, automação e inteligência artificial.

Detalhes completos do produto, arquitetura e regras de desenvolvimento estão em [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, TypeScript, Fastify
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **Validação:** Zod
- **Testes:** Vitest, Playwright

Monorepo com pnpm workspaces e Turborepo (`docs/decisions/ADR-002-monorepo.md`). Comandos na raiz: `pnpm install`, `pnpm dev`, `pnpm check` (lint + typecheck + testes + build).

## Estrutura do projeto

```text
apps/
├── frontend/   # Next.js — implementado, com dados de exemplo (mock)
└── backend/    # Node.js + Fastify — ainda não implementado

docs/           # documentação de produto, arquitetura, banco de dados, módulos, integrações e decisões
checklist/      # checklists de implementação (ver checklist/backend/)
scripts/
```

## Estado atual

- **Frontend:** protótipo funcional em `apps/frontend`, consumindo dados mockados (`apps/frontend/src/lib/mock/`). Módulos com tela implementada: Dashboard, Clientes, Veículos. Os demais módulos existem como placeholder ("Módulo em construção").
- **Backend:** ainda não implementado. A stack e as decisões arquiteturais estão definidas em `docs/decisions/ADR-001-stack.md`; o checklist de implementação está em `checklist/backend/`.

## Rodando o frontend

```bash
cd apps/frontend
pnpm install
pnpm dev
```

## Documentação

- Visão de produto: `docs/product/`
- Arquitetura: `docs/architecture/`
- Banco de dados: `docs/database/`
- Módulos: `docs/modules/`
- Integrações: `docs/integrations/`
- Decisões técnicas (ADRs): `docs/decisions/`
