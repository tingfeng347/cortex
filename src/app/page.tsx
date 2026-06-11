import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { routing } from "@/i18n/routing"

export default async function RootPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value

  if (locale && routing.locales.includes(locale as never)) {
    redirect(`/${locale}`)
  }

  redirect(`/${routing.defaultLocale}`)
}
