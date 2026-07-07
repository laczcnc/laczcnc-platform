import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/server";
import {
  deleteProduct,
  updateProduct,
} from "../../actions";

export const metadata = {
  title: "Editar producto",
};

export const dynamic = "force-dynamic";

const errorMessages = {
  name_required: "El nombre del producto es obligatorio.",
  invalid_slug: "El slug no es válido.",
  name_too_long:
    "El nombre no puede superar los 160 caracteres.",
  slug_too_long:
    "El slug no puede superar los 180 caracteres.",
  invalid_price:
    "El precio debe ser igual o mayor que cero.",
  invalid_sort_order:
    "El orden debe ser igual o mayor que cero.",
  invalid_image_url:
    "La URL de imagen debe utilizar HTTP o HTTPS.",
  slug_exists:
    "Otro producto ya utiliza el mismo slug.",
  invalid_category:
    "La categoría seleccionada no es válida.",
  database_error:
    "Supabase no pudo actualizar el producto.",
};

export default async function EditProductPage({
  params,
  searchParams,
}) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const productId = routeParams.id;

  const errorMessage =
    errorMessages[queryParams?.error];

  const supabase = await createClient();

  const [
    { data: product, error: productError },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,
        category_id,
        name,
        slug,
        short_description,
        description,
        price,
        price_label,
        image_url,
        is_published,
        is_featured,
        is_available,
        sort_order
      `)
      .eq("id", productId)
      .single(),

    supabase
      .from("product_categories")
      .select("id, name, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (productError || !product) {
    notFound();
  }

  const categoryList = categories || [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Catálogo
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Editar producto
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            {product.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/productos/categorias"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Administrar categorías
          </Link>

          <Link
            href="/admin/productos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Volver
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <p className="font-bold text-red-300">
            No se pudieron guardar los cambios
          </p>

          <p className="mt-1 text-sm text-red-300/80">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <form
        action={updateProduct}
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <input
          type="hidden"
          name="product_id"
          value={product.id}
        />

        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <h2 className="text-lg font-black text-zinc-100">
              Información principal
            </h2>

            <div className="mt-6 grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Nombre
                </span>

                <input
                  type="text"
                  name="name"
                  required
                  maxLength={160}
                  defaultValue={product.name}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Slug
                </span>

                <input
                  type="text"
                  name="slug"
                  required
                  maxLength={180}
                  defaultValue={product.slug}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Categoría
                </span>

                <select
                  name="category_id"
                  defaultValue={product.category_id || ""}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                >
                  <option value="">
                    Sin categoría
                  </option>

                  {categoryList.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                      {!category.is_active
                        ? " — Inactiva"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Descripción breve
                </span>

                <textarea
                  name="short_description"
                  rows={3}
                  maxLength={300}
                  defaultValue={
                    product.short_description || ""
                  }
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Descripción completa
                </span>

                <textarea
                  name="description"
                  rows={7}
                  defaultValue={product.description || ""}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <h2 className="text-lg font-black text-zinc-100">
              Precio e imagen
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Precio
                </span>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  defaultValue={product.price ?? ""}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Etiqueta
                </span>

                <input
                  type="text"
                  name="price_label"
                  defaultValue={product.price_label || ""}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  URL de imagen
                </span>

                <input
                  type="url"
                  name="image_url"
                  defaultValue={product.image_url || ""}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="font-black text-zinc-100">
              Estado del producto
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Toca cada interruptor para activarlo o
              desactivarlo. Los cambios se guardarán al pulsar
              “Guardar producto”.
            </p>

            <div className="mt-5 space-y-4">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Disponible
                  </span>

                  <span className="mt-1 block text-xs text-zinc-600">
                    Puede venderse o cotizarse.
                  </span>
                </span>

                <input
                  type="checkbox"
                  name="is_available"
                  defaultChecked={product.is_available}
                  className="peer sr-only"
                />

                <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-blue-500">
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Publicado
                  </span>

                  <span className="mt-1 block text-xs text-zinc-600">
                    Aparece en la tienda pública.
                  </span>
                </span>

                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={product.is_published}
                  className="peer sr-only"
                />

                <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-emerald-500">
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Destacado
                  </span>

                  <span className="mt-1 block text-xs text-zinc-600">
                    Aparece antes que otros productos.
                  </span>
                </span>

                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={product.is_featured}
                  className="peer sr-only"
                />

                <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-orange-500">
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <label>
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Orden
              </span>

              <input
                type="number"
                name="sort_order"
                min="0"
                defaultValue={product.sort_order}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
              />
            </label>
          </section>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            Guardar producto
          </button>
        </aside>
      </form>

      <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="font-black text-red-300">
          Zona peligrosa
        </h2>

        <p className="mt-2 text-sm text-red-300/70">
          Eliminar el producto es una operación permanente.
        </p>

        <form action={deleteProduct} className="mt-5">
          <input
            type="hidden"
            name="product_id"
            value={product.id}
          />

          <button
            type="submit"
            className="rounded-xl border border-red-500/40 px-5 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Eliminar producto
          </button>
        </form>
      </section>
    </div>
  );
}