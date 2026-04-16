import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calculator, PiggyBank, TrendingUp, AlertTriangle } from "lucide-react";

interface IncomeRecord {
  amount: number;
}

interface ExpenseRecord {
  amount: number;
}

interface ProfileRecord {
  tax_saving_percent: number | null;
}

export default function TaxPage() {
  const { user } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [taxRate, setTaxRate] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const year = new Date().getFullYear();
    const startOfYear = `${year}-01-01`;

    Promise.all([
      supabase
        .from("income")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", startOfYear),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", startOfYear),
      supabase
        .from("profiles")
        .select("tax_saving_percent")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([incRes, expRes, profRes]) => {
      const inc = ((incRes.data || []) as IncomeRecord[]).reduce(
        (s: number, r: IncomeRecord) => s + Number(r.amount),
        0,
      );
      const exp = ((expRes.data || []) as ExpenseRecord[]).reduce(
        (s: number, r: ExpenseRecord) => s + Number(r.amount),
        0,
      );
      setTotalIncome(inc);
      setTotalExpenses(exp);
      const profile = profRes.data as ProfileRecord | null;
      if (profile?.tax_saving_percent)
        setTaxRate(Number(profile.tax_saving_percent));
      setLoading(false);
    });
  }, [user]);

  const netProfit = totalIncome - totalExpenses;
  const estimatedTax = Math.max(0, netProfit * (taxRate / 100));
  const quarterlyPayment = estimatedTax / 4;
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const selfEmploymentTax = Math.max(0, netProfit * 0.153);

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Loading…
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Tax Estimates
        </h1>
        <p className="text-muted-foreground text-sm">
          Quarterly estimates and tax savings tracker for{" "}
          {new Date().getFullYear()}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Net Profit
              </p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              ${netProfit.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Income ${totalIncome.toLocaleString()} − Expenses $
              {totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Est. Annual Tax
              </p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              $
              {estimatedTax.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              At {taxRate}% effective rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Q{currentQuarter} Payment
              </p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              $
              {quarterlyPayment.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Due quarterly</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-info" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Self-Emp. Tax
              </p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              $
              {selfEmploymentTax.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              15.3% SE tax estimate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-serif font-semibold text-base mb-4">
            Tax Savings Progress
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            You should set aside{" "}
            <strong>
              $
              {estimatedTax.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </strong>{" "}
            this year for taxes.
          </p>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((q) => (
              <div key={q}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Q{q}</span>
                  <span className="font-medium tabular-nums">
                    $
                    {quarterlyPayment.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <Progress
                  value={
                    q < currentQuarter ? 100 : q === currentQuarter ? 50 : 0
                  }
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
