import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "center" | "right";
  }
}

export interface ActivityItem {
  desc: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

export interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface IncomeEntry {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  client_id: string | null;
  clients?: { name: string } | null;
}

export interface ExpenseEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
}

export interface ClientEntry {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number;
  client_id: string | null;
  clients?: { name: string } | null;
}

export interface InvoiceEntry {
  id: string;
  invoice_number: string;
  amount: number;
  client_id: string | null;
  status: string;
  due_date: string | null;
  notes: string | null;
  clients?: { name: string } | null;
}

export interface ProfileRecord {
  full_name: string | null;
  tax_saving_percent: number | null;
}

export interface ClientOption {
  id: string;
  name: string;
}
