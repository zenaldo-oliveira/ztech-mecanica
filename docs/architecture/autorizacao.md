# AutoForge ERP — Arquitetura de Autorização (RBAC)

## 1. Objetivo

Este documento define o modelo de autorização (RBAC — Role-Based Access Control) do AutoForge ERP.

A autorização é tratada como uma responsabilidade **separada** da autenticação (`docs/architecture/autenticacao.md` §1): a autenticação estabelece *quem* é o usuário; a autorização determina *o que* esse usuário pode fazer.

Esta é uma decisão registrada em `docs/decisions/ADR-001-stack.md` (decisão 7).

---

# 2. Conceitos

```text
Usuário
   ↓
Perfil (Role)
   ↓
Permissões
   ↓
Recurso / Ação
```

- **Perfil (Role):** conjunto nomeado de permissões, atribuído a um usuário dentro de um tenant.
- **Permissão:** autorização atômica para executar uma ação sobre um recurso, no formato `recurso.acao` (convenção já usada em `docs/modules/clientes.md` §11, ex.: `customers.read`, `customers.create`).
- Um usuário pode possuir **um ou mais** perfis: a relação Usuário ↔ Perfil é **N:N**, implementada pela tabela `UserRole` (sempre dentro da oficina do usuário). As permissões efetivas são a união das permissões de todos os seus perfis.

---

# 3. Perfis

Os perfis conceituais já definidos em `CLAUDE.md` §13 são:

```text
proprietário
administrador
gerente
atendente
mecânico
financeiro
```

O sistema implementa esses perfis e mais o perfil **somente leitura** (`VIEWER`). As permissões de cada perfil estão na matriz aprovada (seção 5).

---

# 4. Convenção de Permissões

Toda permissão segue o formato `recurso.acao`, onde `recurso` corresponde ao módulo/entidade e `acao` a uma operação sobre ele.

Ações básicas usadas no catálogo:

```text
read
create
update
delete
```

Módulos definem ações adicionais específicas de seu domínio (ex.: `view_history`, `manage_contacts`, `deactivate`, `cancel`, `issue`). As permissões existentes são somente as do catálogo aprovado (seção 5.2) — uma ação citada na documentação de um módulo, mas fora do catálogo (ex.: `customers.export`), não existe no sistema. Cada módulo documenta suas permissões em `docs/modules/*.md`, seguindo esta convenção.

---

# 5. Catálogo e Matriz Perfil × Permissão — APROVADOS

> **Status: aprovado** (Prompt 04B, 2026-10-03 — opção A para financeiro/fiscal).
> Fonte única no código: `packages/validation/src/rbac.ts` (`PERMISSIONS` e `DEFAULT_ROLE_PERMISSIONS`),
> sincronizada para o banco por `apps/backend/src/modules/rbac/catalog-sync.ts`.
> O catálogo oficial é o implementado nesse arquivo; este documento o descreve.

## 5.1 Perfis

`OWNER` (Proprietário), `ADMIN` (Administrador), `MANAGER` (Gerente), `ATTENDANT` (Atendente),
`MECHANIC` (Mecânico), `FINANCIAL` (Financeiro), `VIEWER` (Somente leitura).

## 5.2 Catálogo de permissões

|Recurso|Permissões|
|-|-|
|`customers`|`read`, `create`, `update`, `delete`, `view_history`, `manage_contacts`|
|`vehicles`|`read`, `create`, `update`, `delete`|
|`services`|`read`, `create`, `update`, `deactivate`, `manage_prices`, `manage_fiscal`|
|`products`|`read`, `create`, `update`, `deactivate`, `view_cost`, `manage_prices`, `manage_fiscal`|
|`quotes`|`read`, `create`, `update`, `send`, `approve`, `reject`, `cancel`, `convert`, `edit_prices`, `apply_discount`, `view_cost`, `print`|
|`work_orders`|`read`, `create`, `update`, `change_status`, `register_approval`, `complete`, `reopen`, `close`, `cancel`, `assign`, `edit_prices`, `apply_discount`, `view_cost`, `print`|
|`financial`|`read`, `create`, `update`|
|`fiscal`|`read`, `issue`|
|`users`|`read`, `manage`|
|`settings`|`manage`|
|`audit`|`read`|

Decisões registradas com o catálogo:

