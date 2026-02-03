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
  updateWatcher,
  type WatcherCategory,
  type CreateWatcherInput,
} from "@/app/actions/watchers"

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
    notify_email: boolean
    notify_sms: boolean
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
  const [notifyEmail, setNotifyEmail] = useState(watcher?.notify_email ?? true)
  const [notifySms, setNotifySms] = useState(watcher?.notify_sms ?? false)

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
      const input: CreateWatcherInput = {
        name,
        category,
        keywords,
        sourceUrl: sourceUrl || undefined,
        notifyEmail,
        notifySms,
      }

      if (isEditing) {
        await updateWatcher({ id: watcher.id, ...input })
      } else {
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
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
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
            <Button type="submit" disabled={loading || !name || keywords.length === 0}>
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
