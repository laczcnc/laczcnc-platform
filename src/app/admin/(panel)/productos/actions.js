"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createSlug } from "@/modules/catalog/utils/create-slug";

function getText(formData, fieldName) {
  return String(formData.get(fieldName) ?? "").trim();
}

function getBoolean(formData, fieldName) {
  return formData.get(fieldName) === "on";
}

function getNullableNumber(formData, fieldName) {
  const rawValue = getText(formData, fieldName);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getInteger(formData, fieldName, defaultValue = 0) {
  const rawValue = getText(formData, fieldName);

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isInteger(parsedValue)
    ? parsedValue
    : defaultValue;
}

function redirectWithError(path, errorCode) {
  redirect(`${path}?error=${encodeURIComponent(errorCode)}`);
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/productos/categorias");
}

function validateImageUrl(imageUrl, errorPath) {
  if (!imageUrl) {
    return;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      redirectWithError(errorPath, "invalid_image_url");
    }
  } catch {
    redirectWithError(errorPath, "invalid_image_url");
  }
}

function buildProductPayload(formData) {
  const name = getText(formData, "name");
  const requestedSlug = getText(formData, "slug");
  const slug = createSlug(requestedSlug || name);

  const categoryId = getText(formData, "category_id");
  const shortDescription = getText(
    formData,
    "short_description"
  );
  const description = getText(formData, "description");
  const price = getNullableNumber(formData, "price");
  const priceLabel = getText(formData, "price_label");
  const imageUrl = getText(formData, "image_url");
  const sortOrder = getInteger(formData, "sort_order", 0);

  return {
    name,
    slug,
    categoryId,
    shortDescription,
    description,
    price,
    priceLabel,
    imageUrl,
    sortOrder,
    isPublished: getBoolean(formData, "is_published"),
    isFeatured: getBoolean(formData, "is_featured"),
    isAvailable: getBoolean(formData, "is_available"),
  };
}

function validateProduct(product, errorPath) {
  if (!product.name) {
    redirectWithError(errorPath, "name_required");
  }

  if (!product.slug) {
    redirectWithError(errorPath, "invalid_slug");
  }

  if (product.name.length > 160) {
    redirectWithError(errorPath, "name_too_long");
  }

  if (product.slug.length > 180) {
    redirectWithError(errorPath, "slug_too_long");
  }

  if (
    product.price !== null &&
    (!Number.isFinite(product.price) || product.price < 0)
  ) {
    redirectWithError(errorPath, "invalid_price");
  }

  if (product.sortOrder < 0) {
    redirectWithError(errorPath, "invalid_sort_order");
  }

  validateImageUrl(product.imageUrl, errorPath);
}

function handleProductDatabaseError(error, errorPath) {
  console.error("Product database error:", error);

  if (error.code === "23505") {
    redirectWithError(errorPath, "slug_exists");
  }

  if (error.code === "23503") {
    redirectWithError(errorPath, "invalid_category");
  }

  redirectWithError(errorPath, "database_error");
}

export async function createProduct(formData) {
  const { user, supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const errorPath = "/admin/productos/nuevo";
  const product = buildProductPayload(formData);

  validateProduct(product, errorPath);

  const { error } = await supabase
    .from("products")
    .insert({
      category_id: product.categoryId || null,
      name: product.name,
      slug: product.slug,
      short_description:
        product.shortDescription || null,
      description: product.description || null,
      price: product.price,
      price_label: product.priceLabel || null,
      image_url: product.imageUrl || null,
      is_published: product.isPublished,
      is_featured: product.isFeatured,
      is_available: product.isAvailable,
      sort_order: product.sortOrder,
      created_by: user.id,
    });

  if (error) {
    handleProductDatabaseError(error, errorPath);
  }

  revalidateCatalog();

  redirect("/admin/productos?success=created");
}

export async function updateProduct(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const productId = getText(formData, "product_id");

  if (!productId) {
    redirect("/admin/productos?error=invalid_product");
  }

  const errorPath = `/admin/productos/${productId}/editar`;
  const product = buildProductPayload(formData);

  validateProduct(product, errorPath);

  const { error } = await supabase
    .from("products")
    .update({
      category_id: product.categoryId || null,
      name: product.name,
      slug: product.slug,
      short_description:
        product.shortDescription || null,
      description: product.description || null,
      price: product.price,
      price_label: product.priceLabel || null,
      image_url: product.imageUrl || null,
      is_published: product.isPublished,
      is_featured: product.isFeatured,
      is_available: product.isAvailable,
      sort_order: product.sortOrder,
    })
    .eq("id", productId);

  if (error) {
    handleProductDatabaseError(error, errorPath);
  }

  revalidateCatalog();
  revalidatePath(`/admin/productos/${productId}/editar`);

  redirect("/admin/productos?success=updated");
}

export async function toggleProductFlag(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const productId = getText(formData, "product_id");
  const field = getText(formData, "field");
  const currentValue = getText(formData, "current_value");

  const allowedFields = [
    "is_published",
    "is_featured",
    "is_available",
  ];

  if (!productId || !allowedFields.includes(field)) {
    redirect("/admin/productos?error=invalid_toggle");
  }

  const nextValue = currentValue !== "true";

  const { error } = await supabase
    .from("products")
    .update({
      [field]: nextValue,
    })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling product:", error);
    redirect("/admin/productos?error=toggle_failed");
  }

  revalidateCatalog();
  revalidatePath(`/admin/productos/${productId}/editar`);

  redirect("/admin/productos?success=status_updated");
}

