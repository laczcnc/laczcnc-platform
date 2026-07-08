import { createClient } from "@/infrastructure/supabase/server";
import PublicCatalogBrowser from "@/modules/catalog/components/PublicCatalogBrowser";

export const metadata = {
  title: "Tienda",
};

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      price,
      price_label,
      image_url,
      is_featured,
      sort_order,
      product_categories (
        id,
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .eq("is_available", true)
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
      "Error cargando el catálogo público:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
  }

  const productList = error
    ? []
    : products || [];

  return (
    <main className="min-h-screen bg-zinc-950">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-bold text-red-300">
              El catálogo no está disponible
              temporalmente.
            </p>

            <p className="mt-2 text-sm text-red-300/70">
              Puedes comunicarte mediante la sección de
              contacto.
            </p>
          </div>
        ) : null}

        {!error && productList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <p className="font-bold text-zinc-400">
              Todavía no existen productos publicados.
            </p>
          </div>
        ) : null}

        {productList.length > 0 ? (
          <PublicCatalogBrowser
            products={productList}
          />
        ) : null}
      </section>
    </main>
  );
}