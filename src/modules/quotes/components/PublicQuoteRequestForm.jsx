"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";

import { submitQuoteRequest } from "@/modules/quotes/actions/submit-quote-request";

const initialState = {
  success: false,
  message: "",
  requestId: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
    >
      {pending
        ? "Enviando solicitud..."
        : "Solicitar cotización"}
    </button>
  );
}

export default function PublicQuoteRequestForm({
  productId,
  productName,
}) {
  const formRef = useRef(null);

  const [state, formAction] = useActionState(
    submitQuoteRequest,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success, state.requestId]);

  return (
    <section
      id="cotizacion"
      className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
          Cotización
        </p>

        <h2 className="mt-3 text-2xl font-black text-zinc-50">
          Solicita información sobre este producto
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Producto seleccionado:{" "}
          <span className="font-bold text-zinc-300">
            {productName}
          </span>
        </p>
      </div>

      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          className={[
            "mt-6 rounded-xl border px-4 py-3",
            state.success
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10",
          ].join(" ")}
        >
          <p
            className={[
              "text-sm font-bold",
              state.success
                ? "text-emerald-300"
                : "text-red-300",
            ].join(" ")}
          >
            {state.message}
          </p>

          {state.success && state.requestId ? (
            <p className="mt-2 text-xs text-emerald-300/60">
              Código de solicitud:{" "}
              {String(state.requestId).slice(0, 8)}
            </p>
          ) : null}
        </div>
      ) : null}

      <form
        ref={formRef}
        action={formAction}
        className="mt-7 grid gap-5"
      >
        <input
          type="hidden"
          name="product_id"
          value={productId}
        />

        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="quote-website">
            Sitio web
          </label>

          <input
            id="quote-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="quote-customer-name"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Nombre completo
              <span className="text-orange-400">
                {" "}
                *
              </span>
            </label>

            <input
              id="quote-customer-name"
              name="customer_name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="quote-customer-phone"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Teléfono o WhatsApp
              <span className="text-orange-400">
                {" "}
                *
              </span>
            </label>

            <input
              id="quote-customer-phone"
              name="customer_phone"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              autoComplete="tel"
              inputMode="tel"
              placeholder="999 999 999"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="quote-customer-email"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Correo electrónico
            </label>

            <input
              id="quote-customer-email"
              name="customer_email"
              type="email"
              maxLength={180}
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="quote-city"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Ciudad o distrito
            </label>

            <input
              id="quote-city"
              name="city"
              type="text"
              maxLength={120}
              autoComplete="address-level2"
              placeholder="Juliaca, Puno..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="quote-company-name"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Empresa o institución
            </label>

            <input
              id="quote-company-name"
              name="company_name"
              type="text"
              maxLength={160}
              autoComplete="organization"
              placeholder="Opcional"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="quote-quantity"
              className="mb-2 block text-sm font-bold text-zinc-300"
            >
              Cantidad aproximada
            </label>

            <input
              id="quote-quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Ejemplo: 20"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="quote-message"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            Detalles del pedido
          </label>

          <textarea
            id="quote-message"
            name="message"
            rows={5}
            maxLength={3000}
            placeholder="Describe medidas, materiales, colores, fecha de entrega o personalización."
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
          />
        </div>

        <div>
          <SubmitButton />

          <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
            Al enviar la solicitud autorizas que nos
            comuniquemos contigo para atender la
            cotización.
          </p>
        </div>
      </form>
    </section>
  );
}