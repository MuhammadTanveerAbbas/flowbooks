import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function q(userId: string | undefined, ...parts: string[]) {
  return [userId, ...parts];
}

export function useIncome(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "income"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income")
        .select("*, clients(name)")
        .eq("user_id", userId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "expenses"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useClients(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "clients"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useClientOptions(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "client-options"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useProjects(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "projects"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useInvoices(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "invoices"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "profile"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    enabled: !!userId,
  });
}

export function useYearIncome(userId: string | undefined, year: number) {
  return useQuery({
    queryKey: q(userId, "income-year", String(year)),
    queryFn: async () => {
      const startOfYear = `${year}-01-01`;
      const { data, error } = await supabase
        .from("income")
        .select("amount")
        .eq("user_id", userId!)
        .gte("date", startOfYear);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useYearExpenses(userId: string | undefined, year: number) {
  return useQuery({
    queryKey: q(userId, "expenses-year", String(year)),
    queryFn: async () => {
      const startOfYear = `${year}-01-01`;
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId!)
        .gte("date", startOfYear);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: q(userId, "dashboard"),
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

      const [incRes, expRes, profRes] = await Promise.all([
        supabase
          .from("income")
          .select("amount, date, status, description")
          .eq("user_id", userId!)
          .gte("date", sixMonthsAgoStr)
          .order("date", { ascending: false }),
        supabase
          .from("expenses")
          .select("amount, date, description")
          .eq("user_id", userId!)
          .gte("date", sixMonthsAgoStr)
          .order("date", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
      ]);
      if (incRes.error) throw incRes.error;
      if (expRes.error) throw expRes.error;
      if (profRes.error) throw profRes.error;

      return { income: incRes.data ?? [], expenses: expRes.data ?? [], profile: profRes.data ?? null };
    },
    enabled: !!userId,
  });
}
