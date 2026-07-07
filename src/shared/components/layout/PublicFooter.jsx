import Link from "next/link";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <section>
          <h2 className="font-mono font-black text-orange-500">
            LACZ<span className="text-zinc-100">CnC</span>
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
            Impresión, sublimación, publicidad, merchandising y soluciones
            personalizadas.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold text-zinc-200">Contacto</h2>

          <div className="mt-3 space-y-2 text-sm text-zinc-500">
            <p>Juliaca, Puno, Perú</p>
            <p>WhatsApp: próximamente</p>
            <p>Correo: próximamente</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-zinc-200">Horario</h2>

          <div className="mt-3 space-y-2 text-sm text-zinc-500">
            <p>Lunes a viernes: 8:00–19:00</p>
            <p>Sábado: 9:00–17:00</p>
            <p>Domingo: cerrado</p>
          </div>
        </section>
      </div>

      <div className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:px-6 lg:px-8">
          <p>© {currentYear} LaczCnC. Todos los derechos reservados.</p>

          <Link
            href="/admin"
            aria-label="Acceso administrativo"
            className="rounded-lg px-3 py-2 font-semibold text-zinc-700 transition hover:bg-zinc-900 hover:text-orange-400"
          >
            Acceso interno
          </Link>
        </div>
      </div>
    </footer>
  );
}