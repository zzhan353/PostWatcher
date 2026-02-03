import React from "react"
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Bell,
  TrendingUp,
  Plus,
  Briefcase,
  ShoppingCart,
  Home,
  MessageSquare,
  Newspaper,
  Activity,
} from "lucide-react";
import Link from "next/link";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: watchers } = await supabase
    .from("watchers")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, watchers(name, category)")
    .eq("user_id", user?.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const activeWatchers = watchers?.filter((w) => w.is_active)?.length || 0;
  const totalAlerts = alerts?.length || 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user?.id)
    .single();

  const watcherLimit =
    profile?.subscription_tier === "free"
      ? 3
      : profile?.subscription_tier === "pro"
        ? 25
        : 999;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your watchers and recent alerts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/watchers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Watcher
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Watchers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWatchers}</div>
            <p className="text-xs text-muted-foreground">
              of {watcherLimit} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watchers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              new matches found
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {profile?.subscription_tier || "Free"}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/pricing" className="text-primary hover:underline">
                {profile?.subscription_tier === "free" ? "Upgrade" : "Manage"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Watchers</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/watchers">View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {watchers && watchers.length > 0 ? (
              <div className="space-y-4">
                {watchers.slice(0, 5).map((watcher) => {
                  const Icon = categoryIcons[watcher.category] || Eye;
                  const colorClass =
                    categoryColors[watcher.category] || "text-muted-foreground bg-muted";
                  return (
                    <div
                      key={watcher.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {watcher.name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {watcher.category.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          watcher.is_active
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {watcher.is_active ? "Active" : "Paused"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  No watchers yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first watcher to start monitoring
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/watchers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Watcher
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Alerts</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/alerts">View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const Icon =
                    categoryIcons[alert.watchers?.category || ""] || Bell;
                  const colorClass =
                    categoryColors[alert.watchers?.category || ""] ||
                    "text-muted-foreground bg-muted";
                  return (
                    <div key={alert.id} className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {alert.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {alert.watchers?.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  No alerts yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Alerts will appear here when watchers find matches
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
