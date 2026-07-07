"use client";

import { useState } from "react";

export default function PublicProductGallery({
  productName,
  images = [],
}) {
  const validImages = images.filter(
    (image) => image?.public_url
  );

  const initialImage =
    validImages.find((image) => image.is_cover) ||
    validImages[0] ||
    null;

  const [selectedImage, setSelectedImage] =
    useState(initialImage);

  if (!selectedImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-950">
        <div className="text-center">
          <p className="font-mono text-6xl font-black text-zinc-700">
            LC
          </p>

          <p className="mt-4 text-sm font-bold text-zinc-600">
            Imagen no disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={selectedImage.public_url}
            alt={
              selectedImage.alt_text ||
              productName
            }
            className="h-full w-full object-cover"
          />

          {selectedImage.is_cover ? (
            <span className="absolute left-4 top-4 rounded-full border border-orange-400/40 bg-orange-500 px-3 py-1 text-xs font-black text-zinc-950">
              Portada
            </span>
          ) : null}
        </div>
      </div>

      {validImages.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {validImages.map((image) => {
            const isSelected =
              selectedImage.id === image.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImage(image)
                }
                className={[
                  "relative aspect-square overflow-hidden rounded-xl border bg-zinc-900 transition",
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/20"
                    : "border-zinc-800 hover:border-zinc-600",
                ].join(" ")}
                aria-label={`Ver imagen de ${productName}`}
              >
                <img
                  src={image.public_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}