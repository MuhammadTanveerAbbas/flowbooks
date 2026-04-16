import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  ArrowRight,
  BarChart3,
  Receipt,
  Users,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  FileText,
  ChevronRight,
  Mail,
  Github,
  Twitter,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

// Income trends data
const incomeData = [
  { month: "Jan", income: 3200, goal: 5000 },
  { month: "Feb", income: 4100, goal: 5000 },
  { month: "Mar", income: 3800, goal: 5000 },
  { month: "Apr", income: 5200, goal: 5000 },
  { month: "May", income: 6100, goal: 5000 },
  { month: "Jun", income: 5800, goal: 5000 },
];

// Expense breakdown data
const expenseData = [
  { name: "Software & Tools", value: 320, color: "#3b82f6" },
  { name: "Equipment", value: 450, color: "#8b5cf6" },
  { name: "Office Supplies", value: 180, color: "#ec4899" },
  { name: "Professional Services", value: 290, color: "#f59e0b" },
  { name: "Other", value: 160, color: "#10b981" },
];

// Monthly comparison data
const monthlyData = [
  { month: "Jan", income: 3200, expenses: 980 },
  { month: "Feb", income: 4100, expenses: 1120 },
  { month: "Mar", income: 3800, expenses: 950 },
  { month: "Apr", income: 5200, expenses: 1400 },
  { month: "May", income: 6100, expenses: 1600 },
  { month: "Jun", income: 5800, expenses: 1550 },
];

const features = [
  {
    icon: BarChart3,
    title: "Smoothed Income",
    desc: "See your rolling 3-month average to budget through feast-or-famine cycles.",
  },
  {
    icon: Receipt,
    title: "Smart Expenses",
    desc: "Categorize spending, upload receipts, and spot tax deductions automatically.",
  },
  {
    icon: Users,
    title: "Client Hub",
    desc: "Track every client relationship, project, and outstanding invoice in one view.",
  },
  {
    icon: Shield,
    title: "Tax Estimates",
    desc: "Real-time quarterly tax projections with US & UK self-employment support.",
  },
  {
    icon: Zap,
    title: "One-Click Invoices",
    desc: "Build professional invoices, send them, and mark paid  synced to your income.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    desc: "Work with international clients? Set manual exchange rates per transaction.",
  },
];

const steps = [
  {
    num: "01",
    icon: Mail,
    title: "Create your account",
    desc: "Sign up with email or Google. No credit card required.",
  },
  {
    num: "02",
    icon: TrendingUp,
    title: "Connect your income",
    desc: "Add clients, log payments, and start seeing your smoothed income picture.",
  },
  {
    num: "03",
    icon: FileText,
    title: "Invoice & track",
    desc: "Send invoices, categorize expenses, and let FlowBooks handle the math.",
  },
];

// Comparison table data
type CellValue = boolean | string;

const comparisonRows: {
  feature: string;
  flowbooks: CellValue;
  spreadsheets: CellValue;
  quickbooks: CellValue;
}[] = [
  {
    feature: "Freelancer-focused design",
    flowbooks: true,
    spreadsheets: false,
    quickbooks: false,
  },
  {
    feature: "Smoothed income view",
    flowbooks: true,
    spreadsheets: false,
    quickbooks: false,
  },
  {
    feature: "Quarterly tax estimates",
    flowbooks: true,
    spreadsheets: "Manual",
    quickbooks: true,
  },
  {
    feature: "Invoice creation",
    flowbooks: true,
    spreadsheets: "Manual",
    quickbooks: true,
  },
  {
    feature: "Client & project CRM",
    flowbooks: true,
    spreadsheets: "Manual",
    quickbooks: true,
  },
  {
    feature: "Expense tracking",
    flowbooks: true,
    spreadsheets: "Manual",
    quickbooks: true,
  },
  {
    feature: "Multi-currency support",
    flowbooks: true,
    spreadsheets: "Manual",
    quickbooks: true,
  },
  {
    feature: "Setup time",
    flowbooks: "< 5 min",
    spreadsheets: "Hours",
    quickbooks: "Days",
  },
  {
    feature: "Learning curve",
    flowbooks: "Minimal",
    spreadsheets: "Medium",
    quickbooks: "High",
  },
  {
    feature: "Price",
    flowbooks: "Free to start",
    spreadsheets: "Free",
    quickbooks: "$30+/mo",
  },
];

