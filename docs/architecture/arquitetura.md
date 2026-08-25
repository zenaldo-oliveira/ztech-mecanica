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

Nesta fase, `apps/frontend` e `apps/backend` permanecem **aplicações separadas e independentes** — sem workspace pnpm unificado na raiz, sem Turborepo, sem pacotes compartilhados (`packages/*`). Essa é uma decisão explícita (`docs/decisions/ADR-001-stack.md`, decisão 8), não um estado transitório assumido implicitamente.

Consequência direta: até que essa decisão mude, não existe um pacote de tipos/schemas compartilhado entre `apps/backend` e `apps/frontend` — contratos de API (tipos de request/response) são replicados manualmente em cada lado, ou o frontend consome a API tratando-a como um serviço externo. A necessidade futura de compartilhar tipos (ex.: via `packages/types`) é um gatilho já identificado para revisitar esta decisão, mas não é implementada agora.

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
