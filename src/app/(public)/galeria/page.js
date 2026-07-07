export const metadata = {
  title: "Galería | LaczCnC",
};

export default function GalleryPage() {
  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-pink-400">
        Galería
      </p>

      <h1 className="mt-2 text-4xl font-black text-zinc-50">
        Trabajos realizados
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
        Aquí aparecerán fotografías y videos administrados desde el panel
        privado.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="aspect-square rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900"
          />
        ))}
      </div>
    </section>
  );
}