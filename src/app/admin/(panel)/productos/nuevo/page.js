import Link from "next/link";

import { createClient } from "@/infrastructure/supabase/server";
import { createProduct } from "../actions";

export const metadata = {
  title: "Nuevo producto",
};

export const dynamic = "force-dynamic";

const errorMessages = {
  name_required: "El nombre del producto es obligatorio.",
  invalid_slug:
    "No fue posible generar una URL válida para el producto.",
  name_too_long:
    "El nombre no puede superar los 160 caracteres.",
  slug_too_long:
    "El slug no puede superar los 180 caracteres.",
  invalid_price:
    "El precio debe ser un número igual o mayor que cero.",
  invalid_sort_order:
    "El orden debe ser un número igual o mayor que cero.",
  invalid_image_url:
    "La imagen debe utilizar una URL HTTP o HTTPS válida.",
  slug_exists:
    "Ya existe otro producto con ese slug. Utiliza uno diferente.",
  invalid_category:
    "La categoría seleccionada no es válida.",
  database_error:
    "Supabase no pudo guardar el producto. Revisa los datos e inténtalo nuevamente.",
};

export default async function NewProductPage({
  searchParams,
}) {
  const params = await searchParams;
  const errorMessage = errorMessages[params?.error];

  const supabase = await createClient();

  const { data: categories, error: categoriesError } =
    await supabase
      .from("product_categories")
      .select("id, name, slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

  const categoryList = categories || [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Catálogo
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Nuevo producto
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Registra un producto y decide si debe aparecer
            inmediatamente en la tienda pública.
          </p>
        </div>

        <Link
          href="/admin/productos"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-400"
        >
          Volver a productos
        </Link>
      </section>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4"
        >
          <p className="font-bold text-red-300">
            No se pudo crear el producto
          </p>

          <p className="mt-1 text-sm leading-6 text-red-300/80">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {categoriesError ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
        >
          <p className="font-bold text-amber-300">
            No se pudieron cargar las categorías
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-300/80">
            Puedes crear el producto sin categoría o revisar las
            políticas de Supabase.
          </p>
        </div>
      ) : null}

      <form
        action={createProduct}
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-black text-zinc-100">
                Información principal
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Datos que identificarán el producto dentro del
                catálogo.
              </p>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Nombre del producto
                  <span className="ml-1 text-orange-400">*</span>
                </span>

                <input
                  type="text"
                  name="name"
                  required
                  maxLength={160}
                  autoFocus
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
                  placeholder="Se genera automáticamente si lo dejas vacío"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                />

                <span className="mt-2 block text-xs leading-5 text-zinc-600">
                  Identificador único para URLs. Utiliza letras,
                  números y guiones.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  Categoría
                </span>

                <select
                  name="category_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500"
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
                  placeholder="Resumen que aparecerá en la tarjeta del producto."
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
                  placeholder="Características, materiales, personalización, usos y condiciones."
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-black text-zinc-100">
                Precio e imagen
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Puedes mostrar un precio fijo o utilizar una etiqueta
                como “Cotizar”.
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
                  defaultValue="Cotizar"
                  placeholder="Cotizar"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-zinc-300">
                  URL de imagen
                </span>

                <input
                  type="url"
                  name="image_url"
                  inputMode="url"
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                />

                <span className="mt-2 block text-xs leading-5 text-zinc-600">
                  El sistema de carga de imágenes en Supabase Storage
                  se implementará en el siguiente bloque.
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="font-black text-zinc-100">
              Publicación
            </h2>

            <div className="mt-5 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <input
                  type="checkbox"
                  name="is_available"
                  defaultChecked
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Disponible
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    El producto puede ofrecerse a los clientes.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <input
                  type="checkbox"
                  name="is_published"
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Publicar en la tienda
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    Será visible inmediatamente en la página
                    principal.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <input
                  type="checkbox"
                  name="is_featured"
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span>
                  <span className="block text-sm font-bold text-zinc-300">
                    Producto destacado
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-600">
                    Aparecerá antes que los productos normales.
                  </span>
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
                defaultValue="0"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500"
              />

              <span className="mt-2 block text-xs leading-5 text-zinc-600">
                Los números menores aparecen primero.
              </span>
            </label>
          </section>

          <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Crear producto
            </button>

            <Link
              href="/admin/productos"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              Cancelar
            </Link>
          </section>
        </aside>
      </form>
    </div>
  );
}