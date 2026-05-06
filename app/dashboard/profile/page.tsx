"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/api/auth-context"
import { api, ApiError, resolveMediaUrl } from "@/lib/api/client"
import { localize, type Locale } from "@/lib/api/i18n"
import type { User } from "@/lib/api/types"

const TIMEZONES = [
  "Asia/Almaty",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Atyrau",
  "Asia/Oral",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
]

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const [language, setLanguage] = useState<"ru" | "kk">("ru")
  const [timezone, setTimezone] = useState("Asia/Almaty")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setLanguage((user.preferredLanguage as "ru" | "kk") || "ru")
      setTimezone(user.timezone || "Asia/Almaty")
    }
  }, [user])

  const locale = ((user?.preferredLanguage as Locale) || "ru") as Locale
  const fullNameStr = localize(user?.fullName, locale)
  const displayName = fullNameStr || user?.username || user?.phone || "U"
  const initials = displayName.toString().slice(0, 2).toUpperCase()

  const onSave = async () => {
    setSaving(true)
    try {
      await api<User>("/users/me", {
        method: "PATCH",
        body: { preferredLanguage: language, timezone },
      })
      await refresh()
      toast.success("Настройки сохранены")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">Личные данные и настройки аккаунта</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={resolveMediaUrl(user?.avatarUrl)} alt={initials} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-lg">
                {fullNameStr || user?.username || "Пользователь"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.phone || "—"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lang">Язык интерфейса</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "ru" | "kk")}>
                <SelectTrigger id="lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="kk">Қазақша</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tz">Часовой пояс</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="tz">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
