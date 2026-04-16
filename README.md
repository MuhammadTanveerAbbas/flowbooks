<div align="center">

  <img src="public/favicon.svg" alt="FlowBooks Logo" width="80" height="80" />

# FlowBooks

**The all-in-one finance toolkit for freelancers track income, manage expenses, send invoices, and estimate taxes.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://your-demo-link.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

FlowBooks is a freelance finance toolkit that consolidates income tracking, invoicing, and expense management into a single dashboard. Built for independent contractors and solo founders who need professional financial visibility without the complexity of enterprise accounting software.

---

## ✨ Features

- 📊 **Dashboard** Real-time overview with smoothed income tracking, expense breakdowns, and 6-month charts
- 💰 **Income Tracking** Log payments, link to clients & projects, and track payment status
- 🧾 **Invoicing** Create professional invoices with line items; mark paid with auto-income generation
- 💸 **Expense Management** Categorize expenses, attach receipts, and monitor spending patterns
- 👥 **Client & Project CRM** Manage contacts, track project budgets and timelines
- 🧮 **Tax Estimator** Quarterly tax estimates based on configurable saving percentages
- 🧙 **Onboarding Wizard** 3-step guided setup: country & tax status → income goals → first client
- 🔒 **Authentication** Email/password + Google OAuth with email verification

---

## 🏆 Production Ready

FlowBooks has undergone a comprehensive production readiness audit. Key improvements:

- ✅ **Type Safety** TypeScript strict mode enabled, all `any` types eliminated
- ✅ **Security** Environment variable validation, security headers, RLS on all tables
- ✅ **Error Handling** Global error boundary, graceful error states, dev-only logging
- ✅ **Performance** Code splitting, optimized bundle size, efficient data fetching
- ✅ **Code Quality** ESLint passing, no dead code, consistent conventions
- ✅ **Testing** Vitest setup with example tests, ready for expansion

See [PRODUCTION-AUDIT-REPORT.md](PRODUCTION-AUDIT-REPORT.md) for the complete audit report.

---

## 🛠 Tech Stack

| Category      | Technology                                |
| ------------- | ----------------------------------------- |
| Frontend      | React 18 + TypeScript 5.8                 |
| Build Tool    | Vite 5.4 with SWC                         |
| Styling       | Tailwind CSS v3 + Radix UI + shadcn/ui    |
| Animation     | Framer Motion                             |
| Backend/DB    | Supabase (Auth + PostgreSQL + RLS)        |
| Charts        | Recharts 2.15                             |
| Forms         | React Hook Form 7 + Zod 3.25              |
| Routing       | React Router v6.30                        |
| State         | TanStack Query v5.83                      |
| UI Components | Radix UI + Lucide Icons + Sonner (toasts) |
| Testing       | Vitest 3 + Testing Library + jsdom        |
| Code Quality  | ESLint 9 + TypeScript ESLint              |

### Key Technical Highlights

- **Type Safety** Strict TypeScript configuration with no implicit `any`
- **Code Splitting** Manual chunks for React, UI, charts, and forms (optimized bundle)
- **Authentication** Supabase Auth with protected routes and session management
- **Database Security** Row-Level Security (RLS) policies on all tables
- **Error Handling** Global error boundary with graceful fallback UI
- **Performance** React Query for caching, optimistic updates, and efficient refetching
- **Accessibility** Radix UI primitives with ARIA attributes and keyboard navigation
- **Developer Experience** Hot module replacement, fast refresh, path aliases (`@/`)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase account

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/flowbooks.git
cd flowbooks

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials (see Environment Variables below)

# 4. Run the development server
pnpm dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following **required** variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

