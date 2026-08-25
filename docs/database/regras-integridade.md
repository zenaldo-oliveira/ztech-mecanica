# AutoForge ERP — Regras de Negócio

## 1. Objetivo

Este documento define as regras de negócio que deverão ser respeitadas pelo AutoForge ERP.

As regras deverão ser aplicadas no backend e, quando necessário, refletidas no frontend.

O frontend não deverá ser considerado responsável pela segurança ou integridade das regras.

---

# 2. Multi-Tenant

Todo dado operacional deverá pertencer a um tenant.

Regra:

```text
Usuário
   ↓
Tenant
   ↓
Dados do Tenant
```
