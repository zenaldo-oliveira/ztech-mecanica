# ZTech Mecânica — Módulo de Ordens de Serviço

> Status: **proposta — aguardando aprovação** (rodada de 2026-10-02).
> Prioridade: **P2**. Nenhuma tabela, rota ou tela deste módulo deve ser criada antes da aprovação explícita deste documento.
> Itens marcados **DECISÃO PENDENTE (Dn)** estão consolidados em `docs/database/proposta-modelo-nucleo.md` §9 e precisam de resposta do responsável do produto.
>
> Nota de histórico: a versão anterior deste arquivo (48 linhas) assumia que toda OS nasce de um orçamento aprovado. Essa premissa foi substituída pela decisão de negócio de 2026-10-02 (dois caminhos — seção 3). Os itens listados na versão anterior (checklist, fotos, garantia, quilometragem, faturamento, histórico) foram preservados e tratados nas seções abaixo ou registrados como backlog (seção 22).

## 1. Objetivo

A Ordem de Serviço (OS) é o **núcleo operacional** do ZTech Mecânica. Ela registra o atendimento de um veículo, do recebimento à entrega, e é a origem dos eventos de:

- estoque (saída de peças);
- financeiro (contas a receber e recebimentos);
- fiscal (documentos fiscais de serviços e produtos);
- histórico do veículo;
- CRM e manutenção preventiva.

A OS reúne:

- cliente;
- veículo;
- quilometragem;
- queixa do cliente e diagnóstico;
- serviços e mão de obra (`SERVICE`);
- peças e produtos (`PRODUCT`);
- descontos e acréscimos;
- subtotais e total;
- responsável;
- status e histórico;
- orçamento de origem, quando existir;
- check-up relacionado, quando existir;
- observações.

---

# 2. Conceito

```text
OS
├── Cabeçalho     cliente, veículo, km, queixa, diagnóstico, responsável, status
├── Itens         SERVICE (serviços + mão de obra)  |  PRODUCT (peças)
├── Totais        subtotal serviços, subtotal peças, desconto, acréscimo, total
├── Origem        orçamento (opcional), check-up (opcional)
├── Pagamentos    0..N (pagamento dividido)                      — P4
├── Documentos    0..N documentos fiscais                        — P5
└── Histórico     transições de status e auditoria
```

O usuário vê serviços e peças numa única tela, agrupados. Internamente cada item é tipado (`SERVICE` | `PRODUCT`) e mantém referência ao catálogo, porque estoque, financeiro e fiscal tratam os dois tipos de forma diferente (`docs/modules/produtos.md` §2.1).

---

# 3. Caminhos de Criação

A OS **não** é obrigada a nascer de um orçamento.

## 3.1 Caminho 1 — via Orçamento

```text
Cliente → Veículo → Diagnóstico → Orçamento → Aprovação do cliente
        → Conversão para OS → Execução → Pagamento → Documento fiscal
```

- somente orçamento `APPROVED` pode ser convertido (`docs/modules/orcamentos.md` §8);
- a conversão copia cabeçalho e itens (snapshot) e grava `quoteId` na OS;
- um orçamento gera **no máximo uma** OS (`quoteId` único);
- a OS convertida já nasce com aprovação registrada (`approvedAt` herdado do orçamento).

## 3.2 Caminho 2 — OS direta

```text
Cliente → Veículo → Nova OS → Diagnóstico → Serviços + Mão de obra + Peças
        → Execução → Pagamento → Documento fiscal
```

- `quoteId` fica vazio;
- quando o valor precisa de autorização do cliente, a OS passa por `WAITING_APPROVAL` (seção 7).

## 3.3 A partir de um Check-up

Um check-up concluído pode gerar uma OS (ou um orçamento) com as recomendações selecionadas (`docs/database/proposta-modelo-nucleo.md` §5). A OS grava `checkupId`.

---

# 4. Identificação

|Campo|Regra|
|-|-|
|`id`|UUID v7 técnico|
|`number`|Número sequencial **por tenant**, inteiro, gerado no backend em transação. Exibido como `OS-000123`. Imutável. Não precisa ser contínuo sem lacunas (uma criação abortada pode consumir um número)|

---

