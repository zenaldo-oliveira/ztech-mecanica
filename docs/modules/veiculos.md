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

Não definido nesta fase. O veículo não possui um campo de status.

---

## 9. Filtros da Listagem

Não definidos nesta fase. Nenhum filtro (por tipo, marca, modelo ou qualquer outro campo) deverá ser criado sem que antes seja documentado aqui.

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
- Filtros de listagem além de busca simples;
- Permissões conceituais específicas de veículo;
- Identificador técnico sequencial (formato tipo `VEI-000001`).

Qualquer um desses poderá ser adicionado em uma revisão futura deste documento, mediante aprovação explícita.
