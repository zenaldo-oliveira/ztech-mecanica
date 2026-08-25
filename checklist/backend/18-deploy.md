# Backend — Fase 18: Deploy

## 1. Objetivo

Publicar o backend em ambiente de produção/homologação.

## 2. Escopo — PENDÊNCIA BLOQUEANTE (múltipla)

Esta fase depende de decisões de infraestrutura que não estão definidas em nenhum documento do AutoForge e não devem ser presumidas:

- **hospedagem do PostgreSQL** — não definida (`docs/database/modelo-dados.md` §6);
- **domínios de produção/homologação** de `apps/frontend` e `apps/backend` — não definidos (`docs/architecture/seguranca.md` §4);
- **`SameSite` final do cookie de sessão** — depende da topologia de domínio acima, não definida (`docs/architecture/autenticacao.md` §5.3);
- **hospedagem/plataforma de deploy do próprio backend** (container, PaaS, VM) — não mencionada em nenhum documento.

## 3. Arquivos esperados

Não determinável enquanto as pendências acima não forem resolvidas (ex.: Dockerfile, pipeline de CI/CD, configuração de variáveis de ambiente de produção).

## 4. Dependências da fase

Todas as fases anteriores concluídas para o que for de fato implementado (na prática, no mínimo 00–10 nesta rodada).

## 5. O que NÃO deve ser implementado

Nenhuma configuração de produção definitiva (domínio, `SameSite`, string de conexão real) antes das pendências acima serem resolvidas — presumir qualquer uma delas violaria a instrução explícita de não inventar decisões de ambiente/infraestrutura.

## 6. Critérios de conclusão

Não aplicável nesta rodada.

## 7. Testes obrigatórios

Não aplicável nesta rodada — testes de deploy (smoke test pós-deploy) só fazem sentido após as pendências serem resolvidas.

## 8. Possíveis riscos

Nenhum risco técnico a mitigar agora — o risco é organizacional: começar a configurar produção antes das decisões de infraestrutura estarem fechadas geraria retrabalho.

## 9. Documentos de referência

`docs/database/modelo-dados.md` §6, `docs/architecture/seguranca.md` §4, `docs/architecture/autenticacao.md` §5.3, `docs/decisions/ADR-001-stack.md` (seção "Pendências Bloqueantes Remanescentes").

## 10. Condições para avançar

**Bloqueado.** Depende de você definir: hospedagem do PostgreSQL, domínios de produção/homologação, plataforma de deploy do backend. Só então o `SameSite` final e a configuração de CORS/produção podem ser fechados.