# 5. Cabeçalho

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`customerId`|ref. Cliente|Sim|Cliente do mesmo tenant, não bloqueado para novos atendimentos (`docs/modules/clientes.md` §8)|
|`vehicleId`|ref. Veículo|Sim|Veículo do mesmo tenant e vinculado ao cliente no momento da abertura|
|`quoteId`|ref. Orçamento|Não|Preenchido somente pela conversão. Único|
|`checkupId`|ref. Check-up|Não|Check-up que originou/apoiou a OS|
|`status`|enum|Sim|Seção 7|
|`mileageIn`|inteiro ≥ 0|Sim|Km na entrada. Pode ser menor que a última km do veículo apenas com confirmação (troca de painel/hodômetro) — registrado em auditoria|
|`mileageOut`|inteiro ≥ `mileageIn`|Não|Km na entrega|
|`complaint`|texto (até 2000)|Não|Queixa/relato do cliente|
|`diagnosis`|texto (até 4000)|Não|Diagnóstico técnico|
|`notes`|texto (até 2000)|Não|Observações **visíveis ao cliente** (impressão/envio)|
|`internalNotes`|texto (até 2000)|Não|Observações internas — nunca impressas nem enviadas|
|`responsibleUserId`|ref. Usuário|Não|Mecânico/responsável. Usuário ativo do mesmo tenant|
|`promisedAt`|data/hora|Não|Previsão de entrega|
|`openedById`|ref. Usuário|Sistema|Quem abriu|
|`openedAt`, `startedAt`, `completedAt`, `closedAt`, `cancelledAt`|data/hora|Sistema|Preenchidos pelas transições|
|`cancelReason`|texto (5–500)|Ao cancelar|Obrigatório no cancelamento|
|`approvedAt`, `approvalChannel`, `approvedByName`|—|Sistema/Usuário|Registro da autorização do cliente. `approvalChannel`: `IN_PERSON` \| `PHONE` \| `WHATSAPP` \| `EMAIL` \| `OTHER`|
|`version`|inteiro|Sistema|Controle de concorrência otimista (seção 18)|

Totais: seção 10. Todos calculados no backend.

---

# 6. Itens

Uma OS tem 0..N itens. Cada item é `SERVICE` ou `PRODUCT`.

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`itemType`|enum|Sim|`SERVICE` \| `PRODUCT`. Imutável após criação|
|`serviceId`|ref. Serviço|Se `SERVICE`|Exatamente um entre `serviceId`/`productId`, coerente com `itemType` (constraint no banco)|
|`productId`|ref. Produto|Se `PRODUCT`|idem|
|`code`, `description`|texto|Sistema (snapshot)|Copiados do catálogo; `description` editável (até 500)|
|`unit`|texto|Sistema (snapshot)|`PRODUCT`: unidade do produto. `SERVICE`: `H` se `HOURLY`, `UN` se `FIXED`|
|`quantity`|decimal (até 3 casas) > 0|Sim|Respeita fração da unidade (`docs/modules/produtos.md` §4.1)|
|`unitPrice`|monetário ≥ 0|Sim|Sugerido pelo catálogo (`docs/modules/servicos.md` §5, `docs/modules/produtos.md` §5); ajustável com permissão (seção 9)|
|`unitCost`|monetário ≥ 0|Sistema (snapshot)|`PRODUCT`: custo médio no momento do lançamento. `SERVICE`: vazio. Visível só com `work_orders.view_cost`|
|`discountAmount`|monetário ≥ 0|Não|Desconto do item, ≤ `quantity × unitPrice`|
|`allocatedDiscount`, `allocatedSurcharge`|monetário|Sistema|Rateio do desconto/acréscimo geral (seção 10.2)|
|`totalAmount`|monetário|Sistema|`quantity × unitPrice − discountAmount`|
|`netAmount`|monetário|Sistema|`totalAmount − allocatedDiscount + allocatedSurcharge` — base para fiscal|
|`warrantyDays`, `warrantyKm`|inteiro|Snapshot (SERVICE)|Copiados do catálogo; editáveis|
|`position`|inteiro|Sistema|Ordem de exibição|
|`notes`|texto (até 500)|Não|Observação do item|
|`stockIssuedQuantity`|decimal|Sistema (PRODUCT)|Quantidade já baixada do estoque (seção 13)|
|`quoteItemId`|ref.|Sistema|Item de orçamento de origem, se convertido|
|`checkupRecommendationId`|ref.|Sistema|Recomendação de check-up de origem, se houver|

