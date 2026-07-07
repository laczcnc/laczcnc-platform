"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";

export async function login(formData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=missing_fields");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/admin/login?error=invalid_credentials");
  }

  redirect("/admin");
}