export const metadata = {
  title: "Contacto | LaczCnC",
};

export default function ContactPage() {
  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
        Contacto
      </p>

      <h1 className="mt-2 text-4xl font-black text-zinc-50">
        Cuéntanos qué necesitas
      </h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-xl font-black">Información</h2>

          <div className="mt-5 space-y-4 text-sm text-zinc-400">
            <p>Ubicación: Juliaca, Puno, Perú</p>
            <p>WhatsApp: próximamente</p>
            <p>Correo: próximamente</p>
            <p>Horario: lunes a sábado</p>
          </div>
        </div>

        <form className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Nombre
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                placeholder="Tu nombre"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                WhatsApp
              </span>
              <input
                type="tel"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                placeholder="+51..."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Mensaje
              </span>
              <textarea
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                placeholder="Describe el producto o servicio..."
              />
            </label>

            <button
              type="button"
              className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Enviar consulta
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}