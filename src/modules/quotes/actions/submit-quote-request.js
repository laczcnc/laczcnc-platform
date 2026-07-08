"use server";

import { createClient } from "@/infrastructure/supabase/server";

const initialResponse = {
  success: false,
  message: "",
  requestId: null,
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeQuantity(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const quantity = Number.parseInt(normalizedValue, 10);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return Number.NaN;
  }

  return quantity;
}

function isValidEmail(email) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitQuoteRequest(
  previousState = initialResponse,
  formData
) {
  const productId = normalizeOptionalText(
    formData.get("product_id")
  );

  const customerName = normalizeText(
    formData.get("customer_name")
  );

  const customerPhone = normalizeText(
    formData.get("customer_phone")
  );

  const customerEmail = normalizeOptionalText(
    formData.get("customer_email")
  );

  const companyName = normalizeOptionalText(
    formData.get("company_name")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const quantity = normalizeQuantity(
    formData.get("quantity")
  );

  const message = normalizeOptionalText(
    formData.get("message")
  );

  const honeypot = normalizeText(
    formData.get("website")
  );

  if (honeypot) {
    return {
      success: true,
      message:
        "Solicitud recibida correctamente.",
      requestId: null,
    };
  }

  if (
    customerName.length < 2 ||
    customerName.length > 120
  ) {
    return {
      success: false,
      message:
        "Ingresa un nombre válido de entre 2 y 120 caracteres.",
      requestId: null,
    };
  }

  if (
    customerPhone.length < 6 ||
    customerPhone.length > 30
  ) {
    return {
      success: false,
      message:
        "Ingresa un número de teléfono válido.",
      requestId: null,
    };
  }

  if (
    customerEmail &&
    !isValidEmail(customerEmail)
  ) {
    return {
      success: false,
      message:
        "El correo electrónico no tiene un formato válido.",
      requestId: null,
    };
  }

  if (Number.isNaN(quantity)) {
    return {
      success: false,
      message:
        "La cantidad debe ser un número entero mayor que cero.",
      requestId: null,
    };
  }

  if (message && message.length > 3000) {
    return {
      success: false,
      message:
        "El mensaje no puede superar los 3000 caracteres.",
      requestId: null,
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "submit_quote_request",
      {
        request_product_id: productId,
        request_customer_name: customerName,
        request_customer_phone: customerPhone,
        request_customer_email: customerEmail,
        request_company_name: companyName,
        request_city: city,
        request_quantity: quantity,
        request_message: message,
        request_source: "product_page",
      }
    );

    if (error) {
      console.error(
        "Error registrando solicitud de cotización:",
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          productId,
        }
      );

      return {
        success: false,
        message:
          "No fue posible registrar la solicitud. Inténtalo nuevamente.",
        requestId: null,
      };
    }

    return {
      success: true,
      message:
        "Solicitud enviada. Nos comunicaremos contigo para preparar la cotización.",
      requestId: data || null,
    };
  } catch (error) {
    console.error(
      "Error inesperado registrando cotización:",
      error
    );

    return {
      success: false,
      message:
        "Ocurrió un error inesperado. Inténtalo nuevamente.",
      requestId: null,
    };
  }
}