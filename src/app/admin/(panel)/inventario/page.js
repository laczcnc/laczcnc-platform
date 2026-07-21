import Link from "next/link";

import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";

export const metadata = {
  title: "Inventario y materiales",
};

export const dynamic = "force-dynamic";

function formatQuantity(value) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es");
}

function getStockState(material) {
  const currentStock = Number(
    material.current_stock || 0
  );

  const minimumStock = Number(
    material.minimum_stock || 0
  );

  if (!material.is_active) {
    return {
      label: "Inactivo",
      className:
        "border-zinc-700 bg-zinc-800 text-zinc-400",
    };
  }

  if (currentStock === 0) {
    return {
      label: "Agotado",
      className:
        "border-red-500/30 bg-red-500/10 text-red-300",
    };
  }

  if (currentStock <= minimumStock) {
    return {
      label: "Stock bajo",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "Disponible",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
}

export default async function InventoryPage({
  searchParams,
}) {
  const {
    profile,
    supabase,
  } = await requirePermission(
    PERMISSIONS.INVENTORY_VIEW
  );

  const canManageInventory = hasPermission(
    profile.role,
    PERMISSIONS.INVENTORY_MANAGE
  );

  const queryParams = await searchParams;

  const selectedStatus =
    typeof queryParams?.estado === "string"
      ? queryParams.estado
      : "all";

  const selectedCategory =
    typeof queryParams?.categoria === "string"
      ? queryParams.categoria
      : "all";

  const searchTerm =
    typeof queryParams?.q === "string"
      ? queryParams.q
      : "";

  const { data, error } = await supabase
    .from("inventory_materials")
    .select(
      "id, sku, name, category, unit, current_stock, minimum_stock, unit_cost, supplier_name, location, is_active, updated_at"
    )
    .order("is_active", {
      ascending: false,
    })
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Error cargando inventario:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
  }

  const allMaterials = data || [];

  const categories = Array.from(
    new Set(
      allMaterials
        .map((material) =>
          String(
            material.category || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ).sort((a, b) =>
    a.localeCompare(b, "es")
  );

  const normalizedSearch =
    normalizeSearch(searchTerm);

  const materials = allMaterials.filter(
    (material) => {
      const currentStock = Number(
        material.current_stock || 0
      );

      const minimumStock = Number(
        material.minimum_stock || 0
      );

      const matchesSearch =
        !normalizedSearch ||
        [
          material.sku,
          material.name,
          material.category,
          material.supplier_name,
          material.location,
        ].some((value) =>
          normalizeSearch(value).includes(
            normalizedSearch
          )
        );

      const matchesCategory =
        selectedCategory === "all" ||
        material.category ===
          selectedCategory;

      let matchesStatus = true;

      if (selectedStatus === "active") {
        matchesStatus =
          material.is_active === true;
      } else if (
        selectedStatus === "inactive"
      ) {
        matchesStatus =
          material.is_active === false;
      } else if (
        selectedStatus === "low"
      ) {
        matchesStatus =
          material.is_active === true &&
          currentStock <= minimumStock;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    }
  );

  const activeMaterials =
    allMaterials.filter(
      (material) => material.is_active
    );

  const lowStockCount =
    activeMaterials.filter(
      (material) =>
        Number(
          material.current_stock || 0
        ) <=
        Number(
          material.minimum_stock || 0
        )
    ).length;

  const inventoryValue =
    activeMaterials.reduce(
      (total, material) =>
        total +
        Number(
          material.current_stock || 0
        ) *
          Number(material.unit_cost || 0),
      0
    );

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
            Almacén
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Inventario y materiales
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Controla existencias, costos,
            ubicaciones y alertas de reposición.
          </p>
        </div>

        {canManageInventory ? (
          <Link
            href="/admin/inventario/nuevo"
            className="inline-flex items-center justify-center rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-teal-300"
          >
            Nuevo material
          </Link>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Materiales
          </p>

          <p className="mt-2 text-3xl font-black text-zinc-100">
            {allMaterials.length}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Activos
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-300">
            {activeMaterials.length}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Reponer
          </p>

          <p className="mt-2 text-3xl font-black text-amber-300">
            {lowStockCount}
          </p>
        </article>

        <article className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
          <p className="text-sm font-semibold text-zinc-500">
            Valor estimado
          </p>

          <p className="mt-2 text-2xl font-black text-teal-300">
            {formatCurrency(inventoryValue)}
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-4">
        <form
          method="get"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]"
        >
          <input
            type="search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Buscar por SKU, material, proveedor o ubicación"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-teal-500"
          />

          <select
            name="categoria"
            defaultValue={selectedCategory}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-teal-500"
          >
            <option value="all">
              Todas las categorías
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          <select
            name="estado"
            defaultValue={selectedStatus}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-teal-500"
          >
            <option value="all">
              Todos los estados
            </option>
            <option value="active">
              Activos
            </option>
            <option value="low">
              Stock bajo
            </option>
            <option value="inactive">
              Inactivos
            </option>
          </select>

          <button
            type="submit"
            className="rounded-xl border border-teal-500/40 px-5 py-3 text-sm font-semibold text-teal-300 transition hover:bg-teal-500/10"
          >
            Filtrar
          </button>
        </form>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
          No se pudo consultar el inventario.
          Ejecuta la migración SQL del módulo.
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {materials.length} materiales
            encontrados
          </p>

          {(searchTerm ||
            selectedCategory !== "all" ||
            selectedStatus !== "all") ? (
            <Link
              href="/admin/inventario"
              className="text-sm font-semibold text-teal-300 hover:text-teal-200"
            >
              Limpiar filtros
            </Link>
          ) : null}
        </div>

        {materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
            <p className="font-semibold text-zinc-300">
              No hay materiales para mostrar.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Cambia los filtros o registra el
              primer material.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {materials.map((material) => {
              const stockState =
                getStockState(material);

              return (
                <article
                  key={material.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 transition hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-teal-400">
                        {material.sku}
                      </p>

                      <h2 className="mt-1 truncate text-lg font-bold text-zinc-100">
                        {material.name}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-600">
                        {material.category ||
                          "Sin categoría"}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        stockState.className,
                      ].join(" ")}
                    >
                      {stockState.label}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-xs text-zinc-600">
                        Existencia
                      </p>

                      <p className="mt-1 text-xl font-bold text-zinc-100">
                        {formatQuantity(
                          material.current_stock
                        )}{" "}
                        <span className="text-xs font-medium text-zinc-500">
                          {material.unit}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-xs text-zinc-600">
                        Mínimo
                      </p>

                      <p className="mt-1 text-xl font-bold text-zinc-300">
                        {formatQuantity(
                          material.minimum_stock
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                    <p className="truncate text-xs text-zinc-600">
                      {material.location ||
                        material.supplier_name ||
                        "Sin ubicación"}
                    </p>

                    <Link
                      href={
                        "/admin/inventario/" +
                        material.id
                      }
                      className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-teal-500 hover:text-teal-300"
                    >
                      Ver movimientos
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
