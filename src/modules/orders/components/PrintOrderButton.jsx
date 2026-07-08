"use client";

export default function PrintOrderButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400 print:hidden"
    >
      Imprimir comprobante
    </button>
  );
}