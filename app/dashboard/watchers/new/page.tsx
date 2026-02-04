"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Briefcase,
  ShoppingCart,
  Home,
  TrendingUp,
  Share2,
  Newspaper,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  createWatcher,
  createWatcherFromPrompt,
  type WatcherCategory,
} from "@/app/actions/watchers"
import { Textarea } from "@/components/ui/textarea"

const categories = [
  { id: "jobs", label: "Jobs", icon: Briefcase, description: "Track job postings" },
  { id: "shopping", label: "Shopping", icon: ShoppingCart, description: "Monitor deals and prices" },
  { id: "real_estate", label: "Real Estate", icon: Home, description: "Watch property listings" },
  { id: "stocks", label: "Stocks", icon: TrendingUp, description: "Track price alerts" },
  { id: "social_media", label: "Social Media", icon: Share2, description: "Monitor posts and mentions" },
  { id: "news", label: "News", icon: Newspaper, description: "Follow news topics" },
] as const

export default function NewWatcherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [category, setCategory] = useState<WatcherCategory>("jobs")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(false)
  const [intervalDays, setIntervalDays] = useState(1)
  const [usePrompt, setUsePrompt] = useState(false)
  const [prompt, setPrompt] = useState("")

  function addKeyword() {
    const trimmed = keywordInput.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
      setKeywordInput("")
    }
  }

  function removeKeyword(keyword: string) {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (usePrompt && prompt.trim()) {
        await createWatcherFromPrompt(prompt.trim(), {
          notifyEmail,
          notifySms,
          sourceUrl: sourceUrl || undefined,
          notificationIntervalMinutes: Math.max(1, intervalDays) * 1440,
        })
      } else {
        await createWatcher({
          name,
          category,
          keywords,
          sourceUrl: sourceUrl || undefined,
          notifyEmail,
          notifySms,
          notificationIntervalMinutes: Math.max(1, intervalDays) * 1440,
        })
      }

      router.replace("/dashboard/watchers")
      router.refresh()
      setTimeout(() => {
        if (window.location.pathname.includes("/dashboard/watchers/new")) {
          window.location.assign("/dashboard/watchers")
        }
      }, 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/watchers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Watcher</h1>
          <p className="text-muted-foreground">
            Set up a new post watcher to monitor content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Give your watcher a name and select a category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Watcher Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior React Jobs in NYC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={usePrompt}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="usePrompt">Use description instead</Label>
                  <Switch checked={usePrompt} onCheckedChange={setUsePrompt} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Let AI generate name, category, and keywords from a description
                </p>
              </div>

              {usePrompt && (
                <div className="grid gap-2">
                  <Label htmlFor="prompt">Watcher Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Find senior React jobs in NYC paying over 160k, focus on remote-friendly roles."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    required={usePrompt}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                          category === cat.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setCategory(cat.id)}
                        disabled={usePrompt}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="font-medium text-sm">{cat.label}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {cat.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Criteria</CardTitle>
              <CardDescription>
                Add keywords to filter posts that match your interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="keywords">Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    id="keywords"
                    placeholder="Add a keyword and press Enter..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    disabled={usePrompt}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addKeyword}
                    disabled={usePrompt}
                  >
                    Add
                  </Button>
                </div>
                {keywords.length > 0 && !usePrompt && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add multiple keywords to narrow down your results
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
                <Input
                  id="sourceUrl"
                  placeholder="https://example.com/jobs"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Specify a URL to monitor, or leave empty to use our default sources
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose how you want to receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="intervalDays">Notification interval (days)</Label>
                <Input
                  id="intervalDays"
                  type="number"
                  min={1}
                  value={intervalDays}
                  onChange={(e) =>
                    setIntervalDays(Math.max(1, Number(e.target.value) || 1))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum once per day to save tokens
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email when new posts match
                  </p>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via SMS (requires Pro plan)
                  </p>
                </div>
                <Switch checked={notifySms} onCheckedChange={setNotifySms} />
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                (usePrompt ? !prompt.trim() : !name || keywords.length === 0)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Watcher"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
