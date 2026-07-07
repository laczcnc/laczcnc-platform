export const metadata = {
  title: "Centro de operaciones",
};

const modules = [
  {
    name: "Pedidos",
    value: "0",
    description: "Pedidos registrados actualmente.",
    accent: "text-blue-400",
    border: "hover:border-blue-500/40",
  },
  {
    name: "Clientes",
    value: "0",
    description: "Contactos e instituciones registradas.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/40",
  },
  {
    name: "Productos",
    value: "0",
    description: "Productos disponibles en el catálogo.",
    accent: "text-orange-400",
    border: "hover:border-orange-500/40",
  },
  {
    name: "Producción",
    value: "0",
    description: "Órdenes actualmente en producción.",
    accent: "text-violet-400",
    border: "hover:border-violet-500/40",
  },
];

const operations = [
  {
    name: "Pedidos",
    description: "Cotizaciones, ventas, estados y seguimiento.",
    status: "Pendiente",
  },
  {
    name: "CRM",
    description: "Clientes, instituciones y oportunidades comerciales.",
    status: "Pendiente",
  },
  {
    name: "Catálogo",
    description: "Productos, categorías, precios y disponibilidad.",
    status: "Pendiente",
  },
  {
    name: "Producción",
    description: "Órdenes de trabajo, talleres y entregas.",
    status: "Pendiente",
  },
  {
    name: "Galería",
    description: "Contenido visible en la página pública.",
    status: "Pendiente",
  },
  {
    name: "Mapa",
    description: "Rutas comerciales, zonas y visitas.",
    status: "Pendiente",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          Área privada
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
          Centro de operaciones
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
          Resumen general de ventas, clientes, catálogo y producción de
          LaczCnC.
        </p>
      </section>

      <section
        aria-label="Indicadores principales"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {modules.map((module) => (
          <article
            key={module.name}
            className={[
              "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition",
              module.border,
            ].join(" ")}
          >
            <p className="text-sm font-bold text-zinc-400">
              {module.name}
            </p>

            <p
              className={[
                "mt-3 text-4xl font-black",
                module.accent,
              ].join(" ")}
            >
              {module.value}
            </p>

            <p className="mt-4 text-sm leading-6 text-zinc-600">
              {module.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Plataforma
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-100">
          Módulos operativos
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {operations.map((operation) => (
            <article
              key={operation.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-orange-500/30"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-black text-zinc-100">
                  {operation.name}
                </h3>

                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                  {operation.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {operation.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}