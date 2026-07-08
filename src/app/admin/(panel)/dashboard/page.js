import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Centro de operaciones",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  new: "Nueva",
  contacted: "Contactado",
  qualified: "Calificado",
  quoted: "Cotizado",
  won: "Ganado",
  lost: "Perdido",
  archived: "Archivado",
};

const STATUS_STYLES = {
  new: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  contacted:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  qualified:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  quoted:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  lost: "border-red-500/30 bg-red-500/10 text-red-300",
  archived:
    "border-zinc-700 bg-zinc-800 text-zinc-400",
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(
    /\D/g,
    ""
  );

  if (!digits) {
    return "";
  }

  if (digits.startsWith("51")) {
    return digits;
  }

  if (digits.length === 9) {
    return `51${digits}`;
  }

  return digits;
}

function buildWhatsAppUrl(request) {
  const phone = normalizeWhatsAppPhone(
    request.customer_phone
  );

  if (!phone) {
    return null;
  }

  const productName =
    request.products?.name ||
    "el producto solicitado";

  const message = [
    `Hola ${request.customer_name}.`,
    `Te contactamos de LaczCnC por tu solicitud de cotización para ${productName}.`,
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [
    productCountResponse,
    quoteCountResponse,
    newQuoteCountResponse,
    wonQuoteCountResponse,
    recentQuotesResponse,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("quote_requests")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("quote_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "new"),

    supabase
      .from("quote_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "won"),

    supabase
      .from("quote_requests")
      .select(`
        id,
        customer_name,
        customer_phone,
        quantity,
        status,
        created_at,
        products (
          id,
          name,
          slug
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  const responses = [
    productCountResponse,
    quoteCountResponse,
    newQuoteCountResponse,
    wonQuoteCountResponse,
    recentQuotesResponse,
  ];

  responses.forEach((response, index) => {
    if (response.error) {
      console.error(
        "Error cargando dashboard:",
        {
          queryIndex: index,
          code: response.error.code,
          message: response.error.message,
          details: response.error.details,
          hint: response.error.hint,
        }
      );
    }
  });

  const productCount =
    productCountResponse.count || 0;

  const quoteCount =
    quoteCountResponse.count || 0;

  const newQuoteCount =
    newQuoteCountResponse.count || 0;

  const wonQuoteCount =
    wonQuoteCountResponse.count || 0;

  const recentQuotes =
    recentQuotesResponse.data || [];

  const modules = [
    {
      name: "Solicitudes nuevas",
      value: newQuoteCount,
      description:
        "Cotizaciones pendientes de primer contacto.",
      accent: "text-blue-400",
      border: "hover:border-blue-500/40",
      href: "/admin/cotizaciones?estado=new",
    },
    {
      name: "Cotizaciones",
      value: quoteCount,
      description:
        "Total de oportunidades comerciales registradas.",
      accent: "text-orange-400",
      border: "hover:border-orange-500/40",
      href: "/admin/cotizaciones",
    },
    {
      name: "Productos",
      value: productCount,
      description:
        "Productos registrados actualmente en el catálogo.",
      accent: "text-violet-400",
      border: "hover:border-violet-500/40",
      href: "/admin/productos",
    },
    {
      name: "Ventas ganadas",
      value: wonQuoteCount,
      description:
        "Solicitudes cerradas exitosamente.",
      accent: "text-emerald-400",
      border:
        "hover:border-emerald-500/40",
      href: "/admin/cotizaciones?estado=won",
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Área privada
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Centro de operaciones
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Resumen comercial del catálogo y las
            solicitudes de cotización de LaczCnC.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/cotizaciones"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            Gestionar cotizaciones
          </Link>

          <Link
            href="/admin/productos"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Administrar productos
          </Link>
        </div>
      </section>

      {newQuoteCount > 0 ? (
        <section className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-black text-blue-200">
              Tienes{" "}
              {newQuoteCount === 1
                ? "1 solicitud nueva"
                : `${newQuoteCount} solicitudes nuevas`}
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-300/70">
              Estas solicitudes todavía no han sido
              marcadas como contactadas.
            </p>
          </div>

          <Link
            href="/admin/cotizaciones?estado=new"
            className="mt-4 inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-400/40 px-5 py-3 text-sm font-black text-blue-200 transition hover:bg-blue-400 hover:text-zinc-950 sm:mt-0"
          >
            Revisar solicitudes
          </Link>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="font-black text-emerald-300">
            No tienes solicitudes nuevas pendientes.
          </p>

          <p className="mt-2 text-sm text-emerald-300/60">
            Todas las consultas registradas ya fueron
            procesadas o clasificadas.
          </p>
        </section>
      )}

      <section
        aria-label="Indicadores principales"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className={[
              "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5",
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
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
              Actividad comercial
            </p>

            <h2 className="mt-2 text-2xl font-black text-zinc-100">
              Solicitudes recientes
            </h2>
          </div>

          <Link
            href="/admin/cotizaciones"
            className="text-sm font-black text-orange-400 transition hover:text-orange-300"
          >
            Ver todas →
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="font-bold text-zinc-400">
              Todavía no existen solicitudes de
              cotización.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="divide-y divide-zinc-800">
              {recentQuotes.map((request) => {
                const whatsappUrl =
                  buildWhatsAppUrl(request);

                return (
                  <article
                    key={request.id}
                    className="grid gap-4 p-5 transition hover:bg-zinc-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                            STATUS_STYLES[
                              request.status
                            ] ||
                              STATUS_STYLES.archived,
                          ].join(" ")}
                        >
                          {STATUS_LABELS[
                            request.status
                          ] || request.status}
                        </span>

                        <span className="text-xs text-zinc-600">
                          {formatDate(
                            request.created_at
                          )}
                        </span>
                      </div>

                      <h3 className="mt-3 truncate font-black text-zinc-100">
                        {request.customer_name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-orange-400">
                        {request.products?.name ||
                          "Consulta general"}
                      </p>

                      {request.quantity ? (
                        <p className="mt-1 text-xs text-zinc-600">
                          Cantidad aproximada:{" "}
                          {request.quantity}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
                        >
                          WhatsApp
                        </a>
                      ) : null}

                      <Link
                        href="/admin/cotizaciones"
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                      >
                        Gestionar
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Plataforma
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-100">
          Módulos operativos
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/cotizaciones"
            className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 transition hover:border-orange-500/60"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-black text-zinc-100">
                Cotizaciones
              </h3>

              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                Activo
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Solicitudes, contactos, oportunidades,
              estados y seguimiento comercial.
            </p>
          </Link>

          <Link
            href="/admin/productos"
            className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 transition hover:border-orange-500/60"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-black text-zinc-100">
                Catálogo
              </h3>

              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                Activo
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Productos, categorías, precios,
              disponibilidad e imágenes.
            </p>
          </Link>

          {[
            {
              name: "Pedidos",
              description:
                "Ventas, estados, pagos y seguimiento.",
            },
            {
              name: "Clientes",
              description:
                "Personas, empresas e instituciones.",
            },
            {
              name: "Producción",
              description:
                "Órdenes de trabajo, talleres y entregas.",
            },
            {
              name: "Mapa",
              description:
                "Rutas comerciales, zonas y visitas.",
            },
          ].map((operation) => (
            <article
              key={operation.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-black text-zinc-400">
                  {operation.name}
                </h3>

                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                  Próximo
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {operation.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}