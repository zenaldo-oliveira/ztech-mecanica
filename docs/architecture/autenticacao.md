# AutoForge ERP — Arquitetura de Autenticação

## 1. Objetivo

Este documento define a arquitetura de autenticação do AutoForge ERP.

A autenticação deverá garantir que somente usuários autorizados possam acessar a plataforma e que cada usuário tenha acesso apenas aos recursos permitidos dentro da empresa à qual pertence.

A autenticação deverá ser responsável por estabelecer a identidade do usuário e criar uma sessão segura para acesso aos recursos protegidos do sistema.

A autorização será tratada separadamente e deverá determinar quais recursos cada usuário poderá acessar ou executar.

---

# 2. Princípios

A autenticação deverá seguir:

- segurança por padrão;
- princípio do menor privilégio;
- sessões seguras;
- senhas armazenadas de forma protegida;
- controle de sessão;
- autorização separada da autenticação;
- isolamento por tenant;
- proteção contra acesso indevido;
- proteção contra tentativas abusivas;
- auditoria de operações críticas;
- validação no backend;
- nenhuma confiança exclusiva no frontend.

---

# 3. Conceitos

O sistema possui os seguintes conceitos principais:

```text
Usuário
   ↓
Tenant
   ↓
Perfil
   ↓
Permissões
   ↓
Recursos
```

---

# 4. Estratégia de Sessão (Decisão)

A autenticação do AutoForge ERP usa **sessão server-side**, com o identificador de sessão entregue ao navegador via **cookie HttpOnly, Secure e SameSite** apropriado (`Lax` para navegação normal do próprio domínio; o valor exato — `Lax` vs `Strict` — depende da topologia final de domínios entre `apps/frontend` e `apps/backend`, ver seção 5).

Regras:

- o cookie contém apenas um identificador de sessão opaco e assinado — nunca dados de sessão em claro, nunca um JWT com claims de autorização;
- o token de sessão **nunca** é armazenado em `localStorage`, `sessionStorage` ou qualquer mecanismo acessível via JavaScript no cliente;
- o estado real da sessão (usuário, tenant, validade, revogação) fica no backend, persistido via Prisma/PostgreSQL — não é reconstruído a partir do conteúdo do cookie;
- toda requisição autenticada resolve o usuário e o tenant a partir da sessão validada no backend, nunca a partir de dado enviado pelo cliente.

Esta escolha (sessão server-side em vez de cookie stateless) permite revogação imediata de sessão — bloqueio de usuário, logout forçado, encerramento de todas as sessões de um usuário — capacidade considerada necessária dado que o sistema já prevê status `BLOCKED` para clientes e, futuramente, para usuários (`CLAUDE.md` §13).

## 4.1 Entidade de Sessão (conceitual)

|Campo|Observação|
|-|-|
|`id`|Identificador técnico da sessão (UUID, ver `docs/database/modelo-dados.md`)|
|`userId`|Usuário autenticado|
|`tenantId`|Tenant ao qual a sessão pertence|
|`createdAt`|Início da sessão|
|`expiresAt`|Expiração — sessão inválida após esse instante|
|`revokedAt`|Preenchido quando a sessão é encerrada antes da expiração (logout, bloqueio de usuário, ação administrativa)|
|`userAgent` / `ipAddress`|Opcional — apoio a auditoria e detecção de uso anômalo (ver `docs/architecture/seguranca.md`)|

Esta é uma descrição conceitual da entidade, não um `schema.prisma` — a definição física será feita na fase de implementação.

## 4.2 Ciclo de Vida

```text
Login (credenciais válidas)
        ↓
Sessão criada (registro no banco + cookie emitido)
        ↓
Requisições autenticadas (sessão validada a cada requisição)
        ↓
Logout ─────────────┐
        ou          ├──→ Sessão revogada (revokedAt preenchido)
Expiração natural ──┘
        ↓
Requisições futuras com esse cookie são rejeitadas
```

## 4.3 Hash de Senha (Decisão)

O algoritmo de hash de senha é **Argon2id**, variante recomendada pelo OWASP por combinar resistência a ataques de canal lateral (herdada do Argon2i) e a hardware dedicado — GPU/ASIC (herdada do Argon2d).

**Nota de implementação (não bloqueante):** os parâmetros de custo (memória, iterações, paralelismo) serão calibrados na fase de implementação, conforme a capacidade do servidor de produção. A linha de base do OWASP (~19 MiB de memória, 2 iterações, paralelismo 1) é a referência inicial, não um valor final.

## 4.4 Isolamento por Tenant na Autenticação

Um usuário pertence a exatamente um tenant (`CLAUDE.md` §12/§13). A sessão carrega o `tenantId` resolvido no momento do login e esse valor é a única fonte confiável de tenant para toda a requisição — nunca um valor enviado pelo cliente (ver `docs/architecture/multi-tenant.md` §3).

## 4.5 TTL e Renovação da Sessão (Decisão)

A sessão usa **expiração deslizante**:

- **inatividade:** 12 horas — cada requisição autenticada renova `expiresAt` por mais 12 horas a partir do momento da requisição;
- **teto absoluto:** 7 dias — independentemente de atividade, a sessão expira e exige novo login ao atingir esse limite.

Esses valores foram aprovados como baseline técnico de produção e podem ser revisados no futuro conforme a operação real da oficina (ex.: turnos de trabalho, política de segurança).

---

# 5. Pendências

## 5.1 MFA — decisão futura (não bloqueante)

Autenticação multifator não é implementada nesta fase e não há requisito documentado que a exija em nenhum arquivo do AutoForge. Fica registrada como possibilidade futura, a ser revisitada apenas se surgir requisito de segurança/conformidade — não bloqueia a implementação atual.

## 5.2 Recuperação de senha — PENDÊNCIA BLOQUEANTE

O fluxo de recuperação/redefinição de senha não está definido (canal de envio, expiração do token, se há redefinição assistida por administrador). Esta pendência bloqueia apenas a funcionalidade "esqueci minha senha" — não bloqueia login, sessão ou o restante da autenticação.

## 5.3 `SameSite` do cookie — PENDÊNCIA BLOQUEANTE

O valor final de `SameSite` (`Lax` vs `Strict`) depende da topologia de domínio entre `apps/frontend` e `apps/backend` em produção, ainda não definida — não é uma decisão técnica isolada, e não deve ser presumida. Esta pendência bloqueia apenas a configuração final do cookie em produção/homologação; o ambiente de desenvolvimento pode usar `Lax` com `localhost` sem prejuízo.
