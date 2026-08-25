# AutoForge ERP — Integração Fiscal

## 1. Objetivo

Este documento define a arquitetura e as regras da integração fiscal do AutoForge ERP com provedores de serviços fiscais.

A integração deverá permitir que o AutoForge:

- envie informações para emissão de documentos fiscais;
- receba respostas do provedor fiscal;
- acompanhe o processamento;
- consulte status;
- receba eventos;
- processe autorizações;
- processe rejeições;
- processe cancelamentos;
- importe documentos fiscais recebidos;
- importe XML;
- mantenha os documentos fiscais;
- mantenha os XMLs quando aplicável;
- registre erros;
- realize tentativas de processamento;
- mantenha rastreabilidade;
- mantenha idempotência;
- registre auditoria.

A integração deverá ser desacoplada do módulo fiscal e dos módulos de negócio.

---

# 2. Princípio de Arquitetura

O AutoForge não deverá depender diretamente de um provedor fiscal específico.

Arquitetura:

```text
AutoForge
   ↓
Fiscal
   ↓
Fiscal Integration Layer
   ↓
Fiscal Provider
```
