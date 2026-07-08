import {
  createOrderPayment,
  deleteOrderPayment,
} from "@/app/admin/(panel)/pedidos/payment-actions";

const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value || 0));
}

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

function getLocalDateTimeValue() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60000;

  return new Date(
    now.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

export default function OrderPaymentsPanel({
  order,
  payments = [],
}) {
  const paidTotal = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
            Caja
          </p>

          <h2 className="mt-2 text-2xl font-black text-zinc-100">
            Pagos del pedido
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Registra adelantos, pagos parciales y pagos
            finales.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs font-bold uppercase text-emerald-400">
              Pagado
            </p>

            <p className="mt-1 text-lg font-black text-emerald-300">
              {formatMoney(paidTotal)}
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-xs font-bold uppercase text-red-400">
              Saldo
            </p>

            <p className="mt-1 text-lg font-black text-red-300">
              {formatMoney(order.balance_due)}
            </p>
          </div>
        </div>
      </div>

      <form
        action={createOrderPayment}
        className="mt-7 grid gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
      >
        <input
          type="hidden"
          name="order_id"
          value={order.id}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="payment-amount"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Monto
            </label>

            <input
              id="payment-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="payment-method"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Método
            </label>

            <select
              id="payment-method"
              name="payment_method"
              defaultValue="cash"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-emerald-500"
            >
              <option value="cash">
                Efectivo
              </option>

              <option value="yape">
                Yape
              </option>

              <option value="plin">
                Plin
              </option>

              <option value="bank_transfer">
                Transferencia
              </option>

              <option value="card">
                Tarjeta
              </option>

              <option value="other">
                Otro
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-date"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Fecha y hora
            </label>

            <input
              id="payment-date"
              name="paid_at"
              type="datetime-local"
              defaultValue={getLocalDateTimeValue()}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="payment-reference"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Operación o referencia
            </label>

            <input
              id="payment-reference"
              name="reference"
              type="text"
              maxLength={160}
              placeholder="Número de operación, voucher..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="payment-notes"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Nota
            </label>

            <input
              id="payment-notes"
              name="notes"
              type="text"
              maxLength={1000}
              placeholder="Detalle opcional"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
          >
            Registrar pago
          </button>
        </div>
      </form>

      {payments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 px-5 py-10 text-center">
          <p className="font-bold text-zinc-400">
            Todavía no existen pagos registrados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
          <div className="divide-y divide-zinc-800">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="grid gap-4 bg-zinc-950/40 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-black text-emerald-300">
                      {formatMoney(payment.amount)}
                    </p>

                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400">
                      {PAYMENT_METHOD_LABELS[
                        payment.payment_method
                      ] || payment.payment_method}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {formatDate(payment.paid_at)}
                  </p>

                  {payment.reference ? (
                    <p className="mt-1 text-sm text-zinc-400">
                      Referencia: {payment.reference}
                    </p>
                  ) : null}

                  {payment.notes ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>

                <details>
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-red-400">
                    Eliminar
                  </summary>

                  <form
                    action={deleteOrderPayment}
                    className="mt-3"
                  >
                    <input
                      type="hidden"
                      name="payment_id"
                      value={payment.id}
                    />

                    <input
                      type="hidden"
                      name="order_id"
                      value={order.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                    >
                      Confirmar eliminación
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}