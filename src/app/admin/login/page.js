import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { login } from "./actions";

const errorMessages = {
  missing_fields: "Completa el correo y la contraseña.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  session_required: "Debes iniciar sesión para acceder al panel.",
  access_denied:
    "Tu cuenta no está autorizada para acceder al panel administrativo.",
};

export const metadata = {
  title: "Acceso administrativo",
};

export default async function AdminLoginPage({ searchParams }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (
      profile?.role === "admin" &&
      profile?.is_active === true
    ) {
      redirect("/admin/dashboard");
    }

    await supabase.auth.signOut();
  }

  const params = await searchParams;
  const errorMessage = errorMessages[params?.error];

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-7 shadow-2xl shadow-black/40">
        <div className="mb-7">
          <p className="font-mono text-lg font-black text-orange-500">
            LACZ<span className="text-zinc-100">CnC</span>
          </p>

          <h1 className="mt-5 text-2xl font-black text-zinc-50">
            Acceso administrativo
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Área privada para cuentas autorizadas.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={login} className="space-y-5">
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
              placeholder="administrador@laczcnc.com"
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
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            Ingresar
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-zinc-500 transition hover:text-orange-400"
        >
          Volver a la tienda
        </Link>
      </section>
    </main>
  );
}