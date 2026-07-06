import { useAuth } from "@/hooks/auth-context";
import { useUpsertProfile } from "@/hooks/use-mutations";
import { useQuery } from "@tanstack/react-query";
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
import { PageLoader } from "@/components/PageLoader";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/lib/schemas";
import type { z } from "zod";
import { useEffect } from "react";

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const upsertProfile = useUpsertProfile(user?.id);

  const { data: profile, isLoading } = useQuery({
    queryKey: [user?.id, "profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      country: "US",
      tax_status: "self_employed",
      monthly_income_goal: 0,
      tax_saving_percent: 25,
      currency: "USD",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? "",
        country: profile.country ?? "US",
        tax_status: profile.tax_status ?? "self_employed",
        monthly_income_goal: Number(profile.monthly_income_goal) || 0,
        tax_saving_percent: Number(profile.tax_saving_percent) || 25,
        currency: profile.currency ?? "USD",
      });
    }
  }, [profile, reset]);

  const handleSave = async (data: ProfileForm) => {
    if (!user) return;
    try {
      await upsertProfile.mutateAsync(data);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and preferences.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-serif font-semibold text-base mb-4">Profile</h2>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input {...register("full_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (�)</SelectItem>
                        <SelectItem value="EUR">EUR (�)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Income Goal</Label>
                <Input type="number" min="0" step="100" placeholder="5000" {...register("monthly_income_goal")} />
                {errors.monthly_income_goal && (
                  <p className="text-sm text-destructive">{errors.monthly_income_goal.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tax Saving %</Label>
                <Input type="number" min="0" max="100" step="1" {...register("tax_saving_percent")} />
                {errors.tax_saving_percent && (
                  <p className="text-sm text-destructive">{errors.tax_saving_percent.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tax Status</Label>
              <Controller
                control={control}
                name="tax_status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
                )}
              />
            </div>
            <Button type="submit" disabled={upsertProfile.isPending}>
              {upsertProfile.isPending ? "Saving\u2026" : "Save Settings"}
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
