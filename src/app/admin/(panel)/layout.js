import { requireAuthenticatedProfile } from "@/core/auth/require-permission";
import AdminSidebar from "@/shared/components/admin/AdminSidebar";
import AdminTopbar from "@/shared/components/admin/AdminTopbar";

export default async function AdminPanelLayout({
  children,
}) {
  const { user, profile } =
    await requireAuthenticatedProfile();

  const displayName =
    profile.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Usuario";

  return (
    <div className="admin-shell min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="admin-content min-w-0 flex-1">
          <AdminTopbar
            displayName={displayName}
            email={user.email || ""}
          />

          <main className="admin-main min-h-[calc(100vh-4rem)] min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
