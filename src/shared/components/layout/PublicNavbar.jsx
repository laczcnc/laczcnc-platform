import Link from "next/link";

const navigation = [
  { href: "/", label: "Tienda" },
  { href: "/galeria", label: "Galería" },
  { href: "/carrito", label: "Carrito" },
  { href: "/contacto", label: "Contacto" },
];

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-mono text-lg font-black tracking-tight text-orange-500"
        >
          LACZ<span className="text-zinc-100">CnC</span>
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="flex items-center gap-1 sm:gap-3">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-orange-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
