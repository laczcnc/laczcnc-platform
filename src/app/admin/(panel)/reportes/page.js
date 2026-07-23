import Link from "next/link";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import {
  loadBusinessReport,
  resolveReportRange,
} from "@/modules/reports/server/business-report";

export const metadata = {
  title: "Reportes empresariales",
};

export const dynamic = "force-dynamic";

const PERIOD_OPTIONS = [
  {
    value: "today",
    label: "Hoy",
  },
  {
    value: "7",
    label: "7 días",
  },
  {
    value: "30",
    label: "30 días",
  },
  {
    value: "90",
    label: "90 días",
  },
  {
    value: "month",
    label: "Este mes",
  },
  {
    value: "year",
    label: "Este año",
  },
];

const QUOTE_STATUS_LABELS = {
  new: "Nueva",
  contacted: "Contactado",
  qualified: "Calificado",
  quoted: "Cotizado",
  won: "Ganado",
  lost: "Perdido",
  archived: "Archivado",
};

const ORDER_STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  production: "Producción",
  ready: "Listo",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return (
    new Intl.NumberFormat("es-PE", {
      maximumFractionDigits: 1,
    }).format(Number(value || 0)) + "%"
  );
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Lima",
  }).format(
    new Date(
      value + "T12:00:00-05:00"
    )
  );
}

function buildReportHref(period) {
  return (
    "/admin/reportes?periodo=" +
    encodeURIComponent(period)
  );
}

function buildExportHref(range) {
  const params = new URLSearchParams({
    periodo: range.preset,
    desde: range.fromDate,
    hasta: range.toDate,
  });

  return (
    "/admin/reportes/exportar?" +
    params.toString()
  );
}

function MetricCard({
  label,
  value,
  detail,
  color = "text-zinc-100",
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5">
      <p className="text-sm font-semibold text-zinc-500">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-2xl font-black sm:text-3xl",
          color,
        ].join(" ")}
      >
        {value}
      </p>

      {detail ? (
        <p className="mt-2 text-xs leading-5 text-zinc-600">
          {detail}
        </p>
      ) : null}
    </article>
  );
}

