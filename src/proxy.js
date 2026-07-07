import { updateSession } from "@/infrastructure/supabase/proxy";

export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta Proxy excepto para archivos internos y recursos estáticos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};