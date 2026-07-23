import Link from "next/link";

import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";
import InlineActionMenu from "@/shared/components/admin/InlineActionMenu";

import { changeOrderStatus } from "./workflow-actions";

export const metadata = { title: "Pedidos" };
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
  draft: "border-zinc-700 bg-zinc-800 text-zinc-300",
  confirmed: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  production: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  ready: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  delivered: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-300",
};

const TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["draft", "production", "cancelled"],
  production: ["confirmed", "ready", "cancelled"],
  ready: ["production", "delivered", "cancelled"],
  delivered: ["ready", "completed"],
  completed: ["delivered"],
  cancelled: ["draft"],
};

const ROLE_TRANSITIONS = {
  sales: {
    draft: ["confirmed", "cancelled"],
    confirmed: ["draft", "cancelled"],
    delivered: ["completed"],
    completed: ["delivered"],
    cancelled: ["draft"],
  },
  production: {
    confirmed: ["production"],
    production: ["confirmed", "ready"],
    ready: ["production"],
  },
  delivery: {
    ready: ["delivered"],
    delivered: ["ready"],
  },
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "Sin definir";
  }
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value));
}

function phoneForWhatsApp(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (!phone) return null;
  if (!phone.startsWith("51") && phone.length === 9) {
    phone = `51${phone}`;
  }
  return phone;
}

function availableTransitions(role, status) {
  const values =
    role === "admin" || role === "manager"
      ? TRANSITIONS[status] || []
      : ROLE_TRANSITIONS[role]?.[status] || [];

  return values.map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));
}

