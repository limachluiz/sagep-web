# SAGEP Web

Frontend do **Sistema de Apoio à Gestão de Projetos (SAGEP)**, desenvolvido para apoiar o planejamento, a execução e o acompanhamento dos projetos do 4º Centro de Telemática de Área.

## Estado atual

Esta branch contém a aplicação operacional integrada ao backend:

- aplicação React 19 com TypeScript e Vite;
- design system com Tailwind CSS 4 e componentes shadcn/ui;
- identidade institucional em verde-oliva;
- login cartográfico responsivo com status público do sistema e identidade do 4º CTA;
- autenticação JWT integrada ao backend;
- renovação automática por refresh token rotativo em cookie HttpOnly;
- access token e estado de sessão mantidos somente em memória pelo Zustand;
- confirmação de senha automática para operações administrativas críticas;
- rotas públicas e protegidas;
- layout responsivo autenticado;
- fundamentos de acessibilidade com navegação por teclado, movimento reduzido e testes Axe;
- dashboards operacional e executivo com dados reais, filtros por período, UF, OM, tipo e responsável, comparação temporal e cards acionáveis;
- projetos com timeline, próxima ação e fluxo documental;
- abas dos detalhes do projeto persistidas na URL para navegação direta;
- Kanban de projetos e Gantt de Ordens de Serviço em módulos próprios, com filtros organizacionais, gargalos, atrasos e lacunas de planejamento;
- CRUD de projetos, tarefas, estimativas, DIEx e Ordens de Serviço;
- seletores de vínculos com códigos amigáveis, títulos e OMs, mantendo IDs internos ocultos;
- arquivamento, restauração e exclusão lógica conforme permissões;
- ATAs e saldos, OMs, usuários, sessões, permissões e relatórios;
- saldo das ATAs mantido exclusivamente pelo razão interno do SAGEP após a importação inicial;
- importação CSV de até 1.000 OMs, com modelo, prévia por linha e modos de criação ou atualização;
- administração de backups com criação, download, importação, exclusão, exportação seletiva e restauração protegida;
- execução financeira com consulta de NE, acompanhamento de liquidação/pagamento e registro de NFe;
- configurações de integrações e parâmetros operacionais;
- painel de rede, servidores e HTTPS com diagnóstico do ambiente, emissão interna por OM e kits de confiança para Windows 11, Linux Mint e Ubuntu;
- tarefas com histórico de notas, data/hora e encerramento;
- perfil pessoal com edição segura de dados, avatar, tema, avisos, troca de senha e gestão de dispositivos;
- revisão responsiva para modais, tabelas, Kanban e Gantt, com estados de carregamento, vazio e erro;
- React Query integrado aos contratos da API.
- integração contínua no GitHub Actions com auditoria de dependências e segredos, CodeQL,
  lint, testes e build de produção;
- atualizações semanais de dependências e GitHub Actions pelo Dependabot.

## Tecnologias

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- shadcn/ui e Radix UI
- React Router 7
- TanStack Query e TanStack Table
- Zustand
- React Hook Form e Zod
- Recharts
- Lucide React

## Execução local

Requisitos: Node.js 22 ou superior e npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Caso o arquivo `.env.example` ainda não exista, crie `.env` com:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
```

Durante o desenvolvimento, o navegador acessa `/api` pela mesma origem do
frontend e o Vite encaminha as requisições para o backend. Isso evita bloqueios
de CORS no ambiente local. O proxy remove o cabeçalho `Origin` antes de chamar
a API, caracterizando corretamente a segunda etapa como comunicação
servidor-a-servidor. Reinicie `npm run dev` após alterar essas variáveis.

Se o Vite registrar `ECONNREFUSED`, confirme primeiro se
`http://localhost:3000/api/health` responde. Ao executar o backend por Docker,
mantenha `API_PORT=3000` no `.env` do backend e recrie o serviço da API após
alterar a porta.

Se optar por acessar a API diretamente pelo navegador, inclua a origem do Vite
na configuração do backend:

