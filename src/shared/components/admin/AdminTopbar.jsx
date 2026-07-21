import Link from "next/link";

import { logout } from "@/app/admin/actions";

export default function AdminTopbar({
  displayName,
  email,
}) {
  return (
    <header className="admin-topbar sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
        <div className="min-w-0">
          <Link
            href="/admin"
            className="admin-topbar-brand hidden text-sm font-bold text-zinc-100"
          >
            LACZ CNC
          </Link>

          <p className="truncate text-sm font-semibold text-zinc-200">
            {displayName}
          </p>

          <p className="truncate text-xs text-zinc-600">
            {email}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-orange-400 sm:inline-flex"
          >
            Ver tienda
          </a>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400 sm:text-sm"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
