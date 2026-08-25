# AutoForge ERP — Módulo de Clientes

## 1. Objetivo

O módulo de clientes será responsável pelo cadastro, organização, consulta, relacionamento e histórico dos clientes da oficina.

O módulo deverá atender oficinas de:

- carros;
- motos;
- carros e motos.

O cadastro de clientes deverá servir como base para:

- veículos;
- orçamentos;
- ordens de serviço;
- financeiro;
- CRM;
- manutenção preventiva;
- WhatsApp;
- notificações;
- faturamento;
- histórico de atendimento.

---

## 2. Conceito

Um cliente representa uma pessoa física ou jurídica que possui relacionamento comercial com a oficina.

O cliente poderá possuir:

```text
Cliente
├── Dados cadastrais
├── Identificação
├── Documentos
├── Contatos
├── Endereço
├── Status
├── Preferências de contato
├── Veículos
├── Orçamentos
├── Ordens de Serviço
├── Histórico
├── Financeiro
├── CRM
└── Manutenções
```

---

## 3. Identificação

O cliente deverá possuir um identificador interno técnico, único dentro do tenant.

Formato conceitual:

```text
CLI-000001
CLI-000002
CLI-000003
```

Regras:

- o identificador é gerado pelo sistema, sequencial dentro do tenant;
- o identificador nunca poderá se repetir dentro do mesmo tenant;
- o identificador não é compartilhado entre tenants (dois tenants podem ter, cada um, um `CLI-000001` próprio, sem conflito, pois pertencem a espaços isolados).

---

## 4. Dados Cadastrais

|Campo|Obrigatório|Aplicável a|Observação|
|-|-|-|-|
|Tipo de pessoa|Sim|Todos|Enum: `INDIVIDUAL` \| `BUSINESS`|
|Nome / Razão social|Sim|Todos|Nome completo para `INDIVIDUAL`; razão social para `BUSINESS`|
|Nome fantasia|Não|`BUSINESS`|Não se aplica a `INDIVIDUAL`|
|Status|Sim|Todos|Enum: `ACTIVE` \| `INACTIVE` \| `BLOCKED` — ver seção 8|

---

## 5. Documentos

|Campo|Obrigatório|Aplicável a|Observação|
|-|-|-|-|
|CPF|Sim|`INDIVIDUAL`|Não permitido quando tipo de pessoa for `BUSINESS`|
|CNPJ|Sim|`BUSINESS`|Não permitido quando tipo de pessoa for `INDIVIDUAL`|

Regra de consistência:

> O documento cadastrado deve ser compatível com o tipo de pessoa. Um cliente `INDIVIDUAL` não pode ser cadastrado com CNPJ, e um cliente `BUSINESS` não pode ser cadastrado com CPF.

Esta documentação não define regras de validação fiscal além da compatibilidade acima (por exemplo, verificação de dígito verificador junto a órgãos externos) — isso, se necessário, deverá ser objeto de uma decisão arquitetural própria antes de ser implementado.

---

## 6. Contatos

**Contato principal:**

|Campo|Obrigatório|Observação|
|-|-|-|
|Telefone|Sim|Contato principal do cliente|
|WhatsApp|Não|Pode ser igual ao telefone principal ou um número diferente|
|E-mail|Não|Contato principal por e-mail|

**Contato secundário:**

|Campo|Obrigatório|Observação|
|-|-|-|
|Telefone secundário|Não|—|
|E-mail secundário|Não|Aplicável quando o cliente possuir mais de um e-mail de contato (ex.: pessoa jurídica com contato financeiro separado)|

---

## 7. Endereço

|Campo|Obrigatório no cadastro inicial|
|-|-|
|CEP|Não|
|Logradouro|Não|
|Número|Não|
|Complemento|Não|
|Bairro|Não|
|Cidade|Não|
|UF|Não|

Todos os campos de endereço são opcionais no momento do cadastro inicial, para permitir um cadastro rápido pela oficina. A obrigatoriedade de endereço completo para operações futuras (ex.: emissão de nota fiscal) deverá ser definida na documentação do módulo Fiscal, não neste documento.

---

## 8. Status

Enum: `ACTIVE` | `INACTIVE` | `BLOCKED`

|Status|Significado|
|-|-|
|`ACTIVE`|Cliente ativo, disponível normalmente para novos atendimentos|
|`INACTIVE`|Cliente inativado — usado como mecanismo de exclusão lógica (ver seção 14). Não implica problema comercial, apenas que o cliente não está mais em uso corrente|
|`BLOCKED`|Cliente bloqueado — usado quando há um motivo ativo para impedir novos atendimentos (ex.: inadimplência). Distinto de `INACTIVE`: um cliente bloqueado pode voltar a `ACTIVE` quando o motivo do bloqueio for resolvido|

