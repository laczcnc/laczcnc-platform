import { createClient } from "@/infrastructure/supabase/server";
import PublicGalleryBrowser from "@/modules/gallery/components/PublicGalleryBrowser";

export const metadata = {
  title: "Galería",
  description:
    "Trabajos de impresión, publicidad, merchandising y producción personalizada realizados por LaczCnC.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage({ searchParams }) {
  const queryParams = await searchParams;
  const initialCategory =
    typeof queryParams?.categoria === "string"
      ? queryParams.categoria
      : "all";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_items")
    .select(`
      id, title, description, item_type, category,
      public_url, thumbnail_url, customer_name,
      project_location, completed_at, is_featured,
      sort_order, created_at
    `)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando galería pública:", error);
  }

  const items = error ? [] : data || [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
          Portafolio LaczCnC
        </p>
        <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
          Trabajos realizados
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
          Impresión, corte, sublimación, merchandising y publicidad personalizada.
        </p>

        {error ? (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            La galería no está disponible temporalmente.
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-800 px-6 py-14 text-center text-zinc-500">
            Todavía no existen trabajos publicados.
          </div>
        ) : null}

        {items.length > 0 ? (
          <PublicGalleryBrowser items={items} initialCategory={initialCategory} />
        ) : null}
      </section>
    </main>
  );
}
