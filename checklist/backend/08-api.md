# Backend — Fase 08: API

## 1. Objetivo

Estabelecer a estrutura formal da API (`/api/v1`), validação de entrada com Zod na borda, e o formato definitivo do envelope de resposta de erro, conforme `docs/architecture/arquitetura.md` §4.

## 2. Escopo

- Prefixo de rota `/api/v1` (`docs/decisions/ADR-001-stack.md`, decisão 9);
- middleware/hook de validação Zod aplicado à borda de toda rota (`docs/architecture/seguranca.md` §7);
- formato final do envelope de erro (a forma exata era decisão de implementação em aberto em `docs/architecture/seguranca.md` §6 — esta fase é onde ela é fixada).

## 3. Arquivos esperados

- Estrutura de roteamento versionado;
- schemas Zod base/compartilhados;
- definição do envelope de erro.

## 4. Dependências da fase

Fases 00 a 07 concluídas — esta é a última fase transversal antes dos módulos de negócio.

## 5. O que NÃO deve ser implementado

Qualquer rota de módulo de negócio real (Clientes, Veículos, etc.) — cada um pertence à sua própria fase.

## 6. Critérios de conclusão

Uma rota de exemplo (reaproveitando o health check da fase 01, movido para sob `/api/v1` se aplicável, ou uma rota de teste dedicada) valida entrada com Zod, retorna o envelope de erro padronizado em caso de falha de validação, e é servida sob `/api/v1`.

## 7. Testes obrigatórios

- Teste de validação Zod rejeitando entrada inválida com o envelope de erro correto;
- teste de que a rota responde sob o prefixo `/api/v1`.

## 8. Possíveis riscos

Fixar o formato do envelope de erro cedo demais pode exigir ajuste quando módulos reais surgirem com necessidades específicas. Mitigação: manter o envelope o mais simples e genérico possível (`docs/architecture/seguranca.md` §6).

## 9. Documentos de referência

- `docs/architecture/arquitetura.md` §4
- `docs/architecture/seguranca.md` §6, §7

## 10. Condições para avançar

Estrutura de API formalizada e testada. **A partir daqui, a fundação transversal do backend está completa.** Nenhum módulo de negócio deve começar antes desta fase, e apenas os módulos com documentação suficiente podem avançar (ver fases 09 em diante).
