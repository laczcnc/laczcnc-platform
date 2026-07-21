import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import InventoryMaterialForm from "@/modules/inventory/components/InventoryMaterialForm";

import {
  registerInventoryMovement,
  toggleInventoryMaterial,
  updateInventoryMaterial,
} from "../actions";

export const metadata = {
  title: "Detalle de inventario",
};

export const dynamic = "force-dynamic";

const SUCCESS_MESSAGES = {
  created: "Material creado correctamente.",
  updated:
    "Información del material actualizada.",
  status_updated:
    "Estado del material actualizado.",
  movement_created:
    "Movimiento registrado y existencia actualizada.",
};

const ERROR_MESSAGES = {
  invalid_material:
    "El material seleccionado no es válido.",
  invalid_name:
    "El nombre debe tener entre 2 y 180 caracteres.",
  invalid_sku:
    "El SKU solo puede contener letras, números, puntos, guiones y guion bajo.",
  invalid_unit:
    "Selecciona una unidad de medida válida.",
  invalid_minimum_stock:
    "El stock mínimo debe ser igual o mayor que cero.",
  invalid_unit_cost:
    "El costo unitario debe ser igual o mayor que cero.",
  sku_exists:
    "Ya existe otro material con el mismo SKU.",
  database_error:
    "Supabase no pudo actualizar el material.",
  status_failed:
    "No fue posible cambiar el estado del material.",
  invalid_movement_type:
    "Selecciona un tipo de movimiento válido.",
  invalid_quantity:
    "La cantidad ingresada no es válida.",
  invalid_reason:
    "Escribe un motivo de entre 2 y 300 caracteres.",
  insufficient_stock:
    "La salida supera la existencia disponible.",
  stock_unchanged:
    "El ajuste coincide con la existencia actual.",
  inactive_material:
    "Activa el material antes de registrar movimientos.",
  movement_failed:
    "No fue posible registrar el movimiento.",
};

const MOVEMENT_LABELS = {
  entry: "Entrada",
  exit: "Salida",
  set: "Ajuste",
};