Get your keys from [Supabase Dashboard](https://supabase.com) → Project Settings → API.

> **Note:** The project uses `.env.local` for local development (already in `.gitignore`). The `.env.example` file is provided as a template.

---

## 🗄 Database Setup

Run the schema against your Supabase project to create all required tables:

**Option A: Supabase Dashboard (recommended)**

1. Go to your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase/schema.sql`

**Option B: Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

This creates the following tables (all with Row Level Security enabled):

- **profiles** User settings, tax preferences, onboarding status
- **clients** Client contact information and notes
- **projects** Project tracking with budgets and timelines
- **invoices** Invoice generation with line items
- **income** Income records linked to clients/projects/invoices
- **expenses** Expense tracking with categories and receipts

**Key Features:**

- ✅ Row Level Security (RLS) enforced on all tables
- ✅ Foreign key constraints for data integrity
- ✅ Automatic `updated_at` timestamps via triggers
- ✅ Auto-profile creation on user signup
- ✅ UUID primary keys for security

---

## 🔑 Google OAuth Setup

To enable "Continue with Google" on the login/signup pages:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add your domain to **Authorized redirect URIs**:
   - For local dev: `http://localhost:8080`
   - For production: `https://your-domain.com`
   - Also add the Supabase callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. In Supabase Dashboard → Authentication → Providers → Google, enable it and paste your Client ID & Secret

---

## 📁 Project Structure

```
flowbooks/
├── public/                  # Static assets (favicon)
├── src/
│   ├── components/
│   │   ├── layout/          # AppLayout, Sidebar, TopBar, MobileNav
│   │   ├── ui/              # 50+ shadcn/ui components (Radix UI based)
│   │   ├── ErrorBoundary.tsx
│   │   ├── FlowBooksLogo.tsx
│   │   ├── NavLink.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/               # useAuth, use-mobile, use-toast
│   ├── integrations/
│   │   └── supabase/        # Supabase client & generated types
│   ├── lib/                 # Utility functions (cn, etc.)
│   ├── pages/               # 13 route-level page components
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── IncomePage.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── TaxPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFound.tsx
│   ├── test/                # Vitest setup & example tests
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles & Tailwind imports
├── supabase/
│   ├── schema.sql           # Complete database schema
│   └── config.toml          # Supabase CLI config
├── .env.example             # Environment variable template
├── .env.local               # Local environment (gitignored)
├── components.json          # shadcn/ui configuration
├── eslint.config.js         # ESLint 9 flat config
├── tailwind.config.ts       # Tailwind + typography plugin
├── tsconfig.json            # TypeScript strict mode config
├── vite.config.ts           # Vite with code splitting
├── vitest.config.ts         # Vitest test configuration
└── package.json             # Dependencies & scripts
```

---

## 📦 Available Scripts

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | Start development server on port 8080       |
| `pnpm build`      | Build for production (optimized & minified) |
| `pnpm preview`    | Preview production build locally            |
| `pnpm lint`       | Run ESLint on all source files              |
| `pnpm test`       | Run tests once (CI mode)                    |
| `pnpm test:watch` | Run tests in watch mode (development)       |

---

## 🌐 Deployment (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MuhammadTanveerAbbas/flowbooks)

1. Click the button above and connect your GitHub account
2. Add these environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy
4. After deploy, add your Vercel domain to:
   - Supabase Dashboard → Authentication → URL Configuration → **Site URL** and **Redirect URLs**
   - Google OAuth → Authorized redirect URIs (if using Google login)

---

## 🗺 Roadmap

- [x] Dashboard with 6-month income/expense charts
- [x] Invoice creation with line items and auto-income generation
- [x] Client & project CRM with budget tracking
- [x] Quarterly tax estimator with configurable rates
- [x] 3-step onboarding wizard
- [x] Google OAuth + email/password authentication
- [x] Email verification flow
- [x] Row-level security on all database tables
- [x] TypeScript strict mode with full type safety
- [x] Global error boundary for graceful error handling
- [x] Code splitting for optimized bundle size
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] Production-ready audit completed
- [ ] Recurring invoices with automated generation
- [ ] CSV/Excel export for accountants
- [ ] Multi-currency support with exchange rates
- [ ] Receipt OCR for automatic expense entry
- [ ] Mobile app (React Native)
- [ ] Stripe integration for payment processing
- [ ] Email reminders for overdue invoices

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and ensure:
   - TypeScript compilation passes (`pnpm build`)
   - Linting passes (`pnpm lint`)
   - Tests pass (`pnpm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

**Code Standards:**

- Use TypeScript strict mode (no `any` types)
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Built by The MVP Guy

<div align="center">

**Muhammad Tanveer Abbas**
SaaS Developer | Building production-ready MVPs in 14–21 days

[![Portfolio](https://img.shields.io/badge/Portfolio-themvpguy.vercel.app-black?style=for-the-badge)](https://themvpguy.vercel.app)
[![Twitter](https://img.shields.io/badge/Twitter-@themvpguy-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/themvpguy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/muhammadtanveerabbas)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/MuhammadTanveerAbbas)

_If this project helped you, please consider giving it a ⭐_

</div>
