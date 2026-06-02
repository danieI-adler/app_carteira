#  app_carteira

A **** é uma plataforma web de simulação de investimentos. O sistema opera como uma competição permanente de gestão de portfólio utilizando ativos reais negociados na B3 (ações, ETFs, FIIs, BDRs, etc.), permitindo que os participantes tomem decisões, sem o uso de dinheiro real.

---

##  Funcionalidades Principais

### Para Participantes (Equipes)
* **Capital Inicial:** Cada equipe inicia com um saldo fixo de **R$ 10.000.000,00** em caixa.
* **Gestão de Portfólio:** Consulta de patrimônio líquido, caixa disponível, dívidas, posições compradas/vendidas, lucro/prejuízo acumulado e histórico completo.
* **Sistema de Ordens:** Envio de ordens *A Mercado* e *Limitadas*.
* **Venda a Descoberto (*Short Selling*):** Permitida contanto que consuma margem operacional dentro do limite do patrimônio líquido disponível.
* **Empréstimos:** Opção de empréstimo voluntário (até 50% do PL) e concessão automática de empréstimo emergencial caso o PL fique negativo.
* **Rendimentos e Proventos:** Crédito automático em caixa de dividendos, JCP, rendimentos de FIIs e atualização de rendimento sobre o caixa.

### Para Administradores
* Controle total de janelas operacionais (abertura e fechamento).
* Configuração e parametrização de taxas operacionais de venda.
* Criação de equipes, usuários e definição de senhas iniciais.
* Ajustes administrativos e correção de inconsistências.

---

## Stack Tecnológica

O projeto adota uma arquitetura moderna, minimalista e serverless:

* **Frontend:** React, Vite, Tailwind CSS (ou CSS customizado)
* **Backend & Banco de Dados:** Supabase & PostgreSQL (Transações ACID e Row Level Security)
* **Dados de Mercado:** Yahoo Finance (com atualizações diárias locais, sem consultas em tempo real na navegação)
* **Hospedagem & Versionamento:** GitHub Pages & GitHub

---

##  Estrutura do Repositório

O projeto segue estritamente a seguinte estrutura modular:

```text
app_carteira/
│
├── .github/workflows/         # Pipelines de CI/CD (Deploy e Lint)
├── .supabase/                 # Arquivos de configuração do Supabase local
│   ├── migrations/            # Migrations SQL organizadas e sequenciais
│   └── seeds/                 # Dados iniciais para ambiente de desenvolvimento
│
├── public/                    # Ativos estáticos públicos
│
├── src/
│   ├── assets/                # Estilos globais, imagens e ícones
│   ├── components/            
│   │   ├── ui/                # Componentes genéricos/presentacionais (Button, Input, etc.)
│   │   └── business/          # Componentes acoplados à regra de negócio (OrderForm, RankingTable)
│   ├── context/               # Provedores de estado global (Auth, Theme)
│   ├── hooks/                 # Hooks customizados para consumo de dados (usePortfolio, useOrders)
│   ├── layouts/               # Wrappers de estrutura de página (DashboardLayout, AdminLayout)
│   ├── pages/                 # Páginas e views da aplicação (Dashboard, Market, Ranking, Admin)
│   ├── routes/                # Gerenciamento de rotas e proteções de acesso
│   ├── services/              # Integrações externas e cliente do Supabase
│   └── utils/                 # Funções utilitárias (Formatadores, calculadoras e validadores)
│
├── index.html                 # Ponto de ancoragem do ecossistema React
├── vite.config.js             # Configurações do empacotador (incluindo base path do GitHub Pages)
└── package.json               # Dependências e scripts do projeto
