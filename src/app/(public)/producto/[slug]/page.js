import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/server";
import PublicProductGallery from "@/modules/catalog/components/PublicProductGallery";

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

export async function generateMetadata({ params }) {
  const routeParams = await params;
  const slug = routeParams.slug;

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_available", true)
    .maybeSingle();

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.name,
    description:
      product.short_description ||
      `Producto personalizado de LaczCnC: ${product.name}`,
  };
}

export default async function ProductDetailPage({
  params,
}) {
  const routeParams = await params;
  const slug = routeParams.slug;

  const supabase = await createClient();

  const { data: product, error: productError } =
    await supabase
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
        is_featured,
        sort_order,
        product_categories (
          id,
          name,
          slug
        )
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .eq("is_available", true)
      .single();

  if (productError || !product) {
    notFound();
  }

  const {
    data: productImages,
    error: imagesError,
  } = await supabase
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
    .eq("product_id", product.id)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error(
      "Error loading public product gallery:",
      imagesError
    );
  }

  let galleryImages = productImages || [];

  if (
    galleryImages.length === 0 &&
    product.image_url
  ) {
    galleryImages = [
      {
        id: "legacy-cover",
        product_id: product.id,
        storage_path: product.image_path || "",
        public_url: product.image_url,
        alt_text: product.name,
        is_cover: true,
        sort_order: 0,
      },
    ];
  }

  const categoryName =
    product.product_categories?.name ||
    "Producto personalizado";

  return (
    <main className="bg-zinc-950 text-zinc-100">
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-2 text-sm text-zinc-600"
          >
            <Link
              href="/"
              className="transition hover:text-orange-400"
            >
              Tienda
            </Link>

            <span>/</span>

            <span className="text-zinc-400">
              {categoryName}
            </span>

            <span>/</span>

            <span className="truncate text-zinc-500">
              {product.name}
            </span>
          </nav>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        <PublicProductGallery
          productName={product.name}
          images={galleryImages}
        />

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
              {categoryName}
            </span>

            {product.is_featured ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                Destacado
              </span>
            ) : null}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
            {product.name}
          </h1>

          {product.short_description ? (
            <p className="mt-5 text-lg leading-8 text-zinc-400">
              {product.short_description}
            </p>
          ) : null}

          <div className="mt-8 border-y border-zinc-800 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
              Precio
            </p>

            <p className="mt-2 text-3xl font-black text-orange-400">
              {formatPrice(product)}
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              El precio final puede variar según cantidad,
              tamaño, materiales y personalización.
            </p>
          </div>

          {product.description ? (
            <section className="mt-8">
              <h2 className="text-lg font-black text-zinc-100">
                Descripción
              </h2>

              <div className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-400">
                {product.description}
              </div>
            </section>
          ) : null}

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/contacto?producto=${encodeURIComponent(
                product.name
              )}`}
              className="flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400"
            >
              Solicitar cotización
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}