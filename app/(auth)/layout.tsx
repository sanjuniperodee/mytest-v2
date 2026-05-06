import Link from "next/link"
import { Logo } from "@/components/landing/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="mytest — главная">
            <Logo />
            <span className="text-base font-semibold tracking-tight lowercase">mytest</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            На главную
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">{children}</main>
    </div>
  )
}
