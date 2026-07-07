"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/client";

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function sanitizeFileName(fileName) {
  const parts = String(fileName || "").split(".");

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

function createUniqueId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function ProductGalleryManager({
  productId,
  initialImages = [],
}) {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const router = useRouter();

  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function validateFile(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Formato no permitido. Utiliza JPG, PNG, WEBP o AVIF.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Una de las imágenes supera el límite máximo de 10 MB.";
    }

    return "";
  }

  async function handleFileSelection(event) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    resetMessages();

    if (selectedFiles.length === 0) {
      return;
    }

    for (const file of selectedFiles) {
      const validationError = validateFile(file);

      if (validationError) {
        setErrorMessage(validationError);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        return;
      }
    }

    setIsUploading(true);

    const supabase = createClient();
    const uploadedStoragePaths = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Tu sesión administrativa no está activa."
        );
      }

      const currentImageCount = images.length;
      const insertedImages = [];

      for (
        let index = 0;
        index < selectedFiles.length;
        index += 1
      ) {
        const file = selectedFiles[index];

        const { baseName, extension } =
          sanitizeFileName(file.name);

        const uniqueId = createUniqueId();

        const storagePath = [
          user.id,
          productId,
          `${Date.now()}-${uniqueId}-${baseName}.${extension}`,
        ].join("/");

        const { error: uploadError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, file, {
              cacheControl: "3600",
              contentType: file.type,
              upsert: false,
            });

        if (uploadError) {
          throw uploadError;
        }

        uploadedStoragePaths.push(storagePath);

        const { data: publicUrlData } =
          supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        const publicUrl = publicUrlData?.publicUrl;

        if (!publicUrl) {
          throw new Error(
            "Supabase no devolvió la URL pública de una imagen."
          );
        }

        const isFirstImage =
          currentImageCount === 0 && index === 0;

        const imageRecord = {
          product_id: productId,
          storage_path: storagePath,
          public_url: publicUrl,
          alt_text: "",
          is_cover: isFirstImage,
          sort_order: currentImageCount + index,
          created_by: user.id,
        };

        const {
          data: insertedImage,
          error: insertError,
        } = await supabase
          .from("product_images")
          .insert(imageRecord)
          .select(`
            id,
            product_id,
            storage_path,
            public_url,
            alt_text,
            is_cover,
            sort_order,
            created_at
          `)
          .single();

        if (insertError) {
          throw insertError;
        }

        insertedImages.push(insertedImage);
      }

      setImages((currentImages) => [
        ...currentImages,
        ...insertedImages,
      ]);

      setSuccessMessage(
        insertedImages.length === 1
          ? "Imagen cargada correctamente."
          : `${insertedImages.length} imágenes cargadas correctamente.`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error uploading product gallery images:",
        error
      );

      if (uploadedStoragePaths.length > 0) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(uploadedStoragePaths);
      }

      setErrorMessage(
        error?.message ||
          "No fue posible cargar las imágenes."
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSetCover(image) {
    resetMessages();
    setBusyImageId(image.id);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("product_images")
        .update({
          is_cover: true,
        })
        .eq("id", image.id)
        .eq("product_id", productId);

      if (error) {
        throw error;
      }

      setImages((currentImages) =>
        currentImages.map((currentImage) => ({
          ...currentImage,
          is_cover: currentImage.id === image.id,
        }))
      );

      setSuccessMessage(
        "Portada actualizada correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error setting product cover:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible cambiar la portada."
      );
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleDeleteImage(image) {
    resetMessages();
    setBusyImageId(image.id);

    try {
      const supabase = createClient();

      const { error: databaseError } =
        await supabase
          .from("product_images")
          .delete()
          .eq("id", image.id)
          .eq("product_id", productId);

      if (databaseError) {
        throw databaseError;
      }

      const { error: storageError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([image.storage_path]);

      if (storageError) {
        console.error(
          "Image row deleted but Storage cleanup failed:",
          storageError
        );
      }

      const remainingImages = images.filter(
        (currentImage) =>
          currentImage.id !== image.id
      );

      setImages(remainingImages);

      if (
        image.is_cover &&
        remainingImages.length > 0
      ) {
        const nextCover = remainingImages
          .slice()
          .sort(
            (firstImage, secondImage) =>
              firstImage.sort_order -
              secondImage.sort_order
          )[0];

        const { error: coverError } =
          await supabase
            .from("product_images")
            .update({
              is_cover: true,
            })
            .eq("id", nextCover.id)
            .eq("product_id", productId);

        if (!coverError) {
          setImages((currentImages) =>
            currentImages.map((currentImage) => ({
              ...currentImage,
              is_cover:
                currentImage.id === nextCover.id,
            }))
          );
        }
      }

      setSuccessMessage(
        "Imagen eliminada correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error deleting product image:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible eliminar la imagen."
      );
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-black text-zinc-100">
            Galería del producto
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Puedes seleccionar varias imágenes desde la
            computadora o desde la galería del celular.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelection}
            disabled={isUploading}
            className="sr-only"
          />

          <label
            htmlFor={inputId}
            className={[
              "inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-black transition",
              isUploading
                ? "cursor-wait border-orange-500/20 bg-orange-500/5 text-orange-400/50"
                : "cursor-pointer border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-zinc-950",
            ].join(" ")}
          >
            {isUploading
              ? "Subiendo imágenes..."
              : "Agregar imágenes"}
          </label>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        Formatos permitidos: JPG, PNG, WEBP y AVIF.
        Máximo 10 MB por imagen.
      </p>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
        >
          <p className="text-sm font-bold text-red-300">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
        >
          <p className="text-sm font-bold text-emerald-300">
            {successMessage}
          </p>
        </div>
      ) : null}

      {images.length === 0 ? (
        <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-6 text-center">
          <div>
            <p className="font-bold text-zinc-400">
              Este producto todavía no tiene galería.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              La primera imagen cargada será utilizada como
              portada automáticamente.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {images
            .slice()
            .sort(
              (firstImage, secondImage) =>
                firstImage.sort_order -
                secondImage.sort_order
            )
            .map((image) => {
              const isBusy =
                busyImageId === image.id;

              return (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                    <img
                      src={image.public_url}
                      alt={
                        image.alt_text ||
                        "Imagen del producto"
                      }
                      className="h-full w-full object-cover"
                    />

                    {image.is_cover ? (
                      <span className="absolute left-3 top-3 rounded-full border border-orange-500/30 bg-orange-500/90 px-3 py-1 text-xs font-black text-zinc-950">
                        Portada
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSetCover(image)
                      }
                      disabled={
                        image.is_cover || isBusy
                      }
                      className="rounded-xl border border-orange-500/30 px-3 py-2 text-sm font-bold text-orange-400 transition hover:bg-orange-500 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {image.is_cover
                        ? "Es portada"
                        : "Usar como portada"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteImage(image)
                      }
                      disabled={isBusy}
                      className="rounded-xl border border-red-500/30 px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-40"
                    >
                      {isBusy
                        ? "Procesando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      )}
    </section>
  );
}