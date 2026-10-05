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
- mão de obra;
- orçamentos;
- ordens de serviço;
- próximas manutenções.

O veículo será uma das principais entidades operacionais do AutoForge.

---

## 2. Conceito

Um veículo representa uma unidade física específica vinculada a um cliente.

O catálogo técnico representa as características de um modelo de veículo disponível no mercado.

Esses conceitos deverão permanecer separados.

```text
Catálogo Técnico
   ↓
Tipo
   ↓
Marca
   ↓
Modelo
   ↓
Versão
   ↓
Aplicação/Ano
```

**Decisão desta fase:** a normalização completa do Catálogo Técnico (tabelas próprias de marca/modelo, com seleção/autocomplete) fica para uma fase futura. Nesta fase, Marca, Modelo e Versão são registrados como campos de texto livre no cadastro do próprio veículo, sem um catálogo compartilhado por trás.

---

## 3. Tipo de Veículo

Enum: `CAR` | `MOTORCYCLE`

Corresponde diretamente ao suporte a carros e motos declarado no Objetivo (seção 1). Campo obrigatório.

---

## 4. Dados Cadastrais

|Campo|Obrigatório|Observação|
|-|-|-|
|Tipo|Sim|Enum `CAR` \| `MOTORCYCLE`|
|Marca|Sim|Texto livre nesta fase (ver seção 2)|
|Modelo|Sim|Texto livre nesta fase (ver seção 2)|
|Versão|Não|Texto livre nesta fase (ver seção 2)|
|Ano de fabricação|Não|Corresponde ao nível "Aplicação/Ano" do catálogo técnico|
|Ano do modelo|Não|Corresponde ao nível "Aplicação/Ano" do catálogo técnico|

---

## 5. Identificação

|Campo|Obrigatório|Observação|
|-|-|-|
|Placa|Sim|Única dentro do tenant|
|Chassi|Não|—|
|RENAVAM|Não|—|

Não há, nesta fase, um formato de identificador de negócio sequencial (equivalente ao `CLI-000001` de Clientes) definido para o veículo. Isso não significa que a entidade não possua um identificador técnico — apenas que nenhum formato de código de negócio foi documentado.

Portanto:

- **id**: identificador técnico da entidade, de uso interno/sistema, sem formato de negócio definido;
- **plate** (Placa): identificador de negócio, obrigatório, único dentro do tenant.

---

## 6. Quilometragem

O veículo registra a última quilometragem conhecida.

Esse valor é referenciado a partir da captura feita durante o atendimento de uma Ordem de Serviço (ver `docs/modules/ordens-servico.md`, que lista quilometragem entre as informações reunidas pela OS). A atualização automática desse campo a partir de uma OS concluída não é implementada nesta fase — o campo existe na documentação do veículo, mas seu preenchimento nesta fase é manual.

Campo opcional.

---

## 7. Relacionamentos

```text
Cliente
   └── Veículos (1:N)
```

Um cliente poderá possuir vários veículos (`docs/modules/clientes.md`, seção 10).

Relacionamentos adicionais do veículo — Orçamentos, Ordens de Serviço, Histórico, Serviços, Peças, Manutenções — são apenas conceituais nesta fase. Nenhum desses módulos é implementado a partir deste documento.

---

## 8. Status

Não definido nesta fase. O veículo não possui um campo de status. Por isso a exclusão é física (decisão V1, seção 12).

---

## 9. Filtros da Listagem

Filtros aprovados (decisão V5, seção 12):

- busca (`search`) por placa, marca ou modelo;
- cliente proprietário (`customerId`);
- tipo (`type`: `CAR` | `MOTORCYCLE`);
- paginação (padrão 20, máximo 100).

Nenhum outro filtro deverá ser criado sem que antes seja documentado aqui.

---

## 10. Multi-Tenant

```text
Tenant
   ↓
Cliente
   ↓
Veículo
```

Extensão direta da regra já documentada para Cliente (`docs/modules/clientes.md`, seção 16): um veículo pertence ao tenant do cliente ao qual está vinculado, e nunca poderá ser acessado, listado, editado ou exportado por outro tenant. Essa validação é responsabilidade do backend.

---

## 11. Lacunas registradas

Os itens abaixo foram avaliados e **não** incluídos nesta fase por falta de confirmação documental:

- Cor do veículo;
- Combustível;
- Status do veículo (ativo/inativo ou equivalente);
- Filtros de listagem além dos aprovados na seção 9;
- Identificador técnico sequencial (formato tipo `VEI-000001`).

Qualquer um desses poderá ser adicionado em uma revisão futura deste documento, mediante aprovação explícita.