Regras:

- **itens sempre referenciam o catálogo.** Não há item avulso sem cadastro nesta fase — a tela de OS oferece "cadastro rápido" de serviço/produto para não travar o atendimento. **DECISÃO PENDENTE (D5).**
- só é possível lançar serviço/produto `ACTIVE`; itens já lançados permanecem válidos se o catálogo for inativado;
- serviço com `vehicleType` incompatível com o veículo (`CAR` × `MOTORCYCLE`) gera **aviso**, não bloqueio;
- alterações do catálogo nunca alteram itens já lançados (snapshot).

---

# 7. Status

## 7.1 Enum proposto

|Status|Rótulo (UI)|Significado|
|-|-|-|
|`OPEN`|Aberta|Veículo recebido, OS registrada|
|`DIAGNOSING`|Em diagnóstico|Avaliação técnica em andamento|
|`WAITING_APPROVAL`|Aguardando aprovação|Valores/itens aguardando autorização do cliente|
|`IN_PROGRESS`|Em serviço|Execução em andamento|
|`WAITING_PARTS`|Aguardando peças|Execução pausada por falta de peça|
|`COMPLETED`|Pronta|Serviço concluído — aguardando entrega/pagamento. Estoque é baixado aqui (seção 13)|
|`CLOSED`|Finalizada|Entregue e com financeiro resolvido. Somente leitura|
|`CANCELLED`|Cancelada|Encerrada sem execução/cobrança. Somente leitura|

Revisão em relação à lista sugerida (`DRAFT, OPEN, WAITING_APPROVAL, APPROVED, IN_PROGRESS, WAITING_PARTS, COMPLETED, CANCELLED, CLOSED`) — **DECISÃO PENDENTE (D1)**:

- **`DRAFT` removido:** o rascunho comercial é o orçamento. Abrir uma OS já é o ato de receber o veículo; um estado a mais aumentaria cliques sem ganho.
- **`APPROVED` removido:** aprovação é um *fato* (campos `approvedAt`/`approvalChannel`), não uma etapa de trabalho. Após aprovar, a OS vai para `IN_PROGRESS` (ou `WAITING_PARTS`).
- **`DIAGNOSING` adicionado:** já existe no frontend (`apps/frontend/src/lib/work-order-status.ts`, "Em diagnóstico") e é uma etapa real da oficina.

Mapeamento com o frontend atual (sem perda): Aberta→`OPEN`, Em diagnóstico→`DIAGNOSING`, Aguardando aprovação→`WAITING_APPROVAL`, Em serviço→`IN_PROGRESS`, Pronta→`COMPLETED`, Finalizada→`CLOSED`. Novos: `WAITING_PARTS`, `CANCELLED`.

## 7.2 Transições

```text
OPEN ─► DIAGNOSING ─► WAITING_APPROVAL ─► IN_PROGRESS ⇄ WAITING_PARTS
  │         │                                  │
  │         └──────────────► IN_PROGRESS       ▼
  └────────────────────────► IN_PROGRESS   COMPLETED ─► CLOSED
                                               │
                                               └─► IN_PROGRESS (reabrir)

Qualquer status, exceto CLOSED/CANCELLED ─► CANCELLED
```

A tabela abaixo é a fonte de verdade das transições.

|De|Para|Condição|Permissão|
|-|-|-|-|
|`OPEN`|`DIAGNOSING`, `WAITING_APPROVAL`, `IN_PROGRESS`|—|`work_orders.change_status`|
|`DIAGNOSING`|`WAITING_APPROVAL`, `IN_PROGRESS`|—|`work_orders.change_status`|
|`WAITING_APPROVAL`|`IN_PROGRESS`, `WAITING_PARTS`|registra `approvedAt`, `approvalChannel`|`work_orders.register_approval`|
|`WAITING_APPROVAL`|`DIAGNOSING`|cliente pediu revisão|`work_orders.change_status`|
|`IN_PROGRESS`|`WAITING_PARTS` e vice-versa|—|`work_orders.change_status`|
|`IN_PROGRESS`|`COMPLETED`|≥ 1 item; regras de estoque (seção 13) satisfeitas|`work_orders.complete`|
|`COMPLETED`|`IN_PROGRESS`|reabertura com motivo; sem documento fiscal autorizado|`work_orders.reopen`|
|`COMPLETED`|`CLOSED`|saldo a receber resolvido (seção 14)|`work_orders.close`|
|qualquer aberto|`CANCELLED`|motivo; sem pagamento confirmado não estornado; sem documento fiscal autorizado não cancelado|`work_orders.cancel`|

