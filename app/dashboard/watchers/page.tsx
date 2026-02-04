import React from "react"
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { WatcherCard } from "@/components/dashboard/watcher-card";

interface SearchParams {
  category?: string;
}

export default async function WatchersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("watchers")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  if (params?.category) {
    query = query.eq("category", params.category);
  }

  const { data: watchers } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Watchers</h1>
          <p className="text-muted-foreground">
            {params?.category
              ? `Viewing ${params.category.replace("_", " ")} watchers`
              : "Manage all your post watchers"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/watchers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Watcher
          </Link>
        </Button>
      </div>

      {params?.category && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/watchers">Clear filter</Link>
        </Button>
      )}

      {watchers && watchers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchers.map((watcher) => (
            <WatcherCard
              key={watcher.id}
              watcher={watcher}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Eye className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No watchers found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {params?.category
                ? `You haven't created any ${params.category.replace("_", " ")} watchers yet.`
                : "Create your first watcher to start monitoring posts for jobs, deals, real estate, and more."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/watchers/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Watcher
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
