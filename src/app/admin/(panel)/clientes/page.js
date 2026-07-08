import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Clientes",
};

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
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

function getCustomerTypeLabel(customerType) {
  if (customerType === "company") {
    return "Empresa";
  }

  if (customerType === "institution") {
    return "Institución";
  }

  return "Persona";
}

export default async function CustomersPage({
  searchParams,
}) {
  await requireAdmin();

  const queryParams = await searchParams;

  const selectedCustomerId =
    typeof queryParams?.cliente === "string"
      ? queryParams.cliente
      : null;

  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select(`
      id,
      customer_type,
      full_name,
      phone,
      email,
      company_name,
      city,
      address,
      source,
      notes,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (selectedCustomerId) {
    query = query.eq("id", selectedCustomerId);
  }

  const { data: customers, error } =
    await query;

  if (error) {
    console.error("Error cargando clientes:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  const customerList = customers || [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Clientes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Personas, empresas e instituciones vinculadas
            con cotizaciones, oportunidades y pedidos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedCustomerId ? (
            <Link
              href="/admin/clientes"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-cyan-500 hover:text-cyan-300"
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
            href="/admin/pedidos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Pedidos
          </Link>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
        >
          <p className="font-bold text-red-300">
            No se pudieron cargar los clientes.
          </p>

          <p className="mt-2 text-sm text-red-300/70">
            Revisa la tabla customers y sus políticas RLS.
          </p>
        </div>
      ) : null}

      {!error && customerList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-lg font-black text-zinc-300">
            Todavía no existen clientes registrados
          </p>

          <p className="mt-3 text-sm text-zinc-600">
            Los clientes creados desde cotizaciones
            aparecerán aquí.
          </p>
        </div>
      ) : null}

      {customerList.length > 0 ? (
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {customerList.map((customer) => {
            const whatsappPhone =
              normalizeWhatsAppPhone(
                customer.phone
              );

            return (
              <article
                key={customer.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-cyan-500/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      {getCustomerTypeLabel(
                        customer.customer_type
                      )}
                    </p>

                    <h2 className="mt-2 break-words text-xl font-black text-zinc-100">
                      {customer.full_name}
                    </h2>

                    {customer.company_name ? (
                      <p className="mt-1 break-words text-sm font-bold text-orange-400">
                        {customer.company_name}
                      </p>
                    ) : null}
                  </div>

                  <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-500">
                    {customer.source ||
                      "registro manual"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Teléfono
                    </p>

                    <a
                      href={`tel:${customer.phone}`}
                      className="mt-1 block font-bold text-zinc-300 transition hover:text-cyan-300"
                    >
                      {customer.phone}
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Correo
                    </p>

                    {customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="mt-1 block break-all font-bold text-zinc-300 transition hover:text-cyan-300"
                      >
                        {customer.email}
                      </a>
                    ) : (
                      <p className="mt-1 font-bold text-zinc-600">
                        No registrado
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Ciudad
                    </p>

                    <p className="mt-1 font-bold text-zinc-300">
                      {customer.city ||
                        "No registrada"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Dirección
                    </p>

                    <p className="mt-1 break-words font-bold text-zinc-300">
                      {customer.address ||
                        "No registrada"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Registrado
                    </p>

                    <p className="mt-1 font-bold text-zinc-300">
                      {formatDate(
                        customer.created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Código
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-500">
                      {customer.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                {customer.notes ? (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Notas internas
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                      {customer.notes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-zinc-800 pt-5">
                  <Link
                    href={`/admin/clientes/${customer.id}/editar`}
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-cyan-400"
                  >
                    Editar datos
                  </Link>

                  {whatsappPhone ? (
                    <a
                      href={`https://wa.me/${whatsappPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
                    >
                      WhatsApp
                    </a>
                  ) : null}

                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-cyan-500 hover:text-cyan-300"
                    >
                      Correo
                    </a>
                  ) : null}

                  <Link
                    href={`/admin/pedidos?cliente=${customer.id}`}
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                  >
                    Ver pedidos
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}