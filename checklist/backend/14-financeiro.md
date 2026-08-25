# Backend — Fase 14: Financeiro

## 1. Objetivo

Implementar o módulo Financeiro, conforme `docs/modules/financeiro.md`.

## 2. Escopo — DOCUMENTAÇÃO INSUFICIENTE — NÃO IMPLEMENTAR

`docs/modules/financeiro.md` contém apenas objetivo e um diagrama conceitual (`Contas a Pagar → Obrigações → Parcelas → Pagamentos`, 59 linhas). Faltam, no mínimo:

- campos de conta a pagar/receber, parcela, categoria financeira, centro de custo;
- regras de cálculo de juros/multas/descontos;
- regras de conciliação;
- permissões conceituais;
- eventos de auditoria;
- filtros de listagem.

O módulo depende conceitualmente de **Pagamentos** (`docs/modules/pagamentos.md`), também esqueleto e sem fase própria nesta checklist.

## 3. Arquivos esperados

Não determinável nesta rodada.

## 4. Dependências da fase

Ordens de Serviço (fase 12, bloqueada), Compras (sem fase própria, esqueleto), Pagamentos (sem fase própria, esqueleto).

## 5. O que NÃO deve ser implementado

Nada — implementar qualquer parte deste módulo sem a documentação acima seria inventar requisito de negócio, especialmente sensível neste módulo por envolver valores financeiros (`CLAUDE.md` §35, prioridade de integridade dos dados).

## 6. Critérios de conclusão

Não aplicável nesta rodada.

## 7. Testes obrigatórios

Não aplicável nesta rodada.

## 8. Possíveis riscos

Módulo financeiro é o de maior sensibilidade do sistema — qualquer implementação sem especificação completa e aprovada tem alto risco de erro de cálculo ou perda de rastreabilidade.

## 9. Documentos de referência

`docs/modules/financeiro.md` (insuficiente), `docs/modules/pagamentos.md` (insuficiente).

## 10. Condições para avançar

**Bloqueado.** Depende de `docs/modules/financeiro.md` (e, na prática, `docs/modules/pagamentos.md`) serem completados com aprovação de negócio, e da fase 12 (OS) estar desbloqueada e concluída.
