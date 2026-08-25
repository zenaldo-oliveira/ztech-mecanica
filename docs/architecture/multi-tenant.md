# AutoForge ERP — Arquitetura Multi-Tenant

## 1. Objetivo

Este documento define como o AutoForge ERP irá implementar isolamento entre empresas.

O AutoForge será um SaaS multi-tenant, permitindo que várias oficinas utilizem a mesma plataforma.

Cada empresa deverá possuir seu próprio ambiente lógico de dados.

A regra fundamental é:

> Um tenant nunca poderá acessar dados pertencentes a outro tenant.

---

# 2. Conceito de Tenant

No AutoForge:

```text
Tenant = Empresa / Oficina
```

---

# 3. Estratégia de Isolamento (Decisão)

O isolamento entre tenants é reforçado na **camada de aplicação/Prisma**, não no banco de dados via Row-Level Security (RLS) — nesta fase.

Mecanismo:

- toda tabela de dado operacional possui a coluna `tenantId` (ver `docs/database/modelo-dados.md` §5);
- toda consulta, criação, atualização e exclusão de dado operacional deve ser escopada pelo `tenantId` do usuário autenticado — nunca por um `tenantId` recebido do cliente/frontend sem validação;
- o `tenantId` do usuário autenticado é resolvido a partir da sessão (ver `docs/architecture/autenticacao.md`), nunca de um parâmetro de rota, header ou corpo de requisição fornecido livremente;
- a validação de tenant é aplicada de forma centralizada na camada de acesso a dados (Prisma), e não deixada a critério de cada rota implementá-la individualmente — o objetivo é que seja estruturalmente difícil esquecer o filtro de tenant em uma nova consulta.

Esta é uma decisão arquitetural registrada em `docs/decisions/ADR-001-stack.md`. O mecanismo técnico concreto (ex.: Prisma Client Extension, middleware de query, ou camada de repositório) será definido na fase de implementação — este documento fixa o requisito, não a API específica do Prisma que o realiza.

---

# 4. Caminho de Evolução para PostgreSQL RLS

A arquitetura deve permanecer preparada para evoluir para Row-Level Security (RLS) no PostgreSQL, caso o isolamento por aplicação se mostre insuficiente (ex.: necessidade de defesa em profundidade, acesso direto ao banco por outras ferramentas).

Para que essa evolução seja possível sem reescrever o modelo de dados:

- a coluna `tenantId` deve existir e ser não-nula em toda tabela operacional desde o início, independentemente do mecanismo de enforcement escolhido agora;
- o valor de `tenantId` nunca deve ser inferido implicitamente — deve estar sempre explícito no registro, mesmo com enforcement por aplicação.

A ativação de RLS em si (políticas `CREATE POLICY`, `SET app.tenant_id`, etc.) não é implementada nesta fase e não faz parte do escopo atual.

---

# 5. Consequências e Riscos

- Enforcement por aplicação depende de que **todo** ponto de acesso a dados respeite o mecanismo central — um novo endpoint ou script que acesse o Prisma diretamente sem passar pela camada de enforcement reintroduz risco de vazamento entre tenants. Isso deve ser tratado como regra de revisão de código obrigatória (`CLAUDE.md` §14, "nunca confiar somente no frontend para isolamento").
- Testes automatizados devem cobrir explicitamente cenários de vazamento entre tenants (ver `docs/architecture/testes.md`).
