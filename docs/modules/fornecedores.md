# AutoForge ERP — Módulo de Fornecedores

## 1. Objetivo

O módulo de fornecedores será responsável pelo cadastro, organização, consulta e histórico dos fornecedores utilizados pela oficina.

O módulo deverá controlar o relacionamento comercial entre a oficina e seus fornecedores, servindo como base para:

- compras;
- cotações;
- pedidos de compra;
- recebimentos;
- notas fiscais de entrada;
- produtos fornecidos;
- preços;
- condições comerciais;
- condições de pagamento;
- prazos de entrega;
- devoluções;
- contas a pagar;
- histórico de compras;
- avaliação de fornecedores.

O módulo deverá atender oficinas de:

- carros;
- motos;
- carros e motos.

O fornecedor será uma das principais entidades do processo de compras do AutoForge.

---

# 2. Conceito

Um fornecedor representa uma pessoa física ou jurídica que fornece produtos, peças, materiais, insumos ou serviços para a oficina.

Estrutura conceitual:

```text
Fornecedor
├── Dados cadastrais
├── Documentos
├── Contatos
├── Endereços
├── Dados fiscais
├── Condições comerciais
├── Condições de pagamento
├── Produtos fornecidos
├── Cotações
├── Pedidos de Compra
├── Recebimentos
├── Notas Fiscais
├── Devoluções
├── Contas a Pagar
├── Histórico
└── Avaliação
```
