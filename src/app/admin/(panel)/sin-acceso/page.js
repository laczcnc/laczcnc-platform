import Link from "next/link";

import { requireAuthenticatedProfile } from "@/core/auth/require-permission";
import {
  getAdminNavigation,
} from "@/shared/config/admin-navigation";

export const metadata = {
  title: "Acceso restringido | LaczCNC",
};

export const dynamic = "force-dynamic";

const ROLE_LABELS = {
  admin: "Administrador",
  manager: "Gerente",
  sales: "Ventas",
  production: "Producción",
  delivery: "Reparto",
};

export default async function AccessDeniedPage() {
  const { profile } =
    await requireAuthenticatedProfile();

  const availableNavigation =
    getAdminNavigation(profile.role);

  const firstAvailableModule =
    availableNavigation.find(
      (item) =>
        item.enabled === true &&
        item.href !== "/admin/sin-acceso"
    );

  const returnHref =
    firstAvailableModule?.href ||
    "/admin/dashboard";

  const returnLabel =
    firstAvailableModule?.name ||
    "Dashboard";

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/30">
        <div className="border-b border-zinc-800 bg-zinc-950/70 px-6 py-8 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-2xl font-black text-amber-300">
            !
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-400">
            Acceso restringido
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Este módulo no está disponible
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">
            Tu cuenta está activa, pero el rol
            asignado no tiene permiso para abrir
            esta sección del sistema.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-7 sm:px-10">
          <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Usuario
              </p>

              <p className="mt-2 font-black text-zinc-200">
                {profile.full_name ||
                  "Usuario sin nombre"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Rol asignado
              </p>

              <p className="mt-2 font-black text-zinc-200">
                {ROLE_LABELS[profile.role] ||
                  profile.role}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
            <p className="font-black text-blue-200">
              ¿Necesitas entrar a este módulo?
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-300/70">
              Solicita al administrador que cambie
              tu rol o revise los permisos de tu
              cuenta desde Gestión de usuarios.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={returnHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-6 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Ir a {returnLabel}
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-6 text-sm font-black text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Ver tienda pública
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}