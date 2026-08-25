# Backend — Fase 15: Integrações (Fiscal, WhatsApp, IA)

## 1. Objetivo

Implementar as integrações externas do AutoForge (Fiscal, WhatsApp, IA), conforme `docs/integrations/fiscal.md`, `docs/modules/fiscal.md`, `docs/modules/whatsapp.md` e `docs/modules/ia.md`.

## 2. Escopo — DOCUMENTAÇÃO INSUFICIENTE — NÃO IMPLEMENTAR

Nenhum dos quatro documentos relacionados define o suficiente para implementação:

- `docs/integrations/fiscal.md` (45 linhas) define apenas o princípio arquitetural (`AutoForge → Fiscal → Fiscal Integration Layer → Fiscal Provider`), sem nomear um provedor real, sem contrato de API, sem credenciais/variáveis de ambiente;
- `docs/modules/fiscal.md` (66 linhas) define apenas objetivo e o princípio de desacoplamento — sem campos de documento fiscal, sem regras;
- `docs/modules/whatsapp.md` (39 linhas) define apenas objetivo e fluxo conceitual (`ERP/CRM → Notification Service → WhatsApp Service → Provider Adapter → WhatsApp → Cliente`), sem provedor nomeado, sem contrato;
- `docs/modules/ia.md` (50 linhas) define apenas objetivo e uma lista de tópicos a especificar no futuro (a própria estrutura do documento lista "API conceitual", "Segurança", "Critérios de aceitação" como itens ainda a preencher, não como conteúdo já definido).

## 3. Arquivos esperados

Não determinável nesta rodada.

## 4. Dependências da fase

Módulos de negócio que alimentariam essas integrações (Orçamentos, OS, Financeiro — todos bloqueados nas fases 11–14).

## 5. O que NÃO deve ser implementado

Nada — nenhuma dessas três integrações tem provedor, contrato ou credencial documentado. Implementar qualquer parte seria inventar requisito técnico e de negócio.

## 6. Critérios de conclusão

Não aplicável nesta rodada.

## 7. Testes obrigatórios

Não aplicável nesta rodada.

## 8. Possíveis riscos

Nenhum — não há trabalho a iniciar nesta fase.

## 9. Documentos de referência

`docs/integrations/fiscal.md`, `docs/modules/fiscal.md`, `docs/modules/whatsapp.md`, `docs/modules/ia.md` (todos insuficientes).

## 10. Condições para avançar

**Bloqueado.** Depende de cada um dos quatro documentos ser completado com provedor, contrato de integração e regras de negócio aprovadas.
