import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Pedidos",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  production: "En producción",
  ready: "Listo",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES = {
  draft:
    "border-zinc-700 bg-zinc-800 text-zinc-300",
  confirmed:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  production:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  ready:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  delivered:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled:
    "border-red-500/30 bg-red-500/10 text-red-300",
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
    return "No definida";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Sin definir";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value));
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

export default async function OrdersPage({
  searchParams,
}) {
  await requireAdmin();

  const queryParams = await searchParams;

  const selectedOrderId =
    typeof queryParams?.pedido === "string"
      ? queryParams.pedido
      : null;

  const selectedCustomerId =
    typeof queryParams?.cliente === "string"
      ? queryParams.cliente
      : null;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : null;

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      quote_request_id,
      product_id,
      status,
      quantity,
      unit_price,
      total_amount,
      discount_amount,
      advance_payment,
      balance_due,
      customer_notes,
      internal_notes,
      delivery_city,
      delivery_address,
      requested_delivery_date,
      confirmed_at,
      completed_at,
      cancelled_at,
      created_at,
      updated_at,
      customers (
        id,
        full_name,
        phone,
        email,
        company_name,
        city,
        address
      ),
      products (
        id,
        name,
        slug,
        image_url
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (selectedOrderId) {
    query = query.eq("id", selectedOrderId);
  }

  if (selectedCustomerId) {
    query = query.eq(
      "customer_id",
      selectedCustomerId
    );
  }

  if (
    selectedStatus &&
    Object.prototype.hasOwnProperty.call(
      STATUS_LABELS,
      selectedStatus
    )
  ) {
    query = query.eq(
      "status",
      selectedStatus
    );
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error("Error cargando pedidos:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  const orderList = orders || [];

  const hasActiveFilter = Boolean(
    selectedOrderId ||
      selectedCustomerId ||
      selectedStatus
  );

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Operaciones
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Pedidos
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Pedidos creados desde cotizaciones y
            operaciones comerciales.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasActiveFilter ? (
            <Link
              href="/admin/pedidos"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
            >
              Ver todos
            </Link>
          ) : null}

          <Link
            href="/admin/cotizaciones"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Cotizaciones
          </Link>

          <Link
            href="/admin/clientes"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Clientes
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href="/admin/pedidos"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
              !selectedStatus &&
              !selectedCustomerId &&
              !selectedOrderId
                ? "border-orange-500 bg-orange-500 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-orange-500 hover:text-orange-400",
            ].join(" ")}
          >
            Todos
          </Link>

          {Object.entries(STATUS_LABELS).map(
            ([status, label]) => (
              <Link
                key={status}
                href={`/admin/pedidos?estado=${status}`}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
                  selectedStatus === status
                    ? "border-orange-500 bg-orange-500 text-zinc-950"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-orange-500 hover:text-orange-400",
                ].join(" ")}
              >
                {label}
              </Link>
            )
          )}
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
        >
          <p className="font-bold text-red-300">
            No se pudieron cargar los pedidos.
          </p>

          <p className="mt-2 text-sm text-red-300/70">
            Revisa la tabla orders, sus relaciones y
            las políticas RLS.
          </p>
        </div>
      ) : null}

      {!error && orderList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-lg font-black text-zinc-300">
            No existen pedidos para este filtro
          </p>

          <p className="mt-3 text-sm text-zinc-600">
            Convierte una cotización en pedido o cambia
            el filtro seleccionado.
          </p>
        </div>
      ) : null}

      {orderList.length > 0 ? (
        <section className="mt-8 grid gap-5">
          {orderList.map((order) => {
            const customerPhone =
              normalizeWhatsAppPhone(
                order.customers?.phone
              );

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-orange-500/30 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                          STATUS_STYLES[
                            order.status
                          ] ||
                            STATUS_STYLES.draft,
                        ].join(" ")}
                      >
                        {STATUS_LABELS[
                          order.status
                        ] || order.status}
                      </span>

                      <span className="font-mono text-sm font-black text-orange-400">
                        PED-
                        {String(
                          order.order_number
                        ).padStart(6, "0")}
                      </span>
                    </div>

                    <h2 className="mt-4 break-words text-xl font-black text-zinc-100">
                      {order.products?.name ||
                        "Producto no especificado"}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      Cliente:{" "}
                      <span className="font-bold text-zinc-300">
                        {order.customers
                          ?.full_name ||
                          "Sin cliente"}
                      </span>
                    </p>

                    {order.customers
                      ?.company_name ? (
                      <p className="mt-1 text-sm font-bold text-cyan-400">
                        {
                          order.customers
                            .company_name
                        }
                      </p>
                    ) : null}
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm text-zinc-600">
                      {formatDate(
                        order.created_at
                      )}
                    </p>

                    <p className="mt-2 font-mono text-xs text-zinc-700">
                      {order.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Cantidad
                    </p>

                    <p className="mt-1 font-black text-zinc-300">
                      {order.quantity ??
                        "No definida"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Precio unitario
                    </p>

                    <p className="mt-1 font-black text-zinc-300">
                      {formatMoney(
                        order.unit_price
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Total
                    </p>

                    <p className="mt-1 font-black text-orange-400">
                      {formatMoney(
                        order.total_amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Saldo pendiente
                    </p>

                    <p className="mt-1 font-black text-red-300">
                      {formatMoney(
                        order.balance_due
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Descuento
                    </p>

                    <p className="mt-1 font-black text-zinc-300">
                      {formatMoney(
                        order.discount_amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Adelanto
                    </p>

                    <p className="mt-1 font-black text-emerald-300">
                      {formatMoney(
                        order.advance_payment
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Ciudad de entrega
                    </p>

                    <p className="mt-1 font-black text-zinc-300">
                      {order.delivery_city ||
                        "No definida"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Fecha solicitada
                    </p>

                    <p className="mt-1 font-black text-zinc-300">
                      {formatDateOnly(
                        order.requested_delivery_date
                      )}
                    </p>
                  </div>
                </div>

                {order.delivery_address ? (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Dirección de entrega
                    </p>

                    <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                      {order.delivery_address}
                    </p>
                  </div>
                ) : null}

                {order.customer_notes ? (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Detalles del cliente
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                      {order.customer_notes}
                    </p>
                  </div>
                ) : null}

                {order.internal_notes ? (
                  <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Notas internas
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-200/70">
                      {order.internal_notes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-zinc-800 pt-5">
                  <Link
                    href={`/admin/pedidos/${order.id}/editar`}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
                  >
                    Editar pedido
                  </Link>

                  {order.customers?.id ? (
                    <Link
                      href={`/admin/clientes/${order.customers.id}/editar`}
                      className="rounded-xl border border-cyan-500/30 px-4 py-2 text-sm font-black text-cyan-300 transition hover:bg-cyan-500 hover:text-zinc-950"
                    >
                      Editar cliente
                    </Link>
                  ) : null}

                  {customerPhone ? (
                    <a
                      href={`https://wa.me/${customerPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
                    >
                      WhatsApp
                    </a>
                  ) : null}

                  {order.products?.slug ? (
                    <Link
                      href={`/producto/${order.products.slug}`}
                      target="_blank"
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                    >
                      Ver producto
                    </Link>
                  ) : null}

                  {order.quote_request_id ? (
                    <Link
                      href="/admin/cotizaciones"
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                    >
                      Ver cotización original
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}