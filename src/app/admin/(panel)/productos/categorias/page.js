import Link from "next/link";

import { createClient } from "@/infrastructure/supabase/server";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../actions";

export const metadata = {
  title: "Categorías de productos",
};

export const dynamic = "force-dynamic";

const errorMessages = {
  category_name_required:
    "El nombre de la categoría es obligatorio.",
  category_slug_invalid:
    "No fue posible generar un slug válido.",
  category_slug_exists:
    "Ya existe una categoría con ese slug.",
  invalid_sort_order:
    "El orden debe ser igual o mayor que cero.",
  invalid_category:
    "La categoría seleccionada no es válida.",
  category_database_error:
    "Supabase no pudo guardar la categoría.",
  category_delete_failed:
    "No fue posible eliminar la categoría.",
};

const successMessages = {
  category_created: "Categoría creada correctamente.",
  category_updated: "Categoría actualizada correctamente.",
  category_deleted: "Categoría eliminada correctamente.",
};

export default async function ProductCategoriesPage({
  searchParams,
}) {
  const params = await searchParams;
  const errorMessage = errorMessages[params?.error];
  const successMessage = successMessages[params?.success];

  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("product_categories")
    .select(`
      id,
      name,
      slug,
      description,
      is_active,
      sort_order,
      created_at,
      products (
        id
      )
    `)
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
            Categorías
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Crea, edita, activa o elimina las categorías utilizadas
            por los productos.
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
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <p className="font-bold text-red-300">
            Operación no completada
          </p>

          <p className="mt-1 text-sm text-red-300/80">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <p className="font-bold text-emerald-300">
            {successMessage}
          </p>
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
        <h2 className="text-lg font-black text-zinc-100">
          Nueva categoría
        </h2>

        <form
          action={createCategory}
          className="mt-6 grid gap-5 lg:grid-cols-2"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Nombre
            </span>

            <input
              type="text"
              name="name"
              required
              placeholder="Ejemplo: Colegios"
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
              placeholder="Automático si queda vacío"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Descripción
            </span>

            <textarea
              name="description"
              rows={3}
              placeholder="Descripción general de la categoría."
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Orden
            </span>

            <input
              type="number"
              name="sort_order"
              min="0"
              defaultValue="0"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-zinc-300">
                Categoría activa
              </span>

              <span className="mt-1 block text-xs text-zinc-600">
                Puede seleccionarse en los productos.
              </span>
            </span>

            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="peer sr-only"
            />

            <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-orange-500">
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400 lg:col-span-2"
          >
            Crear categoría
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-xl font-black text-zinc-100">
            Categorías registradas
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            {categoryList.length} categorías encontradas.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            No fue posible cargar las categorías.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {categoryList.map((category) => (
              <article
                key={category.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <form
                  action={updateCategory}
                  className="space-y-5"
                >
                  <input
                    type="hidden"
                    name="category_id"
                    value={category.id}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-zinc-100">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {category.products?.length || 0} productos
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-bold",
                        category.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-950 text-zinc-500",
                      ].join(" ")}
                    >
                      {category.is_active
                        ? "Activa"
                        : "Inactiva"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-zinc-500">
                        Nombre
                      </span>

                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={category.name}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-zinc-500">
                        Slug
                      </span>

                      <input
                        type="text"
                        name="slug"
                        required
                        defaultValue={category.slug}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none focus:border-orange-500"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      Descripción
                    </span>

                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={category.description || ""}
                      className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-zinc-500">
                        Orden
                      </span>

                      <input
                        type="number"
                        name="sort_order"
                        min="0"
                        defaultValue={category.sort_order}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3">
                      <span className="text-sm font-bold text-zinc-300">
                        Activa
                      </span>

                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={category.is_active}
                        className="peer sr-only"
                      />

                      <span className="relative h-7 w-12 rounded-full bg-zinc-700 transition peer-checked:bg-orange-500">
                        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-orange-500/50 bg-orange-500/10 px-4 py-3 text-sm font-black text-orange-400 transition hover:bg-orange-500 hover:text-zinc-950"
                  >
                    Guardar cambios
                  </button>
                </form>

                <form
                  action={deleteCategory}
                  className="mt-3"
                >
                  <input
                    type="hidden"
                    name="category_id"
                    value={category.id}
                  />

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    Eliminar categoría
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}