"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/infrastructure/supabase/client";
import { getAdminNavigation } from "@/shared/config/admin-navigation";

function isCurrentRoute(pathname, item) {
  if (item.exact) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] =
    useState(true);
  const [mobileOpen, setMobileOpen] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !user) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            role,
            is_active,
            job_title
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (
        error ||
        !data ||
        data.is_active !== true
      ) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      setProfile(data);
      setLoadingProfile(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, [mobileOpen]);

  const navigation = useMemo(() => {
    if (!profile?.role) {
      return [];
    }

    return getAdminNavigation(profile.role);
  }, [profile]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú administrativo"
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
        onClick={() => setMobileOpen(true)}
        className="admin-mobile-menu-button"
      >
        <span aria-hidden="true">☰</span>
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú administrativo"
          onClick={() => setMobileOpen(false)}
          className="admin-mobile-overlay"
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={
          mobileOpen
            ? "admin-sidebar admin-sidebar-open"
            : "admin-sidebar"
        }
      >
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-header">
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="admin-sidebar-brand"
            >
              <span className="admin-sidebar-logo">
                LACZ CNC
              </span>

              <span className="admin-sidebar-caption">
                Panel administrativo
              </span>
            </Link>

            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="admin-sidebar-close"
            >
              ×
            </button>
          </div>

          <nav
            aria-label="Navegación administrativa"
            className="admin-sidebar-nav"
          >
            {loadingProfile ? (
              <div className="admin-sidebar-message">
                Cargando menú...
              </div>
            ) : navigation.length === 0 ? (
              <div className="admin-sidebar-empty">
                No tienes módulos disponibles para
                este perfil.
              </div>
            ) : (
              navigation.map((item) => {
                const active = isCurrentRoute(
                  pathname,
                  item
                );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={
                      active
                        ? "admin-sidebar-link admin-sidebar-link-active"
                        : "admin-sidebar-link"
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="admin-sidebar-icon"
                    >
                      {item.shortName}
                    </span>

                    <span className="admin-sidebar-label">
                      {item.name}
                    </span>
                  </Link>
                );
              })
            )}
          </nav>

          <div className="admin-sidebar-footer">
            {profile ? (
              <div className="admin-sidebar-profile">
                <div className="admin-sidebar-name">
                  {profile.full_name || "Usuario"}
                </div>

                <div className="admin-sidebar-role">
                  {profile.job_title || profile.role}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="admin-sidebar-logout"
            >
              {loggingOut
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .admin-mobile-menu-button {
          position: fixed;
          top: 11px;
          left: 12px;
          z-index: 80;
          display: none;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid #3f3f46;
          border-radius: 10px;
          background: #09090b;
          color: #fafafa;
          cursor: pointer;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
        }

        .admin-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 69;
          border: 0;
          background: rgba(0, 0, 0, 0.72);
          cursor: pointer;
          backdrop-filter: blur(2px);
        }

        .admin-sidebar {
          position: sticky;
          top: 0;
          z-index: 70;
          width: 244px;
          min-width: 244px;
          height: 100vh;
          height: 100dvh;
          flex-shrink: 0;
          align-self: flex-start;
          overflow: hidden;
          border-right: 1px solid #27272a;
          background: #09090b;
          color: #fafafa;
          transition: transform 180ms ease;
        }

        .admin-sidebar-inner {
          display: flex;
          height: 100%;
          min-height: 0;
          flex-direction: column;
        }

        .admin-sidebar-header {
          position: relative;
          flex-shrink: 0;
          border-bottom: 1px solid #27272a;
          padding: 17px 16px;
        }

        .admin-sidebar-brand {
          display: block;
          color: #fafafa;
          text-decoration: none;
        }

        .admin-sidebar-logo {
          display: block;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .admin-sidebar-caption {
          display: block;
          margin-top: 3px;
          color: #71717a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .admin-sidebar-close {
          position: absolute;
          top: 12px;
          right: 12px;
          display: none;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 1px solid #3f3f46;
          border-radius: 9px;
          background: #18181b;
          color: #d4d4d8;
          cursor: pointer;
          font-size: 23px;
          line-height: 1;
        }

        .admin-sidebar-nav {
          display: grid;
          min-height: 0;
          flex: 1;
          align-content: start;
          gap: 3px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 11px 9px;
        }

        .admin-sidebar-message,
        .admin-sidebar-empty {
          padding: 12px 10px;
          color: #71717a;
          font-size: 12px;
          font-weight: 600;
        }

        .admin-sidebar-empty {
          border: 1px solid #27272a;
          border-radius: 10px;
          color: #a1a1aa;
          line-height: 1.45;
        }

        .admin-sidebar-link {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          align-items: center;
          gap: 9px;
          min-height: 40px;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 4px 8px;
          background: transparent;
          color: #c4c4cc;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition:
            background 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .admin-sidebar-link:hover {
          background: #18181b;
          color: #fafafa;
        }

        .admin-sidebar-link-active {
          border-color: #0ea5e9;
          background: rgba(14, 165, 233, 0.13);
          color: #f0f9ff;
          font-weight: 700;
        }

        .admin-sidebar-icon {
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          background: #18181b;
          color: #a1a1aa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .admin-sidebar-link-active
          .admin-sidebar-icon {
          border-color: rgba(56, 189, 248, 0.58);
          background: #0c4a6e;
          color: #7dd3fc;
        }

        .admin-sidebar-label,
        .admin-sidebar-name,
        .admin-sidebar-role {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-sidebar-footer {
          flex-shrink: 0;
          border-top: 1px solid #27272a;
          padding: 10px;
          background: #09090b;
        }

        .admin-sidebar-profile {
          margin-bottom: 8px;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 9px 10px;
          background: #111113;
        }

        .admin-sidebar-name {
          color: #fafafa;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-sidebar-role {
          margin-top: 3px;
          color: #71717a;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .admin-sidebar-logout {
          width: 100%;
          min-height: 38px;
          border: 1px solid #3f3f46;
          border-radius: 9px;
          background: #18181b;
          color: #e4e4e7;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-sidebar-logout:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        @media (max-width: 900px) {
          .admin-mobile-menu-button {
            display: grid;
          }

          .admin-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: min(82vw, 280px);
            min-width: 0;
            max-width: 280px;
            height: 100vh;
            height: 100dvh;
            transform: translateX(-101%);
            box-shadow: 18px 0 48px rgba(0, 0, 0, 0.45);
          }

          .admin-sidebar.admin-sidebar-open {
            transform: translateX(0);
          }

          .admin-sidebar-close {
            display: grid;
          }

          .admin-sidebar-header {
            padding-right: 56px;
          }

          .admin-sidebar-link {
            min-height: 42px;
            font-size: 13px;
          }
        }

        @media (max-height: 700px) {
          .admin-sidebar-header {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .admin-sidebar-caption,
          .admin-sidebar-profile {
            display: none;
          }

          .admin-sidebar-footer {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}
