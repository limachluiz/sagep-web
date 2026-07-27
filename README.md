# SAGEP Web

Frontend do **Sistema de Apoio à Gestão de Projetos (SAGEP)**, desenvolvido para apoiar o planejamento, a execução e o acompanhamento dos projetos do 4º Centro de Telemática de Área.

## Estado atual

Esta branch contém a aplicação operacional integrada ao backend:

- aplicação React 19 com TypeScript e Vite;
- design system com Tailwind CSS 4 e componentes shadcn/ui;
- identidade institucional em verde-oliva;
- autenticação JWT integrada ao backend;
- renovação automática de access token por refresh token;
- controle de sessão com Zustand;
- rotas públicas e protegidas;
- layout responsivo autenticado;
- dashboards operacional e executivo com dados reais, filtros e comparação temporal;
- projetos com timeline, próxima ação e fluxo documental;
- Kanban de projetos e Gantt de Ordens de Serviço em módulos próprios;
- CRUD de projetos, tarefas, estimativas, DIEx e Ordens de Serviço;
- arquivamento, restauração e exclusão lógica conforme permissões;
- ATAs e saldos, OMs, usuários, sessões, permissões e relatórios;
- React Query integrado aos contratos da API.

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

Se optar por acessar a API diretamente pelo navegador, inclua a origem do Vite
na configuração do backend:

```env
CORS_ALLOWED_ORIGINS="http://localhost:4200,http://localhost:5173"
```

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run lint     # análise estática
npm run build    # verificação TypeScript e build de produção
npm run preview  # visualização local do build
```

## Estrutura principal

```text
src/
├── app/              # composição e rotas da aplicação
├── components/ui/    # componentes reutilizáveis do design system
├── config/           # variáveis e configuração do ambiente
├── features/         # módulos funcionais por domínio
│   ├── auth/         # autenticação, sessão e proteção de rotas
│   ├── dashboard/    # dashboards operacional e executivo
│   └── tasks/        # tarefas, responsáveis, prioridades e prazos
├── layouts/          # estruturas de página compartilhadas
├── lib/              # cliente HTTP e utilitários
└── index.css         # tokens visuais e estilos globais
```

## Fluxo funcional previsto

`Estimativa → NC → DIEx → NE → OS → Execução → As-Built → Atesto da NF → Conclusão`

Kanban e Gantt serão módulos próprios, separados do dashboard.

## Roadmap

- [x] Fundação do projeto e design system
- [x] Login, autenticação, refresh token e perfis
- [x] Dashboard operacional e executivo
- [x] Projetos, detalhes, timeline e próxima ação
- [x] Kanban e Gantt
- [x] Tarefas com CRUD e ciclo de arquivamento
- [x] Estimativas, NC, DIEx, NE, OS e conclusão
- [x] ATAs, saldos, OMs, usuários e administração
- [ ] Homologação com dados reais e testes de integração
- [ ] Revisão final de responsividade e acessibilidade

## Backend

A API está mantida separadamente em [limachluiz/sagep-backend](https://github.com/limachluiz/sagep-backend).
