import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";
import GalleryManager from "@/modules/gallery/components/GalleryManager";

export const metadata = {
  title: "Administrar galería",
};

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("is_featured", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Error cargando galería administrativa:",
      error
    );
  }

  const items = data || [];

  const publishedCount = items.filter(
    (item) => item.is_published
  ).length;

  const featuredCount = items.filter(
    (item) => item.is_featured
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
            Portafolio
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Galería
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Publica fotografías y videos de los
            trabajos realizados por LaczCnC.
          </p>
        </div>

        <Link
          href="/galeria"
          target="_blank"
          className="rounded-xl border border-pink-500/30 px-5 py-3 text-sm font-black text-pink-300 transition hover:bg-pink-500 hover:text-white"
        >
          Ver galería pública
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Total
          </p>

          <p className="mt-2 text-4xl font-black text-zinc-100">
            {items.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Publicados
          </p>

          <p className="mt-2 text-4xl font-black text-emerald-300">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Destacados
          </p>

          <p className="mt-2 text-4xl font-black text-orange-300">
            {featuredCount}
          </p>
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudo cargar la galería.
          </p>
        </div>
      ) : null}

      <section className="mt-8">
        <GalleryManager
          initialItems={items}
        />
      </section>
    </div>
  );
}