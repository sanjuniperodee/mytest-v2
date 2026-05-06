"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Crown,
  Lightbulb,
  Trophy,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Logo } from "@/components/landing/logo"
import { QuestionMedia } from "@/components/exam/question-media"
import { api, ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/api/auth-context"
import { localize, type Locale } from "@/lib/api/i18n"
import { cn } from "@/lib/utils"
import type { ReviewResponse, ReviewSection } from "@/lib/api/types"

interface ExplanationData {
  questionId: string
  explanation: unknown
  imageUrls?: string[]
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const { user } = useAuth()
  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const { data, isLoading, error } = useSWR<ReviewResponse>(
    `/tests/sessions/${sessionId}/review`,
  )

  const sections: ReviewSection[] = useMemo(() => {
    if (!data) return []
    return data.sections || []
  }, [data])

  const overallCorrect = data?.correctCount ?? 0
  const overallTotal = data?.totalQuestions ?? sections.reduce((s, sec) => s + (sec.totalCount ?? sec.questions.length), 0)
  const accuracy = overallTotal ? Math.round((overallCorrect / overallTotal) * 100) : 0

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-semibold lowercase">mytest</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />К панели
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:py-8">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-semibold">Не удалось загрузить разбор</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as ApiError).message || "Попробуйте позже"}
              </p>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* Score summary */}
            <Card className="overflow-hidden">
              <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Результат
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-semibold tabular-nums">
                      {data.totalScore ?? overallCorrect}
                    </span>
                    <span className="text-xl text-muted-foreground tabular-nums">
                      / {data.maxScore ?? overallTotal}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={accuracy} className="max-w-xs" />
                    <span className="text-sm font-medium tabular-nums">{accuracy}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Правильных ответов: {overallCorrect} из {overallTotal}
                  </p>
                </div>
                <div className="flex size-24 items-center justify-center rounded-full bg-foreground text-background">
                  <Trophy className="size-10" />
                </div>
              </CardContent>
            </Card>

            {/* Section breakdown */}
            {sections.length > 1 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((sec) => {
                  const total = sec.totalCount ?? sec.questions.length
                  const correct = sec.correctCount ?? 0
                  const pct = total ? Math.round((correct / total) * 100) : 0
                  const title = localize(sec.subjectName, locale) || localize(sec.title, locale) || "Раздел"
                  return (
                    <Card key={sec.id}>
                      <CardContent className="flex flex-col gap-2 p-4">
                        <p className="text-sm font-medium">{title}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-semibold tabular-nums">
                            {correct}/{total}
                          </span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <Progress value={pct} />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Sections + questions */}
            {sections.map((sec) => {
              const sectionTitle =
                localize(sec.subjectName, locale) || localize(sec.title, locale) || "Раздел"
              return (
                <section key={sec.id}>
                  <h2 className="mb-3 text-lg font-semibold">{sectionTitle}</h2>
                  <Accordion type="multiple" className="flex flex-col gap-2">
                    {sec.questions.map((q, idx) => {
                      const qText = localize(q.text, locale)
                      const qSubject = localize(q.subjectName, locale)
                      return (
                        <AccordionItem
                          key={q.id}
                          value={q.id}
                          className={cn(
                            "rounded-lg border bg-card",
                            q.isCorrect ? "border-emerald-200" : "border-rose-200",
                          )}
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex w-full items-center gap-3 pr-2 text-left">
                              {q.isCorrect ? (
                                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                              ) : (
                                <XCircle className="size-5 shrink-0 text-rose-600" />
                              )}
                              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                №{idx + 1}
                              </span>
                              <span className="line-clamp-1 flex-1 text-sm font-normal">
                                {qText || qSubject || "Вопрос"}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="border-t border-border px-4 py-4">
                            <div className="flex flex-col gap-4">
                              {qText && (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {qText}
                                </div>
                              )}
                              <QuestionMedia src={q.imageUrl} alt={qSubject} />
                              <div className="flex flex-col gap-2">
                                {q.options.map((opt, i) => {
                                  const optText = localize(opt.text, locale)
                                  const stateClass = opt.isCorrect
                                    ? "border-emerald-300 bg-emerald-50"
                                    : opt.isSelected
                                      ? "border-rose-300 bg-rose-50"
                                      : "border-border bg-card"
                                  return (
                                    <div
                                      key={opt.id}
                                      className={cn(
                                        "flex items-start gap-3 rounded-md border px-4 py-3",
                                        stateClass,
                                      )}
                                    >
                                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">
                                        {String.fromCharCode(65 + i)}
                                      </span>
                                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                                        {optText && (
                                          <span className="text-sm leading-relaxed">{optText}</span>
                                        )}
                                        {opt.imageUrl && <QuestionMedia src={opt.imageUrl} />}
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {opt.isCorrect && (
                                          <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                            Верно
                                          </Badge>
                                        )}
                                        {opt.isSelected && !opt.isCorrect && (
                                          <Badge variant="destructive">Ваш ответ</Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {q.hasExplanation && (
                                <ExplanationBlock sessionId={sessionId} questionId={q.id} />
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </section>
              )
            })}
          </>
        ) : null}
      </div>
    </div>
  )
}

function ExplanationBlock({
  sessionId,
  questionId,
}: {
  sessionId: string
  questionId: string
}) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ExplanationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    if (data || loading) return
    setLoading(true)
    setErr(null)
    try {
      const res = await api<ExplanationData>(
        `/tests/sessions/${sessionId}/review/${questionId}/explanation`,
      )
      setData(res)
    } catch (e) {
      const apiErr = e as ApiError
      if (apiErr.status === 402 || apiErr.status === 403) {
        setErr("premium")
      } else {
        setErr(apiErr.message || "Не удалось загрузить объяснение")
      }
    } finally {
      setLoading(false)
    }
  }

  if (err === "premium") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <Crown className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex flex-col gap-2">
            <p className="font-medium text-amber-900">Объяснение доступно в Premium</p>
            <p className="text-amber-800">
              Получите подробные разборы каждой ошибки, чтобы быстрее закрывать пробелы.
            </p>
            <Button size="sm" asChild className="self-start">
              <Link href="/dashboard/billing">Подключить Premium</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) load()
        }}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
      >
        <Lightbulb className="size-4" />
        Объяснение
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-3 rounded-md border border-border bg-secondary/40 p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Загружаем объяснение
            </div>
          ) : err ? (
            <p className="text-sm text-rose-700">{err}</p>
          ) : data ? (
            <div className="flex flex-col gap-3">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                {typeof data.explanation === "string"
                  ? data.explanation
                  : JSON.stringify(data.explanation, null, 2)}
              </div>
              {data.imageUrls && data.imageUrls.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.imageUrls.map((u, i) => (
                    <QuestionMedia key={i} src={u} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