Regras:

- transições não listadas são rejeitadas com `409 Conflict` e código `INVALID_STATUS_TRANSITION`;
- toda transição grava um registro em `WorkOrderStatusHistory` (de, para, usuário, data, motivo);
- `CLOSED` e `CANCELLED` são terminais. Corrigir uma OS fechada exige processo de estorno (P4/P5), fora desta fase.

---

# 8. Edição por Status

|Status|Cabeçalho|Itens|
|-|-|-|
|`OPEN`, `DIAGNOSING`, `WAITING_APPROVAL`, `IN_PROGRESS`, `WAITING_PARTS`|editável|editável|
|`COMPLETED`|apenas `notes`, `internalNotes`, `mileageOut`, `promisedAt`|bloqueado (reabrir para alterar)|
|`CLOSED`, `CANCELLED`|bloqueado|bloqueado|

Incluir ou alterar item **depois** de registrada a aprovação do cliente não volta a OS automaticamente para `WAITING_APPROVAL`, mas gera aviso na interface e evento de auditoria `WORK_ORDER_ITEMS_CHANGED_AFTER_APPROVAL`, com total aprovado × total atual.

---

# 9. Preços e Descontos dos Itens

- o preço sugerido vem do catálogo; alterar `unitPrice` exige `work_orders.edit_prices`;
- desconto por item ou geral exige `work_orders.apply_discount`;
- limite máximo de desconto por perfil (ex.: atendente até 10%) é **configuração futura** — nesta fase existe só a permissão binária;
- preço abaixo do custo (`unitPrice < unitCost`) gera aviso, não bloqueio;
- toda alteração de preço/desconto é auditada (antes/depois).

---

# 10. Cálculo de Valores

## 10.1 Fórmulas

```text
item.totalAmount     = round2(quantity × unitPrice) − discountAmount

servicesSubtotal     = Σ totalAmount dos itens SERVICE
productsSubtotal     = Σ totalAmount dos itens PRODUCT
subtotal             = servicesSubtotal + productsSubtotal

discountAmount (geral) = valor informado, ou round2(subtotal × percentual / 100)
surchargeAmount        = valor informado (acréscimo: taxa, deslocamento, etc.)

total                = subtotal − discountAmount + surchargeAmount
```

Restrições: `discountAmount ≤ subtotal`; `total ≥ 0`. Desconto geral pode ser informado em `AMOUNT` ou `PERCENT` (`discountType`); o valor efetivo em reais é sempre gravado em `discountAmount`.

## 10.2 Rateio (necessário para fiscal e financeiro)

Desconto e acréscimo gerais são rateados entre os itens proporcionalmente a `totalAmount`, gravados em `allocatedDiscount`/`allocatedSurcharge`. A diferença de arredondamento vai para o item de maior valor, garantindo que `Σ netAmount = total` **exatamente**.

Resultado: o backend sempre sabe o valor líquido de serviços e de peças separadamente:

```text
servicesNet = Σ netAmount (SERVICE)
productsNet = Σ netAmount (PRODUCT)
servicesNet + productsNet = total
```

Exibição ao usuário:

```text
SERVIÇOS:  R$ X        (servicesSubtotal)
PEÇAS:     R$ Y        (productsSubtotal)
DESCONTO:  R$ Z
ACRÉSCIMO: R$ W
TOTAL:     R$ XXX
```

## 10.3 Precisão

- valores monetários: `Decimal(12,2)`; quantidades: `Decimal(12,3)`; cálculo em centavos inteiros no backend, nunca ponto flutuante;
- arredondamento: meio para cima (half-up) em 2 casas, por item;
- os totais são **sempre recalculados no backend** a cada alteração de item/desconto; valores enviados pelo cliente para campos calculados são ignorados.

---

# 11. Responsável

`responsibleUserId` é um usuário ativo do tenant. Atribuir ou trocar exige `work_orders.assign`. Responsável por item (comissão por mecânico) é backlog.

