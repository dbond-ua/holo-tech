"use client";

import { useFormState } from "react-dom";
import type { ReactNode } from "react";
import { createProductAction, updateProductAction } from "../../actions";
import type { ProductWithRelations } from "@/lib/admin/products";
import type { CategoryRow, BrandRow } from "@/lib/db/types";
import { SubmitButton } from "../../components/SubmitButton";
import { ImageUploader } from "./ImageUploader";

interface ProductFormProps {
  product?: ProductWithRelations;
  categories: CategoryRow[];
  brands: BrandRow[];
}

type FormState = { error: string } | { ok: true } | null;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";
const textareaClass = inputClass + " min-h-[90px] resize-y";

/** Serializes the stored extra_specs jsonb array into the plain-text,
 *  one-characteristic-per-line format the textarea below edits — see
 *  parseExtraSpecsField() in ../../actions.ts for the inverse. Malformed
 *  rows (e.g. hand-edited directly via SQL) are silently skipped rather
 *  than breaking the form. */
function extraSpecsToText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      if (
        typeof e.labelUk !== "string" ||
        typeof e.labelEn !== "string" ||
        typeof e.valueUk !== "string" ||
        typeof e.valueEn !== "string"
      )
        return null;
      return `${e.labelUk} | ${e.labelEn} | ${e.valueUk} | ${e.valueEn}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked ?? false}
        className="h-4 w-4 rounded border-line accent-ink"
      />
      {label}
    </label>
  );
}

export function ProductForm({ product, categories, brands }: ProductFormProps) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProductAction.bind(null, product!.id) : createProductAction;
  const [state, formAction] = useFormState<FormState, FormData>(action, null);

  const p = product;

  return (
    <form action={formAction} className="space-y-6">
      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">Помилка: {state.error}</p>
      )}
      {state && "ok" in state && (
        <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">Збережено.</p>
      )}

      <Section title="Основна інформація">
        <Field label="Слаг (slug)">
          <input name="slug" defaultValue={p?.slug} required className={inputClass} placeholder="ecoflow-river-3" />
        </Field>
        <Field label="Категорія">
          <select name="category_id" defaultValue={p?.category_id ?? ""} required className={inputClass}>
            <option value="" disabled>
              — оберіть —
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title_uk}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Бренд">
          <select name="brand_id" defaultValue={p?.brand_id ?? ""} className={inputClass}>
            <option value="">— без бренду —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <div />
        <Field label="Назва (UA)">
          <input name="name_uk" defaultValue={p?.name_uk} required className={inputClass} />
        </Field>
        <Field label="Назва (EN)">
          <input name="name_en" defaultValue={p?.name_en} required className={inputClass} />
        </Field>
        <Field label="Тег-лайн (UA)">
          <input name="tagline_uk" defaultValue={p?.tagline_uk} className={inputClass} />
        </Field>
        <Field label="Тег-лайн (EN)">
          <input name="tagline_en" defaultValue={p?.tagline_en} className={inputClass} />
        </Field>
        <Field label="Опис (UA)" full>
          <textarea name="description_uk" defaultValue={p?.description_uk} className={textareaClass} />
        </Field>
        <Field label="Опис (EN)" full>
          <textarea name="description_en" defaultValue={p?.description_en} className={textareaClass} />
        </Field>
      </Section>

      <Section title="Ціна та наявність">
        <Field label="Ціна, ₴">
          <input
            type="number"
            name="price"
            step="1"
            min="0"
            defaultValue={p?.price ?? ""}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Стара ціна, ₴">
          <input type="number" name="old_price" step="1" min="0" defaultValue={p?.old_price ?? ""} className={inputClass} />
        </Field>
        <Field label="Кількість на складі">
          <input
            type="number"
            name="stock_count"
            step="1"
            min="0"
            defaultValue={p?.stock_count ?? ""}
            className={inputClass}
          />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox name="in_stock" label="Є в наявності" defaultChecked={p?.in_stock ?? true} />
        </div>
      </Section>

      <Section title="Позначки та публікація">
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">
          <Checkbox name="is_new" label="Новинка" defaultChecked={p?.is_new} />
          <Checkbox name="is_bestseller" label="Бестселер" defaultChecked={p?.is_bestseller} />
          <Checkbox name="is_demo" label="Демо-зразок" defaultChecked={p?.is_demo} />
          <Checkbox name="expandable" label="Розширюваний" defaultChecked={p?.expandable} />
          <Checkbox name="high_voltage" label="Висока напруга" defaultChecked={p?.high_voltage} />
          <Checkbox name="is_published" label="Опубліковано" defaultChecked={p?.is_published ?? true} />
        </div>
        <div className="flex items-end pb-2">
          <Checkbox name="show_on_homepage" label="Показувати на головній сторінці" defaultChecked={p?.show_on_homepage} />
        </div>
        <Field label="Порядок сортування на головній">
          <input
            type="number"
            name="homepage_sort_order"
            step="1"
            defaultValue={p?.homepage_sort_order ?? 0}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Технічні характеристики"
        description="Заповніть ті поля, що стосуються цього товару — решту можна лишити порожніми."
      >
        <Field label="Потужність, Вт">
          <input type="number" name="power_w" defaultValue={p?.power_w ?? ""} className={inputClass} />
        </Field>
        <Field label="Ємність, Втгод">
          <input type="number" name="capacity_wh" defaultValue={p?.capacity_wh ?? ""} className={inputClass} />
        </Field>
        <Field label="Кількість розеток">
          <input type="number" name="outlets" defaultValue={p?.outlets ?? ""} className={inputClass} />
        </Field>
        <Field label="Час заряджання, год">
          <input type="number" step="0.1" name="charge_time_h" defaultValue={p?.charge_time_h ?? ""} className={inputClass} />
        </Field>
        <Field label="Тип батареї">
          <input name="battery_type" defaultValue={p?.battery_type ?? ""} className={inputClass} placeholder="LiFePO4" />
        </Field>
        <Field label="Вага, кг">
          <input type="number" step="0.1" name="weight_kg" defaultValue={p?.weight_kg ?? ""} className={inputClass} />
        </Field>
        <Field label="Фаза">
          <select name="phase" defaultValue={p?.phase ?? ""} className={inputClass}>
            <option value="">— не вказано —</option>
            <option value="single">Однофазна</option>
            <option value="three">Трифазна</option>
          </select>
        </Field>
        <Field label="Тип інвертора">
          <select name="inverter_type" defaultValue={p?.inverter_type ?? ""} className={inputClass}>
            <option value="">— не вказано —</option>
            <option value="hybrid">Гібридний</option>
            <option value="grid">Мережевий</option>
            <option value="off-grid">Автономний</option>
          </select>
        </Field>
        <Field label="MPPT, шт.">
          <input type="number" name="mppt" defaultValue={p?.mppt ?? ""} className={inputClass} />
        </Field>
        <Field label="Напруга, В">
          <input type="number" step="0.1" name="voltage_v" defaultValue={p?.voltage_v ?? ""} className={inputClass} />
        </Field>
        <Field label="Ємність, Агод">
          <input type="number" step="0.1" name="capacity_ah" defaultValue={p?.capacity_ah ?? ""} className={inputClass} />
        </Field>
        <Field label="Макс. струм, А">
          <input type="number" step="0.1" name="max_current_a" defaultValue={p?.max_current_a ?? ""} className={inputClass} />
        </Field>
        <Field label="Циклів заряду">
          <input type="number" name="cycles" defaultValue={p?.cycles ?? ""} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">
          <Checkbox name="fast_charge" label="Швидка зарядка" defaultChecked={p?.fast_charge ?? false} />
          <Checkbox name="is_lifepo4" label="LiFePO4" defaultChecked={p?.is_lifepo4 ?? false} />
          <Checkbox name="has_ups" label="Функція ДБЖ (UPS)" defaultChecked={p?.has_ups ?? false} />
          <Checkbox name="solar_charging" label="Заряд від сонця" defaultChecked={p?.solar_charging ?? false} />
          <Checkbox name="bluetooth" label="Bluetooth" defaultChecked={p?.bluetooth ?? false} />
          <Checkbox name="wifi" label="Wi-Fi" defaultChecked={p?.wifi ?? false} />
        </div>
        <p className="text-xs text-muted sm:col-span-2">
          Незаповнені прапорці характеристик зберігаються як «не вказано», а не «ні».
        </p>
      </Section>

      <Section
        title="Додаткові характеристики"
        description={
          'Свої характеристики, яких немає у формі вище — без зміни коду. По одній на рядок, формат: "Назва (UA) | Name (EN) | Значення (UA) | Value (EN)". Порожні рядки ігноруються.'
        }
      >
        <Field label="Характеристики" full>
          <textarea
            name="extra_specs"
            defaultValue={extraSpecsToText(p?.extra_specs)}
            className={textareaClass}
            placeholder={"Рівень шуму | Noise level | < 30 дБ | < 30 dB\nГарантія | Warranty | 24 місяці | 24 months"}
          />
        </Field>
      </Section>

      <Section title="Списки">
        <Field label="Комплектація (UA), по рядку на пункт" full>
          <textarea
            name="whats_included_uk"
            defaultValue={p?.whats_included_uk?.join("\n")}
            className={textareaClass}
          />
        </Field>
        <Field label="Комплектація (EN), по рядку на пункт" full>
          <textarea
            name="whats_included_en"
            defaultValue={p?.whats_included_en?.join("\n")}
            className={textareaClass}
          />
        </Field>
        <Field label="Особливості (UA), по рядку на пункт" full>
          <textarea name="features_uk" defaultValue={p?.features_uk?.join("\n")} className={textareaClass} />
        </Field>
        <Field label="Особливості (EN), по рядку на пункт" full>
          <textarea name="features_en" defaultValue={p?.features_en?.join("\n")} className={textareaClass} />
        </Field>
      </Section>

      <Section title="Зображення">
        <div className="sm:col-span-2">
          <ImageUploader name="images" initialImages={p?.images ?? []} />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Збереження…">{isEdit ? "Зберегти зміни" : "Створити товар"}</SubmitButton>
      </div>
    </form>
  );
}
