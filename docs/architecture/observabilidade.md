# AutoForge ERP — Estratégia de Observabilidade (Backend)

## 1. Objetivo

Este documento define a estratégia de logging estruturado e rastreabilidade de requisições do backend do AutoForge ERP (`docs/decisions/ADR-001-stack.md`, decisão 12).

---

# 2. Logging Estruturado

Todo log do backend é estruturado (JSON), não texto livre, para permitir busca e correlação.

Campos padrão esperados em todo log de requisição:

|Campo|Descrição|
|-|-|
|`timestamp`|Momento do evento|
|`level`|Severidade (`info`, `warn`, `error`, etc.)|
|`requestId`|Identificador único da requisição (ver seção 3)|
|`tenantId`|Tenant da requisição, quando autenticada|
|`userId`|Usuário da requisição, quando autenticado|
|`module`|Módulo/rota de origem do log|
|`message`|Mensagem do evento|

**Decisão:** logger nativo do Fastify (Pino), já que Fastify foi escolhido como framework HTTP (`docs/decisions/ADR-001-stack.md`). Pino já está integrado ao ciclo de vida de requisição do Fastify (`request.log`), gera JSON estruturado por padrão e permite request ID via a opção `genReqId` sem dependência adicional.

Formatação "pretty" (ex.: `pino-pretty`) é permitida apenas em ambiente de desenvolvimento — nunca em produção, pois quebra o formato JSON do qual a correlação de logs (seção 3) e a auditoria dependem.

---

# 3. Request ID

Toda requisição recebida pela API recebe um identificador único (`requestId`), gerado no início do processamento (ou propagado, se já enviado por um proxy/gateway confiável).

O `requestId` deve:

- aparecer em todos os logs gerados durante o processamento daquela requisição;
- ser incluído na resposta de erro ao cliente (`docs/architecture/seguranca.md`, seção Tratamento Centralizado de Erros), permitindo que um usuário reporte um problema referenciando um identificador rastreável nos logs;
- ser incluído no registro de auditoria, quando a requisição originar uma ação crítica (`docs/architecture/seguranca.md`, seção Auditoria de Ações Críticas).

---

# 4. Dados Sensíveis — Nunca Logados

Nunca devem aparecer em log, sob nenhuma circunstância:

- senhas, mesmo com hash;
- identificador/valor do cookie de sessão;
- segredos e chaves de API;
- dados fiscais sensíveis de clientes/fornecedores, além do necessário para diagnóstico.

Esta regra estende `CLAUDE.md` §26 e `docs/architecture/autenticacao.md`.

---

# 5. Correlação

`requestId` é o elo entre superfícies distintas do sistema:

```text
Log da requisição
      ↕
requestId
      ↕
Registro de auditoria (quando aplicável)
```

Isso permite, a partir de um erro reportado por um usuário ou de um evento de auditoria, reconstruir o que aconteceu durante aquela requisição específica.

---

# 6. Health Check

O backend deve expor um endpoint de verificação de saúde básico, para uso por orquestração/monitoramento externo. O formato e o nível de detalhe exposto são decisão de implementação, fora do escopo deste documento.

---

# 7. Fora de Escopo Nesta Rodada

- Ferramenta de agregação/coleta centralizada de logs (ex.: ELK, Datadog, etc.);
- tracing distribuído (APM);
- métricas de negócio/dashboards operacionais — distintos do módulo de Dashboard do produto (`docs/modules/`), que é uma funcionalidade voltada ao usuário final, não observabilidade de infraestrutura.
