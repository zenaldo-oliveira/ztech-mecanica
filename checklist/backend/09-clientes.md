# Backend — Fase 09: Clientes

## 1. Objetivo

Implementar o módulo de Clientes (cadastro, consulta, listagem, exclusão lógica), conforme `docs/modules/clientes.md`.

## 2. Escopo

- Entidade Cliente: identificador de negócio sequencial por tenant (`CLI-000001`, §3), dados cadastrais (§4), documentos CPF/CNPJ com validação de compatibilidade tipo×documento (§5), contatos (§6), endereço (§7, todos os campos opcionais no cadastro inicial), status `ACTIVE`/`INACTIVE`/`BLOCKED` (§8), preferência de contato (§9);
- endpoints de CRUD;
- filtros de listagem documentados (§13: nome/razão social, CPF/CNPJ, status, tipo de pessoa);
- regra de exclusão lógica (§14);
- eventos de auditoria (§12).

## 3. Arquivos esperados

- Schema Prisma do Cliente (com `tenantId` e `id` UUID v7);
- rotas `/api/v1/customers`;
- serviço de domínio;
- testes.

## 4. Dependências da fase

06-multi-tenant, 07-rbac (estrutura técnica, mesmo sem matriz preenchida), 08-api.

## 5. O que NÃO deve ser implementado

- Mesclagem de duplicidade (§15) — não faz parte desta fase, "a menos que seja explicitamente solicitada em uma fase futura" (texto do próprio módulo);
- qualquer campo ou filtro não listado nas seções 4–9 e 13 de `clientes.md` — "nenhum outro filtro deverá ser criado sem que antes seja documentado";
- vínculo com Veículos, Orçamentos, OS, Financeiro, CRM (§10) — cada um em sua própria fase;
- exclusão física de cliente sem vínculo (§14 deixa essa regra em aberto para decisão futura — não implementar sem essa definição).

## 6. Critérios de conclusão

CRUD completo funcional, respeitando isolamento de tenant, filtros documentados, exclusão lógica (transição para `INACTIVE`), geração do identificador `CLI-000001` sequencial e único por tenant.

## 7. Testes obrigatórios

- CRUD completo;
- isolamento de tenant (um tenant não vê/edita/exclui cliente de outro — `docs/architecture/testes.md` §3);
- geração e unicidade do identificador `CLI-000001` por tenant;
- regra de exclusão lógica (bloqueio de exclusão física quando há vínculo com veículo/orçamento/OS/histórico/financeiro);
- validação de compatibilidade documento×tipo de pessoa (§5).

## 8. Possíveis riscos

Autorização por perfil (RBAC) real ainda não existe (pendência da fase 07). Os endpoints devem estar preparados para o mecanismo de autorização, mas não podem aplicar uma regra de "quem pode fazer o quê" que ainda não foi aprovada — até lá, o acesso é apenas autenticado (qualquer usuário do tenant), não autorizado por perfil.

## 9. Documentos de referência

- `docs/modules/clientes.md`

## 10. Condições para avançar

Módulo funcional e testado, estritamente dentro do escopo documentado. Autorização por perfil real fica pendente até a matriz RBAC ser preenchida (fase 07).
