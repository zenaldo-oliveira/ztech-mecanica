# Backend — Fase 06: Multi-Tenant

## 1. Objetivo

Implementar o mecanismo de enforcement de isolamento de tenant na camada de aplicação/Prisma, conforme `docs/architecture/multi-tenant.md`.

## 2. Escopo

- Mecanismo central (ex.: Prisma Client Extension ou camada de repositório) que injeta/valida `tenantId` em toda operação de leitura/escrita sobre dado operacional (`docs/architecture/multi-tenant.md` §3);
- resolução do `tenantId` a partir da sessão autenticada (fase 05) — nunca de dado enviado pelo cliente.

## 3. Arquivos esperados

- Extensão/middleware de Prisma para tenant;
- camada de repositório base que utiliza esse mecanismo.

## 4. Dependências da fase

03-prisma, 05-auth (a sessão precisa fornecer um `tenantId` confiável — ainda que, por conta da pendência de documentação de Usuário/Tenant da fase 05, esse `tenantId` possa vir de um valor de teste controlado nesta fase).

## 5. O que NÃO deve ser implementado

- Row-Level Security no PostgreSQL — fora de escopo desta fase (`docs/architecture/multi-tenant.md` §4);
- qualquer entidade de negócio (ainda não existem tabelas operacionais além de `Session`).

## 6. Critérios de conclusão

O mecanismo central existe e é comprovadamente impossível de contornar por uma consulta que "esqueça" o filtro de tenant.

## 7. Testes obrigatórios

Teste que comprova que uma tentativa de acessar/alterar um registro de outro tenant é bloqueada — usando o modelo `Session` como caso de teste, já que ainda não há entidade de negócio disponível.

## 8. Possíveis riscos

Como não há ainda tabela de negócio real, a cobertura de teste desta fase é necessariamente limitada à entidade `Session`. Cada módulo futuro deve repetir esse teste de isolamento sobre sua própria entidade (`docs/architecture/testes.md` §3) — esta fase não dispensa esse requisito nas fases seguintes.

## 9. Documentos de referência

- `docs/architecture/multi-tenant.md`
- `docs/architecture/testes.md` §3

## 10. Condições para avançar

Mecanismo testado e documentado como o único caminho de acesso a dado operacional — nenhuma rota ou serviço deve acessar o Prisma diretamente, sem passar por ele.
