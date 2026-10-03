# AutoForge ERP — Arquitetura do Sistema

## 1. Objetivo

Este documento define a arquitetura técnica do AutoForge ERP.

A arquitetura deverá suportar:

- SaaS multi-tenant;
- oficinas de carros e motos;
- clientes;
- veículos;
- serviços;
- orçamentos;
- ordens de serviço;
- produtos;
- estoque;
- fornecedores;
- compras;
- notas fiscais;
- financeiro;
- faturamento;
- CRM;
- manutenção preventiva;
- WhatsApp;
- IA;
- integrações externas.

A arquitetura deverá priorizar:

- segurança;
- isolamento de tenants;
- simplicidade;
- manutenção;
- escalabilidade;
- testabilidade;
- rastreabilidade;
- baixo acoplamento.

---

# 2. Princípio Arquitetural

O AutoForge será desenvolvido como uma aplicação web SaaS modular.

A arquitetura deverá separar claramente:

```text
Frontend
    ↓
API / Backend
    ↓
Domínio / Regras de Negócio
    ↓
Persistência
    ↓
Banco de Dados
```

---

# 3. Estrutura de Aplicações (Decisão)

O repositório é um **monorepo com pnpm workspaces e Turborepo** (`docs/decisions/ADR-002-monorepo.md`, que substitui a decisão 8 do ADR-001).

- `apps/frontend` (`@ztech/frontend`) e `apps/backend` (`@ztech/backend`) continuam sendo aplicações implantadas de forma independente;
- contratos compartilhados (schemas Zod, enums de domínio, tipos de request/response) ficam em `packages/*`, criados apenas quando houver código real para compartilhar — nunca replicados manualmente em cada aplicação;
- tarefas (`build`, `lint`, `typecheck`, `test`) são orquestradas pelo Turborepo a partir da raiz.

---

# 4. API

## 4.1 Versionamento

A API do backend é servida sob o prefixo `/api/v1` (`docs/decisions/ADR-001-stack.md`, decisão 9). Mudanças incompatíveis de contrato exigem uma nova versão (`/api/v2`), preservando a anterior pelo tempo necessário — a política exata de descontinuação de versões antigas não é definida nesta rodada.

## 4.2 Validação na Borda

Toda entrada da API é validada com Zod antes de alcançar a camada de domínio (`docs/decisions/ADR-001-stack.md`, decisão 10; detalhado em `docs/architecture/seguranca.md`, seção Validação de Entrada).

## 4.3 Camadas Internas do Backend

Refinando o diagrama acima para o backend especificamente:

```text
Rota Fastify (schema Zod na borda)
        ↓
Handler / Controller
        ↓
Serviço de Domínio (regra de negócio)
        ↓
Repositório (Prisma, com enforcement de tenantId)
        ↓
PostgreSQL
```

A nomenclatura exata das camadas (ex.: nomes de pastas, se "controller" ou "handler") é decisão de implementação — este documento fixa a separação de responsabilidades, não a estrutura de arquivos.

---

# 5. Requisitos Transversais

Os requisitos abaixo se aplicam a toda a API, independentemente do módulo, e são detalhados em documentos próprios:

|Requisito|Documento|
|-|-|
|Isolamento de tenant|`docs/architecture/multi-tenant.md`|
|Autenticação|`docs/architecture/autenticacao.md`|
|Autorização (RBAC)|`docs/architecture/autorizacao.md`|
|Segurança (rate limiting, erros, auditoria, segredos)|`docs/architecture/seguranca.md`|
|Testes|`docs/architecture/testes.md`|
|Observabilidade|`docs/architecture/observabilidade.md`|
