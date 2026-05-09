"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  ListChecks,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExamTimer } from "@/components/exam/timer"
import { Calculator as ExamCalculator } from "@/components/exam/calculator"
import { QuestionMedia } from "@/components/exam/question-media"
import {
  RichText,
  getDetachedImageUrls,
  imageReferenceText,
} from "@/components/exam/rich-text"
import { Logo } from "@/components/landing/logo"
import { api, ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/api/auth-context"
import { localize, type Locale } from "@/lib/api/i18n"
import { flattenSessionQuestions, type FlatSessionQuestion } from "@/lib/api/test-session"
import { cn } from "@/lib/utils"
import type { TestSession } from "@/lib/api/types"

interface AnswerResponse {
  id: string
  selectedIds: string[]
  serverTimeRemaining?: number | null
}

export default function ExamSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const { data: session, isLoading, error } = useSWR<TestSession>(
    `/tests/sessions/${sessionId}`,
  )

  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [activeIdx, setActiveIdx] = useState(0)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showFinish, setShowFinish] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const initRef = useRef(false)

  const flat = useMemo<FlatSessionQuestion[]>(() => {
    if (!session) return []
    return flattenSessionQuestions(session, locale)
  }, [session, locale])

  // Initialise local state from server data once
  useEffect(() => {
    if (!session || initRef.current) return
    initRef.current = true
    const initial: Record<string, string[]> = {}
    for (const q of flat) {
      if (q.selectedIds && q.selectedIds.length > 0) {
        initial[q.id] = q.selectedIds
      }
    }
    setAnswers(initial)
    if (session.timeRemaining != null) {
      setRemaining(session.timeRemaining)
    }
  }, [session, flat])

  // Redirect already-finished session to review
  useEffect(() => {
    if (session && session.status !== "in_progress") {
      router.replace(`/exam/${sessionId}/review`)
    }
  }, [session, sessionId, router])

  const timerRef = useRef<number | null>(null)

  // Tick down timer — start interval when remaining first becomes non-null
  useEffect(() => {
    if (remaining == null || remaining <= 0) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Clear any stale interval before starting a new one
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
    }
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r == null || r <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [remaining])

  // Auto-finish on timeout
  const finish = useCallback(
    async (reason?: "timeout") => {
      if (finishing) return
      setFinishing(true)
      try {
        await api(`/tests/sessions/${sessionId}/finish`, { method: "POST" })
        if (reason === "timeout") toast.message("Время вышло, тест завершён")
        else toast.success("Тест завершён")
        router.replace(`/exam/${sessionId}/review`)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Не удалось завершить тест")
        setFinishing(false)
      }
    },
    [finishing, router, sessionId],
  )

  useEffect(() => {
    if (remaining != null && remaining <= 0) {
      finish("timeout")
    }
  }, [remaining, finish])

  const submitAnswer = useCallback(
    async (questionId: string, selectedIds: string[]) => {
      setSavingId(questionId)
      try {
        const res = await api<AnswerResponse>(
          `/tests/sessions/${sessionId}/answer`,
          {
            method: "POST",
            body: { questionId, selectedIds },
          },
        )
        if (res.serverTimeRemaining != null) {
          setRemaining(res.serverTimeRemaining)
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Ошибка сохранения ответа")
      } finally {
        setSavingId((cur) => (cur === questionId ? null : cur))
      }
    },
    [sessionId],
  )

  const onSelect = (q: FlatSessionQuestion, optionId: string) => {
    const current = answers[q.id] || []
    let next: string[]
    if (q.multiSelect) {
      next = current.includes(optionId)
        ? current.filter((x) => x !== optionId)
        : [...current, optionId]
    } else {
      next = [optionId]
    }
    setAnswers((a) => ({ ...a, [q.id]: next }))
    submitAnswer(q.id, next)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <AlertTriangle className="size-8 text-rose-500" />
            <p className="font-semibold">Не удалось загрузить сессию</p>
            <p className="text-sm text-muted-foreground">
              {(error as ApiError).message || "Попробуйте обновить страницу"}
            </p>
            <Button asChild>
              <Link href="/dashboard/exams">К каталогу</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session || flat.length === 0) {
    return null
  }

  const current = flat[activeIdx]
  const total = flat.length
  const answered = Object.keys(answers).filter((id) => (answers[id] || []).length > 0).length
  const progress = Math.round((answered / total) * 100)
  const selected = answers[current.id] || []
  const currentDetachedImageUrls = getDetachedImageUrls(current.imageUrls, [
    current.display.passage ?? "",
    current.display.topicLine ?? "",
    current.display.stem,
    ...current.answerOptions.map((opt) => localize(opt.content ?? opt.text, locale)),
    imageReferenceText(current.explanation),
  ])

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Logo />
            <span className="hidden truncate text-sm font-semibold lowercase sm:inline">
              {localize(session.examType?.name, locale) || "Пробник"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ExamTimer remaining={remaining} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCalculator(true)}
              className="hidden sm:flex"
            >
              <Calculator className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNav(true)}
              className="lg:hidden"
            >
              <ListChecks className="size-4" />
              {answered}/{total}
            </Button>
            <Button size="sm" onClick={() => setShowFinish(true)}>
              <Flag className="size-4" />
              <span className="hidden sm:inline">Завершить</span>
            </Button>
          </div>
        </div>
        {/* progress bar */}
        <div className="h-0.5 w-full bg-border">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:py-8">
        {/* Question */}
        <div className="flex-1 min-w-0">
          {current.sectionTitle && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {current.sectionTitle}
            </p>
          )}
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              Вопрос {activeIdx + 1}{" "}
              <span className="text-muted-foreground font-normal">/ {total}</span>
            </h1>
            {savingId === current.id && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Spinner className="size-3" /> Сохраняем
              </span>
            )}
          </div>

          <Card>
            <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
              {(() => {
                const qSubject = localize(current.subjectName, locale)
                return (
                  <>
                    {current.display.passage && (
                      <RichText
                        as="div"
                        value={current.display.passage}
                        locale={locale}
                        imageUrls={current.imageUrls}
                        className="rounded-md border border-border bg-secondary/40 p-4 text-sm leading-relaxed"
                      />
                    )}
                    {current.display.stem && (
                      <RichText
                        as="div"
                        value={current.display.stem}
                        locale={locale}
                        imageUrls={current.imageUrls}
                        className="text-sm leading-relaxed sm:text-base"
                      />
                    )}
                    {currentDetachedImageUrls.map((url, index) => (
                      <QuestionMedia key={`${current.id}-${index}`} src={url} alt={qSubject} />
                    ))}
                  </>
                )
              })()}

              <div className="flex flex-col gap-2">
                {current.answerOptions.map((opt, i) => {
                  const checked = selected.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelect(current, opt.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                        checked
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/40 hover:bg-secondary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          checked
                            ? "border-background bg-background text-foreground"
                            : "border-border bg-secondary text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <RichText
                          value={opt.content ?? opt.text}
                          locale={locale}
                          imageUrls={current.imageUrls}
                          className="text-sm leading-relaxed"
                        />
                        {opt.imageUrl && <QuestionMedia src={opt.imageUrl} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {current.multiSelect && (
                <p className="text-xs text-muted-foreground">
                  Можно выбрать несколько вариантов
                </p>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              <ArrowLeft className="size-4" />
              Назад
            </Button>
            {activeIdx < total - 1 ? (
              <Button onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}>
                Далее
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowFinish(true)} variant="default">
                <Flag className="size-4" />
                Завершить
              </Button>
            )}
          </div>
        </div>

        {/* Question grid (desktop) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <QuestionGrid
            flat={flat}
            answers={answers}
            activeIdx={activeIdx}
            onSelect={(i) => setActiveIdx(i)}
            answered={answered}
            total={total}
          />
        </aside>
      </div>

      {/* Question grid drawer (mobile) */}
      <Dialog open={showNav} onOpenChange={setShowNav}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Все вопросы</DialogTitle>
            <DialogDescription>
              Отвечено {answered} из {total}
            </DialogDescription>
          </DialogHeader>
          <QuestionGrid
            flat={flat}
            answers={answers}
            activeIdx={activeIdx}
            onSelect={(i) => {
              setActiveIdx(i)
              setShowNav(false)
            }}
            answered={answered}
            total={total}
            compact
          />
        </DialogContent>
      </Dialog>

      {/* Finish confirmation */}
      <Dialog open={showFinish} onOpenChange={setShowFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершить тест?</DialogTitle>
            <DialogDescription>
              Вы ответили на {answered} из {total} вопросов. После завершения вернуться к
              изменениям нельзя.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinish(false)} disabled={finishing}>
              Продолжить
            </Button>
            <Button onClick={() => finish()} disabled={finishing}>
              {finishing ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Завершить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExamCalculator open={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  )
}

function QuestionGrid({
  flat,
  answers,
  activeIdx,
  onSelect,
  answered,
  total,
  compact,
}: {
  flat: FlatSessionQuestion[]
  answers: Record<string, string[]>
  activeIdx: number
  onSelect: (i: number) => void
  answered: number
  total: number
  compact?: boolean
}) {
  // group by sectionTitle
  const groups: { title: string; items: { idx: number; q: FlatSessionQuestion }[] }[] = []
  flat.forEach((q, idx) => {
    const title = q.sectionTitle || ""
    const last = groups[groups.length - 1]
    if (!last || last.title !== title) groups.push({ title, items: [{ idx, q }] })
    else last.items.push({ idx, q })
  })

  return (
    <div className={cn("flex flex-col gap-4", compact ? "" : "sticky top-20")}>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Прогресс
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {answered}/{total}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {g.title && (
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {g.title}
              </p>
            )}
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
              {g.items.map(({ idx, q }) => {
                const isAnswered = (answers[q.id] || []).length > 0
                const isActive = idx === activeIdx
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelect(idx)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-colors",
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : isAnswered
                          ? "border-border bg-secondary text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/40",
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
