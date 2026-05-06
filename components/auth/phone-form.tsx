"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { api, ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/api/auth-context"
import type { AuthResponse } from "@/lib/api/types"

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "")
  let withCountry = digits
  if (digits.startsWith("8")) withCountry = "7" + digits.slice(1)
  if (!withCountry.startsWith("7")) withCountry = "7" + withCountry
  return "+" + withCountry.slice(0, 11)
}

export function PhoneForm() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const formatted = formatPhone(phone)
    if (formatted.length !== 12) {
      toast.error("Введите номер в формате +7XXXXXXXXXX")
      return
    }
    setLoading(true)
    try {
      await api("/auth/web/request-code", {
        method: "POST",
        auth: false,
        body: { phone: formatted },
      })
      setPhone(formatted)
      setStep("code")
      toast.success("Код отправлен по SMS")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Не удалось отправить код"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const verify = async (otp: string) => {
    setLoading(true)
    try {
      const data = await api<AuthResponse>("/auth/web/verify-code", {
        method: "POST",
        auth: false,
        body: { phone, code: otp },
      })
      setSession(data)
      toast.success("Добро пожаловать!")
      router.replace("/dashboard")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Неверный код"
      toast.error(msg)
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  if (step === "code") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm text-muted-foreground">
            Мы отправили код на номер <span className="font-medium text-foreground">{phone}</span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value)
              if (value.length === 6) verify(value)
            }}
            disabled={loading}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {loading && <Spinner className="size-5" />}
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("phone")
            setCode("")
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          Изменить номер
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Номер телефона</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+7 700 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-9 h-11"
            autoComplete="tel"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="h-11">
        {loading ? <Spinner className="size-4" /> : <>Получить код <ArrowRight className="size-4" /></>}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Нажимая кнопку, вы соглашаетесь с условиями использования
      </p>
    </form>
  )
}
