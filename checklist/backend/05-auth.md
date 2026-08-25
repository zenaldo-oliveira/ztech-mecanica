# Backend — Fase 05: Autenticação

## 1. Objetivo

Implementar autenticação por sessão server-side (criação, validação, expiração e revogação de sessão), conforme `docs/architecture/autenticacao.md`.

## 2. Escopo

- Mecanismo de sessão: criação, validação a cada requisição, expiração deslizante (12h de inatividade), teto absoluto (7 dias), revogação (`docs/architecture/autenticacao.md` §4, §4.5);
- hash e verificação de senha com Argon2id (`docs/architecture/autenticacao.md` §4.3);
- emissão do cookie de sessão (HttpOnly, Secure — `docs/architecture/autenticacao.md` §4).

## 3. Arquivos esperados

- Rotas de autenticação (ex.: login/logout — nomenclatura de exemplo, não uma definição fechada);
- serviço de autenticação;
- integração com o modelo `Session` (fase 03).

## 4. O que NÃO deve ser implementado — DOCUMENTAÇÃO INSUFICIENTE

**NÃO IMPLEMENTAR o fluxo completo de login por credencial de Usuário.**

Como registrado na fase 03, não há documentação de campos do Usuário (identificador de login, e-mail, etc.). O endpoint de login não pode ser implementado por completo sem saber contra qual campo a credencial é validada.

Esta fase fica **parcialmente bloqueada**: o mecanismo de sessão em si (criar/validar/expirar/revogar uma `Session` já vinculada a um `userId` fornecido diretamente, sem passar por um formulário de login real) pode ser implementado e testado de forma isolada; o endpoint de login por credencial de usuário depende da documentação de Usuário existir.

Também não implementar nesta fase:
- MFA — decisão futura, não implementada (`docs/architecture/autenticacao.md` §5.1);
- recuperação de senha — fluxo não definido (`docs/architecture/autenticacao.md` §5.2);
- RBAC/permissões (fase 07);
- qualquer regra de negócio de módulo.

## 5. Dependências da fase

03-prisma (modelo `Session`), 04-seguranca (rate limiting por IP em rotas pré-autenticação).

## 6. Critérios de conclusão (parciais, dado o bloqueio da seção 4)

Mecanismo de sessão completo (criar, validar, expirar por inatividade/teto absoluto, revogar) funcional e testado; hash/verificação Argon2id funcional.

## 7. Testes obrigatórios

- Criação de sessão;
- validação de sessão válida, expirada e revogada;
- expiração deslizante (renovação a cada requisição) e teto absoluto;
- hash e verificação de senha com Argon2id.

## 8. Possíveis riscos

**PENDÊNCIA BLOQUEANTE:** `SameSite` final do cookie não definido (`docs/architecture/autenticacao.md` §5.3) — ambiente de desenvolvimento pode usar `Lax`/`localhost` sem prejuízo; a configuração de produção fica bloqueada até a topologia de domínio ser definida.

**DOCUMENTAÇÃO INSUFICIENTE:** campos do Usuário — ver seção 4.

## 9. Documentos de referência

- `docs/architecture/autenticacao.md`
- `docs/decisions/ADR-001-stack.md`

## 10. Condições para avançar

Mecanismo de sessão completo e testado. O login real por credencial de usuário só é concluído após a documentação de Usuário existir — essa pendência deve ser levada explicitamente para as fases 06 e 07, que dependem de um usuário autenticado real.
