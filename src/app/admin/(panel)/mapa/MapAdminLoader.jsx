"use client";

import dynamic from "next/dynamic";

const MapAdmin = dynamic(
  () => import("./MapAdmin"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-orange-500" />

          <p className="mt-4 font-bold text-zinc-400">
            Cargando mapa comercial...
          </p>
        </div>
      </div>
    ),
  }
);

export default function MapAdminLoader(
  props
) {
  return <MapAdmin {...props} />;
}