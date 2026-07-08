import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/core/auth/require-admin";
import { createClient } from "@/infrastructure/supabase/server";
import OrderEditForm from "@/modules/orders/components/OrderEditForm";
import OrderPaymentsPanel from "@/modules/orders/components/OrderPaymentsPanel";
import OrderWorkflowPanel from "@/modules/orders/components/OrderWorkflowPanel";

import { updateOrder } from "../../actions";

export const metadata = {
  title: "Editar pedido",
};

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
  searchParams,
}) {
  await requireAdmin();

  const routeParams = await params;
  const queryParams = await searchParams;

  const orderId = routeParams.id;
  const wasSaved =
    queryParams?.guardado === "1";

  const supabase = await createClient();

  const [
    { data: order, error: orderError },
    { data: payments, error: paymentsError },
    { data: history, error: historyError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_id,
        quote_request_id,
        product_id,
        status,
        quantity,
        unit_price,
        total_amount,
        discount_amount,
        advance_payment,
        balance_due,
        customer_notes,
        internal_notes,
        delivery_city,
        delivery_address,
        requested_delivery_date,
        confirmed_at,
        completed_at,
        cancelled_at,
        created_at,
        updated_at,
        customers (
          id,
          full_name,
          phone,
          email,
          company_name,
          city,
          address
        ),
        products (
          id,
          name,
          slug,
          image_url
        )
      `)
      .eq("id", orderId)
      .maybeSingle(),

    supabase
      .from("order_payments")
      .select(`
        id,
        order_id,
        amount,
        payment_method,
        reference,
        notes,
        paid_at,
        created_at
      `)
      .eq("order_id", orderId)
      .order("paid_at", {
        ascending: false,
      }),

    supabase
      .from("order_status_history")
      .select(`
        id,
        order_id,
        previous_status,
        new_status,
        change_source,
        notes,
        changed_by,
        created_at
      `)
      .eq("order_id", orderId)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (orderError) {
    console.error("Error cargando pedido:", {
      orderId,
      code: orderError.code,
      message: orderError.message,
      details: orderError.details,
      hint: orderError.hint,
    });

    throw new Error(
      "No se pudo cargar el pedido."
    );
  }

  if (!order) {
    notFound();
  }

  if (paymentsError) {
    console.error("Error cargando pagos:", {
      orderId,
      code: paymentsError.code,
      message: paymentsError.message,
      details: paymentsError.details,
      hint: paymentsError.hint,
    });
  }

  if (historyError) {
    console.error(
      "Error cargando historial:",
      {
        orderId,
        code: historyError.code,
        message: historyError.message,
        details: historyError.details,
        hint: historyError.hint,
      }
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Pedido PED-
            {String(order.order_number).padStart(
              6,
              "0"
            )}
          </p>

          <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
            Editar pedido
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            {order.products?.name ||
              "Producto no especificado"}
            {" · "}
            {order.customers?.full_name ||
              "Cliente no especificado"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {order.customer_id ? (
            <Link
              href={`/admin/clientes/${order.customer_id}/editar`}
              className="rounded-xl border border-cyan-500/30 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-500 hover:text-zinc-950"
            >
              Editar cliente
            </Link>
          ) : null}

          <Link
            href={`/admin/pedidos/${order.id}/comprobante`}
            target="_blank"
            className="rounded-xl border border-orange-500/30 px-5 py-3 text-sm font-black text-orange-400 transition hover:bg-orange-500 hover:text-zinc-950"
          >
            Ver comprobante
          </Link>

          <Link
            href="/admin/pedidos"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Volver a pedidos
          </Link>
        </div>
      </section>

      {wasSaved ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-bold text-emerald-300">
            El pedido fue actualizado correctamente.
          </p>
        </div>
      ) : null}

      <OrderWorkflowPanel
        order={order}
        history={history || []}
      />

      <OrderEditForm
        order={order}
        action={updateOrder}
      />

      <OrderPaymentsPanel
        order={order}
        payments={payments || []}
      />
    </div>
  );
}