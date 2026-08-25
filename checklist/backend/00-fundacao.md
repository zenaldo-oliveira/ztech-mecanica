# Backend — Fase 00: Fundação

## 1. Objetivo

Criar a estrutura básica do projeto `apps/backend` (Node.js + TypeScript), sem qualquer lógica de negócio, servidor HTTP funcional ou acesso a dados.

## 2. Escopo

- Estrutura de pastas por camada, conforme `docs/architecture/arquitetura.md` §4.3 (rota → handler → serviço de domínio → repositório);
- `package.json` do backend (scripts básicos: build, dev, test);
- `tsconfig.json`;
- `.gitignore` do backend.

A nomenclatura exata das pastas (ex.: `routes/` vs `controllers/`) é decisão de implementação, não fixada por nenhum documento de arquitetura — a única exigência é a separação de responsabilidades já registrada.

## 3. Arquivos esperados

- `apps/backend/package.json`
- `apps/backend/tsconfig.json`
- `apps/backend/.gitignore`
- `apps/backend/src/` (subpastas vazias correspondentes às camadas)
- `apps/backend/.env.example` (placeholder, sem segredo real)

## 4. Dependências da fase

Nenhuma — é o ponto de partida da implementação. Pressupõe apenas as decisões já registradas em `docs/decisions/ADR-001-stack.md`.

## 5. O que NÃO deve ser implementado

- Servidor Fastify em execução;
- qualquer rota;
- conexão com banco de dados;
- autenticação;
- lógica de negócio;
- testes de negócio.

## 6. Critérios de conclusão

- O projeto instala dependências sem erro;
- `tsc --noEmit` roda sem erro, mesmo com o projeto vazio.

## 7. Testes obrigatórios

Nenhum teste de negócio nesta fase. Um teste trivial de sanity do runner de testes é opcional, não obrigatório.

## 8. Possíveis riscos

Fixar uma estrutura de pastas rígida demais antes de conhecer as necessidades reais dos módulos. Mitigação: manter a estrutura mínima nesta fase e permitir refinamento nas fases seguintes.

## 9. Documentos de referência

- `docs/decisions/ADR-001-stack.md`
- `docs/architecture/arquitetura.md` §3 e §4.3

## 10. Condições para avançar

Estrutura criada e compilando. Nenhuma pendência bloqueante identificada para esta fase.
