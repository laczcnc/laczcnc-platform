import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

import { updateCustomer } from "../../actions";

export const metadata = {
  title: "Editar cliente",
};

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
  searchParams,
}) {
  await requireAdmin();

  const routeParams = await params;
  const queryParams = await searchParams;

  const customerId = routeParams.id;
  const wasSaved = queryParams?.guardado === "1";

  const supabase = await createClient();

  const { data: customer, error } =
    await supabase
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
        notes,
        source,
        created_at,
        updated_at
      `)
      .eq("id", customerId)
      .maybeSingle();

  if (error) {
    console.error("Error cargando cliente:", {
      customerId,
      code: error.code,
      message: error.message,
    });

    throw new Error(
      "No se pudo cargar el cliente."
    );
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Editar cliente
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Actualiza los datos comerciales y de
            contacto del cliente.
          </p>
        </div>

        <Link
          href="/admin/clientes"
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          Volver a clientes
        </Link>
      </section>

      {wasSaved ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-bold text-emerald-300">
            Los cambios fueron guardados correctamente.
          </p>
        </div>
      ) : null}

      <form
        action={updateCustomer}
        className="mt-8 grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
      >
        <input
          type="hidden"
          name="customer_id"
          value={customer.id}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer-type"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Tipo de cliente
            </label>

            <select
              id="customer-type"
              name="customer_type"
              defaultValue={customer.customer_type}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            >
              <option value="person">
                Persona
              </option>

              <option value="company">
                Empresa
              </option>

              <option value="institution">
                Institución
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Nombre completo
            </label>

            <input
              id="customer-name"
              name="full_name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              defaultValue={customer.full_name}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer-phone"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Teléfono o WhatsApp
            </label>

            <input
              id="customer-phone"
              name="phone"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              defaultValue={customer.phone}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label
              htmlFor="customer-email"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Correo electrónico
            </label>

            <input
              id="customer-email"
              name="email"
              type="email"
              maxLength={180}
              defaultValue={customer.email || ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer-company"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Empresa o institución
            </label>

            <input
              id="customer-company"
              name="company_name"
              type="text"
              maxLength={160}
              defaultValue={
                customer.company_name || ""
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label
              htmlFor="customer-city"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Ciudad o distrito
            </label>

            <input
              id="customer-city"
              name="city"
              type="text"
              maxLength={120}
              defaultValue={customer.city || ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="customer-address"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            Dirección
          </label>

          <input
            id="customer-address"
            name="address"
            type="text"
            maxLength={300}
            defaultValue={customer.address || ""}
            placeholder="Avenida, calle, urbanización o referencia"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="customer-notes"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            Notas internas
          </label>

          <textarea
            id="customer-notes"
            name="notes"
            rows={5}
            maxLength={5000}
            defaultValue={customer.notes || ""}
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-cyan-400 sm:w-auto"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
