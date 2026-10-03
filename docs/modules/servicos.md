# ZTech Mecânica — Módulo de Serviços

> Status: **especificação aprovada para implementação (P3)** — rodada de 2026-10-02.
> Este documento é contrato entre backend e frontend. Itens marcados como **PENDENTE** não devem ser implementados até nova aprovação.
>
> Nota de histórico: até esta rodada, este arquivo continha por engano o texto do módulo de Veículos (preservado integralmente em `docs/modules/veiculos.md`).

## 1. Objetivo

O módulo de serviços é responsável pelo catálogo de serviços e de mão de obra que a oficina executa e cobra.

O catálogo é a fonte oficial dos serviços usados por:

- orçamentos;
- ordens de serviço;
- check-up (recomendações);
- fiscal (NFS-e);
- financeiro;
- CRM e manutenção preventiva;
- relatórios (serviços mais realizados).

---

# 2. Conceito

Um serviço (`SERVICE`) representa trabalho executado pela oficina — nunca um item físico. Peças e materiais são produtos (`PRODUCT`, `docs/modules/produtos.md` §2.1).

Exemplos:

```text
Diagnóstico eletrônico
Mão de obra mecânica (hora)
Troca de óleo
Alinhamento
Balanceamento
Revisão de freios
Regulagem de válvulas
Revisão de moto (10.000 km)
```

Um serviço **nunca** gera movimentação de estoque. Se um serviço consome peças, as peças são lançadas como itens `PRODUCT` separados na OS.

## 2.1 Mão de obra

Mão de obra é um serviço com cobrança por hora (`pricingMode = HOURLY`). Não existe uma entidade separada de "mão de obra": a separação relevante para estoque, financeiro e fiscal é `SERVICE` × `PRODUCT`, e mão de obra é `SERVICE`.

---

# 3. Identificação

|Campo|Regra|
|-|-|
|`id`|UUID v7 técnico|
|`code`|Código interno, informado ou gerado (`SRV-000001`). Único no tenant, sem diferenciar maiúsculas/minúsculas|

---

# 4. Dados Cadastrais

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`name`|texto (2–160)|Sim|Nome exibido em OS, orçamento e documento fiscal|
|`description`|texto (até 2000)|Não|Descrição detalhada / escopo do serviço|
|`category`|texto (até 80)|Não|Texto livre nesta fase (ex.: Motor, Freios, Suspensão, Elétrica)|
|`vehicleType`|enum|Sim|`CAR` \| `MOTORCYCLE` \| `ANY` — filtra o catálogo conforme o veículo da OS. Padrão `ANY`|
|`pricingMode`|enum|Sim|`FIXED` \| `HOURLY` — seção 5|
|`status`|enum|Sim|`ACTIVE` \| `INACTIVE` — padrão `ACTIVE`|
|`notes`|texto (até 2000)|Não|Observações internas|

---

# 5. Preço

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`price`|monetário ≥ 0|Sim quando `FIXED`|Preço do serviço|
|`hourlyRate`|monetário ≥ 0|Não|Valor da hora. Quando vazio, usa o valor-hora padrão do tenant (`TenantSettings.defaultHourlyRate`)|
|`estimatedHours`|decimal (até 2 casas) > 0|Sim quando `HOURLY`|Tempo padrão; vira a quantidade sugerida do item|

Cálculo do preço sugerido ao lançar o serviço em uma OS/orçamento:

```text
FIXED  : quantidade = 1              preço unitário = price
HOURLY : quantidade = estimatedHours preço unitário = hourlyRate ?? TenantSettings.defaultHourlyRate
```

Se `HOURLY` e não houver valor-hora (nem no serviço nem no tenant), o serviço não pode ser lançado e a API retorna erro de validação explicando a configuração faltante.

Os valores são **sugestões**: o item lançado guarda quantidade e preço próprios (snapshot) e pode ser ajustado na OS/orçamento por quem tem permissão (`docs/modules/ordens-servico.md` §9). Alterar o catálogo nunca altera itens já lançados.

---

# 6. Garantia e Manutenção Preventiva

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`warrantyDays`|inteiro ≥ 0|Não|Garantia padrão, copiada para o item da OS|
|`warrantyKm`|inteiro ≥ 0|Não|Garantia padrão por quilometragem, copiada para o item da OS|
|`maintenanceIntervalDays`|inteiro > 0|Não|Intervalo recomendado para repetição (ex.: troca de óleo a cada 180 dias)|
|`maintenanceIntervalKm`|inteiro > 0|Não|Intervalo recomendado em km (ex.: 10.000 km)|

