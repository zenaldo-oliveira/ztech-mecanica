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
- Se um usuário pode possuir um ou mais perfis simultaneamente não foi decidido nesta rodada — ver seção 9.

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

Este documento **não define** quais permissões cada perfil recebe — essa é uma decisão de negócio pendente (ver seção 5 e 6).

---

# 4. Convenção de Permissões

Toda permissão segue o formato `recurso.acao`, onde `recurso` corresponde ao módulo/entidade e `acao` a uma operação sobre ele.

Ações padrão observadas na documentação existente (`docs/modules/clientes.md` §11):

```text
read
create
update
delete
export
```

Módulos podem definir ações adicionais específicas de seu domínio (ex.: `view_history`, `manage_contacts`, também já usados em Clientes). Cada módulo é responsável por catalogar suas próprias permissões em sua documentação (`docs/modules/*.md`), seguindo esta convenção.

---

# 5. Matriz Perfil × Permissão — Módulo Clientes

Este é, hoje, o único módulo com um catálogo de permissões documentado (`docs/modules/clientes.md` §11). A matriz abaixo registra a **estrutura** esperada; o preenchimento (quais perfis recebem quais permissões) é uma decisão de negócio ainda não aprovada — todas as células estão marcadas como pendentes. Nenhum valor foi presumido, incluindo para os perfis "proprietário" e "administrador": atribuir acesso total por convenção não declarada violaria o princípio de menor privilégio já registrado em `docs/architecture/autenticacao.md` §2.

|Permissão|Proprietário|Administrador|Gerente|Atendente|Mecânico|Financeiro|
|-|-|-|-|-|-|-|
|`customers.read`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.create`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.update`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.delete`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.export`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.view_history`|A definir|A definir|A definir|A definir|A definir|A definir|
|`customers.manage_contacts`|A definir|A definir|A definir|A definir|A definir|A definir|

---

# 6. Módulos Pendentes

Os módulos abaixo ainda não possuem catálogo de permissões documentado e, portanto, não têm matriz nesta rodada. A matriz de cada um deve ser adicionada à documentação do respectivo módulo (`docs/modules/*.md`) quando esse módulo for especificado com aprovação de negócio, e então referenciada aqui:

```text
Veículos, Orçamentos, Ordens de Serviço, Estoque, Produtos,
Fornecedores, Compras, Financeiro, Pagamentos, CRM,
WhatsApp, Fiscal, IA
```

---

# 7. Enforcement Técnico

A verificação de permissão ocorre no backend, a cada requisição, a partir do perfil resolvido pela sessão autenticada (`docs/architecture/autenticacao.md` §4) — nunca a partir de informação enviada pelo cliente e nunca simulada apenas no frontend (`CLAUDE.md` §13).

O mecanismo técnico concreto (guard/hook do Fastify, decorator, middleware) será definido na fase de implementação — fora do escopo desta rodada, que é documentação.

---

# 8. Auditoria de Autorização

Toda concessão, alteração ou revogação de perfil/permissão de um usuário é uma ação crítica e deve ser registrada em auditoria (`docs/architecture/seguranca.md`, seção de Auditoria de Ações Críticas).

---

# 9. Pendências Bloqueantes

- **Cardinalidade Usuário↔Perfil** (1:1 ou 1:N) — nenhum documento do AutoForge permite concluir isso; não decidido por engenharia. Bloqueia o desenho da relação Usuário↔Perfil no schema.
- **Preenchimento da matriz perfil×permissão** (todos os módulos, incluindo Clientes, ver seção 5) — decisão de negócio. Bloqueia a implementação de autorização (RBAC) em qualquer módulo.
- Fluxo de administração de perfis/permissões pela própria oficina (self-service) vs. apenas suporte AutoForge — não definido; não bloqueia a estrutura inicial.
