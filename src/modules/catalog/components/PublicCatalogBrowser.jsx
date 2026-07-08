"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function formatPrice(product) {
  if (
    product.price !== null &&
    product.price !== undefined &&
    product.price !== ""
  ) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(Number(product.price));
  }

  return product.price_label || "Cotizar";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PublicCatalogBrowser({
  products = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const categories = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      const category = product.product_categories;

      if (!category?.id || !category?.name) {
        return;
      }

      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
      });
    });

    return Array.from(categoryMap.values()).sort(
      (firstCategory, secondCategory) =>
        firstCategory.name.localeCompare(
          secondCategory.name,
          "es"
        )
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm);

    return products.filter((product) => {
      const category =
        product.product_categories;

      const matchesCategory =
        selectedCategory === "all" ||
        category?.id === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableContent = normalizeText(
        [
          product.name,
          product.short_description,
          category?.name,
          product.price_label,
        ].join(" ")
      );

      return searchableContent.includes(
        normalizedSearch
      );
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
  ]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
  }

  const filtersAreActive =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all";

  return (
    <div className="mt-10">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px_auto]">
          <div>
            <label
              htmlFor="catalog-search"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500"
            >
              Buscar producto
            </label>

            <input
              id="catalog-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Ejemplo: placa, taza, medalla..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="catalog-category"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500"
            >
              Categoría
            </label>

            <select
              id="catalog-category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            >
              <option value="all">
                Todas las categorías
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersAreActive}
              className="w-full rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          <span className="font-black text-zinc-200">
            {filteredProducts.length}
          </span>{" "}
          {filteredProducts.length === 1
            ? "producto encontrado"
            : "productos encontrados"}
        </p>

        {filtersAreActive ? (
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Filtros activos
          </p>
        ) : null}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-lg font-black text-zinc-300">
            No encontramos productos
          </p>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">
            Prueba con otro nombre o selecciona una
            categoría diferente.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-xl border border-orange-500/40 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-400 transition hover:bg-orange-500 hover:text-zinc-950"
          >
            Mostrar todos
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/producto/${product.slug}`}
              className="group block cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition duration-200 hover:-translate-y-1 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-950/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {product.image_url ? (
                <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <span className="font-mono text-4xl font-black text-zinc-700">
                    LC
                  </span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    {product.product_categories
                      ?.name || "Producto"}
                  </p>

                  {product.is_featured ? (
                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-400">
                      Destacado
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 text-lg font-black text-zinc-100 transition group-hover:text-orange-400">
                  {product.name}
                </h3>

                <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">
                  {product.short_description ||
                    "Producto personalizado de acuerdo con tus necesidades."}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-800 pt-5">
                  <p className="font-black text-zinc-200">
                    {formatPrice(product)}
                  </p>

                  <span className="text-sm font-black text-orange-400 transition group-hover:translate-x-1">
                    Ver producto →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}