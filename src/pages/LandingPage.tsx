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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0faf4] via-background to-background dark:from-[#0a1a0f] dark:via-background">
        {/* Decorative background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-primary/20 via-emerald-400/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 -left-32 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left space-y-8"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Built for freelancers, not corporations
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-serif text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.08]"
              >
                Freelance finances,
                <span className="block mt-1">
                  <span className="relative inline-block bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                    made simpler.
                    {/* Wavy underline â€” inline so it matches text width */}
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        delay: 0.7,
                        duration: 0.9,
                        ease: "easeOut",
                      }}
                      viewBox="0 0 200 10"
                      preserveAspectRatio="none"
                      className="absolute -bottom-1.5 left-0 w-full h-2.5 overflow-visible"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="M0,5 C25,1 50,9 75,5 C100,1 125,9 150,5 C170,2 185,6 200,5"
                        fill="none"
                        stroke="url(#waveGrad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          delay: 0.7,
                          duration: 0.9,
                          ease: "easeOut",
                        }}
                      />
                      <defs>
                        <linearGradient
                          id="waveGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="100%"
                            stopColor="#2dd4bf"
                            stopOpacity="0.8"
                          />
                        </linearGradient>
                      </defs>
                    </motion.svg>
                  </span>
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                Track irregular income, estimate taxes, send invoices, and
                actually understand where your money goes all in one calm,
                focused tool.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                {!loading && user ? (
                  <Button
                    size="lg"
                    className="h-13 px-8 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="h-13 px-8 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                      onClick={() => navigate("/signup")}
                    >
                      Start for free <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 px-8 text-base rounded-xl border-2 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200"
                      onClick={() => navigate("/login")}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-1"
              >
                {[
                  { text: "No credit card" },
                  { text: "Free to start" },
                  { text: "5 min setup" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check
                        className="w-2.5 h-2.5 text-primary"
                        strokeWidth={3}
                      />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.25,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-teal-400/10 rounded-3xl blur-2xl scale-95 -z-10" />

              {/* Main card */}
              <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlowBooksLogo size={22} />
                    <span className="text-sm font-semibold">FlowBooks</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    June 2025
                  </span>
                </div>

                {/* Summary row */}
                <div className="px-6 py-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Net Profit
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold font-serif tracking-tight">
                      $8,450
                    </span>
                    <span className="mb-1 text-sm font-semibold text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> +23%
                    </span>
                  </div>
                </div>

                {/* Income / Expenses rows */}
                <div className="px-6 space-y-3 pb-5">
                  {[
                    {
                      label: "Income",
                      value: "+$9,200",
                      color: "text-emerald-600",
                      bg: "bg-emerald-50 dark:bg-emerald-950/40",
                      bar: "bg-emerald-400",
                      pct: "80%",
                    },
                    {
                      label: "Expenses",
                      value: "-$750",
                      color: "text-red-500",
                      bg: "bg-red-50 dark:bg-red-950/40",
                      bar: "bg-red-400",
                      pct: "10%",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={`rounded-xl px-4 py-3 ${row.bg}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {row.label}
                        </span>
                        <span className={`text-sm font-bold ${row.color}`}>
                          {row.value}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: row.pct }}
                          transition={{
                            delay: 0.8,
                            duration: 0.9,
                            ease: "easeOut",
                          }}
                          className={`h-full rounded-full ${row.bar}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sparkline chart */}
                <div className="h-28 px-2 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={incomeData}
                      margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id="heroLineGrad"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="100%"
                            stopColor="#2dd4bf"
                            stopOpacity={1}
                          />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="url(#heroLineGrad)"
                        strokeWidth={2.5}
                        dot={false}
                        strokeLinecap="round"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Floating invoice chip */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -left-6 top-1/3 hidden lg:flex items-center gap-2.5 bg-background border border-border shadow-xl rounded-xl px-4 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-none mb-0.5">
                    Invoice sent
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Acme Corp Â· $2,400
                  </p>
                </div>
              </motion.div>

              {/* Floating tax chip */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -right-4 bottom-16 hidden lg:flex items-center gap-2.5 bg-background border border-border shadow-xl rounded-xl px-4 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-none mb-0.5">
                    Q2 Tax estimate
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Set aside $1,690
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary mb-4"
            >
              <Zap className="w-3.5 h-3.5" /> Everything you need
            </motion.span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Built for freelancer workflows
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Every feature designed around how freelancers actually work â€”
              not adapted from enterprise software.
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
                <Card className="h-full group hover:shadow-lg hover:border-primary/20 transition-all duration-300 border-border/60">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                      <f.icon
                        className="w-5 h-5 text-primary"
                        strokeWidth={1.8}
                      />
                    </div>
                    <h3 className="font-serif font-semibold text-base mb-2 group-hover:text-primary transition-colors">
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
      <section id="how-it-works" className="py-20 md:py-28 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary mb-4"
            >
              <Check className="w-3.5 h-3.5" /> Simple setup
            </motion.span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground mt-3">
              Three steps and you're tracking your finances like a pro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center text-center"
              >
                {/* Step icon with number */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                    <step.icon
                      className="w-7 h-7 text-primary"
                      strokeWidth={1.6}
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="compare" className="bg-muted/30 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary mb-4"
            >
              <BarChart3 className="w-3.5 h-3.5" /> How we compare
            </motion.span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              How FlowBooks stacks up
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Purpose-built for freelancer workflows, not adapted from
              enterprise software.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto rounded-2xl border border-border shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="text-left px-5 py-4 font-serif font-semibold text-base w-[40%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center font-serif font-semibold text-primary bg-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <FlowBooksLogo size={20} />
                      FlowBooks
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
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
                    <td className="px-4 py-3.5 text-center bg-primary/[0.03]">
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
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            QuickBooks pricing based on publicly listed Simple Start plan as of
            2025.
          </p>
        </div>
      </section>

      {/* Financial Insights Preview */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary mb-4"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Live insights
            </motion.span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Your finances, at a glance
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Beautiful charts that update in real time â€” income trends,
              expense breakdowns, and profit margins all in one dashboard.
            </p>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              {
                label: "Monthly Income",
                value: "$6,100",
                change: "+23%",
                up: true,
              },
              { label: "Expenses", value: "$1,600", change: "-8%", up: false },
              {
                label: "Net Profit",
                value: "$4,500",
                change: "+31%",
                up: true,
              },
              {
                label: "Profit Margin",
                value: "73.8%",
                change: "+4pts",
                up: true,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="border-border/60 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold font-serif">{stat.value}</p>
                    <p
                      className={`text-xs font-semibold mt-1 ${stat.up ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {stat.change} vs last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <Card className="border-border/60 hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="mb-5">
                    <h3 className="font-serif font-semibold text-base">
                      Income vs Expenses
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      6-month overview
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        barGap={4}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`]}
                        />
                        <Bar
                          dataKey="income"
                          fill="hsl(var(--primary))"
                          name="Income"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="#f87171"
                          name="Expenses"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <Card className="border-border/60 hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="mb-5">
                    <h3 className="font-serif font-semibold text-base">
                      Expense Breakdown
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      By category this month
                    </p>
                  </div>
                  <div className="flex-1 flex items-center gap-6">
                    <div className="h-48 w-48 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "10px",
                              fontSize: 12,
                            }}
                            formatter={(v: number) => [`$${v}`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {expenseData.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold flex-shrink-0">
                            ${item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary mb-4"
            >
              <FileText className="w-3.5 h-3.5" /> FAQ
            </motion.span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground mt-3">
              Everything you need to know before getting started.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="border-border/60 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-5">
                    <h3 className="font-serif font-semibold text-base mb-2">
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
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-teal-500/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to take control?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Free to start. No credit card. Set up in 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!loading && user ? (
                <Button
                  size="lg"
                  className="h-12 px-8 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => navigate("/signup")}
                  >
                    Create free account <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base rounded-xl border-2 hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => navigate("/login")}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              {["No credit card", "Free to start", "5 min setup"].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                    <Check
                      className="w-2.5 h-2.5 text-primary"
                      strokeWidth={3}
                    />
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <FlowBooksLogo size={30} />
                <span className="font-serif font-semibold text-lg">
                  FlowBooks
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Financial clarity for freelancers. Track income, estimate taxes,
                and invoice clients — all in one place.
              </p>
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