export async function deleteProduct(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const productId = getText(formData, "product_id");

  if (!productId) {
    redirect("/admin/productos?error=invalid_product");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    redirect("/admin/productos?error=delete_failed");
  }

  revalidateCatalog();

  redirect("/admin/productos?success=deleted");
}

export async function createCategory(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const name = getText(formData, "name");
  const requestedSlug = getText(formData, "slug");
  const slug = createSlug(requestedSlug || name);
  const description = getText(formData, "description");
  const sortOrder = getInteger(formData, "sort_order", 0);
  const isActive = getBoolean(formData, "is_active");

  const errorPath = "/admin/productos/categorias";

  if (!name) {
    redirectWithError(errorPath, "category_name_required");
  }

  if (!slug) {
    redirectWithError(errorPath, "category_slug_invalid");
  }

  if (sortOrder < 0) {
    redirectWithError(errorPath, "invalid_sort_order");
  }

  const { error } = await supabase
    .from("product_categories")
    .insert({
      name,
      slug,
      description: description || null,
      sort_order: sortOrder,
      is_active: isActive,
    });

  if (error) {
    console.error("Error creating category:", error);

    if (error.code === "23505") {
      redirectWithError(errorPath, "category_slug_exists");
    }

    redirectWithError(errorPath, "category_database_error");
  }

  revalidateCatalog();

  redirect(
    "/admin/productos/categorias?success=category_created"
  );
}

export async function updateCategory(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const categoryId = getText(formData, "category_id");
  const name = getText(formData, "name");
  const requestedSlug = getText(formData, "slug");
  const slug = createSlug(requestedSlug || name);
  const description = getText(formData, "description");
  const sortOrder = getInteger(formData, "sort_order", 0);
  const isActive = getBoolean(formData, "is_active");

  const errorPath = "/admin/productos/categorias";

  if (!categoryId || !name || !slug) {
    redirectWithError(errorPath, "invalid_category");
  }

  const { error } = await supabase
    .from("product_categories")
    .update({
      name,
      slug,
      description: description || null,
      sort_order: sortOrder,
      is_active: isActive,
    })
    .eq("id", categoryId);

  if (error) {
    console.error("Error updating category:", error);

    if (error.code === "23505") {
      redirectWithError(errorPath, "category_slug_exists");
    }

    redirectWithError(errorPath, "category_database_error");
  }

  revalidateCatalog();

  redirect(
    "/admin/productos/categorias?success=category_updated"
  );
}

export async function deleteCategory(formData) {
  const { supabase } = await requirePermission(
    PERMISSIONS.PRODUCTS_MANAGE
  );

  const categoryId = getText(formData, "category_id");

  if (!categoryId) {
    redirect(
      "/admin/productos/categorias?error=invalid_category"
    );
  }

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Error deleting category:", error);
    redirect(
      "/admin/productos/categorias?error=category_delete_failed"
    );
  }

  revalidateCatalog();

  redirect(
    "/admin/productos/categorias?success=category_deleted"
  );
}
