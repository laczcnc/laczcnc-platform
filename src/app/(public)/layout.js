import PublicFooter from "@/shared/components/layout/PublicFooter";
import PublicNavbar from "@/shared/components/layout/PublicNavbar";

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <PublicNavbar />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}