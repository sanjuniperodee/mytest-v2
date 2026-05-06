"use client"

import Link from "next/link"
import useSWR from "swr"
import { ArrowRight, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { ExamType } from "@/lib/api/types"

export default function ExamsPage() {
  const { data, isLoading } = useSWR<ExamType[]>("/exams/types")
  const items = Array.isArray(data) ? data : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Экзамены</h1>
        <p className="text-muted-foreground">
          Выберите тип экзамена, чтобы начать пробник
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Каталог экзаменов пока пуст
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ex) => (
            <Link
              key={ex.id}
              href={`/dashboard/exams/${ex.id}`}
              className="group"
            >
              <Card className="h-full transition-all hover:border-foreground/40 hover:shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-background">
                    <BookOpen className="size-5" />
                  </div>
                  <Badge variant="secondary">{ex.code || "EXAM"}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <CardTitle className="text-lg">{ex.name}</CardTitle>
                  {ex.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ex.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground/80 mt-auto">
                    Открыть
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
