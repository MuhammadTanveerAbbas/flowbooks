import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    country: "US",
    tax_status: "self_employed",
    monthly_income_goal: "0",
    tax_saving_percent: "25",
    currency: "USD",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error && error.code !== "PGRST116") {
          if (import.meta.env.DEV) {
            console.error("Error fetching profile:", error);
          }
          toast.error("Failed to load profile");
        }

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            country: data.country || "US",
            tax_status: data.tax_status || "self_employed",
            monthly_income_goal: String(data.monthly_income_goal || 0),
            tax_saving_percent: String(data.tax_saving_percent || 25),
            currency: data.currency || "USD",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const monthlyGoal = parseFloat(profile.monthly_income_goal);
    const taxPercent = parseFloat(profile.tax_saving_percent);

    if (isNaN(monthlyGoal) || monthlyGoal < 0) {
      toast.error("Please enter a valid monthly income goal");
      return;
    }

    if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      toast.error("Tax saving percentage must be between 0 and 100");
      return;
    }

    setSaving(true);

    // Try to update first
    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        country: profile.country,
        tax_status: profile.tax_status,
        monthly_income_goal: monthlyGoal,
        tax_saving_percent: taxPercent,
        currency: profile.currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();

    // If no rows updated, create the profile
    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: profile.full_name,
        country: profile.country,
        tax_status: profile.tax_status,
        monthly_income_goal: monthlyGoal,
        tax_saving_percent: taxPercent,
        currency: profile.currency,
        onboarding_complete: true,
      });

      setSaving(false);
      if (insertError) {
        toast.error(insertError.message);
      } else {
        toast.success("Profile created successfully");
      }
      return;
    }

    setSaving(false);
    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Settings saved");
    }
  };

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
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, preferences, and billing.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-serif font-semibold text-base mb-4">Profile</h2>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select
                  value={profile.country}
                  onValueChange={(v) =>
                    setProfile((p) => ({ ...p, country: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={profile.currency}
                  onValueChange={(v) =>
                    setProfile((p) => ({ ...p, currency: v }))
                  }
                >
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Income Goal</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={profile.monthly_income_goal}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      monthly_income_goal: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tax Saving %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={profile.tax_saving_percent}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      tax_saving_percent: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tax Status</Label>
              <Select
                value={profile.tax_status}
                onValueChange={(v) =>
                  setProfile((p) => ({ ...p, tax_status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="sole_trader">Sole Trader</SelectItem>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="ltd">Ltd Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-serif font-semibold text-base mb-2">Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your FlowBooks account.
          </p>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
