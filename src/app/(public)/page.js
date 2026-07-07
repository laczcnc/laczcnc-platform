import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Tienda",
};

export const dynamic = "force-dynamic";

function formatPrice(product) {
  if (product.price !== null && product.price !== undefined) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(Number(product.price));
  }

  return product.price_label || "Cotizar";
}

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
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const productList = error ? [] : products || [];

  if (error) {
    console.error("Error loading public products:", error);
  }

  return (
    <>
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
            Producción personalizada
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-zinc-50 sm:text-6xl">
            Productos que convierten tus ideas en algo real.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Soluciones para municipalidades, instituciones, empresas,
            comercios, emprendedores y público general.
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
            Explora nuestro catálogo y solicita una cotización personalizada.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-bold text-red-300">
              El catálogo no está disponible temporalmente.
            </p>

            <p className="mt-2 text-sm text-red-300/70">
              Puedes comunicarte con nosotros desde la sección Contacto.
            </p>
          </div>
        ) : null}

        {!error && productList.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <p className="font-bold text-zinc-400">
              Todavía no existen productos publicados.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              El catálogo aparecerá aquí cuando se publiquen los primeros
              productos.
            </p>
          </div>
        ) : null}

        {productList.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {productList.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-1 hover:border-orange-500/50"
              >
                {product.image_url ? (
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <span className="font-mono text-4xl font-black text-zinc-700">
                      LC
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                      {product.product_categories?.name ||
                        "Producto"}
                    </p>

                    {product.is_featured ? (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-400">
                        Destacado
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-black text-zinc-100">
                    {product.name}
                  </h3>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">
                    {product.short_description ||
                      "Producto personalizado de acuerdo con tus necesidades."}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="font-black text-zinc-200">
                      {formatPrice(product)}
                    </p>
                  </div>

                  <Link
                    href={`/contacto?producto=${encodeURIComponent(
                      product.name
                    )}`}
                    className="mt-5 flex w-full items-center justify-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:border-orange-500 hover:text-orange-400"
                  >
                    Solicitar cotización
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}