const faqs = [
  {
    q: "Is FlowBooks free to use?",
    a: "Yes  FlowBooks is free to start. Sign up, run the onboarding wizard, and start tracking income and expenses immediately with no credit card required.",
  },
  {
    q: "Does FlowBooks replace my accountant?",
    a: "FlowBooks complements your accountant by keeping your records organized. We don't file taxes for you, but we make tax season painless.",
  },
  {
    q: "Is my financial data secure?",
    a: "Your data is encrypted at rest and in transit via Supabase (built on AWS). Row-level security ensures only you can access your records.",
  },
  {
    q: "Do you support currencies outside USD?",
    a: "Yes  multi-currency is supported with manual exchange rates per transaction, so you can work with international clients.",
  },
  {
    q: "Can I export my data?",
    a: "CSV export is on the roadmap. In the meantime, all your data lives in your own Supabase project and can be accessed directly.",
  },
];

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === true)
    return <Check className="w-5 h-5 text-primary mx-auto" strokeWidth={2.5} />;
  if (value === false)
    return (
      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" strokeWidth={2} />
    );
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <FlowBooksLogo size={32} />
            <span className="font-serif font-semibold text-lg">FlowBooks</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#compare"
              className="hover:text-foreground transition-colors"
            >
              Compare
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>
                <Button size="sm" onClick={() => navigate("/signup")}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            Built for freelancers, not corporations
          </motion.div>
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-serif text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            Freelance finances,
            <br />
            <span className="text-primary">made simpler</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto"
          >
            Track irregular income, estimate taxes, send invoices, and actually
            understand where your money goes all in one calm, focused tool.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            {!loading && user ? (
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/signup")}>
                  Start for free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/40 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Built for freelancer workflows
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Core features designed specifically for freelancers and solo
              consultants.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon
                        className="w-5 h-5 text-primary"
                        strokeWidth={1.8}
                      />
                    </div>
                    <h3 className="font-serif font-semibold text-base mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Get started quickly
            </h2>
            <p className="text-muted-foreground mt-3">
              Three simple steps to begin tracking your finances.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center md:text-left"
              >
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="font-serif text-4xl font-bold text-primary/20">
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon
                      className="w-5 h-5 text-primary"
                      strokeWidth={1.8}
                    />
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-5 top-6 w-5 h-5 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="compare" className="bg-muted/40 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              How FlowBooks stacks up
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Purpose-built for freelancer workflows, not adapted from
              enterprise software.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="text-left px-5 py-4 font-serif font-semibold text-base w-[40%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center font-serif font-semibold text-primary">
                    <div className="flex flex-col items-center gap-1">
                      <FlowBooksLogo size={20} />
                      FlowBooks
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      {/* Google Sheets official icon */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M28 4H10C7.8 4 6 5.8 6 8v32c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V20L28 4z"
                          fill="#23A566"
                        />
                        <path d="M28 4v16h16L28 4z" fill="#1C8C54" />
                        <rect
                          x="14"
                          y="24"
                          width="20"
                          height="2.5"
                          rx="1"
                          fill="white"
                        />
                        <rect
                          x="14"
                          y="29"
                          width="20"
                          height="2.5"
                          rx="1"
                          fill="white"
                        />
                        <rect
                          x="14"
                          y="34"
                          width="12"
                          height="2.5"
                          rx="1"
                          fill="white"
                        />
                      </svg>
                      Spreadsheets
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                      {/* QuickBooks official icon */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="24" cy="24" r="22" fill="#2CA01C" />
                        <path
                          d="M14 24c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10H12v-4h2.34A9.96 9.96 0 0 1 14 24z"
                          fill="white"
                        />
                        <circle cx="24" cy="24" r="4" fill="#2CA01C" />
                      </svg>
                      QuickBooks
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell value={row.flowbooks} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell value={row.spreadsheets} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell value={row.quickbooks} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            QuickBooks pricing based on publicly listed Simple Start plan as of
            2025.
          </p>
        </div>
      </section>

      {/* Income & Expense Analytics Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Visualize your financial health
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Interactive charts and real-time insights to understand your
              income patterns and spending habits.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Income Trends Chart */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="font-serif font-semibold text-lg mb-1">
                      Income vs Goals
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Track your monthly income against your targets
                    </p>
                  </div>
                  <div className="w-full h-80 -mx-4 md:-mx-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={incomeData}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="month"
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Actual Income"
                        />
                        <Line
                          type="monotone"
                          dataKey="goal"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: "hsl(var(--muted-foreground))", r: 4 }}
                          name="Income Goal"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expense Breakdown Chart */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="font-serif font-semibold text-lg mb-1">
                      Expense Breakdown
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      See where your money goes at a glance
                    </p>
                  </div>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={false}
                          outerRadius={90}
                          innerRadius={0}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `$${value}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(
                            value,
                            entry: { payload: { value: number } },
                          ) => `${value}: $${entry.payload.value}`}
                          wrapperStyle={{ fontSize: "13px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Income vs Expenses Comparison */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mt-8"
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="font-serif font-semibold text-lg mb-1">
                    Income vs Expenses
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monthly comparison to track your profitability
                  </p>
                </div>
                <div className="w-full h-80 -mx-4 md:-mx-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="hsl(var(--primary))"
                        name="Income"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        fill="hsl(var(--destructive))"
                        name="Expenses"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground mt-3">
              Everything you need to know before getting started.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-serif font-semibold text-sm mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/40 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
            Ready to take control?
          </h2>
          <p className="text-muted-foreground mt-3">
            Free to start. No credit card required.
          </p>
          {!loading && user ? (
            <Button
              size="lg"
              className="mt-8"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="mt-8"
              onClick={() => navigate("/signup")}
            >
              Create your free account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
          {/* Top grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <FlowBooksLogo size={30} />
                <span className="font-serif font-semibold text-lg">
                  FlowBooks
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Financial clarity for freelancers. Track income, estimate taxes,
                and invoice clients all in one place.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://github.com/MuhammadTanveerAbbas/flowbooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/themvpguy"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://themvpguy.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Portfolio"
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* App links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                App
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Income", href: "/income" },
                  { label: "Expenses", href: "/expenses" },
                  { label: "Invoices", href: "/invoices" },
                  { label: "Tax", href: "/tax" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Manage links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Manage
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Clients", href: "/clients" },
                  { label: "Projects", href: "/projects" },
                  { label: "Settings", href: "/settings" },
                  { label: "Sign up", href: "/signup" },
                  { label: "Sign in", href: "/login" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Built by */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Built by
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Portfolio", href: "https://themvpguy.vercel.app" },
                  {
                    label: "GitHub",
                    href: "https://github.com/MuhammadTanveerAbbas",
                  },
                  { label: "Twitter / X", href: "https://x.com/themvpguy" },
                  {
                    label: "LinkedIn",
                    href: "https://linkedin.com/in/muhammadtanveerabbas",
                  },
                  {
                    label: "Source code",
                    href: "https://github.com/MuhammadTanveerAbbas/flowbooks",
                  },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} FlowBooks. MIT License.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with ♥ by{" "}
              <a
                href="https://themvpguy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                Muhammad Tanveer Abbas
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
