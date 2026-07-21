"use client";

import {
  deleteUserAccount,
  resetUserPassword,
} from "./actions";

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

export default function UserSecurityActions({
  userId,
  userName,
  isCurrentUser,
}) {
  function confirmPasswordChange(event) {
    const accepted = window.confirm(
      `¿Cambiar la contraseña de ${userName}?`
    );

    if (!accepted) {
      event.preventDefault();
    }
  }

  function confirmDeletion(event) {
    const accepted = window.confirm(
      `¿Eliminar definitivamente la cuenta de ${userName}?\n\nEsta acción cerrará su acceso y no se puede deshacer.`
    );

    if (!accepted) {
      event.preventDefault();
    }
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        borderTop: "1px solid #27272a",
        padding: "20px",
        background: "#0c0c0e",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#fafafa",
            fontSize: 14,
          }}
        >
          Credenciales y seguridad
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#71717a",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Asigna una nueva contraseña o elimina la
          cuenta de acceso.
        </p>
      </div>

      <div className="user-security-grid">
        <form
          action={resetUserPassword}
          onSubmit={confirmPasswordChange}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 1fr) auto",
            alignItems: "end",
            gap: 10,
          }}
        >
          <input
            type="hidden"
            name="user_id"
            value={userId}
          />

          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#d4d4d8",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Nueva contraseña
            <input
              type="text"
              name="new_password"
              required
              autoComplete="off"
              placeholder="Cualquier contraseña"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              minHeight: 44,
              border: "1px solid #52525b",
              borderRadius: 10,
              padding: "0 16px",
              background: "#27272a",
              color: "#fafafa",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            Cambiar contraseña
          </button>
        </form>

        <form
          action={deleteUserAccount}
          onSubmit={confirmDeletion}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <input
            type="hidden"
            name="user_id"
            value={userId}
          />

          <button
            type="submit"
            disabled={isCurrentUser}
            title={
              isCurrentUser
                ? "No puedes eliminar tu propia cuenta"
                : "Eliminar cuenta"
            }
            style={{
              minHeight: 44,
              border: "1px solid #7f1d1d",
              borderRadius: 10,
              padding: "0 17px",
              background: isCurrentUser
                ? "#27272a"
                : "rgba(127, 29, 29, 0.2)",
              color: isCurrentUser
                ? "#71717a"
                : "#fecaca",
              cursor: isCurrentUser
                ? "not-allowed"
                : "pointer",
              fontSize: 12,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {isCurrentUser
              ? "Cuenta actual"
              : "Eliminar cuenta"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .user-security-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) auto;
          gap: 16px;
        }

        @media (max-width: 850px) {
          .user-security-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .user-security-grid form:first-child {
            grid-template-columns: 1fr !important;
          }

          .user-security-grid form:last-child {
            justify-content: stretch !important;
          }

          .user-security-grid button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}