# Backend — Fase 17: Observabilidade (Consolidação)

## 1. Objetivo

Revisar e consolidar a observabilidade do backend — o mecanismo de logging estruturado e request ID já foi implementado na fase 01; esta fase é uma auditoria de cobertura, não a criação de um mecanismo novo.

## 2. Escopo

- Verificar que todo endpoint implementado até aqui usa o logger estruturado (Pino) com `requestId` (`docs/architecture/observabilidade.md` §2, §3);
- verificar que nenhum dado sensível está sendo logado em nenhuma rota implementada (`docs/architecture/observabilidade.md` §4);
- verificar a correlação entre log de requisição e registro de auditoria, onde auditoria já existe (`docs/architecture/observabilidade.md` §5, `docs/architecture/seguranca.md` §8).

## 3. Arquivos esperados

Nenhum arquivo novo necessariamente — esta fase é de revisão. Ajustes pontuais em código já existente, se alguma lacuna for encontrada.

## 4. Dependências da fase

Depende de tudo o que foi implementado até aqui (fases 00–16 concluídas ou parcialmente concluídas).

## 5. O que NÃO deve ser implementado

Ferramentas fora do escopo já registrado como não coberto por `docs/architecture/observabilidade.md` §7: agregação centralizada de logs (ELK, Datadog, etc.), tracing distribuído (APM).

## 6. Critérios de conclusão

Auditoria concluída sem achado de dado sensível logado; todo endpoint auditado confirma `requestId` presente.

## 7. Testes obrigatórios

Não se aplica um novo conjunto de testes — reaproveita os testes já exigidos na fase 01 (`requestId` presente no log) e estende essa verificação a cada rota nova criada desde então.

## 8. Possíveis riscos

Mesmo risco da fase 16: esta fase precisa ser revisitada a cada novo módulo desbloqueado, não é um marco único.

## 9. Documentos de referência

`docs/architecture/observabilidade.md`.

## 10. Condições para avançar

Auditoria concluída sem pendência de dado sensível logado.
