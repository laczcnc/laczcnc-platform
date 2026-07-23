"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PublicQuoteRequestForm from "@/modules/quotes/components/PublicQuoteRequestForm";
import { CART_STORAGE_KEY } from "./ProductPurchaseActions";

function money(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value || 0));
}

export default function CartPageClient() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(JSON.parse(
        window.localStorage.getItem(CART_STORAGE_KEY) || "[]"
      ));
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function save(next) {
    setItems(next);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  }

  function changeQuantity(id, quantity) {
    if (quantity < 1) return;
    save(items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ));
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const quoteMessage = useMemo(
    () => [
      "Deseo cotizar los siguientes productos:",
      ...items.map((item) => `- ${item.name}: ${item.quantity} unidad(es)`),
    ].join("\n"),
    [items]
  );

  if (!loaded) return <p className="text-zinc-500">Cargando carrito...</p>;

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
        <h2 className="text-xl font-black">Tu carrito está vacío</h2>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950">
          Ver tienda
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
      <section className="grid content-start gap-3">
        {items.map((item) => (
          <article key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-[64px_minmax(0,1fr)_130px_auto] sm:items-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-zinc-950">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <Link href={`/producto/${item.slug}`} className="font-black text-zinc-100 hover:text-orange-400">
                {item.name}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">
                {item.price !== null && item.price !== undefined
                  ? money(item.price)
                  : item.price_label || "Cotizar"}
              </p>
            </div>
            <label className="grid gap-1 text-xs font-bold text-zinc-500">
              Cantidad
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) =>
                  changeQuantity(item.id, Number(event.target.value))
                }
                className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              />
            </label>
            <button type="button" onClick={() => save(items.filter((current) => current.id !== item.id))} className="text-xs font-bold text-red-400">
              Quitar
            </button>
          </article>
        ))}

        <div className="flex justify-between rounded-xl border border-zinc-800 px-4 py-3">
          <span className="text-sm font-bold text-zinc-400">Total referencial</span>
          <strong className="text-orange-400">{money(total)}</strong>
        </div>
      </section>

      <PublicQuoteRequestForm
        key={quoteMessage}
        productId={items[0]?.id || ""}
        productName={`Carrito (${items.length} productos)`}
        initialQuantity={items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}
        initialMessage={quoteMessage}
        sectionId="cotizacion-carrito"
      />
    </div>
  );
}
