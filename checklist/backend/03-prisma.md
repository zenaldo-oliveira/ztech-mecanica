# Backend — Fase 03: Prisma

## 1. Objetivo

Instalar e configurar o Prisma como ORM, e criar o schema físico apenas das entidades já suficientemente documentadas para uso transversal — nesta fase, somente a entidade `Session`.

## 2. Escopo

- Configuração do Prisma (schema base, client);
- migration inicial;
- modelo `Session`, conforme `docs/architecture/autenticacao.md` §4.1: `id` (UUID v7), `userId`, `tenantId`, `createdAt`, `expiresAt`, `revokedAt`, `userAgent`/`ipAddress` (opcionais).

## 3. Arquivos esperados

- `apps/backend/prisma/schema.prisma` (apenas o modelo `Session` nesta fase);
- migration inicial gerada pelo Prisma.

## 4. Dependências da fase

02-database concluída (banco de desenvolvimento acessível).

## 5. O que NÃO deve ser implementado — DOCUMENTAÇÃO INSUFICIENTE

**NÃO IMPLEMENTAR o schema completo das entidades Usuário e Tenant.**

Nenhum documento do AutoForge define os campos dessas entidades:

- `docs/database/entidades.md` está vazio de conteúdo além da introdução — não lista nenhuma entidade;
- `CLAUDE.md` §13 lista apenas nomes de perfis possíveis, sem campos de usuário (nome, e-mail, campo de senha, etc.);
- `docs/product/03-planos.md` menciona "Empresa → Plano → Usuários" apenas conceitualmente, sem campos de Tenant/Empresa.

Falta definir, no mínimo: campos obrigatórios do Usuário (identificação, credencial, perfil(is), status) e campos do Tenant (nome, documento, plano contratado, status). Enquanto isso não existir, o modelo `Session` referencia `userId`/`tenantId` apenas como identificadores técnicos (UUID), sem relação de chave estrangeira (FK) formal para modelos de Usuário/Tenant que ainda não existem.

Também não implementar: schema de qualquer entidade de módulo de negócio (Cliente, Veículo, etc.) — cada uma pertence à sua própria fase (09 em diante).

## 6. Critérios de conclusão

Prisma configurado e gerando client; migration do modelo `Session` aplicada com sucesso no banco de desenvolvimento.

## 7. Testes obrigatórios

Teste de integração que cria, lê e expira um registro de `Session` diretamente via Prisma contra o banco de teste.

## 8. Possíveis riscos

Modelar Usuário/Tenant nesta fase sem documentação de campos seria inventar requisito de negócio — proibido por instrução explícita. O risco a mitigar é a tentação de "completar" o schema por conveniência técnica.

## 9. Documentos de referência

- `docs/architecture/autenticacao.md` §4.1
- `docs/database/modelo-dados.md`
- `docs/decisions/ADR-001-stack.md`

## 10. Condições para avançar

Modelo `Session` migrado e testado. A modelagem completa de Usuário/Tenant permanece pendente de documentação de negócio — as fases 05, 06 e 07 devem tratar essa mesma pendência explicitamente, cada uma no que lhe cabe.
