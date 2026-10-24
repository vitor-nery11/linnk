# Guia de Identidade Visual, Design System e Controle de Frontend — LINNK (`ui.md`)

> **Propósito do Documento:** Este arquivo consolida todas as decisões visuais, arquiteturais, de componentes e de regras de negócio implementadas no frontend (`client`) da plataforma **LINNK**. Ele serve como fonte única da verdade para manter controle total sobre o que foi construído e guiar a evolução futura e integração com o backend (`server`).

---

## 1. Diretriz Visual: Moderno, Limpo e Corporativo (`linnk-ideias`)

A interface do **LINNK** adota uma estética **corporativa, enxuta e moderna**, sem efeitos extravagantes, priorizando clareza visual, hierarquia tipográfica limpa e contraste neutro:

1. **Sobriedade Institucional (`#161316` & `#FFFFFF`)**:
   - A tela inicial do sistema é sempre a **Tela de Login Corporativa** (`LoginScreen.tsx`), estruturada em duas colunas limpas: painel institucional sólido em `#161316` à esquerda e área de autenticação em fundo claro (`#FFFFFF` / `#F8F8F7`) à direita.
   - Define explicitamente os **3 tipos de usuários que utilizam o sistema web**:
     - **Administrativo (`ADMIN`)**: Gestão global, regras de comissão, financeiro e auditoria.
     - **Operador (`OPERATOR`)**: Execução operacional, triagem de indicações, conferência de termos e atendimento.
     - **Corretor (`BROKER`)**: Envio e acompanhamento das próprias indicações, lançamentos da curadoria e comissões de 50%.
2. **Precisão e Leitura Prolongada (`#F6F5F2` / `#EAE6DF`)**:
   - Telas internas com superfícies brancas puras, bordas sutis de `1px` (`border-neutral-200` / `border-linnk-stone-300`), sem brilhos neon ou elementos decorativos excessivos.
3. **Destaque Funcional Pontual (`#FE4701`)**:
   - O laranja institucional (`#FE4701`) é usado de forma pontual e cirúrgica apenas no símbolo da marca, indicadores de atenção e ações primárias.

---

## 2. Paleta de Cores Oficial (Tailwind Tokens)

Configurada em `client/tailwind.config.js`:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  LINNK OBSIDIAN (Estrutura/Dark)   LINNK FLAME (Ação & Destaque)           │
│  #161316                            #FE4701 / #FF6D29                      │
│  RGB(22, 19, 22)                    RGB(254, 71, 1)                        │
├────────────────────────────────────────────────────────────────────────────┤
│  LINNK ESPRESSO (Apoio Quente)     LINNK STONE (Superfície Operacional)    │
│  #453027                            #F6F5F2 / #EAE6DF / #BABABA            │
│  RGB(69, 48, 39)                    RGB(246, 245, 242)                     │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Escala de Tokens no Tailwind

| Token | Hex | Uso Principal na Interface |
| :--- | :--- | :--- |
| **`linnk-flame` (`500`)** | **`#FE4701`** | **Cor primária de ação (CTA)**, logotipo, itens ativos na sidebar, destaques 50/50 |
| `linnk-flame-400` | `#FF6D29` | Realces sobre fundos escuros (`linnk-obsidian`), badges e glows |
| `linnk-flame-50` | `#FFF4EE` | Fundos de seleção de linhas na tabela e chips da modalidade `INDICA` |
| **`linnk-obsidian` (`900`)** | **`#161316`** | **Sidebar operacional**, cabeçalhos de modais/drawers, simulador 50/50 e modalidade `CONECTA` |
| `linnk-espresso` (`700`) | `#453027` | Gradientes atmosféricos (`arounda-glow`) na tela de Login e banners executivos |
| `linnk-stone-50` | `#F9F8F6` | Fundo de tabelas, inputs e áreas de trabalho de leitura intensa |
| `linnk-stone-200` | `#EAE6DF` | Bordas de divisórias e superfícies secundárias |
| `linnk-stone-400` | `#BABABA` | Rótulos secundários e metadados sobre fundo escuro |

### 2.2. Cores Semânticas para Status Independentes (RN06)

- **Aprovado / Venda Confirmada / Quitado:** `Emerald` (`#059669` / `#ECFDF5` / `#A7F3D0`)
- **Aguardando Termo / Pendente (RN04):** `Amber` (`#D97706` / `#FFFBEB` / `#FDE68A`)
- **Conflito de Duplicidade (RN02/RN03) / Rejeitado / Estorno (RN10):** `Rose` (`#E11D48` / `#FFF1F2` / `#FECDD3`)
- **Em Atendimento / Parcelamento Parcial (RN09):** `Sky` & `Indigo` (`#0284C7` / `#F0F9FF`)

---

## 3. Tipografia e Hierarquia

Importada via Google Fonts em `client/index.html`:

1. **`Space Grotesk` (`font-display`)**:
   - Títulos de módulos (`H1`, `H2`, `H3`), valores monetários de VGV e comissões, botões de ação e wordmark `LINNK`.
2. **`Plus Jakarta Sans` (`font-sans`)**:
   - Texto corrido, tabelas operacionais, formulários de cadastro, cláusulas do Termo de Consentimento e linha do tempo de atendimentos.
3. **`JetBrains Mono` (`font-mono`)**:
   - Códigos rastreáveis (`LNK-2026-001`, `VND-2026-001`), versões de regras (`REGRA-50-50-LIQ-v1.0`, `TERMO-CONSENTIMENTO-v1.2`), chaves privadas do Supabase Storage e timestamps de auditoria.

---

## 4. Logotipo e Iconografia

