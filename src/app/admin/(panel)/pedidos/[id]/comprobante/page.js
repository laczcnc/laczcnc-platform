import Link from "next/link";
import { notFound } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";
import PrintOrderButton from "@/modules/orders/components/PrintOrderButton";

export const metadata = {
  title: "Comprobante de pedido",
};

export const dynamic = "force-dynamic";

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
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export default async function OrderReceiptPage({
  params,
}) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);

  const routeParams = await params;
  const orderId = routeParams.id;

  const supabase = await createClient();

  const [
    { data: order, error: orderError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        quantity,
        unit_price,
        total_amount,
        discount_amount,
        advance_payment,
        balance_due,
        customer_notes,
        delivery_city,
        delivery_address,
        requested_delivery_date,
        created_at,
        customers (
          full_name,
          phone,
          email,
          company_name,
          city,
          address
        ),
        products (
          name
        )
      `)
      .eq("id", orderId)
      .maybeSingle(),

    supabase
      .from("order_payments")
      .select(`
        id,
        amount,
        payment_method,
        reference,
        notes,
        paid_at
      `)
      .eq("order_id", orderId)
      .order("paid_at", {
        ascending: true,
      }),
  ]);

  if (orderError) {
    console.error(
      "Error cargando comprobante:",
      orderError
    );

    throw new Error(
      "No se pudo cargar el comprobante."
    );
  }

  if (!order) {
    notFound();
  }

  if (paymentsError) {
    console.error(
      "Error cargando pagos del comprobante:",
      paymentsError
    );
  }

  const paymentList = payments || [];

  const subtotal =
    Number(order.quantity || 0) *
    Number(order.unit_price || 0);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 print:bg-white print:p-0 print:text-black">
      <section className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-8">
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-6 sm:flex-row sm:items-start print:border-zinc-300">
          <div>
            <p className="font-mono text-2xl font-black text-orange-500 print:text-black">
              LACZCnC
            </p>

            <p className="mt-2 text-sm text-zinc-500 print:text-zinc-600">
              Corte láser, impresión, sublimación,
              publicidad y merchandising.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Pedido
            </p>

            <p className="mt-1 font-mono text-xl font-black">
              PED-
              {String(order.order_number).padStart(
                6,
                "0"
              )}
            </p>

            <p className="mt-2 text-sm text-zinc-500 print:text-zinc-600">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
              Cliente
            </h2>

            <p className="mt-3 text-lg font-black">
              {order.customers?.full_name ||
                "Cliente no especificado"}
            </p>

            {order.customers?.company_name ? (
              <p className="mt-1 font-bold text-orange-400 print:text-black">
                {order.customers.company_name}
              </p>
            ) : null}

            <div className="mt-3 space-y-1 text-sm text-zinc-400 print:text-zinc-700">
              <p>
                Teléfono:{" "}
                {order.customers?.phone ||
                  "No registrado"}
              </p>

              <p>
                Correo:{" "}
                {order.customers?.email ||
                  "No registrado"}
              </p>

              <p>
                Dirección:{" "}
                {order.customers?.address ||
                  order.customers?.city ||
                  "No registrada"}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
              Entrega
            </h2>

            <div className="mt-3 space-y-1 text-sm text-zinc-400 print:text-zinc-700">
              <p>
                Ciudad:{" "}
                {order.delivery_city ||
                  "No definida"}
              </p>

              <p>
                Dirección:{" "}
                {order.delivery_address ||
                  "No definida"}
              </p>

              <p>
                Fecha solicitada:{" "}
                {formatDate(
                  order.requested_delivery_date
                )}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-zinc-800 print:border-zinc-300">
          <div className="grid grid-cols-[1fr_90px_120px_120px] gap-3 bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 print:bg-zinc-100 print:text-zinc-700">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio</span>
            <span>Subtotal</span>
          </div>

          <div className="grid grid-cols-[1fr_90px_120px_120px] gap-3 px-4 py-5 text-sm">
            <span className="font-bold">
              {order.products?.name ||
                "Producto no especificado"}
            </span>

            <span>{order.quantity || 0}</span>

            <span>
              {formatMoney(order.unit_price)}
            </span>

            <span className="font-black">
              {formatMoney(subtotal)}
            </span>
          </div>
        </section>

        <section className="mt-6 ml-auto max-w-sm space-y-3">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-500">
              Subtotal
            </span>

            <span className="font-bold">
              {formatMoney(subtotal)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-500">
              Descuento
            </span>

            <span className="font-bold">
              - {formatMoney(order.discount_amount)}
            </span>
          </div>

          <div className="flex justify-between gap-4 border-t border-zinc-800 pt-3 text-lg print:border-zinc-300">
            <span className="font-black">
              Total
            </span>

            <span className="font-black">
              {formatMoney(order.total_amount)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-500">
              Pagado
            </span>

            <span className="font-black text-emerald-400 print:text-black">
              {formatMoney(order.advance_payment)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-lg">
            <span className="font-black">
              Saldo
            </span>

            <span className="font-black text-red-400 print:text-black">
              {formatMoney(order.balance_due)}
            </span>
          </div>
        </section>

        {paymentList.length > 0 ? (
          <section className="mt-8 border-t border-zinc-800 pt-6 print:border-zinc-300">
            <h2 className="font-black">
              Historial de pagos
            </h2>

            <div className="mt-4 grid gap-3">
              {paymentList.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm sm:flex-row print:border-zinc-300"
                >
                  <div>
                    <p className="font-bold">
                      {PAYMENT_METHOD_LABELS[
                        payment.payment_method
                      ] || payment.payment_method}
                    </p>

                    <p className="mt-1 text-zinc-500 print:text-zinc-600">
                      {formatDate(payment.paid_at)}
                    </p>

                    {payment.reference ? (
                      <p className="mt-1 text-zinc-500 print:text-zinc-600">
                        Ref.: {payment.reference}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-lg font-black">
                    {formatMoney(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {order.customer_notes ? (
          <section className="mt-8 border-t border-zinc-800 pt-6 print:border-zinc-300">
            <h2 className="font-black">
              Detalles del pedido
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-400 print:text-zinc-700">
              {order.customer_notes}
            </p>
          </section>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-zinc-800 pt-6 print:hidden">
          <Link
            href={`/admin/pedidos/${order.id}/editar`}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Volver al pedido
          </Link>

          <PrintOrderButton />
        </div>
      </section>
    </main>
  );
}
