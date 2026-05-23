-- ============================================================
-- FlowBooks  Consolidated Schema
-- Safe to re-run against an existing Supabase project
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── Profiles ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  country              TEXT        NOT NULL DEFAULT 'US',
  tax_status           TEXT        NOT NULL DEFAULT 'self_employed',
  monthly_income_goal  NUMERIC     NOT NULL DEFAULT 0,
  tax_saving_percent   NUMERIC     NOT NULL DEFAULT 25,
  currency             TEXT        NOT NULL DEFAULT 'USD',
  onboarding_complete  BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_tax_saving_percent_range CHECK (tax_saving_percent BETWEEN 0 AND 100),
  CONSTRAINT profiles_monthly_income_goal_nonnegative CHECK (monthly_income_goal >= 0)
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Clients ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clients (
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

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_all" ON public.clients;
CREATE POLICY "clients_all" ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Projects ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
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
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT projects_status_check CHECK (status IN ('active', 'completed', 'paused')),
  CONSTRAINT projects_budget_nonnegative CHECK (budget >= 0)
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id   ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = projects.client_id
          AND clients.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = projects.client_id
          AND clients.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── Invoices ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
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
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  CONSTRAINT invoices_amount_positive CHECK (amount > 0),
  UNIQUE (user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id    ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON public.invoices(status);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = invoices.client_id
          AND clients.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = invoices.project_id
          AND projects.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = invoices.client_id
          AND clients.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = invoices.project_id
          AND projects.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── Income ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.income (
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
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT income_status_check CHECK (status IN ('pending', 'paid', 'overdue')),
  CONSTRAINT income_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_income_user_id    ON public.income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date       ON public.income(date);
CREATE INDEX IF NOT EXISTS idx_income_client_id  ON public.income(client_id);
CREATE INDEX IF NOT EXISTS idx_income_project_id ON public.income(project_id);
CREATE INDEX IF NOT EXISTS idx_income_invoice_id ON public.income(invoice_id);
CREATE INDEX IF NOT EXISTS idx_income_status     ON public.income(status);

DROP TRIGGER IF EXISTS trg_income_updated_at ON public.income;
CREATE TRIGGER trg_income_updated_at
  BEFORE UPDATE ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "income_select" ON public.income;
DROP POLICY IF EXISTS "income_insert" ON public.income;
DROP POLICY IF EXISTS "income_update" ON public.income;
DROP POLICY IF EXISTS "income_delete" ON public.income;
CREATE POLICY "income_select" ON public.income FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "income_insert" ON public.income FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = income.client_id
          AND clients.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = income.project_id
          AND projects.user_id = auth.uid()
      )
    )
    AND (
      invoice_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = income.invoice_id
          AND invoices.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "income_update" ON public.income FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = income.client_id
          AND clients.user_id = auth.uid()
      )
    )
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = income.project_id
          AND projects.user_id = auth.uid()
      )
    )
    AND (
      invoice_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = income.invoice_id
          AND invoices.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "income_delete" ON public.income FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── Expenses ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL,
  currency    TEXT        NOT NULL DEFAULT 'USD',
  category    TEXT        NOT NULL DEFAULT 'other',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT expenses_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id  ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