```env
CORS_ALLOWED_ORIGINS="http://localhost:4200,http://localhost:5173"
CORS_ALLOW_CREDENTIALS=true
```

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run lint     # análise estática
npm test         # suíte automatizada
npm run build    # verificação TypeScript e build de produção
npm run preview  # visualização local do build
```

## Segurança da sessão

Na primeira execução, quando o banco ainda não possui usuários, o acesso é
direcionado para `/setup`. O assistente exige a chave `SAGEP_SETUP_TOKEN`
configurada no servidor e cria, em uma única operação, a OM, o primeiro
administrador e os parâmetros iniciais de rede. Após a conclusão, esse fluxo é
desativado pelo backend e a chave deve ser removida do ambiente da API.

O frontend não grava tokens de autenticação no `localStorage` ou no `sessionStorage`. O access token de curta duração existe apenas em memória; ao recarregar a página, a API valida e rotaciona o refresh token armazenado em cookie `HttpOnly`. Todas as chamadas usam credenciais de mesma origem ou uma origem explicitamente autorizada pelo backend.

Quando a API responde `428 AUTH_STEP_UP_REQUIRED`, o cliente abre uma confirmação de identidade, envia a senha somente ao endpoint de reautenticação e repete a operação original com uma autorização temporária. Esse token também permanece apenas em memória, é vinculado ao usuário atual e não é reutilizado após expirar ou trocar de conta.

O download integral de backup participa desse mesmo fluxo de reautenticação. O arquivo recebido é tratado como `Blob` em memória e não é persistido pelo SAGEP no armazenamento do navegador.

Em **Backup e restauração**, a autoridade certificadora da OM também pode ser
exportada em arquivo `.sagep-pki` criptografado e restaurada de forma controlada.
A senha de custódia é usada somente durante a chamada e os campos são limpos ao
fechar o diálogo. A tela avisa quando a mudança da raiz exige redistribuir os
kits de confiança e sempre orienta reiniciar o Caddy após a recuperação.

O formulário também respeita o bloqueio temporário retornado pela API após tentativas consecutivas inválidas. Novas contas administrativas exigem senha com pelo menos 8 caracteres; credenciais existentes continuam válidas até serem alteradas.

Na publicação, sirva o frontend e a API por HTTPS, configure `AUTH_COOKIE_SECURE=true` no backend e aplique no proxy reverso uma CSP compatível com os domínios realmente utilizados. Não inclua curingas na lista CORS.

O painel **Configurações → Rede, servidores e HTTPS** não altera a interface de
rede do host. Ele registra os valores aprovados, compara IP e DNS com o ambiente
observado e protege emissão, rotação e download dos kits com perfil ADMIN,
limite de requisições, reautenticação e auditoria. A impressão digital SHA-256
exibida deve ser confirmada por um canal confiável antes de instalar a raiz em
qualquer estação.

O mesmo painel apresenta uma verificação de prontidão somente leitura. Ela
consolida bloqueios e alertas de runtime, cookies, proxy, CORS, DNS, volumes e
certificado. Nesta versão, apenas a autoridade interna exclusiva da OM é exposta
como modo de certificado.

A renovação do certificado do servidor é separada da rotação da autoridade raiz.
Renovar preserva a confiança instalada nas estações; rotacionar a raiz exige
redistribuir os kits. Alertas progressivos aparecem na Central de Alertas aos 60,
30, 15 e 7 dias do vencimento.

O painel também mostra a política de renovação automática, a última verificação
e o modo de recarga do proxy. No perfil Docker HTTPS, a API renova o certificado
ao entrar na janela configurada e o Caddy detecta o novo par TLS e o carrega sem
intervenção. Uma tentativa malsucedida gera alerta crítico e mantém disponível a
renovação manual.

## Estrutura principal

```text
src/
├── app/              # composição e rotas da aplicação
├── components/ui/    # componentes reutilizáveis do design system
├── config/           # variáveis e configuração do ambiente
├── features/         # módulos funcionais por domínio
│   ├── auth/         # autenticação, sessão e proteção de rotas
│   ├── backups/      # backup, exportação e restauração do banco
│   ├── dashboard/    # dashboards operacional e executivo
│   ├── military-organizations/ # cadastro e importação CSV de OMs
│   └── tasks/        # tarefas, responsáveis, notas e encerramento
├── layouts/          # estruturas de página compartilhadas
├── lib/              # cliente HTTP e utilitários
└── index.css         # tokens visuais e estilos globais
```

## Fluxo funcional oficial

`Estimativa → NC → DIEx → NE → OS → Execução → As-Built → Atesto da NF → Conclusão`

Kanban e Gantt são módulos próprios, separados do dashboard.

## Roadmap

- [x] Fundação do projeto e design system
- [x] Login, autenticação, refresh token e perfis
- [x] Dashboard operacional e executivo
- [x] Projetos, detalhes, timeline e próxima ação
- [x] Detalhes do projeto com tarefas, documentos, equipe e auditoria contextual
- [x] Kanban e Gantt
- [x] Tarefas com CRUD e ciclo de arquivamento
- [x] Estimativas, NC, DIEx, NE, OS e conclusão
- [x] ATAs, saldos, OMs, usuários e administração
- [x] Backup, exportação e restauração segura do banco
- [x] Importação CSV em escala de Organizações Militares
- [x] Execução financeira e rastreamento de Nota de Empenho
- [x] Perfil pessoal, preferências, senha e sessões
- [x] Revisão final de responsividade e acessibilidade
- [ ] Homologação com dados reais e testes de integração

## Backend

A API está mantida separadamente em [limachluiz/sagep-backend](https://github.com/limachluiz/sagep-backend).
