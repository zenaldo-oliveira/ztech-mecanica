# AutoForge ERP — Instruções de Engenharia

## 1. Identidade do Projeto

**Nome:** AutoForge ERP

**Descrição:**
Sistema SaaS de gestão para oficinas de veículos, incluindo oficinas de carros, motos, utilitários e oficinas multimarca.

**Proposta central:**

> Gestão completa da oficina, do orçamento ao financeiro, com CRM, manutenção preventiva, automação e inteligência artificial.

O AutoForge deve permitir que uma oficina controle sua operação e, ao mesmo tempo, aumente a recorrência dos clientes por meio de lembretes e automações.

---

# 2. Objetivo do Sistema

O AutoForge deve centralizar:

* clientes;
* veículos;
* serviços;
* peças;
* estoque;
* fornecedores;
* orçamentos;
* ordens de serviço;
* mão de obra;
* financeiro;
* CRM;
* manutenção preventiva;
* comunicação com clientes;
* relatórios;
* inteligência artificial;
* informações fiscais e integrações.

O sistema deve ser simples o suficiente para uma pequena oficina e estruturado para crescer junto com empresas maiores.

---

# 3. Público-Alvo

O produto será direcionado principalmente para:

* oficinas mecânicas;
* oficinas de motos;
* oficinas multimarca;
* centros automotivos;
* oficinas especializadas;
* pequenos negócios automotivos.

O sistema não deve assumir que todos os estabelecimentos trabalham da mesma maneira.

Serviços, categorias, veículos, peças e regras operacionais devem ser configuráveis quando necessário.

---

# 4. Princípio Arquitetural Fundamental

O AutoForge será desenvolvido como um **SaaS multi-tenant**.

Cada empresa possui seus próprios:

* usuários;
* clientes;
* veículos;
* serviços;
* produtos;
* fornecedores;
* orçamentos;
* ordens de serviço;
* movimentações de estoque;
* registros financeiros;
* configurações.

Um usuário de uma empresa **nunca pode acessar dados pertencentes a outra empresa**.

O isolamento entre tenants é requisito crítico de segurança.

---

# 5. Regras de Desenvolvimento

## 5.1 Não implementar escopo não aprovado

Não criar funcionalidades apenas porque parecem úteis.

Se surgir uma ideia nova:

1. registrar como sugestão/backlog;
2. avaliar impacto;
3. documentar;
4. solicitar aprovação;
5. somente depois implementar.

Não expandir o escopo automaticamente.

---

## 5.2 Não refatorar sem necessidade

Não realizar refatorações amplas durante a implementação de uma funcionalidade se elas não forem necessárias para cumprir o requisito.

Se uma refatoração estrutural for necessária:

1. explicar o motivo;
2. identificar arquivos afetados;
3. avaliar riscos;
4. registrar a decisão;
5. implementar de forma controlada.

---

## 5.3 Analisar antes de alterar

Antes de modificar código existente:

* localizar os arquivos envolvidos;
* entender o fluxo atual;
* identificar dependências;
* verificar testes existentes;
* avaliar impacto;
* só então alterar.

Não assumir que um arquivo funciona de determinada maneira sem verificar.

---

# 6. Regra de Fonte da Verdade

A documentação do projeto é a fonte de verdade.

Prioridade:

```text
Requisitos aprovados
        ↓
Documentação
        ↓
Arquitetura
        ↓
Código
        ↓
Testes
```

Se o código estiver diferente da documentação, investigar a divergência.

Não alterar a documentação simplesmente para justificar um comportamento incorreto do código.

---

# 7. Processo Obrigatório para Funcionalidades

Toda funcionalidade deve seguir:

```text
Requisito
   ↓
Análise
   ↓
Documentação
   ↓
Checklist
   ↓
Implementação
   ↓
Teste
   ↓
Validação
   ↓
Conclusão
```

Uma tarefa não deve ser considerada concluída apenas porque o código foi escrito.

---

