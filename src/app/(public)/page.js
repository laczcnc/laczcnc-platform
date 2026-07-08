import Link from "next/link";

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
    <>
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
            Producción personalizada
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-zinc-50 sm:text-6xl">
            Productos que convierten tus ideas en algo
            real.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Soluciones para municipalidades,
            instituciones, empresas, comercios,
            emprendedores y público general.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#productos"
              className="inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Explorar productos
            </a>

            <Link
              href="/contacto"
              className="inline-flex rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
            >
              Solicitar una cotización
            </Link>
          </div>
        </div>
      </section>

      <section
        id="productos"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
            Tienda
          </p>

          <h2 className="mt-2 text-3xl font-black text-zinc-50">
            Productos disponibles
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-500">
            Busca por nombre, categoría o descripción.
            Toca un producto para ver todos sus detalles
            e imágenes.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
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
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
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
    </>
  );
}