import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

import MapAdminLoader from "./MapAdminLoader";

export const metadata = {
  title: "Mapa comercial",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [
    locationsResponse,
    profilesResponse,
  ] = await Promise.all([
    supabase
      .from("map_locations")
      .select(`
        id,
        customer_id,
        name,
        contact_name,
        phone,
        organization_name,
        location_type,
        status,
        latitude,
        longitude,
        address,
        city,
        district,
        reference,
        notes,
        next_visit_at,
        last_visit_at,
        assigned_to,
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      }),

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

  if (locationsResponse.error) {
    console.error(
      "Error cargando marcadores:",
      locationsResponse.error
    );
  }

  if (profilesResponse.error) {
    console.error(
      "Error cargando responsables:",
      profilesResponse.error
    );
  }

  const locations =
    locationsResponse.data || [];

  const profiles =
    profilesResponse.data || [];

  const pendingCount = locations.filter(
    (location) =>
      location.status === "pending"
  ).length;

  const interestedCount =
    locations.filter(
      (location) =>
        location.status === "interested"
    ).length;

  const rescheduleCount =
    locations.filter(
      (location) =>
        location.status === "reschedule"
    ).length;

  const scheduledCount = locations.filter(
    (location) =>
      Boolean(location.next_visit_at)
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Territorio comercial
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Mapa de visitas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Registra prospectos, organiza rutas y
            controla el seguimiento territorial.
          </p>
        </div>

        <Link
          href="/admin/mapa/agenda"
          className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400"
        >
          Abrir agenda ({scheduledCount})
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Pendientes
          </p>

          <p className="mt-2 text-4xl font-black text-amber-300">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Interesados
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {interestedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Por reagendar
          </p>

          <p className="mt-2 text-4xl font-black text-violet-300">
            {rescheduleCount}
          </p>
        </div>
      </section>

      {locationsResponse.error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No fue posible cargar los marcadores.
          </p>

          <p className="mt-2 text-sm text-red-300/70">
            Revisa la tabla map_locations y sus
            políticas RLS.
          </p>
        </div>
      ) : null}

      <section className="mt-8">
        <MapAdminLoader
          locations={locations}
          profiles={profiles}
        />
      </section>
    </div>
  );
}