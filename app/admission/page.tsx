"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
  Building2,
  Calculator,
  CheckCircle2,
  GraduationCap,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type {
  AdmissionCycle,
  ChanceProgram,
  ChanceUniversity,
} from "@/lib/api/types"

type QuotaType = "GRANT" | "RURAL"
type Tab = "programs" | "universities"

interface ProfileSubjectOption {
  value: string
  label: string
}

interface Scores {
  mathLit: number
  readingLit: number
  history: number
  profile1: number
  profile2: number
}

const SCORE_FIELDS: {
  key: keyof Scores
  label: string
  short: string
  max: number
}[] = [
  { key: "mathLit", label: "Мат. грамотность", short: "МатГр", max: 10 },
  { key: "readingLit", label: "Чит. грамотность", short: "ЧитГр", max: 10 },
  { key: "history", label: "История Казахстана", short: "ИстКЗ", max: 20 },
  { key: "profile1", label: "Профильный 1", short: "Проф 1", max: 50 },
  { key: "profile2", label: "Профильный 2", short: "Проф 2", max: 50 },
]

export default function AdmissionPage() {
  const [cycleSlug, setCycleSlug] = useState<string>("")
  const [quotaType, setQuotaType] = useState<QuotaType>("GRANT")
  const [profileSubjects, setProfileSubjects] = useState<string>("")
  const [scores, setScores] = useState<Scores>({
    mathLit: 8,
    readingLit: 8,
    history: 15,
    profile1: 35,
    profile2: 35,
  })
  const [tab, setTab] = useState<Tab>("programs")
  const [search, setSearch] = useState("")

  const total =
    scores.mathLit + scores.readingLit + scores.history + scores.profile1 + scores.profile2

  // Cycles
  const { data: cycles } = useSWR<AdmissionCycle[]>("/admission/cycles")
  useEffect(() => {
    if (!cycleSlug && cycles && cycles.length > 0) {
      const sorted = [...cycles].sort((a, b) => b.sortOrder - a.sortOrder)
      setCycleSlug(sorted[0].slug)
    }
  }, [cycles, cycleSlug])

  // Profile subject options
  const profileOptionsKey =
    cycleSlug && quotaType
      ? `/admission/chance/profile-subjects?cycleSlug=${encodeURIComponent(
          cycleSlug,
        )}&quotaType=${quotaType}`
      : null
  const { data: profileOpts, isLoading: profileLoading } = useSWR<ProfileSubjectOption[]>(
    profileOptionsKey,
  )

  // Reset/seed profile subjects when options arrive
  useEffect(() => {
    if (profileOpts && profileOpts.length > 0) {
      if (!profileOpts.some((o) => o.value === profileSubjects)) {
        setProfileSubjects(profileOpts[0].value)
      }
    }
  }, [profileOpts, profileSubjects])

  // Build chance programs query
  const chanceQuery = useMemo(() => {
    if (!cycleSlug || !profileSubjects) return null
    const params = new URLSearchParams({
      cycleSlug,
      quotaType,
      profileSubjects,
      mathLit: String(scores.mathLit),
      readingLit: String(scores.readingLit),
      history: String(scores.history),
      profile1: String(scores.profile1),
      profile2: String(scores.profile2),
    })
    return params.toString()
  }, [cycleSlug, quotaType, profileSubjects, scores])

  const programsKey = chanceQuery ? `/admission/chance/programs?${chanceQuery}` : null
  const { data: programs, isLoading: progLoading } = useSWR<ChanceProgram[]>(programsKey)

  const filteredPrograms = useMemo(() => {
    if (!programs) return []
    const q = search.trim().toLowerCase()
    let list = programs
    if (q) {
      list = programs.filter(
        (p) =>
          p.programName.toLowerCase().includes(q) ||
          p.programCode.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      // pass first, then by smallest gap
      if (a.isPass !== b.isPass) return a.isPass ? -1 : 1
      const ga = a.gapToCutoff ?? Number.NEGATIVE_INFINITY
      const gb = b.gapToCutoff ?? Number.NEGATIVE_INFINITY
      return gb - ga
    })
  }, [programs, search])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit bg-secondary">
          Калькулятор поступления 2026
        </Badge>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Куда пройдёшь с твоими баллами ЕНТ?
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Введи баллы — посмотри, в какие вузы и на какие специальности ты проходишь по
          грантовым и сельским квотам прошлых лет.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <Card className="lg:sticky lg:top-20 self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4" />
              Параметры
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>Цикл поступления</Label>
              <Select value={cycleSlug} onValueChange={setCycleSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Загружаем..." />
                </SelectTrigger>
                <SelectContent>
                  {(cycles || [])
                    .slice()
                    .sort((a, b) => b.sortOrder - a.sortOrder)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.slug}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Тип квоты</Label>
              <ToggleGroup
                type="single"
                value={quotaType}
                onValueChange={(v) => v && setQuotaType(v as QuotaType)}
                className="grid grid-cols-2 rounded-md border border-border bg-secondary p-0.5"
              >
                <ToggleGroupItem
                  value="GRANT"
                  className="data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Грант
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="RURAL"
                  className="data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Сельская
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Профильные предметы</Label>
              {profileLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <Select value={profileSubjects} onValueChange={setProfileSubjects}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пару профильных" />
                  </SelectTrigger>
                  <SelectContent>
                    {(profileOpts || []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Баллы ЕНТ</Label>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    total >= 100
                      ? "bg-emerald-100 text-emerald-900"
                      : total >= 70
                        ? "bg-amber-100 text-amber-900"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {total}/140
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCORE_FIELDS.map((f) => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground" htmlFor={f.key}>
                      {f.short} ({f.max})
                    </Label>
                    <Input
                      id={f.key}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={f.max}
                      value={scores[f.key]}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        const clamped = Number.isFinite(v)
                          ? Math.max(0, Math.min(f.max, v))
                          : 0
                        setScores((s) => ({ ...s, [f.key]: clamped }))
                      }}
                      className="h-10 tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              <Sparkles className="mb-1 inline size-3.5" /> Подбор обновляется в реальном
              времени по мере изменения параметров.
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ToggleGroup
              type="single"
              value={tab}
              onValueChange={(v) => v && setTab(v as Tab)}
              className="rounded-md border border-border bg-card p-0.5 self-start"
            >
              <ToggleGroupItem
                value="programs"
                className="h-9 px-3 data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                <GraduationCap className="size-4" />
                <span className="hidden sm:inline ml-1">Специальности</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="universities"
                className="h-9 px-3 data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                <Building2 className="size-4" />
                <span className="hidden sm:inline ml-1">Вузы</span>
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {tab === "programs" ? (
            <ProgramsList
              loading={progLoading}
              programs={filteredPrograms}
              total={total}
              hasParams={!!programsKey}
            />
          ) : (
            <UniversitiesList
              cycleSlug={cycleSlug}
              quotaType={quotaType}
              scores={scores}
              search={search}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ProgramsList({
  loading,
  programs,
  total,
  hasParams,
}: {
  loading: boolean
  programs: ChanceProgram[]
  total: number
  hasParams: boolean
}) {
  if (!hasParams) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Выберите параметры слева, чтобы увидеть подходящие специальности
        </CardContent>
      </Card>
    )
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }
  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Под ваши параметры пока нет результатов
        </CardContent>
      </Card>
    )
  }

  const passing = programs.filter((p) => p.isPass).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
        <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
          <CheckCircle2 className="size-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            {passing} из {programs.length} специальностей подходят
          </p>
          <p className="text-xs text-muted-foreground">
            Ваш балл: <span className="font-semibold tabular-nums">{total}</span> · Сравниваем с
            пороговыми баллами прошлых лет
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {programs.map((p) => (
          <ProgramRow key={`${p.programId}-${p.profileSubjects}`} program={p} />
        ))}
      </ul>
    </div>
  )
}

function ProgramRow({ program }: { program: ChanceProgram }) {
  const isPass = program.isPass
  const gap = program.gapToCutoff
  return (
    <li>
      <Card className={cn("transition-colors", isPass ? "border-emerald-200" : "border-border")}>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-md",
                isPass ? "bg-emerald-100 text-emerald-900" : "bg-rose-50 text-rose-900",
              )}
            >
              {isPass ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {program.programCode}
                </Badge>
                <p className="font-medium leading-tight">{program.programName}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Профиль: {program.profileSubjects}
                {program.universityCount > 0 && (
                  <span className="ml-2">· {program.universityCount} вузов</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Порог</span>
              <span className="font-semibold tabular-nums">
                {program.displayedMinScore ?? "—"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">
                {isPass ? "Запас" : "Не хватает"}
              </span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  isPass ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {gap == null ? "—" : `${isPass ? "+" : ""}${gap}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

function UniversitiesList({
  cycleSlug,
  quotaType,
  scores,
  search,
}: {
  cycleSlug: string
  quotaType: QuotaType
  scores: Scores
  search: string
}) {
  // Need a programId to query universities — fetch a default by picking the first program from chance results
  // Practically, we let the user pick a program first
  const [programId, setProgramId] = useState<string>("")

  // Get list of programs for the dropdown (no scores required filter — use admission/programs)
  const { data: programs, isLoading: progLoading } = useSWR<
    { id: string; code: string; name: string }[]
  >(`/admission/programs?take=200`)

  const filteredPrograms = useMemo(() => {
    if (!programs) return []
    const q = search.trim().toLowerCase()
    if (!q) return programs.slice(0, 200)
    return programs.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    )
  }, [programs, search])

  useEffect(() => {
    if (!programId && filteredPrograms.length > 0) {
      setProgramId(filteredPrograms[0].id)
    }
  }, [filteredPrograms, programId])

  const uniKey =
    cycleSlug && programId
      ? `/admission/chance/universities?${new URLSearchParams({
          cycleSlug,
          quotaType,
          programId,
          mathLit: String(scores.mathLit),
          readingLit: String(scores.readingLit),
          history: String(scores.history),
          profile1: String(scores.profile1),
          profile2: String(scores.profile2),
        }).toString()}`
      : null
  const { data: unis, isLoading: uniLoading } = useSWR<ChanceUniversity[]>(uniKey)

  const sortedUnis = useMemo(() => {
    if (!unis) return []
    return [...unis].sort((a, b) => {
      if (a.isPass !== b.isPass) return a.isPass ? -1 : 1
      return (a.displayedMinScore ?? 0) - (b.displayedMinScore ?? 0)
    })
  }, [unis])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>Специальность</Label>
        {progLoading ? (
          <Skeleton className="h-10" />
        ) : (
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите специальность" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {filteredPrograms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {p.code}
                  </span>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!programId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Выберите специальность, чтобы увидеть список вузов
          </CardContent>
        </Card>
      ) : uniLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : sortedUnis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет данных по этой специальности
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedUnis.map((u) => (
            <li key={u.universityCode}>
              <Card
                className={cn(
                  "transition-colors",
                  u.isPass ? "border-emerald-200" : "border-border",
                )}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      u.isPass ? "bg-emerald-100 text-emerald-900" : "bg-rose-50 text-rose-900",
                    )}
                  >
                    {u.isPass ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <p className="truncate font-medium">{u.universityName}</p>
                    <p className="text-xs text-muted-foreground">
                      Код {u.universityCode} · Порог {u.displayedMinScore ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      {u.isPass ? "Запас" : "Не хватает"}
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        u.isPass ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {u.gapToCutoff == null
                        ? "—"
                        : `${u.isPass ? "+" : ""}${u.gapToCutoff}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