Os intervalos de manutenção são consumidos pelo CRM para calcular a próxima manutenção (`CLAUDE.md` §21). Esse cálculo **não** faz parte desta fase; os campos são documentados agora para que o histórico de serviços já seja gravado com essa informação.

---

# 7. Dados Fiscais

Serviços são tipicamente tributados por ISS e documentados por NFS-e, mas isso **não** é presumido no código: a tributação é resolvida pela configuração fiscal do tenant e do município (`docs/modules/ordens-servico.md` §15).

|Campo|Tipo|Obrigatório para emissão|Observação|
|-|-|-|-|
|`lc116Code`|texto (formato `NN.NN`)|Sim (NFS-e)|Item da lista de serviços da LC 116/2003 (ex.: `14.01`)|
|`municipalServiceCode`|texto (até 20)|Quando o município exigir|Código de tributação municipal|
|`nbsCode`|texto (até 12)|Quando exigido|Nomenclatura Brasileira de Serviços (NFS-e padrão nacional)|
|`cnae`|7 dígitos|Quando o município exigir|Atividade econômica vinculada ao serviço|
|`issRate`|percentual (0–100, até 4 casas)|Não|Alíquota de ISS. Quando vazia, usa a alíquota padrão do tenant/município na configuração fiscal|

Regras:

- **nenhuma alíquota é fixada em código**; `issRate` é dado configurável e auditável;
- retenção de ISS **não** é atributo do serviço: depende do tomador (cliente pessoa jurídica, município) e é decidida na emissão do documento;
- dados fiscais incompletos não impedem lançar o serviço em OS/orçamento; impedem apenas a emissão do documento fiscal;
- a mesma OS pode ter serviços e produtos com tributações diferentes — o cálculo fiscal é feito por item, nunca por OS inteira.

**Aviso:** as exigências de NFS-e variam por município e pela adesão ao padrão nacional. A validação desses campos com contador e provedor fiscal é obrigatória antes da emissão em produção (`CLAUDE.md` §24).

---

# 8. Status

Enum: `ACTIVE` | `INACTIVE` — mesmas regras de `docs/modules/produtos.md` §8 (exclusão lógica; inativar não altera itens lançados).

---

# 9. Relacionamentos

```text
Tenant
  └── Serviço (1:N)
        ├── QuoteItem (1:N, itemType = SERVICE)
        ├── WorkOrderItem (1:N, itemType = SERVICE)
        └── CheckupRecommendation (1:N, opcional)
```

---

# 10. Validações

- `code`: 1–30 caracteres (letras, números, `-`, `_`, `.`), único no tenant;
- `name`: 2–160 caracteres;
- `price`, `hourlyRate`: ≥ 0, 2 casas decimais, até 9.999.999,99;
- `estimatedHours`: > 0 e ≤ 999,99, 2 casas decimais;
- `pricingMode = FIXED` exige `price`; `pricingMode = HOURLY` exige `estimatedHours`;
- `warrantyDays` ≤ 3650; `warrantyKm` ≤ 1.000.000;
- `lc116Code`: formato `NN.NN`; `cnae`: 7 dígitos; `issRate`: 0–100;
- campos não documentados são rejeitados (whitelist).

---

# 11. Permissões

```text
services.read
services.create
services.update
services.deactivate
services.manage_prices
services.manage_fiscal
```

Matriz perfil × permissão: **PENDENTE de aprovação** (`docs/architecture/autorizacao.md`).

---

# 12. Auditoria

```text
SERVICE_CREATED
SERVICE_UPDATED
SERVICE_PRICE_CHANGED
SERVICE_FISCAL_CHANGED
SERVICE_DEACTIVATED
SERVICE_REACTIVATED
```

---

# 13. Filtros da Listagem

- busca por `code` ou `name`;
- filtro por `status`, `category`, `vehicleType` e `pricingMode`;
- paginação (padrão 20, máximo 100).

---

# 14. Exclusão

Exclusão física apenas para serviço nunca usado em orçamento, OS, check-up ou documento fiscal. Caso contrário, inativar.

---

# 15. Multi-Tenant

Todo serviço pertence a exatamente um tenant; `code` é único dentro do tenant. Toda consulta é escopada pelo `tenantId` da sessão.

---

# 16. Fora de Escopo (backlog)

- serviço composto/pacote com peças incluídas (kit);
- tabela de tempos padrão por modelo de veículo;
- comissão de mecânico por serviço;
- preço diferenciado por tipo/porte de veículo.