# 8. Critérios de Conclusão

Uma funcionalidade somente poderá ser marcada como concluída quando:

* implementação estiver realizada;
* fluxo principal funcionar;
* casos de erro forem avaliados;
* permissões forem verificadas;
* persistência dos dados estiver correta;
* integração com módulos relacionados estiver funcionando;
* testes relevantes tiverem sido executados;
* não houver regressão conhecida.

---

# 9. Arquitetura

Stack inicialmente definida:

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Node.js
* Fastify

### Banco

* PostgreSQL

### ORM

* Prisma

### Validação

* Zod

### Estrutura de Apps

`apps/frontend` e `apps/backend` são aplicações separadas e independentes, sem workspace pnpm unificado na raiz, sem Turborepo e sem pacotes compartilhados (`packages/*`). Essa é uma decisão explícita — não um estado transitório — registrada em `docs/decisions/ADR-001-stack.md` (decisão 8) e detalhada em `docs/architecture/arquitetura.md` §3.

### Testes

* Vitest
* Playwright

### IA

* OpenAI API

A stack poderá mudar somente mediante decisão técnica documentada.

---

# 10. Estrutura do Projeto

```text
ztech-mecanica/
│
├── apps/
│   ├── frontend/
│   └── backend/
│
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── modules/
│   ├── database/
│   ├── integrations/
│   └── decisions/
│
├── checklist/
├── scripts/
│
├── CLAUDE.md
├── README.md
├── .env.example
└── .gitignore
```

Não há diretório `packages/` nesta fase — ver decisão registrada em `docs/decisions/ADR-001-stack.md` (decisão 8).

---

# 11. Banco de Dados

O banco deverá ser projetado considerando:

* multi-tenancy;
* integridade referencial;
* índices;
* auditoria;
* histórico;
* soft delete quando aplicável;
* timestamps;
* relacionamentos explícitos;
* consistência transacional.

Não criar tabelas ou campos sem entender sua finalidade.

Antes de alterar o schema:

1. analisar relações existentes;
2. verificar migrations;
3. verificar impacto;
4. criar migration apropriada;
5. executar testes.

Nunca modificar dados de produção diretamente.

---

# 12. Multi-Tenant

Toda entidade pertencente a uma empresa deve estar vinculada ao tenant correto.

Exemplo conceitual:

```text
Company
   │
   ├── User
   ├── Customer
   ├── Vehicle
   ├── Product
   ├── ServiceOrder
   ├── Quote
   └── FinancialTransaction
```

Nunca confiar somente no frontend para isolamento.

A autorização deve ser validada no backend.

---

# 13. Autenticação e Autorização

O sistema deverá possuir:

* autenticação segura;
* controle de sessão;
* autorização;
* permissões;
* proteção de rotas;
* proteção de APIs;
* recuperação de senha;
* controle de acesso por empresa.

Possíveis perfis:

* proprietário;
* administrador;
* gerente;
* atendente;
* mecânico;
* financeiro.

As permissões devem ser documentadas antes da implementação.

---

# 14. Segurança

Nunca:

* expor secrets no frontend;
* armazenar API keys no código;
* confiar somente em validação do cliente;
* permitir acesso sem autorização;
* retornar dados de outro tenant;
* registrar senhas em logs;
* retornar informações sensíveis desnecessariamente.

Variáveis sensíveis devem utilizar ambiente seguro.

---

# 15. API

A API deve:

* validar entrada;
* autenticar requisições;
* autorizar acesso;
* validar tenant;
* retornar erros consistentes;
* utilizar códigos HTTP apropriados;
* evitar exposição de informações internas;
* manter contratos previsíveis.

Entrada externa deve ser considerada não confiável.

---

# 16. Frontend

O frontend deve priorizar:

* clareza;
* velocidade;
* responsividade;
* acessibilidade;
* consistência visual;
* estados de loading;
* estados vazios;
* tratamento de erro;
* feedback das ações.

