# Backend — Fase 11: Orçamentos

## 1. Objetivo

Implementar o módulo de Orçamentos, conforme `docs/modules/orcamentos.md`.

## 2. Escopo — DOCUMENTAÇÃO INSUFICIENTE — NÃO IMPLEMENTAR

`docs/modules/orcamentos.md` contém apenas objetivo e um diagrama de fluxo (37 linhas). Faltam, no mínimo:

- campos do orçamento e seus tipos/obrigatoriedade;
- regras de cálculo (como descontos e acréscimos são aplicados sobre mão de obra, serviços, peças e produtos);
- enum de status do orçamento;
- regras de aprovação/rejeição pelo cliente;
- regras de conversão para Ordem de Serviço;
- permissões conceituais do módulo;
- eventos de auditoria;
- filtros de listagem.

Adicionalmente, Orçamentos depende de **Serviços** como linha de item, e `docs/modules/servicos.md` está com o conteúdo corrompido (contém uma cópia de `docs/modules/veiculos.md`, não uma especificação de Serviços) — problema identificado na auditoria inicial e ainda não corrigido, por decisão explícita de tratá-lo separadamente.

## 3. Arquivos esperados

Não determinável nesta rodada.

## 4. Dependências da fase

09-clientes, 10-veiculos (dependências conceituais, conforme o fluxo de `docs/modules/orcamentos.md`), além de uma especificação válida de Serviços (não existente).

## 5. O que NÃO deve ser implementado

Nada — implementar qualquer parte deste módulo sem a documentação acima seria inventar requisito de negócio, o que é proibido por instrução explícita.

## 6. Critérios de conclusão

Não aplicável nesta rodada.

## 7. Testes obrigatórios

Não aplicável nesta rodada.

## 8. Possíveis riscos

Avançar aqui sem aprovação de negócio arrisca retrabalho estrutural (schema, fluxo de aprovação, cálculo) quando a documentação real for definida.

## 9. Documentos de referência

- `docs/modules/orcamentos.md` (insuficiente)
- `docs/modules/servicos.md` (corrompido — ver observação acima)

## 10. Condições para avançar

**Bloqueado.** Depende de: (a) `docs/modules/orcamentos.md` ser completado com campos, regras de cálculo, status, aprovação e permissões, com aprovação de negócio; (b) `docs/modules/servicos.md` ser corrigido/especificado. Nenhuma implementação deve começar antes disso.
