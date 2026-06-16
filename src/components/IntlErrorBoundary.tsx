"use client"

import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps, ReactNode } from "react"

type Props = ComponentProps<typeof NextIntlClientProvider> & {
  children: ReactNode
}

/**
 * Client-side wrapper around NextIntlClientProvider that suppresses
 * benign INVALID_MESSAGE errors during Turbopack HMR.
 *
 * onError must live on the client — Server Components cannot pass
 * functions as props to Client Components.
 */
export function IntlErrorBoundary({ children, ...props }: Props) {
  return (
    <NextIntlClientProvider
      {...props}
      onError={(error) => {
        if (error.code === "INVALID_MESSAGE") return
        console.error(error)
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
