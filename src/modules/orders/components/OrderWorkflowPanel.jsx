import { changeOrderStatus } from "@/app/admin/(panel)/pedidos/workflow-actions";

const STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  production: "En producción",
  ready: "Listo",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES = {
  draft:
    "border-zinc-700 bg-zinc-800 text-zinc-300",
  confirmed:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  production:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  ready:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  delivered:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled:
    "border-red-500/30 bg-red-500/10 text-red-300",
};

const STATUS_ACTIONS = {
  draft: [
    {
      status: "confirmed",
      label: "Confirmar pedido",
      primary: true,
    },
    {
      status: "cancelled",
      label: "Cancelar",
    },
  ],

  confirmed: [
    {
      status: "production",
      label: "Enviar a producción",
      primary: true,
    },
    {
      status: "draft",
      label: "Volver a borrador",
    },
    {
      status: "cancelled",
      label: "Cancelar",
    },
  ],

  production: [
    {
      status: "ready",
      label: "Marcar como listo",
      primary: true,
    },
    {
      status: "confirmed",
      label: "Volver a confirmado",
    },
    {
      status: "cancelled",
      label: "Cancelar",
    },
  ],

  ready: [
    {
      status: "delivered",
      label: "Marcar entregado",
      primary: true,
    },
    {
      status: "production",
      label: "Volver a producción",
    },
    {
      status: "cancelled",
      label: "Cancelar",
    },
  ],

  delivered: [
    {
      status: "completed",
      label: "Completar pedido",
      primary: true,
    },
    {
      status: "ready",
      label: "Volver a listo",
    },
  ],

  completed: [
    {
      status: "delivered",
      label: "Reabrir como entregado",
    },
  ],

  cancelled: [
    {
      status: "draft",
      label: "Reactivar pedido",
      primary: true,
    },
  ],
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export default function OrderWorkflowPanel({
  order,
  history = [],
}) {
  const availableActions =
    STATUS_ACTIONS[order.status] || [];

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            Flujo operativo
          </p>

          <h2 className="mt-2 text-2xl font-black text-zinc-100">
            Estado del pedido
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Controla el avance desde la confirmación hasta
            la entrega final.
          </p>
        </div>

        <span
          className={[
            "w-fit rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wider",
            STATUS_STYLES[order.status] ||
              STATUS_STYLES.draft,
          ].join(" ")}
        >
          {STATUS_LABELS[order.status] ||
            order.status}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {availableActions.map((action) => (
          <form
            key={action.status}
            action={changeOrderStatus}
          >
            <input
              type="hidden"
              name="order_id"
              value={order.id}
            />

            <input
              type="hidden"
              name="new_status"
              value={action.status}
            />

            <button
              type="submit"
              className={[
                "rounded-xl px-5 py-3 text-sm font-black transition",
                action.primary
                  ? "bg-violet-500 text-white hover:bg-violet-400"
                  : action.status === "cancelled"
                    ? "border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white"
                    : "border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-300",
              ].join(" ")}
            >
              {action.label}
            </button>
          </form>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="font-black text-zinc-200">
          Historial
        </h3>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">
            Todavía no existen movimientos registrados.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {history.map((entry) => (
              <article
                key={entry.id}
                className="relative rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.previous_status ? (
                      <>
                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-500">
                          {STATUS_LABELS[
                            entry.previous_status
                          ] ||
                            entry.previous_status}
                        </span>

                        <span className="text-zinc-700">
                          →
                        </span>
                      </>
                    ) : null}

                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black",
                        STATUS_STYLES[
                          entry.new_status
                        ] || STATUS_STYLES.draft,
                      ].join(" ")}
                    >
                      {STATUS_LABELS[
                        entry.new_status
                      ] || entry.new_status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600">
                    {formatDate(entry.created_at)}
                  </p>
                </div>

                {entry.notes ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {entry.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}