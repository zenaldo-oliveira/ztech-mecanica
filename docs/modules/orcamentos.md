# ZTech Mecânica — Módulo de Orçamentos

> Status: **proposta — aguardando aprovação** (rodada de 2026-10-02).
> Prioridade: **P2**. Nenhuma tabela, rota ou tela deste módulo deve ser criada antes da aprovação explícita deste documento.
> Itens marcados **DECISÃO PENDENTE (Dn)** estão consolidados em `docs/database/proposta-modelo-nucleo.md` §9.
>
> Nota de histórico: a versão anterior descrevia o orçamento como "principal ponto de transição" obrigatório até a OS. Pela decisão de 2026-10-02, o orçamento é **um dos dois caminhos** — a OS também pode ser aberta diretamente (`docs/modules/ordens-servico.md` §3). Os itens da versão anterior (mão de obra, serviços, peças, descontos, acréscimos, observações, validade, aprovação) foram preservados. "Condições de pagamento" foi mantido como texto livre (seção 4) — condições estruturadas dependem do módulo Financeiro (P4).

## 1. Objetivo

O orçamento é a proposta de valores apresentada ao cliente **antes** da execução. O módulo permite criar, calcular, enviar, aprovar, rejeitar, cancelar e converter orçamentos em Ordem de Serviço.

O orçamento **não** movimenta estoque, **não** gera financeiro e **não** gera documento fiscal.

---

# 2. Conceito

```text
Orçamento
├── Cabeçalho  cliente, veículo, diagnóstico, validade, status
├── Itens      SERVICE (serviços + mão de obra) | PRODUCT (peças)
├── Totais     subtotal serviços, subtotal peças, desconto, acréscimo, total
├── Origem     check-up (opcional)
└── Destino    OS (no máximo uma, após aprovação)
```

Itens, cálculo e regras de catálogo são **idênticos** aos da OS (`docs/modules/ordens-servico.md` §6, §9 e §10), para que a conversão seja uma cópia fiel.

---

# 3. Identificação

|Campo|Regra|
|-|-|
|`id`|UUID v7 técnico|
|`number`|Sequencial por tenant, exibido como `ORC-000045`. Imutável|
|`revision`|Inteiro, começa em 1. Incrementa quando um orçamento já enviado volta para edição (seção 7)|

---

# 4. Cabeçalho

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`customerId`|ref. Cliente|Sim|Mesmo tenant|
|`vehicleId`|ref. Veículo|Sim|Mesmo tenant, vinculado ao cliente|
|`checkupId`|ref. Check-up|Não|Check-up de origem|
|`status`|enum|Sim|Seção 6|
|`mileage`|inteiro ≥ 0|Não|Km informada na avaliação|
|`complaint`|texto (até 2000)|Não|Queixa do cliente|
|`diagnosis`|texto (até 4000)|Não|Diagnóstico técnico|
|`notes`|texto (até 2000)|Não|Observações visíveis ao cliente|
|`internalNotes`|texto (até 2000)|Não|Nunca impressas/enviadas|
|`paymentTermsNote`|texto (até 500)|Não|Condições de pagamento em texto livre (ex.: "3x no cartão")|
|`validUntil`|data|Sim|Padrão: data de criação + `TenantSettings.quoteValidityDays` (padrão sugerido 7 dias). ≥ data de criação|
|`createdById`|ref. Usuário|Sistema||
|`sentAt`, `approvedAt`, `rejectedAt`, `cancelledAt`, `convertedAt`, `expiredAt`|data/hora|Sistema|Preenchidos pelas transições|
|`approvalChannel`|enum|Ao aprovar|`IN_PERSON` \| `PHONE` \| `WHATSAPP` \| `EMAIL` \| `OTHER`|
|`approvedByName`|texto (até 120)|Não|Nome de quem autorizou, se não for o titular|
|`rejectionReason`|texto (até 500)|Não|Motivo informado pelo cliente|
|`cancelReason`|texto (5–500)|Ao cancelar|Motivo interno|
|`approvedTotal`|monetário|Sistema|Snapshot do `total` no momento da aprovação|
|`version`|inteiro|Sistema|Concorrência otimista|

Totais (`servicesSubtotal`, `productsSubtotal`, `subtotal`, `discountType`, `discountAmount`, `surchargeAmount`, `total`): mesmas fórmulas e rateio de `docs/modules/ordens-servico.md` §10.

---

# 5. Itens

Mesma estrutura de `WorkOrderItem` (`docs/modules/ordens-servico.md` §6), **sem** `stockIssuedQuantity`. Campos específicos:

|Campo|Observação|
|-|-|
|`checkupRecommendationId`|Recomendação de check-up de origem, se houver|

Regras de catálogo, snapshot, preço, desconto e permissão: idênticas à OS. Orçamento **não reserva** estoque; a tela pode exibir o saldo disponível como informação.

---

# 6. Status

|Status|Rótulo (UI)|Significado|
|-|-|-|
|`DRAFT`|Rascunho|Em elaboração, editável|
|`SENT`|Enviado|Apresentado ao cliente, aguardando resposta|
|`APPROVED`|Aprovado|Cliente autorizou; pronto para virar OS|
|`REJECTED`|Rejeitado|Cliente recusou|
|`EXPIRED`|Expirado|Passou de `validUntil` sem resposta|
|`CANCELLED`|Cancelado|Cancelado pela oficina|
|`CONVERTED`|Convertido em OS|OS gerada. Terminal|

---

# 7. Transições

