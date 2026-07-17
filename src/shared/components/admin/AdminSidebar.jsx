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
    setMobileOpen(false);
  }, [pathname]);

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

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú administrativo"
        onClick={() => setMobileOpen(true)}
        className="admin-mobile-menu-button"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 80,
          display: "none",
          width: 42,
          height: 42,
          placeItems: "center",
          border: "1px solid #3f3f46",
          borderRadius: 11,
          background: "#09090b",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: 19,
          fontWeight: 900,
        }}
      >
        ☰
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú administrativo"
          onClick={() => setMobileOpen(false)}
          className="admin-mobile-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 69,
            border: 0,
            background: "rgba(0, 0, 0, 0.72)",
            cursor: "pointer",
          }}
        />
      ) : null}

      <aside
        className={
          mobileOpen
            ? "admin-sidebar admin-sidebar-open"
            : "admin-sidebar"
        }
        style={{
          position: "sticky",
          top: 0,
          zIndex: 70,
          width: 272,
          minWidth: 272,
          height: "100vh",
          flexShrink: 0,
          alignSelf: "flex-start",
          overflow: "hidden",
          borderRight: "1px solid #27272a",
          background: "#09090b",
          color: "#ffffff",
          transition: "transform 180ms ease",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            minHeight: 0,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              borderBottom: "1px solid #27272a",
              padding: "22px 18px",
            }}
          >
            <Link
              href="/admin"
              style={{
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                }}
              >
                LACZ CNC
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#71717a",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Panel administrativo
              </div>
            </Link>
          </div>

          <nav
            style={{
              display: "grid",
              minHeight: 0,
              flex: 1,
              alignContent: "start",
              gap: 5,
              overflowY: "auto",
              padding: "16px 12px",
            }}
          >
            {loadingProfile ? (
              <div
                style={{
                  padding: "14px 12px",
                  color: "#71717a",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Cargando menú...
              </div>
            ) : navigation.length === 0 ? (
              <div
                style={{
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: 14,
                  color: "#a1a1aa",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
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
                    aria-current={
                      active ? "page" : undefined
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "34px minmax(0, 1fr)",
                      alignItems: "center",
                      gap: 10,
                      minHeight: 46,
                      border: active
                        ? "1px solid #38bdf8"
                        : "1px solid transparent",
                      borderRadius: 12,
                      padding: "6px 10px",
                      background: active
                        ? "rgba(14, 165, 233, 0.14)"
                        : "transparent",
                      color: active
                        ? "#f0f9ff"
                        : "#d4d4d8",
                      fontSize: 13,
                      fontWeight: active ? 900 : 700,
                      textDecoration: "none",
                      transition:
                        "background 150ms ease, border-color 150ms ease",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        width: 32,
                        height: 32,
                        placeItems: "center",
                        border: active
                          ? "1px solid rgba(56, 189, 248, 0.6)"
                          : "1px solid #3f3f46",
                        borderRadius: 9,
                        background: active
                          ? "#0c4a6e"
                          : "#18181b",
                        color: active
                          ? "#7dd3fc"
                          : "#a1a1aa",
                        fontSize: 10,
                        fontWeight: 950,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {item.shortName}
                    </span>

                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })
            )}
          </nav>

          <div
            style={{
              flexShrink: 0,
              borderTop: "1px solid #27272a",
              padding: 14,
              background: "#09090b",
            }}
          >
            {profile ? (
              <div
                style={{
                  marginBottom: 12,
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: 12,
                  background: "#111113",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    color: "#fafafa",
                    fontSize: 13,
                    fontWeight: 900,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.full_name || "Usuario"}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    overflow: "hidden",
                    color: "#71717a",
                    fontSize: 11,
                    fontWeight: 700,
                    textOverflow: "ellipsis",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.job_title || profile.role}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: "100%",
                minHeight: 42,
                border: "1px solid #3f3f46",
                borderRadius: 10,
                background: "#18181b",
                color: "#fafafa",
                cursor: loggingOut
                  ? "wait"
                  : "pointer",
                fontSize: 13,
                fontWeight: 900,
                opacity: loggingOut ? 0.7 : 1,
              }}
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
          display: none !important;
        }

        @media (max-width: 900px) {
          .admin-mobile-menu-button {
            display: grid !important;
          }

          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            z-index: 70 !important;
            height: 100vh !important;
            transform: translateX(-100%);
          }

          .admin-sidebar.admin-sidebar-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}