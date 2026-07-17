import "server-only";

import { requireRole } from "@/core/auth/require-permission";

export async function requireAdmin() {
  return requireRole(["admin"]);
}