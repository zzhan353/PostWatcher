"use client";

import React from "react"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  is_read: boolean;
  created_at: string;
  watchers: {
    name: string;
    category: string;
  } | null;
}

interface AlertCardProps {
  alert: Alert;
  icon: React.ElementType;
  colorClass: string;
}

export function AlertCard({ alert, icon: Icon, colorClass }: AlertCardProps) {
  const router = useRouter();
  const [isRead, setIsRead] = useState(alert.is_read);

  const markAsRead = async () => {
    if (isRead) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", alert.id);

    if (!error) {
      setIsRead(true);
    }
  };

  return (
    <Card className={!isRead ? "border-l-4 border-l-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">{alert.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  From: {alert.watchers?.name || "Unknown watcher"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(alert.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {alert.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {alert.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              {alert.source_url && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={alert.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Post
                  </a>
                </Button>
              )}
              {!isRead && (
                <Button variant="ghost" size="sm" onClick={markAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
