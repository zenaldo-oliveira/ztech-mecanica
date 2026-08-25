# AutoForge ERP — Módulo de Compras

## 1. Objetivo

O módulo de compras será responsável pelo processo completo de aquisição de peças, produtos, materiais, insumos e demais itens utilizados pela oficina.

O módulo deverá controlar o ciclo de compras desde a identificação da necessidade até o recebimento, conferência, nota fiscal, entrada no estoque, atualização de custos e integração financeira.

O módulo deverá suportar:

- fornecedores;
- solicitações de compra;
- cotações;
- comparação de fornecedores;
- pedidos de compra;
- aprovação;
- itens de compra;
- quantidades;
- preços;
- descontos;
- frete;
- despesas adicionais;
- impostos;
- condições de pagamento;
- previsão de entrega;
- recebimento;
- recebimento parcial;
- recebimento total;
- notas fiscais de entrada;
- itens de notas fiscais;
- importação de XML quando disponível;
- conferência;
- divergências;
- devoluções;
- entrada no estoque;
- atualização de custos;
- contas a pagar;
- histórico de compras;
- auditoria.

O módulo deverá integrar-se principalmente com:

- fornecedores;
- produtos;
- estoque;
- fiscal;
- financeiro;
- ordens de serviço;
- usuários;
- permissões;
- auditoria.

---

# 2. Conceito

Uma compra representa uma operação de aquisição realizada pela oficina junto a um fornecedor.

O processo deverá manter rastreabilidade entre todas as etapas.

Fluxo principal:

```text
Necessidade
   ↓
Solicitação de Compra
   ↓
Aprovação
   ↓
Cotação
   ↓
Comparação de Fornecedores
   ↓
Fornecedor Selecionado
   ↓
Pedido de Compra
   ↓
Aprovação
   ↓
Envio ao Fornecedor
   ↓
Recebimento
   ↓
Conferência
   ↓
Nota Fiscal
   ↓
Conciliação
   ↓
Entrada no Estoque
   ↓
Atualização do Custo
   ↓
Contas a Pagar
   ↓
Histórico
```
