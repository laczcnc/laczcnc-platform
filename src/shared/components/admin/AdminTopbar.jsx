import Link from "next/link";

import { logout } from "@/app/admin/actions";

const mobileNavigation = [
  {
    name: "Centro de operaciones",
    href: "/admin/dashboard",
    enabled: true,
  },
  {
    name: "Cotizaciones",
    href: "/admin/cotizaciones",
    enabled: true,
  },
  {
    name: "Pedidos",
    href: "/admin/pedidos",
    enabled: true,
  },
  {
    name: "Clientes",
    href: "/admin/clientes",
    enabled: true,
  },
  {
    name: "Productos",
    href: "/admin/productos",
    enabled: true,
  },
  {
    name: "Producción",
    href: "/admin/produccion",
    enabled: true,
  },
  {
    name: "Talleres",
    href: "/admin/produccion/talleres",
    enabled: true,
  },
  {
    name: "Historial producción",
    href: "/admin/produccion/historial",
    enabled: true,
  },
  {
    name: "Entregas",
    href: "/admin/entregas",
    enabled: true,
  },
  {
    name: "Mapa",
    href: "/admin/mapa",
    enabled: true,
  },
  {
    name: "Galería",
    href: "/admin/galeria",
    enabled: true,
  },
  {
    name: "Usuarios",
    href: "/admin/usuarios",
    enabled: false,
  },
  {
    name: "Configuración",
    href: "/admin/configuracion",
    enabled: false,
  },
];

export default function AdminTopbar({
  displayName,
  email,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <details className="group relative lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/40 hover:text-orange-400">
              <span>Menú</span>

              <span className="text-xs text-zinc-600 transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <div className="absolute left-0 top-12 z-50 max-h-[calc(100vh-6rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/70">
              <div className="border-b border-zinc-800 px-3 pb-3 pt-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
                  Administración
                </p>

                <p className="mt-2 truncate text-sm font-black text-zinc-200">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-zinc-600">
                  {email}
                </p>
              </div>

              <nav
                aria-label="Navegación administrativa móvil"
                className="mt-3"
              >
                <ul className="space-y-1">
                  {mobileNavigation.map(
                    (item) => (
                      <li key={item.name}>
                        {item.enabled ? (
                          <Link
                            href={item.href}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-orange-400"
                          >
                            <span>
                              {item.name}
                            </span>

                            <span className="text-zinc-700">
                              →
                            </span>
                          </Link>
                        ) : (
                          <div className="flex cursor-not-allowed items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-zinc-700">
                            <span>
                              {item.name}
                            </span>

                            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                              Próximo
                            </span>
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              </nav>

              <div className="mt-3 border-t border-zinc-800 pt-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  Abrir tienda pública
                </a>
              </div>
            </div>
          </details>

          <Link
            href="/admin/dashboard"
            className="font-mono text-lg font-black text-orange-500 lg:hidden"
          >
            LACZ
            <span className="text-zinc-100">
              CnC
            </span>
          </Link>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-bold text-zinc-200">
              {displayName}
            </p>

            <p className="truncate text-xs text-zinc-600">
              {email}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-orange-400 sm:inline-flex"
          >
            Ver tienda
          </a>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400 sm:px-4"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}