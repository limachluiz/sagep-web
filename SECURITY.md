# Segurança do SAGEP Web

## Dependências

Execute periodicamente:

```bash
npm audit
npm outdated
```

Em 21/08/2026, o `npm audit` não apresenta vulnerabilidades conhecidas nas dependências do frontend.

Os comandos `npm run security:audit` e `npm run security:secrets` são executados pelo CI.
O primeiro reprova qualquer vulnerabilidade relatada pelo npm; o segundo procura padrões de
chaves privadas e tokens nos arquivos versionados.

## Automação no GitHub

- O workflow `Qualidade do frontend` valida dependências, segredos, lint, testes e build.
- O workflow `Análise de segurança CodeQL` executa consultas estendidas em JavaScript e
  TypeScript a cada push, pull request e semanalmente.
- O Dependabot abre atualizações semanais de npm e GitHub Actions contra a `main`.
- Os workflows usam permissões mínimas; somente o job do CodeQL recebe
  `security-events: write` para publicar os resultados.

## Dados sensíveis no navegador

- Não adicione segredos, senhas ou tokens a variáveis `VITE_*`; elas são incorporadas ao bundle público.
- O access token, o token de reautenticação e o estado autenticado permanecem apenas em memória.
- O refresh token é administrado pelo backend em cookie `HttpOnly` e não deve ser lido pelo JavaScript.
- Backups e exportações devem ser tratados como arquivos sensíveis e removidos de estações compartilhadas após o uso.
