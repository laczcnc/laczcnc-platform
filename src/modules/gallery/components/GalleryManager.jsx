"use client";

import {
  useId,
  useRef,
  useState,
} from "react";

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
  const parts = String(
    fileName || ""
  ).split(".");

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
    baseName:
      baseName || "trabajo-laczcnc",
    extension,
  };
}

function createUniqueId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createTitleFromFileName(
  fileName
) {
  const nameWithoutExtension =
    String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

  if (!nameWithoutExtension) {
    return "Trabajo realizado";
  }

  return (
    nameWithoutExtension
      .charAt(0)
      .toUpperCase() +
    nameWithoutExtension.slice(1)
  );
}

export default function GalleryManager({
  initialItems = [],
}) {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const router = useRouter();

  const [items, setItems] =
    useState(initialItems);

  const [isUploading, setIsUploading] =
    useState(false);

  const [busyItemId, setBusyItemId] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [videoUrl, setVideoUrl] =
    useState("");

  const [videoTitle, setVideoTitle] =
    useState("");

  const [isAddingVideo, setIsAddingVideo] =
    useState(false);

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function validateFile(file) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      return "Formato no permitido. Utiliza JPG, PNG, WEBP o AVIF.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Una imagen supera el límite máximo de 10 MB.";
    }

    return "";
  }

  async function handleFileSelection(
    event
  ) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    resetMessages();

    if (selectedFiles.length === 0) {
      return;
    }

    for (const file of selectedFiles) {
      const validationError =
        validateFile(file);

      if (validationError) {
        setErrorMessage(
          validationError
        );

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
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

      const insertedItems = [];

      for (
        let index = 0;
        index < selectedFiles.length;
        index += 1
      ) {
        const file =
          selectedFiles[index];

        const {
          baseName,
          extension,
        } = sanitizeFileName(file.name);

        const uniqueId =
          createUniqueId();

        const storagePath = [
          user.id,
          "gallery",
          `${Date.now()}-${uniqueId}-${baseName}.${extension}`,
        ].join("/");

        const { error: uploadError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .upload(
              storagePath,
              file,
              {
                cacheControl: "3600",
                contentType: file.type,
                upsert: false,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        uploadedStoragePaths.push(
          storagePath
        );

        const { data: publicUrlData } =
          supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        const publicUrl =
          publicUrlData?.publicUrl;

        if (!publicUrl) {
          throw new Error(
            "Supabase no devolvió la URL pública."
          );
        }

        const {
          data: insertedItem,
          error: insertError,
        } = await supabase
          .from("gallery_items")
          .insert({
            title:
              createTitleFromFileName(
                file.name
              ),
            item_type: "image",
            storage_path: storagePath,
            public_url: publicUrl,
            is_published: true,
            is_featured: false,
            sort_order:
              items.length + index,
            created_by: user.id,
          })
          .select("*")
          .single();

        if (insertError) {
          throw insertError;
        }

        insertedItems.push(
          insertedItem
        );
      }

      setItems((currentItems) => [
        ...insertedItems,
        ...currentItems,
      ]);

      setSuccessMessage(
        insertedItems.length === 1
          ? "Imagen agregada correctamente."
          : `${insertedItems.length} imágenes agregadas correctamente.`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error cargando galería:",
        error
      );

      if (
        uploadedStoragePaths.length > 0
      ) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(
            uploadedStoragePaths
          );
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

  async function handleAddVideo(
    event
  ) {
    event.preventDefault();
    resetMessages();

    if (
      videoTitle.trim().length < 2
    ) {
      setErrorMessage(
        "Ingresa un título para el video."
      );

      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(
        videoUrl.trim()
      );
    } catch {
      setErrorMessage(
        "La URL del video no es válida."
      );

      return;
    }

    if (
      !["http:", "https:"].includes(
        parsedUrl.protocol
      )
    ) {
      setErrorMessage(
        "La URL del video no es válida."
      );

      return;
    }

    setIsAddingVideo(true);

    try {
      const supabase =
        createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Tu sesión administrativa no está activa."
        );
      }

      const {
        data: insertedItem,
        error,
      } = await supabase
        .from("gallery_items")
        .insert({
          title: videoTitle.trim(),
          item_type: "video",
          public_url:
            videoUrl.trim(),
          is_published: true,
          is_featured: false,
          sort_order: items.length,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setItems((currentItems) => [
        insertedItem,
        ...currentItems,
      ]);

      setVideoTitle("");
      setVideoUrl("");

      setSuccessMessage(
        "Video agregado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error agregando video:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible agregar el video."
      );
    } finally {
      setIsAddingVideo(false);
    }
  }

  async function handleUpdateItem(
    event,
    item
  ) {
    event.preventDefault();
    resetMessages();
    setBusyItemId(item.id);

    const formData =
      new FormData(
        event.currentTarget
      );

    const title = String(
      formData.get("title") || ""
    ).trim();

    const description = String(
      formData.get("description") ||
        ""
    ).trim();

    const category = String(
      formData.get("category") || ""
    ).trim();

    const customerName = String(
      formData.get("customer_name") ||
        ""
    ).trim();

    const projectLocation = String(
      formData.get(
        "project_location"
      ) || ""
    ).trim();

    const completedAt = String(
      formData.get("completed_at") ||
        ""
    ).trim();

    const thumbnailUrl = String(
      formData.get("thumbnail_url") ||
        ""
    ).trim();

    const sortOrder = Number.parseInt(
      String(
        formData.get("sort_order") ||
          "0"
      ),
      10
    );

    if (title.length < 2) {
      setErrorMessage(
        "El título debe tener al menos dos caracteres."
      );

      setBusyItemId(null);

      return;
    }

    try {
      const supabase =
        createClient();

      const payload = {
        title,
        description:
          description || null,
        category: category || null,
        customer_name:
          customerName || null,
        project_location:
          projectLocation || null,
        completed_at:
          completedAt || null,
        thumbnail_url:
          thumbnailUrl || null,
        sort_order:
          Number.isInteger(
            sortOrder
          ) && sortOrder >= 0
            ? sortOrder
            : 0,
      };

      const { error } =
        await supabase
          .from("gallery_items")
          .update(payload)
          .eq("id", item.id);

      if (error) {
        throw error;
      }

      setItems((currentItems) =>
        currentItems.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  ...payload,
                }
              : currentItem
        )
      );

      setSuccessMessage(
        "Trabajo actualizado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error actualizando trabajo:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible actualizar el trabajo."
      );
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleToggle(
    item,
    field
  ) {
    resetMessages();
    setBusyItemId(item.id);

    try {
      const supabase =
        createClient();

      const nextValue =
        !item[field];

      const { error } =
        await supabase
          .from("gallery_items")
          .update({
            [field]: nextValue,
          })
          .eq("id", item.id);

      if (error) {
        throw error;
      }

      setItems((currentItems) =>
        currentItems.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  [field]: nextValue,
                }
              : currentItem
        )
      );

      setSuccessMessage(
        field === "is_published"
          ? nextValue
            ? "Trabajo publicado."
            : "Trabajo ocultado."
          : nextValue
            ? "Trabajo destacado."
            : "Trabajo retirado de destacados."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible cambiar el estado."
      );
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleDelete(item) {
    const confirmed =
      window.confirm(
        `¿Eliminar "${item.title}" de la galería?`
      );

    if (!confirmed) {
      return;
    }

    resetMessages();
    setBusyItemId(item.id);

    try {
      const supabase =
        createClient();

      const { error: databaseError } =
        await supabase
          .from("gallery_items")
          .delete()
          .eq("id", item.id);

      if (databaseError) {
        throw databaseError;
      }

      if (
        item.storage_path
      ) {
        const { error: storageError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .remove([
              item.storage_path,
            ]);

        if (storageError) {
          console.error(
            "El registro fue eliminado, pero el archivo no pudo borrarse:",
            storageError
          );
        }
      }

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !==
            item.id
        )
      );

      setSuccessMessage(
        "Trabajo eliminado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error eliminando trabajo:",
        error
      );

      setErrorMessage(
        error?.message ||
          "No fue posible eliminar el trabajo."
      );
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
              Fotografías
            </p>

            <h2 className="mt-2 text-xl font-black text-zinc-100">
              Subir trabajos realizados
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Selecciona varias imágenes desde
              la computadora o celular.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={
                handleFileSelection
              }
              disabled={isUploading}
              className="sr-only"
            />

            <label
              htmlFor={inputId}
              className={[
                "inline-flex cursor-pointer items-center justify-center rounded-xl border px-5 py-3 text-sm font-black transition",
                isUploading
                  ? "border-orange-500/20 text-orange-400/50"
                  : "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-zinc-950",
              ].join(" ")}
            >
              {isUploading
                ? "Subiendo..."
                : "Agregar imágenes"}
            </label>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          JPG, PNG, WEBP o AVIF. Máximo
          10 MB por archivo.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-400">
          Videos
        </p>

        <h2 className="mt-2 text-xl font-black text-zinc-100">
          Agregar video mediante URL
        </h2>

        <form
          onSubmit={handleAddVideo}
          className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <input
            value={videoTitle}
            onChange={(event) =>
              setVideoTitle(
                event.target.value
              )
            }
            placeholder="Título del video"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
          />

          <input
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(
                event.target.value
              )
            }
            type="url"
            placeholder="URL de YouTube o video"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
          />

          <button
            disabled={isAddingVideo}
            className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {isAddingVideo
              ? "Agregando..."
              : "Agregar video"}
          </button>
        </form>
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="font-bold text-red-300">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="font-bold text-emerald-300">
            {successMessage}
          </p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="font-black text-zinc-300">
            La galería todavía está vacía.
          </p>
        </div>
      ) : (
        <section className="grid gap-6">
          {items.map((item) => {
            const isBusy =
              busyItemId === item.id;

            return (
              <article
                key={item.id}
                className="grid overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 lg:grid-cols-[320px_minmax(0,1fr)]"
              >
                <div className="min-h-64 bg-zinc-950">
                  {item.item_type ===
                  "image" ? (
                    <img
                      src={item.public_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : item.thumbnail_url ? (
                    <img
                      src={
                        item.thumbnail_url
                      }
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-64 items-center justify-center bg-pink-500/10">
                      <p className="text-5xl">
                        ▶
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-black uppercase",
                        item.is_published
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-700 bg-zinc-950 text-zinc-500",
                      ].join(" ")}
                    >
                      {item.is_published
                        ? "Publicado"
                        : "Oculto"}
                    </span>

                    {item.is_featured ? (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase text-orange-300">
                        Destacado
                      </span>
                    ) : null}

                    <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-black uppercase text-pink-300">
                      {item.item_type ===
                      "image"
                        ? "Imagen"
                        : "Video"}
                    </span>
                  </div>

                  <form
                    onSubmit={(event) =>
                      handleUpdateItem(
                        event,
                        item
                      )
                    }
                    className="mt-5 grid gap-4"
                  >
                    <input
                      name="title"
                      required
                      minLength={2}
                      maxLength={180}
                      defaultValue={
                        item.title
                      }
                      placeholder="Título"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />

                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={
                        item.description ||
                        ""
                      }
                      placeholder="Descripción del trabajo"
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        name="category"
                        defaultValue={
                          item.category ||
                          ""
                        }
                        placeholder="Categoría"
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />

                      <input
                        name="customer_name"
                        defaultValue={
                          item.customer_name ||
                          ""
                        }
                        placeholder="Cliente"
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />

                      <input
                        name="project_location"
                        defaultValue={
                          item.project_location ||
                          ""
                        }
                        placeholder="Ciudad o ubicación"
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />

                      <input
                        name="completed_at"
                        type="date"
                        defaultValue={
                          item.completed_at ||
                          ""
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />

                      <input
                        name="sort_order"
                        type="number"
                        min="0"
                        defaultValue={
                          item.sort_order
                        }
                        placeholder="Orden"
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />

                      <input
                        name="thumbnail_url"
                        type="url"
                        defaultValue={
                          item.thumbnail_url ||
                          ""
                        }
                        placeholder="Miniatura del video"
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
                      />
                    </div>

                    <button
                      disabled={isBusy}
                      className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-zinc-950 disabled:opacity-50"
                    >
                      Guardar información
                    </button>
                  </form>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleToggle(
                          item,
                          "is_published"
                        )
                      }
                      className="rounded-xl border border-emerald-500/30 px-4 py-2 text-sm font-black text-emerald-300"
                    >
                      {item.is_published
                        ? "Ocultar"
                        : "Publicar"}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleToggle(
                          item,
                          "is_featured"
                        )
                      }
                      className="rounded-xl border border-orange-500/30 px-4 py-2 text-sm font-black text-orange-300"
                    >
                      {item.is_featured
                        ? "Quitar destacado"
                        : "Destacar"}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleDelete(item)
                      }
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-black text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}