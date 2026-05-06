"use client"

import { SWRConfig } from "swr"
import { AuthProvider } from "@/lib/api/auth-context"
import { fetcher } from "@/lib/api/swr"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <AuthProvider scope="user">{children}</AuthProvider>
    </SWRConfig>
  )
}
