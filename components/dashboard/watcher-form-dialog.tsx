"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  ShoppingCart,
  Home,
  TrendingUp,
  Share2,
  Newspaper,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  createWatcher,
  createWatcherFromPrompt,
  updateWatcher,
  type WatcherCategory,
  type CreateWatcherInput,
} from "@/app/actions/watchers"
import { Textarea } from "@/components/ui/textarea"

const categories = [
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "shopping", label: "Shopping", icon: ShoppingCart },
  { id: "real_estate", label: "Real Estate", icon: Home },
  { id: "stocks", label: "Stocks", icon: TrendingUp },
  { id: "social_media", label: "Social Media", icon: Share2 },
  { id: "news", label: "News", icon: Newspaper },
] as const

interface WatcherFormDialogProps {
  trigger?: React.ReactNode
  watcher?: {
    id: string
    name: string
    category: WatcherCategory
    keywords: string[]
    source_url?: string | null
    notification_email: boolean
    notification_push: boolean
    notification_interval_minutes?: number | null
  }
  onSuccess?: () => void
}

export function WatcherFormDialog({
  trigger,
  watcher,
  onSuccess,
}: WatcherFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(watcher?.name || "")
  const [category, setCategory] = useState<WatcherCategory>(
    watcher?.category || "jobs"
  )
  const [keywords, setKeywords] = useState<string[]>(watcher?.keywords || [])
  const [keywordInput, setKeywordInput] = useState("")
  const [sourceUrl, setSourceUrl] = useState(watcher?.source_url || "")
  const [notifyEmail, setNotifyEmail] = useState(
    watcher?.notification_email ?? true
  )
  const [notifySms, setNotifySms] = useState(
    watcher?.notification_push ?? false
  )
  const [intervalDays, setIntervalDays] = useState(
    Math.max(
      1,
      Math.round((watcher?.notification_interval_minutes ?? 1440) / 1440),
    ),
  )
  const [usePrompt, setUsePrompt] = useState(false)
  const [prompt, setPrompt] = useState("")

  const isEditing = !!watcher

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
      if (isEditing) {
        const input: CreateWatcherInput = {
          name,
          category,
          keywords,
          sourceUrl: sourceUrl || undefined,
          notifyEmail,
          notifySms,
          notificationIntervalMinutes: Math.max(1, intervalDays) * 1440,
        }
        await updateWatcher({ id: watcher.id, ...input })
      } else if (usePrompt && prompt.trim()) {
        await createWatcherFromPrompt(prompt.trim(), {
          notifyEmail,
          notifySms,
          sourceUrl: sourceUrl || undefined,
          notificationIntervalMinutes: Math.max(1, intervalDays) * 1440,
        })
      } else {
        const input: CreateWatcherInput = {
          name,
          category,
          keywords,
          sourceUrl: sourceUrl || undefined,
          notifyEmail,
          notifySms,
          notificationIntervalMinutes: Math.max(1, intervalDays) * 1440,
        }
        await createWatcher(input)
      }

      setOpen(false)
      router.refresh()
      onSuccess?.()

      if (!isEditing) {
        setName("")
        setCategory("jobs")
        setKeywords([])
        setSourceUrl("")
        setNotifyEmail(true)
        setNotifySms(false)
        setIntervalDays(1)
        setUsePrompt(false)
        setPrompt("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Watcher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Watcher" : "Create New Watcher"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your watcher settings"
                : "Set up a new post watcher to monitor content"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Watcher Name</Label>
              <Input
                id="name"
                placeholder="e.g., Senior React Jobs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="usePrompt">Use description instead</Label>
                  <Switch checked={usePrompt} onCheckedChange={setUsePrompt} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Let AI generate name, category, and keywords from a description
                </p>
              </div>
            )}

            {!isEditing && usePrompt && (
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
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={category === cat.id ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                      onClick={() => setCategory(cat.id)}
                      disabled={usePrompt}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{cat.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keywords">Keywords</Label>
              <div className="flex gap-2">
                <Input
                  id="keywords"
                  placeholder="Add a keyword..."
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
                      className="flex items-center gap-1"
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
                Specify a URL to monitor, or leave empty to use our default
                sources
              </p>
            </div>

            <div className="space-y-4">
              <Label>Notifications</Label>
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
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts via SMS (Pro plan)
                  </p>
                </div>
                <Switch checked={notifySms} onCheckedChange={setNotifySms} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Watcher"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