As permissões de veículo **não são mais lacuna**: `vehicles.read`, `vehicles.create`, `vehicles.update` e
`vehicles.delete` fazem parte do catálogo aprovado (`docs/architecture/autorizacao.md` §5).

---

## 12. Decisões aprovadas (etapa 06A)

|#|Decisão|
|-|-|
|V1|**Exclusão física.** O veículo não tem status (seção 8). Quando orçamentos/OS referenciarem o veículo, a FK com `RESTRICT` impedirá a exclusão (resposta `409`).|
|V2|**Placa** normalizada em maiúsculas e sem hífen; aceita o padrão antigo `AAA9999` e o Mercosul `AAA9A99`. Obrigatória e única dentro do tenant.|
|V3|**Anos** inteiros. Ano de fabricação de 1900 até o ano atual + 1. **O ano do modelo só pode ser informado junto com o ano de fabricação** e deve ser igual a ele ou ao ano seguinte. Na atualização parcial, a regra vale para os valores finais (enviados + existentes).|
|V4|**Chassi** com 17 caracteres alfanuméricos em maiúsculas, sem `I`, `O` ou `Q`. **RENAVAM** com 11 dígitos, sem cálculo de dígito verificador e sem unicidade.|
|V5|**Filtros** da listagem conforme a seção 9.|
|V6|**Troca de proprietário** permitida somente para cliente do mesmo tenant, com auditoria própria.|
|V7|Cliente `INACTIVE` não recebe veículo nem pode ser definido como proprietário (`409`). Cliente `BLOCKED` pode receber veículo.|
|V8|**Auditoria:** `VEHICLE_CREATED`, `VEHICLE_UPDATED` (somente os nomes dos campos alterados), `VEHICLE_OWNER_CHANGED` (cliente anterior e novo) e `VEHICLE_DELETED`.|

Regras complementares aprovadas (revisão do 06A):

- **Quilometragem** (`lastMileage`, seção 6): qualquer inteiro ≥ 0, de preenchimento manual. Não há limite
  máximo de negócio; o único teto é técnico, o maior valor da coluna `INTEGER` (2.147.483.647), acima do
  qual a API responde `400`. A atualização automática a partir da OS não faz parte desta etapa.
- **Marca, modelo e versão:** texto livre com até **80 caracteres** cada (marca e modelo obrigatórios;
  versão opcional).

Garantias no banco: CHECKs de formato da placa, chassi e RENAVAM; anos ≥ 1900; ano do modelo entre o ano
de fabricação e o seguinte; ano do modelo exige ano de fabricação; quilometragem ≥ 0. O limite "ano atual
+ 1" é validado somente na aplicação (um CHECK dependente da data atual não seria imutável).

---

## 13. Decisões aprovadas para etapas futuras — ainda não implementadas

> Os itens abaixo são **decisões aprovadas pelo responsável do produto** para etapas posteriores. Os itens
> 4 a 10 **não são funcionalidades concluídas**: nenhum endpoint, provedor, interface, rate limit ou
> migração correspondente existe no sistema. Os itens 1 a 3 já foram aplicados ao cadastro manual nesta
> etapa (seção 12) e ficam registrados aqui para valer também no cadastro inteligente.

|#|Decisão|Situação|
|-|-|-|
|1|Ano do modelo informado exige ano de fabricação.|Já aplicada no 06A (seção 12, V3)|
|2|Quilometragem aceita qualquer inteiro maior ou igual a zero.|Já aplicada no 06A (seção 12)|
|3|Marca, modelo e versão aceitam até 80 caracteres.|Já aplicada no 06A (seção 12)|
|4|A ordenação de veículos pelo nome do cliente deverá usar collation ICU `pt-BR` na coluna do nome do cliente. A alteração da coluna em Clientes é uma atividade separada.|Futura — não implementada|
|5|A consulta de dados veiculares (cadastro inteligente) exigirá a permissão `vehicles.create`.|Futura — não implementada|
|6|O rate limit da consulta deverá usar uma solução compatível com múltiplas instâncias.|Futura — não implementada|
|7|Não haverá cache na primeira versão do cadastro inteligente.|Futura — não implementada|
|8|Chassi e RENAVAM só poderão ser preenchidos automaticamente quando os valores forem completos e válidos (regras V4).|Futura — não implementada|
|9|A auditoria da consulta não deverá registrar a placa em texto claro; usar hash se necessário.|Futura — não implementada|
|10|Com o provedor de consulta desabilitado, o botão de consulta deverá ficar oculto ou desabilitado, mantendo o cadastro manual disponível.|Futura — não implementada|
