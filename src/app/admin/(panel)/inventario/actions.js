"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";

function getText(formData, fieldName) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function getOptionalText(formData, fieldName) {
  const value = getText(formData, fieldName);

  return value || null;
}

function getNumber(
  formData,
  fieldName,
  fallback = null
) {
  const rawValue = getText(
    formData,
    fieldName
  ).replace(",", ".");

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  return Number.isFinite(value)
    ? value
    : Number.NaN;
}

function normalizeSku(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/s+/g, "-");
}

function redirectWithError(path, code) {
  redirect(
    `${path}?error=${encodeURIComponent(
      code
    )}`
  );
}

function validateMaterial(
  material,
  errorPath
) {
  if (
    material.name.length < 2 ||
    material.name.length > 180
  ) {
    redirectWithError(
      errorPath,
      "invalid_name"
    );
  }

  if (
    !material.sku ||
    material.sku.length > 60 ||
    !/^[A-Z0-9._-]+$/.test(material.sku)
  ) {
    redirectWithError(
      errorPath,
      "invalid_sku"
    );
  }

  if (
    !material.unit ||
    material.unit.length > 40
  ) {
    redirectWithError(
      errorPath,
      "invalid_unit"
    );
  }

  if (
    !Number.isFinite(
      material.minimumStock
    ) ||
    material.minimumStock < 0
  ) {
    redirectWithError(
      errorPath,
      "invalid_minimum_stock"
    );
  }

  if (
    material.unitCost !== null &&
    (!Number.isFinite(material.unitCost) ||
      material.unitCost < 0)
  ) {
    redirectWithError(
      errorPath,
      "invalid_unit_cost"
    );
  }
}

function buildMaterialPayload(formData) {
  return {
    sku: normalizeSku(
      getText(formData, "sku")
    ),
    name: getText(formData, "name"),
    category: getOptionalText(
      formData,
      "category"
    ),
    unit: getText(formData, "unit"),
    minimumStock: getNumber(
      formData,
      "minimum_stock",
      0
    ),
    unitCost: getNumber(
      formData,
      "unit_cost",
      null
    ),
    supplierName: getOptionalText(
      formData,
      "supplier_name"
    ),
    supplierPhone: getOptionalText(
      formData,
      "supplier_phone"
    ),
    location: getOptionalText(
      formData,
      "location"
    ),
    notes: getOptionalText(
      formData,
      "notes"
    ),
  };
}

function revalidateInventory(materialId) {
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/dashboard");

  if (materialId) {
    revalidatePath(
      `/admin/inventario/${materialId}`
    );
  }
}

function handleMaterialError(
  error,
  errorPath
) {
  console.error(
    "Error guardando material de inventario:",
    {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    }
  );

  if (error.code === "23505") {
    redirectWithError(
      errorPath,
      "sku_exists"
    );
  }

  redirectWithError(
    errorPath,
    "database_error"
  );
}