- **`quotes.delete` removida** — orçamento não é excluído; usa-se `quotes.cancel` (`docs/modules/orcamentos.md` §14);
- **`work_orders.delete` removida** — OS não é excluída; usa-se `work_orders.cancel`;
- **`customers.export` fora do MVP** — não faz parte do catálogo;
- **`work_orders.close_with_receivable` fora desta fase** — depende de contas a receber (Financeiro);
- **`vehicles.delete` permanece** — a regra de exclusão de veículo com histórico será definida no módulo Veículos;
- **`services.manage_fiscal` e `products.manage_fiscal` fazem parte do catálogo**, mesmo antes do módulo Fiscal;
- **financeiro/fiscal (opção A):** mantidos `financial.read/create/update` e `fiscal.read/issue`. Não há
  `financial.delete` nem `fiscal.create/update/delete` (documento fiscal emitido é cancelado, não excluído);
  as chaves definitivas serão revistas quando os módulos Financeiro e Fiscal forem especificados.

## 5.3 Matriz

- **OWNER** e **ADMIN**: todas as permissões do catálogo.
- **MANAGER**: todo `customers.*`, `vehicles.*`, `services.*`, `products.*` e `quotes.*`; `work_orders.*`
  exceto `work_orders.close`; `financial.read/create/update`; `fiscal.read/issue`; `users.read`; `audit.read`.
  Não possui `users.manage` nem `settings.manage`.
- **ATTENDANT**: `customers.read/create/update/view_history/manage_contacts`; `vehicles.read/create/update`;
  `services.read`; `products.read`; `quotes.read/create/update/send/approve/reject/convert/print`;
  `work_orders.read/create/update/change_status/register_approval/assign/print`.
  Sem exclusões, custos, preços, descontos, cancelamentos, financeiro, fiscal, usuários ou auditoria.
- **MECHANIC**: `customers.read`; `vehicles.read`; `services.read`; `products.read`;
  `work_orders.read/update/change_status/complete`.
- **FINANCIAL**: `customers.read`; `services.read`; `products.read/view_cost`; `quotes.read`;
  `work_orders.read/close/print`; `financial.read/create/update`; `fiscal.read/issue`. Sem acesso a veículos.
- **VIEWER**: somente `customers.read`, `vehicles.read`, `services.read`, `products.read`, `quotes.read`,
  `work_orders.read`, `financial.read`, `fiscal.read`. Sem `users.read` e sem `audit.read`.

---

# 6. Evolução do Catálogo

Novas permissões entram primeiro na documentação do módulo (`docs/modules/*.md`) e nesta seção 5,
mediante aprovação, e só então em `packages/validation/src/rbac.ts`. Permissão retirada do catálogo deixa de
ser concedida a qualquer perfil na próxima sincronização (`catalog-sync.ts` remove os vínculos).

---

# 7. Enforcement Técnico

A verificação de permissão ocorre no backend, a cada requisição, a partir do perfil resolvido pela sessão autenticada (`docs/architecture/autenticacao.md` §4) — nunca a partir de informação enviada pelo cliente e nunca simulada apenas no frontend (`CLAUDE.md` §13).

Mecanismo implementado (`apps/backend/src/plugins/auth.ts`):

- `app.authenticate` (preHandler) valida a sessão e carrega os perfis e as permissões efetivas do usuário na oficina da sessão (`apps/backend/src/modules/auth/authorization.ts`);
- `app.requirePermission("recurso.acao")` (preHandler, sempre depois de `authenticate`) libera a rota somente se a permissão estiver entre as efetivas; caso contrário responde `403 FORBIDDEN` e registra `ACCESS_DENIED` na auditoria;
- a decisão é sempre por **permissão**, nunca pelo nome do perfil;
- no frontend, as permissões de `/api/v1/me` servem apenas para adaptar a interface.

---

# 8. Auditoria de Autorização

Toda concessão, alteração ou revogação de perfil/permissão de um usuário é uma ação crítica e deve ser registrada em auditoria (`docs/architecture/seguranca.md`, seção de Auditoria de Ações Críticas).

---

# 9. Situação das decisões

Decididas e implementadas:

- relação Usuário ↔ Perfil: N:N via `UserRole` (seção 2);
- catálogo de permissões e matriz perfil × permissão: seção 5 (aprovados no Prompt 04B, implementados em
  `packages/validation/src/rbac.ts`).

Em aberto, sem bloquear a autorização atual:

- administração de perfis/permissões pela própria oficina (self-service) vs. apenas pelo suporte;
- revisão das chaves de Financeiro e Fiscal quando esses módulos forem especificados (seção 5.2).
