import Link from "next/link";

import { createClient } from "@/infrastructure/supabase/server";
import { toggleProductFlag } from "./actions";

export const metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

function formatPrice(product) {
  if (
    product.price !== null &&
    product.price !== undefined
  ) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(Number(product.price));
  }

  return product.price_label || "Cotizar";
}

const successMessages = {
  created: "Producto creado correctamente.",
  updated: "Producto actualizado correctamente.",
  deleted: "Producto eliminado correctamente.",
  status_updated:
    "El estado del producto fue actualizado.",
};

const errorMessages = {
  invalid_product: "El producto no es válido.",
  invalid_toggle: "El control seleccionado no es válido.",
  toggle_failed:
    "No fue posible cambiar el estado del producto.",
  delete_failed:
    "No fue posible eliminar el producto.",
};

function StatusButton({
  product,
  field,
  active,
  activeText,
  inactiveText,
  activeClass,
}) {
  return (
    <form action={toggleProductFlag}>
      <input
        type="hidden"
        name="product_id"
        value={product.id}
      />

      <input
        type="hidden"
        name="field"
        value={field}
      />

      <input
        type="hidden"
        name="current_value"
        value={String(active)}
      />

      <button
        type="submit"
        className={[
          "rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95",
          active
            ? activeClass
            : "border-zinc-700 bg-zinc-950 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300",
        ].join(" ")}
      >
        {active ? activeText : inactiveText}
      </button>
    </form>
  );
}

export default async function AdminProductsPage({
  searchParams,
}) {
  const params = await searchParams;
  const successMessage =
    successMessages[params?.success];
  const errorMessage = errorMessages[params?.error];

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
            Los controles de estado pueden activarse o
            desactivarse directamente desde esta tabla.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/productos/categorias"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Categorías
          </Link>

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            Nuevo producto
          </Link>
        </div>
      </section>

      {successMessage ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-300">
          <p className="font-bold">{successMessage}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
          <p className="font-bold">{errorMessage}</p>
        </div>
      ) : null}

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
        {error ? (
          <div className="p-6 text-red-300">
            No fue posible cargar los productos.
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
                    Controles
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Acción
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

                      <p className="mt-1 max-w-sm text-sm text-zinc-600">
                        {product.short_description ||
                          "Sin descripción breve."}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-sm text-zinc-400">
                      {product.product_categories?.name ||
                        "Sin categoría"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-sm font-bold text-zinc-300">
                      {formatPrice(product)}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex min-w-72 flex-wrap gap-2">
                        <StatusButton
                          product={product}
                          field="is_published"
                          active={product.is_published}
                          activeText="Publicado"
                          inactiveText="Borrador"
                          activeClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                        />

                        <StatusButton
                          product={product}
                          field="is_featured"
                          active={product.is_featured}
                          activeText="Destacado"
                          inactiveText="Normal"
                          activeClass="border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-zinc-950"
                        />

                        <StatusButton
                          product={product}
                          field="is_available"
                          active={product.is_available}
                          activeText="Disponible"
                          inactiveText="No disponible"
                          activeClass="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white"
                        />
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-right">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="inline-flex rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                      >
                        Editar
                      </Link>
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