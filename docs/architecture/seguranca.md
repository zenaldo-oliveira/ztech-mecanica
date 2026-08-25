# AutoForge ERP — Arquitetura de Segurança

## 1. Objetivo

Este documento define os requisitos de segurança transversais do backend do AutoForge ERP — aplicáveis a todos os módulos, independentemente do domínio de negócio.

> Nota de correção: este arquivo continha, por engano, uma cópia do conteúdo de `docs/architecture/multi-tenant.md`. O conteúdo abaixo substitui integralmente essa versão e passa a ser a especificação real de segurança.

Segurança e isolamento de tenant são tratados como **requisitos transversais**: nenhum módulo de negócio é considerado completo sem atender a este documento (`docs/decisions/ADR-001-stack.md`, decisão 16).

---

# 2. Princípios

Herdados de `CLAUDE.md` §14 e `docs/architecture/autenticacao.md` §2:

- segurança por padrão;
- menor privilégio;
- nenhuma confiança exclusiva no frontend;
- validação sempre no backend;
- isolamento de tenant nunca opcional (`docs/architecture/multi-tenant.md`).

---

# 3. Transporte e Cookies

- Toda comunicação entre `apps/frontend` e `apps/backend` deve ocorrer via HTTPS em produção.
- O cookie de sessão segue as flags definidas em `docs/architecture/autenticacao.md` §4: `HttpOnly`, `Secure`, `SameSite` apropriado. Nenhum dado de autenticação é acessível via JavaScript no cliente.

---

# 4. CORS (Decisão)

A API (`/api/v1`, ver `docs/architecture/arquitetura.md`) restringe origens permitidas por uma **lista explícita, configurada por ambiente** (desenvolvimento/homologação/produção) via variável de ambiente — nunca wildcard (`*`), o que também é tecnicamente incompatível com o uso de cookies (`credentials: true`, ver seção 3). Origens fora da lista são rejeitadas.

Ambiente de desenvolvimento já tem origem conhecida: `http://localhost:3000` (`apps/frontend` atual).

**PENDÊNCIA BLOQUEANTE:** os domínios reais de homologação/produção não estão definidos em nenhum documento do AutoForge — não devem ser presumidos. Esta pendência bloqueia apenas a configuração de CORS desses ambientes específicos; o mecanismo em si e o ambiente de desenvolvimento não são afetados.

---

# 5. Rate Limiting (Decisão)

Todo endpoint da API está sujeito a rate limiting. Estratégia aprovada:

- **rotas pré-autenticação** (ex.: login) — limitadas por IP, superfície mais sensível a força bruta/credential stuffing;
- **rotas autenticadas** — limitadas por `userId` + `tenantId`, para que múltiplos usuários legítimos atrás do mesmo IP/rede (ex.: a própria rede da oficina) não sejam penalizados pelo uso de outros;
- **limites diferenciados por sensibilidade de rota** — mais restritivo em autenticação, intermediário em exportação de dados e escrita, mais permissivo em leitura geral.

**PENDÊNCIA BLOQUEANTE (apenas para calibração final de produção):** os valores numéricos exatos de cada limite (requisições por janela de tempo) são parâmetros que dependem do ambiente e do tráfego real observado — não devem ser presumidos como definitivos. Isso não bloqueia a implementação do mecanismo em si, que pode partir de valores iniciais conservadores; bloqueia apenas a calibração final de produção.

---

# 6. Tratamento Centralizado de Erros

O backend deve tratar erros de forma centralizada (um único ponto de tratamento, não tratamento ad-hoc por rota), com as seguintes regras:

- respostas de erro seguem um envelope de erro consistente entre todos os endpoints;
- mensagens de erro voltadas ao cliente nunca expõem detalhes internos (stack trace, query SQL, caminho de arquivo, nome de biblioteca interna);
- todo erro tratado é correlacionado ao `requestId` da requisição (`docs/architecture/observabilidade.md`, seção Request ID), permitindo localizar o erro completo nos logs a partir da resposta enviada ao cliente;
- erros de validação (Zod) são diferenciados de erros de regra de negócio, que são diferenciados de erros técnicos/infraestrutura — cada categoria mapeia para um código HTTP apropriado;
- nenhum erro crítico deve falhar silenciosamente (`CLAUDE.md` §29).

O formato exato do envelope de erro e o mapeamento completo de categorias de erro → código HTTP são detalhes de implementação, não definidos nesta rodada.

---

# 7. Validação de Entrada

Toda entrada externa (corpo de requisição, query string, parâmetros de rota, headers relevantes) é validada na borda da API com Zod (`docs/decisions/ADR-001-stack.md`), antes de alcançar qualquer regra de negócio. Nenhuma entrada é considerada confiável (`CLAUDE.md` §15).

---

# 8. Auditoria de Ações Críticas

Ações críticas devem gerar um registro de auditoria imutável (somente inserção), incluindo no mínimo:

|Campo|Descrição|
|-|-|
|`id`|Identificador técnico do evento (UUID)|
|`tenantId`|Tenant em que a ação ocorreu|
|`userId`|Usuário que executou a ação (quando aplicável — ações do sistema podem não ter usuário)|
|`action`|Identificador do evento, ex.: `CUSTOMER_BLOCKED` (padrão já usado em `docs/modules/clientes.md` §12)|
|`entityType` / `entityId`|Entidade afetada|
|`metadata`|Dados relevantes ao evento (sem informação sensível — ver seção 9)|
|`requestId`|Correlação com o log da requisição (`docs/architecture/observabilidade.md`)|
|`createdAt`|Timestamp do evento|

São consideradas ações críticas, no mínimo:

- eventos de autenticação (login, logout, falha de login, bloqueio de sessão);
- concessão, alteração ou revogação de perfil/permissão (`docs/architecture/autorizacao.md` §8);
- exclusão ou mudança de status de registros com histórico (ex.: `CUSTOMER_BLOCKED`, `CUSTOMER_DEACTIVATED`, `CUSTOMER_MERGED`);
- operações financeiras (quando o módulo Financeiro/Pagamentos for especificado).

O catálogo completo de eventos por módulo continua sendo definido em cada `docs/modules/*.md` — este documento define apenas a estrutura e a obrigatoriedade do mecanismo, não o catálogo completo de eventos de todos os módulos.

---

# 9. Gestão de Segredos

- Nenhum segredo (chave de API, string de conexão, segredo de assinatura de cookie) é armazenado em código-fonte;
- segredos são fornecidos via variáveis de ambiente;
- nenhum segredo, senha, token de sessão ou dado fiscal sensível é escrito em log (`docs/architecture/observabilidade.md`, seção Dados Sensíveis).

---

# 10. Isolamento de Tenant

O isolamento entre tenants (`docs/architecture/multi-tenant.md`) é tratado como requisito de segurança, não apenas de organização de dados — toda revisão de código que toca acesso a dados deve verificar explicitamente o escopo de tenant.

---

# 11. Fora de Escopo Nesta Rodada

- Cabeçalhos de segurança HTTP específicos (CSP, HSTS, etc.) — mecanismo a definir na implementação;
- ferramenta de verificação de dependências vulneráveis.
