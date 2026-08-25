# Backend — Fase 13: Estoque

## 1. Objetivo

Implementar o módulo de Estoque, conforme `docs/modules/estoque.md`.

## 2. Escopo — DOCUMENTAÇÃO INSUFICIENTE — NÃO IMPLEMENTAR

`docs/modules/estoque.md` (185 linhas) tem mais conteúdo conceitual que os demais módulos pendentes — inclui um enum de tipos de movimentação (`PURCHASE_ENTRY`, `SALE_EXIT`, `OS_CONSUMPTION`, `RETURN_ENTRY`, `SUPPLIER_RETURN`, `ADJUSTMENT_ENTRY`, `ADJUSTMENT_EXIT`, `TRANSFER_ENTRY`, `TRANSFER_EXIT`, `RESERVATION`, `RESERVATION_RELEASE`, `INVENTORY_ADJUSTMENT`) e uma fórmula de saldo disponível (`Disponível = Física − Reservada − Bloqueada`). Ainda assim, faltam elementos essenciais para implementação:

- tabela de campos obrigatórios/opcionais da entidade Produto/Estoque (o documento traz exemplos soltos, não uma especificação formal como em `docs/modules/clientes.md`);
- permissões conceituais;
- filtros de listagem;
- regras de exclusão;
- eventos de auditoria.

Além disso, o módulo depende de **Produtos** (`docs/modules/produtos.md`), que também é um documento-esqueleto (objetivo + exemplos, sem tabela de campos) e **não possui fase dedicada** nesta checklist — o escopo aprovado desta rodada (`checklist/backend/`) vai de 09-clientes a 14-financeiro sem um "09b-produtos". Essa é uma lacuna estrutural da própria checklist, registrada na revisão de consistência.

## 3. Arquivos esperados

Não determinável nesta rodada.

## 4. Dependências da fase

Produtos (sem fase própria nesta checklist — pendência estrutural), Fornecedores e Compras (ambos com documentação-esqueleto, sem fase própria nesta checklist).

## 5. O que NÃO deve ser implementado

Nada — implementar qualquer parte deste módulo sem a documentação de campos/regras/permissões seria inventar requisito de negócio.

## 6. Critérios de conclusão

Não aplicável nesta rodada.

## 7. Testes obrigatórios

Não aplicável nesta rodada.

## 8. Possíveis riscos

O enum de movimentações e a fórmula de saldo já documentados são um bom ponto de partida técnico, mas não substituem a especificação formal de campos/regras — implementar a partir só disso arriscaria fixar um schema incompleto.

## 9. Documentos de referência

`docs/modules/estoque.md` (parcial/insuficiente), `docs/modules/produtos.md` (insuficiente), `docs/modules/fornecedores.md` (insuficiente), `docs/modules/compras.md` (insuficiente).

## 10. Condições para avançar

**Bloqueado.** Depende de: (a) `docs/modules/estoque.md` ser completado com campos, permissões e filtros; (b) `docs/modules/produtos.md` ser completado; (c) uma decisão sobre incluir Produtos como fase própria desta checklist (ver revisão de consistência).
