"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Clock, Crown, Play } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/api/auth-context"
import { localize, type Locale } from "@/lib/api/i18n"
import type { ExamType, Subject, TestSession, TestTemplate } from "@/lib/api/types"

export default function ExamDetailPage({
  params,
}: {
  params: Promise<{ examTypeId: string }>
}) {
  const { examTypeId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null)
  const [language, setLanguage] = useState<"ru" | "kk">("ru")
  const [entScope, setEntScope] = useState<"mandatory" | "profile" | "full">("full")
  const [profileSubjectIds, setProfileSubjectIds] = useState<string[]>([])
  const [starting, setStarting] = useState(false)

  const { data: types } = useSWR<ExamType[]>("/exams/types")
  const examType = (types || []).find((t) => t.id === examTypeId)
  const examName = localize(examType?.name, locale, "Экзамен")
  const examDescription = localize(examType?.description, locale)
  const isENT =
    examType?.code?.toLowerCase() === "ent" ||
    examName.toLowerCase().includes("ент") ||
    examName.toLowerCase().includes("ent")

  const { data: subjects, isLoading: subjLoading } = useSWR<Subject[]>(
    `/exams/types/${examTypeId}/subjects`,
  )
  const { data: templates, isLoading: tplLoading } = useSWR<TestTemplate[]>(
    `/exams/types/${examTypeId}/templates`,
  )

  const profileSubjects = (subjects || []).filter((s) => s.isProfile !== false && !s.isMandatory)

  const toggleProfile = (id: string) => {
    setProfileSubjectIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 2 ? [...cur, id] : cur,
    )
  }

  const startTest = async () => {
    if (!selectedTemplate) return
    if (isENT && (entScope === "profile" || entScope === "full") && profileSubjectIds.length !== 2) {
      toast.error("Выберите 2 профильных предмета")
      return
    }
    setStarting(true)
    try {
      const session = await api<TestSession>("/tests/start", {
        method: "POST",
        body: {
          templateId: selectedTemplate.id,
          language,
          profileSubjectIds: isENT ? profileSubjectIds : undefined,
          entScope: isENT ? entScope : undefined,
        },
      })
      router.push(`/exam/${session.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось запустить тест")
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          К каталогу
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {examName}
        </h1>
        {examDescription && (
          <p className="mt-1 text-muted-foreground">{examDescription}</p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Предметы</h2>
        {subjLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        ) : (subjects || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Список предметов недоступен</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(subjects || []).map((s) => (
              <Badge
                key={s.id}
                variant={s.isMandatory ? "default" : "secondary"}
                className="text-sm py-1.5 px-3 font-normal"
              >
                {localize(s.name, locale, "Предмет")}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Доступные пробники</h2>
        {tplLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (templates || []).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Пока нет доступных пробников
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(templates || []).map((t) => {
              const tName = localize(t.name, locale, "Пробник")
              const tDescription = localize(t.description, locale)
              return (
                <Card
                  key={t.id}
                  className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-md"
                >
                  {t.isPremium && (
                    <Badge className="absolute right-3 top-3 bg-amber-500 hover:bg-amber-500">
                      <Crown className="size-3" />
                      Premium
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex size-11 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
                      <BookOpen className="size-5" />
                    </div>
                    <CardTitle className="text-lg leading-tight">{tName}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {tDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{tDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {t.durationMins && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {t.durationMins} мин
                        </span>
                      )}
                      {t.totalQuestions && <span>{t.totalQuestions} вопросов</span>}
                    </div>
                    <Button onClick={() => setSelectedTemplate(t)} className="mt-1">
                      <Play className="size-4" />
                      Начать
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Dialog open={!!selectedTemplate} onOpenChange={(o) => !o && setSelectedTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{localize(selectedTemplate?.name, locale, "Пробник")}</DialogTitle>
            <DialogDescription>
              Настройте параметры пробника перед запуском
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            <div>
              <Label>Язык</Label>
              <RadioGroup
                value={language}
                onValueChange={(v) => setLanguage(v as "ru" | "kk")}
                className="mt-2 flex gap-3"
              >
                <Label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer flex-1">
                  <RadioGroupItem value="ru" /> Русский
                </Label>
                <Label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer flex-1">
                  <RadioGroupItem value="kk" /> Қазақша
                </Label>
              </RadioGroup>
            </div>

            {isENT && (
              <>
                <div>
                  <Label>Объём ЕНТ</Label>
                  <RadioGroup
                    value={entScope}
                    onValueChange={(v) => setEntScope(v as typeof entScope)}
                    className="mt-2 flex flex-col gap-2"
                  >
                    {[
                      { v: "mandatory", l: "Только обязательные (мат.грам., чит.грам., история)" },
                      { v: "profile", l: "Только профильные предметы" },
                      { v: "full", l: "Полный ЕНТ (все предметы)" },
                    ].map((o) => (
                      <Label
                        key={o.v}
                        className="flex items-start gap-2 rounded-md border border-border px-3 py-2 cursor-pointer"
                      >
                        <RadioGroupItem value={o.v} className="mt-0.5" />
                        <span className="text-sm">{o.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {(entScope === "profile" || entScope === "full") && (
                  <div>
                    <Label>Профильные предметы (выберите 2)</Label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {profileSubjects.map((s) => (
                        <Label
                          key={s.id}
                          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={profileSubjectIds.includes(s.id)}
                            onCheckedChange={() => toggleProfile(s.id)}
                          />
                          <span className="text-sm">{localize(s.name, locale, "Предмет")}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Отмена
            </Button>
            <Button onClick={startTest} disabled={starting}>
              {starting ? <Spinner className="size-4" /> : <><Play className="size-4" /> Начать пробник</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
