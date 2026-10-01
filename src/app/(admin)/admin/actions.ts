"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut, requireAdminSession } from "@/lib/admin-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateCategory,
  createBrand,
  deleteBrand,
  setProductPublished,
} from "@/lib/admin/products";
import { updateOrderStatus } from "@/lib/orders";
import type { ProductRow, CategoryRow, OrderStatus } from "@/lib/db/types";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const session = await signIn(email, password);
  if (!session) return { error: "invalid_credentials" };
  redirect("/admin");
}

export async function logoutAction() {
  signOut();
  redirect("/admin/login");
}

function requireAuthOrThrow() {
  const session = requireAdminSession();
  if (!session) throw new Error("unauthorized");
  return session;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function parseProductForm(formData: FormData): Partial<ProductRow> {
  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const num = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (key: string) => formData.get(key) === "on";
  const list = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string"
      ? v.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
  };
  // "Додаткові характеристики" textarea: one per line, "labelUk | labelEn |
  // valueUk | valueEn" — the plain-text format ProductForm.tsx's
  // extraSpecsToText() serializes back for editing. Lines that don't split
  // into exactly 4 non-empty parts are silently dropped rather than
  // rejecting the whole save — a typo in one custom spec shouldn't block
  // saving the rest of the product.
  const extraSpecs = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string") return [];
    return v
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => {
        const parts = line.split("|").map((s) => s.trim());
        if (parts.length !== 4 || parts.some((p) => !p)) return null;
        const [labelUk, labelEn, valueUk, valueEn] = parts;
        return { key: String(i), labelUk, labelEn, valueUk, valueEn };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  };

  return {
    slug: str("slug"),
    category_id: str("category_id"),
    brand_id: str("brand_id") ?? null,
    name_uk: str("name_uk") ?? "",
    name_en: str("name_en") ?? "",
    tagline_uk: str("tagline_uk") ?? "",
    tagline_en: str("tagline_en") ?? "",
    description_uk: str("description_uk") ?? "",
    description_en: str("description_en") ?? "",
    whats_included_uk: list("whats_included_uk"),
    whats_included_en: list("whats_included_en"),
    features_uk: list("features_uk"),
    features_en: list("features_en"),
    price: num("price") ?? 0,
    old_price: num("old_price") ?? null,
    in_stock: bool("in_stock"),
    stock_count: num("stock_count") ?? null,
    is_new: bool("is_new"),
    is_bestseller: bool("is_bestseller"),
    is_demo: bool("is_demo"),
    expandable: bool("expandable"),
    high_voltage: bool("high_voltage"),
    power_w: num("power_w") ?? null,
    capacity_wh: num("capacity_wh") ?? null,
    outlets: num("outlets") ?? null,
    charge_time_h: num("charge_time_h") ?? null,
    battery_type: str("battery_type") ?? null,
    fast_charge: formData.has("fast_charge") ? bool("fast_charge") : null,
    is_lifepo4: formData.has("is_lifepo4") ? bool("is_lifepo4") : null,
    has_ups: formData.has("has_ups") ? bool("has_ups") : null,
    solar_charging: formData.has("solar_charging") ? bool("solar_charging") : null,
    bluetooth: formData.has("bluetooth") ? bool("bluetooth") : null,
    wifi: formData.has("wifi") ? bool("wifi") : null,
    weight_kg: num("weight_kg") ?? null,
    phase: (str("phase") as ProductRow["phase"]) ?? null,
    mppt: num("mppt") ?? null,
    inverter_type: (str("inverter_type") as ProductRow["inverter_type"]) ?? null,
    voltage_v: num("voltage_v") ?? null,
    capacity_ah: num("capacity_ah") ?? null,
    max_current_a: num("max_current_a") ?? null,
    cycles: num("cycles") ?? null,
    extra_specs: extraSpecs("extra_specs"),
    images: str("images") ? str("images")!.split(",").map((s) => s.trim()).filter(Boolean) : [],
    show_on_homepage: bool("show_on_homepage"),
    homepage_sort_order: num("homepage_sort_order") ?? 0,
    is_published: bool("is_published"),
  };
}

export async function createProductAction(_prevState: unknown, formData: FormData) {
  requireAuthOrThrow();
  const input = parseProductForm(formData);
  const result = await createProduct(input);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/products");
  redirect(`/admin/products/${result.id}`);
}

export async function updateProductAction(id: string, _prevState: unknown, formData: FormData) {
  const session = requireAuthOrThrow();
  const input = parseProductForm(formData);
  const result = await updateProduct(id, input, {
    managerId: session.managerId === "demo-admin" ? null : session.managerId,
    managerName: session.name,
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true as const };
}

export async function deleteProductAction(id: string) {
  requireAuthOrThrow();
  await deleteProduct(id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

/** One-click publish/hide toggle used from the products list — avoids
 *  opening the full edit form just to hide a product. */
export async function toggleProductPublishedAction(id: string, nextPublished: boolean) {
  requireAuthOrThrow();
  await setProductPublished(id, nextPublished);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Categories & brands
// ---------------------------------------------------------------------------

export async function updateCategoryAction(id: string, _prevState: unknown, formData: FormData) {
  requireAuthOrThrow();
  const input: Partial<CategoryRow> = {
    title_uk: String(formData.get("title_uk") ?? ""),
    title_en: String(formData.get("title_en") ?? ""),
    short_title_uk: String(formData.get("short_title_uk") ?? ""),
    short_title_en: String(formData.get("short_title_en") ?? ""),
    description_uk: String(formData.get("description_uk") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    emoji: String(formData.get("emoji") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 0),
  };
  const result = await updateCategory(id, input);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/categories");
  return { ok: true as const };
}

export async function createBrandAction(_prevState: unknown, formData: FormData) {
  requireAuthOrThrow();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "name_required" };
  const result = await createBrand(name);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/brands");
  return { ok: true as const };
}

export async function deleteBrandAction(id: string) {
  requireAuthOrThrow();
  await deleteBrand(id);
  revalidatePath("/admin/brands");
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function setOrderStatusAction(orderId: string, status: OrderStatus) {
  const session = requireAuthOrThrow();
  await updateOrderStatus(orderId, status, {
    managerId: session.managerId === "demo-admin" ? null : session.managerId,
    managerName: session.name,
    source: "admin",
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
