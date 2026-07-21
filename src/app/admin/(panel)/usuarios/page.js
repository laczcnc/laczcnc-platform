import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createAdminClient } from "@/infrastructure/supabase/admin";

import { updateUserProfile } from "./actions";
import UserSecurityActions from "./UserSecurityActions";

export const metadata = {
  title: "Usuarios | LaczCNC",
};

export const dynamic = "force-dynamic";

const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  sales: "Ventas",
  production: "Producción",
  delivery: "Reparto",
};

const successMessages = {
  created: "Usuario creado correctamente.",
  updated: "Perfil actualizado correctamente.",
  password: "Contraseña actualizada correctamente.",
  deleted: "Usuario eliminado correctamente.",
};

const inputStyle = {
  width: "100%",
  minHeight: 44,
  border: "1px solid #3f3f46",
  borderRadius: 10,
  background: "#09090b",
  color: "#fafafa",
  padding: "0 13px",
  fontSize: 13,
  outline: "none",
};

const labelStyle = {
  display: "grid",
  gap: 7,
  color: "#d4d4d8",
  fontSize: 12,
  fontWeight: 800,
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Fecha inválida";
  }
}

function getInitials(name) {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function UsersPage({
  searchParams,
}) {
  const { user: currentUser } =
    await requireAdmin();

  const params = await searchParams;
  const success = String(params?.success ?? "");
  const error = String(params?.error ?? "");

  const adminClient = createAdminClient();

  const [
    { data: profiles, error: profilesError },
    { data: authData, error: authError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select(
        `
          id,
          full_name,
          role,
          is_active,
          phone,
          job_title,
          department,
          commission_rate,
          notes,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      }),

    adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    }),
  ]);

  const authUsers = authData?.users ?? [];

  const authById = new Map(
    authUsers.map((authUser) => [
      authUser.id,
      authUser,
    ])
  );

  const users = (profiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);

    return {
      ...profile,
      email: authUser?.email ?? "Correo no disponible",
      lastSignInAt:
        authUser?.last_sign_in_at ?? null,
      emailConfirmedAt:
        authUser?.email_confirmed_at ?? null,
    };
  });

  return (
    <main
      style={{
        width: "100%",
        minWidth: 0,
        padding: "clamp(20px, 4vw, 48px)",
        color: "#fafafa",
      }}
    >
      <header className="users-page-header">
        <div>
          <p
            style={{
              margin: "0 0 8px",
              color: "#38bdf8",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Equipo
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 42px)",
              letterSpacing: "-0.04em",
            }}
          >
            Usuarios
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: "10px 0 0",
              color: "#a1a1aa",
              lineHeight: 1.6,
            }}
          >
            Crea cuentas, administra roles, activa o
            desactiva accesos y cambia credenciales.
          </p>
        </div>

        <Link
          href="/admin/usuarios/nuevo"
          style={{
            display: "inline-flex",
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #0284c7",
            borderRadius: 12,
            padding: "0 20px",
            background: "#0284c7",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 900,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Crear usuario
        </Link>
      </header>

      {successMessages[success] ? (
        <div
          role="status"
          style={{
            marginBottom: 22,
            border: "1px solid #166534",
            borderRadius: 13,
            padding: "15px 17px",
            background: "rgba(22, 101, 52, 0.16)",
            color: "#bbf7d0",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {successMessages[success]}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: 22,
            border: "1px solid #7f1d1d",
            borderRadius: 13,
            padding: "15px 17px",
            background: "rgba(127, 29, 29, 0.18)",
            color: "#fecaca",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      ) : null}

      {profilesError || authError ? (
        <div
          role="alert"
          style={{
            marginBottom: 22,
            border: "1px solid #854d0e",
            borderRadius: 13,
            padding: "15px 17px",
            background: "rgba(133, 77, 14, 0.16)",
            color: "#fde68a",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {profilesError
            ? `No se pudieron cargar los perfiles: ${profilesError.message}`
            : `No se pudieron cargar los correos: ${authError.message}`}
        </div>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <article style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Usuarios registrados
          </span>

          <strong style={summaryValueStyle}>
            {users.length}
          </strong>
        </article>

        <article style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Usuarios activos
          </span>

          <strong style={summaryValueStyle}>
            {
              users.filter(
                (profile) =>
                  profile.is_active === true
              ).length
            }
          </strong>
        </article>

        <article style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Administradores
          </span>

          <strong style={summaryValueStyle}>
            {
              users.filter(
                (profile) =>
                  profile.role === "admin"
              ).length
            }
          </strong>
        </article>
      </section>

      {users.length === 0 ? (
        <section
          style={{
            border: "1px dashed #3f3f46",
            borderRadius: 16,
            padding: 40,
            color: "#a1a1aa",
            textAlign: "center",
          }}
        >
          No existen usuarios registrados.
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {users.map((profile) => {
            const isCurrentUser =
              profile.id === currentUser.id;

            return (
              <article
                key={profile.id}
                style={{
                  overflow: "hidden",
                  border: "1px solid #27272a",
                  borderRadius: 18,
                  background: "#111113",
                }}
              >
                <div className="user-card-header">
                  <div
                    style={{
                      display: "flex",
                      minWidth: 0,
                      alignItems: "center",
                      gap: 13,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        width: 46,
                        minWidth: 46,
                        height: 46,
                        placeItems: "center",
                        border: "1px solid #3f3f46",
                        borderRadius: 13,
                        background: "#18181b",
                        color: "#7dd3fc",
                        fontSize: 13,
                        fontWeight: 950,
                      }}
                    >
                      {getInitials(profile.full_name)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <strong
                          style={{
                            overflow: "hidden",
                            color: "#fafafa",
                            fontSize: 16,
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {profile.full_name ||
                            "Sin nombre"}
                        </strong>

                        {isCurrentUser ? (
                          <span
                            style={{
                              border:
                                "1px solid #075985",
                              borderRadius: 999,
                              padding: "3px 8px",
                              background:
                                "rgba(14, 165, 233, 0.12)",
                              color: "#7dd3fc",
                              fontSize: 10,
                              fontWeight: 900,
                              textTransform:
                                "uppercase",
                            }}
                          >
                            Tu cuenta
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          overflow: "hidden",
                          color: "#a1a1aa",
                          fontSize: 13,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {profile.email}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        border: "1px solid #3f3f46",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "#18181b",
                        color: "#d4d4d8",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {roleLabels[profile.role] ??
                        profile.role}
                    </span>

                    <span
                      style={{
                        border: profile.is_active
                          ? "1px solid #166534"
                          : "1px solid #7f1d1d",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: profile.is_active
                          ? "rgba(22, 101, 52, 0.16)"
                          : "rgba(127, 29, 29, 0.18)",
                        color: profile.is_active
                          ? "#bbf7d0"
                          : "#fecaca",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {profile.is_active
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                  </div>
                </div>

                <form
                  action={updateUserProfile}
                  style={{
                    display: "grid",
                    gap: 18,
                    padding:
                      "clamp(16px, 3vw, 24px)",
                  }}
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={profile.id}
                  />

                  <div className="user-form-grid">
                    <label style={labelStyle}>
                      Nombre completo
                      <input
                        name="full_name"
                        type="text"
                        required
                        defaultValue={
                          profile.full_name ?? ""
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={labelStyle}>
                      Rol
                      <select
                        name="role"
                        required
                        defaultValue={profile.role}
                        style={inputStyle}
                        disabled={isCurrentUser}
                      >
                        <option value="admin">
                          Administrador
                        </option>

                        <option value="manager">
                          Gerente
                        </option>

                        <option value="sales">
                          Ventas
                        </option>

                        <option value="production">
                          Producción
                        </option>

                        <option value="delivery">
                          Reparto
                        </option>
                      </select>

                      {isCurrentUser ? (
                        <input
                          type="hidden"
                          name="role"
                          value={profile.role}
                        />
                      ) : null}
                    </label>

                    <label style={labelStyle}>
                      Teléfono
                      <input
                        name="phone"
                        type="text"
                        defaultValue={
                          profile.phone ?? ""
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={labelStyle}>
                      Cargo
                      <input
                        name="job_title"
                        type="text"
                        defaultValue={
                          profile.job_title ?? ""
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={labelStyle}>
                      Área
                      <input
                        name="department"
                        type="text"
                        defaultValue={
                          profile.department ?? ""
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={labelStyle}>
                      Comisión %
                      <input
                        name="commission_rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={
                          profile.commission_rate ?? 0
                        }
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <label style={labelStyle}>
                    Notas internas
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={
                        profile.notes ?? ""
                      }
                      style={{
                        ...inputStyle,
                        minHeight: 90,
                        resize: "vertical",
                        padding: 13,
                        fontFamily: "inherit",
                        lineHeight: 1.6,
                      }}
                    />
                  </label>

                  <div className="user-form-footer">
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: isCurrentUser
                          ? "#71717a"
                          : "#d4d4d8",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: isCurrentUser
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="is_active"
                        value="true"
                        defaultChecked={
                          profile.is_active === true
                        }
                        disabled={isCurrentUser}
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: "#0284c7",
                        }}
                      />

                      {isCurrentUser ? (
                        <input
                          type="hidden"
                          name="is_active"
                          value="true"
                        />
                      ) : null}

                      Usuario activo
                    </label>

                    <button
                      type="submit"
                      style={{
                        minHeight: 44,
                        border:
                          "1px solid #0284c7",
                        borderRadius: 10,
                        padding: "0 18px",
                        background: "#0284c7",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      Guardar perfil
                    </button>
                  </div>
                </form>

                <UserSecurityActions
                  userId={profile.id}
                  userName={
                    profile.full_name ||
                    profile.email
                  }
                  isCurrentUser={isCurrentUser}
                />

                <footer
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    borderTop:
                      "1px solid #27272a",
                    padding: "12px 20px",
                    background: "#0c0c0e",
                    color: "#71717a",
                    fontSize: 11,
                  }}
                >
                  <span>
                    Creado:{" "}
                    {formatDate(profile.created_at)}
                  </span>

                  <span>
                    Último ingreso:{" "}
                    {formatDate(
                      profile.lastSignInAt
                    )}
                  </span>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      <style>{`
        .users-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .user-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #27272a;
          padding: 18px 20px;
          background: #0c0c0e;
        }

        .user-form-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .user-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .user-form-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .users-page-header,
          .user-card-header,
          .user-form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .user-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

const summaryCardStyle = {
  display: "grid",
  gap: 10,
  border: "1px solid #27272a",
  borderRadius: 15,
  padding: 18,
  background: "#111113",
};

const summaryLabelStyle = {
  color: "#a1a1aa",
  fontSize: 12,
  fontWeight: 800,
};

const summaryValueStyle = {
  color: "#fafafa",
  fontSize: 28,
  letterSpacing: "-0.04em",
};