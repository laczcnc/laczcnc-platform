"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import {
  requirePermission,
  requireRole,
} from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const ALLOWED_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "quoted",
  "won",
  "lost",
  "archived",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function getStatusTimestamps(status) {
  const now = new Date().toISOString();

  if (status === "contacted") {
    return {
      contacted_at: now,
    };
  }

  if (
    status === "won" ||
    status === "lost"
  ) {
    return {
      closed_at: now,
    };
  }

  return {};
}

export async function updateQuoteRequestStatus(
  formData
) {
  await requirePermission(PERMISSIONS.QUOTES_MANAGE);

  const requestId = normalizeText(
    formData.get("request_id")
  );

  const status = normalizeText(
    formData.get("status")
  );

  if (!requestId) {
    throw new Error(
      "No se recibió el identificador de la solicitud."
    );
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error(
      "El estado seleccionado no es válido."
    );
  }

  const supabase = await createClient();

  const updatePayload = {
    status,
    ...getStatusTimestamps(status),
  };

  const { error } = await supabase
    .from("quote_requests")
    .update(updatePayload)
    .eq("id", requestId);

  if (error) {
    console.error(
      "Error actualizando estado de cotización:",
      {
        requestId,
        status,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "Supabase no pudo actualizar la solicitud."
    );
  }

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/dashboard");
}

export async function updateQuoteRequestNotes(
  formData
) {
  await requirePermission(PERMISSIONS.QUOTES_MANAGE);

  const requestId = normalizeText(
    formData.get("request_id")
  );

  const internalNotes = normalizeText(
    formData.get("internal_notes")
  );

  if (!requestId) {
    throw new Error(
      "No se recibió el identificador de la solicitud."
    );
  }

  if (internalNotes.length > 5000) {
    throw new Error(
      "Las notas internas no pueden superar los 5000 caracteres."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_requests")
    .update({
      internal_notes:
        internalNotes || null,
    })
    .eq("id", requestId);

  if (error) {
    console.error(
      "Error actualizando notas de cotización:",
      {
        requestId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "Supabase no pudo guardar las notas."
    );
  }

  revalidatePath("/admin/cotizaciones");
}

export async function deleteQuoteRequest(
  formData
) {
  await requireRole(["admin", "manager"]);

  const requestId = normalizeText(
    formData.get("request_id")
  );

  if (!requestId) {
    throw new Error(
      "No se recibió el identificador de la solicitud."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error(
      "Error eliminando solicitud de cotización:",
      {
        requestId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "Supabase no pudo eliminar la solicitud."
    );
  }

  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin/dashboard");
}
