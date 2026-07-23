import Link from "next/link";

import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";
import InlineActionMenu from "@/shared/components/admin/InlineActionMenu";

import {
  deleteQuoteRequest,
  updateQuoteRequestNotes,
  updateQuoteRequestStatus,
} from "./actions";
import {
  convertQuoteToCustomer,
  convertQuoteToOrder,
} from "./conversion-actions";

export const metadata = { title: "Cotizaciones" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "new", label: "Nueva" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "quoted", label: "Cotizado" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
  { value: "archived", label: "Archivado" },
];

const STATUS_STYLES = {
  new: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  contacted: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  qualified: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  quoted: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  lost: "border-red-500/30 bg-red-500/10 text-red-300",
  archived: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
};

function labelFor(status) {
  return STATUS_OPTIONS.find(
    (option) => option.value === status
  )?.label || status;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function whatsappUrl(request) {
  let phone = String(
    request.customer_phone || ""
  ).replace(/\D/g, "");
  if (!phone) return null;
  if (!phone.startsWith("51") && phone.length === 9) {
    phone = `51${phone}`;
  }
  const message = `Hola ${request.customer_name}. Te contactamos de LaczCNC por tu solicitud de ${request.products?.name || "cotización"}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default async function QuoteRequestsPage({
  searchParams,
}) {
  const { profile } = await requirePermission(
    PERMISSIONS.QUOTES_VIEW
  );
  const params = await searchParams;
  const requestedStatus =
    typeof params?.estado === "string"
      ? params.estado
      : "all";
  const selectedStatus =
    requestedStatus === "all" ||
    STATUS_OPTIONS.some(
      ({ value }) => value === requestedStatus
    )
      ? requestedStatus
      : "all";

  const canManage = hasPermission(
    profile.role,
    PERMISSIONS.QUOTES_MANAGE,
    profile.section_access
  );
  const canDelete = ["admin", "manager"].includes(
    profile.role
  );
  const supabase = await createClient();
  let query = supabase
    .from("quote_requests")
    .select(`
      id, product_id, customer_id, order_id, converted_at,
      customer_name, customer_phone, customer_email,
      company_name, city, quantity, message, source, status,
      internal_notes, contacted_at, closed_at, created_at, updated_at,
      products ( id, name, slug, image_url )
    `)
    .order("created_at", { ascending: false });

  if (selectedStatus !== "all") {
    query = query.eq("status", selectedStatus);
  }

  const [
    { data: requests, error },
    { data: allStatuses },
  ] = await Promise.all([
    query,
    supabase.from("quote_requests").select("status"),
  ]);

  const list = requests || [];
  const counts = (allStatuses || []).reduce(
    (result, row) => {
      result.all += 1;
      result[row.status] =
        (result[row.status] || 0) + 1;
      return result;
    },
    { all: 0 }
  );

  return (
    <div className="px-4 py-7 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            Módulo comercial
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-50">
            Cotizaciones
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Vista compacta. Toca una fila para ver y editar sus detalles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/clientes" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300">
            Clientes
          </Link>
          <Link href="/admin/pedidos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300">
            Pedidos
          </Link>
        </div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {[{ value: "all", label: "Todas" }, ...STATUS_OPTIONS].map(
          (option) => (
            <Link
              key={option.value}
              href={
                option.value === "all"
                  ? "/admin/cotizaciones"
                  : `/admin/cotizaciones?estado=${option.value}`
              }
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
                selectedStatus === option.value
                  ? "border-orange-500 bg-orange-500 text-zinc-950"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {option.label} · {counts[option.value] || 0}
            </Link>
          )
        )}
      </nav>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          No se pudieron cargar las cotizaciones.
        </p>
      ) : null}

      {!error && list.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
          No hay cotizaciones en este estado.
        </p>
      ) : null}

      <section className="mt-6 grid gap-2">
        {list.map((request) => {
          const productName =
            request.products?.name ||
            "Consulta general";
          const wa = whatsappUrl(request);

          return (
            <article key={request.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/70 px-4 py-3">
                <InlineActionMenu
                  action={updateQuoteRequestStatus}
                  currentValue={request.status}
                  currentLabel={labelFor(request.status)}
                  currentClassName={STATUS_STYLES[request.status] || STATUS_STYLES.archived}
                  fieldName="status"
                  options={STATUS_OPTIONS}
                  hiddenFields={{ request_id: request.id }}
                  disabled={!canManage}
                />
                {request.customer_id ? (
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black text-cyan-300">
                    Cliente vinculado
                  </span>
                ) : null}
                {request.order_id ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                    Pedido creado
                  </span>
                ) : null}
              </div>

              <details className="group">
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 sm:grid-cols-[minmax(180px,1.2fr)_minmax(170px,1fr)_130px_90px_auto] sm:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-zinc-100">
                      {request.customer_name}
                    </strong>
                    <span className="text-[11px] text-zinc-600">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  <span className="truncate text-sm font-bold text-orange-400">
                    {productName}
                  </span>
                  <a href={`tel:${request.customer_phone}`} className="text-xs font-bold text-zinc-300">
                    {request.customer_phone}
                  </a>
                  <span className="text-xs text-zinc-400">
                    Cant. {request.quantity || "—"}
                  </span>
                  <span className="text-xs font-black text-zinc-500 group-open:text-orange-400">
                    Ver detalles ▾
                  </span>
                </summary>

                <div className="grid gap-5 border-t border-zinc-800 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="grid gap-4">
                    <div className="grid gap-3 text-xs sm:grid-cols-3">
                      <p><b className="text-zinc-500">Correo</b><br />{request.customer_email || "No registrado"}</p>
                      <p><b className="text-zinc-500">Ciudad</b><br />{request.city || "No registrada"}</p>
                      <p><b className="text-zinc-500">Organización</b><br />{request.company_name || "Particular"}</p>
                    </div>
                    {request.message ? (
                      <p className="whitespace-pre-line rounded-xl bg-zinc-950 p-3 text-sm leading-6 text-zinc-400">
                        {request.message}
                      </p>
                    ) : null}
                    {canManage ? (
                      <form action={updateQuoteRequestNotes}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <label className="text-xs font-bold text-zinc-500">
                          Notas internas
                          <textarea
                            name="internal_notes"
                            rows={3}
                            defaultValue={request.internal_notes || ""}
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-zinc-100"
                          />
                        </label>
                        <button className="mt-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black">
                          Guardar notas
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <aside className="grid content-start gap-2">
                    {request.customer_id ? (
                      <Link href={`/admin/clientes/${request.customer_id}/editar`} className="rounded-lg border border-cyan-500/30 p-2 text-center text-xs font-bold text-cyan-300">
                        Ver cliente
                      </Link>
                    ) : canManage ? (
                      <form action={convertQuoteToCustomer}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <button className="w-full rounded-lg border border-cyan-500/30 p-2 text-xs font-bold text-cyan-300">
                          Vincular cliente
                        </button>
                      </form>
                    ) : null}
                    {request.order_id ? (
                      <Link href={`/admin/pedidos/${request.order_id}/editar`} className="rounded-lg border border-emerald-500/30 p-2 text-center text-xs font-bold text-emerald-300">
                        Ver pedido
                      </Link>
                    ) : canManage ? (
                      <form action={convertQuoteToOrder}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <button className="w-full rounded-lg bg-orange-500 p-2 text-xs font-black text-zinc-950">
                          Convertir en pedido
                        </button>
                      </form>
                    ) : null}
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-500/30 p-2 text-center text-xs font-bold text-emerald-300">
                        WhatsApp
                      </a>
                    ) : null}
                    {request.products?.slug ? (
                      <Link href={`/producto/${request.products.slug}`} target="_blank" className="rounded-lg border border-zinc-700 p-2 text-center text-xs font-bold text-zinc-300">
                        Ver producto
                      </Link>
                    ) : null}
                    {canDelete ? (
                      <form action={deleteQuoteRequest}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <button className="w-full rounded-lg border border-red-500/30 p-2 text-xs font-bold text-red-400">
                          Eliminar
                        </button>
                      </form>
                    ) : null}
                  </aside>
                </div>
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
