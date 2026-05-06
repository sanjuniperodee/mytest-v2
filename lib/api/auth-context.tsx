"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { api } from "./client"
import {
  Scope,
  clearTokens,
  getAccessToken,
  setTokens,
} from "./storage"
import type { AuthResponse, User } from "./types"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  scope: Scope
  signOut: () => void
  setSession: (data: AuthResponse) => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  scope = "user",
}: {
  children: React.ReactNode
  scope?: Scope
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = getAccessToken(scope)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api<User>("/users/me", { scope })
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const setSession = useCallback(
    (data: AuthResponse) => {
      setTokens(scope, data)
      setUser(data.user)
    },
    [scope],
  )

  const signOut = useCallback(() => {
    clearTokens(scope)
    setUser(null)
  }, [scope])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      scope,
      signOut,
      setSession,
      refresh: fetchMe,
    }),
    [user, isLoading, scope, signOut, setSession, fetchMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
