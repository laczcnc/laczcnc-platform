import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

import {
  createWorkshop,
  toggleWorkshopStatus,
  updateWorkshop,
} from "./actions";

export const metadata = {
  title: "Talleres asociados",
};

export const dynamic = "force-dynamic";

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

export default async function WorkshopsPage({
  searchParams,
}) {
  await requirePermission(PERMISSIONS.WORKSHOPS_VIEW);

  const queryParams = await searchParams;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : "active";

  const supabase = await createClient();

  let query = supabase
    .from("workshops")
    .select(`
      id,
      name,
      contact_name,
      phone,
      email,
      specialty,
      city,
      address,
      notes,
      is_active,
      created_at,
      updated_at,
      production_jobs (
        id,
        status
      )
    `)
    .order("is_active", {
      ascending: false,
    })
    .order("name", {
      ascending: true,
    });

  if (selectedStatus === "active") {
    query = query.eq("is_active", true);
  }

  if (selectedStatus === "inactive") {
    query = query.eq("is_active", false);
  }

  const {
    data: workshops,
    error,
  } = await query;

  if (error) {
    console.error(
      "Error cargando talleres:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
  }

  const workshopList = workshops || [];

  const activeCount = workshopList.filter(
    (workshop) => workshop.is_active
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Red productiva
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Talleres asociados
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Registra proveedores productivos,
            especialidades y datos de contacto.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="#nuevo-taller" className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-zinc-950">
            + Nuevo taller
          </Link>
          <Link href="/admin/produccion" className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300">
            Volver a producción
          </Link>
        </div>
      </section>

      <details id="nuevo-taller" className="group mt-6 scroll-mt-24 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-cyan-300">
          <span>+ Registrar nuevo taller</span>
          <span className="group-open:rotate-180">▾</span>
        </summary>
        <section className="border-t border-zinc-800 p-4 sm:p-5">

        <form
          action={createWorkshop}
          className="mt-6 grid gap-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="workshop-name"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Nombre del taller *
              </label>

              <input
                id="workshop-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={160}
                placeholder="Ejemplo: Taller Láser Juliaca"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="workshop-contact"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Persona de contacto
              </label>

              <input
                id="workshop-contact"
                name="contact_name"
                type="text"
                maxLength={160}
                placeholder="Nombre del responsable"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="workshop-phone"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Teléfono
              </label>

              <input
                id="workshop-phone"
                name="phone"
                type="tel"
                maxLength={30}
                placeholder="999 999 999"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="workshop-email"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Correo electrónico
              </label>

              <input
                id="workshop-email"
                name="email"
                type="email"
                maxLength={180}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="workshop-specialty"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Especialidad
              </label>

              <input
                id="workshop-specialty"
                name="specialty"
                type="text"
                maxLength={200}
                placeholder="CO₂, UV, sublimación..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="workshop-city"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Ciudad
              </label>

              <input
                id="workshop-city"
                name="city"
                type="text"
                maxLength={120}
                placeholder="Juliaca"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="workshop-address"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Dirección
            </label>

            <input
              id="workshop-address"
              name="address"
              type="text"
              maxLength={300}
              placeholder="Dirección o referencia"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
            />
          </div>

          <div>
            <label
              htmlFor="workshop-notes"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Notas internas
            </label>

            <textarea
              id="workshop-notes"
              name="notes"
              rows={3}
              maxLength={5000}
              placeholder="Capacidades, tiempos, precios o restricciones."
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-cyan-400 sm:w-auto"
            >
              Registrar taller
            </button>
          </div>
        </form>
        </section>
      </details>

      <section className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-zinc-100">
            Talleres registrados
          </h2>

          <p className="mt-2 text-sm text-zinc-600">
            {activeCount} activos en esta vista.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {[
            {
              value: "active",
              label: "Activos",
            },
            {
              value: "inactive",
              label: "Inactivos",
            },
            {
              value: "all",
              label: "Todos",
            },
          ].map((filter) => (
            <Link
              key={filter.value}
              href={`/admin/produccion/talleres?estado=${filter.value}`}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                selectedStatus === filter.value
                  ? "border-cyan-500 bg-cyan-500 text-zinc-950"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudieron cargar los talleres.
          </p>
        </div>
      ) : null}

      {!error &&
      workshopList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            No existen talleres para este filtro.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-5">
        {workshopList.map((workshop) => {
          const whatsappPhone =
            normalizeWhatsAppPhone(
              workshop.phone
            );

          const activeJobs = (
            workshop.production_jobs || []
          ).filter(
            (job) =>
              ![
                "ready",
                "cancelled",
              ].includes(job.status)
          ).length;

          return (
            <article
              key={workshop.id}
              className={[
                "rounded-2xl border bg-zinc-900/60 p-5 sm:p-6",
                workshop.is_active
                  ? "border-zinc-800"
                  : "border-red-500/20 opacity-70",
              ].join(" ")}
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black uppercase",
                        workshop.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/30 bg-red-500/10 text-red-300",
                      ].join(" ")}
                    >
                      {workshop.is_active
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                    <span className="text-xs font-bold text-violet-300">
                      {activeJobs} órdenes activas
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-zinc-100">
                    {workshop.name}
                  </h3>

                  <p className="mt-2 text-sm font-bold text-cyan-400">
                    {workshop.specialty ||
                      "Sin especialidad definida"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    {workshop.contact_name ||
                      "Sin persona de contacto"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {workshop.city ||
                      "Ciudad no definida"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
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

                  <form
                    action={
                      toggleWorkshopStatus
                    }
                  >
                    <input
                      type="hidden"
                      name="workshop_id"
                      value={workshop.id}
                    />

                    <input
                      type="hidden"
                      name="current_status"
                      value={String(
                        workshop.is_active
                      )}
                    />

                    <button
                      type="submit"
                      className={[
                        "rounded-xl border px-4 py-2 text-sm font-black transition",
                        workshop.is_active
                          ? "border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white"
                          : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950",
                      ].join(" ")}
                    >
                      {workshop.is_active
                        ? "Desactivar"
                        : "Activar"}
                    </button>
                  </form>
                </div>
              </div>

              <details className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50">
                <summary className="cursor-pointer px-5 py-4 font-black text-zinc-300">
                  Editar información
                </summary>

                <form
                  action={updateWorkshop}
                  className="grid gap-5 border-t border-zinc-800 p-5"
                >
                  <input
                    type="hidden"
                    name="workshop_id"
                    value={workshop.id}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      name="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={160}
                      defaultValue={workshop.name}
                      placeholder="Nombre del taller"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="contact_name"
                      type="text"
                      maxLength={160}
                      defaultValue={
                        workshop.contact_name ||
                        ""
                      }
                      placeholder="Persona de contacto"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <input
                      name="phone"
                      type="tel"
                      maxLength={30}
                      defaultValue={
                        workshop.phone || ""
                      }
                      placeholder="Teléfono"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="email"
                      type="email"
                      maxLength={180}
                      defaultValue={
                        workshop.email || ""
                      }
                      placeholder="Correo"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="specialty"
                      type="text"
                      maxLength={200}
                      defaultValue={
                        workshop.specialty ||
                        ""
                      }
                      placeholder="Especialidad"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />

                    <input
                      name="city"
                      type="text"
                      maxLength={120}
                      defaultValue={
                        workshop.city || ""
                      }
                      placeholder="Ciudad"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                    />
                  </div>

                  <input
                    name="address"
                    type="text"
                    maxLength={300}
                    defaultValue={
                      workshop.address || ""
                    }
                    placeholder="Dirección"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />

                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={5000}
                    defaultValue={
                      workshop.notes || ""
                    }
                    placeholder="Notas internas"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-cyan-400"
                    >
                      Guardar cambios
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
