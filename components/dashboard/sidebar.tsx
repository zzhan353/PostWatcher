"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  LayoutDashboard,
  Eye,
  Bell,
  Settings,
  CreditCard,
  Briefcase,
  ShoppingCart,
  Home,
  TrendingUp,
  MessageSquare,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  subscription_tier: string;
}

interface DashboardSidebarProps {
  user: User;
  profile: Profile | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Watchers", href: "/dashboard/watchers", icon: Eye },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const categories = [
  { name: "Jobs", icon: Briefcase, color: "text-blue-500" },
  { name: "Shopping", icon: ShoppingCart, color: "text-green-500" },
  { name: "Real Estate", icon: Home, color: "text-orange-500" },
  { name: "Stocks", icon: TrendingUp, color: "text-purple-500" },
  { name: "Social", icon: MessageSquare, color: "text-pink-500" },
  { name: "News", icon: Newspaper, color: "text-cyan-500" },
];

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Radar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Watcher</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-muted-foreground">
                  Categories
                </div>
                <ul className="-mx-2 mt-2 space-y-1">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <Link
                        href={`/dashboard/watchers?category=${category.name.toLowerCase()}`}
                        className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <category.icon
                          className={cn("h-5 w-5 shrink-0", category.color)}
                        />
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  href="/pricing"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <CreditCard className="h-5 w-5 shrink-0" />
                  {profile?.subscription_tier === "free" ? "Upgrade Plan" : "Manage Plan"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
