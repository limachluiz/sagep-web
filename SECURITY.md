# Segurança do SAGEP Web

## Dependências

Execute periodicamente:

```bash
npm audit
npm outdated
```

Em 21/08/2026, o `npm audit` não apresenta vulnerabilidades conhecidas nas dependências do frontend.

## Dados sensíveis no navegador

- Não adicione segredos, senhas ou tokens a variáveis `VITE_*`; elas são incorporadas ao bundle público.
- O access token, o token de reautenticação e o estado autenticado permanecem apenas em memória.
- O refresh token é administrado pelo backend em cookie `HttpOnly` e não deve ser lido pelo JavaScript.
- Backups e exportações devem ser tratados como arquivos sensíveis e removidos de estações compartilhadas após o uso.
