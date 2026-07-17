"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

const DELIVERY_TYPES = [
  "store_pickup",
  "local_delivery",
  "province_shipping",
];

const DELIVERY_STATUSES = [
  "pending",
  "scheduled",
  "ready_for_dispatch",
  "dispatched",
  "delivered",
  "failed",
  "cancelled",
];

const ALLOWED_TRANSITIONS = {
  pending: [
    "scheduled",
    "ready_for_dispatch",
    "cancelled",
  ],
  scheduled: [
    "pending",
    "ready_for_dispatch",
    "cancelled",
  ],
  ready_for_dispatch: [
    "scheduled",
    "dispatched",
    "delivered",
    "cancelled",
  ],
  dispatched: [
    "ready_for_dispatch",
    "delivered",
    "failed",
  ],
  delivered: ["dispatched"],
  failed: [
    "scheduled",
    "ready_for_dispatch",
    "cancelled",
  ],
  cancelled: ["pending"],
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeMoney(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return 0;
  }

  const amount = Number(normalizedValue);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return Number.NaN;
  }

  return amount;
}

function revalidateDeliveries(orderId = null) {
  revalidatePath("/admin/entregas");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/produccion");
  revalidatePath("/admin/dashboard");

  if (orderId) {
    revalidatePath(
      `/admin/pedidos/${orderId}/editar`
    );

    revalidatePath(
      `/admin/pedidos/${orderId}/comprobante`
    );
  }
}

export async function createDelivery(
  formData
) {
  await requireAdmin();

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const deliveryType = normalizeText(
    formData.get("delivery_type")
  );

  const recipientName =
    normalizeOptionalText(
      formData.get("recipient_name")
    );

  const recipientPhone =
    normalizeOptionalText(
      formData.get("recipient_phone")
    );

  const deliveryCity =
    normalizeOptionalText(
      formData.get("delivery_city")
    );

  const deliveryAddress =
    normalizeOptionalText(
      formData.get("delivery_address")
    );

  const deliveryReference =
    normalizeOptionalText(
      formData.get("delivery_reference")
    );

  const scheduledDate =
    normalizeOptionalText(
      formData.get("scheduled_date")
    );

  const deliveryCost = normalizeMoney(
    formData.get("delivery_cost")
  );

  const internalNotes =
    normalizeOptionalText(
      formData.get("internal_notes")
    );

  if (!orderId) {
    throw new Error(
      "Selecciona un pedido."
    );
  }

  if (
    !DELIVERY_TYPES.includes(deliveryType)
  ) {
    throw new Error(
      "La modalidad de entrega no es válida."
    );
  }

  if (Number.isNaN(deliveryCost)) {
    throw new Error(
      "El costo de entrega no es válido."
    );
  }

  if (
    deliveryType !== "store_pickup" &&
    !deliveryCity
  ) {
    throw new Error(
      "Ingresa la ciudad de entrega."
    );
  }

  if (
    deliveryType === "local_delivery" &&
    !deliveryAddress
  ) {
    throw new Error(
      "Ingresa la dirección de entrega."
    );
  }

  const supabase = await createClient();

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      delivery_city,
      delivery_address,
      customers (
        id,
        full_name,
        phone
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error(
      "Error consultando pedido:",
      orderError
    );

    throw new Error(
      "No fue posible consultar el pedido."
    );
  }

  if (!order) {
    throw new Error(
      "El pedido seleccionado no existe."
    );
  }

  if (
    ![
      "ready",
      "delivered",
    ].includes(order.status)
  ) {
    throw new Error(
      "El pedido debe estar listo antes de programar la entrega."
    );
  }

  const {
    data: existingDelivery,
    error: existingError,
  } = await supabase
    .from("deliveries")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      "No fue posible verificar la entrega."
    );
  }

  if (existingDelivery) {
    throw new Error(
      "Este pedido ya tiene una entrega registrada."
    );
  }

  const initialStatus = scheduledDate
    ? "scheduled"
    : "pending";

  const { error: insertError } =
    await supabase
      .from("deliveries")
      .insert({
        order_id: orderId,
        delivery_type: deliveryType,
        status: initialStatus,
        recipient_name:
          recipientName ||
          order.customers?.full_name ||
          null,
        recipient_phone:
          recipientPhone ||
          order.customers?.phone ||
          null,
        delivery_city:
          deliveryCity ||
          order.delivery_city ||
          null,
        delivery_address:
          deliveryAddress ||
          order.delivery_address ||
          null,
        delivery_reference:
          deliveryReference,
        scheduled_date: scheduledDate,
        delivery_cost: deliveryCost,
        internal_notes: internalNotes,
      });

  if (insertError) {
    console.error(
      "Error creando entrega:",
      {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      }
    );

    throw new Error(
      "No fue posible crear la entrega."
    );
  }

  revalidateDeliveries(orderId);
}

