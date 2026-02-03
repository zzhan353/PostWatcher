import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} email={user?.email || ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">
                  {profile?.subscription_tier || "Free"} Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.subscription_tier === "free"
                    ? "Limited to 3 watchers"
                    : profile?.subscription_tier === "pro"
                      ? "Up to 25 watchers with email alerts"
                      : "Unlimited watchers with priority support"}
                </p>
              </div>
              <a
                href="/pricing"
                className="text-sm text-primary hover:underline"
              >
                {profile?.subscription_tier === "free" ? "Upgrade" : "Manage"}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
