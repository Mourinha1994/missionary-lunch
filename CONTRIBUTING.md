# Contribuindo para o Missionary Lunch

Este projeto segue o modelo de branching **Git Flow** e a convenção de mensagens de commit **Conventional Commits**.

---

## Modelo de branches

| Branch | Descrição |
|---|---|
| `main` | Produção. Apenas código estável e testado. |
| `develop` | Integração. É a **branch padrão** e de onde saem todas as features. |
| `feature/*` | Nova funcionalidade. Sempre criada a partir de `develop`. |
| `release/*` | Preparação de versão. Criada a partir de `develop` e mergeada em `main` e `develop`. |
| `hotfix/*` | Correção emergencial em produção. Criada a partir de `main` e mergeada em `main` e `develop`. |

```
main  ──●───────────────●───────────────●──
        \             / \             / 
develop ●─────────●───●───●─────────●───●──
         \       /         \       /
feature/  ●───●─●           ●───●─●
```

---

## Ciclo de uma feature

```bash
# 1. Partir sempre do develop atualizado
git checkout develop
git pull

# 2. Criar a branch de feature
git checkout -b feature/nome-da-feature

# 3. Desenvolver e commitar (mensagens em Conventional Commits)
git add .
git commit -m "feat(missionaries): adiciona ordenação por período de missão"

# 4. Publicar e abrir Pull Request para develop
git push -u origin feature/nome-da-feature
```

1. Abra uma **Pull Request** com destino **`develop`**.
2. Descreva o que foi feito, por quê e como testar (use o template abaixo).
3. Aguarde a revisão e o CI passar (quando disponível).
4. Faça o merge (padrão: **squash**) e **apague a branch** da feature.
5. **Nunca** commite diretamente em `main` ou `develop`.

### Template de Pull Request

```markdown
## O que foi feito
[Resumo do que a feature/ajuste implementa]

## Por quê
[Motivação / problema que resolve]

## Como testar
[Passos para reproduzir/validar]

## Alterações relevantes
- [arquivos/pontos-chave]

## Checklist
- [ ] Lint e build passando
- [ ] Testes (quando aplicável)
- [ ] Documentação atualizada (se necessário)
```

---

## Release

```bash
git checkout develop && git pull
git checkout -b release/v1.0.0
# ajustes finais, atualização de versão e changelog
git push -u origin release/v1.0.0
```

1. Abra PR de `release/v1.0.0` → `main`.
2. Após merge em `main`, **merge também em `develop`** (para não perder as correções).
3. Crie a tag de versão em `main`: `git tag v1.0.0 && git push origin v1.0.0`.

---

## Hotfix (produção)

```bash
git checkout main && git pull
git checkout -b hotfix/descricao-do-fix
# corrija, commite e publique
git push -u origin hotfix/descricao-do-fix
```

1. Abra PR de `hotfix/...` → `main`.
2. Depois do merge, **merge também em `develop`**.

---

## Convenção de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<type>(<escopo>): <descrição>
```

| Type | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração (sem mudança de comportamento) |
| `test` | Testes |
| `chore` | Tarefas de manutenção/build/deps |
| `perf` | Melhoria de performance |
| `ci` | Pipeline de CI/CD |

Exemplos:

```
feat(lunch): impede almoço duplicado no mesmo dia
fix(auth): corrige validação de senha no login
docs: atualiza README com instruções de deploy
```

---

## Regras de ouro

- **Nunca** commitar segredos (`.env`, tokens, connection strings reais).
- Sempre rodar `npm run lint` e `npm run build` antes de abrir a PR.
- Toda mudança que altera o schema Prisma deve rodar `npx prisma db push` (MongoDB) e registrar a mudança na PR.
- Mensagens de commit em **inglês**, descrição de PR e issues no idioma do projeto (**português**).
