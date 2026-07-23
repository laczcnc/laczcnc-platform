"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function PublicGalleryBrowser({
  items = [],
  initialCategory = "all",
}) {
  const [category, setCategory] = useState(initialCategory);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => Array.from(
      new Set(items.map((item) => item.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es")),
    [items]
  );

  const visible = useMemo(() => {
    const term = normalize(search);
    return items.filter((item) => {
      const categoryMatches =
        category === "all" || item.category === category;
      const text = normalize(
        [item.title, item.description, item.category, item.customer_name, item.project_location].join(" ")
      );
      return categoryMatches && (!term || text.includes(term));
    });
  }, [items, category, search]);

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen((value) => !value)}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-300"
        >
          {searchOpen ? "Cerrar búsqueda" : "Buscar"}
        </button>
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${category === "all" ? "border-pink-500 bg-pink-500 text-white" : "border-zinc-700 text-zinc-400"}`}
        >
          Todos
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${category === item ? "border-pink-500 bg-pink-500 text-white" : "border-zinc-700 text-zinc-400"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {searchOpen ? (
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar trabajo, categoría o lugar..."
          className="mt-3 h-10 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-pink-500"
        />
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const embed = item.item_type === "video"
            ? youtubeEmbed(item.public_url)
            : null;
          return (
            <article key={item.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="aspect-video bg-zinc-950">
                {item.item_type === "video" ? (
                  embed ? (
                    <iframe
                      src={embed}
                      title={item.title}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={item.public_url}
                      poster={item.thumbnail_url || undefined}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <img
                    src={item.public_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-black text-zinc-100">{item.title}</h2>
                {item.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                    {item.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-600">
                  {item.category ? <span>{item.category}</span> : null}
                  {item.project_location ? <span>· {item.project_location}</span> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
          No hay trabajos para esta búsqueda.
        </p>
      ) : null}
    </section>
  );
}
