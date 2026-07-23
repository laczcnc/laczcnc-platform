"use client";

import { useState } from "react";

export const CART_STORAGE_KEY = "laczcnc-cart-v1";

export default function ProductPurchaseActions({ product }) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    const current = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );
    const existing = current.find((item) => item.id === product.id);
    const next = existing
      ? current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Number(item.quantity || 1) + 1 }
            : item
        )
      : [...current, { ...product, quantity: 1 }];

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("laczcnc-cart-updated"));
    setAdded(true);
  }

  function openQuote() {
    const quote = document.getElementById("cotizacion");
    quote?.setAttribute("open", "");
    quote?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={addToCart} className="rounded-xl border border-orange-500 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-300 hover:bg-orange-500 hover:text-zinc-950">
        {added ? "Agregado al carrito" : "Agregar al carrito"}
      </button>
      <button type="button" onClick={openQuote} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-orange-400">
        Solicitar cotización
      </button>
    </div>
  );
}
