# ADR-001 — Stack Tecnológica e Decisões Arquiteturais Fundamentais

## Status

Aceito — 2026-08-24

## Contexto

O `apps/backend` do AutoForge ERP está vazio. Antes de iniciar a implementação, era necessário formalizar a stack tecnológica do backend e um conjunto de decisões arquiteturais transversais (multi-tenancy, autenticação, autorização, segurança, testes, observabilidade), que a documentação existente descrevia apenas em nível de princípio, sem mecanismo técnico definido.

`CLAUDE.md` (raiz) já indicava Node.js + Fastify como stack de backend, mas `docs/architecture/stack.md` não confirmava o framework HTTP, e este ADR estava vazio — não havia registro formal da decisão, como exige `CLAUDE.md` §9 ("Mudanças importantes de tecnologia deverão ser justificadas e documentadas").

## Decisão

A stack de backend do AutoForge ERP é:

|Camada|Escolha|
|-|-|
|Runtime|Node.js|
|Linguagem|TypeScript|
|Framework HTTP|**Fastify**|
|Banco de dados|PostgreSQL (mínimo: versão 16)|
|ORM|Prisma|
|Estratégia de ID técnico|UUID v7 (ver `docs/database/modelo-dados.md`)|
|Validação|Zod|
|Testes|Vitest|
|Versionamento de API|`/api/v1` (ver `docs/architecture/arquitetura.md`)|

### Por que Fastify

- Alto desempenho e baixo overhead, adequado a uma API que atenderá múltiplos módulos e tenants simultaneamente.
- Ciclo de vida de hooks (`onRequest`, `preHandler`, `onError`) que se encaixa diretamente nas necessidades já previstas de autenticação por sessão, verificação de tenant/permissão e tratamento centralizado de erros.
- Logger estruturado (Pino) embutido, alinhado à decisão de logging estruturado (`docs/architecture/observabilidade.md`).
- Ecossistema oficial de plugins (`@fastify/cookie`, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/cors`) cobre necessidades já previstas neste ADR sem depender de soluções de terceiros não avaliadas.
- TypeScript como cidadão de primeira classe, consistente com a stack já definida.

Esta seção registra a justificativa técnica; a escolha em si (Fastify) foi definida pelo responsável do produto e está confirmada aqui.

## Consequências

- `docs/architecture/stack.md` passa a citar Fastify explicitamente na seção de Backend.
- A estrutura interna do `apps/backend` (rotas, plugins, hooks) seguirá as convenções do Fastify — detalhamento reservado à fase de implementação, não a este ADR.
- Os plugins do ecossistema Fastify citados acima são a escolha padrão para as necessidades já decididas (cookie de sessão, rate limiting, cabeçalhos de segurança); a instalação efetiva ocorre apenas na fase de implementação.
- Nenhuma dependência foi instalada nesta etapa.

## Decisões relacionadas registradas nesta rodada (2026-08-24)

|#|Decisão|Documento|
|-|-|-|
|2|PostgreSQL como banco|`docs/database/modelo-dados.md`|
|3|Prisma como ORM|`docs/database/modelo-dados.md`|
|4|UUID como estratégia de IDs técnicos|`docs/database/modelo-dados.md`|
|5|Multi-tenancy via `tenantId` na camada de aplicação/Prisma, com caminho de evolução para PostgreSQL RLS|`docs/architecture/multi-tenant.md`|
|6|Autenticação por sessão server-side, cookie HttpOnly/Secure/SameSite, sem token em localStorage|`docs/architecture/autenticacao.md`|
|7|RBAC com perfis, convenção de permissões e matriz (escopo: módulos já documentados)|`docs/architecture/autorizacao.md`|
|8|`apps/frontend` e `apps/backend` permanecem separados nesta fase; sem Turborepo/monorepo|`docs/architecture/arquitetura.md`|
|9|API versionada em `/api/v1`|`docs/architecture/arquitetura.md`|
|10|Zod para validação na borda da API|`docs/architecture/arquitetura.md`|
|11|Vitest para testes de backend|`docs/architecture/testes.md`|
|12|Logging estruturado com request ID|`docs/architecture/observabilidade.md`|
|13|Rate limiting|`docs/architecture/seguranca.md`|
|14|Tratamento centralizado e seguro de erros|`docs/architecture/seguranca.md`|
|15|Auditoria de ações críticas|`docs/architecture/seguranca.md`|
|16|Segurança e isolamento de tenant como requisitos transversais|`docs/architecture/seguranca.md`, `docs/architecture/multi-tenant.md`|

## Decisões aprovadas — rodada adicional (2026-08-24)

|#|Decisão|Documento|
|-|-|-|
|17|Argon2id para hash de senha|`docs/architecture/autenticacao.md` §4.3|
|18|UUID v7 como estratégia de ID técnico|`docs/database/modelo-dados.md` §3|
|19|Pino (logger nativo do Fastify) como logger estruturado|`docs/architecture/observabilidade.md` §2|
|20|Sessão server-side em PostgreSQL (reconfirmada)|`docs/architecture/autenticacao.md` §4|
|21|Expiração deslizante da sessão: 12h de inatividade, teto absoluto de 7 dias|`docs/architecture/autenticacao.md` §4.5|
|22|Rate limiting por IP (pré-autenticação) e `userId`+`tenantId` (autenticado), com limites diferenciados por sensibilidade|`docs/architecture/seguranca.md` §5|
|23|CORS por lista explícita de origens por ambiente, sem wildcard|`docs/architecture/seguranca.md` §4|
|24|PostgreSQL 16 como versão mínima suportada|`docs/database/modelo-dados.md` §6|
|25|MFA registrado como decisão futura, não implementada nesta fase|`docs/architecture/autenticacao.md` §5.1|

## Pendências Bloqueantes Remanescentes

Estes itens foram deliberadamente **não decididos** nesta rodada — dependem de decisão de negócio, produto ou infraestrutura que não cabe à engenharia assumir sozinha:

|Pendência|O que bloqueia|Documento|
|-|-|-|
|`SameSite` final do cookie de sessão|Configuração de produção do cookie (desenvolvimento segue com `Lax`/`localhost`)|`docs/architecture/autenticacao.md` §5.3|
|Fluxo de recuperação de senha|Apenas a funcionalidade "esqueci minha senha" — não bloqueia login/sessão|`docs/architecture/autenticacao.md` §5.2|
|Cardinalidade Usuário↔Perfil (RBAC)|Desenho da relação Usuário↔Perfil no schema Prisma|`docs/architecture/autorizacao.md` §9|
|Preenchimento da matriz RBAC (perfil×permissão)|Implementação de autorização em qualquer módulo|`docs/architecture/autorizacao.md` §5, §9|
|Domínios de produção/homologação|Configuração de CORS e deploy desses ambientes (desenvolvimento local não é afetado)|`docs/architecture/seguranca.md` §4|
|Hospedagem do PostgreSQL|Configuração de string de conexão e deploy (não bloqueia o desenho do schema)|`docs/database/modelo-dados.md` §6|
|Valores numéricos finais de rate limiting|Apenas a calibração de produção — o mecanismo pode ser implementado com valores iniciais conservadores|`docs/architecture/seguranca.md` §5|

Nenhum desses itens deve ser assumido ou decidido durante a implementação sem aprovação explícita.
