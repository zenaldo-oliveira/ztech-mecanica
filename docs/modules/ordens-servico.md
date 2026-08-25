# AutoForge ERP — Módulo de Ordens de Serviço

## 1. Objetivo

O módulo de Ordens de Serviço (OS) será responsável por controlar a execução dos serviços realizados pela oficina.

A OS deverá reunir:

- cliente;
- veículo;
- diagnóstico;
- serviços;
- peças;
- mão de obra;
- mecânico responsável;
- checklist;
- fotos;
- observações;
- quilometragem;
- status;
- garantia;
- valores;
- faturamento;
- histórico.

Fluxo principal:

```text
Orçamento aprovado
        ↓
Ordem de Serviço
        ↓
Diagnóstico
        ↓
Execução
        ↓
Peças + Mão de Obra
        ↓
Checklist
        ↓
Finalização
        ↓
Faturamento
        ↓
Financeiro
        ↓
Histórico do veículo
```
