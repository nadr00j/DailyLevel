<div align="center">
  <img src="https://i.postimg.cc/P57vrVJQ/logo-daily-level.png" alt="DailyLevel Logo" width="200" height="200">
  
  # DailyLevel
  
  **Transforme sua rotina diária em uma jornada gamificada** 🎮
  
  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
  [![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
  
</div>

---

## 🎯 Sobre o Projeto

O **DailyLevel** é um PWA (Progressive Web App) que transforma sua produtividade diária em uma experiência gamificada. Com foco em **fricção zero** e **execução rápida**, o app permite gerenciar hábitos, tarefas e metas de forma intuitiva e motivadora.

### ✨ Principais Características

- 🎮 **Sistema de Gamificação**: Avatar PixelBuddy que evolui com suas ações
- 📊 **Heatmap de Hábitos**: Visualização clara do progresso diário
- ✅ **Gestão de Tarefas**: Organização em buckets (Hoje/Semana/Depois)
- 🎯 **Metas e Milestones**: Acompanhamento de objetivos com barras de progresso
- 💰 **Economia Interna**: Sistema de XP e Coins para recompensas
- 📱 **PWA Offline-First**: Funciona 100% offline
- 🌙 **Dark Mode**: Interface elegante e moderna

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca principal
- **TypeScript 5.8.3** - Tipagem estática
- **Vite 5.4.19** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **Framer Motion** - Animações
- **Zustand** - Gerenciamento de estado

### Backend & Infraestrutura
- **Supabase** - Backend as a Service
- **Vercel** - Deploy e hospedagem
- **PWA** - Service Workers e cache offline

### Gamificação
- **Sistema de XP** - Pontuação por ações
- **Avatar PixelBuddy** - Personagem que evolui
- **Categorias de Atributos** - STR, INT, CRE, SOC
- **Loja de Recompensas** - Sistema de coins

---

## 🎮 Sistema de Gamificação

### Atributos e Categorias
- **STR (Força)**: Fitness, saúde, higiene
- **INT (Inteligência)**: Estudo, trabalho, lógica  
- **CRE (Criatividade)**: Arte, criação, composição
- **SOC (Social)**: Relacionamentos, família, network

### Sistema de Pontos
- ✅ **Hábito completado**: 10 XP
- ✅ **Tarefa concluída**: 10 XP
- 🎯 **Milestone atingido**: 50 XP
- 🏆 **Meta alcançada**: 30 XP
- 💰 **Conversão**: 1 Coin = 10 XP

### Estados do Avatar
- 🌱 **Iniciante** (0-25% vitalidade)
- 🏃 **Engajado** (26-60% vitalidade)
- 💪 **Forte** (61-90% vitalidade)
- 🦸 **Épico** (91-100% vitalidade)

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js >= 18
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/nadr00j/DailyLevelV2.git

# 2. Navegue para o diretório
cd DailyLevelV2

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 5. Execute o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linter ESLint
```

---

## 📱 Deploy na Vercel

### Configuração Automática
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático a cada push!

### Configuração Manual
```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🗄️ Configuração do Supabase

### Estrutura do Banco
- **profiles**: Dados do usuário e avatar
- **habits**: Hábitos e histórico de check-ins
- **tasks**: Tarefas organizadas por buckets
- **goals**: Metas e milestones
- **user_data**: Dados gamificados (XP, coins, vitalidade)

### RLS (Row Level Security)
Todas as tabelas possuem políticas de segurança configuradas para acesso baseado no usuário autenticado.

---

## 📊 Métricas e KPIs

### Performance
- ⚡ **TTI (Time to Interactive)**: < 1.2s
- 🎯 **Tempo até primeira ação**: < 5s
- 📱 **Ações por sessão**: ≥ 2
- 🚫 **Crash rate**: 0 conhecidos

### Engajamento
- 🔥 **Streak médio**: Acompanhamento de sequências
- 📈 **Vitalidade**: Baseada em XP dos últimos 30 dias
- 🎮 **Uso da loja**: Frequência de compras com coins

---

## 🎨 Design System

### Cores Principais
- **Fundo**: `#0B0B0F` (ink.900)
- **Superfícies**: `#111319` (ink.800)
- **Texto**: `#EDEFF6` (base)
- **Verde**: `#6EF3A3`, `#00D17A`
- **Roxo**: `#C4A3FF`, `#8B6CFF`
- **Laranja**: `#FFC069`, `#FF9A5C`

### Componentes
- Cards com border-radius de 22-24px
- Micro-interações de 120-160ms
- Ícones mono/duo-tone discretos
- Animações com easing out

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Nadr00J** - Desenvolvedor e idealizador do DailyLevel

---

<div align="center">
  
  **⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐**
  
  [![GitHub stars](https://img.shields.io/github/stars/<seu-usuario>/DailyLevelV2?style=social)](https://github.com/<seu-usuario>/DailyLevelV2)
  [![GitHub forks](https://img.shields.io/github/forks/<seu-usuario>/DailyLevelV2?style=social)](https://github.com/<seu-usuario>/DailyLevelV2)
  
</div>