Valor padrão no cadastro: `ACTIVE`.

---

## 9. Preferências de Contato

Enum: `WHATSAPP` | `EMAIL` | `PHONE` | `NONE`

Campo obrigatório no cadastro, sem valor padrão predefinido nesta documentação — deve ser selecionado explicitamente.

### Bloqueio de comunicações de marketing

O cliente poderá solicitar o bloqueio de comunicações de marketing (distinto da preferência de contato acima, que define o canal preferido para comunicação operacional).

Quando solicitado, o sistema deverá registrar:

- data da solicitação;
- canal de origem da solicitação;
- situação (bloqueado / desbloqueado).

O CRM e o WhatsApp deverão respeitar essa informação futuramente — a aplicação real dessa regra depende dos módulos CRM e WhatsApp, que não fazem parte desta fase.

---

## 10. Relacionamentos

```text
Cliente
├── Veículos
├── Orçamentos
├── Ordens de Serviço
├── Histórico
├── Financeiro
├── CRM
└── Manutenções
```

Um cliente poderá possuir vários veículos.

Estes relacionamentos são registrados aqui apenas conceitualmente. A implementação de Veículos, Orçamentos, Ordens de Serviço, Financeiro, CRM e Manutenção Preventiva não faz parte do módulo de Clientes e deverá ser tratada em suas respectivas documentações.

---

## 11. Permissões

Permissões conceituais do módulo:

```text
customers.read
customers.create
customers.update
customers.delete
customers.export
customers.view_history
customers.manage_contacts
```

A autorização real (validação de permissões no backend, controle de acesso por perfil) não é definida neste documento e não será implementada no frontend nesta fase. A interface poderá se preparar estruturalmente para esse controle, sem simular segurança real.

---

## 12. Auditoria

Eventos conceituais que deverão ser registrados:

```text
CUSTOMER_CREATED
CUSTOMER_UPDATED
CUSTOMER_BLOCKED
CUSTOMER_UNBLOCKED
CUSTOMER_DEACTIVATED
CUSTOMER_MERGED
CUSTOMER_EXPORTED
```

Correspondência com o status (seção 8):

- `CUSTOMER_BLOCKED` / `CUSTOMER_UNBLOCKED` — transições de/para o status `BLOCKED`;
- `CUSTOMER_DEACTIVATED` — transição para o status `INACTIVE`;
- `CUSTOMER_MERGED` — resultado da mesclagem de duplicidade (ver seção 15).

A implementação real do registro de auditoria depende do backend e não faz parte desta fase.

---

## 13. Filtros da Listagem

A listagem de clientes deverá suportar inicialmente:

- pesquisa por nome / razão social;
- pesquisa por CPF/CNPJ;
- filtro por status (`ACTIVE` \| `INACTIVE` \| `BLOCKED`);
- filtro por tipo de pessoa (`INDIVIDUAL` \| `BUSINESS`).

Nenhum outro filtro deverá ser criado sem que antes seja documentado aqui.

---

## 14. Regras de Exclusão

A exclusão física de um cliente não deverá ser permitida quando o cliente possuir:

- veículos vinculados;
- orçamentos;
- ordens de serviço;
- histórico de atendimento;
- movimentações financeiras.

Nesses casos, a operação de "remover" um cliente deverá resultar em exclusão lógica — transição do status para `INACTIVE` (seção 8) — preservando o registro e seu histórico.

A definição de exclusão física (quando um cliente nunca teve nenhum relacionamento registrado) fica em aberto para decisão futura junto ao backend; não é definida por esta documentação.

Esta regra é conceitual. A validação efetiva deverá ocorrer no backend; o frontend não deverá presumir que pode apagar um cliente sem essa verificação.

---

## 15. Duplicidade

O sistema poderá permitir mesclar registros de clientes duplicados.

Conceito:

```text
Cliente A
+
Cliente B
   ↓
Cliente principal
```

A mesclagem gera o evento `CUSTOMER_MERGED` (seção 12).

A implementação do fluxo de mesclagem não faz parte da Fase 3 do frontend, a menos que seja explicitamente solicitada em uma fase futura.

---

## 16. Multi-Tenant

```text
Tenant
   ↓
Cliente
```

Todo cliente pertence a exatamente um tenant.

O identificador interno (seção 3) é único dentro do tenant, não globalmente.

Um cliente pertencente a um tenant nunca poderá ser acessado, listado, editado ou exportado por outro tenant. Essa validação é responsabilidade do backend; o frontend não deverá presumir isolamento apenas por não exibir dados de outros tenants na interface.