---

# 12. Integração com Orçamento e Check-up

- conversão de orçamento: `docs/modules/orcamentos.md` §8;
- recomendações de check-up selecionadas viram itens com `checkupRecommendationId`; a recomendação passa para `ACCEPTED`;
- a OS não altera o orçamento de origem após a conversão.

---

# 13. Estoque

Regras (complementam `docs/modules/produtos.md` §6 e `docs/modules/estoque.md`):

1. Itens `SERVICE` nunca movimentam estoque.
2. Itens `PRODUCT` com `trackStock = true` **reservam** saldo enquanto a OS está aberta (`OPEN` … `WAITING_PARTS`). A reserva é **calculada** (`quantity − stockIssuedQuantity` dos itens de OS abertas), não é movimentação nem saldo gravado nesta fase.
3. Ao passar para `COMPLETED`, para cada item `PRODUCT` com `trackStock`, o sistema gera `StockMovement` tipo `EXIT`, motivo `WORK_ORDER`, com `workOrderId` e `workOrderItemId`, pela diferença `quantity − stockIssuedQuantity`, e atualiza `stockIssuedQuantity`. **DECISÃO PENDENTE (D2)** — alternativa: baixar no momento do lançamento da peça.
4. Reabrir (`COMPLETED → IN_PROGRESS`) não estorna o estoque. Se após reabrir a quantidade de um item for reduzida ou o item removido, gera-se `RETURN` (motivo `WORK_ORDER`) da diferença já baixada.
5. Cancelar uma OS com itens já baixados gera `RETURN` (motivo `WORK_ORDER_CANCELLATION`) de tudo que foi baixado.
6. Saldo insuficiente na conclusão: **bloqueia** por padrão, com mensagem listando os itens; configurável por tenant (`TenantSettings.allowNegativeStock`). **DECISÃO PENDENTE (D3)**.
7. Saldo e movimentações são gravados na **mesma transação** da mudança de status — ou tudo é gravado, ou nada.
8. O saldo nunca é editado diretamente.

---

# 14. Financeiro e Pagamentos (P4 — integração prevista)

- saldo a receber da OS = `total − Σ pagamentos confirmados − Σ valores já lançados como contas a receber`;
- uma OS pode ter vários pagamentos com formas diferentes (ex.: PIX R$ 500 + cartão R$ 1.000);
- pagamento pode ser registrado a partir de `COMPLETED` (adiantamento antes disso: **backlog**);
- `COMPLETED → CLOSED` exige saldo a receber igual a zero — o restante pode ser quitado ou lançado como conta a receber parcelada (a prazo), com permissão `work_orders.close_with_receivable`. **DECISÃO PENDENTE (D7)**;
- a OS não grava lançamentos financeiros diretamente; ela solicita ao módulo Financeiro/Pagamentos (desacoplamento — `CLAUDE.md` §20). Modelo em `docs/database/proposta-modelo-nucleo.md` §6.

---

# 15. Fiscal (P5 — integração prevista)

- a OS **não** calcula tributos; ela fornece itens tipados com `netAmount` ao módulo Fiscal;
- a estratégia de emissão é configuração do tenant (`TenantFiscalSettings.emissionStrategy`), por exemplo:
  - `SPLIT`: NFS-e para serviços + NF-e/NFC-e para peças;
  - `CONJUGATED`: documento único conjugado, onde o município/UF permitir;
  - `SERVICES_ONLY`, `PRODUCTS_ONLY`, `NONE`;
- documentos podem ser emitidos a partir de `COMPLETED`; emissão não é obrigatória para `CLOSED` (algumas oficinas emitem depois ou não emitem certos itens);
- um item da OS pode estar em **no máximo um** documento fiscal ativo (não rejeitado/cancelado/erro);
- documento fiscal autorizado bloqueia reabertura e cancelamento da OS até ser cancelado;
- dados fiscais incompletos no catálogo **não** impedem a OS; impedem a emissão do item;
- modelo e abstrações (`FiscalProvider`, `NFeProvider`, `NFSeProvider`, `NFCeProvider`) em `docs/database/proposta-modelo-nucleo.md` §7.

---

# 16. Histórico do Veículo e CRM

