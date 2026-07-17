import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";

import { createUserAccount } from "../actions";

export const metadata = {
  title: "Crear usuario | LaczCNC",
};

const inputStyle = {
  width: "100%",
  minHeight: 50,
  border: "1px solid #3f3f46",
  borderRadius: 12,
  background: "#09090b",
  color: "#fafafa",
  fontSize: 14,
  outline: "none",
  padding: "0 16px",
};

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#f4f4f5",
  fontSize: 13,
  fontWeight: 800,
};

export default async function NewUserPage({
  searchParams,
}) {
  await requireAdmin();

  const params = await searchParams;
  const error = params?.error
    ? decodeURIComponent(params.error)
    : "";

  return (
    <main
      style={{
        width: "100%",
        minWidth: 0,
        padding: "clamp(20px, 4vw, 48px)",
        color: "#fafafa",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 24,
        }}
      >
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
            Administración
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 42px)",
              letterSpacing: "-0.04em",
            }}
          >
            Crear usuario
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: "10px 0 0",
              color: "#a1a1aa",
              lineHeight: 1.6,
            }}
          >
            Crea la cuenta, sus credenciales y el
            perfil de acceso sin salir de LaczCNC.
          </p>
        </div>

        <Link
          href="/admin/usuarios"
          style={{
            minHeight: 46,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #3f3f46",
            borderRadius: 12,
            padding: "0 18px",
            color: "#fafafa",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Volver a usuarios
        </Link>
      </header>

      <div
        style={{
          marginBottom: 24,
          border: "1px solid #0c4a6e",
          borderRadius: 14,
          padding: "16px 18px",
          background: "rgba(2, 132, 199, 0.08)",
          color: "#7dd3fc",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        La contraseña puede ser elegida libremente.
        La aplicación no exige mayúsculas, números,
        símbolos ni una combinación especial.
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: 24,
            border: "1px solid #7f1d1d",
            borderRadius: 14,
            padding: "16px 18px",
            background: "rgba(127, 29, 29, 0.18)",
            color: "#fecaca",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      ) : null}

      <form
        action={createUserAccount}
        style={{
          display: "grid",
          gap: 24,
          border: "1px solid #27272a",
          borderRadius: 18,
          padding: "clamp(18px, 3vw, 30px)",
          background: "#111113",
        }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <label style={labelStyle}>
            Nombre completo *
            <input
              name="full_name"
              type="text"
              required
              autoComplete="name"
              placeholder="Nombre del usuario"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Correo electrónico *
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="usuario@correo.com"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Contraseña *
            <input
              name="password"
              type="text"
              required
              autoComplete="off"
              placeholder="Cualquier contraseña"
              style={inputStyle}
            />

            <span
              style={{
                color: "#71717a",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              No exigimos mayúsculas, números ni
              símbolos.
            </span>
          </label>

          <label style={labelStyle}>
            Rol *
            <select
              name="role"
              required
              defaultValue="sales"
              style={inputStyle}
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
          </label>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <label style={labelStyle}>
            Teléfono
            <input
              name="phone"
              type="text"
              autoComplete="off"
              placeholder="Número de contacto"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Cargo
            <input
              name="job_title"
              type="text"
              autoComplete="off"
              placeholder="Vendedor, operador..."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Área
            <input
              name="department"
              type="text"
              autoComplete="off"
              placeholder="Ventas, producción..."
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
              defaultValue="0"
              style={inputStyle}
            />
          </label>
        </section>

        <label style={labelStyle}>
          Notas internas
          <textarea
            name="notes"
            rows={5}
            placeholder="Responsabilidades, permisos o condiciones."
            style={{
              ...inputStyle,
              minHeight: 130,
              resize: "vertical",
              padding: 16,
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 4,
          }}
        >
          <Link
            href="/admin/usuarios"
            style={{
              minHeight: 48,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #3f3f46",
              borderRadius: 12,
              padding: "0 20px",
              color: "#d4d4d8",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            style={{
              minHeight: 48,
              border: "1px solid #0284c7",
              borderRadius: 12,
              padding: "0 22px",
              background: "#0284c7",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            Crear usuario y credenciales
          </button>
        </div>
      </form>
    </main>
  );
}