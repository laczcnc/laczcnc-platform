import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

import {
  deleteQuoteRequest,
  updateQuoteRequestNotes,
  updateQuoteRequestStatus,
} from "./actions";

import {
  convertQuoteToCustomer,
  convertQuoteToOrder,
} from "./conversion-actions";

export const metadata = {
  title: "Cotizaciones",
};

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
  contacted:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  qualified:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  quoted:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  lost: "border-red-500/30 bg-red-500/10 text-red-300",
  archived:
    "border-zinc-700 bg-zinc-800/60 text-zinc-400",
};

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === status
    )?.label || status
  );
}

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
    request.quantity
      ? `Cantidad aproximada: ${request.quantity}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}

function getFilterHref(status) {
  if (!status || status === "all") {
    return "/admin/cotizaciones";
  }

  return `/admin/cotizaciones?estado=${status}`;
}

export default async function QuoteRequestsPage({
  searchParams,
}) {
  const { profile } = await requirePermission(
    PERMISSIONS.QUOTES_VIEW
  );

  const canDeleteQuotes = [
    "admin",
    "manager",
  ].includes(profile.role);

  const queryParams = await searchParams;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : "all";

  const validStatus =
    selectedStatus === "all" ||
    STATUS_OPTIONS.some(
      (option) =>
        option.value === selectedStatus
    )
      ? selectedStatus
      : "all";

  const supabase = await createClient();

  let requestsQuery = supabase
    .from("quote_requests")
    .select(`
      id,
      product_id,
      customer_id,
      order_id,
      converted_at,
      customer_name,
      customer_phone,
      customer_email,
      company_name,
      city,
      quantity,
      message,
      source,
      status,
      internal_notes,
      contacted_at,
      closed_at,
      created_at,
      updated_at,
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

  if (validStatus !== "all") {
    requestsQuery = requestsQuery.eq(
      "status",
      validStatus
    );
  }

  const [
    {
      data: requests,
      error: requestsError,
    },
    {
      data: allRequestStatuses,
      error: countsError,
    },
  ] = await Promise.all([
    requestsQuery,

    supabase
      .from("quote_requests")
      .select("status"),
  ]);

  if (requestsError) {
    console.error(
      "Error cargando solicitudes:",
      {
        code: requestsError.code,
        message: requestsError.message,
        details: requestsError.details,
        hint: requestsError.hint,
      }
    );
  }

  if (countsError) {
    console.error(
      "Error cargando contadores:",
      {
        code: countsError.code,
        message: countsError.message,
      }
    );
  }

  const requestList = requests || [];
  const statusRows = allRequestStatuses || [];

  const counts = statusRows.reduce(
    (result, row) => {
      result.all += 1;

      if (row.status in result) {
        result[row.status] += 1;
      }

      return result;
    },
    {
      all: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      quoted: 0,
      won: 0,
      lost: 0,
      archived: 0,
    }
  );

  const filterOptions = [
    {
      value: "all",
      label: "Todas",
      count: counts.all,
    },
    ...STATUS_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.value] || 0,
    })),
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Módulo comercial
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Cotizaciones
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Gestiona las consultas, vincula clientes y
            convierte oportunidades en pedidos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clientes"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Ver clientes
          </Link>

          <Link
            href="/admin/pedidos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Ver pedidos
          </Link>

          <Link
            href="/"
            target="_blank"
            className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            Abrir tienda
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {filterOptions.map((option) => {
            const isSelected =
              option.value === validStatus;

            return (
              <Link
                key={option.value}
                href={getFilterHref(option.value)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
                  isSelected
                    ? "border-orange-500 bg-orange-500 text-zinc-950"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-orange-500/60 hover:text-orange-400",
                ].join(" ")}
              >
                {option.label}

                <span
                  className={[
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    isSelected
                      ? "bg-zinc-950/20 text-zinc-950"
                      : "bg-zinc-800 text-zinc-500",
                  ].join(" ")}
                >
                  {option.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {requestsError ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudieron cargar las solicitudes.
          </p>
        </div>
      ) : null}

      {!requestsError &&
      requestList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
          <p className="text-lg font-black text-zinc-300">
            No hay solicitudes en este estado
          </p>
        </div>
      ) : null}

      {requestList.length > 0 ? (
        <section className="mt-8 grid gap-5">
          {requestList.map((request) => {
            const whatsappUrl =
              buildWhatsAppUrl(request);

            const productName =
              request.products?.name ||
              "Consulta general";

            const hasCustomer =
              Boolean(request.customer_id);

            const hasOrder =
              Boolean(request.order_id);

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
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
                        {getStatusLabel(
                          request.status
                        )}
                      </span>

                      {hasCustomer ? (
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                          Cliente vinculado
                        </span>
                      ) : null}

                      {hasOrder ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                          Pedido creado
                        </span>
                      ) : null}

                      <span className="text-xs text-zinc-600">
                        {formatDate(
                          request.created_at
                        )}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-black text-zinc-100">
                      {request.customer_name}
                    </h2>

                    <p className="mt-1 text-sm font-bold text-orange-400">
                      {productName}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Teléfono
                        </p>

                        <a
                          href={`tel:${request.customer_phone}`}
                          className="mt-1 block text-sm font-bold text-zinc-300 hover:text-orange-400"
                        >
                          {request.customer_phone}
                        </a>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Correo
                        </p>

                        <p className="mt-1 break-all text-sm font-bold text-zinc-300">
                          {request.customer_email ||
                            "No registrado"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Ciudad
                        </p>

                        <p className="mt-1 text-sm font-bold text-zinc-300">
                          {request.city ||
                            "No registrada"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Cantidad
                        </p>

                        <p className="mt-1 text-sm font-bold text-zinc-300">
                          {request.quantity ||
                            "No indicada"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Organización
                        </p>

                        <p className="mt-1 text-sm font-bold text-zinc-300">
                          {request.company_name ||
                            "Particular"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Código
                        </p>

                        <p className="mt-1 font-mono text-sm text-zinc-500">
                          {request.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    {request.message ? (
                      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Detalles enviados
                        </p>

                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-400">
                          {request.message}
                        </p>
                      </div>
                    ) : null}

                    <form
                      action={
                        updateQuoteRequestNotes
                      }
                      className="mt-5"
                    >
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.id}
                      />

                      <label
                        htmlFor={`notes-${request.id}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600"
                      >
                        Notas internas
                      </label>

                      <textarea
                        id={`notes-${request.id}`}
                        name="internal_notes"
                        rows={3}
                        maxLength={5000}
                        defaultValue={
                          request.internal_notes ||
                          ""
                        }
                        className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-orange-500"
                      />

                      <button
                        type="submit"
                        className="mt-3 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 hover:border-orange-500 hover:text-orange-400"
                      >
                        Guardar notas
                      </button>
                    </form>
                  </div>

                  <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <h3 className="font-black text-zinc-200">
                      Conversión comercial
                    </h3>

                    <div className="mt-4 grid gap-3">
                      {hasCustomer ? (
                        <Link
                          href={`/admin/clientes/${request.customer_id}/editar`}
                          className="flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-300 hover:bg-cyan-500 hover:text-zinc-950"
                        >
                          Ver cliente vinculado
                        </Link>
                      ) : (
                        <form
                          action={
                            convertQuoteToCustomer
                          }
                        >
                          <input
                            type="hidden"
                            name="request_id"
                            value={request.id}
                          />

                          <button
                            type="submit"
                            className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-300 hover:bg-cyan-500 hover:text-zinc-950"
                          >
                            Crear o vincular cliente
                          </button>
                        </form>
                      )}

                      {hasOrder ? (
                        <Link
                          href={`/admin/pedidos/${request.order_id}/editar`}
                          className="flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950"
                        >
                          Ver pedido creado
                        </Link>
                      ) : (
                        <form
                          action={convertQuoteToOrder}
                        >
                          <input
                            type="hidden"
                            name="request_id"
                            value={request.id}
                          />

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-orange-400"
                          >
                            Convertir en pedido
                          </button>
                        </form>
                      )}
                    </div>

                    {request.converted_at ? (
                      <p className="mt-4 text-xs leading-5 text-zinc-600">
                        Convertida:{" "}
                        {formatDate(
                          request.converted_at
                        )}
                      </p>
                    ) : null}

                    <div className="mt-6 border-t border-zinc-800 pt-5">
                      <h3 className="font-black text-zinc-200">
                        Estado comercial
                      </h3>

                      <form
                        action={
                          updateQuoteRequestStatus
                        }
                        className="mt-4"
                      >
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <select
                          name="status"
                          defaultValue={
                            request.status
                          }
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-orange-500"
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="submit"
                          className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 hover:border-orange-500 hover:text-orange-400"
                        >
                          Actualizar estado
                        </button>
                      </form>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-black text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950"
                        >
                          Abrir WhatsApp
                        </a>
                      ) : null}

                      {request.products?.slug ? (
                        <Link
                          href={`/producto/${request.products.slug}`}
                          target="_blank"
                          className="flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 hover:border-orange-500 hover:text-orange-400"
                        >
                          Ver producto
                        </Link>
                      ) : null}
                    </div>

                    {canDeleteQuotes ? (
                    <details className="mt-6 border-t border-zinc-800 pt-4">
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-red-400">
                        Eliminar solicitud
                      </summary>

                      <form
                        action={deleteQuoteRequest}
                        className="mt-4"
                      >
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-black text-red-400 hover:bg-red-500 hover:text-white"
                        >
                          Eliminar permanentemente
                        </button>
                      </form>
                    </details>
                    ) : null}
                  </aside>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
