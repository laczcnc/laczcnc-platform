"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "production",
  "ready",
  "delivered",
  "completed",
  "cancelled",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeNumber(value, fallback = 0) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return fallback;
  }

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue)
    ? numberValue
    : Number.NaN;
}

function normalizeOptionalInteger(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const numberValue = Number(normalizedValue);

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return Number.NaN;
  }

  return numberValue;
}

export async function updateOrder(formData) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const status = normalizeText(
    formData.get("status")
  );

  const quantity = normalizeOptionalInteger(
    formData.get("quantity")
  );

  const unitPrice = normalizeNumber(
    formData.get("unit_price"),
    0
  );

  const discountAmount = normalizeNumber(
    formData.get("discount_amount"),
    0
  );

  const deliveryCity = normalizeOptionalText(
    formData.get("delivery_city")
  );

  const deliveryAddress = normalizeOptionalText(
    formData.get("delivery_address")
  );

  const requestedDeliveryDate =
    normalizeOptionalText(
      formData.get("requested_delivery_date")
    );

  const customerNotes = normalizeOptionalText(
    formData.get("customer_notes")
  );

  const internalNotes = normalizeOptionalText(
    formData.get("internal_notes")
  );

  if (!orderId) {
    throw new Error(
      "No se recibió el identificador del pedido."
    );
  }

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(
      "El estado del pedido no es válido."
    );
  }

  if (Number.isNaN(quantity)) {
    throw new Error(
      "La cantidad debe ser un número entero mayor que cero."
    );
  }

  if (
    Number.isNaN(unitPrice) ||
    unitPrice < 0
  ) {
    throw new Error(
      "El precio unitario no es válido."
    );
  }

  if (
    Number.isNaN(discountAmount) ||
    discountAmount < 0
  ) {
    throw new Error(
      "El descuento no es válido."
    );
  }

  const subtotal =
    quantity === null
      ? 0
      : quantity * unitPrice;

  const totalAmount = Math.max(
    subtotal - discountAmount,
    0
  );

  if (discountAmount > subtotal) {
    throw new Error(
      "El descuento no puede superar el subtotal."
    );
  }

  const supabase = await createClient();

  const { data: currentOrder, error: readError } =
    await supabase
      .from("orders")
      .select(`
        id,
        advance_payment,
        confirmed_at,
        completed_at,
        cancelled_at
      `)
      .eq("id", orderId)
      .maybeSingle();

  if (readError) {
    console.error(
      "Error consultando pedido antes de actualizar:",
      {
        orderId,
        code: readError.code,
        message: readError.message,
        details: readError.details,
        hint: readError.hint,
      }
    );

    throw new Error(
      "No fue posible consultar el pedido."
    );
  }

  if (!currentOrder) {
    throw new Error(
      "El pedido solicitado no existe."
    );
  }

  const paidAmount = Number(
    currentOrder.advance_payment || 0
  );

  if (totalAmount < paidAmount) {
    throw new Error(
      "El nuevo total no puede ser menor que los pagos ya registrados."
    );
  }

  const balanceDue = Math.max(
    totalAmount - paidAmount,
    0
  );

  const timestampPayload = {};

  if (
    status === "confirmed" &&
    !currentOrder.confirmed_at
  ) {
    timestampPayload.confirmed_at =
      new Date().toISOString();
  }

  if (
    status === "completed" &&
    !currentOrder.completed_at
  ) {
    timestampPayload.completed_at =
      new Date().toISOString();
  }

  if (
    status === "cancelled" &&
    !currentOrder.cancelled_at
  ) {
    timestampPayload.cancelled_at =
      new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      balance_due: balanceDue,
      delivery_city: deliveryCity,
      delivery_address: deliveryAddress,
      requested_delivery_date:
        requestedDeliveryDate,
      customer_notes: customerNotes,
      internal_notes: internalNotes,
      ...timestampPayload,
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error actualizando pedido:", {
      orderId,
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });

    throw new Error(
      "Supabase no pudo actualizar el pedido."
    );
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(
    `/admin/pedidos/${orderId}/editar`
  );
  revalidatePath(
    `/admin/pedidos/${orderId}/comprobante`
  );
  revalidatePath("/admin/dashboard");

  redirect(
    `/admin/pedidos/${orderId}/editar?guardado=1`
  );
}
