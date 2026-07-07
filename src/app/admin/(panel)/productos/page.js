import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Productos",
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

export default async function AdminProductsPage() {
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
      is_published,
      is_featured,
      is_available,
      sort_order,
      created_at,
      product_categories (
        id,
        name,
        slug
      )
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading admin products:", error);

    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-sm font-bold text-red-300">
            No fue posible cargar los productos.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-300/70">
            Revisa que las tablas, permisos y políticas RLS hayan sido creados
            correctamente en Supabase.
          </p>
        </div>
      </div>
    );
  }

  const productList = products || [];

  const publishedCount = productList.filter(
    (product) => product.is_published
  ).length;

  const featuredCount = productList.filter(
    (product) => product.is_featured
  ).length;

  const unavailableCount = productList.filter(
    (product) => !product.is_available
  ).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Catálogo
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Productos
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Administra los productos que posteriormente aparecerán en la tienda
            pública de LaczCnC.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-orange-500/30 px-5 py-3 text-sm font-black text-orange-200/50"
        >
          Nuevo producto · Próximo paso
        </button>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Total
          </p>

          <p className="mt-3 text-4xl font-black text-zinc-100">
            {productList.length}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Publicados
          </p>

          <p className="mt-3 text-4xl font-black text-emerald-400">
            {publishedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            Destacados
          </p>

          <p className="mt-3 text-4xl font-black text-orange-400">
            {featuredCount}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold text-zinc-500">
            No disponibles
          </p>

          <p className="mt-3 text-4xl font-black text-red-400">
            {unavailableCount}
          </p>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-black text-zinc-100">
              Catálogo registrado
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Información obtenida directamente desde Supabase.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="text-sm font-bold text-orange-400 transition hover:text-orange-300"
          >
            Ver tienda pública
          </Link>
        </div>

        {productList.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-bold text-zinc-400">
              No existen productos registrados.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Verifica que ejecutaste el bloque SQL completo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Producto
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Categoría
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Precio
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Estado
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Destacado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800">
                {productList.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-zinc-900/80"
                  >
                    <td className="px-5 py-5">
                      <p className="font-bold text-zinc-200">
                        {product.name}
                      </p>

                      <p className="mt-1 max-w-md text-sm text-zinc-600">
                        {product.short_description ||
                          "Sin descripción breve."}
                      </p>

                      <p className="mt-2 font-mono text-xs text-zinc-700">
                        /{product.slug}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-sm text-zinc-400">
                      {product.product_categories?.name ||
                        "Sin categoría"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-sm font-bold text-zinc-300">
                      {formatPrice(product)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                          product.is_published
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 bg-zinc-950 text-zinc-500",
                        ].join(" ")}
                      >
                        {product.is_published
                          ? "Publicado"
                          : "Borrador"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                          product.is_featured
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                            : "border-zinc-800 bg-zinc-950 text-zinc-600",
                        ].join(" ")}
                      >
                        {product.is_featured ? "Sí" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}