|De|Para|Condição|Permissão|
|-|-|-|-|
|`DRAFT`|`SENT`|≥ 1 item; `validUntil` ≥ hoje|`quotes.send`|
|`DRAFT`|`APPROVED`|aprovação presencial sem envio prévio; ≥ 1 item|`quotes.approve`|
|`SENT`|`APPROVED`|`validUntil` ≥ hoje|`quotes.approve`|
|`SENT`|`REJECTED`|—|`quotes.reject`|
|`SENT`|`DRAFT`|edição após envio → `revision + 1`|`quotes.update`|
|`SENT`|`EXPIRED`|automático, `validUntil` < hoje|sistema|
|`EXPIRED`, `REJECTED`|`DRAFT`|reabrir/renegociar → `revision + 1`, nova `validUntil`|`quotes.update`|
|`DRAFT`, `SENT`, `APPROVED`|`CANCELLED`|motivo obrigatório|`quotes.cancel`|
|`APPROVED`|`CONVERTED`|cria a OS (seção 8)|`quotes.convert` + `work_orders.create`|

Regras:

- só `DRAFT` permite editar cabeçalho e itens; qualquer outro status bloqueia edição (`409`);
- `APPROVED` não volta para `DRAFT`: para alterar um orçamento aprovado, cancele-o e duplique (ação "Duplicar" cria novo `DRAFT` com os mesmos itens);
- expiração: verificada ao ler/transicionar (um orçamento `SENT` vencido é tratado e persistido como `EXPIRED` no primeiro acesso) e, futuramente, por rotina agendada. Nunca se aprova orçamento vencido;
- aprovação é do orçamento **inteiro**. Aprovação parcial (cliente aprova só alguns itens) é feita removendo os itens recusados antes de aprovar (volta para `DRAFT`, nova revisão). Aprovação por item é backlog. **DECISÃO PENDENTE (D4)**;
- toda transição gera registro em `QuoteStatusHistory`.

---

# 8. Conversão em OS

Executada em **uma transação**, com `Idempotency-Key`:

1. valida status `APPROVED` e que não existe OS com este `quoteId`;
2. cria a OS com `status = OPEN`, `quoteId`, `checkupId`, cliente, veículo, `mileage → mileageIn`, `complaint`, `diagnosis`, `notes`, `internalNotes`, `approvedAt`, `approvalChannel`, `approvedByName`;
3. copia cada item (snapshot de preço, desconto, quantidade) para `WorkOrderItem`, com `quoteItemId`;
4. copia desconto/acréscimo gerais; recalcula totais (devem ser iguais a `approvedTotal`);
5. orçamento → `CONVERTED`, `convertedAt`;
6. retorna a OS criada.

Repetir a conversão do mesmo orçamento retorna a OS existente (idempotência) — nunca cria duas.

Após a conversão, o orçamento fica somente leitura. Alterações posteriores são feitas na OS (que registra `WORK_ORDER_ITEMS_CHANGED_AFTER_APPROVAL`).

Itens cujo serviço/produto ficou inativo entre a aprovação e a conversão são copiados normalmente (o preço é o aprovado) e geram aviso.

---

# 9. Impressão e Envio

- PDF/impressão para o cliente: número, revisão, validade, cliente, veículo, diagnóstico, itens agrupados (serviços/peças), totais, `notes`, `paymentTermsNote`. Nunca `internalNotes` nem custos;
- envio por WhatsApp/e-mail depende de `docs/modules/whatsapp.md` (fora desta fase). Nesta fase, `SENT` significa "apresentado ao cliente" por qualquer meio.

---

# 10. Validações

- referências no mesmo tenant (senão `404`); veículo vinculado ao cliente;
- `validUntil` ≥ data de criação e ≤ 365 dias à frente;
- itens e valores: `docs/modules/ordens-servico.md` §6 e §10;
- `cancelReason` 5–500 caracteres;
- whitelist de campos.

---

# 11. Permissões

```text
quotes.read
quotes.create
quotes.update
quotes.send
quotes.approve
quotes.reject
quotes.cancel
quotes.convert
quotes.edit_prices
quotes.apply_discount
quotes.view_cost
quotes.print
```

Matriz perfil × permissão: **PENDENTE de aprovação** (`docs/architecture/autorizacao.md` §9).

---

# 12. Auditoria

```text
QUOTE_CREATED                 (origem: MANUAL | CHECKUP | DUPLICATE)
QUOTE_UPDATED
QUOTE_ITEM_ADDED | _UPDATED | _REMOVED
QUOTE_PRICE_CHANGED
QUOTE_DISCOUNT_APPLIED
QUOTE_SENT
QUOTE_APPROVED                (approvedTotal, canal)
QUOTE_REJECTED
QUOTE_EXPIRED
QUOTE_REOPENED                (nova revisão)
QUOTE_CANCELLED
QUOTE_CONVERTED               (workOrderId)
```

---

# 13. Listagem e Filtros

- busca por número, placa, nome do cliente;
- filtros: `status` (múltiplo), período de criação, vencendo nos próximos N dias;
- paginação (padrão 20, máximo 100).

Indicadores derivados (taxa de aprovação, valor em aberto) são relatórios — P7.

---

# 14. Exclusão

Orçamento não é excluído fisicamente após sair de `DRAFT`; usa-se `CANCELLED`. Um `DRAFT` nunca enviado pode ser excluído fisicamente por quem tem `quotes.cancel`.

---

# 15. Fora de Escopo (backlog)

- aprovação por item;
- aprovação pelo cliente via link público/WhatsApp;
- versões completas (snapshot de cada revisão) — nesta fase guarda-se o número da revisão e auditoria;
- condições de pagamento estruturadas (parcelas, juros);
- modelos de orçamento (pacotes pré-montados).

---

# 16. Multi-Tenant

Todo orçamento, item e histórico pertence a um único tenant; `number` é único por tenant; consultas escopadas pelo `tenantId` da sessão. Testes de vazamento entre tenants: `docs/checklist/orcamentos.md`.
