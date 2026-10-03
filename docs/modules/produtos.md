# ZTech Mecânica — Módulo de Produtos

> Status: **especificação aprovada para implementação (P3)** — rodada de 2026-10-02.
> Este documento é contrato entre backend e frontend. Itens marcados como **PENDENTE** não devem ser implementados até nova aprovação.

## 1. Objetivo

O módulo de produtos será responsável pelo cadastro, organização, identificação e classificação de todos os produtos, peças, materiais, insumos e itens utilizados pela oficina.

O módulo deverá servir como fonte oficial dos produtos utilizados por:

- compras;
- estoque;
- ordens de serviço;
- orçamentos;
- fornecedores;
- fiscal;
- financeiro;
- compatibilidade de veículos.

O módulo deverá atender oficinas de:

- carros;
- motos;
- carros e motos.

---

# 2. Conceito

Um produto representa um item comercial ou material utilizado pela oficina.

Exemplos:

```text
Filtro de óleo
Filtro de ar
Pastilha de freio
Disco de freio
Óleo de motor
Fluido de freio
Vela de ignição
Bateria
Pneu
Correia
Lâmpada
Aditivo
```

## 2.1 PRODUCT × SERVICE

O ZTech Mecânica separa estruturalmente dois tipos de item comercial:

|Tipo|Representa|Documento|Estoque|Tributação típica|
|-|-|-|-|-|
|`PRODUCT`|Peça, produto ou material físico|este documento|Sim (quando `trackStock = true`)|ICMS/IPI/PIS/COFINS — documento NF-e ou NFC-e|
|`SERVICE`|Serviço ou mão de obra|`docs/modules/servicos.md`|Nunca|ISS — documento NFS-e|

A coluna "Tributação típica" é apenas orientação conceitual. Nenhuma regra tributária é deduzida do tipo do item: a tributação efetiva é sempre resolvida pela configuração fiscal (seção 9). O usuário vê produtos e serviços juntos na OS e no orçamento; o backend mantém a separação para estoque, financeiro e fiscal.

Produtos e serviços são **entidades distintas**, com tabelas distintas. Não existe uma tabela genérica "item de catálogo" que misture os dois.

---

# 3. Identificação

|Campo|Regra|
|-|-|
|`id`|UUID v7 técnico (`docs/database/modelo-dados.md` §3)|
|`code`|Código interno do produto, informado pelo usuário ou gerado pelo sistema (formato gerado: `PRD-000001`). Único dentro do tenant, comparado sem diferenciar maiúsculas/minúsculas e sem espaços nas pontas|
|`gtin`|Código de barras EAN/GTIN (8, 12, 13 ou 14 dígitos), opcional. Único dentro do tenant quando preenchido|
|`manufacturerCode`|Código da peça no fabricante (part number), opcional, não único (o mesmo código pode existir em marcas diferentes)|

---

# 4. Dados Cadastrais

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`name`|texto (2–160)|Sim|Nome comercial exibido em OS, orçamento e documento fiscal|
|`description`|texto (até 2000)|Não|Descrição detalhada|
|`brand`|texto (até 80)|Não|Marca (texto livre nesta fase, ex.: Bosch, NGK, Mobil)|
|`category`|texto (até 80)|Não|Categoria (texto livre nesta fase, ex.: Filtros, Freios, Óleos)|
|`unit`|enum|Sim|Unidade comercial — ver seção 4.1|
|`status`|enum|Sim|`ACTIVE` \| `INACTIVE` — padrão `ACTIVE`|
|`trackStock`|booleano|Sim|Padrão `true`. `false` para itens vendidos sem controle de saldo (ex.: material de consumo rateado)|
|`notes`|texto (até 2000)|Não|Observações internas — nunca exibidas ao cliente|

Marca e categoria como tabelas normalizadas são evolução futura (mesma decisão adotada para marca/modelo em `docs/modules/veiculos.md` §2).

## 4.1 Unidade

Enum `ProductUnit`:

|Valor|Significado|Aceita fração|
|-|-|-|
|`UN`|Unidade|Não|
|`PC`|Peça|Não|
|`PAR`|Par|Não|
|`JG`|Jogo|Não|
|`KIT`|Kit|Não|
|`CX`|Caixa|Não|
|`L`|Litro|Sim|
|`ML`|Mililitro|Não|
|`KG`|Quilograma|Sim|
|`G`|Grama|Não|
|`M`|Metro|Sim|

Quantidades de produtos em unidades que não aceitam fração devem ser inteiras. Quantidades fracionadas usam no máximo 3 casas decimais (ex.: `4,500 L` de óleo).

A unidade tributável exigida pelo documento fiscal pode diferir da comercial; a conversão é configuração fiscal (seção 9) e **não** faz parte desta fase.

---

