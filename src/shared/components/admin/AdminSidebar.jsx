"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/client";

const navigation = [
  {
    name: "Centro de operaciones",
    href: "/admin/dashboard",
    shortName: "CO",
    enabled: true,
  },
  {
    name: "Cotizaciones",
    href: "/admin/cotizaciones",
    shortName: "CT",
    enabled: true,
    showQuoteCount: true,
  },
  
  {
    name: "Pedidos",
    href: "/admin/pedidos",
    shortName: "PE",
    enabled: true,
  },
  {
    name: "Clientes",
    href: "/admin/clientes",
    shortName: "CL",
    enabled: true,
  },
  {
    name: "Productos",
    href: "/admin/productos",
    shortName: "PR",
    enabled: true,
  },
  {
    name: "Producción",
    href: "/admin/produccion",
    shortName: "PD",
    enabled: false,
  },
  {
    name: "Galería",
    href: "/admin/galeria",
    shortName: "GA",
    enabled: false,
  },
  {
    name: "Mapa",
    href: "/admin/mapa",
    shortName: "MA",
    enabled: false,
  },
  {
    name: "Usuarios",
    href: "/admin/usuarios",
    shortName: "US",
    enabled: false,
  },
  {
    name: "Configuración",
    href: "/admin/configuracion",
    shortName: "CF",
    enabled: false,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const [newQuoteCount, setNewQuoteCount] =
    useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadNewQuoteCount() {
      const supabase = createClient();

      const { count, error } = await supabase
        .from("quote_requests")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "new");

      if (error) {
        console.error(
          "Error cargando contador de cotizaciones:",
          {
            code: error.code,
            message: error.message,
          }
        );

        return;
      }

      if (isMounted) {
        setNewQuoteCount(count || 0);
      }
    }

    loadNewQuoteCount();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex min-h-20 items-center border-b border-zinc-800 px-6">
          <Link
            href="/admin/dashboard"
            className="font-mono text-xl font-black tracking-tight text-orange-500"
          >
            LACZ
            <span className="text-zinc-100">
              CnC
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
            Administración
          </p>

          <nav aria-label="Navegación administrativa">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

                if (!item.enabled) {
                  return (
                    <li key={item.name}>
                      <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-[10px] font-black text-zinc-700">
                          {item.shortName}
                        </span>

                        <span className="flex-1">
                          {item.name}
                        </span>

                        <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-700">
                          Próximo
                        </span>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                        isActive
                          ? "bg-orange-500/10 text-orange-400"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[10px] font-black",
                          isActive
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500",
                        ].join(" ")}
                      >
                        {item.shortName}
                      </span>

                      <span className="flex-1">
                        {item.name}
                      </span>

                      {item.showQuoteCount &&
                      newQuoteCount > 0 ? (
                        <span className="flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                          {newQuoteCount > 99
                            ? "99+"
                            : newQuoteCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="border-t border-zinc-800 p-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-400 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
          >
            Abrir tienda pública
          </a>
        </div>
      </div>
    </aside>
  );
}