import React from "react"
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  Briefcase,
  ShoppingCart,
  Home,
  TrendingUp,
  MessageSquare,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { AlertCard } from "@/components/dashboard/alert-card";

const categoryIcons: Record<string, React.ElementType> = {
  jobs: Briefcase,
  shopping: ShoppingCart,
  real_estate: Home,
  stocks: TrendingUp,
  social: MessageSquare,
  news: Newspaper,
};

const categoryColors: Record<string, string> = {
  jobs: "text-blue-500 bg-blue-500/10",
  shopping: "text-green-500 bg-green-500/10",
  real_estate: "text-orange-500 bg-orange-500/10",
  stocks: "text-purple-500 bg-purple-500/10",
  social: "text-pink-500 bg-pink-500/10",
  news: "text-cyan-500 bg-cyan-500/10",
};

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, watchers(name, category)")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  const unreadCount = alerts?.filter((a) => !a.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0
            ? `You have ${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
            : "All caught up! No new alerts."}
        </p>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              icon={categoryIcons[alert.watchers?.category || ""] || Bell}
              colorClass={
                categoryColors[alert.watchers?.category || ""] ||
                "text-muted-foreground bg-muted"
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No alerts yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              When your watchers find matching posts, alerts will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
