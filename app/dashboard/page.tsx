"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
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
import type { SessionListItem, UserStats } from "@/lib/api/types"

export default function DashboardHomePage() {
  const { user } = useAuth()
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Привет{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-muted-foreground">
          Готов к новому пробному ЕНТ? Продолжим там, где остановились.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Пройдено пробников"
          value={stats?.completedTests ?? 0}
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Средний балл"
          value={stats?.averageScore ?? "—"}
          loading={statsLoading}
        />
        <StatCard
          icon={Trophy}
          label="Лучший результат"
          value={stats?.bestScore ?? "—"}
          loading={statsLoading}
        />
        <StatCard
          icon={Flame}
          label="Серия дней"
          value={stats?.weeklyStreak ?? 0}
          loading={statsLoading}
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
                          {s.templateName || s.examTypeName || "Пробный тест"}
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
}: {
  icon: React.ElementType
  label: string
  value: string | number
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
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

