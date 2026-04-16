import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: "success" | "warning" | "default";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-serif font-semibold tracking-tight">
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              accent === "success"
                ? "bg-success/10 text-success"
                : accent === "warning"
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface IncomeRecord {
  amount: number;
  date: string;
  status: string;
  description: string;
}

interface ExpenseRecord {
  amount: number;
  date: string;
  description: string;
}

interface ProfileRecord {
  full_name: string | null;
  tax_saving_percent: number | null;
}

interface ActivityItem {
  desc: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    outstanding: 0,
    estTax: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [smoothedIncome, setSmoothedIncome] = useState(0);
  const [thisMonthIncome, setThisMonthIncome] = useState(0);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const sixMonthsAgo = format(subMonths(now, 6), "yyyy-MM-dd");
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");

    Promise.all([
      supabase
        .from("income")
        .select("amount, date, status, description")
        .eq("user_id", user.id)
        .gte("date", sixMonthsAgo)
        .order("date", { ascending: false }),
      supabase
        .from("expenses")
        .select("amount, date, description")
        .eq("user_id", user.id)
        .gte("date", sixMonthsAgo)
        .order("date", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ])
      .then(([incRes, expRes, profRes]) => {
        if (incRes.error || expRes.error || profRes.error) {
          if (import.meta.env.DEV) {
            console.error(
              "Dashboard data fetch error:",
              incRes.error || expRes.error || profRes.error,
            );
          }
          return;
        }
        const incomeData = (incRes.data || []) as IncomeRecord[];
        const expenseData = (expRes.data || []) as ExpenseRecord[];
        if (profRes.data) setProfile(profRes.data as ProfileRecord);

        // Stats
        const totalInvoiced = incomeData.reduce(
          (s: number, r: IncomeRecord) => s + Number(r.amount),
          0,
        );
        const totalPaid = incomeData
          .filter((r: IncomeRecord) => r.status === "paid")
          .reduce((s: number, r: IncomeRecord) => s + Number(r.amount), 0);
        const outstanding = totalInvoiced - totalPaid;
        const totalExp = expenseData.reduce(
          (s: number, r: ExpenseRecord) => s + Number(r.amount),
          0,
        );
        const taxRate = profRes.data?.tax_saving_percent || 25;
        const estTax =
          Math.max(0, (totalInvoiced - totalExp) * (taxRate / 100)) / 4;
        setStats({ totalInvoiced, totalPaid, outstanding, estTax });

        // Smoothed income (3-month)
        const threeMonthsAgoStr = format(subMonths(now, 3), "yyyy-MM-dd");
        const recentIncome = incomeData.filter(
          (r: IncomeRecord) => r.date >= threeMonthsAgoStr,
        );
        const avg =
          recentIncome.length > 0
            ? recentIncome.reduce(
                (s: number, r: IncomeRecord) => s + Number(r.amount),
                0,
              ) / 3
            : 0;
        setSmoothedIncome(Math.round(avg));

        const thisMonth = incomeData.filter(
          (r: IncomeRecord) => r.date >= thisMonthStart,
        );
        setThisMonthIncome(
          thisMonth.reduce(
            (s: number, r: IncomeRecord) => s + Number(r.amount),
            0,
          ),
        );

        // Chart data by month
        const months: Record<string, { income: number; expenses: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const m = format(subMonths(now, i), "MMM");
          months[m] = { income: 0, expenses: 0 };
        }
        incomeData.forEach((r: IncomeRecord) => {
          const m = format(new Date(r.date), "MMM");
          if (months[m]) months[m].income += Number(r.amount);
        });
        expenseData.forEach((r: ExpenseRecord) => {
          const m = format(new Date(r.date), "MMM");
          if (months[m]) months[m].expenses += Number(r.amount);
        });
        setChartData(
          Object.entries(months).map(([month, d]) => ({ month, ...d })),
        );

        // Recent activity
        const allActivity: ActivityItem[] = [
          ...incomeData.slice(0, 5).map((r: IncomeRecord) => ({
            desc: r.description,
            amount: Number(r.amount),
            date: r.date,
            type: "income" as const,
          })),
          ...expenseData.slice(0, 5).map((r: ExpenseRecord) => ({
            desc: r.description,
            amount: -Number(r.amount),
            date: r.date,
            type: "expense" as const,
          })),
        ]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 5);
        setRecentActivity(allActivity);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Dashboard error:", error);
        }
      });
  }, [user]);

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          {greeting}
          {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's how your freelance finances look this month.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Smoothed Monthly Income
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-serif font-bold tracking-tight">
                ${smoothedIncome.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                3-month average
              </span>
            </div>
          </div>
          <div className="h-px md:h-12 md:w-px bg-border" />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Actual This Month
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-semibold tracking-tight">
                ${thisMonthIncome.toLocaleString()}
              </span>
              {thisMonthIncome < smoothedIncome ? (
                <span className="text-xs text-warning font-medium flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> below average
                </span>
              ) : (
                <span className="text-xs text-success font-medium flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> above average
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Invoiced"
          value={`$${stats.totalInvoiced.toLocaleString()}`}
          icon={FileText}
        />
        <StatCard
          label="Paid"
          value={`$${stats.totalPaid.toLocaleString()}`}
          sub={
            stats.totalInvoiced > 0
              ? `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}% collected`
              : ""
          }
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="Outstanding"
          value={`$${stats.outstanding.toLocaleString()}`}
          icon={Clock}
          accent="warning"
        />
        <StatCard
          label="Est. Quarterly Tax"
          value={`$${stats.estTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`Q${Math.ceil((new Date().getMonth() + 1) / 3)}`}
          icon={AlertTriangle}
          accent="warning"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-5 md:p-6">
            <h2 className="font-serif font-semibold text-base mb-4">
              Income vs Expenses
            </h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(40, 16%, 88%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "hsl(200, 8%, 52%)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "hsl(200, 8%, 52%)" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(40, 16%, 88%)",
                      fontSize: "13px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="hsl(152, 28%, 38%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="hsl(28, 60%, 52%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5 md:p-6">
            <h2 className="font-serif font-semibold text-base mb-4">
              Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Add income or expenses to see them here.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{t.desc}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.date), "MMM d")}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium tabular-nums whitespace-nowrap ${t.amount > 0 ? "text-success" : "text-foreground"}`}
                    >
                      {t.amount > 0 ? "+" : ""}$
                      {Math.abs(t.amount).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
