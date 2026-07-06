import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function invalidateAfter(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined, ...keys: string[][]) {
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: [userId, ...key] });
  }
}

// ── Income ────────────────────────────────────────────────

export function useAddIncome(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("income").insert({ user_id: uid, ...values } as never);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["income"], ["dashboard"], ["income-year"]),
  });
}

export function useUpdateIncome(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("income").update(values).eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["income"], ["dashboard"], ["income-year"]),
  });
}

export function useDeleteIncome(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("income").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["income"], ["dashboard"], ["income-year"]),
  });
}

// ── Expenses ─────────────────────────────────────────────

export function useAddExpense(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("expenses").insert({ user_id: uid, ...values } as never);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["expenses"], ["dashboard"], ["expenses-year"]),
  });
}

export function useUpdateExpense(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("expenses").update(values).eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["expenses"], ["dashboard"], ["expenses-year"]),
  });
}

export function useDeleteExpense(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["expenses"], ["dashboard"], ["expenses-year"]),
  });
}

// ── Clients ───────────────────────────────────────────────

export function useAddClient(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("clients").insert({ user_id: uid, ...values } as never);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["clients"], ["client-options"]),
  });
}

export function useUpdateClient(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("clients").update(values).eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["clients"], ["client-options"]),
  });
}

export function useDeleteClient(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["clients"], ["client-options"]),
  });
}

// ── Projects ──────────────────────────────────────────────

export function useAddProject(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("projects").insert({ user_id: uid, ...values } as never);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["projects"]),
  });
}

export function useUpdateProject(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("projects").update(values).eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["projects"]),
  });
}

export function useDeleteProject(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["projects"]),
  });
}

// ── Invoices ──────────────────────────────────────────────

export function useAddInvoice(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("invoices").insert({ user_id: uid, ...values } as never);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["invoices"]),
  });
}

export function useUpdateInvoice(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("invoices").update(values).eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["invoices"]),
  });
}

export function useDeleteInvoice(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = requireUserId(userId);
      const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => invalidateAfter(qc, userId, ["invoices"]),
  });
}

export function useMarkInvoicePaid(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, clientId }: { id: string; amount: number; clientId: string | null }) => {
      const uid = requireUserId(userId);
      // Get current invoice status for rollback
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("status")
        .eq("id", id)
        .eq("user_id", uid)
        .maybeSingle();
      if (fetchError) throw fetchError;
      const previousStatus = invoice?.status ?? "draft";

      // Step 1: Update invoice status to paid
      const { error: invErr } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", id)
        .eq("user_id", uid);
      if (invErr) throw invErr;

      // Step 2: Insert income record
      const { error: incomeError } = await supabase.from("income").insert({
        user_id: uid,
        description: "Invoice payment",
        amount,
        date: new Date().toISOString().slice(0, 10),
        status: "paid",
        client_id: clientId,
        invoice_id: id,
      });

      // Rollback invoice status if income insert fails
      if (incomeError) {
        await supabase
          .from("invoices")
          .update({ status: previousStatus })
          .eq("id", id)
          .eq("user_id", uid);
        throw incomeError;
      }
    },
    onSuccess: () => invalidateAfter(qc, userId, ["invoices"], ["income"], ["dashboard"], ["income-year"]),
  });
}

// ── Profile ───────────────────────────────────────────────

export function useUpsertProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const uid = requireUserId(userId);
      const { data: updateData, error: updateError } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", uid)
        .select();
      if (updateError) throw updateError;

      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: uid, ...values })
          .select();
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => invalidateAfter(qc, userId, ["profile"], ["dashboard"]),
  });
}
