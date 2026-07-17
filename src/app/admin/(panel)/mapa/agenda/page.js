import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Agenda de visitas",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  pending: "Pendiente",
  visited: "Visitado",
  interested: "Interesado",
  not_interested: "No interesado",
  reschedule: "Reagendar",
};

const STATUS_STYLES = {
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  visited:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  interested:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  not_interested:
    "border-red-500/30 bg-red-500/10 text-red-300",
  reschedule:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

const TYPE_LABELS = {
  prospect: "Prospecto",
  customer: "Cliente",
  institution: "Institución",
  company: "Empresa",
  business: "Comercio",
  event: "Evento",
  workshop: "Taller",
  other: "Otro",
};

const EVENT_LABELS = {
  created: "Marcador creado",
  visit_registered: "Visita registrada",
  status_changed: "Estado modificado",
  visit_scheduled: "Visita programada",
  assignment_changed: "Responsable modificado",
  note_added: "Nota agregada",
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function getLimaDateKey(value) {
  if (!value) {
    return "";
  }

  const parts =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(value));

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
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

function buildWhatsAppUrl(location) {
  const phone = normalizeWhatsAppPhone(
    location.phone
  );

  if (!phone) {
    return null;
  }

  const contactName =
    location.contact_name ||
    location.name;

  const message = [
    `Hola ${contactName}.`,
    "Te contactamos de LaczCnC para coordinar nuestra visita comercial.",
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}

export default async function VisitAgendaPage({
  searchParams,
}) {
  await requireAdmin();

  const queryParams = await searchParams;

  const selectedView =
    typeof queryParams?.vista === "string"
      ? queryParams.vista
      : "today";

  const supabase = await createClient();

  const [
    locationsResponse,
    eventsResponse,
  ] = await Promise.all([
    supabase
      .from("map_locations")
      .select(`
        id,
        name,
        contact_name,
        phone,
        organization_name,
        location_type,
        status,
        latitude,
        longitude,
        address,
        city,
        district,
        reference,
        notes,
        next_visit_at,
        last_visit_at,
        assigned_to,
        assigned_profile:profiles!map_locations_assigned_to_fkey (
          id,
          full_name
        )
      `)
      .eq("is_active", true)
      .not("next_visit_at", "is", null)
      .order("next_visit_at", {
        ascending: true,
      }),

    supabase
      .from("map_visit_events")
      .select(`
        id,
        map_location_id,
        event_type,
        previous_status,
        new_status,
        notes,
        visited_at,
        next_visit_at,
        created_at,
        map_locations (
          id,
          name,
          organization_name
        ),
        created_profile:profiles!map_visit_events_created_by_fkey (
          id,
          full_name
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(30),
  ]);

  if (locationsResponse.error) {
    console.error(
      "Error cargando agenda:",
      locationsResponse.error
    );
  }

  if (eventsResponse.error) {
    console.error(
      "Error cargando historial de visitas:",
      eventsResponse.error
    );
  }

  const locations =
    locationsResponse.data || [];

  const events =
    eventsResponse.data || [];

  const now = new Date();

  const todayKey = getLimaDateKey(now);

  const todayVisits = locations.filter(
    (location) =>
      getLimaDateKey(
        location.next_visit_at
      ) === todayKey
  );

  const overdueVisits = locations.filter(
    (location) =>
      new Date(location.next_visit_at) <
        now &&
      getLimaDateKey(
        location.next_visit_at
      ) !== todayKey
  );

  const upcomingVisits = locations.filter(
    (location) =>
      new Date(location.next_visit_at) >
        now &&
      getLimaDateKey(
        location.next_visit_at
      ) !== todayKey
  );

  let visibleVisits = todayVisits;

  if (selectedView === "upcoming") {
    visibleVisits = upcomingVisits;
  }

  if (selectedView === "overdue") {
    visibleVisits = overdueVisits;
  }

  if (selectedView === "all") {
    visibleVisits = locations;
  }

  const viewLabels = {
    today: "Visitas de hoy",
    upcoming: "Próximas visitas",
    overdue: "Visitas atrasadas",
    all: "Todas las visitas",
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
            Seguimiento territorial
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Agenda de visitas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Organiza contactos pendientes,
            próximas reuniones y visitas que
            requieren reagendamiento.
          </p>
        </div>

        <Link
          href="/admin/mapa"
          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
        >
          Abrir mapa
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/mapa/agenda?vista=today"
          className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 transition hover:border-blue-500/50"
        >
          <p className="text-sm font-bold text-zinc-500">
            Para hoy
          </p>

          <p className="mt-2 text-4xl font-black text-blue-300">
            {todayVisits.length}
          </p>
        </Link>

        <Link
          href="/admin/mapa/agenda?vista=upcoming"
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition hover:border-emerald-500/50"
        >
          <p className="text-sm font-bold text-zinc-500">
            Próximas
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {upcomingVisits.length}
          </p>
        </Link>

        <Link
          href="/admin/mapa/agenda?vista=overdue"
          className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 transition hover:border-red-500/50"
        >
          <p className="text-sm font-bold text-zinc-500">
            Atrasadas
          </p>

          <p className="mt-2 text-4xl font-black text-red-300">
            {overdueVisits.length}
          </p>
        </Link>
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {[
            {
              value: "today",
              label: "Hoy",
            },
            {
              value: "upcoming",
              label: "Próximas",
            },
            {
              value: "overdue",
              label: "Atrasadas",
            },
            {
              value: "all",
              label: "Todas",
            },
          ].map((view) => (
            <Link
              key={view.value}
              href={`/admin/mapa/agenda?vista=${view.value}`}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                selectedView === view.value
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              {view.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-2xl font-black text-zinc-100">
          {viewLabels[selectedView] ||
            "Agenda"}
        </h2>

        {locationsResponse.error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">
              No se pudo cargar la agenda.
            </p>
          </div>
        ) : null}

        {!locationsResponse.error &&
        visibleVisits.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="font-black text-zinc-300">
              No existen visitas para esta vista.
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5">
          {visibleVisits.map((location) => {
            const whatsappUrl =
              buildWhatsAppUrl(location);

            const isOverdue =
              new Date(
                location.next_visit_at
              ) < now;

            return (
              <article
                key={location.id}
                className={[
                  "rounded-2xl border bg-zinc-900/60 p-5 sm:p-6",
                  isOverdue
                    ? "border-red-500/30"
                    : "border-zinc-800",
                ].join(" ")}
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-black uppercase",
                          STATUS_STYLES[
                            location.status
                          ],
                        ].join(" ")}
                      >
                        {STATUS_LABELS[
                          location.status
                        ]}
                      </span>

                      <span className="text-xs font-bold text-cyan-300">
                        {TYPE_LABELS[
                          location.location_type
                        ]}
                      </span>

                      {isOverdue ? (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase text-red-300">
                          Atrasada
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 text-xl font-black text-zinc-100">
                      {location.name}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-orange-400">
                      {location.organization_name ||
                        "Sin organización"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Contacto:{" "}
                      {location.contact_name ||
                        "No definido"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-600">
                      {location.district ||
                        location.city ||
                        "Ubicación sin detallar"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p
                      className={[
                        "font-black",
                        isOverdue
                          ? "text-red-300"
                          : "text-violet-300",
                      ].join(" ")}
                    >
                      {formatDate(
                        location.next_visit_at
                      )}
                    </p>

                    <p className="mt-2 text-xs text-zinc-600">
                      Responsable:{" "}
                      {location.assigned_profile
                        ?.full_name ||
                        "Sin asignar"}
                    </p>
                  </div>
                </div>

                {location.notes ? (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Notas
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                      {location.notes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin/mapa"
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-zinc-950"
                  >
                    Ver en mapa
                  </Link>

                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
            Actividad reciente
          </p>

          <h2 className="mt-2 text-2xl font-black text-zinc-100">
            Historial de visitas
          </h2>
        </div>

        {eventsResponse.error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">
              No se pudo cargar el historial.
            </p>
          </div>
        ) : null}

        {!eventsResponse.error &&
        events.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="font-bold text-zinc-400">
              Todavía no existen eventos.
            </p>
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <div className="divide-y divide-zinc-800">
            {events.map((event) => (
              <article
                key={event.id}
                className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                    {EVENT_LABELS[
                      event.event_type
                    ] || event.event_type}
                  </p>

                  <h3 className="mt-2 font-black text-zinc-100">
                    {event.map_locations
                      ?.name ||
                      "Ubicación eliminada"}
                  </h3>

                  {event.notes ? (
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {event.notes}
                    </p>
                  ) : null}
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-zinc-400">
                    {formatShortDate(
                      event.created_at
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {event.created_profile
                      ?.full_name ||
                      "Sistema"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}