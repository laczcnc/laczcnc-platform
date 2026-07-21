import Link from "next/link";
import { redirect } from "next/navigation";

import { normalizeRole } from "@/core/auth/permissions";
import { createClient } from "@/infrastructure/supabase/server";

import { login } from "./actions";

const errorMessages = {
  missing_fields:
    "Completa el correo y la contraseña.",

  invalid_credentials:
    "Correo o contraseña incorrectos.",

  session_required:
    "Debes iniciar sesión para acceder al panel.",

  access_denied:
    "Tu cuenta no está autorizada para acceder al sistema.",

  inactive:
    "Tu cuenta está desactivada. Consulta con el administrador.",

  invalid_role:
    "Tu cuenta no tiene un rol válido asignado.",

  profile_not_found:
    "La cuenta existe, pero no tiene un perfil interno configurado.",
};

const ROLE_HOME_ROUTES = {
  admin: "/admin/dashboard",
  manager: "/admin/dashboard",
  sales: "/admin/dashboard",
  production: "/admin/dashboard",
  delivery: "/admin/dashboard",
};

export const metadata = {
  title: "Acceso al equipo | LaczCNC",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = normalizeRole(profile?.role);

    if (
      profile?.is_active === true &&
      role
    ) {
      redirect(
        ROLE_HOME_ROUTES[role] ||
          "/admin/dashboard"
      );
    }

    await supabase.auth.signOut();
  }

  const params = await searchParams;

  const errorCode = String(
    params?.error ?? ""
  );

  const errorMessage =
    errorMessages[errorCode] ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/40">
        <div className="border-b border-zinc-800 bg-zinc-950/60 px-7 py-7">
          <Link
            href="/"
            className="font-mono text-lg font-black text-orange-500"
          >
            LACZ
            <span className="text-zinc-100">
              CnC
            </span>
          </Link>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
            Sistema interno
          </p>
        </div>

        <div className="p-7">
          <div className="mb-7">
            <h1 className="text-2xl font-black text-zinc-50">
              Acceso al equipo
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Ingresa con la cuenta creada por el
              administrador de LaczCNC.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
            >
              {errorMessage}
            </div>
          ) : null}

          <form
            action={login}
            className="space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Correo
              </span>

              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                placeholder="usuario@laczcnc.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Contraseña
              </span>

              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                placeholder="Escribe tu contraseña"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Ingresar al sistema
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Acceso para
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Administradores, gerentes, ventas,
              producción y personal de reparto.
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-sm font-semibold text-zinc-500 transition hover:text-orange-400"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>
    </main>
  );
}