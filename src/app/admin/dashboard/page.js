import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { logout } from "../actions";

export const metadata = {
  title: "Centro de operaciones",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login?error=session_required");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-mono text-lg font-black text-orange-500">
              LACZ<span className="text-zinc-100">CnC</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-zinc-400 transition hover:text-orange-400"
            >
              Ver tienda
            </a>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-red-500/60 hover:text-red-400"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
          Área privada
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-50">
          Centro de operaciones
        </h1>

        <p className="mt-3 text-zinc-500">
          Sesión iniciada como {user.email}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Pedidos",
            "Clientes",
            "Productos",
            "Producción",
            "Galería",
            "Mapa",
            "Usuarios",
            "Configuración",
          ].map((module) => (
            <article
              key={module}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6"
            >
              <h2 className="font-black text-zinc-100">{module}</h2>

              <p className="mt-2 text-sm text-zinc-500">
                Módulo pendiente de implementación.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}