# 5. Preços e Custos

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`salePrice`|monetário ≥ 0|Sim|Preço de venda sugerido. É copiado para o item do orçamento/OS no momento da inclusão (snapshot)|
|`costPrice`|monetário ≥ 0|Não|Último custo informado manualmente ou pela entrada de compra|
|`averageCost`|monetário ≥ 0|Calculado|Custo médio ponderado, mantido exclusivamente pelo módulo de Estoque a cada entrada (`docs/modules/estoque.md`). Nunca editável diretamente|

Regras:

- alterar `salePrice` **não** altera itens já lançados em orçamentos ou OS (os itens guardam o preço da época — snapshot);
- `costPrice` e `averageCost` são informação gerencial: só são retornados pela API para quem tem `products.view_cost`;
- valores monetários seguem a convenção de `docs/database/modelo-dados.md` §7 (decimal com 2 casas, nunca ponto flutuante).

---

# 6. Estoque

O produto é a referência; o saldo e as movimentações pertencem ao módulo de Estoque.

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`minStock`|quantidade ≥ 0|Não|Estoque mínimo — base para alerta de estoque baixo no dashboard|

Regras de estoque que este módulo impõe:

1. o saldo de um produto **nunca** é editado diretamente. Toda alteração de quantidade é feita por uma movimentação (`StockMovement`) do tipo `ENTRY`, `EXIT`, `ADJUSTMENT` ou `RETURN`, com origem rastreável (`docs/modules/ordens-servico.md` §13 e `docs/modules/estoque.md`);
2. produto com `trackStock = false` não gera movimentação nem tem saldo;
3. alterar `trackStock` de `true` para `false` só é permitido com saldo físico igual a zero e sem reservas abertas;
4. o saldo inicial de um produto é registrado como movimentação `ENTRY` com motivo `INITIAL_BALANCE`, nunca como valor gravado no cadastro.

Depósitos/localizações múltiplos (`docs/modules/estoque.md`) são evolução futura: nesta fase existe **um saldo por produto por tenant**.

---

# 7. Fornecedores

|Campo|Tipo|Obrigatório|Observação|
|-|-|-|-|
|`preferredSupplierId`|referência a Fornecedor|Não|Fornecedor preferencial|

A relação N:N produto × fornecedor (código do produto no fornecedor, último preço de compra, prazo) pertence ao módulo de Fornecedores/Compras e **não** é implementada nesta fase. **PENDENTE:** o campo `preferredSupplierId` só é criado quando a entidade Fornecedor existir (`docs/modules/fornecedores.md` ainda não especificado).

---

# 8. Status

Enum: `ACTIVE` | `INACTIVE`

|Status|Significado|
|-|-|
|`ACTIVE`|Disponível para novos orçamentos, OS e compras|
|`INACTIVE`|Exclusão lógica — não aparece para seleção em novos lançamentos; permanece visível em históricos|

Regras:

- inativar um produto **não** remove nem altera itens já lançados;
- um produto inativo com saldo em estoque pode ser inativado (o saldo permanece visível no estoque e exige ajuste explícito, se for o caso).

---

# 9. Dados Fiscais

O usuário não precisa entender tributação para lançar um produto em uma OS. Dados fiscais incompletos **não** impedem orçamento nem OS; impedem apenas a emissão do documento fiscal daquele item (`docs/modules/ordens-servico.md` §15).

## 9.1 Campos fiscais do produto

|Campo|Tipo|Obrigatório para emissão|Observação|
|-|-|-|-|
|`ncm`|8 dígitos|Sim (NF-e/NFC-e)|Nomenclatura Comum do Mercosul|
|`cest`|7 dígitos|Quando aplicável|Exigido para itens sujeitos a substituição tributária|
|`origin`|enum `0`–`8`|Sim (NF-e/NFC-e)|Origem da mercadoria (tabela oficial de origem do ICMS)|
|`gtin`|ver seção 3|Quando houver|Também usado pelo documento fiscal|
|`fiscalProfileId`|referência a `FiscalProfile`|Não|Perfil tributário (seção 9.2)|
|`cfopOverride`|4 dígitos|Não|Sobrescreve o CFOP do perfil — uso excepcional|
|`icmsCstOverride`|2 dígitos|Não|Sobrescreve o CST de ICMS do perfil (regime normal)|
|`icmsCsosnOverride`|3 dígitos|Não|Sobrescreve o CSOSN do perfil (Simples Nacional)|

## 9.2 Perfil fiscal (`FiscalProfile`)

CFOP, CST e CSOSN dependem do regime tributário da empresa, da UF de origem e destino, do tipo de operação e do tipo de cliente — não do produto isoladamente. Por isso, o produto aponta para um **perfil fiscal** do tenant (ex.: "Peças — revenda", "Peças com ST"), configurado uma vez pela oficina ou pelo contador, em vez de exigir CST/CFOP em cada produto.