export default async function OrdersPage({
  searchParams,
}) {
  const { profile } = await requirePermission(
    PERMISSIONS.ORDERS_VIEW
  );
  const params = await searchParams;
  const selectedOrderId =
    typeof params?.pedido === "string"
      ? params.pedido
      : null;
  const selectedCustomerId =
    typeof params?.cliente === "string"
      ? params.cliente
      : null;
  const selectedStatus =
    typeof params?.estado === "string" &&
    STATUS_LABELS[params.estado]
      ? params.estado
      : null;

  const canManage = hasPermission(
    profile.role,
    PERMISSIONS.ORDERS_MANAGE,
    profile.section_access
  );
  const canChangeStatus = hasPermission(
    profile.role,
    PERMISSIONS.ORDER_WORKFLOW_MANAGE,
    profile.section_access
  );
  const canViewFinancials = [
    "admin",
    "manager",
    "sales",
  ].includes(profile.role);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(`
      id, order_number, customer_id, quote_request_id, product_id,
      status, quantity, unit_price, total_amount, discount_amount,
      advance_payment, balance_due, customer_notes, internal_notes,
      delivery_city, delivery_address, requested_delivery_date,
      confirmed_at, completed_at, cancelled_at, created_at, updated_at,
      customers ( id, full_name, phone, email, company_name, city, address ),
      products ( id, name, slug, image_url )
    `)
    .order("created_at", { ascending: false });

  if (selectedOrderId) query = query.eq("id", selectedOrderId);
  if (selectedCustomerId) {
    query = query.eq("customer_id", selectedCustomerId);
  }
  if (selectedStatus) query = query.eq("status", selectedStatus);

  const { data: orders, error } = await query;
  const list = orders || [];

  return (
    <div className="px-4 py-7 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            Operaciones
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-50">
            Pedidos
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Vista compacta. Toca una fila para abrir el pedido completo.
          </p>
        </div>
        <div className="flex gap-2">
          {(selectedOrderId || selectedCustomerId || selectedStatus) ? (
            <Link href="/admin/pedidos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold">
              Ver todos
            </Link>
          ) : null}
          <Link href="/admin/cotizaciones" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold">
            Cotizaciones
          </Link>
        </div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/admin/pedidos"
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${!selectedStatus ? "border-orange-500 bg-orange-500 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}
        >
          Todos
        </Link>
        {Object.entries(STATUS_LABELS).map(
          ([status, label]) => (
            <Link
              key={status}
              href={`/admin/pedidos?estado=${status}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${selectedStatus === status ? "border-orange-500 bg-orange-500 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}
            >
              {label}
            </Link>
          )
        )}
      </nav>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          No se pudieron cargar los pedidos.
        </p>
      ) : null}
      {!error && list.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
          No existen pedidos para este filtro.
        </p>
      ) : null}

      <section className="mt-6 grid gap-2">
        {list.map((order) => {
          const transitions = availableTransitions(
            profile.role,
            order.status
          );
          const wa = phoneForWhatsApp(
            order.customers?.phone
          );

          return (
            <article key={order.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800/70 px-4 py-3">
                <InlineActionMenu
                  action={changeOrderStatus}
                  currentValue={order.status}
                  currentLabel={STATUS_LABELS[order.status] || order.status}
                  currentClassName={STATUS_STYLES[order.status] || STATUS_STYLES.draft}
                  fieldName="new_status"
                  options={transitions}
                  hiddenFields={{ order_id: order.id }}
                  confirmMessage="¿Cambiar el pedido a {value}?"
                  disabled={!canChangeStatus || transitions.length === 0}
                />
                <span className="font-mono text-xs font-black text-orange-400">
                  PED-{String(order.order_number).padStart(6, "0")}
                </span>
              </div>

              <details className="group">
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 sm:grid-cols-[minmax(200px,1.3fr)_minmax(160px,1fr)_120px_140px_auto] sm:items-center">
                  <strong className="truncate text-sm text-zinc-100">
                    {order.products?.name || "Producto no especificado"}
                  </strong>
                  <span className="truncate text-xs font-bold text-zinc-300">
                    {order.customers?.full_name || "Sin cliente"}
                  </span>
                  <span className="text-xs font-black text-orange-400">
                    {canViewFinancials ? formatMoney(order.total_amount) : `Cant. ${order.quantity || "—"}`}
                  </span>
                  <span className="text-xs font-black text-red-300">
                    {canViewFinancials ? `Saldo ${formatMoney(order.balance_due)}` : formatDate(order.requested_delivery_date)}
                  </span>
                  <span className="text-xs font-black text-zinc-500 group-open:text-orange-400">
                    Ver detalles ▾
                  </span>
                </summary>

                <div className="border-t border-zinc-800 p-4">
                  <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <p><b className="text-zinc-500">Cantidad</b><br />{order.quantity || "No definida"}</p>
                    <p><b className="text-zinc-500">Fecha del pedido</b><br />{formatDate(order.created_at)}</p>
                    <p><b className="text-zinc-500">Entrega solicitada</b><br />{formatDate(order.requested_delivery_date)}</p>
                    <p><b className="text-zinc-500">Ciudad</b><br />{order.delivery_city || "No definida"}</p>
                    {canViewFinancials ? (
                      <>
                        <p><b className="text-zinc-500">Precio unitario</b><br />{formatMoney(order.unit_price)}</p>
                        <p><b className="text-zinc-500">Adelanto</b><br />{formatMoney(order.advance_payment)}</p>
                        <p><b className="text-zinc-500">Descuento</b><br />{formatMoney(order.discount_amount)}</p>
                      </>
                    ) : null}
                  </div>
                  {order.delivery_address ? (
                    <p className="mt-4 rounded-lg bg-zinc-950 p-3 text-sm text-zinc-400">
                      {order.delivery_address}
                    </p>
                  ) : null}
                  {order.customer_notes || order.internal_notes ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <p className="whitespace-pre-line rounded-lg bg-zinc-950 p-3 text-sm text-zinc-400">
                        {order.customer_notes || "Sin notas del cliente"}
                      </p>
                      <p className="whitespace-pre-line rounded-lg bg-zinc-950 p-3 text-sm text-amber-200/70">
                        {order.internal_notes || "Sin notas internas"}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/admin/pedidos/${order.id}/editar`} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-zinc-950">
                      {canManage ? "Editar pedido" : "Abrir pedido"}
                    </Link>
                    {wa ? (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300">
                        WhatsApp
                      </a>
                    ) : null}
                    {order.products?.slug ? (
                      <Link href={`/producto/${order.products.slug}`} target="_blank" className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold">
                        Ver producto
                      </Link>
                    ) : null}
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
