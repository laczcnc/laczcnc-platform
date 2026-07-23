import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import {
  ALERT_PRIORITY,
  ALERT_TYPES,
  buildOperationalAlerts,
} from "@/modules/alerts/server/build-operational-alerts";

import {
  acknowledgeAlerts,
  restoreAlert,
  restoreAllAlerts,
} from "./actions";

export const metadata = {
  title: "Centro de alertas",
};

export const dynamic = "force-dynamic";

const PRIORITY_STYLES = {
  critical:
    "border-red-500/35 bg-red-500/10 text-red-300",
  high:
    "border-orange-500/35 bg-orange-500/10 text-orange-300",
  medium:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

const TYPE_STYLES = {
  inventory:
    "border-teal-500/30 bg-teal-500/10 text-teal-300",
  quote:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  production:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  delivery:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  visit:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const TYPE_SHORT_NAMES = {
  inventory: "IV",
  quote: "CO",
  production: "PR",
  delivery: "EN",
  visit: "VI",
};

const SUCCESS_MESSAGES = {
  acknowledged:
    "Alerta confirmada correctamente.",
  restored:
    "La alerta volvió a la bandeja activa.",
  all_restored:
    "Todas las alertas confirmadas fueron restauradas.",
};

const ERROR_MESSAGES = {
  no_alerts:
    "No existen alertas seleccionadas.",
  invalid_alert:
    "La alerta seleccionada no es válida.",
  acknowledge_failed:
    "No fue posible confirmar las alertas.",
  restore_failed:
    "No fue posible restaurar las alertas.",
};

function formatAlertDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const hasTime =
    String(value).includes("T");

  const normalizedValue =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value + "T12:00:00-05:00"
      : value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    ...(hasTime
      ? { timeStyle: "short" }
      : {}),
    timeZone: "America/Lima",
  }).format(new Date(normalizedValue));
}

function buildReturnPath({
  view,
  type,
  priority,
}) {
  const params = new URLSearchParams();

  if (view !== "active") {
    params.set("vista", view);
  }

  if (type !== "all") {
    params.set("tipo", type);
  }

  if (priority !== "all") {
    params.set("prioridad", priority);
  }

  const query = params.toString();

  return query
    ? "/admin/alertas?" + query
    : "/admin/alertas";
}

