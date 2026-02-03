"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  subscription_tier: string;
}

interface ProfileFormProps {
  profile: Profile | null;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile?.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 text-sm rounded-md ${
            message.type === "success"
              ? "bg-accent/10 text-accent"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
