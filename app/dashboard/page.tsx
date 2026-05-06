"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/api/auth-context"
import { localize, type Locale } from "@/lib/api/i18n"
import type { SessionListItem, UserStats } from "@/lib/api/types"

export default function DashboardHomePage() {
  const { user } = useAuth()
  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const userName = localize(user?.fullName, locale) || user?.username || ""
  const { data: stats, isLoading: statsLoading } = useSWR<UserStats>("/users/me/stats")
  const { data: sessions, isLoading: sessLoading } = useSWR<{ items: SessionListItem[] }>(
    "/tests/sessions?page=1&limit=5",
  )

  const items = (sessions as { items?: SessionListItem[] } | SessionListItem[] | undefined)
  const sessionList: SessionListItem[] = Array.isArray(items)
    ? items
    : items && Array.isArray(items.items)
      ? items.items
      : []

  const inProgress = sessionList.find((s) => s.status === "in_progress")

  return (
    <div className="flex flex-col gap-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3" />
              Готов к ЕНТ
            </span>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Привет{userName ? `, ${userName.split(" ")[0]}` : ""}.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Готов к новому пробному ЕНТ? Продолжим там, где остановились — каждая
              отработанная ошибка приближает к высокому баллу.
            </p>
          </div>
          {inProgress ? (
            <Button asChild size="lg" className="h-11 shrink-0">
              <Link href={`/exam/${inProgress.id}`}>
                Продолжить
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-11 shrink-0">
              <Link href="/dashboard/exams">
                <BookOpen className="size-4" />
                Начать пробник
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Пройдено пробников"
          value={stats?.completedTests ?? 0}
          loading={statsLoading}
          accent="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Средний балл"
          value={stats?.averageScore ?? "—"}
          loading={statsLoading}
          accent="blue"
        />
        <StatCard
          icon={Trophy}
          label="Лучший результат"
          value={stats?.bestScore ?? "—"}
          loading={statsLoading}
          accent="amber"
        />
        <StatCard
          icon={Flame}
          label="Серия дней"
          value={stats?.weeklyStreak ?? 0}
          loading={statsLoading}
          accent="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Последние пробники</CardTitle>
            <Link
              href="/dashboard/exams"
              className="text-sm font-medium text-foreground hover:underline inline-flex items-center gap-1"
            >
              Новый пробник <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {sessLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-5" />
              </div>
            ) : sessionList.length === 0 ? (
              <EmptySessions />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {sessionList.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={
                        s.status === "in_progress"
                          ? `/exam/${s.id}`
                          : `/exam/${s.id}/review`
                      }
                      className="flex items-center justify-between gap-4 py-3 hover:bg-secondary/40 -mx-2 px-2 rounded-md transition-colors"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="font-medium truncate">
                          {localize(s.templateName, locale) ||
                            localize(s.examTypeName, locale) ||
                            "Пробный тест"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.startedAt
                            ? new Date(s.startedAt).toLocaleString("ru-RU", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.totalScore != null && s.maxScore != null && (
                          <span className="text-sm font-semibold tabular-nums">
                            {s.totalScore}/{s.maxScore}
                          </span>
                        )}
                        <StatusBadge status={s.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Старт за минуту</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="h-11">
              <Link href="/dashboard/exams">
                <BookOpen className="size-4" />
                Выбрать пробный
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link href="/dashboard/mistakes">
                <Target className="size-4" />
                Работа над ошибками
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11">
              <Link href="/dashboard/leaderboard">
                <Trophy className="size-4" />
                Лидерборд ЕНТ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent = "default",
}: {
  icon: React.ElementType
  label: string
  value: string | number
  loading: boolean
  accent?: "default" | "emerald" | "blue" | "amber" | "orange"
}) {
  const accentMap: Record<string, string> = {
    default: "bg-secondary text-foreground",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
  }
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div
            className={`flex size-8 items-center justify-center rounded-md ${accentMap[accent]}`}
          >
            <Icon className="size-4" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {value}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: SessionListItem["status"] }) {
  const map: Record<SessionListItem["status"], { label: string; cls: string }> = {
    in_progress: { label: "В процессе", cls: "bg-amber-100 text-amber-900 border-amber-200" },
    completed: { label: "Завершён", cls: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    timed_out: { label: "Время вышло", cls: "bg-rose-100 text-rose-900 border-rose-200" },
    abandoned: { label: "Отменён", cls: "bg-muted text-muted-foreground border-border" },
  }
  const v = map[status]
  return (
    <Badge variant="outline" className={v.cls}>
      {v.label}
    </Badge>
  )
}

function EmptySessions() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <BookOpen className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">Пока нет пробников</p>
        <p className="text-sm text-muted-foreground">
          Запустите первый бесплатно — займёт 5 секунд
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/exams">Выбрать экзамен</Link>
      </Button>
    </div>
  )
}

