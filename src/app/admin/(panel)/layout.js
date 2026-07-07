import { requireAdmin } from "@/core/auth/require-admin";
import AdminSidebar from "@/shared/components/admin/AdminSidebar";
import AdminTopbar from "@/shared/components/admin/AdminTopbar";

export default async function AdminPanelLayout({ children }) {
  const { user, profile } = await requireAdmin();

  const displayName =
    profile.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Administrador";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="min-w-0 flex-1">
          <AdminTopbar
            displayName={displayName}
            email={user.email || ""}
          />

          <main className="min-h-[calc(100vh-5rem)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}