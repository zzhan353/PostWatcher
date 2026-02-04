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

const watcherName = process.argv.slice(2).join(" ").trim()
if (!watcherName) {
  console.error("Usage: node scripts/run_watcher_once.js \"Watcher Name\"")
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  const { data, error } = await supabase
    .from("watchers")
    .select("id,name,last_checked_at")
    .eq("name", watcherName)
    .limit(1)
    .single()

  if (error || !data) {
    console.error(error || "Watcher not found")
    process.exit(1)
  }

  console.log("watcher", data)

  const { error: updateError } = await supabase
    .from("watchers")
    .update({ last_checked_at: null })
    .eq("id", data.id)

  if (updateError) {
    console.error(updateError)
    process.exit(1)
  }

  console.log("reset ok")
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
