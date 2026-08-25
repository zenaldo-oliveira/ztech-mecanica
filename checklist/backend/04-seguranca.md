# Backend — Fase 04: Segurança

## 1. Objetivo

Implementar os mecanismos de segurança transversais já aprovados que não dependem de autenticação/RBAC: CORS, rate limiting por IP, tratamento centralizado de erros e verificação de gestão de segredos.

## 2. Escopo

- Plugin de CORS com lista explícita de origens por ambiente (`docs/architecture/seguranca.md` §4);
- plugin de rate limiting por IP para rotas pré-autenticação (`docs/architecture/seguranca.md` §5) — a diferenciação por `userId`+`tenantId` só é possível após a fase 05 (autenticação);
- error handler centralizado do Fastify (`docs/architecture/seguranca.md` §6);
- checagem de que nenhum segredo está hardcoded no código (`docs/architecture/seguranca.md` §9).

## 3. Arquivos esperados

- Plugin/config de CORS;
- plugin/config de rate limiting;
- error handler central.

## 4. Dependências da fase

01-configuracao concluída.

## 5. O que NÃO deve ser implementado

- Rate limiting por `userId`+`tenantId` (depende de 05-auth, tratado nessa fase);
- qualquer regra de negócio;
- auditoria de eventos específicos de módulo (a estrutura genérica de auditoria pode ser referenciada, mas eventos reais dependem de cada módulo existir — `docs/architecture/seguranca.md` §8).

## 6. Critérios de conclusão

- Requisição de origem não permitida é rejeitada;
- requisição excessiva do mesmo IP é limitada (HTTP 429);
- exceção não tratada não vaza detalhe interno na resposta ao cliente.

## 7. Testes obrigatórios

- Teste de CORS rejeitando origem não listada;
- teste de rate limiting disparando 429 após exceder o limite (valor inicial conservador, não definitivo);
- teste de que uma exceção não tratada retorna o envelope de erro seguro, sem stack trace ou detalhe interno.

## 8. Possíveis riscos

**PENDÊNCIA BLOQUEANTE (parcial):** domínios de produção/homologação não definidos (`docs/architecture/seguranca.md` §4) — bloqueia apenas a configuração de CORS desses ambientes específicos, não o mecanismo em si nem o ambiente de desenvolvimento (`http://localhost:3000`). Valores numéricos finais de rate limiting são calibração de produção, não bloqueante para esta fase (`docs/architecture/seguranca.md` §5).

## 9. Documentos de referência

- `docs/architecture/seguranca.md`

## 10. Condições para avançar

CORS (com origem de desenvolvimento) e rate limiting por IP funcionais; error handler central funcional e testado. O rate limiting por usuário autenticado só é completado após a fase 05.
