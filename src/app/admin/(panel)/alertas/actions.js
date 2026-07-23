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

function getReturnPath(formData) {
  const requestedPath = getText(
    formData,
    "return_path"
  );

  if (
    requestedPath === "/admin/alertas" ||
    requestedPath.startsWith(
      "/admin/alertas?"
    )
  ) {
    return requestedPath;
  }

  return "/admin/alertas";
}

function normalizeAlertKeys(values) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          String(value || "").trim()
        )
        .filter(
          (value) =>
            value.length >= 3 &&
            value.length <= 300
        )
    )
  ).slice(0, 200);
}

function refreshAlerts() {
  revalidatePath("/admin/alertas");
  revalidatePath("/admin");
}

export async function acknowledgeAlerts(
  formData
) {
  const {
    user,
    supabase,
  } = await requirePermission(
    PERMISSIONS.ALERTS_VIEW
  );

  const returnPath =
    getReturnPath(formData);

  const alertKeys = normalizeAlertKeys(
    formData.getAll("alert_key")
  );

  if (alertKeys.length === 0) {
    redirect(
      returnPath +
        (returnPath.includes("?")
          ? "&"
          : "?") +
        "error=no_alerts"
    );
  }

  const rows = alertKeys.map(
    (alertKey) => ({
      user_id: user.id,
      alert_key: alertKey,
      acknowledged_at:
        new Date().toISOString(),
    })
  );

  const { error } = await supabase
    .from("alert_acknowledgements")
    .upsert(rows, {
      onConflict: "user_id,alert_key",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error(
      "Error confirmando alertas:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    redirect(
      returnPath +
        (returnPath.includes("?")
          ? "&"
          : "?") +
        "error=acknowledge_failed"
    );
  }

  refreshAlerts();

  redirect("/admin/alertas?success=acknowledged");
}

export async function restoreAlert(
  formData
) {
  const {
    user,
    supabase,
  } = await requirePermission(
    PERMISSIONS.ALERTS_VIEW
  );

  const alertKey = getText(
    formData,
    "alert_key"
  );

  if (
    alertKey.length < 3 ||
    alertKey.length > 300
  ) {
    redirect(
      "/admin/alertas?vista=acknowledged&error=invalid_alert"
    );
  }

  const { error } = await supabase
    .from("alert_acknowledgements")
    .delete()
    .eq("user_id", user.id)
    .eq("alert_key", alertKey);

  if (error) {
    console.error(
      "Error restaurando alerta:",
      error
    );

    redirect(
      "/admin/alertas?vista=acknowledged&error=restore_failed"
    );
  }

  refreshAlerts();

  redirect(
    "/admin/alertas?vista=acknowledged&success=restored"
  );
}

export async function restoreAllAlerts() {
  const {
    user,
    supabase,
  } = await requirePermission(
    PERMISSIONS.ALERTS_VIEW
  );

  const { error } = await supabase
    .from("alert_acknowledgements")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Error restaurando todas las alertas:",
      error
    );

    redirect(
      "/admin/alertas?vista=acknowledged&error=restore_failed"
    );
  }

  refreshAlerts();

  redirect(
    "/admin/alertas?success=all_restored"
  );
}
