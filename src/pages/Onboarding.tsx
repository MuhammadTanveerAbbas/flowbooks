import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FlowBooksLogo } from "@/components/FlowBooksLogo";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Target,
  Users,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    num: 1,
    title: "Where are you based?",
    desc: "This helps us calculate your tax obligations correctly.",
    icon: MapPin,
  },
  {
    num: 2,
    title: "Set your income goals",
    desc: "We'll track your progress and help you budget smarter.",
    icon: Target,
  },
  {
    num: 3,
    title: "Add your first client",
    desc: "Optional  you can always add clients later.",
    icon: Users,
  },
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [country, setCountry] = useState("US");
  const [taxStatus, setTaxStatus] = useState("self_employed");
  const [currency, setCurrency] = useState("USD");

  // Step 2
  const [monthlyGoal, setMonthlyGoal] = useState("5000");
  const [taxPercent, setTaxPercent] = useState("25");

  // Step 3
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // First, try to update the profile
      const { data: updateData, error: profileError } = await supabase
        .from("profiles")
        .update({
          country,
          tax_status: taxStatus,
          currency,
          monthly_income_goal: parseFloat(monthlyGoal) || 0,
          tax_saving_percent: parseFloat(taxPercent) || 25,
          onboarding_complete: true,
        })
        .eq("id", user.id)
        .select();

      // If no rows were updated, the profile doesn't exist - create it
      if (!updateData || updateData.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            country,
            tax_status: taxStatus,
            currency,
            monthly_income_goal: parseFloat(monthlyGoal) || 0,
            tax_saving_percent: parseFloat(taxPercent) || 25,
            onboarding_complete: true,
          })
          .select();

        if (insertError) {
          toast.error("Failed to create profile: " + insertError.message);
          setSaving(false);
          return;
        }
      }

      if (profileError) {
        toast.error("Failed to save profile: " + profileError.message);
        setSaving(false);
        return;
      }

      if (clientName.trim()) {
        const { error: clientError } = await supabase.from("clients").insert({
          user_id: user.id,
          name: clientName.trim(),
          email: clientEmail.trim() || null,
          company: clientCompany.trim() || null,
        });

        if (clientError) {
          console.error("Failed to save client:", clientError);
          // Don't block onboarding if client creation fails
        }
      }

      // Refresh profile state and wait for it to complete
      await refreshProfile();

      toast.success("You're all set! Welcome to FlowBooks.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Onboarding error:", error);
      }
      toast.error("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <FlowBooksLogo size={40} />
          <span className="font-serif font-semibold text-xl">FlowBooks</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 px-4 justify-center">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
                  step > s.num
                    ? "bg-primary text-primary-foreground"
                    : step === s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 mx-2 rounded-full transition-colors ${
                    step > s.num ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            {/* Step header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const Icon = steps[step - 1].icon;
                  return (
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
                  );
                })()}
                <h2 className="font-serif text-xl font-semibold">
                  {steps[step - 1].title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {steps[step - 1].desc}
              </p>
            </div>

            <AnimatePresence mode="wait" custom={step}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  custom={1}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tax Status</Label>
                    <Select value={taxStatus} onValueChange={setTaxStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_employed">
                          Self-Employed / Freelancer
                        </SelectItem>
                        <SelectItem value="sole_trader">Sole Trader</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="ltd">Ltd Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  custom={1}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label>Monthly Income Goal</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      How much do you want to earn per month?
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tax Saving Percentage</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="pr-8"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(e.target.value)}
                        placeholder="25"
                        min="0"
                        max="60"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll use this to estimate your quarterly tax liability.
                      25% is a safe default for US freelancers.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  custom={1}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label>Client Name</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Client Email{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="contact@acme.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Company{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can skip this step and add clients anytime from the
                    Clients page.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="relative flex items-center justify-between mt-8 pt-4">
              {step > 1 ? (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <div />
              )}
              <div className="absolute left-1/2 -translate-x-1/2">
                {step < 3 ? (
                  <Button size="sm" onClick={handleNext}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleFinish} disabled={saving}>
                    {saving ? "Finishing…" : "Finish setup"}{" "}
                    {!saving && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
              <div />
            </div>
          </CardContent>
        </Card>

        {/* Skip */}
        {step === 3 && (
          <p className="text-center mt-4">
            <button
              onClick={handleFinish}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Skip and go to dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
