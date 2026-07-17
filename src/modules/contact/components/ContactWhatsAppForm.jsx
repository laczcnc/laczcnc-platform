"use client";

import {
  useMemo,
  useState,
} from "react";

function normalizeWhatsAppPhone(phone) {
  const digits = String(
    phone || ""
  ).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("51")) {
    return digits;
  }

  if (digits.length === 9) {
    return `51${digits}`;
  }

  return digits;
}

export default function ContactWhatsAppForm({
  whatsappNumber,
  initialProduct = "",
  welcomeMessage = "",
}) {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [message, setMessage] =
    useState(
      initialProduct
        ? `Deseo información sobre: ${initialProduct}.`
        : ""
    );

  const normalizedBusinessPhone =
    useMemo(
      () =>
        normalizeWhatsAppPhone(
          whatsappNumber
        ),
      [whatsappNumber]
    );

  function handleSubmit(event) {
    event.preventDefault();

    if (!normalizedBusinessPhone) {
      window.alert(
        "El número de WhatsApp todavía no fue configurado."
      );

      return;
    }

    const whatsappMessage = [
      `Hola, soy ${name.trim()}.`,
      phone.trim()
        ? `Mi número es ${phone.trim()}.`
        : "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const url =
      `https://wa.me/${normalizedBusinessPhone}` +
      `?text=${encodeURIComponent(
        whatsappMessage
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6"
    >
      <h2 className="text-xl font-black text-zinc-100">
        Enviar consulta
      </h2>

      {welcomeMessage ? (
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {welcomeMessage}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-zinc-300">
            Nombre *
          </span>

          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
            placeholder="Tu nombre"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-zinc-300">
            Tu WhatsApp
          </span>

          <input
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
            placeholder="999 999 999"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-zinc-300">
            Mensaje *
          </span>

          <textarea
            required
            minLength={5}
            maxLength={3000}
            rows={6}
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-orange-500"
            placeholder="Describe el producto, cantidad, medidas y fecha de entrega."
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-400"
        >
          Continuar en WhatsApp
        </button>

        {!normalizedBusinessPhone ? (
          <p className="text-center text-xs text-amber-300">
            WhatsApp aún no configurado por el administrador.
          </p>
        ) : null}
      </div>
    </form>
  );
}