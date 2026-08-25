# AutoForge ERP — Estratégia de Testes (Backend)

## 1. Objetivo

Este documento define a estratégia de testes automatizados do backend do AutoForge ERP.

Vitest é o framework de testes do backend (`docs/decisions/ADR-001-stack.md`, decisão 11). Playwright permanece responsável pelos testes E2E de fluxo completo (`docs/architecture/stack.md`), incluindo o frontend.

---

# 2. Camadas de Teste

```text
Unitário
   ↓
Integração
   ↓
E2E (Playwright, fora do escopo deste documento)
```

## 2.1 Testes Unitários

Cobrem regras de negócio e lógica de domínio isoladas (ex.: cálculo de orçamento, transição de status), sem dependência de banco de dados real ou rede.

## 2.2 Testes de Integração

Cobrem rotas da API (Fastify) em conjunto com a camada de persistência (Prisma), executados contra um banco PostgreSQL de teste real — não contra um Prisma mockado. O objetivo é validar que migrations, queries e regras de isolamento de tenant funcionam de fato contra o banco, não apenas contra uma simulação.

## 2.3 Testes E2E

Fluxos de ponta a ponta (ex.: o fluxo descrito em `CLAUDE.md` §28 — cliente → veículo → orçamento → OS → estoque → financeiro) são cobertos por Playwright, já definido em `docs/architecture/stack.md`, e não são o foco deste documento.

---

# 3. Isolamento de Tenant nos Testes

Todo módulo com dado operacional deve ter, entre seus testes de integração, ao menos um caso que valide explicitamente que um tenant não acessa/lista/edita/exclui dado de outro tenant (`docs/architecture/multi-tenant.md`). Isso é um requisito estrutural dos testes, não uma exceção pontual.

---

# 4. Testes de Autorização

Quando um módulo tiver sua matriz RBAC preenchida (`docs/architecture/autorizacao.md`), seus testes de integração devem cobrir, no mínimo:

- acesso permitido para o perfil correto;
- acesso negado para perfis sem a permissão.

---

# 5. Ambiente de Teste

- os testes de integração rodam contra um banco de dados de teste dedicado, isolado do banco de desenvolvimento/produção;
- o estado do banco de teste é resetado entre execuções, de forma determinística;
- dados de produção nunca são usados em testes (`CLAUDE.md` §11).

Detalhes de configuração (banco em container, banco compartilhado, estratégia de seed) são decisão de implementação, fora do escopo deste documento.

---

# 6. Critério de Conclusão

Alinhado a `CLAUDE.md` §8: uma funcionalidade de backend não é considerada concluída sem que seus testes relevantes (unitários e de integração, incluindo isolamento de tenant) tenham sido escritos e executados com sucesso.

**Pendente:** esta rodada de decisão não define uma meta numérica de cobertura de testes — isso não está definido em nenhum documento do AutoForge e não deve ser presumido.
