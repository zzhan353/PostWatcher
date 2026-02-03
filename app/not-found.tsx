import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground">页面未找到</p>
      <Link
        href="/"
        className="text-primary underline underline-offset-4 hover:no-underline"
      >
        返回首页
      </Link>
    </div>
  )
}
