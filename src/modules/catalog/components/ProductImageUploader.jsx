"use client";

import { useId, useRef, useState } from "react";

import { createClient } from "@/infrastructure/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function sanitizeFileName(fileName) {
  const parts = fileName.split(".");
  const extension =
    parts.length > 1
      ? parts.pop().toLowerCase()
      : "jpg";

  const baseName = parts
    .join(".")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return {
    baseName: baseName || "imagen-producto",
    extension,
  };
}

export default function ProductImageUploader({
  defaultValue = "",
}) {
  const inputId = useId();
  const fileInputRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(
    defaultValue || ""
  );

  const [isUploading, setIsUploading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];

    setErrorMessage("");

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage(
        "Formato no permitido. Utiliza JPG, PNG, WEBP o AVIF."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        "La imagen supera el límite máximo de 10 MB."
      );

      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Tu sesión administrativa no está activa."
        );
      }

      const { baseName, extension } =
        sanitizeFileName(file.name);

      const uniqueId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const filePath = [
        user.id,
        `${Date.now()}-${uniqueId}-${baseName}.${extension}`,
      ].join("/");

      const { error: uploadError } =
        await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          "Supabase no devolvió la URL pública."
        );
      }

      setImageUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error(
        "Error uploading product image:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible cargar la imagen."
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemoveImage() {
    setImageUrl("");
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        type="hidden"
        name="image_url"
        value={imageUrl}
      />

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileSelection}
        disabled={isUploading}
        className="sr-only"
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        {imageUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
            <img
              src={imageUrl}
              alt="Vista previa del producto"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
              <p className="truncate text-xs text-zinc-300">
                Imagen cargada correctamente
              </p>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 font-mono text-xl font-black text-zinc-600">
              IMG
            </div>

            <p className="mt-4 text-sm font-bold text-zinc-400">
              Sin imagen
            </p>

            <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-600">
              Selecciona una imagen desde tu computadora o
              desde la galería de tu celular.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label
          htmlFor={inputId}
          className={[
            "flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-black transition",
            isUploading
              ? "cursor-wait border-orange-500/20 bg-orange-500/5 text-orange-400/50"
              : "cursor-pointer border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-zinc-950",
          ].join(" ")}
        >
          {isUploading
            ? "Subiendo imagen..."
            : imageUrl
              ? "Cambiar imagen"
              : "Cargar imagen"}
        </label>

        <button
          type="button"
          onClick={handleRemoveImage}
          disabled={!imageUrl || isUploading}
          className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Quitar imagen
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        Formatos permitidos: JPG, PNG, WEBP y AVIF.
        Tamaño máximo: 10 MB.
      </p>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
        >
          <p className="text-sm font-bold text-red-300">
            {errorMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}