"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const CUSTOMER_TYPES = [
  "person",
  "company",
  "institution",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateCustomer(formData) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);

  const customerId = normalizeText(
    formData.get("customer_id")
  );

  const customerType = normalizeText(
    formData.get("customer_type")
  );

  const fullName = normalizeText(
    formData.get("full_name")
  );

  const phone = normalizeText(
    formData.get("phone")
  );

  const email = normalizeOptionalText(
    formData.get("email")
  );

  const companyName = normalizeOptionalText(
    formData.get("company_name")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const address = normalizeOptionalText(
    formData.get("address")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  if (!customerId) {
    throw new Error(
      "No se recibió el identificador del cliente."
    );
  }

  if (!CUSTOMER_TYPES.includes(customerType)) {
    throw new Error(
      "El tipo de cliente no es válido."
    );
  }

  if (
    fullName.length < 2 ||
    fullName.length > 120
  ) {
    throw new Error(
      "El nombre debe tener entre 2 y 120 caracteres."
    );
  }

  if (
    phone.length < 6 ||
    phone.length > 30
  ) {
    throw new Error(
      "El teléfono no tiene una longitud válida."
    );
  }

  if (!isValidEmail(email)) {
    throw new Error(
      "El correo electrónico no tiene un formato válido."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      customer_type: customerType,
      full_name: fullName,
      phone,
      email,
      company_name: companyName,
      city,
      address,
      notes,
    })
    .eq("id", customerId);

  if (error) {
    console.error("Error actualizando cliente:", {
      customerId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error(
      "Supabase no pudo actualizar el cliente."
    );
  }

  revalidatePath("/admin/clientes");
  revalidatePath(
    `/admin/clientes/${customerId}/editar`
  );
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/cotizaciones");

  redirect(
    `/admin/clientes/${customerId}/editar?guardado=1`
  );
}