export default async function AlertsPage({
  searchParams,
}) {
  const {
    user,
    profile,
    supabase,
  } = await requirePermission(
    PERMISSIONS.ALERTS_VIEW
  );

  const queryParams = await searchParams;

  const selectedView =
    queryParams?.vista === "acknowledged"
      ? "acknowledged"
      : "active";

  const selectedType =
    typeof queryParams?.tipo === "string" &&
    Object.prototype.hasOwnProperty.call(
      ALERT_TYPES,
      queryParams.tipo
    )
      ? queryParams.tipo
      : "all";

  const selectedPriority =
    typeof queryParams?.prioridad ===
      "string" &&
    Object.prototype.hasOwnProperty.call(
      ALERT_PRIORITY,
      queryParams.prioridad
    )
      ? queryParams.prioridad
      : "all";

  const [
    alerts,
    acknowledgementsResponse,
  ] = await Promise.all([
    buildOperationalAlerts({
      supabase,
      role: profile.role,
    }),

    supabase
      .from("alert_acknowledgements")
      .select(
        "id, alert_key, acknowledged_at"
      )
      .eq("user_id", user.id)
      .order("acknowledged_at", {
        ascending: false,
      }),
  ]);

  if (acknowledgementsResponse.error) {
    console.error(
      "Error cargando confirmaciones de alertas:",
      acknowledgementsResponse.error
    );
  }

  const acknowledgements =
    acknowledgementsResponse.data || [];

  const acknowledgementMap = new Map(
    acknowledgements.map(
      (acknowledgement) => [
        acknowledgement.alert_key,
        acknowledgement,
      ]
    )
  );

  const activeAlerts = alerts.filter(
    (alert) =>
      !acknowledgementMap.has(alert.key)
  );

  const acknowledgedAlerts = alerts
    .filter((alert) =>
      acknowledgementMap.has(alert.key)
    )
    .map((alert) => ({
      ...alert,
      acknowledgedAt:
        acknowledgementMap.get(alert.key)
          ?.acknowledged_at,
    }));

  const visibleSource =
    selectedView === "acknowledged"
      ? acknowledgedAlerts
      : activeAlerts;

  const visibleAlerts =
    visibleSource.filter((alert) => {
      const matchesType =
        selectedType === "all" ||
        alert.type === selectedType;

      const matchesPriority =
        selectedPriority === "all" ||
        alert.priority ===
          selectedPriority;

      return (
        matchesType &&
        matchesPriority
      );
    });

  const criticalCount =
    activeAlerts.filter(
      (alert) =>
        alert.priority === "critical"
    ).length;

  const highCount =
    activeAlerts.filter(
      (alert) =>
        alert.priority === "high"
    ).length;

  const returnPath = buildReturnPath({
    view: selectedView,
    type: selectedType,
    priority: selectedPriority,
  });

  const successMessage =
    SUCCESS_MESSAGES[queryParams?.success];

  const errorMessage =
    ERROR_MESSAGES[queryParams?.error];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Operaciones
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Centro de alertas
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            Prioriza incidencias reales de ventas,
            producción, inventario, entregas y
            visitas comerciales.
          </p>
        </div>

        {selectedView === "active" &&
        visibleAlerts.length > 0 ? (
          <form action={acknowledgeAlerts}>
            <input
              type="hidden"
              name="return_path"
              value={returnPath}
            />

            {visibleAlerts.map((alert) => (
              <input
                key={alert.key}
                type="hidden"
                name="alert_key"
                value={alert.key}
              />
            ))}

            <button
              type="submit"
              className="w-full rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-300 sm:w-auto"
            >
              Confirmar visibles
            </button>
          </form>
        ) : selectedView ===
            "acknowledged" &&
          acknowledgements.length > 0 ? (
          <form action={restoreAllAlerts}>
            <button
              type="submit"
              className="w-full rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300 sm:w-auto"
            >
              Restaurar todas
            </button>
          </form>
        ) : null}
      </section>

      {successMessage ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      {acknowledgementsResponse.error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300"
        >
          Ejecuta la migración SQL del centro de
          alertas para activar confirmaciones.
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Alertas activas
          </p>

          <p className="mt-2 text-3xl font-black text-zinc-100">
            {activeAlerts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Críticas
          </p>

          <p className="mt-2 text-3xl font-black text-red-300">
            {criticalCount}
          </p>
        </article>

        <article className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Prioridad alta
          </p>

          <p className="mt-2 text-3xl font-black text-orange-300">
            {highCount}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Confirmadas vigentes
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-300">
            {acknowledgedAlerts.length}
          </p>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/45">
        <div className="flex overflow-x-auto border-b border-zinc-800 p-2">
          <Link
            href="/admin/alertas"
            className={[
              "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              selectedView === "active"
                ? "bg-amber-400 text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
            ].join(" ")}
          >
            Activas ({activeAlerts.length})
          </Link>

          <Link
            href="/admin/alertas?vista=acknowledged"
            className={[
              "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              selectedView ===
              "acknowledged"
                ? "bg-emerald-400 text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
            ].join(" ")}
          >
            Confirmadas (
            {acknowledgedAlerts.length})
          </Link>
        </div>

        <form
          method="get"
          className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[220px_220px_auto]"
        >
          <input
            type="hidden"
            name="vista"
            value={selectedView}
          />

          <select
            name="tipo"
            defaultValue={selectedType}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-500"
          >
            <option value="all">
              Todos los módulos
            </option>

            {Object.entries(
              ALERT_TYPES
            ).map(([type, label]) => (
              <option
                key={type}
                value={type}
              >
                {label}
              </option>
            ))}
          </select>

          <select
            name="prioridad"
            defaultValue={selectedPriority}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-500"
          >
            <option value="all">
              Todas las prioridades
            </option>

            {Object.entries(
              ALERT_PRIORITY
            ).map(
              ([priority, config]) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {config.label}
                </option>
              )
            )}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl border border-amber-500/40 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10"
            >
              Filtrar
            </button>

            <Link
              href={
                selectedView ===
                "acknowledged"
                  ? "/admin/alertas?vista=acknowledged"
                  : "/admin/alertas"
              }
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-500 transition hover:text-zinc-200"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      <section className="mt-6">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-10 text-center">
            <p className="text-lg font-semibold text-zinc-300">
              {selectedView === "active"
                ? "No hay alertas activas."
                : "No hay alertas confirmadas vigentes."}
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              {selectedView === "active"
                ? "Las nuevas incidencias aparecerán automáticamente."
                : "Cuando confirmes una alerta podrás restaurarla desde aquí."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => (
              <article
                key={alert.key}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <span
                      aria-hidden="true"
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-bold",
                        TYPE_STYLES[alert.type],
                      ].join(" ")}
                    >
                      {TYPE_SHORT_NAMES[
                        alert.type
                      ]}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            PRIORITY_STYLES[
                              alert.priority
                            ],
                          ].join(" ")}
                        >
                          {
                            ALERT_PRIORITY[
                              alert.priority
                            ].label
                          }
                        </span>

                        <span className="text-xs font-medium text-zinc-600">
                          {ALERT_TYPES[
                            alert.type
                          ]}
                        </span>
                      </div>

                      <h2 className="mt-2 text-base font-bold text-zinc-100 sm:text-lg">
                        {alert.title}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {alert.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
                        <span>
                          {alert.reference}
                        </span>

                        <span>
                          {formatAlertDate(
                            alert.occurredAt
                          )}
                        </span>

                        {alert.acknowledgedAt ? (
                          <span>
                            Confirmada{" "}
                            {formatAlertDate(
                              alert.acknowledgedAt
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      href={alert.href}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
                    >
                      Abrir módulo
                    </Link>

                    {selectedView ===
                    "active" ? (
                      <form
                        action={
                          acknowledgeAlerts
                        }
                      >
                        <input
                          type="hidden"
                          name="alert_key"
                          value={alert.key}
                        />

                        <input
                          type="hidden"
                          name="return_path"
                          value={returnPath}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300"
                        >
                          Confirmar
                        </button>
                      </form>
                    ) : (
                      <form
                        action={restoreAlert}
                      >
                        <input
                          type="hidden"
                          name="alert_key"
                          value={alert.key}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10"
                        >
                          Restaurar
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
