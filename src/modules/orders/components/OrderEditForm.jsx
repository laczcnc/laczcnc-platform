"use client";

import { useMemo, useState } from "react";

function parseMoney(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value || 0));
}

export default function OrderEditForm({
  order,
  action,
}) {
  const [quantity, setQuantity] = useState(
    order.quantity ?? ""
  );

  const [unitPrice, setUnitPrice] = useState(
    order.unit_price ?? 0
  );

  const [
    discountAmount,
    setDiscountAmount,
  ] = useState(order.discount_amount ?? 0);

  const paidAmount = parseMoney(
    order.advance_payment
  );

  const financialSummary = useMemo(() => {
    const numericQuantity =
      Number(quantity) || 0;

    const subtotal =
      numericQuantity *
      parseMoney(unitPrice);

    const total = Math.max(
      subtotal - parseMoney(discountAmount),
      0
    );

    const balance = Math.max(
      total - paidAmount,
      0
    );

    return {
      subtotal,
      total,
      balance,
    };
  }, [
    quantity,
    unitPrice,
    discountAmount,
    paidAmount,
  ]);

  return (
    <form
      action={action}
      className="mt-8 grid gap-6"
    >
      <input
        type="hidden"
        name="order_id"
        value={order.id}
      />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-xl font-black text-zinc-100">
          Estado y cantidades
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="order-status"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Estado
            </label>

            <select
              id="order-status"
              name="status"
              defaultValue={order.status}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            >
              <option value="draft">
                Borrador
              </option>

              <option value="confirmed">
                Confirmado
              </option>

              <option value="production">
                En producción
              </option>

              <option value="ready">
                Listo
              </option>

              <option value="delivered">
                Entregado
              </option>

              <option value="completed">
                Completado
              </option>

              <option value="cancelled">
                Cancelado
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="order-quantity"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Cantidad
            </label>

            <input
              id="order-quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-xl font-black text-zinc-100">
          Precios y pagos
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="unit-price"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Precio unitario
            </label>

            <input
              id="unit-price"
              name="unit_price"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(event) =>
                setUnitPrice(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="discount-amount"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Descuento
            </label>

            <input
              id="discount-amount"
              name="discount_amount"
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(event) =>
                setDiscountAmount(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <p className="mb-2 block text-sm font-bold text-zinc-300">
              Pagado
            </p>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="font-black text-emerald-300">
                {formatMoney(paidAmount)}
              </p>

              <p className="mt-1 text-xs text-emerald-300/60">
                Calculado desde el historial de pagos.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-bold uppercase text-zinc-600">
              Subtotal
            </p>

            <p className="mt-2 text-xl font-black text-zinc-200">
              {formatMoney(
                financialSummary.subtotal
              )}
            </p>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-xs font-bold uppercase text-orange-400">
              Total
            </p>

            <p className="mt-2 text-xl font-black text-orange-400">
              {formatMoney(
                financialSummary.total
              )}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-bold uppercase text-emerald-400">
              Pagado
            </p>

            <p className="mt-2 text-xl font-black text-emerald-300">
              {formatMoney(paidAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs font-bold uppercase text-red-300">
              Saldo pendiente
            </p>

            <p className="mt-2 text-xl font-black text-red-300">
              {formatMoney(
                financialSummary.balance
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="text-xl font-black text-zinc-100">
          Entrega
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="delivery-city"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Ciudad de entrega
            </label>

            <input
              id="delivery-city"
              name="delivery_city"
              type="text"
              defaultValue={
                order.delivery_city || ""
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="delivery-date"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Fecha solicitada
            </label>

            <input
              id="delivery-date"
              name="requested_delivery_date"
              type="date"
              defaultValue={
                order.requested_delivery_date ||
                ""
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="delivery-address"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            Dirección de entrega
          </label>

          <input
            id="delivery-address"
            name="delivery_address"
            type="text"
            defaultValue={
              order.delivery_address || ""
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer-notes"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Detalles del cliente
            </label>

            <textarea
              id="customer-notes"
              name="customer_notes"
              rows={6}
              defaultValue={
                order.customer_notes || ""
              }
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="internal-notes"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Notas internas
            </label>

            <textarea
              id="internal-notes"
              name="internal_notes"
              rows={6}
              defaultValue={
                order.internal_notes || ""
              }
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400 sm:w-auto"
        >
          Guardar cambios del pedido
        </button>
      </div>
    </form>
  );
}