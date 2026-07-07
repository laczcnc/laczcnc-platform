import Link from "next/link";

import { createClient } from "@/infrastructure/supabase/server";
import ProductForm from "@/modules/catalog/components/ProductForm";
import { createProduct } from "../actions";

export const metadata = {
  title: "Nuevo producto",
};

export const dynamic = "force-dynamic";

const errorMessages = {
  name_required:
    "El nombre del producto es obligatorio.",
  invalid_slug:
    "No fue posible generar un slug válido.",
  name_too_long:
    "El nombre no puede superar los 160 caracteres.",
  slug_too_long:
    "El slug no puede superar los 180 caracteres.",
  invalid_price:
    "El precio debe ser igual o mayor que cero.",
  invalid_sort_order:
    "El orden debe ser igual o mayor que cero.",
  invalid_image_url:
    "La imagen cargada no tiene una URL válida.",
  slug_exists:
    "Ya existe otro producto con ese slug.",
  invalid_category:
    "La categoría seleccionada no es válida.",
  database_error:
    "Supabase no pudo guardar el producto.",
};

export default async function NewProductPage({
  searchParams,
}) {
  const params = await searchParams;

  const errorMessage =
    errorMessages[params?.error];

  const supabase = await createClient();

  const { data: categories, error } =
    await supabase
      .from("product_categories")
      .select(
        "id, name, slug, is_active, sort_order"
      )
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
            Registra un producto y carga su imagen desde
            una computadora o desde la galería del celular.
          </p>
        </div>

        <Link
          href="/admin/productos/categorias"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
        >
          Administrar categorías
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

          <p className="mt-1 text-sm text-red-300/80">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
        >
          <p className="font-bold text-amber-300">
            No se pudieron cargar las categorías.
          </p>
        </div>
      ) : null}

      <ProductForm
        action={createProduct}
        categories={categoryList}
        submitLabel="Crear producto"
      />
    </div>
  );
}