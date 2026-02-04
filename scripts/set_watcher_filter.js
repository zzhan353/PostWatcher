const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, "..", filename)
  if (!fs.existsSync(filePath)) return
  const contents = fs.readFileSync(filePath, "utf8")
  contents.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) return
    const index = trimmed.indexOf("=")
    if (index === -1) return
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvFile(".env.local")

const [watcherName, flagValue] = process.argv.slice(2)
if (!watcherName || !flagValue) {
  console.error(
    "Usage: node scripts/set_watcher_filter.js \"Watcher Name\" true|false",
  )
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)
const enabled = flagValue === "true"

async function run() {
  const { data, error } = await supabase
    .from("watchers")
    .select("id,name,filters")
    .eq("name", watcherName)
    .limit(1)
    .single()

  if (error || !data) {
    console.error(error || "Watcher not found")
    process.exit(1)
  }

  const filters = data.filters || {}
  const nextFilters = { ...filters, ignoreKeywordFilter: enabled }

  const { error: updateError } = await supabase
    .from("watchers")
    .update({ filters: nextFilters })
    .eq("id", data.id)

  if (updateError) {
    console.error(updateError)
    process.exit(1)
  }

  console.log("updated", data.name, "ignoreKeywordFilter:", enabled)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