Não criar interfaces excessivamente complexas quando uma solução simples resolver o problema.

---

# 17. Orçamentos

O orçamento deve permitir:

* cliente;
* veículo;
* serviços;
* peças;
* mão de obra;
* descontos;
* observações;
* validade;
* status;
* aprovação;
* rejeição;
* conversão para ordem de serviço.

Fluxo esperado:

```text
Cliente
   ↓
Veículo
   ↓
Orçamento
   ↓
Aprovação
   ↓
Ordem de Serviço
```

---

# 18. Ordem de Serviço

Uma OS deve manter:

* cliente;
* veículo;
* quilometragem;
* diagnóstico;
* serviços;
* peças;
* mão de obra;
* responsável;
* status;
* observações;
* valores;
* histórico.

Ao finalizar uma OS, o sistema poderá gerar eventos para:

* financeiro;
* estoque;
* histórico do veículo;
* manutenção preventiva;
* CRM.

Essas integrações devem ser implementadas de forma controlada e documentada.

---

# 19. Estoque

O estoque deverá controlar:

* produtos;
* categorias;
* fornecedores;
* custo;
* preço;
* quantidade;
* estoque mínimo;
* entradas;
* saídas;
* ajustes;
* movimentações.

Toda movimentação importante deve possuir rastreabilidade.

Não alterar quantidade de estoque sem registrar a origem da movimentação.

---

# 20. Financeiro

O financeiro deverá permitir:

* receitas;
* despesas;
* contas a receber;
* contas a pagar;
* caixa;
* formas de pagamento;
* parcelamentos;
* fluxo de caixa;
* faturamento;
* relatórios.

O financeiro deve ser separado conceitualmente do estoque e da OS, mas possuir integrações bem definidas.

---

# 21. CRM e Manutenção Preventiva

O sistema deverá manter histórico do cliente e do veículo.

Exemplos:

* última troca de óleo;
* última revisão;
* quilometragem;
* serviços realizados;
* peças utilizadas;
* próxima manutenção estimada.

O sistema poderá gerar lembretes automáticos.

Fluxo:

```text
OS finalizada
     ↓
Atualiza histórico
     ↓
Calcula próxima manutenção
     ↓
Agenda lembrete
     ↓
CRM identifica cliente
     ↓
Comunicação
```

---

# 22. WhatsApp

Integrações com WhatsApp devem ser desacopladas do núcleo do sistema.

O sistema deverá permitir futuramente:

* envio de orçamento;
* aprovação;
* lembrete de manutenção;
* confirmação de agendamento;
* comunicação com cliente.

Não assumir uma API específica sem documentar a integração escolhida.

---

# 23. Inteligência Artificial

A IA será um recurso auxiliar.

Ela poderá:

* analisar informações;
* responder perguntas;
* gerar sugestões;
* resumir dados;
* auxiliar na criação de orçamento;
* analisar estoque;
* analisar indicadores;
* auxiliar no relacionamento com clientes.

A IA não deve executar operações críticas automaticamente sem autorização.

Operações como:

* excluir dados;
* alterar valores;
* cancelar registros;
* movimentar dinheiro;
* emitir documentos;
* alterar configurações críticas;

devem possuir confirmação ou regras explícitas.

---

# 24. Fiscal

O módulo fiscal deve ser desenvolvido com cautela.

O sistema poderá organizar informações e integrar serviços fiscais, mas não deve assumir responsabilidade contábil ou tributária sem validação técnica.

Regras fiscais devem ser:

* documentadas;
* versionadas;
* verificadas conforme legislação vigente;
* desacopladas do núcleo operacional.

Não implementar regras fiscais com base em suposições.

---

# 25. Planos e Assinatura

Modelo comercial inicial:

### Essencial

**R$ 49,90/mês**

### Profissional

**R$ 89,90/mês**

### Premium

**R$ 149,90/mês**

Oferta inicial:

**Plano fundador por R$ 49,90/mês durante período promocional definido.**

