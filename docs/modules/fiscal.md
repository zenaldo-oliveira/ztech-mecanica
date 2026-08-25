# AutoForge ERP — Módulo Fiscal

## 1. Objetivo

O módulo fiscal será responsável por organizar, controlar e integrar os processos fiscais do AutoForge.

O módulo deverá permitir que a oficina:

- mantenha dados fiscais da empresa;
- mantenha dados fiscais dos clientes;
- mantenha dados fiscais dos fornecedores;
- prepare informações para emissão de documentos fiscais;
- acompanhe documentos fiscais emitidos;
- acompanhe documentos fiscais recebidos;
- importe XML;
- registre documentos fiscais;
- acompanhe status;
- registre eventos fiscais;
- mantenha histórico fiscal;
- integre com provedores fiscais;
- forneça informações para contabilidade;
- mantenha rastreabilidade das operações fiscais;
- controle documentos fiscais relacionados às operações comerciais.

O módulo deverá ser desacoplado dos demais módulos de negócio.

---

# 2. Princípio

O AutoForge não deverá implementar regras fiscais diretamente em módulos como:

- clientes;
- veículos;
- orçamento;
- ordens de serviço;
- estoque;
- compras;
- financeiro;
- CRM.

Esses módulos deverão gerar informações de negócio.

O módulo fiscal será responsável por transformar essas informações em operações fiscais conforme as configurações e integrações definidas para o sistema.

Fluxo principal:

```text
Cliente
   ↓
Veículo
   ↓
Orçamento
   ↓
Ordem de Serviço
   ↓
Faturamento
   ↓
Fiscal
   ↓
Documento Fiscal
   ↓
Provedor Fiscal
   ↓
Autorização
```
