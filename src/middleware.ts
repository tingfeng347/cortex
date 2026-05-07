import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  // Skip "/api/*" and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|fonts).*)"],
}
