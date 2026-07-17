import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Historial de producción",
};

export const dynamic = "force-dynamic";

const EVENT_LABELS = {
  created: "Orden creada",
  assignment_changed: "Asignación modificada",
  status_changed: "Estado modificado",
  progress_changed: "Progreso actualizado",
  stage_changed: "Etapa modificada",
  note_added: "Nota agregada",
};

const EVENT_STYLES = {
  created:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  assignment_changed:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  status_changed:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  progress_changed:
    "border-orange-500/30 bg-orange-500/10 text-orange-300",
  stage_changed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  note_added:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const VALUE_LABELS = {
  pending: "Pendiente",
  in_progress: "En producción",
  quality_control: "Control de calidad",
  ready: "Listo",
  paused: "Pausado",
  cancelled: "Cancelado",
  completed: "Completada",
  skipped: "Omitida",
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

function formatValue(value, eventType) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Sin asignar";
  }

  if (
    eventType === "progress_changed"
  ) {
    return `${value}%`;
  }

  return VALUE_LABELS[value] || value;
}

function getOrderNumber(order) {
  return `PED-${String(
    order?.order_number || 0
  ).padStart(6, "0")}`;
}

function getEventDescription(event) {
  const previousValue = formatValue(
    event.previous_value,
    event.event_type
  );

  const newValue = formatValue(
    event.new_value,
    event.event_type
  );

  if (event.event_type === "created") {
    return `La orden de producción fue creada con estado ${newValue}.`;
  }

  if (
    event.event_type ===
    "assignment_changed"
  ) {
    return "Se modificó el taller o responsable asignado.";
  }

  if (
    event.event_type ===
    "status_changed"
  ) {
    return `El estado cambió de ${previousValue} a ${newValue}.`;
  }

  if (
    event.event_type ===
    "progress_changed"
  ) {
    return `El progreso cambió de ${previousValue} a ${newValue}.`;
  }

  if (
    event.event_type === "stage_changed"
  ) {
    return `La etapa cambió de ${previousValue} a ${newValue}.`;
  }

  if (
    event.event_type === "note_added"
  ) {
    return event.notes || "Se agregó una nota.";
  }

  return "Se registró una modificación.";
}

export default async function ProductionHistoryPage({
  searchParams,
}) {
  await requireAdmin();

  const queryParams = await searchParams;

  const selectedEvent =
    typeof queryParams?.evento === "string"
      ? queryParams.evento
      : null;

  const supabase = await createClient();

  let query = supabase
    .from("production_events")
    .select(`
      id,
      production_job_id,
      event_type,
      previous_value,
      new_value,
      notes,
      created_at,
      production_jobs (
        id,
        order_id,
        status,
        progress,
        workshops (
          id,
          name
        ),
        orders (
          id,
          order_number,
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
      ),
      created_profile:profiles!production_events_created_by_fkey (
        id,
        full_name
      )
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (
    selectedEvent &&
    Object.prototype.hasOwnProperty.call(
      EVENT_LABELS,
      selectedEvent
    )
  ) {
    query = query.eq(
      "event_type",
      selectedEvent
    );
  }

  const { data: events, error } =
    await query;

  if (error) {
    console.error(
      "Error cargando historial de producción:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
  }

  const eventList = events || [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            Trazabilidad
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Historial de producción
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Registro cronológico de cambios,
            asignaciones, etapas y avances de las
            órdenes productivas.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/produccion"
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400"
          >
            Ver producción
          </Link>

          <Link
            href="/admin/produccion/talleres"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Ver talleres
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href="/admin/produccion/historial"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              !selectedEvent
                ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Todos
          </Link>

          {Object.entries(EVENT_LABELS).map(
            ([eventType, label]) => (
              <Link
                key={eventType}
                href={`/admin/produccion/historial?evento=${eventType}`}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                  selectedEvent === eventType
                    ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400",
                ].join(" ")}
              >
                {label}
              </Link>
            )
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Eventos mostrados
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-300">
            {eventList.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Filtro actual
          </p>

          <p className="mt-2 font-black text-zinc-200">
            {selectedEvent
              ? EVENT_LABELS[selectedEvent]
              : "Todos los eventos"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Límite del historial
          </p>

          <p className="mt-2 font-black text-zinc-200">
            Últimos 200 registros
          </p>
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudo cargar el historial.
          </p>

          <p className="mt-2 text-sm text-red-300/70">
            Revisa las relaciones y políticas RLS de
            production_events.
          </p>
        </div>
      ) : null}

      {!error &&
      eventList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            Todavía no existen eventos para este
            filtro.
          </p>

          <p className="mt-3 text-sm text-zinc-600">
            Los eventos aparecerán cuando se creen o
            modifiquen órdenes de producción.
          </p>
        </div>
      ) : null}

      <section className="relative mt-8">
        {eventList.length > 0 ? (
          <div className="absolute bottom-0 left-5 top-0 w-px bg-zinc-800 sm:left-7" />
        ) : null}

        <div className="grid gap-5">
          {eventList.map((event) => {
            const job =
              event.production_jobs;

            const order = job?.orders;

            const customer =
              order?.customers;

            const product =
              order?.products;

            return (
              <article
                key={event.id}
                className="relative pl-12 sm:pl-16"
              >
                <div className="absolute left-2 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 sm:left-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-emerald-500/30 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                            EVENT_STYLES[
                              event.event_type
                            ] ||
                              EVENT_STYLES.note_added,
                          ].join(" ")}
                        >
                          {EVENT_LABELS[
                            event.event_type
                          ] ||
                            event.event_type}
                        </span>

                        <span className="font-mono text-sm font-black text-orange-400">
                          {getOrderNumber(order)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-lg font-black text-zinc-100">
                        {product?.name ||
                          "Producto no especificado"}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {getEventDescription(
                          event
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <p className="text-sm font-bold text-zinc-400">
                        {formatDate(
                          event.created_at
                        )}
                      </p>

                      <p className="mt-2 text-xs text-zinc-600">
                        Registrado por:{" "}
                        {event.created_profile
                          ?.full_name ||
                          "Sistema"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-bold text-zinc-300">
                        {customer?.full_name ||
                          "Sin cliente"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Empresa
                      </p>

                      <p className="mt-1 text-sm font-bold text-zinc-300">
                        {customer?.company_name ||
                          "No registrada"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Taller
                      </p>

                      <p className="mt-1 text-sm font-bold text-cyan-300">
                        {job?.workshops?.name ||
                          "Sin asignar"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Progreso actual
                      </p>

                      <p className="mt-1 text-sm font-black text-violet-300">
                        {job?.progress ?? 0}%
                      </p>
                    </div>
                  </div>

                  {event.notes ? (
                    <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Nota
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-200/70">
                        {event.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/pedidos?pedido=${job?.order_id}`}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                    >
                      Ver pedido
                    </Link>

                    {product?.slug ? (
                      <Link
                        href={`/producto/${product.slug}`}
                        target="_blank"
                        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-violet-500 hover:text-violet-300"
                      >
                        Ver producto
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}