import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

import {
  changeDeliveryStatus,
  createDelivery,
  updateDelivery,
} from "./actions";

export const metadata = {
  title: "Entregas",
};

export const dynamic = "force-dynamic";

const TYPE_LABELS = {
  store_pickup: "Recojo en tienda",
  local_delivery: "Entrega local",
  province_shipping: "Envío a provincia",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  scheduled: "Programada",
  ready_for_dispatch: "Lista para despacho",
  dispatched: "Despachada",
  delivered: "Entregada",
  failed: "Entrega fallida",
  cancelled: "Cancelada",
};

const STATUS_STYLES = {
  pending:
    "border-zinc-700 bg-zinc-800 text-zinc-300",
  scheduled:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  ready_for_dispatch:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  dispatched:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  delivered:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed:
    "border-red-500/30 bg-red-500/10 text-red-300",
  cancelled:
    "border-zinc-700 bg-zinc-950 text-zinc-600",
};

const NEXT_STATUS = {
  pending: "scheduled",
  scheduled: "ready_for_dispatch",
  ready_for_dispatch: "dispatched",
  dispatched: "delivered",
  failed: "scheduled",
  cancelled: "pending",
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value || 0));
}

function getOrderNumber(order) {
  return `PED-${String(
    order?.order_number || 0
  ).padStart(6, "0")}`;
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

export default async function DeliveriesPage({
  searchParams,
}) {
  await requireAdmin();

  const queryParams = await searchParams;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : null;

  const supabase = await createClient();

  let deliveriesQuery = supabase
    .from("deliveries")
    .select(`
      id,
      order_id,
      delivery_type,
      status,
      recipient_name,
      recipient_phone,
      delivery_city,
      delivery_address,
      delivery_reference,
      carrier_name,
      tracking_number,
      tracking_url,
      scheduled_date,
      dispatched_at,
      delivered_at,
      delivery_cost,
      internal_notes,
      delivery_notes,
      proof_url,
      created_at,
      orders (
        id,
        order_number,
        status,
        quantity,
        total_amount,
        balance_due,
        customers (
          id,
          full_name,
          phone,
          company_name
        ),
        products (
          id,
          name,
          slug
        )
      )
    `)
    .order("scheduled_date", {
      ascending: true,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (
    selectedStatus &&
    Object.prototype.hasOwnProperty.call(
      STATUS_LABELS,
      selectedStatus
    )
  ) {
    deliveriesQuery =
      deliveriesQuery.eq(
        "status",
        selectedStatus
      );
  }

  const [
    deliveriesResponse,
    eligibleOrdersResponse,
  ] = await Promise.all([
    deliveriesQuery,

    supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        quantity,
        delivery_city,
        delivery_address,
        customers (
          id,
          full_name,
          phone,
          company_name
        ),
        products (
          id,
          name
        ),
        deliveries (
          id
        )
      `)
      .in("status", [
        "ready",
        "delivered",
      ])
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (deliveriesResponse.error) {
    console.error(
      "Error cargando entregas:",
      deliveriesResponse.error
    );
  }

  if (eligibleOrdersResponse.error) {
    console.error(
      "Error cargando pedidos disponibles:",
      eligibleOrdersResponse.error
    );
  }

  const deliveries =
    deliveriesResponse.data || [];

  const eligibleOrders = (
    eligibleOrdersResponse.data || []
  ).filter(
    (order) =>
      !order.deliveries ||
      order.deliveries.length === 0
  );

  const pendingCount = deliveries.filter(
    (delivery) =>
      ![
        "delivered",
        "cancelled",
      ].includes(delivery.status)
  ).length;

  const dispatchedCount =
    deliveries.filter(
      (delivery) =>
        delivery.status === "dispatched"
    ).length;

  const deliveredCount =
    deliveries.filter(
      (delivery) =>
        delivery.status === "delivered"
    ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Logística
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Entregas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Programa recojos, despachos locales y
            envíos a provincia.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/produccion"
            className="rounded-xl border border-violet-500/30 px-5 py-3 text-sm font-black text-violet-300 transition hover:bg-violet-500 hover:text-white"
          >
            Producción
          </Link>

          <Link
            href="/admin/pedidos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Pedidos
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Pendientes
          </p>

          <p className="mt-2 text-4xl font-black text-blue-300">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Despachadas
          </p>

          <p className="mt-2 text-4xl font-black text-cyan-300">
            {dispatchedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Entregadas
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {deliveredCount}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
          Nueva operación
        </p>

        <h2 className="mt-2 text-xl font-black text-zinc-100">
          Programar entrega
        </h2>

        {eligibleOrders.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-600">
            No existen pedidos listos sin una
            entrega registrada.
          </p>
        ) : (
          <form
            action={createDelivery}
            className="mt-6 grid gap-5"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-300">
                  Pedido listo
                </label>

                <select
                  name="order_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
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
                        "Producto"}{" "}
                      —{" "}
                      {order.customers?.full_name ||
                        "Cliente"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-300">
                  Modalidad
                </label>

                <select
                  name="delivery_type"
                  defaultValue="store_pickup"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                >
                  {Object.entries(
                    TYPE_LABELS
                  ).map(([type, label]) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <input
                name="recipient_name"
                type="text"
                maxLength={160}
                placeholder="Nombre del receptor"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />

              <input
                name="recipient_phone"
                type="tel"
                maxLength={30}
                placeholder="Teléfono"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />

              <input
                name="delivery_city"
                type="text"
                maxLength={120}
                placeholder="Ciudad"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />

              <input
                name="scheduled_date"
                type="date"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />
            </div>

            <input
              name="delivery_address"
              type="text"
              maxLength={300}
              placeholder="Dirección de entrega"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="delivery_reference"
                type="text"
                maxLength={300}
                placeholder="Referencia"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />

              <input
                name="delivery_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="Costo de entrega"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />
            </div>

            <textarea
              name="internal_notes"
              rows={3}
              maxLength={5000}
              placeholder="Indicaciones internas"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            />

            <div className="flex justify-end">
              <button className="w-full rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-zinc-950 sm:w-auto">
                Programar entrega
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href="/admin/entregas"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              !selectedStatus
                ? "border-cyan-500 bg-cyan-500 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Todas
          </Link>

          {Object.entries(
            STATUS_LABELS
          ).map(([status, label]) => (
            <Link
              key={status}
              href={`/admin/entregas?estado=${status}`}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                selectedStatus === status
                  ? "border-cyan-500 bg-cyan-500 text-zinc-950"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {deliveriesResponse.error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudieron cargar las entregas.
          </p>
        </div>
      ) : null}

      {!deliveriesResponse.error &&
      deliveries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            No existen entregas para este filtro.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-6">
        {deliveries.map((delivery) => {
          const order = delivery.orders;

          const customer =
            order?.customers;

          const product =
            order?.products;

          const whatsappPhone =
            normalizeWhatsAppPhone(
              delivery.recipient_phone ||
                customer?.phone
            );

          const nextStatus =
            NEXT_STATUS[delivery.status];

          return (
            <article
              key={delivery.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black uppercase",
                        STATUS_STYLES[
                          delivery.status
                        ],
                      ].join(" ")}
                    >
                      {STATUS_LABELS[
                        delivery.status
                      ]}
                    </span>

                    <span className="font-mono text-sm font-black text-orange-400">
                      {getOrderNumber(order)}
                    </span>

                    <span className="text-xs font-bold text-cyan-300">
                      {
                        TYPE_LABELS[
                          delivery.delivery_type
                        ]
                      }
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-black text-zinc-100">
                    {product?.name ||
                      "Producto no especificado"}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Receptor:{" "}
                    <span className="font-bold text-zinc-300">
                      {delivery.recipient_name ||
                        customer?.full_name ||
                        "No definido"}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {delivery.delivery_city ||
                      "Sin ciudad"}{" "}
                    —{" "}
                    {delivery.delivery_address ||
                      "Sin dirección"}
                  </p>
                </div>

                <div className="xl:text-right">
                  <p className="text-sm font-bold text-zinc-300">
                    Programada:{" "}
                    {formatDate(
                      delivery.scheduled_date
                    )}
                  </p>

                  <p className="mt-2 text-sm text-cyan-300">
                    {delivery.carrier_name ||
                      "Sin transportista"}
                  </p>

                  <p className="mt-2 text-sm font-black text-orange-300">
                    {formatMoney(
                      delivery.delivery_cost
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-600">
                    Guía
                  </p>

                  <p className="mt-2 text-sm font-bold text-zinc-300">
                    {delivery.tracking_number ||
                      "Sin registrar"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-600">
                    Despacho
                  </p>

                  <p className="mt-2 text-sm font-bold text-zinc-300">
                    {formatDateTime(
                      delivery.dispatched_at
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-600">
                    Recepción
                  </p>

                  <p className="mt-2 text-sm font-bold text-zinc-300">
                    {formatDateTime(
                      delivery.delivered_at
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {nextStatus ? (
                  <form
                    action={
                      changeDeliveryStatus
                    }
                  >
                    <input
                      type="hidden"
                      name="delivery_id"
                      value={delivery.id}
                    />

                    <input
                      type="hidden"
                      name="order_id"
                      value={delivery.order_id}
                    />

                    <input
                      type="hidden"
                      name="current_status"
                      value={delivery.status}
                    />

                    <input
                      type="hidden"
                      name="new_status"
                      value={nextStatus}
                    />

                    <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-zinc-950">
                      Avanzar a{" "}
                      {STATUS_LABELS[
                        nextStatus
                      ]}
                    </button>
                  </form>
                ) : null}

                {whatsappPhone ? (
                  <a
                    href={`https://wa.me/${whatsappPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300"
                  >
                    WhatsApp
                  </a>
                ) : null}

                {delivery.tracking_url ? (
                  <a
                    href={delivery.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-500/30 px-4 py-2 text-sm font-black text-blue-300"
                  >
                    Seguimiento
                  </a>
                ) : null}
              </div>

              <details className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40">
                <summary className="cursor-pointer px-5 py-4 font-black text-zinc-300">
                  Editar logística y comprobante
                </summary>

                <form
                  action={updateDelivery}
                  className="grid gap-5 border-t border-zinc-800 p-5"
                >
                  <input
                    type="hidden"
                    name="delivery_id"
                    value={delivery.id}
                  />

                  <input
                    type="hidden"
                    name="order_id"
                    value={delivery.order_id}
                  />

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <select
                      name="delivery_type"
                      defaultValue={
                        delivery.delivery_type
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    >
                      {Object.entries(
                        TYPE_LABELS
                      ).map(([type, label]) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {label}
                        </option>
                      ))}
                    </select>

                    <input
                      name="recipient_name"
                      defaultValue={
                        delivery.recipient_name ||
                        ""
                      }
                      placeholder="Receptor"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="recipient_phone"
                      defaultValue={
                        delivery.recipient_phone ||
                        ""
                      }
                      placeholder="Teléfono"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="scheduled_date"
                      type="date"
                      defaultValue={
                        delivery.scheduled_date ||
                        ""
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      name="delivery_city"
                      defaultValue={
                        delivery.delivery_city ||
                        ""
                      }
                      placeholder="Ciudad"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="delivery_address"
                      defaultValue={
                        delivery.delivery_address ||
                        ""
                      }
                      placeholder="Dirección"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <input
                    name="delivery_reference"
                    defaultValue={
                      delivery.delivery_reference ||
                      ""
                    }
                    placeholder="Referencia"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />

                  <div className="grid gap-5 md:grid-cols-3">
                    <input
                      name="carrier_name"
                      defaultValue={
                        delivery.carrier_name ||
                        ""
                      }
                      placeholder="Transportista"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="tracking_number"
                      defaultValue={
                        delivery.tracking_number ||
                        ""
                      }
                      placeholder="Número de guía"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="tracking_url"
                      type="url"
                      defaultValue={
                        delivery.tracking_url ||
                        ""
                      }
                      placeholder="URL de seguimiento"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      name="delivery_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={
                        delivery.delivery_cost ||
                        0
                      }
                      placeholder="Costo"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="proof_url"
                      type="url"
                      defaultValue={
                        delivery.proof_url || ""
                      }
                      placeholder="URL del comprobante de entrega"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <textarea
                    name="internal_notes"
                    rows={3}
                    defaultValue={
                      delivery.internal_notes ||
                      ""
                    }
                    placeholder="Notas internas"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />

                  <textarea
                    name="delivery_notes"
                    rows={3}
                    defaultValue={
                      delivery.delivery_notes ||
                      ""
                    }
                    placeholder="Observaciones de entrega"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />

                  <div className="flex justify-end">
                    <button className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-zinc-950">
                      Guardar logística
                    </button>
                  </div>
                </form>
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}