import Link from "next/link";

import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Galería",
  description:
    "Trabajos de impresión, publicidad, merchandising y producción personalizada realizados por LaczCnC.",
};

export const dynamic = "force-dynamic";

function getYouTubeEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname.includes(
        "youtu.be"
      )
    ) {
      const videoId =
        parsedUrl.pathname.replace(
          "/",
          ""
        );

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }

    if (
      parsedUrl.hostname.includes(
        "youtube.com"
      )
    ) {
      const videoId =
        parsedUrl.searchParams.get(
          "v"
        );

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(
    new Date(`${value}T12:00:00`)
  );
}

export default async function GalleryPage({
  searchParams,
}) {
  const queryParams = await searchParams;

  const selectedCategory =
    typeof queryParams?.categoria ===
    "string"
      ? queryParams.categoria
      : null;

  const supabase = await createClient();

  let query = supabase
    .from("gallery_items")
    .select(`
      id,
      title,
      description,
      item_type,
      category,
      public_url,
      thumbnail_url,
      customer_name,
      project_location,
      completed_at,
      is_featured,
      sort_order,
      created_at
    `)
    .eq("is_published", true)
    .order("is_featured", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (selectedCategory) {
    query = query.eq(
      "category",
      selectedCategory
    );
  }

  const { data, error } =
    await query;

  const { data: categoryData } =
    await supabase
      .from("gallery_items")
      .select("category")
      .eq("is_published", true)
      .not("category", "is", null);

  if (error) {
    console.error(
      "Error cargando galería pública:",
      error
    );
  }

  const items = data || [];

  const categories = Array.from(
    new Set(
      (categoryData || [])
        .map((item) =>
          String(
            item.category || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ).sort((first, second) =>
    first.localeCompare(
      second,
      "es"
    )
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
          Portafolio LaczCnC
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-black text-zinc-50 sm:text-5xl">
              Trabajos realizados
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
              Impresión, corte, sublimación,
              merchandising y publicidad
              personalizada.
            </p>
          </div>

          <Link
            href="/contacto"
            className="rounded-xl bg-pink-500 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-pink-400"
          >
            Solicitar cotización
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-3">
            <Link
              href="/galeria"
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                !selectedCategory
                  ? "border-pink-500 bg-pink-500 text-white"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              Todos
            </Link>

            {categories.map(
              (category) => (
                <Link
                  key={category}
                  href={`/galeria?categoria=${encodeURIComponent(
                    category
                  )}`}
                  className={[
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-bold",
                    selectedCategory ===
                    category
                      ? "border-pink-500 bg-pink-500 text-white"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400",
                  ].join(" ")}
                >
                  {category}
                </Link>
              )
            )}
          </div>
        ) : null}

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-bold text-red-300">
              La galería no está disponible
              temporalmente.
            </p>
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
            <p className="font-black text-zinc-300">
              Todavía no existen trabajos
              publicados.
            </p>
          </div>
        ) : null}

        <section className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((item) => {
            const youtubeEmbedUrl =
              item.item_type ===
              "video"
                ? getYouTubeEmbedUrl(
                    item.public_url
                  )
                : null;

            return (
              <article
                key={item.id}
                className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <div className="relative overflow-hidden bg-zinc-950">
                  {item.item_type ===
                  "image" ? (
                    <img
                      src={item.public_url}
                      alt={item.title}
                      loading="lazy"
                      className="h-auto w-full object-cover transition duration-500 hover:scale-[1.02]"
                    />
                  ) : youtubeEmbedUrl ? (
                    <iframe
                      src={
                        youtubeEmbedUrl
                      }
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="aspect-video w-full"
                    />
                  ) : (
                    <video
                      src={item.public_url}
                      poster={
                        item.thumbnail_url ||
                        undefined
                      }
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-black object-contain"
                    />
                  )}

                  {item.is_featured ? (
                    <span className="absolute left-3 top-3 rounded-full border border-orange-400/40 bg-orange-500 px-3 py-1 text-xs font-black text-zinc-950">
                      Destacado
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  {item.category ? (
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-400">
                      {item.category}
                    </p>
                  ) : null}

                  <h2 className="mt-2 text-xl font-black text-zinc-100">
                    {item.title}
                  </h2>

                  {item.description ? (
                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600">
                    {item.project_location ? (
                      <span>
                        {
                          item.project_location
                        }
                      </span>
                    ) : null}

                    {item.completed_at ? (
                      <span>
                        {formatDate(
                          item.completed_at
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}