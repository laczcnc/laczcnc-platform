import CartPageClient from "@/modules/cart/components/CartPageClient";

export const metadata = {
  title: "Carrito",
  description: "Productos seleccionados para cotizar en LaczCNC.",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
          Selección
        </p>
        <h1 className="mt-2 text-3xl font-black">Carrito de cotización</h1>
        <p className="mb-8 mt-2 text-sm text-zinc-500">
          Ajusta cantidades y envía todos los productos en una sola solicitud.
        </p>
        <CartPageClient />
      </section>
    </main>
  );
}
