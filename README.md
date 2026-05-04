# 🩺 Diagnóstico Fisiometabólico — Plataforma SaaS com IA

Plataforma multi-tenant para clínicas de avaliação fisiometabólica:
coleta modular guiada, cálculos científicos, **análises por IA**, dashboard
do paciente, evolução longitudinal e **laudo PDF premium personalizado por marca**.

---

## ✨ Funcionalidades

### Núcleo clínico
- **6 módulos**: anamnese, sinais vitais, posturografia (4 fotos), antropometria ISAK, força (preensão obrigatória), cardiorrespiratório
- **Cálculos validados**: Jackson-Pollock 7 dobras + Siri, Von Döbeln (massa óssea), Heath-Carter (somatotipo), Tanaka (FCmáx), zonas Z1–Z5
- **Motor de score 0–100** ponderado (postura, composição, força, cardio + global) — penaliza só módulos avaliados

### IA integrada 🤖
- **Análise automática por módulo**: achados, interpretação técnica, riscos, benefícios, recomendações de treino
- **Conclusão global**: pontos fortes, pontos críticos, prioridades de intervenção, mensagem motivadora ao paciente
- **Análise longitudinal**: tendências, progressos, regressões, alertas clínicos
- **Personalização** por sexo, idade e objetivo declarado
- **Edição manual**: profissional revisa/sobrescreve antes do PDF
- **Multi-provedor**: Anthropic Claude ou OpenAI GPT (autodetecta)

### Dashboard do paciente
- Velocímetros (gauge SVG) com badges de evolução
- Gráficos de linha (peso, %G, VO₂máx, preensão, scores ao longo do tempo)
- Gráficos de barras (circunferências, zonas de treino)
- Comparativo automático atual vs. anterior (8 métricas com indicador melhora/piora)
- **Portal público do paciente** via link seguro com token (90 dias, revogável)

### SaaS multi-tenant
- **Clínicas isoladas** via Row Level Security (cada clínica vê só seus dados)
- **Equipe**: papéis owner / admin / avaliador, convites por e-mail
- **Branding por clínica**: logo, 5 cores customizáveis, aplicadas ao PDF e ao header
- **Produtos configuráveis**: cada clínica cadastra pacotes (Check-up Executivo, Avaliação Atleta, etc) com módulos pré-selecionados
- **Planos**: starter / pro / enterprise com limites de avaliações e avaliadores
- **Tracking de uso de IA**: tokens e custo por clínica para cobrança

---

## 🧩 Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **Estilo:** TailwindCSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **IA:** Anthropic Claude (recomendado) ou OpenAI GPT
- **PDF:** Puppeteer (HTML → PDF)
- **Validação:** Zod + React Hook Form

---

## 🚀 Como rodar

### 1. Pré-requisitos
- Node.js 18+
- Conta [Supabase](https://supabase.com)
- (Opcional) Chave de API [Anthropic](https://console.anthropic.com) ou [OpenAI](https://platform.openai.com)

### 2. Instalar

```bash
npm install
```

### 3. Configurar Supabase

1. Crie um projeto em supabase.com
2. **SQL Editor** → execute na ordem:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_policies.sql`
   - `supabase/migrations/003_storage.sql`
   - `supabase/migrations/004_ajustes.sql`
   - `supabase/migrations/005_portal_paciente.sql`
   - `supabase/migrations/006_saas_ia.sql`
3. **Settings → API**: copie `URL`, `anon key` e `service_role`

### 4. Configurar `.env.local`

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# IA — escolha UM provedor
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
# OU
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 5. Iniciar

```bash
npm run dev
```

Abra http://localhost:3000

---

## 🗂️ Arquitetura

```
src/
├── app/
│   ├── (app)/                       # Área autenticada
│   │   ├── dashboard/
│   │   ├── pacientes/[id]/          # Dashboard rico do paciente
│   │   ├── avaliacoes/[id]/         # Fluxo por etapas + revisão
│   │   ├── produtos/                # CRUD de produtos
│   │   └── clinica/                 # Branding + equipe + plano
│   ├── p/[token]/                   # Portal público do paciente
│   ├── login/
│   └── api/
│       ├── pdf/                     # Geração PDF (avaliador e público)
│       ├── ia/{gerar,editar}/       # Análises com IA
│       └── clinica/convidar/        # Convite de membros
├── components/
│   ├── PatientDashboard.tsx         # Reusável (clínico + público)
│   ├── AnalisesIAPanel.tsx          # Painel IA por módulo
│   ├── ShareTokenPanel.tsx          # Gera links públicos
│   ├── ClinicaMembrosPanel.tsx
│   ├── forms/{ProdutoForm,ClinicaBrandingForm}.tsx
│   └── ui/{Gauge,LineChart,BarChart,DeltaBadge,...}
├── lib/
│   ├── ai/{client,prompts,service}.ts
│   ├── calculations/                # Fórmulas científicas
│   ├── scores/                      # Motor de score 0-100
│   ├── pdf/template.ts              # PDF dinâmico por branding
│   └── supabase/
└── types/
supabase/migrations/                 # 6 migrations SQL
```

---

## 🔐 Multi-tenancy

Todo dado é isolado por `clinica_id` via RLS. Função helper `current_clinica_id()`
retorna o tenant do usuário autenticado e é usada em todas as policies.

Quando um usuário se cadastra, um trigger:
1. Cria registro em `avaliadores`
2. Cria nova `clinica` solo
3. Adiciona como `owner` em `clinica_membros`
4. Cria produto padrão "Diagnóstico Completo"

---

## 🤖 Como funciona a IA

1. Cada módulo tem um **prompt especializado** com schema JSON rígido (ver `src/lib/ai/prompts.ts`)
2. O **system prompt** inclui contexto do paciente (sexo, idade, objetivo, histórico)
3. Resposta vem em JSON validado e persistido em `analises_ia`
4. Profissional pode **regerar**, **editar** ou usar como está
5. PDF embute as análises em cada seção com formatação rica
6. Cada chamada registra tokens/custo em `ia_uso` para cobrança

### Custo aproximado por avaliação completa
- 6 análises de módulo + 1 conclusão + 1 evolução = ~8 chamadas
- Anthropic Claude Sonnet 4.5: ~US$ 0,08–0,15 por avaliação
- OpenAI GPT-4o-mini: ~US$ 0,01–0,02 por avaliação

---

## 📄 PDF inteligente

O laudo gerado inclui:
1. **Capa** com gradiente customizado por clínica + logo
2. **Resumo executivo** com velocímetros + mensagem do IA ao paciente
3. **Conclusão clínica** com prioridades de intervenção
4. **Análise evolutiva** (se há ≥2 avaliações)
5. **Cada módulo** com dados + análise IA (achados/riscos/benefícios/recomendações)
6. **Anexos**: protocolos, equipamentos, referências científicas

---

## 💰 Planos sugeridos para SaaS

| Plano | Avaliações/mês | Avaliadores | IA | Preço sugerido |
|---|---|---|---|---|
| Starter | 50 | 3 | Sim | R$ 197/mês |
| Pro | 200 | 10 | Sim | R$ 497/mês |
| Enterprise | Ilimitado | Ilimitado | Sim + custom | sob consulta |

Tracking de uso de IA permite cobrar overage por avaliação quando passar do limite.

---

## 🚀 Próximos passos

- Integração Stripe para cobrança automática
- Custom domain por clínica (`avaliacao.medfit.com.br`)
- App mobile React Native
- Webhook para integração com agendamento
- Geração de programa de treino executável (PDF/PWA do paciente)

---

## 📜 Licença

Uso comercial — adapte conforme necessário.