- **Componente `BrandLogo.tsx`:** Símbolo vetorial geométrico em `#FE4701` representando o elo entre Corretor, LINNK e Incorporadora, acompanhado do wordmark `LINNK` em caixa alta (`tracking-[0.14em]`).
- **Biblioteca de Ícones:** 100% padronizada com `lucide-react` (sem uso de emojis nativos).

---

## 5. Arquitetura de Pastas do Projeto

```text
linnkProjeto/
├── client/                                   # Frontend React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── types.ts                      # Contratos TypeScript (12 entidades do MVP)
│   │   │   └── AppContext.tsx                # Estado reativo e motor das regras RN01..RN13
│   │   ├── components/
│   │   │   ├── BrandLogo.tsx                 # Identidade visual LINNK
│   │   │   ├── SidebarLayout.tsx             # Shell Obsidian + Seletor RBAC em tempo real
│   │   │   └── StatusBadges.tsx              # Badges dos 5 status independentes (RN06)
│   │   ├── features/
│   │   │   ├── auth/LoginScreen.tsx          # Tela 1: Login corporativo (Admin, Operador e Corretor)
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardView.tsx         # Tela 2A: Dashboard Operacional & Administrativo
│   │   │   │   └── BrokerDashboardView.tsx   # Tela 2B: Painel Exclusivo do Corretor Parceiro
│   │   │   ├── referrals/
│   │   │   │   ├── ReferralsView.tsx         # Tela 3: Indicações, Ficha 360º & Detector de Duplicidade
│   │   │   │   └── DuplicatesAnalysisView.tsx# Tela 4: Análise Lado a Lado de Duplicidades
│   │   │   ├── documents/DocumentsView.tsx   # Tela 5: Termo HTML/PDF + Conferência Manual (RN04)
│   │   │   ├── attendances/AttendancesView.tsx# Tela 6: Closer & Linha do Tempo (INDICA/CONECTA)
│   │   │   ├── brokers/BrokersView.tsx       # Tela 7: Corretores Parceiros & Turma Fundadora
│   │   │   ├── developments/DevelopmentsView.tsx # Tela 8: Empreendimentos com Selo LINNK
│   │   │   ├── developers/DevelopersView.tsx # Tela 9: Incorporadoras & Regras de Pagamento
│   │   │   ├── sales/SalesFinanceView.tsx    # Tela 10: Vendas, Comissão Congelada, Parcelas & Estorno
│   │   │   ├── reports/ReportsView.tsx       # Tela 11: Relatórios & Conversão
│   │   │   ├── users/UsersConfigView.tsx     # Tela 12: Usuários, RBAC & Regras 50/50 (ADMIN)
│   │   │   └── audit/AuditView.tsx           # Tela 13: Trilha de Auditoria Imutável (RN11)
│   │   └── lib/
│   │       ├── formatters.ts                 # Moeda em centavos inteiros + normalização RN02
│   │       └── apiClient.ts                  # Cliente HTTP REST + Bearer Token Supabase
├── server/                                   # Pasta reservada para o Backend NestJS + Prisma
├── linnk-ideias/                             # Referências visuais originais do projeto
└── ui.md                                     # Este documento de controle de UI/UX e Frontend
```

---

## 6. Controle de Implementação das Regras de Negócio na UI

| Código | Regra de Negócio | Como foi implementada no Frontend (`client`) |
| :--- | :--- | :--- |
| **RN01** | Indicação vinculada a corretor | Seleção obrigatória de corretor ativo no modal de Nova Indicação (`ReferralsView.tsx`). |
| **RN02** | Verificação de duplicidade | Normalização instantânea de telefone e e-mail (`formatters.ts`) com alerta em tempo real ao digitar contato já existente. |
| **RN03** | Conflitos de indicação | Tela dedicada (`DuplicatesAnalysisView.tsx`) comparando 1º registro vs registro conflitante, exigindo justificativa auditada. |
| **RN04** | Consentimento antes do atendimento | Trava visual e funcional em `ReferralsView`, `DocumentsView` e `AttendancesView`: atendimento só é liberado quando `documentStatus === 'APROVADO'`. |
| **RN05** | Modalidades `INDICA` e `CONECTA` | Seletor visual e badges diferenciados (`ModalityBadge`), mantendo a divisão de 50% para o corretor em ambas. |
| **RN06** | Status independentes | Ficha 360º exibe separadamente: Status da Indicação, Status do Documento, Status da Venda, Status do Recebimento e Status do Repasse. |
| **RN07** | Cálculo de comissão 50/50 | Motor de cálculo em centavos inteiros suportando base `LIQUIDA` ou `BRUTA` configurável pelo ADMIN. |
| **RN08** | Histórico congelado do cálculo | Cada venda (`SalesFinanceView.tsx`) armazena e exibe o snapshot imutável (`ruleVersion`, alíquota, base e valores calculados). |
| **RN09** | Recebimentos e repasses separados | Lançamentos distintos (`RECEBIMENTO_INCORPORADORA` vs `REPASSE_CORRETOR`) com suporte a parcelas parciais e cálculo automático de saldo pendente. |
| **RN10** | Correções financeiras auditáveis | Proibição de exclusão silenciosa: botão **"Estornar (RN10)"** exige motivo, preserva o registro original e cria lançamento compensatório vinculado. |
| **RN11** | Auditoria completa | Toda ação crítica gera automaticamente um registro em `AuditView.tsx` com usuário, papel, módulo e data/hora. |
| **RN12** | Acesso mínimo necessário (RBAC) | Menu lateral oculta módulos restritos conforme o usuário logado; seletor rápido no topo permite testar `ADMIN`, `OPERATOR Completo` e `OPERATOR Restrito`. |
| **RN13** | Inativação em vez de exclusão | Corretores, empreendimentos, incorporadoras e usuários possuem botão de Inativar/Reativar preservando o histórico comercial. |
