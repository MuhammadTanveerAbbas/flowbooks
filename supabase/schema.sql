-- ============================================================
-- FlowBooks  Consolidated Schema
-- Run this once against a fresh Supabase project
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── Profiles ─────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  country              TEXT        NOT NULL DEFAULT 'US',
  tax_status           TEXT        NOT NULL DEFAULT 'self_employed',
  monthly_income_goal  NUMERIC     NOT NULL DEFAULT 0,
  tax_saving_percent   NUMERIC     NOT NULL DEFAULT 25,
  currency             TEXT        NOT NULL DEFAULT 'USD',
  onboarding_complete  BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Clients ──────────────────────────────────────────────────

CREATE TABLE public.clients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT,
  company    TEXT,
  phone      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_all" ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Projects ─────────────────────────────────────────────────

CREATE TABLE public.projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'active',
  budget      NUMERIC     NOT NULL DEFAULT 0,
  currency    TEXT        NOT NULL DEFAULT 'USD',
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id  ON public.projects(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_all" ON public.projects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Invoices ─────────────────────────────────────────────────

CREATE TABLE public.invoices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id      UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id     UUID        REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT        NOT NULL,
  amount         NUMERIC     NOT NULL,
  currency       TEXT        NOT NULL DEFAULT 'USD',
  status         TEXT        NOT NULL DEFAULT 'draft',
  issued_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  notes          TEXT,
  line_items     JSONB       NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, invoice_number)
);

CREATE INDEX idx_invoices_user_id   ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_all" ON public.invoices FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Income ───────────────────────────────────────────────────

CREATE TABLE public.income (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id  UUID        REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_id  UUID        REFERENCES public.invoices(id) ON DELETE SET NULL,
  description TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL,
  currency    TEXT        NOT NULL DEFAULT 'USD',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT        NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_date    ON public.income(date);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_all" ON public.income FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Expenses ─────────────────────────────────────────────────

CREATE TABLE public.expenses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL,
  currency    TEXT        NOT NULL DEFAULT 'USD',
  category    TEXT        NOT NULL DEFAULT 'other',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date    ON public.expenses(date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_all" ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