const MOVEMENT_STYLES = {
  entry:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  exit:
    "border-red-500/30 bg-red-500/10 text-red-300",
  set:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

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

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export default async function InventoryMaterialPage({
  params,
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

  const routeParams = await params;
  const queryParams = await searchParams;
  const materialId = routeParams.id;

  const [
    materialResponse,
    movementsResponse,
  ] = await Promise.all([
    supabase
      .from("inventory_materials")
      .select("*")
      .eq("id", materialId)
      .maybeSingle(),

    supabase
      .from("inventory_movements")
      .select(
        "id, material_id, movement_type, quantity, previous_stock, new_stock, reason, reference, created_by, created_at"
      )
      .eq("material_id", materialId)
      .order("created_at", {
        ascending: false,
      })
      .limit(100),
  ]);

  const material = materialResponse.data;

  if (
    materialResponse.error ||
    !material
  ) {
    notFound();
  }

  if (movementsResponse.error) {
    console.error(
      "Error cargando movimientos de inventario:",
      movementsResponse.error
    );
  }

  const movements =
    movementsResponse.data || [];

  const creatorIds = Array.from(
    new Set(
      movements
        .map(
          (movement) =>
            movement.created_by
        )
        .filter(Boolean)
    )
  );

  let profileNames = {};

  if (creatorIds.length > 0) {
    const { data: creators } =
      await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds);

    profileNames = Object.fromEntries(
      (creators || []).map((creator) => [
        creator.id,
        creator.full_name ||
          "Usuario del equipo",
      ])
    );
  }

  const currentStock = Number(
    material.current_stock || 0
  );

  const minimumStock = Number(
    material.minimum_stock || 0
  );

  const unitCost = Number(
    material.unit_cost || 0
  );

  const lowStock =
    material.is_active &&
    currentStock <= minimumStock;

  const successMessage =
    SUCCESS_MESSAGES[queryParams?.success];

  const errorMessage =
    ERROR_MESSAGES[queryParams?.error];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-teal-400">
            {material.sku}
          </p>

          <h1 className="mt-3 truncate text-3xl font-black text-zinc-50 sm:text-4xl">
            {material.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>
              {material.category ||
                "Sin categoría"}
            </span>

            <span aria-hidden="true">•</span>

            <span>
              {material.location ||
                "Sin ubicación"}
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                material.is_active
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400",
              ].join(" ")}
            >
              {material.is_active
                ? "Activo"
                : "Inactivo"}
            </span>
          </div>
        </div>

        <Link
          href="/admin/inventario"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-teal-500 hover:text-teal-300"
        >
          Volver al inventario
        </Link>
      </section>

      {successMessage ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      {lowStock ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <p className="font-semibold text-amber-300">
            Reposición necesaria
          </p>

          <p className="mt-1 text-sm text-amber-300/75">
            La existencia llegó al nivel mínimo
            configurado.
          </p>
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm text-zinc-500">
            Existencia actual
          </p>

          <p className="mt-2 text-3xl font-black text-zinc-100">
            {formatQuantity(currentStock)}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {material.unit}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm text-zinc-500">
            Stock mínimo
          </p>

          <p className="mt-2 text-3xl font-black text-amber-300">
            {formatQuantity(minimumStock)}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
          <p className="text-sm text-zinc-500">
            Costo unitario
          </p>

          <p className="mt-2 text-2xl font-black text-zinc-200">
            {formatCurrency(unitCost)}
          </p>
        </article>

        <article className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
          <p className="text-sm text-zinc-500">
            Valor existente
          </p>

          <p className="mt-2 text-2xl font-black text-teal-300">
            {formatCurrency(
              currentStock * unitCost
            )}
          </p>
        </article>
      </section>

      {canManageInventory ? (
        <section className="mt-6 rounded-2xl border border-teal-500/25 bg-teal-500/5 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-400">
            Movimiento
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Actualizar existencia
          </h2>

          {!material.is_active ? (
            <p className="mt-4 text-sm text-amber-300">
              El material está inactivo. Actívalo
              antes de registrar movimientos.
            </p>
          ) : (
            <form
              action={registerInventoryMovement}
              className="mt-5 grid gap-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <input
                type="hidden"
                name="material_id"
                value={material.id}
              />

              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">
                  Operación
                </span>

                <select
                  name="movement_type"
                  required
                  defaultValue="entry"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-teal-500"
                >
                  <option value="entry">
                    Entrada
                  </option>
                  <option value="exit">
                    Salida
                  </option>
                  <option value="set">
                    Ajustar total
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">
                  Cantidad
                </span>

                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-teal-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">
                  Motivo
                </span>

                <input
                  name="reason"
                  type="text"
                  required
                  minLength={2}
                  maxLength={300}
                  placeholder="Compra, consumo de pedido..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-teal-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">
                  Referencia
                </span>

                <input
                  name="reference"
                  type="text"
                  maxLength={160}
                  placeholder="PED-000123, factura..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-teal-500"
                />
              </label>

              <button
                type="submit"
                className="self-end rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-teal-300"
              >
                Registrar
              </button>
            </form>
          )}

          <p className="mt-3 text-xs leading-5 text-zinc-600">
            “Ajustar total” establece la existencia
            exacta contada físicamente. Las entradas
            y salidas suman o restan.
          </p>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                Kardex
              </p>

              <h2 className="mt-2 text-xl font-bold text-zinc-100">
                Historial de movimientos
              </h2>
            </div>

            <span className="text-sm text-zinc-600">
              {movements.length}
            </span>
          </div>

          {movements.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-600">
              Todavía no hay movimientos.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {movements.map((movement) => (
                <article
                  key={movement.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            MOVEMENT_STYLES[
                              movement.movement_type
                            ] ||
                              MOVEMENT_STYLES.set,
                          ].join(" ")}
                        >
                          {MOVEMENT_LABELS[
                            movement.movement_type
                          ] || "Movimiento"}
                        </span>

                        <span className="text-xs text-zinc-600">
                          {formatDate(
                            movement.created_at
                          )}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-semibold text-zinc-200">
                        {movement.reason}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {profileNames[
                          movement.created_by
                        ] || "Sistema"}
                        {movement.reference
                          ? " · " +
                            movement.reference
                          : ""}
                      </p>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p
                        className={[
                          "text-lg font-bold",
                          movement.movement_type ===
                          "entry"
                            ? "text-emerald-300"
                            : movement.movement_type ===
                                "exit"
                              ? "text-red-300"
                              : "text-amber-300",
                        ].join(" ")}
                      >
                        {movement.movement_type ===
                        "entry"
                          ? "+"
                          : movement.movement_type ===
                              "exit"
                            ? "-"
                            : "±"}
                        {formatQuantity(
                          movement.quantity
                        )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {formatQuantity(
                          movement.previous_stock
                        )}{" "}
                        →{" "}
                        {formatQuantity(
                          movement.new_stock
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          {canManageInventory ? (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                Ficha
              </p>

              <h2 className="mt-2 text-xl font-bold text-zinc-100">
                Editar material
              </h2>

              <InventoryMaterialForm
                action={updateInventoryMaterial}
                material={material}
                submitLabel="Guardar cambios"
              />
            </section>
          ) : (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
              <h2 className="font-bold text-zinc-100">
                Información
              </h2>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-600">
                    Proveedor
                  </dt>
                  <dd className="mt-1 text-zinc-300">
                    {material.supplier_name ||
                      "Sin registrar"}
                  </dd>
                </div>

                <div>
                  <dt className="text-zinc-600">
                    Ubicación
                  </dt>
                  <dd className="mt-1 text-zinc-300">
                    {material.location ||
                      "Sin registrar"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {canManageInventory ? (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
              <h2 className="font-bold text-zinc-100">
                Estado del material
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Los materiales inactivos conservan
                su historial, pero no permiten
                movimientos.
              </p>

              <form
                action={toggleInventoryMaterial}
                className="mt-4"
              >
                <input
                  type="hidden"
                  name="material_id"
                  value={material.id}
                />

                <input
                  type="hidden"
                  name="current_status"
                  value={String(
                    material.is_active
                  )}
                />

                <button
                  type="submit"
                  className={[
                    "w-full rounded-xl border px-5 py-3 text-sm font-semibold transition",
                    material.is_active
                      ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                      : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
                  ].join(" ")}
                >
                  {material.is_active
                    ? "Desactivar material"
                    : "Activar material"}
                </button>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
