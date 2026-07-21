import Link from "next/link";
import { notFound } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";
import ProductForm from "@/modules/catalog/components/ProductForm";
import ProductGalleryManager from "@/modules/catalog/components/ProductGalleryManager";
import {
  deleteProduct,
  updateProduct,
} from "../../actions";

export const metadata = {
  title: "Editar producto",
};

export const dynamic = "force-dynamic";

const errorMessages = {
  name_required:
    "El nombre del producto es obligatorio.",
  invalid_slug:
    "El slug del producto no es válido.",
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
  await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const routeParams = await params;
  const queryParams = await searchParams;

  const productId = routeParams.id;
  const errorMessage =
    errorMessages[queryParams?.error];

  const supabase = await createClient();

  const [
    { data: product, error: productError },
    { data: categories, error: categoriesError },
    { data: productImages, error: imagesError },
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
        image_path,
        is_published,
        is_featured,
        is_available,
        sort_order
      `)
      .eq("id", productId)
      .single(),

    supabase
      .from("product_categories")
      .select(
        "id, name, slug, is_active, sort_order"
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),

    supabase
      .from("product_images")
      .select(`
        id,
        product_id,
        storage_path,
        public_url,
        alt_text,
        is_cover,
        sort_order,
        created_at
      `)
      .eq("product_id", productId)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (productError || !product) {
    notFound();
  }

  const categoryList = categories || [];
  const imageList = productImages || [];

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
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4"
        >
          <p className="font-bold text-red-300">
            No se pudieron guardar los cambios
          </p>

          <p className="mt-1 text-sm text-red-300/80">
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
            No se pudieron cargar las categorías.
          </p>
        </div>
      ) : null}

      {imagesError ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
        >
          <p className="font-bold text-amber-300">
            No se pudo cargar la galería del producto.
          </p>

          <p className="mt-1 text-sm text-amber-300/80">
            Revisa la tabla product_images y sus políticas RLS.
          </p>
        </div>
      ) : null}

      <ProductForm
        action={updateProduct}
        categories={categoryList}
        product={product}
        submitLabel="Guardar producto"
      />

      <div className="mt-8">
        <ProductGalleryManager
          productId={product.id}
          initialImages={imageList}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="font-black text-red-300">
          Zona peligrosa
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-300/70">
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