- ao `COMPLETED`, se `mileageOut` (ou `mileageIn`) for maior que a última km do veículo, atualiza `Vehicle.lastMileage`. **Conflito com `docs/modules/veiculos.md` §6** (que adia essa atualização) — **DECISÃO PENDENTE (D11)**;
- o histórico do veículo é a consulta das OS `COMPLETED`/`CLOSED` e seus itens — sem tabela duplicada;
- cálculo de próxima manutenção (intervalos de `docs/modules/servicos.md` §6) é CRM, fora desta fase.

---

# 17. Validações

- `customerId`, `vehicleId`, `responsibleUserId`, `serviceId`, `productId`, `quoteId`, `checkupId` devem existir **no mesmo tenant** — senão `404` (nunca revelar existência em outro tenant);
- veículo deve estar vinculado ao cliente informado;
- `mileageIn`: 0–9.999.999; `mileageOut ≥ mileageIn`;
- quantidades e valores conforme seção 6 e 10;
- `cancelReason` obrigatório no cancelamento (5–500);
- whitelist de campos: campos não documentados são rejeitados; campos calculados/sistema são ignorados se enviados.

---

# 18. Concorrência e Idempotência

- `version` (otimista): toda alteração envia a versão lida; divergência retorna `409 Conflict` (`STALE_VERSION`);
- transições de status, baixa de estoque e conversão de orçamento ocorrem em transação;
- a conversão de orçamento e o registro de pagamentos aceitam cabeçalho `Idempotency-Key`; repetir a mesma chave devolve o mesmo resultado sem duplicar.

---

# 19. Permissões

```text
work_orders.read
work_orders.create
work_orders.update
work_orders.change_status
work_orders.register_approval
work_orders.complete
work_orders.reopen
work_orders.close
work_orders.close_with_receivable
work_orders.cancel
work_orders.assign
work_orders.edit_prices
work_orders.apply_discount
work_orders.view_cost
work_orders.print
```

Matriz perfil × permissão: **PENDENTE de aprovação** (`docs/architecture/autorizacao.md` §9). Bloqueia a implementação.

---

# 20. Auditoria

```text
WORK_ORDER_CREATED                     (origem: DIRECT | QUOTE | CHECKUP)
WORK_ORDER_UPDATED
WORK_ORDER_STATUS_CHANGED              (de, para, motivo)
WORK_ORDER_ITEM_ADDED | _UPDATED | _REMOVED
WORK_ORDER_PRICE_CHANGED
WORK_ORDER_DISCOUNT_APPLIED
WORK_ORDER_APPROVAL_REGISTERED
WORK_ORDER_ITEMS_CHANGED_AFTER_APPROVAL
WORK_ORDER_ASSIGNED
WORK_ORDER_REOPENED
WORK_ORDER_CANCELLED
WORK_ORDER_MILEAGE_BELOW_VEHICLE       (km menor que a última conhecida, confirmada)
```

Cada evento: `tenantId`, `userId`, `requestId`, data/hora, antes/depois (`docs/architecture/seguranca.md` §8).

---

# 21. Listagem, Filtros e Impressão

- busca por número, placa, nome do cliente;
- filtros: `status` (múltiplo), responsável, período de abertura/conclusão, origem (direta/orçamento);
- paginação (padrão 20, máximo 100), ordenação por abertura (desc);
- impressão/PDF da OS para o cliente: cabeçalho, itens agrupados (serviços/peças), totais, `notes`; nunca `internalNotes` nem custos.

---

# 22. Fora de Escopo (backlog)

- fotos e anexos (exige armazenamento de arquivos — decisão de infraestrutura);
- vistoria de entrada (nível de combustível, avarias) — avaliar se é um tipo de check-up;
- responsável e comissão por item;
- adiantamento/sinal antes da conclusão;
- acionamento de garantia (OS de retorno vinculada à original);
- assinatura digital do cliente;
- aprovação do cliente via link/WhatsApp (depende de `docs/modules/whatsapp.md`);
- agendamento.

---

# 23. Multi-Tenant

Toda OS, item, histórico e movimentação pertence a um único tenant. `number` é único por tenant. Toda consulta é escopada pelo `tenantId` da sessão; referências cruzadas (cliente, veículo, produto, serviço, usuário) são validadas no mesmo tenant. Testes obrigatórios de vazamento entre tenants: `docs/checklist/ordens-servico.md`.
