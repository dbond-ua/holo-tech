import type { BaseProduct, SpecEntry } from "./types";
import type { Dictionary } from "@/i18n/dictionary.types";
import type { Locale } from "@/i18n/config";

/**
 * Builds a localized specs table from a product's typed fields.
 * Typed numeric/boolean/enum fields on BaseProduct are the single source of
 * truth; labels and units are pulled from the dictionary so the same data
 * renders correctly in every locale without duplicating content per language.
 *
 * `locale` additionally resolves which language's label/value to show for
 * admin-defined custom characteristics (product.extraSpecs) appended at the
 * end — defaults to "uk" so existing call sites that don't pass it yet keep
 * compiling and behave the same as before this field existed.
 */
export function buildSpecs(product: BaseProduct, dict: Dictionary, locale: Locale = "uk"): SpecEntry[] {
  const { specs, units } = dict;
  const rows: SpecEntry[] = [];
  const bool = (v: boolean | undefined) => (v ? specs.have : specs.none);

  if (product.powerW) {
    rows.push({ label: specs.power, value: `${product.powerW} ${units.w}` });
  }

  if (product.category === "batteries" && product.capacityAh) {
    const kwh = product.capacityWh ? (product.capacityWh / 1000).toFixed(2) : undefined;
    rows.push({
      label: specs.capacityAh,
      value: kwh
        ? `${product.capacityAh} ${units.ah} / ${kwh} ${units.kwh}`
        : `${product.capacityAh} ${units.ah}`,
    });
  } else if (product.capacityWh) {
    rows.push({ label: specs.capacity, value: `${product.capacityWh} ${units.wh}` });
  }

  if (product.batteryType) {
    rows.push({ label: specs.batteryType, value: product.batteryType });
  }

  if (product.cycles) {
    rows.push({ label: specs.cycles, value: `${product.cycles} ${units.cycles}` });
  }

  if (product.chargeTimeH) {
    rows.push({ label: specs.chargeTime, value: specs.upTo80(product.chargeTimeH) });
  }

  if (product.outlets) {
    rows.push({ label: specs.outlets, value: `${product.outlets} ${units.outlets}` });
  }

  if (product.hasUPS !== undefined) {
    rows.push({ label: specs.ups, value: bool(product.hasUPS) });
  }

  if (product.solarCharging !== undefined) {
    rows.push({ label: specs.solarCharging, value: bool(product.solarCharging) });
  }

  if (product.bluetooth !== undefined || product.wifi !== undefined) {
    rows.push({
      label: specs.bluetoothWifi,
      value: `${bool(product.bluetooth)} / ${bool(product.wifi)}`,
    });
  }

  if (product.phase) {
    rows.push({
      label: specs.phase,
      value: product.phase === "single" ? specs.phaseSingle : specs.phaseThree,
    });
  }

  if (product.mppt !== undefined) {
    rows.push({ label: specs.mppt, value: String(product.mppt) });
  }

  if (product.inverterType) {
    const map = { hybrid: specs.typeHybrid, grid: specs.typeGrid, "off-grid": specs.typeOffgrid };
    rows.push({ label: specs.inverterType, value: map[product.inverterType] });
  }

  if (product.voltageV) {
    rows.push({ label: specs.voltage, value: `${product.voltageV} ${units.v}` });
  }

  if (product.maxCurrentA) {
    rows.push({ label: specs.maxCurrent, value: `${product.maxCurrentA} ${units.a}` });
  }

  if (product.weightKg) {
    rows.push({ label: specs.weight, value: `${product.weightKg} ${units.kg}` });
  }

  if (product.extraSpecs?.length) {
    for (const entry of product.extraSpecs) {
      const label = locale === "en" ? entry.labelEn : entry.labelUk;
      const value = locale === "en" ? entry.valueEn : entry.valueUk;
      if (label && value) rows.push({ label, value });
    }
  }

  return rows;
}
