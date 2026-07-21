"use server";

import { revalidatePath } from "next/cache";

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

const ALLOWED_TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: [
    "draft",
    "production",
    "cancelled",
  ],
  production: [
    "confirmed",
    "ready",
    "cancelled",
  ],
  ready: [
    "production",
    "delivered",
    "cancelled",
  ],
  delivered: [
    "ready",
    "completed",
  ],
  completed: ["delivered"],
  cancelled: ["draft"],
};

const ROLE_TRANSITIONS = {
  sales: {
    draft: ["confirmed", "cancelled"],
    confirmed: ["draft", "cancelled"],
    delivered: ["completed"],
    completed: ["delivered"],
    cancelled: ["draft"],
  },
  production: {
    confirmed: ["production"],
    production: ["confirmed", "ready"],
    ready: ["production"],
  },
  delivery: {
    ready: ["delivered"],
    delivered: ["ready"],
  },
};

function normalizeText(value) {
  return String(value || "").trim();
}

export async function changeOrderStatus(
  formData
) {
  const { profile } = await requirePermission(
    PERMISSIONS.ORDER_WORKFLOW_MANAGE
  );

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const newStatus = normalizeText(
    formData.get("new_status")
  );

  if (!orderId) {
    throw new Error(
      "No se recibió el identificador del pedido."
    );
  }

  if (!ORDER_STATUSES.includes(newStatus)) {
    throw new Error(
      "El nuevo estado del pedido no es válido."
    );
  }

  const supabase = await createClient();

  const {
    data: currentOrder,
    error: readError,
  } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      balance_due,
      confirmed_at,
      completed_at,
      cancelled_at
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (readError) {
    console.error(
      "Error consultando pedido:",
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

  if (currentOrder.status === newStatus) {
    return;
  }

  const allowedStatuses =
    ALLOWED_TRANSITIONS[currentOrder.status] ||
    [];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(
      `No se permite cambiar directamente de ${currentOrder.status} a ${newStatus}.`
    );
  }

  if (
    profile.role !== "admin" &&
    profile.role !== "manager"
  ) {
    const roleTransitions =
      ROLE_TRANSITIONS[profile.role] || {};

    const permittedForRole =
      roleTransitions[currentOrder.status] || [];

    if (!permittedForRole.includes(newStatus)) {
      throw new Error(
        "Tu rol no permite realizar este cambio de estado."
      );
    }
  }

  if (
    newStatus === "confirmed" &&
    Number(currentOrder.total_amount || 0) <= 0
  ) {
    throw new Error(
      "Define el total del pedido antes de confirmarlo."
    );
  }

  if (
    newStatus === "completed" &&
    Number(currentOrder.balance_due || 0) > 0
  ) {
    throw new Error(
      "No se puede completar un pedido con saldo pendiente."
    );
  }

  const { error: updateError } =
    await supabase.rpc(
      "change_order_status_staff",
      {
        target_order_id: orderId,
        requested_status: newStatus,
      }
    );

  if (updateError) {
    console.error(
      "Error cambiando estado del pedido:",
      {
        orderId,
        newStatus,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      }
    );

    throw new Error(
      "No fue posible cambiar el estado del pedido."
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
