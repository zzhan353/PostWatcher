import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Radar } from "lucide-react";
import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Radar className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Watcher</span>
            </Link>
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Email confirmed</CardTitle>
          <CardDescription className="text-center">
            Your account is ready. Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to sign in</Link>
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            If you already signed in, you can head to{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              the dashboard
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