export async function createInventoryMaterial(
  formData
) {
  const {
    user,
    supabase,
  } = await requirePermission(
    PERMISSIONS.INVENTORY_MANAGE
  );

  const errorPath =
    "/admin/inventario/nuevo";

  const material =
    buildMaterialPayload(formData);

  const initialStock = getNumber(
    formData,
    "initial_stock",
    0
  );

  validateMaterial(material, errorPath);

  if (
    !Number.isFinite(initialStock) ||
    initialStock < 0
  ) {
    redirectWithError(
      errorPath,
      "invalid_initial_stock"
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("inventory_materials")
    .insert({
      sku: material.sku,
      name: material.name,
      category: material.category,
      unit: material.unit,
      current_stock: initialStock,
      minimum_stock:
        material.minimumStock,
      unit_cost: material.unitCost,
      supplier_name:
        material.supplierName,
      supplier_phone:
        material.supplierPhone,
      location: material.location,
      notes: material.notes,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    handleMaterialError(
      error || {
        message:
          "Supabase no devolvió el material creado.",
      },
      errorPath
    );
  }

  revalidateInventory(data.id);

  redirect(
    `/admin/inventario/${data.id}?success=created`
  );
}

export async function updateInventoryMaterial(
  formData
) {
  const { supabase } =
    await requirePermission(
      PERMISSIONS.INVENTORY_MANAGE
    );

  const materialId = getText(
    formData,
    "material_id"
  );

  if (!materialId) {
    redirectWithError(
      "/admin/inventario",
      "invalid_material"
    );
  }

  const errorPath =
    `/admin/inventario/${materialId}`;

  const material =
    buildMaterialPayload(formData);

  validateMaterial(material, errorPath);

  const { error } = await supabase
    .from("inventory_materials")
    .update({
      sku: material.sku,
      name: material.name,
      category: material.category,
      unit: material.unit,
      minimum_stock:
        material.minimumStock,
      unit_cost: material.unitCost,
      supplier_name:
        material.supplierName,
      supplier_phone:
        material.supplierPhone,
      location: material.location,
      notes: material.notes,
    })
    .eq("id", materialId);

  if (error) {
    handleMaterialError(
      error,
      errorPath
    );
  }

  revalidateInventory(materialId);

  redirect(
    `${errorPath}?success=updated`
  );
}

export async function toggleInventoryMaterial(
  formData
) {
  const { supabase } =
    await requirePermission(
      PERMISSIONS.INVENTORY_MANAGE
    );

  const materialId = getText(
    formData,
    "material_id"
  );

  const currentStatus =
    getText(
      formData,
      "current_status"
    ) === "true";

  if (!materialId) {
    redirectWithError(
      "/admin/inventario",
      "invalid_material"
    );
  }

  const { error } = await supabase
    .from("inventory_materials")
    .update({
      is_active: !currentStatus,
    })
    .eq("id", materialId);

  if (error) {
    console.error(
      "Error cambiando estado del material:",
      error
    );

    redirectWithError(
      `/admin/inventario/${materialId}`,
      "status_failed"
    );
  }

  revalidateInventory(materialId);

  redirect(
    `/admin/inventario/${materialId}?success=status_updated`
  );
}

export async function registerInventoryMovement(
  formData
) {
  const { supabase } =
    await requirePermission(
      PERMISSIONS.INVENTORY_MANAGE
    );

  const materialId = getText(
    formData,
    "material_id"
  );

  const movementType = getText(
    formData,
    "movement_type"
  );

  const quantity = getNumber(
    formData,
    "quantity"
  );

  const reason = getText(
    formData,
    "reason"
  );

  const reference = getOptionalText(
    formData,
    "reference"
  );

  const errorPath =
    `/admin/inventario/${materialId}`;

  if (!materialId) {
    redirectWithError(
      "/admin/inventario",
      "invalid_material"
    );
  }

  if (
    !["entry", "exit", "set"].includes(
      movementType
    )
  ) {
    redirectWithError(
      errorPath,
      "invalid_movement_type"
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    (movementType !== "set" &&
      quantity === 0)
  ) {
    redirectWithError(
      errorPath,
      "invalid_quantity"
    );
  }

  if (
    reason.length < 2 ||
    reason.length > 300
  ) {
    redirectWithError(
      errorPath,
      "invalid_reason"
    );
  }

  const { error } = await supabase.rpc(
    "register_inventory_movement",
    {
      target_material_id: materialId,
      requested_type: movementType,
      requested_quantity: quantity,
      movement_reason: reason,
      movement_reference: reference,
    }
  );

  if (error) {
    console.error(
      "Error registrando movimiento de inventario:",
      {
        materialId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    const message = String(
      error.message || ""
    );

    if (
      message.includes(
        "insufficient_inventory_stock"
      )
    ) {
      redirectWithError(
        errorPath,
        "insufficient_stock"
      );
    }

    if (
      message.includes(
        "inventory_stock_unchanged"
      )
    ) {
      redirectWithError(
        errorPath,
        "stock_unchanged"
      );
    }

    if (
      message.includes(
        "inventory_material_inactive"
      )
    ) {
      redirectWithError(
        errorPath,
        "inactive_material"
      );
    }

    redirectWithError(
      errorPath,
      "movement_failed"
    );
  }

  revalidateInventory(materialId);

  redirect(
    `${errorPath}?success=movement_created`
  );
}
