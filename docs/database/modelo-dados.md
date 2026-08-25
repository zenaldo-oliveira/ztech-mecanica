# AutoForge ERP — Modelo de Dados

## 1. Objetivo

Este documento define o modelo lógico de dados do AutoForge ERP.

O documento estabelece:

- entidades;
- campos;
- tipos conceituais;
- chaves primárias;
- chaves estrangeiras;
- relacionamentos;
- cardinalidades;
- índices;
- restrições;
- unicidade;
- enums;
- regras de exclusão;
- regras de integridade;
- multi-tenant;
- auditoria;
- histórico.

A implementação física deverá utilizar este documento como referência.

---

# 2. Princípios do Modelo

O banco de dados deverá respeitar:

- isolamento por tenant;
- integridade referencial;
- normalização adequada;
- identificação única;
- histórico;
- auditoria;
- consistência transacional;
- controle de concorrência;
- índices adequados;
- constraints;
- integridade entre módulos.

---

# 3. Estratégia de Identificação

As entidades deverão possuir um identificador técnico único.

Estratégia conceitual:

```text
id
```

O identificador técnico (`id`) de toda entidade persistida deverá ser um **UUID**, conforme `docs/decisions/ADR-001-stack.md`.

Regras:

- o `id` é gerado no momento da criação do registro, sem depender de sequência numérica do banco;
- o `id` é imutável e nunca reaproveitado;
- o `id` é de uso técnico/interno — não deve ser exibido como identificador de negócio ao usuário final;
- identificadores de negócio legíveis (ex.: `CLI-000001`, ver `docs/modules/clientes.md` §3) são um conceito **separado** do `id` técnico, e continuam sendo definidos, quando aplicável, na documentação do próprio módulo.

**Decisão:** UUID **v7** (ordenável por tempo), escolhido por oferecer melhor localidade de índice em tabelas de alto volume de escrita (ex.: movimentações de estoque, auditoria) em comparação a UUID v4 totalmente aleatório, mantendo unicidade global.

**Nota de implementação (não bloqueante):** a versão mínima aprovada do PostgreSQL (16, ver seção 6) não possui a função nativa `uuidv7()` (disponível apenas a partir da versão 18). Nesta fase, a geração de UUID v7 é feita na camada de aplicação, não pelo banco.

---

# 4. ORM e Persistência

O AutoForge ERP utiliza **Prisma** como ORM de acesso ao PostgreSQL, conforme `docs/decisions/ADR-001-stack.md`.

Responsabilidades do Prisma neste projeto:

- mapear as entidades conceituais (`docs/database/entidades.md`) para tabelas físicas;
- aplicar migrations de forma controlada e rastreável;
- fornecer o ponto de extensão onde a regra de isolamento por tenant é reforçada na camada de aplicação (ver seção 5 e `docs/architecture/multi-tenant.md`).

A definição física completa de cada tabela (campos, tipos, índices, constraints) é derivada da documentação de cada módulo (`docs/modules/*.md`) e não é antecipada por este documento — nenhum módulo deve ter seu schema físico criado sem que sua documentação de negócio esteja aprovada.

---

# 5. Isolamento por Tenant no Modelo de Dados

Toda tabela que representa dado operacional de uma empresa deverá possuir uma coluna `tenantId` (UUID, não nula, indexada), referenciando o tenant proprietário do registro.

O mecanismo de reforço desse isolamento (quem garante que uma consulta nunca vaza dados de outro tenant) é uma decisão arquitetural própria, documentada em `docs/architecture/multi-tenant.md` — este documento apenas registra a exigência do campo no modelo de dados.

---

# 6. Migrations

As migrations do banco de dados são geradas e aplicadas via Prisma.

Regras conceituais:

- toda alteração de schema passa por uma migration versionada — nenhuma alteração manual direta no banco;
- migrations são aplicadas de forma equivalente em todos os ambientes (desenvolvimento, homologação, produção), na mesma ordem;
- nenhuma migration deve ser reescrita após ter sido aplicada em um ambiente compartilhado — uma correção gera uma nova migration;
- dados de produção nunca são alterados diretamente, apenas por meio de migration ou rotina de aplicação auditável (`CLAUDE.md` §11).

**Decisão:** versão mínima suportada do PostgreSQL é a **16**.

**PENDÊNCIA BLOQUEANTE:** a estratégia de hospedagem (gerenciada vs. auto-hospedada, provedor, região) não está definida em nenhum documento do AutoForge. Esta pendência bloqueia apenas a configuração da string de conexão e o deploy real — não bloqueia o desenho do schema Prisma.
