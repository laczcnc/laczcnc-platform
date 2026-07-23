import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/server";
import PublicProductGallery from "@/modules/catalog/components/PublicProductGallery";
import ProductPurchaseActions from "@/modules/cart/components/ProductPurchaseActions";
import PublicQuoteRequestForm from "@/modules/quotes/components/PublicQuoteRequestForm";

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

  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("name, short_description")
      .eq("slug", slug)
      .eq("is_published", true)
      .eq("is_available", true)
      .maybeSingle();

    if (error || !product) {
      return {
        title: "Producto",
      };
    }

    return {
      title: product.name,
      description:
        product.short_description ||
        `Producto personalizado de LaczCnC: ${product.name}`,
    };
  } catch {
    return {
      title: "Producto",
    };
  }
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
      .maybeSingle();

  if (productError) {
    console.error(
      "Error consultando producto público:",
      {
        slug,
        code: productError.code,
        message: productError.message,
        details: productError.details,
        hint: productError.hint,
      }
    );

    throw new Error(
      `No se pudo consultar el producto "${slug}".`
    );
  }

  if (!product) {
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
    .order("is_cover", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (imagesError) {
    console.error(
      "Error cargando galería pública:",
      {
        productId: product.id,
        code: imagesError.code,
        message: imagesError.message,
      }
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
        storage_path:
          product.image_path || "",
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
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

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-14">
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
              Precio referencial
            </p>

            <p className="mt-2 text-3xl font-black text-orange-400">
              {formatPrice(product)}
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              El precio final puede variar según
              cantidad, tamaño, materiales y
              personalización.
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

          <ProductPurchaseActions
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image_url: product.image_url,
              price: product.price,
              price_label: product.price_label,
            }}
          />
          <Link href="/" className="mt-3 flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300">
            Volver a la tienda
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <details id="cotizacion" className="group scroll-mt-24 rounded-2xl border border-orange-500/30 bg-orange-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-black text-orange-300">
            <span>Solicitar cotización de {product.name}</span>
            <span className="group-open:rotate-180">▾</span>
          </summary>
          <div className="border-t border-zinc-800 p-3 sm:p-5">
            <PublicQuoteRequestForm productId={product.id} productName={product.name} sectionId="quote-form" />
          </div>
        </details>
      </section>
    </main>
  );
}
