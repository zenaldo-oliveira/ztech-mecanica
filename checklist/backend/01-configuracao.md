# Backend — Fase 01: Configuração

## 1. Objetivo

Estabelecer carregamento e validação de variáveis de ambiente, bootstrap mínimo do servidor Fastify com logger estruturado (Pino) e request ID, e um endpoint de health check.

## 2. Escopo

- Leitura de variáveis de ambiente;
- validação de presença de variáveis obrigatórias na inicialização, com falha rápida (fail-fast) e mensagem clara se algo faltar (`CLAUDE.md` §26; `docs/architecture/seguranca.md` §9);
- instância Fastify com logger Pino (`docs/architecture/observabilidade.md` §2) e `genReqId` configurado (`docs/architecture/observabilidade.md` §3);
- endpoint de health check (`docs/architecture/observabilidade.md` §6).

## 3. Arquivos esperados

- Módulo de configuração/ambiente (ex.: `src/config/*`);
- bootstrap do servidor (ex.: `src/app.ts`);
- rota de health check.

## 4. Dependências da fase

00-fundacao concluída.

## 5. O que NÃO deve ser implementado

- Rotas de negócio;
- conexão com banco de dados;
- autenticação;
- estrutura completa de `/api/v1` (o prefixo pode ser reservado, mas rotas de módulo pertencem à fase 08 em diante).

## 6. Critérios de conclusão

- O servidor sobe localmente;
- o endpoint de health check responde;
- os logs de uma requisição aparecem estruturados (JSON) e contêm `requestId`.

## 7. Testes obrigatórios

- Teste de integração que sobe o servidor e verifica que o health check responde;
- teste que verifica que o log de uma requisição contém `requestId`;
- teste que verifica que a inicialização falha (fail-fast) quando uma variável obrigatória está ausente.

## 8. Possíveis riscos

Variáveis de ambiente de produção ainda não existem, pois a hospedagem do PostgreSQL é uma pendência bloqueante (`docs/database/modelo-dados.md` §6) e os domínios de produção também (`docs/architecture/seguranca.md` §4). Esta fase deve validar apenas a mecânica de configuração — não valores reais de produção.

## 9. Documentos de referência

- `docs/architecture/observabilidade.md`
- `CLAUDE.md` §26
- `docs/decisions/ADR-001-stack.md`

## 10. Condições para avançar

Servidor mínimo funcional, testável e com logging estruturado. Nenhuma pendência bloqueia o avanço para a fase 02 (que trata apenas do ambiente de desenvolvimento).
