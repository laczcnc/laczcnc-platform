"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import {
  requirePermission,
  requireRole,
} from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const PAYMENT_METHODS = [
  "cash",
  "yape",
  "plin",
  "bank_transfer",
  "card",
  "other",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizePaymentDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(
      "La fecha del pago no tiene un formato válido."
    );
  }

  return parsedDate.toISOString();
}

export async function createOrderPayment(formData) {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const paymentMethod = normalizeText(
    formData.get("payment_method")
  );

  const amount = Number(
    normalizeText(formData.get("amount"))
  );

  const paidAt = normalizePaymentDate(
    formData.get("paid_at")
  );

  const reference = normalizeOptionalText(
    formData.get("reference")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  if (!orderId) {
    throw new Error(
      "No se recibió el identificador del pedido."
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "El monto debe ser mayor que cero."
    );
  }

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error(
      "El método de pago no es válido."
    );
  }

  const supabase = await createClient();

  const { data: order, error: orderError } =
    await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        advance_payment,
        balance_due,
        status
      `)
      .eq("id", orderId)
      .maybeSingle();

  if (orderError) {
    console.error(
      "Error consultando pedido antes del pago:",
      {
        orderId,
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      }
    );

    throw new Error(
      "No fue posible consultar el pedido."
    );
  }

  if (!order) {
    throw new Error(
      "El pedido solicitado no existe."
    );
  }

  const orderTotal = Number(
    order.total_amount || 0
  );

  const currentBalance = Number(
    order.balance_due ?? orderTotal
  );

  if (orderTotal <= 0) {
    throw new Error(
      "Primero define el total del pedido antes de registrar un pago."
    );
  }

  if (currentBalance <= 0) {
    throw new Error(
      "Este pedido ya no tiene saldo pendiente."
    );
  }

  if (amount > currentBalance) {
    throw new Error(
      `El pago no puede superar el saldo pendiente de S/ ${currentBalance.toFixed(
        2
      )}.`
    );
  }

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "No se pudo verificar la sesión administrativa."
    );
  }

  const { error: insertError } =
    await supabase
      .from("order_payments")
      .insert({
        order_id: orderId,
        amount,
        payment_method: paymentMethod,
        paid_at: paidAt,
        reference,
        notes,
        created_by: user.id,
      });

  if (insertError) {
    console.error("Error registrando pago:", {
      orderId,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });

    throw new Error(
      "Supabase no pudo registrar el pago."
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
}

export async function deleteOrderPayment(formData) {
  await requireRole(["admin", "manager"]);

  const paymentId = normalizeText(
    formData.get("payment_id")
  );

  const orderId = normalizeText(
    formData.get("order_id")
  );

  if (!paymentId || !orderId) {
    throw new Error(
      "No se recibió la información del pago."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("order_payments")
    .delete()
    .eq("id", paymentId)
    .eq("order_id", orderId);

  if (error) {
    console.error("Error eliminando pago:", {
      paymentId,
      orderId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error(
      "Supabase no pudo eliminar el pago."
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
}
