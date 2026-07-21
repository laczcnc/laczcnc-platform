"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

function normalizeText(value) {
  return String(value || "").trim();
}

export async function convertQuoteToCustomer(
  formData
) {
  await requirePermission(PERMISSIONS.QUOTES_MANAGE);

  const quoteRequestId = normalizeText(
    formData.get("request_id")
  );

  if (!quoteRequestId) {
    throw new Error(
      "No se recibió el identificador de la cotización."
    );
  }

  const supabase = await createClient();

  const { data: customerId, error } =
    await supabase.rpc(
      "convert_quote_to_customer",
      {
        request_quote_id: quoteRequestId,
      }
    );

  if (error) {
    console.error(
      "Error convirtiendo cotización en cliente:",
      {
        quoteRequestId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible crear o vincular el cliente."
    );
  }

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/clientes");

  return customerId;
}

export async function convertQuoteToOrder(
  formData
) {
  await requirePermission(PERMISSIONS.QUOTES_MANAGE);

  const quoteRequestId = normalizeText(
    formData.get("request_id")
  );

  if (!quoteRequestId) {
    throw new Error(
      "No se recibió el identificador de la cotización."
    );
  }

  const supabase = await createClient();

  const { data: orderId, error } =
    await supabase.rpc(
      "convert_quote_to_order",
      {
        request_quote_id: quoteRequestId,
      }
    );

  if (error) {
    console.error(
      "Error convirtiendo cotización en pedido:",
      {
        quoteRequestId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible convertir la cotización en pedido."
    );
  }

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");

  return orderId;
}