Ordem de resolução da regra fiscal de um item de produto:

```text
override no produto  →  FiscalProfile do produto  →  FiscalProfile padrão do tenant  →  incompleto (bloqueia emissão)
```

O conteúdo do `FiscalProfile` (CFOP por tipo de operação, CST/CSOSN, alíquotas, IPI, PIS/COFINS e, a partir da reforma tributária, IBS/CBS e classificação tributária) é especificado no módulo Fiscal (P5). **Nenhuma alíquota é fixada em código** — todas são dados configuráveis, versionáveis e auditáveis.

**Aviso:** regras fiscais devem ser validadas por contador e pelo provedor fiscal escolhido, conforme a legislação vigente (`CLAUDE.md` §24). A partir de 2026, os layouts fiscais passam a incluir informações da reforma tributária (IBS/CBS); o modelo deve acomodar esses campos sem reescrita, mas o conteúdo e a obrigatoriedade deles não são definidos por este documento.

---

# 10. Relacionamentos

```text
Tenant
  └── Produto (1:N)
        ├── StockBalance (1:1, quando trackStock)      — Estoque
        ├── StockMovement (1:N)                        — Estoque
        ├── QuoteItem (1:N, itemType = PRODUCT)        — Orçamentos
        ├── WorkOrderItem (1:N, itemType = PRODUCT)    — Ordens de Serviço
        ├── FiscalProfile (N:1, opcional)              — Fiscal
        └── Fornecedor preferencial (N:1, PENDENTE)    — Fornecedores
```

---

# 11. Validações

- `code`: 1–30 caracteres, letras, números, `-`, `_` e `.`; único no tenant (sem diferenciar maiúsculas);
- `name`: 2–160 caracteres após remover espaços nas pontas;
- `salePrice`, `costPrice`: ≥ 0, máximo 2 casas decimais, até 9.999.999,99;
- `minStock`: ≥ 0, respeitando a regra de fração da unidade (seção 4.1);
- `ncm`: exatamente 8 dígitos numéricos, quando informado;
- `cest`: exatamente 7 dígitos numéricos, quando informado;
- `gtin`: 8, 12, 13 ou 14 dígitos com dígito verificador válido, quando informado;
- `origin`: um dos valores `0` a `8`, quando informado;
- `cfopOverride`: 4 dígitos; `icmsCstOverride`: 2 dígitos; `icmsCsosnOverride`: 3 dígitos;
- campos não listados neste documento são rejeitados na API (whitelist, `CLAUDE.md` Segurança).

---

# 12. Permissões

```text
products.read
products.create
products.update
products.deactivate
products.view_cost
products.manage_prices
products.manage_fiscal
```

- `products.manage_prices`: alterar `salePrice` e `costPrice`;
- `products.manage_fiscal`: alterar qualquer campo da seção 9;
- a matriz perfil × permissão é proposta em `docs/architecture/autorizacao.md` e permanece **PENDENTE de aprovação**.

---

# 13. Auditoria

```text
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_PRICE_CHANGED        (valor anterior e novo)
PRODUCT_FISCAL_CHANGED       (campos alterados)
PRODUCT_DEACTIVATED
PRODUCT_REACTIVATED
```

Cada evento registra `tenantId`, `userId`, `requestId`, data/hora e os campos alterados (antes/depois), conforme `docs/architecture/seguranca.md` §8.

---

# 14. Filtros da Listagem

- busca por `code`, `name`, `gtin` ou `manufacturerCode`;
- filtro por `status`;
- filtro por `category` e `brand`;
- filtro "estoque baixo" (saldo disponível ≤ `minStock`) — depende do módulo de Estoque;
- listagem paginada (padrão 20, máximo 100 por página).

---

# 15. Exclusão

Exclusão física só é permitida para produto que **nunca** foi usado em orçamento, OS, movimentação de estoque, compra ou documento fiscal. Em qualquer outro caso, "remover" significa inativar (`INACTIVE`).

---

# 16. Multi-Tenant

Todo produto pertence a exatamente um tenant. `code` e `gtin` são únicos dentro do tenant, nunca globalmente. Toda consulta, inclusive a busca usada para lançar itens em OS/orçamento, é escopada pelo `tenantId` da sessão (`docs/architecture/multi-tenant.md`).

---

# 17. Fora de Escopo (registrado para backlog)

- compatibilidade produto × veículo (aplicação por marca/modelo/ano);
- kits/composições (ex.: "kit troca de óleo" = óleo + filtro);
- múltiplos depósitos e localizações;
- fotos de produto;
- tabelas de preço por cliente ou por convênio;
- conversão de unidade comercial × tributável.
