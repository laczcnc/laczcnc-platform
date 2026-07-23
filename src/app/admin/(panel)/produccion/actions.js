"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const JOB_STATUSES = [
  "pending",
  "in_progress",
  "quality_control",
  "ready",
  "paused",
  "cancelled",
];

const PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
];

const STAGE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeProgress(value) {
  const progress = Number.parseInt(
    normalizeText(value),
    10
  );

  if (
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
  ) {
    return Number.NaN;
  }

  return progress;
}

function revalidateProduction(orderId = null) {
  revalidatePath("/admin/produccion");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/dashboard");

  if (orderId) {
    revalidatePath(
      `/admin/pedidos/${orderId}/editar`
    );
  }
}

export async function createProductionJob(
  formData
) {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const workshopId = normalizeOptionalText(
    formData.get("workshop_id")
  );

  const assignedTo = normalizeOptionalText(
    formData.get("assigned_to")
  );

  const priority = normalizeText(
    formData.get("priority")
  );

  const scheduledStartDate =
    normalizeOptionalText(
      formData.get("scheduled_start_date")
    );

  const dueDate = normalizeOptionalText(
    formData.get("due_date")
  );

  const productionNotes =
    normalizeOptionalText(
      formData.get("production_notes")
    );

  if (!orderId) {
    throw new Error(
      "Selecciona un pedido válido."
    );
  }

  if (!PRIORITIES.includes(priority)) {
    throw new Error(
      "La prioridad seleccionada no es válida."
    );
  }

  if (
    scheduledStartDate &&
    dueDate &&
    dueDate < scheduledStartDate
  ) {
    throw new Error(
      "La fecha límite no puede ser anterior al inicio."
    );
  }

  const supabase = await createClient();

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error(
      "Error consultando pedido para producción:",
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
      "confirmed",
      "production",
      "ready",
    ].includes(order.status)
  ) {
    throw new Error(
      "El pedido debe estar confirmado antes de enviarlo a producción."
    );
  }

  const {
    data: existingJob,
    error: existingJobError,
  } = await supabase
    .from("production_jobs")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingJobError) {
    console.error(
      "Error comprobando orden de producción:",
      existingJobError
    );

    throw new Error(
      "No fue posible comprobar el pedido."
    );
  }

  if (existingJob) {
    throw new Error(
      "Este pedido ya tiene una orden de producción."
    );
  }

  const { error: insertError } =
    await supabase
      .from("production_jobs")
      .insert({
        order_id: orderId,
        workshop_id: workshopId,
        assigned_to: assignedTo,
        status: "pending",
        priority,
        progress: 0,
        scheduled_start_date:
          scheduledStartDate,
        due_date: dueDate,
        production_notes: productionNotes,
      });

  if (insertError) {
    console.error(
      "Error creando orden de producción:",
      {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      }
    );

    throw new Error(
      "No fue posible crear la orden de producción."
    );
  }

  const { error: orderUpdateError } =
    await supabase.rpc(
      "sync_order_from_production",
      {
        target_order_id: orderId,
        requested_status: "production",
      }
    );

  if (orderUpdateError) {
    console.error(
      "La orden fue creada, pero no se actualizó el pedido:",
      orderUpdateError
    );
  }

  revalidateProduction(orderId);
}

export async function updateProductionJob(
  formData
) {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);

  const productionJobId = normalizeText(
    formData.get("production_job_id")
  );

  const orderId = normalizeText(
    formData.get("order_id")
  );

  const workshopId = normalizeOptionalText(
    formData.get("workshop_id")
  );

  const assignedTo = normalizeOptionalText(
    formData.get("assigned_to")
  );

  const status = normalizeText(
    formData.get("status")
  );

  const priority = normalizeText(
    formData.get("priority")
  );

  const progress = normalizeProgress(
    formData.get("progress")
  );

  const scheduledStartDate =
    normalizeOptionalText(
      formData.get("scheduled_start_date")
    );

  const dueDate = normalizeOptionalText(
    formData.get("due_date")
  );

  const productionNotes =
    normalizeOptionalText(
      formData.get("production_notes")
    );

  const qualityNotes = normalizeOptionalText(
    formData.get("quality_notes")
  );

  if (!productionJobId || !orderId) {
    throw new Error(
      "No se recibió la orden de producción."
    );
  }

  if (!JOB_STATUSES.includes(status)) {
    throw new Error(
      "El estado seleccionado no es válido."
    );
  }

  if (!PRIORITIES.includes(priority)) {
    throw new Error(
      "La prioridad seleccionada no es válida."
    );
  }

  if (Number.isNaN(progress)) {
    throw new Error(
      "El progreso debe estar entre 0 y 100."
    );
  }

  if (
    scheduledStartDate &&
    dueDate &&
    dueDate < scheduledStartDate
  ) {
    throw new Error(
      "La fecha límite no puede ser anterior al inicio."
    );
  }

  const timestamps = {};

  if (status === "in_progress") {
    timestamps.started_at =
      new Date().toISOString();
  }

  if (status === "ready") {
    timestamps.completed_at =
      new Date().toISOString();
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("production_jobs")
    .update({
      workshop_id: workshopId,
      assigned_to: assignedTo,
      status,
      priority,
      progress:
        status === "ready" ? 100 : progress,
      scheduled_start_date:
        scheduledStartDate,
      due_date: dueDate,
      production_notes: productionNotes,
      quality_notes: qualityNotes,
      ...timestamps,
    })
    .eq("id", productionJobId);

  if (error) {
    console.error(
      "Error actualizando producción:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible actualizar la producción."
    );
  }

  let orderStatus = "production";

  if (status === "ready") {
    orderStatus = "ready";
  }

  if (status === "cancelled") {
    orderStatus = "cancelled";
  }

  const { error: orderError } =
    await supabase.rpc(
      "sync_order_from_production",
      {
        target_order_id: orderId,
        requested_status: orderStatus,
      }
    );

  if (orderError) {
    console.error(
      "No se sincronizó el pedido:",
      orderError
    );
  }

  revalidateProduction(orderId);
}

