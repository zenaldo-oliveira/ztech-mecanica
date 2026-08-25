# AutoForge ERP — Módulo WhatsApp

## 1. Objetivo

O módulo WhatsApp será responsável pela comunicação entre a oficina e seus clientes.

Deverá permitir:

- envio de mensagens;
- recebimento de mensagens;
- notificações;
- envio de orçamento;
- aprovação de orçamento;
- atualização de OS;
- aviso de veículo pronto;
- lembretes de manutenção;
- lembretes de troca de óleo;
- pós-venda;
- campanhas;
- cobrança;
- atendimento;
- integração com CRM;
- integração com IA.

Fluxo principal:

```text
ERP / CRM
    ↓
Notification Service
    ↓
WhatsApp Service
    ↓
Provider Adapter
    ↓
WhatsApp
    ↓
Cliente
```
