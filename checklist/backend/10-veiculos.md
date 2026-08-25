# Backend — Fase 10: Veículos

## 1. Objetivo

Implementar o módulo de Veículos (cadastro, identificação, vínculo com Cliente), conforme `docs/modules/veiculos.md`.

## 2. Escopo

- Entidade Veículo: tipo `CAR`/`MOTORCYCLE` (§3), marca/modelo/versão como texto livre nesta fase (§2 — catálogo técnico normalizado adiado), ano de fabricação/modelo (§4), placa única por tenant, chassi, RENAVAM (§5), quilometragem de preenchimento manual (§6);
- vínculo 1:N com Cliente (§7, conforme `docs/modules/clientes.md` §10).

## 3. Arquivos esperados

- Schema Prisma do Veículo (com `tenantId` e `id` UUID v7);
- rotas `/api/v1/vehicles`;
- serviço de domínio;
- testes.

## 4. Dependências da fase

09-clientes (Veículo referencia Cliente), 06-multi-tenant, 08-api.

## 5. O que NÃO deve ser implementado

Já excluído explicitamente pela própria documentação do módulo (`docs/modules/veiculos.md` §11, "Lacunas registradas"):

- cor do veículo;
- combustível;
- status do veículo;
- filtros de listagem além de busca simples;
- permissões conceituais específicas de veículo;
- identificador de negócio sequencial (`VEI-000001`);
- catálogo técnico normalizado de marca/modelo (§2);
- atualização automática de quilometragem a partir de uma OS concluída (§6 — manual nesta fase).

## 6. Critérios de conclusão

CRUD funcional, placa única por tenant, vínculo obrigatório com Cliente existente do mesmo tenant.

## 7. Testes obrigatórios

- CRUD completo;
- unicidade de placa por tenant;
- isolamento de tenant;
- rejeição de vínculo com Cliente pertencente a outro tenant.

## 8. Possíveis riscos

Mesma ressalva da fase 09: autorização por perfil (RBAC) ainda não aplicável nesta fase.

## 9. Documentos de referência

- `docs/modules/veiculos.md`
- `docs/modules/clientes.md` §10

## 10. Condições para avançar

Módulo funcional e testado, estritamente dentro do escopo documentado — inclusive respeitando as exclusões já registradas pelo próprio módulo.
