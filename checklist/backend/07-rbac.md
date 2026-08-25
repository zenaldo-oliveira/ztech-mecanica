# Backend — Fase 07: RBAC

## 1. Objetivo

Implementar a estrutura técnica de verificação de permissão (enforcement), conforme `docs/architecture/autorizacao.md` — sem atribuir nenhuma permissão real ainda.

## 2. Escopo — DOCUMENTAÇÃO INSUFICIENTE

**NÃO IMPLEMENTAR a matriz de permissões nem decidir a cardinalidade Usuário↔Perfil.**

`docs/architecture/autorizacao.md` §9 registra que:

- a cardinalidade Usuário↔Perfil (1:1 ou 1:N) não está definida em nenhum documento;
- a matriz perfil×permissão não está preenchida — nem mesmo para Clientes, o único módulo com permissões catalogadas (`docs/architecture/autorizacao.md` §5).

Sem isso, não é possível implementar uma verificação de permissão real. O escopo desta fase é apenas o mecanismo técnico — o "encaixe" (guard/hook) onde a verificação vai ocorrer — sem nenhuma regra concreta associada.

## 3. Arquivos esperados

Guard/hook de autorização (estrutura genérica, sem regras concretas).

## 4. Dependências da fase

05-auth (o perfil do usuário precisa ser resolvível pela sessão — o que também esbarra na pendência de documentação de Usuário registrada na fase 05).

## 5. O que NÃO deve ser implementado

- Qualquer atribuição concreta de permissão a perfil;
- verificação de permissão em rota de módulo de negócio real (nenhum módulo de negócio existe ainda nesta fase).

## 6. Critérios de conclusão

O mecanismo técnico existe, mas nenhuma regra de negócio real está codificada nele — não há "conclusão" de negócio possível nesta fase, apenas de infraestrutura.

## 7. Testes obrigatórios

Teste do mecanismo genérico usando dados fictícios (ex.: um usuário simulado sem a permissão X é bloqueado; um usuário simulado com a permissão X passa) — não a matriz real, que ainda não existe.

## 8. Possíveis riscos

**PENDÊNCIA BLOQUEANTE (dupla):** cardinalidade Usuário↔Perfil e preenchimento da matriz de permissões (`docs/architecture/autorizacao.md` §9). Esta fase não pode ser considerada funcionalmente concluída para uso em produção enquanto isso não for decidido — apenas a infraestrutura pode avançar.

## 9. Documentos de referência

- `docs/architecture/autorizacao.md`

## 10. Condições para avançar

Mecanismo técnico implementado e testado com dados fictícios. O avanço para módulos de negócio com autorização real depende da matriz ser preenchida — cada fase de módulo (09 em diante) deve registrar novamente essa mesma pendência enquanto ela não for resolvida.
