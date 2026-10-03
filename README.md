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

## Ambiente local

Pré-requisitos: Node.js ≥ 20, pnpm 10 e Docker.

```bash
pnpm install                                   # instala todo o monorepo
pnpm db:up                                     # PostgreSQL 16 em 127.0.0.1:5433 (bancos ztech e ztech_test)
cp apps/backend/.env.example apps/backend/.env # valores apenas de desenvolvimento
pnpm --filter @ztech/backend db:migrate        # aplica as migrations no banco de desenvolvimento
pnpm --filter @ztech/backend db:seed           # oficinas de demonstração (dados fictícios)
pnpm dev                                       # frontend e backend
pnpm check                                     # validação completa: schema, lint, typecheck, testes, build
```

Os testes do backend usam o banco `ztech_test` (nunca o de desenvolvimento) e falham explicitamente se o PostgreSQL não estiver disponível.

### Acesso de demonstração

Após o seed, entre em `http://localhost:3000/login` com um dos usuários fictícios (ex.: `dono@oficina-alfa.test` ou `dono@oficina-beta.test`) e a senha definida em `SEED_DEMO_PASSWORD` no `apps/backend/.env`. Em desenvolvimento, os e-mails de recuperação de senha não são enviados: o `MockEmailProvider` grava cada mensagem em `apps/backend/.dev-mail/`.

### Vídeo de fundo do login

A tela de login usa `apps/frontend/public/videos/engine.mp4` (com pôster `engine-poster.jpg`) quando o arquivo existe; sem ele, ou se falhar ao carregar, exibe um motor procedural em SVG com a mesma cinemática (virabrequim → bielas → pistões). Recomendações para o arquivo:

- loop perfeito de 6–12 s, motor aberto com pistões, bielas e virabrequim em movimento;
- MP4 H.264 (`yuv420p`, `+faststart`), 1920×1080 ou menor, sem áudio, idealmente até 4–6 MB;
- exemplo: `ffmpeg -i origem.mov -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -vf "scale=1920:-2" engine.mp4`;
- pôster: um quadro do vídeo em JPG (`ffmpeg -i engine.mp4 -frames:v 1 -q:v 4 engine-poster.jpg`).

Use apenas vídeo com licença comercial. Após adicionar ou trocar o arquivo, gere um novo build do frontend.

O frontend chama a API pela mesma origem (`/api/*`, repassado ao backend por `API_INTERNAL_URL` — ver `apps/frontend/.env.example`); a sessão vive apenas em um cookie HttpOnly.

## Documentação

- Visão de produto: `docs/product/`
- Arquitetura: `docs/architecture/`
- Banco de dados: `docs/database/`
- Módulos: `docs/modules/`
- Integrações: `docs/integrations/`
- Decisões técnicas (ADRs): `docs/decisions/`