function ProgressRow({
  label,
  value,
  total,
  colorClassName,
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          (Number(value || 0) /
            total) *
            100
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-zinc-400">
          {label}
        </span>

        <span className="shrink-0 font-semibold text-zinc-200">
          {formatNumber(value)}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={[
            "h-full rounded-full",
            colorClassName,
          ].join(" ")}
          style={{
            width:
              Math.max(
                percentage,
                value > 0 ? 2 : 0
              ) + "%",
          }}
        />
      </div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}) {
  const { supabase } =
    await requirePermission(
      PERMISSIONS.REPORTS_VIEW
    );

  const queryParams = await searchParams;

  const range =
    resolveReportRange(queryParams);

  const report =
    await loadBusinessReport({
      supabase,
      range,
    });

  const { metrics } = report;

  const maximumTrendRevenue = Math.max(
    1,
    ...report.salesTrend.map(
      (item) => item.revenue
    )
  );

  const maximumProductRevenue = Math.max(
    1,
    ...report.topProducts.map(
      (product) => product.revenue
    )
  );

  const maximumCustomerRevenue = Math.max(
    1,
    ...report.topCustomers.map(
      (customer) => customer.revenue
    )
  );

  const quoteStatusTotal =
    Object.values(
      report.quoteStatuses
    ).reduce(
      (total, count) =>
        total + count,
      0
    );

  const orderStatusTotal =
    Object.values(
      report.orderStatuses
    ).reduce(
      (total, count) =>
        total + count,
      0
    );

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
            Inteligencia empresarial
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Reportes y analítica
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            Ventas generadas, caja, cobranza,
            conversión comercial y desempeño
            operativo en un solo lugar.
          </p>
        </div>

        <a
          href={buildExportHref(range)}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300"
        >
          Exportar CSV
        </a>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={buildReportHref(
                option.value
              )}
              className={[
                "shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                range.preset ===
                option.value
                  ? "border-indigo-400 bg-indigo-400 text-zinc-950"
                  : "border-zinc-700 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-300",
              ].join(" ")}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <form
          method="get"
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            type="hidden"
            name="periodo"
            value="custom"
          />

          <label>
            <span className="mb-2 block text-xs font-semibold text-zinc-600">
              Desde
            </span>

            <input
              type="date"
              name="desde"
              required
              defaultValue={range.fromDate}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold text-zinc-600">
              Hasta
            </span>

            <input
              type="date"
              name="hasta"
              required
              defaultValue={range.toDate}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="self-end rounded-xl border border-indigo-500/40 px-5 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/10"
          >
            Aplicar fechas
          </button>
        </form>

        <p className="mt-3 text-xs text-zinc-600">
          Periodo analizado: {range.fromDate} al{" "}
          {range.toDate} ({range.days} días).
        </p>
      </section>

      {report.errors.length > 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"
        >
          <p className="font-semibold text-amber-300">
            Algunas fuentes no pudieron
            consultarse.
          </p>

          <p className="mt-1 text-sm text-amber-300/75">
            Revisa RLS para:{" "}
            {report.errors
              .map((error) => error.source)
              .join(", ")}
            .
          </p>
        </div>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Ventas generadas"
          value={formatMoney(
            metrics.grossSales
          )}
          detail={
            metrics.orderCount +
            " pedidos válidos"
          }
          color="text-indigo-300"
        />

        <MetricCard
          label="Dinero cobrado"
          value={formatMoney(
            metrics.collected
          )}
          detail="Pagos ingresados en el periodo"
          color="text-emerald-300"
        />

        <MetricCard
          label="Saldo pendiente"
          value={formatMoney(
            metrics.outstanding
          )}
          detail="Saldo de pedidos del periodo"
          color="text-red-300"
        />

        <MetricCard
          label="Ticket promedio"
          value={formatMoney(
            metrics.averageTicket
          )}
          detail="Promedio por pedido válido"
          color="text-cyan-300"
        />

        <MetricCard
          label="Conversión"
          value={formatPercent(
            metrics.quoteConversion
          )}
          detail={
            metrics.wonQuotes +
            " cotizaciones ganadas"
          }
          color="text-amber-300"
        />

        <MetricCard
          label="Descuentos"
          value={formatMoney(
            metrics.discounts
          )}
          detail="Concedidos en pedidos del periodo"
          color="text-orange-300"
        />
      </section>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
                Tendencia
              </p>

              <h2 className="mt-2 text-xl font-bold text-zinc-100">
                Ventas por día
              </h2>
            </div>

            <p className="text-xs text-zinc-600">
              {report.salesTrend.length} puntos
            </p>
          </div>

          {report.salesTrend.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-600">
              No hay ventas en el periodo.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex h-64 min-w-max items-end gap-2 border-b border-zinc-800 px-1">
                {report.salesTrend.map(
                  (item) => {
                    const height =
                      item.revenue > 0
                        ? Math.max(
                            5,
                            (item.revenue /
                              maximumTrendRevenue) *
                              100
                          )
                        : 2;

                    return (
                      <div
                        key={item.date}
                        className="group flex h-full w-10 shrink-0 flex-col items-center justify-end"
                        title={
                          formatMoney(
                            item.revenue
                          ) +
                          " · " +
                          item.orders +
                          " pedidos"
                        }
                      >
                        <span className="mb-2 hidden text-[10px] font-semibold text-indigo-300 group-hover:block">
                          {formatNumber(
                            item.revenue
                          )}
                        </span>

                        <div
                          className="w-7 rounded-t-lg bg-indigo-400/80 transition group-hover:bg-indigo-300"
                          style={{
                            height:
                              height + "%",
                            minHeight:
                              item.revenue > 0
                                ? 8
                                : 2,
                          }}
                        />

                        <span className="mt-2 whitespace-nowrap text-[10px] text-zinc-600">
                          {formatShortDate(
                            item.date
                          )}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
            Caja
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Métodos de pago
          </h2>

          {report.paymentMethods.length ===
          0 ? (
            <p className="mt-6 text-sm text-zinc-600">
              No hay pagos registrados.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {report.paymentMethods.map(
                (method) => (
                  <ProgressRow
                    key={method.method}
                    label={
                      method.label +
                      " · " +
                      method.payments
                    }
                    value={method.amount}
                    total={Math.max(
                      metrics.collected,
                      1
                    )}
                    colorClassName="bg-emerald-400"
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            Catálogo
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Productos con más ventas
          </h2>

          {report.topProducts.length ===
          0 ? (
            <p className="mt-6 text-sm text-zinc-600">
              No hay productos vendidos en el
              periodo.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {report.topProducts.map(
                (product, index) => (
                  <div key={product.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-200">
                          {index + 1}.{" "}
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {product.orders} pedidos ·{" "}
                          {formatNumber(
                            product.units
                          )}{" "}
                          unidades
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-orange-300">
                        {formatMoney(
                          product.revenue
                        )}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{
                          width:
                            Math.max(
                              3,
                              (product.revenue /
                                maximumProductRevenue) *
                                100
                            ) + "%",
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Clientes
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Clientes principales
          </h2>

          {report.topCustomers.length ===
          0 ? (
            <p className="mt-6 text-sm text-zinc-600">
              No hay clientes con pedidos en el
              periodo.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {report.topCustomers.map(
                (customer, index) => (
                  <div key={customer.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-200">
                          {index + 1}.{" "}
                          {customer.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {customer.orders} pedidos
                          {customer.city
                            ? " · " +
                              customer.city
                            : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-cyan-300">
                          {formatMoney(
                            customer.revenue
                          )}
                        </p>

                        {customer.outstanding >
                        0 ? (
                          <p className="mt-1 text-xs text-red-300">
                            Debe{" "}
                            {formatMoney(
                              customer.outstanding
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width:
                            Math.max(
                              3,
                              (customer.revenue /
                                maximumCustomerRevenue) *
                                100
                            ) + "%",
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
            Embudo comercial
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Estados de cotizaciones
          </h2>

          <div className="mt-6 space-y-4">
            {Object.entries(
              QUOTE_STATUS_LABELS
            ).map(([status, label]) => (
              <ProgressRow
                key={status}
                label={label}
                value={
                  report.quoteStatuses[
                    status
                  ] || 0
                }
                total={Math.max(
                  quoteStatusTotal,
                  1
                )}
                colorClassName={
                  status === "won"
                    ? "bg-emerald-400"
                    : status === "lost"
                      ? "bg-red-400"
                      : "bg-blue-400"
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            Pedidos
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Estados de pedidos
          </h2>

          <div className="mt-6 space-y-4">
            {Object.entries(
              ORDER_STATUS_LABELS
            ).map(([status, label]) => (
              <ProgressRow
                key={status}
                label={label}
                value={
                  report.orderStatuses[
                    status
                  ] || 0
                }
                total={Math.max(
                  orderStatusTotal,
                  1
                )}
                colorClassName={
                  status === "completed"
                    ? "bg-emerald-400"
                    : status ===
                        "cancelled"
                      ? "bg-red-400"
                      : "bg-violet-400"
                }
              />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Operaciones
          </p>

          <h2 className="mt-2 text-xl font-bold text-zinc-100">
            Rendimiento operativo
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Producciones"
            value={metrics.productionCount}
            detail={
              metrics.activeProduction +
              " activas · " +
              metrics.overdueProduction +
              " vencidas"
            }
            color="text-violet-300"
          />

          <MetricCard
            label="Cumplimiento"
            value={formatPercent(
              metrics.productionOnTimeRate
            )}
            detail={
              metrics.completedProduction +
              " producciones terminadas"
            }
            color="text-emerald-300"
          />

          <MetricCard
            label="Éxito de entregas"
            value={formatPercent(
              metrics.deliverySuccessRate
            )}
            detail={
              metrics.delivered +
              " entregadas · " +
              metrics.failedDeliveries +
              " fallidas"
            }
            color="text-cyan-300"
          />

          <MetricCard
            label="Valor de inventario"
            value={formatMoney(
              metrics.inventoryValue
            )}
            detail={
              metrics.inventoryMaterials +
              " materiales · " +
              metrics.lowStock +
              " por reponer"
            }
            color="text-teal-300"
          />
        </div>
      </section>
    </div>
  );
}
