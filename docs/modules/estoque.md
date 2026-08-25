# AutoForge ERP — Módulo de Estoque

## 1. Objetivo

O módulo de estoque será responsável pelo controle físico e financeiro dos produtos, peças e materiais utilizados pela oficina.

Deverá controlar:

- produtos;
- peças;
- categorias;
- marcas;
- fornecedores;
- estoque atual;
- estoque mínimo;
- estoque máximo;
- entradas;
- saídas;
- ajustes;
- reservas;
- consumo em OS;
- devoluções;
- compras;
- custos;
- histórico de movimentações;
- inventário.

O estoque deverá estar integrado principalmente com:

```text
Compras
Notas Fiscais
OS
Orçamentos
Financeiro
Fornecedores
Fiscal
Dashboard
IA
```

Produto
↓
Depósito
↓
Localização
↓
Saldo
↓
Movimentações
├── Entrada
├── Saída
├── Reserva
├── Liberação
├── Ajuste
├── Transferência
├── Consumo em OS
└── Devolução

Óleos
Filtros
Freios
Suspensão
Motor
Elétrica
Pneus
Baterias
Fluidos
Acessórios
Materiais

Bosch
NGK
Mann
Mahle
SKF
Mobil
Shell

Depósito Principal
Depósito de Peças
Depósito de Óleos
Depósito de Pneus
Depósito de Materiais

Depósito Principal
Depósito de Peças
Depósito de Óleos
Depósito de Pneus
Depósito de Materiais

Produto:
Filtro de Óleo

Depósito:
Principal

Quantidade:
25

Quantidade Física
Quantidade Disponível
Quantidade Reservada
Quantidade Bloqueada
Quantidade Pendente

Físico: 20
Reservado: 5
Bloqueado: 2
Disponível: 13

Disponível =
Quantidade Física

- Quantidade Reservada
- Quantidade Bloqueada

Produto:
Filtro de Óleo

Estoque mínimo:
10

Estoque atual:
7

Estoque mínimo:
10

Estoque máximo:
50

Estoque atual:
12

Ponto de reposição:
15

PURCHASE_ENTRY
SALE_EXIT
OS_CONSUMPTION
RETURN_ENTRY
SUPPLIER_RETURN
ADJUSTMENT_ENTRY
ADJUSTMENT_EXIT
TRANSFER_ENTRY
TRANSFER_EXIT
RESERVATION
RESERVATION_RELEASE
INVENTORY_ADJUSTMENT

Produto:
Filtro de Óleo

Quantidade:
10

Movimento:
PURCHASE_ENTRY

Fluxo:

Ordem de Serviço
↓
Peça adicionada
↓
Separação
↓
Consumo
↓
Saída do Estoque

Exemplo:

Produto:
Pastilha de Freio

Disponível:
10

Reserva OS-000123:
2

Disponível após reserva:
8
