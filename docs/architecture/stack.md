# AutoForge ERP — Stack Tecnológica

## 1. Objetivo

Este documento define a stack tecnológica oficial do AutoForge ERP.

A stack deverá priorizar:

- estabilidade;
- segurança;
- produtividade;
- manutenção;
- escalabilidade;
- testabilidade;
- baixo acoplamento;
- facilidade de evolução.

Mudanças importantes de tecnologia deverão ser justificadas e documentadas.

---

# 2. Stack Principal

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Backend

- Node.js
- TypeScript

## ORM

- Prisma

## Banco de Dados

- PostgreSQL

## Validação

- Zod

## Testes

- Vitest
- Playwright

---

# 3. Frontend

O frontend será desenvolvido utilizando Next.js e React.

Responsabilidades:

- interface;
- navegação;
- dashboards;
- formulários;
- tabelas;
- filtros;
- modais;
- experiência do usuário;
- comunicação com a API.

O frontend não será responsável por regras críticas de negócio.

As regras importantes deverão ser validadas no backend.

---

# 4. TypeScript

TypeScript será utilizado em frontend e backend.

Objetivos:

- segurança de tipos;
- redução de erros;
- contratos claros;
- manutenção;
- melhor experiência de desenvolvimento.

Evitar `any` sem justificativa técnica.

---

# 5. Tailwind CSS

Tailwind CSS será utilizado para estilização.

Deverá existir consistência visual em:

- cores;
- espaçamento;
- tipografia;
- componentes;
- estados;
- responsividade.

---

# 6. shadcn/ui

shadcn/ui será utilizado como base dos componentes de interface.

Componentes poderão incluir:

- Button;
- Input;
- Select;
- Dialog;
- Dropdown;
- Table;
- Tabs;
- Card;
- Badge;
- Alert;
- Toast;
- Form.

Os componentes deverão seguir a identidade visual do AutoForge.

---

# 7. Ícones

A biblioteca preferencial será:

**Lucide Icons**

Evitar múltiplas bibliotecas de ícones sem necessidade.

---

# 8. Backend

O backend será desenvolvido com:

```text
Node.js
+
TypeScript
+
Fastify
```

Fastify é o framework HTTP oficial do backend do AutoForge ERP. A decisão e sua justificativa estão registradas em `docs/decisions/ADR-001-stack.md`.
