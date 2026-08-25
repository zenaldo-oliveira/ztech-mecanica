# AutoForge ERP — Módulo de Orçamentos

## 1. Objetivo

O módulo de orçamentos será responsável pela criação, cálculo, envio, aprovação, rejeição e conversão de orçamentos em ordens de serviço.

O módulo deverá permitir que a oficina monte um orçamento completo contendo:

- mão de obra;
- serviços;
- peças;
- produtos;
- descontos;
- acréscimos;
- observações;
- condições de pagamento;
- validade;
- aprovação do cliente.

O orçamento deverá ser o principal ponto de transição entre:

```text
Solicitação do cliente
        ↓
Orçamento
        ↓
Aprovação
        ↓
Ordem de Serviço
        ↓
Execução
        ↓
Faturamento
        ↓
Financeiro

```
