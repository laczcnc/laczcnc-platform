import Link from "next/link";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";

import {
  updateBusinessSettings,
} from "./actions";

export const metadata = {
  title: "Configuración",
};

export const dynamic = "force-dynamic";

const GROUP_LABELS = {
  general: {
    title: "Información general",
    description:
      "Identidad y descripción principal de LaczCnC.",
    accent: "text-orange-400",
  },
  contact: {
    title: "Contacto y ubicación",
    description:
      "Datos visibles para clientes y prospectos.",
    accent: "text-emerald-400",
  },
  social: {
    title: "Redes sociales",
    description:
      "Enlaces públicos de la marca.",
    accent: "text-pink-400",
  },
  schedule: {
    title: "Horarios",
    description:
      "Horario público de atención.",
    accent: "text-blue-400",
  },
  payments: {
    title: "Medios de pago",
    description:
      "Información privada utilizada para cobros.",
    accent: "text-cyan-400",
  },
  commerce: {
    title: "Mensajes comerciales",
    description:
      "Textos utilizados en cotizaciones y entregas.",
    accent: "text-violet-400",
  },
};

const GROUP_ORDER = [
  "general",
  "contact",
  "social",
  "schedule",
  "commerce",
  "payments",
];

function getInputType(valueType) {
  if (valueType === "email") {
    return "email";
  }

  if (valueType === "url") {
    return "url";
  }

  if (valueType === "phone") {
    return "tel";
  }

  if (valueType === "number") {
    return "number";
  }

  return "text";
}

export default async function ConfigurationPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_settings")
    .select(`
      id,
      setting_key,
      setting_value,
      value_type,
      setting_group,
      label,
      description,
      is_public,
      sort_order,
      updated_at
    `)
    .order("setting_group")
    .order("sort_order")
    .order("label");

  if (error) {
    console.error(
      "Error cargando configuración:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
  }

  const settings = data || [];

  const groupedSettings =
    GROUP_ORDER.map((groupName) => ({
      groupName,
      settings: settings.filter(
        (setting) =>
          setting.setting_group ===
          groupName
      ),
    })).filter(
      (group) =>
        group.settings.length > 0
    );

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Plataforma
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Configuración
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Administra información pública,
            medios de contacto, pagos y mensajes
            comerciales.
          </p>
        </div>

        <Link
          href="/contacto"
          target="_blank"
          className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
        >
          Ver página de contacto
        </Link>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="font-bold text-red-300">
            No se pudo cargar la configuración.
          </p>
        </div>
      ) : null}

      {!error &&
      settings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            No existen ajustes registrados.
          </p>
        </div>
      ) : null}

      {settings.length > 0 ? (
        <form
          action={
            updateBusinessSettings
          }
          className="mt-8 grid gap-6"
        >
          {groupedSettings.map(
            (group) => {
              const groupInformation =
                GROUP_LABELS[
                  group.groupName
                ];

              return (
                <section
                  key={group.groupName}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
                >
                  <div className="border-b border-zinc-800 pb-5">
                    <p
                      className={[
                        "text-xs font-bold uppercase tracking-[0.18em]",
                        groupInformation
                          ?.accent ||
                          "text-zinc-400",
                      ].join(" ")}
                    >
                      {
                        groupInformation
                          ?.title
                      }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {
                        groupInformation
                          ?.description
                      }
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {group.settings.map(
                      (setting) => (
                        <div
                          key={setting.id}
                          className={
                            setting.value_type ===
                            "textarea"
                              ? "lg:col-span-2"
                              : ""
                          }
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <label
                              htmlFor={
                                setting.setting_key
                              }
                              className="text-sm font-bold text-zinc-300"
                            >
                              {
                                setting.label
                              }
                            </label>

                            <span
                              className={[
                                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                                setting.is_public
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                  : "border-zinc-700 bg-zinc-950 text-zinc-600",
                              ].join(" ")}
                            >
                              {setting.is_public
                                ? "Público"
                                : "Privado"}
                            </span>
                          </div>

                          {setting.value_type ===
                          "textarea" ? (
                            <textarea
                              id={
                                setting.setting_key
                              }
                              name={
                                setting.setting_key
                              }
                              rows={4}
                              defaultValue={
                                setting.setting_value ||
                                ""
                              }
                              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                            />
                          ) : (
                            <input
                              id={
                                setting.setting_key
                              }
                              name={
                                setting.setting_key
                              }
                              type={getInputType(
                                setting.value_type
                              )}
                              defaultValue={
                                setting.setting_value ||
                                ""
                              }
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
                            />
                          )}

                          {setting.description ? (
                            <p className="mt-2 text-xs leading-5 text-zinc-600">
                              {
                                setting.description
                              }
                            </p>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                </section>
              );
            }
          )}

          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-7 py-4 text-sm font-black text-zinc-950 shadow-2xl shadow-black/60 transition hover:bg-orange-400 sm:w-auto"
            >
              Guardar configuración
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}