Os limites e recursos de cada plano deverão ser documentados antes da implementação de billing.

---

# 26. Observabilidade

O sistema deverá possuir mecanismos para identificar:

* erros;
* falhas de API;
* falhas de autenticação;
* problemas de integração;
* operações críticas;
* eventos importantes.

Logs não devem conter:

* senhas;
* tokens;
* secrets;
* informações sensíveis desnecessárias.

---

# 27. Git

Commits devem ser pequenos e relacionados a uma tarefa.

Evitar commits genéricos como:

```text
update
fix
changes
teste
coisas
```

Preferir mensagens claras:

```text
feat: adiciona cadastro de veículos
fix: corrige cálculo do total do orçamento
test: adiciona testes de criação de OS
docs: atualiza regras de estoque
```

Não apagar histórico do Git sem autorização.

---

# 28. Testes

Sempre considerar:

### Unitários

Regras de negócio.

### Integração

API + banco + serviços.

### E2E

Fluxos completos.

Exemplo:

```text
Criar cliente
    ↓
Cadastrar veículo
    ↓
Criar orçamento
    ↓
Aprovar orçamento
    ↓
Criar OS
    ↓
Adicionar peça
    ↓
Baixar estoque
    ↓
Finalizar OS
    ↓
Registrar financeiro
```

Esse fluxo deverá possuir testes antes de ser considerado estável.

---

# 29. Tratamento de Erros

Erros devem:

* ser previsíveis;
* possuir mensagens úteis;
* não expor informações internas;
* ser registrados adequadamente;
* possuir tratamento no frontend.

Nunca esconder silenciosamente erros importantes.

---

# 30. Performance

Antes de otimizar:

1. medir;
2. identificar gargalo;
3. confirmar impacto;
4. aplicar solução;
5. medir novamente.

Não adicionar complexidade prematuramente.

---

# 31. Backlog

Ideias futuras não devem ser implementadas automaticamente.

Registrar em backlog:

```text
IDEIA
↓
DESCRIÇÃO
↓
MOTIVO
↓
IMPACTO
↓
PRIORIDADE
↓
APROVAÇÃO
```

---

# 32. Regra contra mudanças destrutivas

Antes de:

* apagar arquivos;
* remover tabelas;
* alterar migrations existentes;
* remover funcionalidades;
* trocar dependências fundamentais;
* alterar arquitetura;

é obrigatório analisar impacto.

Se houver risco de perda de dados, parar e solicitar confirmação.

---

# 33. Regra de análise do código

Antes de alterar um módulo existente:

```text
1. Localizar arquivos
2. Ler implementação
3. Identificar dependências
4. Identificar contratos
5. Verificar testes
6. Avaliar impacto
7. Planejar alteração
8. Implementar
9. Testar
10. Validar
```

Não modificar código baseado apenas no nome do arquivo.

---

# 34. Comunicação durante o desenvolvimento

Antes de implementar uma tarefa complexa, apresentar:

### Objetivo

O que será feito.

### Arquivos afetados

Quais arquivos serão alterados.

### Estratégia

Como será implementado.

### Riscos

O que pode ser afetado.

### Testes

Como será validado.

Depois da implementação:

### Resultado

O que foi alterado.

### Testes realizados

O que foi testado.

### Pendências

O que ainda precisa ser feito.

---

# 35. Regra Final

O Claude deve agir como um **engenheiro de software responsável pelo projeto**, e não como um gerador indiscriminado de código.

Prioridades:

```text
Correção
   ↓
Segurança
   ↓
Integridade dos dados
   ↓
Manutenibilidade
   ↓
Testabilidade
   ↓
Performance
   ↓
Experiência do usuário
```

Nunca sacrificar segurança ou integridade dos dados para implementar uma funcionalidade rapidamente.

**Não implementar funcionalidades fora do escopo aprovado.**

**Não assumir requisitos que não foram definidos.**

**Não marcar uma tarefa como concluída sem validação.**
