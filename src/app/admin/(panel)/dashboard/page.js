import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Centro de operaciones",
};

export const dynamic = "force-dynamic";

const QUOTE_STATUS_LABELS = {
  new: "Nueva",
  contacted: "Contactado",
  qualified: "Calificado",
  quoted: "Cotizado",
  won: "Ganado",
  lost: "Perdido",
  archived: "Archivado",
};

const QUOTE_STATUS_STYLES = {
  new:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  contacted:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  qualified:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  quoted:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  won:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  lost:
    "border-red-500/30 bg-red-500/10 text-red-300",
  archived:
    "border-zinc-700 bg-zinc-800 text-zinc-400",
};

const PRODUCTION_STATUS_LABELS = {
  pending: "Pendiente",
  in_progress: "En producción",
  quality_control: "Control de calidad",
  ready: "Listo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const PRODUCTION_STATUS_STYLES = {
  pending:
    "border-zinc-700 bg-zinc-800 text-zinc-300",
  in_progress:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  quality_control:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  ready:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  paused:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  cancelled:
    "border-red-500/30 bg-red-500/10 text-red-300",
};

const PRIORITY_LABELS = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const PRIORITY_STYLES = {
  low: "text-zinc-500",
  normal: "text-blue-300",
  high: "text-orange-300",
  urgent: "text-red-300",
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

function formatDateOnly(value) {
  if (!value) {
    return "Sin fecha límite";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(new Date(`${value}T12:00:00`));
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(
    phone || ""
  ).replace(/\D/g, "");

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

function getOrderNumber(order) {
  return `PED-${String(
    order?.order_number || 0
  ).padStart(6, "0")}`;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = await createClient();

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [
    productCountResponse,
    quoteCountResponse,
    newQuoteCountResponse,
    wonQuoteCountResponse,
    activeOrderCountResponse,
    productionCountResponse,
    readyProductionCountResponse,
    overdueProductionCountResponse,
    recentQuotesResponse,
    priorityProductionResponse,
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
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "confirmed",
        "production",
        "ready",
        "delivered",
      ]),

    supabase
      .from("production_jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "pending",
        "in_progress",
        "quality_control",
        "paused",
      ]),

    supabase
      .from("production_jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "ready"),

    supabase
      .from("production_jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .lt("due_date", today)
      .not(
        "status",
        "in",
        '("ready","cancelled")'
      ),

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

    supabase
      .from("production_jobs")
      .select(`
        id,
        order_id,
        status,
        priority,
        progress,
        due_date,
        production_notes,
        workshops (
          id,
          name
        ),
        orders (
          id,
          order_number,
          quantity,
          customers (
            id,
            full_name,
            company_name
          ),
          products (
            id,
            name,
            slug
          )
        )
      `)
      .not(
        "status",
        "in",
        '("ready","cancelled")'
      )
      .order("priority", {
        ascending: false,
      })
      .order("due_date", {
        ascending: true,
        nullsFirst: false,
      })
      .limit(6),
  ]);

  const responses = [
    productCountResponse,
    quoteCountResponse,
    newQuoteCountResponse,
    wonQuoteCountResponse,
    activeOrderCountResponse,
    productionCountResponse,
    readyProductionCountResponse,
    overdueProductionCountResponse,
    recentQuotesResponse,
    priorityProductionResponse,
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

  const activeOrderCount =
    activeOrderCountResponse.count || 0;

  const productionCount =
    productionCountResponse.count || 0;

  const readyProductionCount =
    readyProductionCountResponse.count || 0;

  const overdueProductionCount =
    overdueProductionCountResponse.count || 0;

  const recentQuotes =
    recentQuotesResponse.data || [];

  const priorityProduction =
    priorityProductionResponse.data || [];

  const commercialModules = [
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
        "Oportunidades comerciales registradas.",
      accent: "text-orange-400",
      border:
        "hover:border-orange-500/40",
      href: "/admin/cotizaciones",
    },
    {
      name: "Productos",
      value: productCount,
      description:
        "Productos registrados en el catálogo.",
      accent: "text-violet-400",
      border:
        "hover:border-violet-500/40",
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

  const operationalModules = [
    {
      name: "Pedidos activos",
      value: activeOrderCount,
      description:
        "Pedidos confirmados, en producción o entrega.",
      accent: "text-orange-400",
      border:
        "hover:border-orange-500/40",
      href: "/admin/pedidos",
    },
    {
      name: "En producción",
      value: productionCount,
      description:
        "Órdenes productivas todavía activas.",
      accent: "text-violet-400",
      border:
        "hover:border-violet-500/40",
      href: "/admin/produccion",
    },
    {
      name: "Listos para entregar",
      value: readyProductionCount,
      description:
        "Trabajos terminados pendientes de entrega.",
      accent: "text-emerald-400",
      border:
        "hover:border-emerald-500/40",
      href: "/admin/produccion?estado=ready",
    },
    {
      name: "Producción atrasada",
      value: overdueProductionCount,
      description:
        "Órdenes que superaron su fecha límite.",
      accent: "text-red-400",
      border:
        "hover:border-red-500/40",
      href: "/admin/produccion",
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
            Vista general de ventas, pedidos,
            producción y entregas de LaczCnC.
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
            href="/admin/produccion"
            className="inline-flex items-center justify-center rounded-xl border border-violet-500/40 px-5 py-3 text-sm font-black text-violet-300 transition hover:bg-violet-500 hover:text-white"
          >
            Abrir producción
          </Link>
        </div>
      </section>

      {overdueProductionCount > 0 ? (
        <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-black text-red-200">
              Atención:{" "}
              {overdueProductionCount === 1
                ? "1 orden de producción está atrasada."
                : `${overdueProductionCount} órdenes de producción están atrasadas.`}
            </p>

            <p className="mt-2 text-sm leading-6 text-red-300/70">
              Revisa las fechas límite y reasigna
              recursos si fuera necesario.
            </p>
          </div>

          <Link
            href="/admin/produccion"
            className="mt-4 inline-flex shrink-0 items-center justify-center rounded-xl border border-red-400/40 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white sm:mt-0"
          >
            Revisar producción
          </Link>
        </section>
      ) : null}

      {newQuoteCount > 0 ? (
        <section className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-black text-blue-200">
              Tienes{" "}
              {newQuoteCount === 1
                ? "1 solicitud nueva"
                : `${newQuoteCount} solicitudes nuevas`}
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-300/70">
              Estas solicitudes todavía no fueron
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
      ) : null}

      {newQuoteCount === 0 &&
      overdueProductionCount === 0 ? (
        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="font-black text-emerald-300">
            No existen alertas operativas pendientes.
          </p>

          <p className="mt-2 text-sm text-emerald-300/60">
            Las solicitudes comerciales y las fechas
            de producción se encuentran controladas.
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Operaciones
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-100">
          Estado productivo
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {operationalModules.map(
            (module) => (
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
            )
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
              Prioridades
            </p>

            <h2 className="mt-2 text-2xl font-black text-zinc-100">
              Producción que requiere atención
            </h2>
          </div>

          <Link
            href="/admin/produccion"
            className="text-sm font-black text-violet-400 transition hover:text-violet-300"
          >
            Ver tablero completo →
          </Link>
        </div>

        {priorityProduction.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="font-bold text-zinc-400">
              No existen órdenes de producción
              activas.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="divide-y divide-zinc-800">
              {priorityProduction.map((job) => {
                const isOverdue =
                  job.due_date &&
                  job.due_date < today;

                return (
                  <article
                    key={job.id}
                    className="grid gap-5 p-5 transition hover:bg-zinc-900 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                            PRODUCTION_STATUS_STYLES[
                              job.status
                            ] ||
                              PRODUCTION_STATUS_STYLES.pending,
                          ].join(" ")}
                        >
                          {PRODUCTION_STATUS_LABELS[
                            job.status
                          ] || job.status}
                        </span>

                        <span
                          className={[
                            "text-xs font-black uppercase",
                            PRIORITY_STYLES[
                              job.priority
                            ] ||
                              PRIORITY_STYLES.normal,
                          ].join(" ")}
                        >
                          Prioridad{" "}
                          {PRIORITY_LABELS[
                            job.priority
                          ] || job.priority}
                        </span>

                        {isOverdue ? (
                          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase text-red-300">
                            Atrasado
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 truncate font-black text-zinc-100">
                        {job.orders?.products
                          ?.name ||
                          "Producto no especificado"}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        {getOrderNumber(
                          job.orders
                        )}{" "}
                        —{" "}
                        {job.orders?.customers
                          ?.full_name ||
                          "Cliente no especificado"}
                      </p>

                      <p className="mt-1 text-xs text-cyan-400">
                        {job.workshops?.name ||
                          "Sin taller asignado"}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-600">
                          Progreso
                        </span>

                        <span className="text-violet-300">
                          {job.progress}%
                        </span>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${job.progress}%`,
                          }}
                        />
                      </div>

                      <p
                        className={[
                          "mt-2 text-xs",
                          isOverdue
                            ? "font-bold text-red-300"
                            : "text-zinc-600",
                        ].join(" ")}
                      >
                        Límite:{" "}
                        {formatDateOnly(
                          job.due_date
                        )}
                      </p>
                    </div>

                    <Link
                      href="/admin/produccion"
                      className="inline-flex items-center justify-center rounded-xl border border-violet-500/30 px-4 py-2 text-sm font-black text-violet-300 transition hover:bg-violet-500 hover:text-white"
                    >
                      Gestionar
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Área comercial
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-100">
          Indicadores comerciales
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {commercialModules.map(
            (module) => (
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
            )
          )}
        </div>
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
                            QUOTE_STATUS_STYLES[
                              request.status
                            ] ||
                              QUOTE_STATUS_STYLES.archived,
                          ].join(" ")}
                        >
                          {QUOTE_STATUS_LABELS[
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
          {[
            {
              name: "Cotizaciones",
              description:
                "Solicitudes, contactos y oportunidades.",
              href: "/admin/cotizaciones",
              accent: "orange",
            },
            {
              name: "Pedidos",
              description:
                "Ventas, pagos, estados y comprobantes.",
              href: "/admin/pedidos",
              accent: "orange",
            },
            {
              name: "Clientes",
              description:
                "Personas, empresas e instituciones.",
              href: "/admin/clientes",
              accent: "cyan",
            },
            {
              name: "Producción",
              description:
                "Órdenes, talleres, etapas e historial.",
              href: "/admin/produccion",
              accent: "violet",
            },
            {
              name: "Catálogo",
              description:
                "Productos, categorías e imágenes.",
              href: "/admin/productos",
              accent: "orange",
            },
          ].map((operation) => (
            <Link
              key={operation.name}
              href={operation.href}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 transition hover:border-emerald-500/50"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-black text-zinc-100">
                  {operation.name}
                </h3>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                  Activo
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {operation.description}
              </p>
            </Link>
          ))}

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-black text-zinc-400">
                Mapa
              </h3>

              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                Próximo
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Rutas comerciales, zonas, visitas y
              seguimiento territorial.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}