export async function updateDelivery(
  formData
) {
  await requireAdmin();

  const deliveryId = normalizeText(
    formData.get("delivery_id")
  );

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const deliveryType = normalizeText(
    formData.get("delivery_type")
  );

  const recipientName =
    normalizeOptionalText(
      formData.get("recipient_name")
    );

  const recipientPhone =
    normalizeOptionalText(
      formData.get("recipient_phone")
    );

  const deliveryCity =
    normalizeOptionalText(
      formData.get("delivery_city")
    );

  const deliveryAddress =
    normalizeOptionalText(
      formData.get("delivery_address")
    );

  const deliveryReference =
    normalizeOptionalText(
      formData.get("delivery_reference")
    );

  const carrierName =
    normalizeOptionalText(
      formData.get("carrier_name")
    );

  const trackingNumber =
    normalizeOptionalText(
      formData.get("tracking_number")
    );

  const trackingUrl =
    normalizeOptionalText(
      formData.get("tracking_url")
    );

  const scheduledDate =
    normalizeOptionalText(
      formData.get("scheduled_date")
    );

  const deliveryCost = normalizeMoney(
    formData.get("delivery_cost")
  );

  const internalNotes =
    normalizeOptionalText(
      formData.get("internal_notes")
    );

  const deliveryNotes =
    normalizeOptionalText(
      formData.get("delivery_notes")
    );

  const proofUrl = normalizeOptionalText(
    formData.get("proof_url")
  );

  if (!deliveryId || !orderId) {
    throw new Error(
      "No se recibió la entrega."
    );
  }

  if (
    !DELIVERY_TYPES.includes(deliveryType)
  ) {
    throw new Error(
      "La modalidad de entrega no es válida."
    );
  }

  if (Number.isNaN(deliveryCost)) {
    throw new Error(
      "El costo de entrega no es válido."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("deliveries")
    .update({
      delivery_type: deliveryType,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      delivery_city: deliveryCity,
      delivery_address: deliveryAddress,
      delivery_reference:
        deliveryReference,
      carrier_name: carrierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      scheduled_date: scheduledDate,
      delivery_cost: deliveryCost,
      internal_notes: internalNotes,
      delivery_notes: deliveryNotes,
      proof_url: proofUrl,
    })
    .eq("id", deliveryId);

  if (error) {
    console.error(
      "Error actualizando entrega:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible actualizar la entrega."
    );
  }

  revalidateDeliveries(orderId);
}

export async function changeDeliveryStatus(
  formData
) {
  await requireAdmin();

  const deliveryId = normalizeText(
    formData.get("delivery_id")
  );

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const currentStatus = normalizeText(
    formData.get("current_status")
  );

  const newStatus = normalizeText(
    formData.get("new_status")
  );

  if (!deliveryId || !orderId) {
    throw new Error(
      "No se recibió la entrega."
    );
  }

  if (
    !DELIVERY_STATUSES.includes(
      currentStatus
    ) ||
    !DELIVERY_STATUSES.includes(newStatus)
  ) {
    throw new Error(
      "El estado de entrega no es válido."
    );
  }

  const allowedStatuses =
    ALLOWED_TRANSITIONS[currentStatus] ||
    [];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(
      `No se permite cambiar directamente de ${currentStatus} a ${newStatus}.`
    );
  }

  const timestamps = {};

  if (newStatus === "dispatched") {
    timestamps.dispatched_at =
      new Date().toISOString();
  }

  if (newStatus === "delivered") {
    timestamps.delivered_at =
      new Date().toISOString();
  }

  const supabase = await createClient();

  const { error: deliveryError } =
    await supabase
      .from("deliveries")
      .update({
        status: newStatus,
        ...timestamps,
      })
      .eq("id", deliveryId);

  if (deliveryError) {
    console.error(
      "Error cambiando estado de entrega:",
      deliveryError
    );

    throw new Error(
      "No fue posible cambiar el estado de la entrega."
    );
  }

  let orderStatus = "ready";

  if (newStatus === "delivered") {
    orderStatus = "delivered";
  }

  const { error: orderError } =
    await supabase
      .from("orders")
      .update({
        status: orderStatus,
      })
      .eq("id", orderId);

  if (orderError) {
    console.error(
      "La entrega cambió, pero el pedido no se sincronizó:",
      orderError
    );
  }

  revalidateDeliveries(orderId);
}