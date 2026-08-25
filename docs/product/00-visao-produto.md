# AutoForge ERP — Visão do Produto

## 1. Identificação

**Nome do produto:** AutoForge ERP

**Categoria:** SaaS ERP vertical para oficinas

**Segmento:** Gestão automotiva

**Público inicial:** Oficinas de carros, motos e oficinas multimarca

**Modelo:** Software as a Service (SaaS)

---

# 2. Visão

O AutoForge é uma plataforma SaaS completa para gestão de oficinas de veículos.

O sistema deverá centralizar a operação comercial, operacional, compras, estoque, financeiro, faturamento, relacionamento com clientes e informações fiscais da oficina.

O AutoForge deverá permitir que uma empresa gerencie em um único ambiente:

- clientes;
- veículos;
- serviços;
- peças;
- fornecedores;
- compras;
- pedidos de compra;
- notas fiscais de entrada;
- importação de XML;
- conferência de mercadorias;
- estoque;
- custos de produtos;
- orçamentos;
- ordens de serviço;
- mão de obra;
- faturamento;
- documentos fiscais;
- contas a pagar;
- contas a receber;
- caixa;
- CRM;
- manutenção preventiva;
- agendamentos;
- comunicação com clientes;
- relatórios;
- indicadores;
- automações;
- inteligência artificial.

O objetivo é substituir controles espalhados em:

- papel;
- planilhas;
- calculadoras;
- aplicativos de mensagens;
- sistemas desconectados.

O AutoForge deverá transformar essas informações em um fluxo integrado de gestão.

---

# 3. Problema

Muitas oficinas precisam administrar simultaneamente:

- clientes;
- veículos;
- serviços;
- peças;
- fornecedores;
- compras;
- notas fiscais;
- estoque;
- custos;
- mão de obra;
- orçamentos;
- ordens de serviço;
- faturamento;
- contas a pagar;
- contas a receber;
- caixa;
- retorno dos clientes;
- manutenção preventiva.

A compra de peças é uma parte fundamental da operação de uma oficina.

A oficina precisa controlar:

- fornecedor;
- pedido de compra;
- produtos;
- quantidades;
- preços;
- nota fiscal;
- XML;
- mercadoria recebida;
- divergências;
- entrada no estoque;
- custo de aquisição;
- contas a pagar.

Quando essas informações são registradas separadamente, existe risco de:

- erro de digitação;
- estoque incorreto;
- custo incorreto;
- contas a pagar incorretas;
- perda de documentos;
- retrabalho;
- compras desnecessárias;
- perda financeira.

Também existe dificuldade para acompanhar clientes após a conclusão de um serviço.

Um cliente pode realizar uma troca de óleo ou revisão e não retornar porque a oficina não possui um mecanismo eficiente de manutenção preventiva e relacionamento.

O AutoForge deverá conectar todos esses processos.

---

# 4. Solução

O AutoForge deverá conectar os principais ciclos da oficina.

## 4.1 Ciclo do cliente

```text
Cliente
   ↓
Veículo
   ↓
Atendimento
   ↓
Orçamento
   ↓
Aprovação
   ↓
Ordem de Serviço
   ↓
Serviços + Peças + Mão de Obra
   ↓
Faturamento
   ↓
Documento Fiscal
   ↓
Financeiro
   ↓
Histórico do Veículo
   ↓
Próxima Manutenção
   ↓
CRM
   ↓
Lembrete
   ↓
Cliente retorna
```
