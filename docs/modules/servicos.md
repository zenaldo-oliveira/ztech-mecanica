# AutoForge ERP — Módulo de Veículos

## 1. Objetivo

O módulo de veículos será responsável pelo cadastro, identificação, histórico e acompanhamento dos veículos atendidos pela oficina.

O módulo deverá suportar:

- carros;
- motos;
- veículos de diferentes marcas e modelos;
- veículos de clientes particulares;
- veículos vinculados a empresas;
- histórico de manutenção;
- quilometragem;
- serviços realizados;
- peças utilizadas;
- próximas manutenções.

O veículo será uma das principais entidades operacionais do AutoForge.

---

# 2. Conceito

Um veículo deverá estar vinculado a um cliente.

```text
Cliente
   ↓
Veículo
   ↓
Histórico
   ├── Orçamentos
   ├── Ordens de Serviço
   ├── Peças
   ├── Serviços
   ├── Manutenções
   └── Pagamentos
   