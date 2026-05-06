"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/api/auth-context"
import { api, ApiError } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { BillingPlan } from "@/lib/api/types"

export default function BillingPage() {
  const { user } = useAuth()
  const { data, isLoading } = useSWR<BillingPlan[] | { items: BillingPlan[] }>("/billing/plans")

  const plans: BillingPlan[] = Array.isArray(data) ? data : data?.items ?? []
  const sorted = [...plans].sort((a, b) => (a.priceCents ?? a.price ?? 0) - (b.priceCents ?? b.price ?? 0))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Тарифы</h1>
        <p className="text-muted-foreground">
          Откройте полный доступ к пробникам, разборам и аналитике
        </p>
      </div>

      {user?.isPremium && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center justify-between gap-4 p-5">
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
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Тарифы временно недоступны
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {sorted.map((plan, idx) => (
            <PlanCard key={plan.id} plan={plan} highlighted={idx === 1 || sorted.length === 1} />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-2 p-5 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Гарантия возврата 7 дней.</span>{" "}
            Если что-то не понравится — вернём деньги.
          </p>
          <p>
            Оплата проходит безопасно через FreedomPay. После успешной оплаты Premium
            активируется автоматически.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function formatPrice(plan: BillingPlan): string {
  const cents = plan.priceCents
  const amount = typeof cents === "number" ? cents / 100 : plan.price ?? 0
  const currency = plan.currency || "₸"
  return `${amount.toLocaleString("ru-RU")} ${currency}`
}

function PlanCard({ plan, highlighted }: { plan: BillingPlan; highlighted?: boolean }) {
  const [loading, setLoading] = useState(false)

  const onCheckout = async () => {
    setLoading(true)
    try {
      const res = await api<{ paymentUrl: string; orderId: string }>("/billing/checkout", {
        method: "POST",
        body: { planId: plan.id },
      })
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
      } else {
        toast.error("Не удалось получить ссылку на оплату")
        setLoading(false)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ошибка оплаты")
      setLoading(false)
    }
  }

  const features = plan.features && plan.features.length > 0
    ? plan.features
    : [
        "Безлимитные пробники",
        "Разбор каждого вопроса",
        "Аналитика по предметам",
        "Лидерборд ЕНТ",
      ]

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden transition-all",
        highlighted ? "border-foreground shadow-lg" : "",
      )}
    >
      {plan.badge && (
        <Badge className="absolute right-4 top-4 bg-accent hover:bg-accent">
          {plan.badge}
        </Badge>
      )}
      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {plan.code}
          </p>
          <p className="text-xl font-semibold">{plan.name}</p>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">{formatPrice(plan)}</span>
          {plan.oldPrice != null && plan.oldPrice > 0 && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              {plan.oldPrice.toLocaleString("ru-RU")} {plan.currency || "₸"}
            </span>
          )}
        </div>
        {plan.durationDays && (
          <p className="-mt-3 text-xs text-muted-foreground">
            Срок действия: {plan.durationDays} дней
          </p>
        )}

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