export async function changeProductionStatus(formData) {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const productionJobId = normalizeText(formData.get("production_job_id"));
  const orderId = normalizeText(formData.get("order_id"));
  const status = normalizeText(formData.get("status"));

  if (!productionJobId || !orderId) {
    throw new Error("No se recibió la orden de producción.");
  }
  if (!JOB_STATUSES.includes(status)) {
    throw new Error("El estado seleccionado no es válido.");
  }

  const updates = { status };
  if (status === "in_progress") updates.started_at = new Date().toISOString();
  if (status === "ready") {
    updates.completed_at = new Date().toISOString();
    updates.progress = 100;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("production_jobs")
    .update(updates)
    .eq("id", productionJobId);

  if (error) {
    throw new Error("No fue posible cambiar el estado de producción.");
  }

  let orderStatus = "production";
  if (status === "ready") orderStatus = "ready";
  if (status === "cancelled") orderStatus = "cancelled";

  await supabase.rpc("sync_order_from_production", {
    target_order_id: orderId,
    requested_status: orderStatus,
  });
  revalidateProduction(orderId);
}

export async function changeProductionPriority(formData) {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const productionJobId = normalizeText(formData.get("production_job_id"));
  const priority = normalizeText(formData.get("priority"));

  if (!productionJobId || !PRIORITIES.includes(priority)) {
    throw new Error("La prioridad seleccionada no es válida.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("production_jobs")
    .update({ priority })
    .eq("id", productionJobId);

  if (error) {
    throw new Error("No fue posible cambiar la prioridad.");
  }
  revalidateProduction();
}

export async function updateProductionStage(
  formData
) {
  const { profile } = await requirePermission(
    PERMISSIONS.PRODUCTION_MANAGE
  );

  const stageId = normalizeText(
    formData.get("stage_id")
  );

  const productionJobId = normalizeText(
    formData.get("production_job_id")
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

  if (
    !stageId ||
    !productionJobId ||
    !orderId
  ) {
    throw new Error(
      "No se recibió la etapa de producción."
    );
  }

  if (!STAGE_STATUSES.includes(newStatus)) {
    throw new Error(
      "El estado de la etapa no es válido."
    );
  }

  const timestamps = {
    started_at: null,
    completed_at: null,
  };

  if (newStatus === "in_progress") {
    timestamps.started_at =
      new Date().toISOString();
  }

  if (
    newStatus === "completed" ||
    newStatus === "skipped"
  ) {
    timestamps.completed_at =
      new Date().toISOString();
  }

  const supabase = await createClient();

  const { error: stageError } =
    await supabase
      .from("production_stages")
      .update({
        status: newStatus,
        ...timestamps,
      })
      .eq("id", stageId);

  if (stageError) {
    console.error(
      "Error actualizando etapa:",
      stageError
    );

    throw new Error(
      "No fue posible actualizar la etapa."
    );
  }

  await supabase
    .from("production_events")
    .insert({
      production_job_id: productionJobId,
      event_type: "stage_changed",
      previous_value: currentStatus,
      new_value: newStatus,
      created_by: profile.id,
    });

  const {
    data: stages,
    error: stagesError,
  } = await supabase
    .from("production_stages")
    .select("id, status")
    .eq(
      "production_job_id",
      productionJobId
    );

  if (stagesError) {
    throw new Error(
      "La etapa cambió, pero no se pudo recalcular el progreso."
    );
  }

  const stageList = stages || [];

  const completedStages =
    stageList.filter((stage) =>
      ["completed", "skipped"].includes(
        stage.status
      )
    ).length;

  const progress =
    stageList.length > 0
      ? Math.round(
          (completedStages /
            stageList.length) *
            100
        )
      : 0;

  const allCompleted =
    stageList.length > 0 &&
    completedStages === stageList.length;

  const anyStarted = stageList.some(
    (stage) =>
      stage.status === "in_progress" ||
      stage.status === "completed"
  );

  const jobStatus = allCompleted
    ? "ready"
    : anyStarted
      ? "in_progress"
      : "pending";

  await supabase
    .from("production_jobs")
    .update({
      progress,
      status: jobStatus,
      started_at: anyStarted
        ? new Date().toISOString()
        : null,
      completed_at: allCompleted
        ? new Date().toISOString()
        : null,
    })
    .eq("id", productionJobId);

  await supabase
    .from("orders")
    .update({
      status: allCompleted
        ? "ready"
        : "production",
    })
    .eq("id", orderId);

  revalidateProduction(orderId);
}
