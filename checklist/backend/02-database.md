# Backend — Fase 02: Database

## 1. Objetivo

Disponibilizar um banco PostgreSQL 16+ acessível ao backend em ambiente de desenvolvimento, com a string de conexão parametrizada por variável de ambiente.

## 2. Escopo

- Provisionamento de um PostgreSQL 16+ de desenvolvimento;
- definição da variável de ambiente de conexão;
- validação de conectividade na inicialização do servidor (fail-fast se a conexão não estiver disponível).

## 3. Arquivos esperados

- Configuração de conexão (ex.: `src/config/database.ts`).

Nenhum arquivo de schema é criado nesta fase — isso é escopo da fase 03.

## 4. Dependências da fase

01-configuracao concluída.

## 5. O que NÃO deve ser implementado

- Prisma Client;
- migrations;
- schema;
- qualquer dado de negócio.

## 6. Critérios de conclusão

O backend conecta com sucesso a um PostgreSQL 16+ de desenvolvimento na inicialização.

## 7. Testes obrigatórios

Teste de integração que verifica que a inicialização falha corretamente, com erro claro, quando a conexão com o banco não está disponível ou configurada.

## 8. Possíveis riscos

**PENDÊNCIA BLOQUEANTE (produção):** a estratégia de hospedagem do PostgreSQL não está definida em nenhum documento do AutoForge (`docs/database/modelo-dados.md` §6). Esta fase só pode ser concluída para ambiente de desenvolvimento; a configuração de produção fica bloqueada até a hospedagem ser decidida.

## 9. Documentos de referência

- `docs/database/modelo-dados.md` §6
- `docs/decisions/ADR-001-stack.md`

## 10. Condições para avançar

Conexão de desenvolvimento funcional e testada. O avanço para as fases seguintes (desenvolvimento) não depende da pendência de hospedagem — apenas o deploy real (fase 18) depende dela.
