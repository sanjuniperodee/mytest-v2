"use client"

import { useState } from "react"
import useSWR from "swr"
import { Crown, Medal, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/api/auth-context"
import { resolveMediaUrl } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/api/types"

const LIMITS = [10, 50, 100] as const

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(50)
  const { data, isLoading } = useSWR<{ items?: LeaderboardEntry[] } | LeaderboardEntry[]>(
    `/leaderboard/ent?limit=${limit}`,
  )

  const items: LeaderboardEntry[] = Array.isArray(data)
    ? data
    : data && Array.isArray(data.items)
      ? data.items
      : []

  const myRank = items.find((it) => it.userId === user?.id)
  const podium = items.slice(0, 3)
  const rest = items.slice(3)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Лидерборд ЕНТ</h1>
        <p className="text-muted-foreground">
          Топ участников по лучшему результату пробного ЕНТ
        </p>
      </div>

      <div className="flex items-center justify-between">
        <ToggleGroup
          type="single"
          value={String(limit)}
          onValueChange={(v) => v && setLimit(Number(v) as (typeof LIMITS)[number])}
          className="border border-border rounded-md p-0.5 bg-card"
        >
          {LIMITS.map((l) => (
            <ToggleGroupItem
              key={l}
              value={String(l)}
              className="h-8 px-3 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              Топ {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {myRank && (
          <Badge variant="outline" className="bg-secondary">
            Ваш ранг: #{myRank.rank}
          </Badge>
        )}
      </div>

      {/* Podium */}
      {!isLoading && podium.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 0, 2].map((order) => {
            const entry = podium[order]
            if (!entry) return <div key={order} />
            return <PodiumCard key={entry.userId} entry={entry} highlight={entry.userId === user?.id} />
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Все участники</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0"
                >
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Пока нет результатов
            </div>
          ) : (
            <ul className="flex flex-col">
              {rest.map((entry) => (
                <LeaderRow key={entry.userId} entry={entry} highlight={entry.userId === user?.id} />
              ))}
              {rest.length === 0 && podium.length > 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Пока только участники топ-3
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PodiumCard({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  const initials = (entry.fullName || entry.username || "U").slice(0, 2).toUpperCase()
  const meta = (() => {
    if (entry.rank === 1) return { Icon: Crown, color: "text-amber-500", label: "1 место", height: "h-32" }
    if (entry.rank === 2) return { Icon: Trophy, color: "text-zinc-500", label: "2 место", height: "h-28" }
    return { Icon: Medal, color: "text-orange-500", label: "3 место", height: "h-24" }
  })()
  const { Icon, color, label, height } = meta

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        highlight ? "border-foreground" : "",
        entry.rank === 1 ? "sm:order-2" : entry.rank === 2 ? "sm:order-1" : "sm:order-3",
      )}
    >
      <CardContent className={cn("flex flex-col items-center gap-3 p-5", height)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("size-5", color)} />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <Avatar className="size-14">
          <AvatarImage src={resolveMediaUrl(entry.avatarUrl)} alt={initials} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="line-clamp-1 max-w-full text-sm font-medium">
            {entry.fullName || entry.username || "Аноним"}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{entry.bestScore}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderRow({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  const initials = (entry.fullName || entry.username || "U").slice(0, 2).toUpperCase()
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0",
        highlight && "bg-secondary",
      )}
    >
      <span className="w-7 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {entry.rank}
      </span>
      <Avatar className="size-9">
        <AvatarImage src={resolveMediaUrl(entry.avatarUrl)} alt={initials} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-sm font-medium">
          {entry.fullName || entry.username || "Аноним"}
          {highlight && <span className="ml-2 text-xs text-muted-foreground">(вы)</span>}
        </p>
        {entry.totalTests != null && (
          <p className="text-xs text-muted-foreground">{entry.totalTests} тестов</p>
        )}
      </div>
      <span className="text-base font-semibold tabular-nums">{entry.bestScore}</span>
    </li>
  )
}
