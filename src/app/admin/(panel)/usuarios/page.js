import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

import {
  updateUserProfile,
} from "./actions";

export const metadata = {
  title: "Usuarios",
};

export const dynamic = "force-dynamic";

const ROLE_LABELS = {
  admin: "Administrador",
  manager: "Gerente",
  sales: "Ventas",
  production: "Producción",
  delivery: "Entregas",
};

const ROLE_STYLES = {
  admin:
    "border-orange-500/30 bg-orange-500/10 text-orange-300",
  manager:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  sales:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  production:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  delivery:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const EVENT_LABELS = {
  role_changed: "Rol modificado",
  status_changed: "Estado modificado",
  department_changed:
    "Área modificada",
  commission_changed:
    "Comisión modificada",
  profile_updated:
    "Perfil actualizado",
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

function formatEventValue(
  value,
  eventType
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Sin definir";
  }

  if (eventType === "role_changed") {
    return ROLE_LABELS[value] || value;
  }

  if (
    eventType === "status_changed"
  ) {
    return value === "true"
      ? "Activo"
      : "Inactivo";
  }

  if (
    eventType ===
    "commission_changed"
  ) {
    return `${value}%`;
  }

  return value;
}

export default async function UsersPage({
  searchParams,
}) {
  const { user } = await requireAdmin();

  const queryParams = await searchParams;

  const selectedRole =
    typeof queryParams?.rol === "string"
      ? queryParams.rol
      : null;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : "active";

  const supabase = await createClient();

  let profilesQuery = supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      is_active,
      phone,
      job_title,
      department,
      commission_rate,
      notes,
      updated_at
    `)
    .order("is_active", {
      ascending: false,
    })
    .order("full_name", {
      ascending: true,
    });

  if (
    selectedRole &&
    Object.prototype.hasOwnProperty.call(
      ROLE_LABELS,
      selectedRole
    )
  ) {
    profilesQuery = profilesQuery.eq(
      "role",
      selectedRole
    );
  }

  if (selectedStatus === "active") {
    profilesQuery = profilesQuery.eq(
      "is_active",
      true
    );
  }

  if (selectedStatus === "inactive") {
    profilesQuery = profilesQuery.eq(
      "is_active",
      false
    );
  }

  const [
    profilesResponse,
    eventsResponse,
  ] = await Promise.all([
    profilesQuery,

    supabase
      .from("profile_events")
      .select(`
        id,
        profile_id,
        event_type,
        previous_value,
        new_value,
        notes,
        created_at,
        target_profile:profiles!profile_events_profile_id_fkey (
          id,
          full_name
        ),
        created_profile:profiles!profile_events_created_by_fkey (
          id,
          full_name
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(20),
  ]);

  if (profilesResponse.error) {
    console.error(
      "Error cargando usuarios:",
      profilesResponse.error
    );
  }

  if (eventsResponse.error) {
    console.error(
      "Error cargando historial:",
      eventsResponse.error
    );
  }

  const profiles =
    profilesResponse.data || [];

  const events =
    eventsResponse.data || [];

  const activeCount = profiles.filter(
    (profile) => profile.is_active
  ).length;

  const adminCount = profiles.filter(
    (profile) =>
      profile.role === "admin" &&
      profile.is_active
  ).length;

  const salesCount = profiles.filter(
    (profile) =>
      profile.role === "sales" &&
      profile.is_active
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Equipo
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Usuarios
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Administra roles, áreas,
            comisiones y acceso del equipo.
          </p>
        </div>

        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-blue-500 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-blue-400"
        >
          Crear usuario en Supabase
        </a>
      </section>

      <section className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
        <p className="font-black text-blue-200">
          ¿Cómo registrar un usuario nuevo?
        </p>

        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-blue-300/70">
          <li>
            Abre Supabase y selecciona el
            proyecto LaczCnC.
          </li>

          <li>
            Entra en Authentication →
            Users.
          </li>

          <li>
            Pulsa Add user → Create new
            user.
          </li>

          <li>
            Regresa a esta página y asigna
            su rol y área.
          </li>
        </ol>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Usuarios activos
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Administradores
          </p>

          <p className="mt-2 text-4xl font-black text-orange-300">
            {adminCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Vendedores
          </p>

          <p className="mt-2 text-4xl font-black text-blue-300">
            {salesCount}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href="/admin/usuarios?estado=active"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              selectedStatus === "active" &&
              !selectedRole
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Activos
          </Link>

          <Link
            href="/admin/usuarios?estado=inactive"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              selectedStatus === "inactive"
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Inactivos
          </Link>

          <Link
            href="/admin/usuarios?estado=all"
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
              selectedStatus === "all" &&
              !selectedRole
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-zinc-700 bg-zinc-900 text-zinc-400",
            ].join(" ")}
          >
            Todos
          </Link>

          {Object.entries(
            ROLE_LABELS
          ).map(([role, label]) => (
            <Link
              key={role}
              href={`/admin/usuarios?estado=all&rol=${role}`}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                selectedRole === role
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {profilesResponse.error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudieron cargar los usuarios.
          </p>
        </div>
      ) : null}

      {!profilesResponse.error &&
      profiles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            No existen usuarios para este
            filtro.
          </p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-6">
        {profiles.map((profile) => {
          const isCurrentUser =
            profile.id === user.id;

          return (
            <article
              key={profile.id}
              className={[
                "rounded-2xl border bg-zinc-900/60 p-5 sm:p-6",
                profile.is_active
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
                        ROLE_STYLES[
                          profile.role
                        ] ||
                          ROLE_STYLES.sales,
                      ].join(" ")}
                    >
                      {ROLE_LABELS[
                        profile.role
                      ] || profile.role}
                    </span>

                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black uppercase",
                        profile.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/30 bg-red-500/10 text-red-300",
                      ].join(" ")}
                    >
                      {profile.is_active
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                    {isCurrentUser ? (
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase text-blue-300">
                        Tu usuario
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-xl font-black text-zinc-100">
                    {profile.full_name}
                  </h2>

                  <p className="mt-2 text-sm font-bold text-cyan-300">
                    {profile.job_title ||
                      "Cargo no definido"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {profile.department ||
                      "Sin área asignada"}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-sm font-black text-orange-300">
                    Comisión:{" "}
                    {Number(
                      profile.commission_rate ||
                        0
                    )}%
                  </p>

                  <p className="mt-2 font-mono text-xs text-zinc-700">
                    {profile.id}
                  </p>
                </div>
              </div>

              <details className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50">
                <summary className="cursor-pointer px-5 py-4 font-black text-zinc-300">
                  Editar usuario
                </summary>

                <form
                  action={updateUserProfile}
                  className="grid gap-5 border-t border-zinc-800 p-5"
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={profile.id}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-zinc-300">
                        Nombre completo
                      </label>

                      <input
                        name="full_name"
                        required
                        minLength={2}
                        maxLength={160}
                        defaultValue={
                          profile.full_name
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-zinc-300">
                        Rol
                      </label>

                      <select
                        name="role"
                        defaultValue={
                          profile.role
                        }
                        disabled={
                          isCurrentUser
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 disabled:opacity-50"
                      >
                        {Object.entries(
                          ROLE_LABELS
                        ).map(
                          ([
                            role,
                            label,
                          ]) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {label}
                            </option>
                          )
                        )}
                      </select>

                      {isCurrentUser ? (
                        <input
                          type="hidden"
                          name="role"
                          value={
                            profile.role
                          }
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <input
                      name="phone"
                      type="tel"
                      maxLength={30}
                      defaultValue={
                        profile.phone || ""
                      }
                      placeholder="Teléfono"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />

                    <input
                      name="job_title"
                      maxLength={160}
                      defaultValue={
                        profile.job_title ||
                        ""
                      }
                      placeholder="Cargo"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />

                    <input
                      name="department"
                      maxLength={120}
                      defaultValue={
                        profile.department ||
                        ""
                      }
                      placeholder="Área"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />

                    <input
                      name="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={
                        profile.commission_rate ||
                        0
                      }
                      placeholder="Comisión %"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />
                  </div>

                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={5000}
                    defaultValue={
                      profile.notes || ""
                    }
                    placeholder="Notas internas"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                  />

                  <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <input
                      name="is_active"
                      type="checkbox"
                      defaultChecked={
                        profile.is_active
                      }
                      disabled={
                        isCurrentUser
                      }
                      className="h-5 w-5 accent-emerald-500"
                    />

                    {isCurrentUser ? (
                      <input
                        type="hidden"
                        name="is_active"
                        value="on"
                      />
                    ) : null}

                    <span>
                      <span className="block font-bold text-zinc-200">
                        Usuario activo
                      </span>

                      <span className="mt-1 block text-xs text-zinc-600">
                        Los usuarios inactivos no
                        deben acceder al panel.
                      </span>
                    </span>
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-400"
                    >
                      Guardar usuario
                    </button>
                  </div>
                </form>
              </details>
            </article>
          );
        })}
      </section>

      <section className="mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Auditoría
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-100">
          Cambios recientes
        </h2>

        {eventsResponse.error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">
              No se pudo cargar el historial.
            </p>
          </div>
        ) : null}

        {!eventsResponse.error &&
        events.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="font-bold text-zinc-400">
              Todavía no existen cambios
              registrados.
            </p>
          </div>
        ) : null}

        {events.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="divide-y divide-zinc-800">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                      {EVENT_LABELS[
                        event.event_type
                      ] ||
                        event.event_type}
                    </p>

                    <h3 className="mt-2 font-black text-zinc-100">
                      {event.target_profile
                        ?.full_name ||
                        "Usuario eliminado"}
                    </h3>

                    <p className="mt-2 text-sm text-zinc-500">
                      {formatEventValue(
                        event.previous_value,
                        event.event_type
                      )}{" "}
                      <span className="px-2 text-zinc-700">
                        →
                      </span>
                      {formatEventValue(
                        event.new_value,
                        event.event_type
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm text-zinc-400">
                      {formatDate(
                        event.created_at
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Por:{" "}
                      {event.created_profile
                        ?.full_name ||
                        "Sistema"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}