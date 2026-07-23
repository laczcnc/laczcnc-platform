import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";
import InlineActionMenu from "@/shared/components/admin/InlineActionMenu";

import {
  changeProductionPriority,
  changeProductionStatus,
  createProductionJob,
  updateProductionJob,
  updateProductionStage,
} from "./actions";

export const metadata = {
  title: "Producción",
};

export const dynamic = "force-dynamic";

const JOB_STATUS_LABELS = {
  pending: "Pendiente",
  in_progress: "En producción",
  quality_control: "Control de calidad",
  ready: "Listo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const JOB_STATUS_STYLES = {
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

const STAGE_STATUS_LABELS = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  skipped: "Omitida",
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(
    new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    )
  );
}

function getOrderNumber(order) {
  return `PED-${String(
    order?.order_number || 0
  ).padStart(6, "0")}`;
}

export default async function ProductionPage({
  searchParams,
}) {
  await requirePermission(PERMISSIONS.PRODUCTION_VIEW);

  const queryParams = await searchParams;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : null;

  const supabase = await createClient();

  let jobsQuery = supabase
    .from("production_jobs")
    .select(`
      id,
      order_id,
      workshop_id,
      assigned_to,
      status,
      priority,
      progress,
      scheduled_start_date,
      due_date,
      started_at,
      completed_at,
      production_notes,
      quality_notes,
      created_at,
      orders (
        id,
        order_number,
        status,
        quantity,
        created_at,
        requested_delivery_date,
        customers (
          id,
          full_name,
          company_name,
          phone
        ),
        products (
          id,
          name,
          slug,
          image_url
        )
      ),
      workshops (
        id,
        name,
        specialty,
        phone
      ),
      assigned_profile:profiles!production_jobs_assigned_to_fkey (
        id,
        full_name
      ),
      production_stages (
        id,
        name,
        sequence_number,
        status,
        due_date,
        started_at,
        completed_at,
        notes
      )
    `)
    .order("due_date", {
      ascending: true,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (
    selectedStatus &&
    Object.prototype.hasOwnProperty.call(
      JOB_STATUS_LABELS,
      selectedStatus
    )
  ) {
    jobsQuery = jobsQuery.eq(
      "status",
      selectedStatus
    );
  }

  const [
    jobsResponse,
    eligibleOrdersResponse,
    workshopsResponse,
    profilesResponse,
  ] = await Promise.all([
    jobsQuery,

    supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        quantity,
        requested_delivery_date,
        customers (
          id,
          full_name,
          company_name
        ),
        products (
          id,
          name
        ),
        production_jobs (
          id
        )
      `)
      .in("status", [
        "confirmed",
        "production",
        "ready",
      ])
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("workshops")
      .select(`
        id,
        name,
        specialty,
        phone,
        city,
        is_active
      `)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        is_active
      `)
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const responses = [
    jobsResponse,
    eligibleOrdersResponse,
    workshopsResponse,
    profilesResponse,
  ];

  responses.forEach((response, index) => {
    if (response.error) {
      console.error(
        "Error cargando producción:",
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

  const jobs = jobsResponse.data || [];

  const eligibleOrders =
    (
      eligibleOrdersResponse.data || []
    ).filter(
      (order) =>
        !order.production_jobs ||
        order.production_jobs.length === 0
    );

  const workshops =
    workshopsResponse.data || [];

  const profiles =
    profilesResponse.data || [];

  const activeJobs = jobs.filter(
    (job) =>
      !["ready", "cancelled"].includes(
        job.status
      )
  ).length;

  const readyJobs = jobs.filter(
    (job) => job.status === "ready"
  ).length;

  const overdueJobs = jobs.filter(
    (job) =>
      job.due_date &&
      job.due_date <
        new Date()
          .toISOString()
          .slice(0, 10) &&
      !["ready", "cancelled"].includes(
        job.status
      )
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
            Operaciones
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Producción
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Asigna pedidos, controla etapas y
            supervisa fechas de entrega.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pedidos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Ver pedidos
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-violet-500 hover:text-violet-300"
          >
            Centro de operaciones
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Órdenes activas
          </p>

          <p className="mt-2 text-4xl font-black text-violet-300">
            {activeJobs}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Listas para entregar
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {readyJobs}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Atrasadas
          </p>

          <p className="mt-2 text-4xl font-black text-red-300">
            {overdueJobs}
          </p>
        </div>
      </section>

      <details className="group mt-6 rounded-xl border border-violet-500/30 bg-violet-500/5">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-violet-300">
          <span>+ Enviar pedido a producción</span>
          <span className="group-open:rotate-180">▾</span>
        </summary>
        <section className="border-t border-zinc-800 p-4 sm:p-5">

        {eligibleOrders.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-600">
            No existen pedidos confirmados sin una
            orden de producción.
          </p>
        ) : (
          <form
            action={createProductionJob}
            className="mt-6 grid gap-5"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="production-order"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Pedido
                </label>

                <select
                  id="production-order"
                  name="order_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                >
                  <option value="" disabled>
                    Selecciona un pedido
                  </option>

                  {eligibleOrders.map((order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      {getOrderNumber(order)} —{" "}
                      {order.products?.name ||
                        "Producto"} —{" "}
                      {order.customers?.full_name ||
                        "Cliente"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="production-workshop"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Taller
                </label>

                <select
                  id="production-workshop"
                  name="workshop_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                >
                  <option value="">
                    Sin taller asignado
                  </option>

                  {workshops.map((workshop) => (
                    <option
                      key={workshop.id}
                      value={workshop.id}
                    >
                      {workshop.name}
                      {workshop.specialty
                        ? ` — ${workshop.specialty}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label
                  htmlFor="production-responsible"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Responsable
                </label>

                <select
                  id="production-responsible"
                  name="assigned_to"
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                >
                  <option value="">
                    Sin responsable
                  </option>

                  {profiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="production-priority"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Prioridad
                </label>

                <select
                  id="production-priority"
                  name="priority"
                  defaultValue="normal"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                >
                  <option value="low">Baja</option>
                  <option value="normal">
                    Normal
                  </option>
                  <option value="high">Alta</option>
                  <option value="urgent">
                    Urgente
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="production-start-date"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Inicio programado
                </label>

                <input
                  id="production-start-date"
                  name="scheduled_start_date"
                  type="date"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label
                  htmlFor="production-due-date"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Fecha límite
                </label>

                <input
                  id="production-due-date"
                  name="due_date"
                  type="date"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="production-notes"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Indicaciones de producción
              </label>

              <textarea
                id="production-notes"
                name="production_notes"
                rows={3}
                maxLength={5000}
                placeholder="Materiales, medidas, acabados o instrucciones internas."
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-violet-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-violet-500 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-400 sm:w-auto"
              >
                Crear orden de producción
              </button>
            </div>
          </form>
        )}
        </section>
      </details>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href="/admin/produccion"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              !selectedStatus
                ? "border-violet-500 bg-violet-500 text-white"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Todas
          </Link>

          {Object.entries(
            JOB_STATUS_LABELS
          ).map(([status, label]) => (
            <Link
              key={status}
              href={`/admin/produccion?estado=${status}`}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                selectedStatus === status
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {jobsResponse.error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudieron cargar las órdenes de
            producción.
          </p>
        </div>
      ) : null}

      {!jobsResponse.error &&
      jobs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            No existen órdenes para este filtro.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-6">
        {jobs.map((job) => {
          const stages = [
            ...(job.production_stages || []),
          ].sort(
            (firstStage, secondStage) =>
              firstStage.sequence_number -
              secondStage.sequence_number
          );

          return (
            <article
              key={job.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <InlineActionMenu
                      action={changeProductionStatus}
                      currentValue={job.status}
                      currentLabel={JOB_STATUS_LABELS[job.status]}
                      currentClassName={JOB_STATUS_STYLES[job.status]}
                      fieldName="status"
                      options={Object.entries(JOB_STATUS_LABELS).map(
                        ([value, label]) => ({ value, label })
                      )}
                      hiddenFields={{
                        production_job_id: job.id,
                        order_id: job.order_id,
                      }}
                      confirmMessage="¿Confirmas cambiar producción a {value}?"
                    />

                    <InlineActionMenu
                      action={changeProductionPriority}
                      currentValue={job.priority}
                      currentLabel={`Prioridad ${PRIORITY_LABELS[job.priority]}`}
                      currentClassName={`border-zinc-700 bg-zinc-950 ${PRIORITY_STYLES[job.priority]}`}
                      fieldName="priority"
                      options={Object.entries(PRIORITY_LABELS).map(
                        ([value, label]) => ({ value, label })
                      )}
                      hiddenFields={{ production_job_id: job.id }}
                      confirmMessage="¿Confirmas la prioridad {value}?"
                    />

                    <span className="font-mono text-sm font-black text-orange-400">
                      {getOrderNumber(job.orders)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-black text-zinc-100">
                    {job.orders?.products?.name ||
                      "Producto no especificado"}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Cliente:{" "}
                    <span className="font-bold text-zinc-300">
                      {job.orders?.customers
                        ?.full_name ||
                        "Sin cliente"}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                    <span>
                      Cantidad: <b className="text-zinc-300">{job.orders?.quantity ?? "—"}</b>
                    </span>
                    <span>Pedido: {formatDate(job.orders?.created_at)}</span>
                    <span>Entrega cliente: {formatDate(job.orders?.requested_delivery_date)}</span>
                  </div>
                </div>

                <div className="min-w-56">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-500">
                      Progreso
                    </span>

                    <span className="text-violet-300">
                      {job.progress}%
                    </span>
                  </div>

                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{
                        width: `${job.progress}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs text-zinc-600">
                    Fecha límite:{" "}
                    {formatDate(job.due_date)}
                  </p>
                </div>
              </div>

              <details className="group mt-5 rounded-xl border border-zinc-800 bg-zinc-950/30">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-black text-zinc-400">
                  <span>Ver etapas, asignación y configuración</span>
                  <span className="group-open:rotate-180">▾</span>
                </summary>

              <div className="grid gap-3 border-t border-zinc-800 p-4 md:grid-cols-5">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                  >
                    <p className="text-xs font-black text-zinc-300">
                      {stage.sequence_number}.{" "}
                      {stage.name}
                    </p>

                    <p className="mt-2 text-xs text-zinc-600">
                      {
                        STAGE_STATUS_LABELS[
                          stage.status
                        ]
                      }
                    </p>

                    <div className="mt-auto grid gap-2 pt-4">
                      {stage.status ===
                      "pending" ? (
                        <form
                          action={
                            updateProductionStage
                          }
                        >
                          <input
                            type="hidden"
                            name="stage_id"
                            value={stage.id}
                          />
                          <input
                            type="hidden"
                            name="production_job_id"
                            value={job.id}
                          />
                          <input
                            type="hidden"
                            name="order_id"
                            value={job.order_id}
                          />
                          <input
                            type="hidden"
                            name="current_status"
                            value={stage.status}
                          />
                          <input
                            type="hidden"
                            name="new_status"
                            value="in_progress"
                          />

                          <button className="w-full rounded-lg bg-violet-500 px-3 py-2 text-xs font-black text-white">
                            Iniciar
                          </button>
                        </form>
                      ) : null}

                      {stage.status ===
                      "in_progress" ? (
                        <form
                          action={
                            updateProductionStage
                          }
                        >
                          <input
                            type="hidden"
                            name="stage_id"
                            value={stage.id}
                          />
                          <input
                            type="hidden"
                            name="production_job_id"
                            value={job.id}
                          />
                          <input
                            type="hidden"
                            name="order_id"
                            value={job.order_id}
                          />
                          <input
                            type="hidden"
                            name="current_status"
                            value={stage.status}
                          />
                          <input
                            type="hidden"
                            name="new_status"
                            value="completed"
                          />

                          <button className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-zinc-950">
                            Completar
                          </button>
                        </form>
                      ) : null}

                      {["completed", "skipped"].includes(
                        stage.status
                      ) ? (
                        <form
                          action={
                            updateProductionStage
                          }
                        >
                          <input
                            type="hidden"
                            name="stage_id"
                            value={stage.id}
                          />
                          <input
                            type="hidden"
                            name="production_job_id"
                            value={job.id}
                          />
                          <input
                            type="hidden"
                            name="order_id"
                            value={job.order_id}
                          />
                          <input
                            type="hidden"
                            name="current_status"
                            value={stage.status}
                          />
                          <input
                            type="hidden"
                            name="new_status"
                            value="pending"
                          />

                          <button className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-400">
                            Reabrir
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <details className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40">
                <summary className="cursor-pointer px-5 py-4 font-black text-zinc-300">
                  Asignación y configuración
                </summary>

                <form
                  action={updateProductionJob}
                  className="grid gap-5 border-t border-zinc-800 p-5"
                >
                  <input
                    type="hidden"
                    name="production_job_id"
                    value={job.id}
                  />

                  <input
                    type="hidden"
                    name="order_id"
                    value={job.order_id}
                  />

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Taller asignado
                    <select
                      name="workshop_id"
                      defaultValue={
                        job.workshop_id || ""
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    >
                      <option value="">
                        Sin taller
                      </option>

                      {workshops.map(
                        (workshop) => (
                          <option
                            key={workshop.id}
                            value={workshop.id}
                          >
                            {workshop.name}
                          </option>
                        )
                      )}
                    </select>
                    </label>

                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Personal encargado
                    <select
                      name="assigned_to"
                      defaultValue={
                        job.assigned_to || ""
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    >
                      <option value="">
                        Sin responsable
                      </option>

                      {profiles.map((profile) => (
                        <option
                          key={profile.id}
                          value={profile.id}
                        >
                          {profile.full_name}
                        </option>
                      ))}
                    </select>
                    </label>

                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Estado (se edita arriba)
                      <input readOnly value={JOB_STATUS_LABELS[job.status]} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500" />
                    </label>
                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Prioridad (se edita arriba)
                      <input readOnly value={PRIORITY_LABELS[job.priority]} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500" />
                    </label>
                    <input type="hidden" name="status" value={job.status} />
                    <input type="hidden" name="priority" value={job.priority} />
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Progreso %
                    <input
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={job.progress}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                    </label>

                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Fecha de asignación / inicio
                    <input
                      name="scheduled_start_date"
                      type="date"
                      defaultValue={
                        job.scheduled_start_date ||
                        ""
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                    </label>

                    <label className="grid gap-2 text-xs font-bold text-zinc-500">
                      Entrega del taller
                    <input
                      name="due_date"
                      type="date"
                      defaultValue={
                        job.due_date || ""
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                    </label>
                  </div>

                  <label className="grid gap-2 text-xs font-bold text-zinc-500">
                    Notas de producción
                  <textarea
                    name="production_notes"
                    rows={3}
                    defaultValue={
                      job.production_notes || ""
                    }
                    placeholder="Notas de producción"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />
                  </label>

                  <label className="grid gap-2 text-xs font-bold text-zinc-500">
                    Observaciones de calidad
                  <textarea
                    name="quality_notes"
                    rows={3}
                    defaultValue={
                      job.quality_notes || ""
                    }
                    placeholder="Observaciones de calidad"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />
                  </label>

                  <div className="flex justify-end">
                    <button className="rounded-xl bg-violet-500 px-6 py-3 text-sm font-black text-white">
                      Guardar configuración
                    </button>
                  </div>
                </form>
              </details>
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
