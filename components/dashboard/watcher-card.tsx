"use client";

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Briefcase,
  ShoppingCart,
  Home,
  TrendingUp,
  Share2,
  Newspaper,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface Watcher {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  source_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface WatcherCardProps {
  watcher: Watcher;
}

const categoryIcons: Record<string, React.ElementType> = {
  jobs: Briefcase,
  shopping: ShoppingCart,
  real_estate: Home,
  stocks: TrendingUp,
  social_media: Share2,
  news: Newspaper,
};

const categoryColors: Record<string, string> = {
  jobs: "text-blue-500 bg-blue-500/10",
  shopping: "text-green-500 bg-green-500/10",
  real_estate: "text-orange-500 bg-orange-500/10",
  stocks: "text-purple-500 bg-purple-500/10",
  social_media: "text-pink-500 bg-pink-500/10",
  news: "text-cyan-500 bg-cyan-500/10",
};

export function WatcherCard({ watcher }: WatcherCardProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(watcher.is_active);
  const [isUpdating, setIsUpdating] = useState(false);
  const Icon = categoryIcons[watcher.category] || Eye;
  const colorClass =
    categoryColors[watcher.category] || "text-muted-foreground bg-muted";

  const toggleActive = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    const newStatus = !isActive;

    const { error } = await supabase
      .from("watchers")
      .update({ is_active: newStatus })
      .eq("id", watcher.id);

    if (!error) {
      setIsActive(newStatus);
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.from("watchers").delete().eq("id", watcher.id);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{watcher.name}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {watcher.category.replace("_", " ")}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/watchers/${watcher.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {watcher.keywords && watcher.keywords.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Keywords</p>
              <div className="flex flex-wrap gap-1">
                {watcher.keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
                {watcher.keywords.length > 3 && (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    +{watcher.keywords.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {isActive ? "Active" : "Paused"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={toggleActive}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
