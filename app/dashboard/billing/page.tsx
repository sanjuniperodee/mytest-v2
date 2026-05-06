"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { ArrowRight, Check, Crown, Sparkles, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/api/auth-context"
import { api, ApiError } from "@/lib/api/client"
import { localize, type Locale } from "@/lib/api/i18n"
import { cn } from "@/lib/utils"
import type { BillingPlan, CheckoutResponse } from "@/lib/api/types"

interface NormalizedPlan {
  id: string
  code: string
  name: string
  description: string
  price: number | null
  oldPrice: number | null
  currency: string
  durationDays: number | null
  badge: string | null
  features: string[]
  raw: BillingPlan
}

function pickNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v)
    }
  }
  return null
}

function normalizePlan(plan: BillingPlan, locale: Locale): NormalizedPlan {
  // Backend uses priceKzt; legacy types support priceCents/price
  const priceFromCents =
    typeof plan.priceCents === "number" ? plan.priceCents / 100 : null
  const price = pickNumber(plan.priceKzt, priceFromCents, plan.price)
  const oldPrice = pickNumber(plan.originalPriceKzt, plan.oldPrice)

  return {
    id: plan.id,
    code: plan.code || plan.id,
    name: localize(plan.name, locale, "Тариф"),
    description: localize(plan.description, locale),
    price,
    oldPrice,
    currency: plan.currency || "₸",
    durationDays: typeof plan.durationDays === "number" ? plan.durationDays : null,
    badge: plan.highlight || plan.badge || null,
    features: (plan.features || []).map((f) => localize(f, locale)).filter(Boolean),
    raw: plan,
  }
}

export default function BillingPage() {
  const { user } = useAuth()
  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const { data, isLoading } = useSWR<BillingPlan[] | { items: BillingPlan[] }>("/billing/plans")

  const rawPlans: BillingPlan[] = Array.isArray(data) ? data : data?.items ?? []
  const plans = rawPlans.map((p) => normalizePlan(p, locale))
  const sorted = [...plans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))

  // Highlight the most "popular" plan when there's a badge, otherwise the middle plan
  const highlightedIdx = (() => {
    const byBadge = sorted.findIndex((p) => p.badge)
    if (byBadge >= 0) return byBadge
    if (sorted.length >= 3) return Math.floor(sorted.length / 2)
    return -1
  })()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="size-3" />
          Подписка
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Тарифы</h1>
        <p className="text-muted-foreground">
          Откройте полный доступ к пробникам, разборам и аналитике
        </p>
      </div>

      {user?.hasActiveSubscription && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Crown className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">У вас активен Premium</p>
                <p className="text-sm text-emerald-800">
                  Спасибо! Все функции уже доступны.
                </p>
              </div>
            </div>
            <Sparkles className="size-6 text-emerald-600" />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Тарифы временно недоступны
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-4 md:grid-cols-2",
            sorted.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {sorted.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              highlighted={idx === highlightedIdx}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-foreground">Гарантия возврата 7 дней</p>
              <p>Если что-то не понравится — вернём деньги без вопросов.</p>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-border sm:block" />
          <p>
            Оплата проходит безопасно через FreedomPay. После успешной оплаты Premium
            активируется автоматически.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function formatPrice(plan: NormalizedPlan): string {
  if (plan.price == null) return "—"
  return `${plan.price.toLocaleString("ru-RU")} ${plan.currency}`
}

function formatOldPrice(plan: NormalizedPlan): string | null {
  if (plan.oldPrice == null || plan.oldPrice <= 0) return null
  return `${plan.oldPrice.toLocaleString("ru-RU")} ${plan.currency}`
}

function PlanCard({
  plan,
  highlighted,
}: {
  plan: NormalizedPlan
  highlighted?: boolean
}) {
  const [loading, setLoading] = useState(false)

  const onCheckout = async () => {
    setLoading(true)
    try {
      const res = await api<CheckoutResponse>("/billing/checkout", {
        method: "POST",
        body: { planId: plan.id },
      })
      const checkoutUrl = res.checkoutUrl || res.paymentUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.error("Не удалось получить ссылку на оплату")
        setLoading(false)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ошибка оплаты")
      setLoading(false)
    }
  }

  const features =
    plan.features.length > 0
      ? plan.features
      : [
          "Безлимитные пробники",
          "Разбор каждого вопроса",
          "Аналитика по предметам",
          "Лидерборд ЕНТ",
        ]

  const oldPriceLabel = formatOldPrice(plan)
  const discountPct =
    plan.price != null && plan.oldPrice != null && plan.oldPrice > plan.price
      ? Math.round(((plan.oldPrice - plan.price) / plan.oldPrice) * 100)
      : null

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden transition-all duration-200",
        highlighted
          ? "border-foreground shadow-lg ring-1 ring-foreground/10"
          : "hover:border-foreground/40 hover:shadow-md",
      )}
    >
      {plan.badge && (
        <div className="absolute right-4 top-4 z-10">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent capitalize">
            {plan.badge}
          </Badge>
        </div>
      )}
      {highlighted && !plan.badge && (
        <div className="absolute right-4 top-4 z-10">
          <Badge className="bg-foreground text-background hover:bg-foreground">
            Рекомендуем
          </Badge>
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {plan.code}
          </p>
          <p className="text-xl font-semibold">{plan.name}</p>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-semibold tabular-nums">{formatPrice(plan)}</span>
            {oldPriceLabel && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {oldPriceLabel}
              </span>
            )}
            {discountPct != null && discountPct > 0 && (
              <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                −{discountPct}%
              </Badge>
            )}
          </div>
          {plan.durationDays && (
            <p className="text-xs text-muted-foreground">
              Срок действия: {plan.durationDays}{" "}
              {plan.durationDays === 1
                ? "день"
                : plan.durationDays < 5
                  ? "дня"
                  : "дней"}
            </p>
          )}
        </div>

        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onCheckout}
          disabled={loading}
          variant={highlighted ? "default" : "outline"}
          className="h-11"
        >
          {loading ? (
            <Spinner className="size-4" />
          ) : (
            <>
              Оформить
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
