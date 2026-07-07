"use client";

import Link from "next/link";

import ProductImageUploader from "./ProductImageUploader";

export default function ProductForm({
  action,
  categories,
  product = null,
  submitLabel,
  cancelHref = "/admin/productos",
}) {
  const isEditing = Boolean(product);

  return (
    <form
      action={action}
      className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
    >
      {isEditing ? (
        <input
          type="hidden"
          name="product_id"
          value={product.id}
        />
      ) : null}

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-black text-zinc-100">
              Información principal
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Datos que identifican el producto dentro del
              catálogo.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Nombre del producto
                <span className="ml-1 text-orange-400">
                  *
                </span>
              </span>

              <input
                type="text"
                name="name"
                required
                maxLength={160}
                defaultValue={product?.name || ""}
                placeholder="Ejemplo: Placa de reconocimiento premium"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Slug
              </span>

              <input
                type="text"
                name="slug"
                maxLength={180}
                defaultValue={product?.slug || ""}
                placeholder="Automático si queda vacío"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Categoría
              </span>

              <select
                name="category_id"
                defaultValue={product?.category_id || ""}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500"
              >
                <option value="">
                  Sin categoría
                </option>

                {categories.map((category) => (
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

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Descripción breve
              </span>

              <textarea
                name="short_description"
                rows={3}
                maxLength={300}
                defaultValue={
                  product?.short_description || ""
                }
                placeholder="Resumen que aparecerá en la tarjeta."
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Descripción completa
              </span>

              <textarea
                name="description"
                rows={7}
                defaultValue={product?.description || ""}
                placeholder="Características, materiales, personalización y condiciones."
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-black text-zinc-100">
              Precio
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Puedes registrar un precio fijo o mostrar una
              etiqueta como “Cotizar”.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Precio en soles
              </span>

              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={product?.price ?? ""}
                placeholder="0.00"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Etiqueta de precio
              </span>

              <input
                type="text"
                name="price_label"
                maxLength={80}
                defaultValue={
                  product?.price_label ?? "Cotizar"
                }
                placeholder="Cotizar"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="font-black text-zinc-100">
            Imagen principal
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Carga una imagen desde la PC o la galería del
            celular.
          </p>

          <div className="mt-5">
            <ProductImageUploader
              defaultValue={product?.image_url || ""}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="font-black text-zinc-100">
            Estado
          </h2>

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
                defaultChecked={
                  product
                    ? product.is_available
                    : true
                }
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
                defaultChecked={
                  product?.is_published || false
                }
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
                  Aparece antes que los productos normales.
                </span>
              </span>

              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={
                  product?.is_featured || false
                }
                className="peer sr-only"
              />

              <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-orange-500">
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Orden
            </span>

            <input
              type="number"
              name="sort_order"
              min="0"
              step="1"
              defaultValue={product?.sort_order ?? 0}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
          >
            {submitLabel}
          </button>

          <Link
            href={cancelHref}
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            Cancelar
          </Link>
        </section>
      </aside>
    </form>
  );
}