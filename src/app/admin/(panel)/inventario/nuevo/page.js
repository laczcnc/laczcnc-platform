import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import InventoryMaterialForm from "@/modules/inventory/components/InventoryMaterialForm";

import { createInventoryMaterial } from "../actions";

export const metadata = {
  title: "Nuevo material",
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES = {
  invalid_name:
    "El nombre debe tener entre 2 y 180 caracteres.",
  invalid_sku:
    "El SKU solo puede contener letras, números, puntos, guiones y guion bajo.",
  invalid_unit:
    "Selecciona una unidad de medida válida.",
  invalid_initial_stock:
    "La existencia inicial debe ser igual o mayor que cero.",
  invalid_minimum_stock:
    "El stock mínimo debe ser igual o mayor que cero.",
  invalid_unit_cost:
    "El costo unitario debe ser igual o mayor que cero.",
  sku_exists:
    "Ya existe otro material con el mismo SKU.",
  database_error:
    "Supabase no pudo registrar el material.",
};

export default async function NewInventoryMaterialPage({
  searchParams,
}) {
  await requirePermission(
    PERMISSIONS.INVENTORY_MANAGE
  );

  const queryParams = await searchParams;
  const errorMessage =
    ERROR_MESSAGES[queryParams?.error];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
            Almacén
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Nuevo material
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Registra el material, su proveedor,
            ubicación y nivel mínimo de reposición.
          </p>
        </div>

        <Link
          href="/admin/inventario"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-teal-500 hover:text-teal-300"
        >
          Volver al inventario
        </Link>
      </section>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4"
        >
          <p className="font-semibold text-red-300">
            No se pudo crear el material
          </p>

          <p className="mt-1 text-sm text-red-300/80">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 sm:p-6">
        <InventoryMaterialForm
          action={createInventoryMaterial}
          includeInitialStock
          submitLabel="Crear material"
        />
      </section>
    </div>
  );
}
