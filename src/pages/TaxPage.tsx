import { useAuth } from "@/hooks/auth-context";
import { PageLoader } from "@/components/PageLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useYearIncome, useYearExpenses, useProfile } from "@/hooks/use-queries";
import { Calculator, PiggyBank, TrendingUp, AlertTriangle } from "lucide-react";

export default function TaxPage() {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const { data: incomeData, isLoading: incLoading } = useYearIncome(user?.id, year);
  const { data: expenseData, isLoading: expLoading } = useYearExpenses(user?.id, year);
  const { data: profile, isLoading: profLoading } = useProfile(user?.id);

  if (incLoading || expLoading || profLoading) return <PageLoader />;

  const totalIncome = (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const taxRate = profile?.tax_saving_percent ? Number(profile.tax_saving_percent) : 25;
  const netProfit = totalIncome - totalExpenses;
  const estimatedTax = Math.max(0, netProfit * (taxRate / 100));
  const quarterlyPayment = estimatedTax / 4;
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const selfEmploymentTax = Math.max(0, netProfit * 0.153);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Tax Estimates
        </h1>
        <p className="text-muted-foreground text-sm">
          Quarterly estimates and tax savings tracker for {year}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Profit</p>
            </div>
            <p className="text-2xl font-serif font-semibold">${netProfit.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Income ${totalIncome.toLocaleString()} \u2212 Expenses ${totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Est. Annual Tax</p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              ${estimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">At {taxRate}% effective rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Q{currentQuarter} Payment</p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              ${quarterlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Due quarterly</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-info" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Self-Emp. Tax</p>
            </div>
            <p className="text-2xl font-serif font-semibold">
              ${selfEmploymentTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">15.3% SE tax estimate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-serif font-semibold text-base mb-4">Tax Savings Progress</h2>
          <p className="text-sm text-muted-foreground mb-3">
            You should set aside{" "}
            <strong>
              ${estimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>{" "}
            this year for taxes.
          </p>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((q) => (
              <div key={q}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Q{q}</span>
                  <span className="font-medium tabular-nums">
                    ${quarterlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <Progress value={q < currentQuarter ? 100 : q === currentQuarter ? 50 : 0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
