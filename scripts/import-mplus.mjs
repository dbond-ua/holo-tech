#!/usr/bin/env node
// Imports products from the mplus.com.ua supplier price list (.xlsx export)
// into the catalog at the supplier's recommended retail price (РРЦ). Imports
// everything except smartphones, tablets and phone accessories — see SECTIONS.
//
// Usage (on the server, from the project directory):
//   node scripts/import-mplus.mjs /path/to/mplus.xlsx --dry-run   # preview, writes nothing
//   node scripts/import-mplus.mjs /path/to/mplus.xlsx             # real import
//
// Options:
//   --dry-run       parse and price everything, print a summary; no DB, no downloads
//   --rate 41.50    UAH per USD; default: today's official NBU rate (bank.gov.ua)
//   --markup 0      markup in percent over the РРЦ (default 0 — sell at РРЦ)
//   --no-images     do not download product photos
//
// Price sanity check: the supplier list contains prices that are obviously
// wrong (a full-frame camera at $46, a mouse at $0.20). A product priced below
// 15% of the median price of its product type (types with 5+ products) is
// "flagged": a NEW flagged product is imported hidden (unpublished), an
// existing one keeps its current site price. All flagged rows are written to
// mplus-suspicious-prices.csv next to the price list, for the supplier. When a
// later price list fixes the price, the product is updated and published.
//
// Price on the site = РРЦ in USD × rate × (1 + markup/100), rounded to a whole
// hryvnia. РРЦ is the supplier's recommended retail price; when a row has no
// РРЦ the "Цена" column is used instead.
//
// Re-running with a newer price list is the intended way to keep prices and
// availability current: products are matched by the supplier's article
// number (products.supplier / supplier_sku, migration 0011), so a re-run
// updates the price and stock of products it already created and adds new
// ones. It never overwrites names, descriptions, photos or categories you
// edited in the admin panel. Supplier products missing from the new file
// are marked "out of stock" (not deleted — past orders still reference them).
//
// Requires migrations 0011 and 0012 and DATABASE_URL (read from the environment or from
// ./.env). Catalog pages are prerendered at build time, so after an import run
// `npm run build && systemctl restart holotech` for the changes to show.

import { readFileSync, existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import zlib from "zlib";
import { StringDecoder } from "string_decoder";
import postgres from "postgres";

const SUPPLIER = "mplus";

// Supplier section ("Раздел") -> how to place it in our catalog. A section
// matches an entry when it equals it or starts with it + "/". The most
// specific (longest) entry wins. Sections that match nothing — smartphones,
// tablets, phone accessories, trade-in — are not imported.
const SECTIONS = {
  // Energy range (original categories)
  "Поповнюй заряд/Портативні зарядні станції": "energy",
  "Поповнюй заряд/PowerBank": "accessories",
  "Поповнюй заряд/Елементи живлення": "accessories",
  // Electronics range (categories from migration 0012)
  "Фото, відео, аудіо": "audio-video",
  "Побутова техніка": "home-appliances",
  "Ноутбуки і компʼютерна техніка": "computers",
  "Смарт-гаджети": "smart-gadgets",
  "Товари для дому": "smart-gadgets",
  "Годинники, трекери та аксесуари": "watches",
  "Техніка Apple": "apple",
  "ТВ, монітори, проектори": "tv-monitors",
  "Гральна зона": "gaming",
};
const SECTION_KEYS = Object.keys(SECTIONS).sort((a, b) => b.length - a.length);

function sectionKind(section) {
  const key = SECTION_KEYS.find((k) => section === k || section.startsWith(`${k}/`));
  return key ? SECTIONS[key] : null;
}

/** "Побутова техніка/Техніка для кухні/Чайники" -> section "Техніка для
 *  кухні", type "Чайники". Two-level paths use the same value for both. The
 *  supplier files smartwatches by brand ("Смарт-годинники/Garmin"); the
 *  brand is already a filter, so the type stays "Смарт-годинники". */
function groupingFor(section) {
  const parts = section.split("/").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return { subcategory: null, productType: null };
  const subcategory = parts[1];
  const productType = parts.length >= 3 && subcategory !== "Смарт-годинники" ? parts[parts.length - 1] : subcategory;
  return { subcategory, productType };
}

// The supplier's "charging stations" section also carries inverters,
// add-on batteries and similar gear — route those by name.
function categoryFor(kind, name) {
  if (kind !== "energy") return kind;
  if (/станці|station/i.test(name)) return "stations";
  // Battery before inverter: "Батарея для ДБЖ/інвертора" is a battery.
  if (/батаре|акумулятор|аккумулятор|battery/i.test(name)) return "batteries";
  if (/інвертор|инвертор|inverter/i.test(name)) return "inverters";
  if (/сонячн|солнечн|solar/i.test(name)) return "solar-panels";
  return "accessories";
}

// Brands the supplier sometimes leaves blank; matched against the product name.
const EXTRA_BRANDS = [
  "EcoFlow", "Bluetti", "Jackery", "Anker", "Oukitel", "BanderaPower", "ABOK", "Deye", "DJI",
  "Fossibot", "Blackview", "Romoss", "PolyGold", "Momax", "Proove", "Baseus", "Xiaomi", "Ugreen",
  "Hoco", "Belkin", "Sigma", "Trust", "Intenso", "Hama", "WIWU", "Choetech", "Zendure", "Allpowers",
];

/* --- CLI ----------------------------------------------------------------- */

function parseArgs(argv) {
  const opts = { file: null, dryRun: false, rate: null, markup: 0, images: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--no-images") opts.images = false;
    else if (a === "--rate") opts.rate = Number(String(argv[++i]).replace(",", "."));
    else if (a === "--markup") opts.markup = Number(String(argv[++i]).replace(",", "."));
    else if (!a.startsWith("--") && !opts.file) opts.file = a;
    else fail(`Unknown argument: ${a}`);
  }
  if (!opts.file) fail("Usage: node scripts/import-mplus.mjs <file.xlsx> [--dry-run] [--rate 41.5] [--markup 0] [--no-images]");
  if (!existsSync(opts.file)) fail(`File not found: ${opts.file}`);
  if (opts.rate !== null && !(opts.rate > 0)) fail("--rate must be a positive number");
  if (!(opts.markup >= 0)) fail("--markup must be a number >= 0");
  return opts;
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

/** Loads KEY=VALUE pairs from ./.env into process.env (without overriding). */
function loadDotEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

/* --- Exchange rate ------------------------------------------------------- */

async function fetchNbuRate() {
  const url = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`NBU responded ${res.status}`);
  const data = await res.json();
  const rate = Number(data?.[0]?.rate);
  if (!(rate > 0)) throw new Error("NBU response has no USD rate");
  return { rate, date: data[0].exchangedate };
}

/* --- Spreadsheet --------------------------------------------------------- */

// A minimal .xlsx reader (an .xlsx is a zip of XML files). Written in-house
// because exceljs's streaming reader decodes each compressed chunk to text
// separately and corrupts Cyrillic letters that straddle a chunk boundary
// (~2% of rows in this price list), while its non-streaming reader needs
// ~1.5 GB of RAM for this file. This one inflates the worksheet as a stream,
// decodes UTF-8 with a StringDecoder (boundary-safe) and parses one <row> at
// a time, so memory stays small. Supports inline strings and the shared
// strings table; numbers are returned as their raw text.

/** Lists zip entries from the central directory: name -> {method, offset, size}. */
function zipEntries(buf) {
  const minEocd = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= minEocd; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) fail("not a valid .xlsx file (zip directory not found)");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) fail("not a valid .xlsx file (corrupt zip directory)");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    entries.set(name, { method, data: buf.subarray(dataStart, dataStart + compSize) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Yields an entry's content as correctly decoded text chunks. */
async function* entryText(entry) {
  const decoder = new StringDecoder("utf8");
  if (entry.method === 0) {
    yield decoder.write(entry.data) + decoder.end();
    return;
  }
  if (entry.method !== 8) fail(`unsupported compression method ${entry.method} in .xlsx`);
  const inflate = zlib.createInflateRaw();
  inflate.end(entry.data);
  for await (const chunk of inflate) yield decoder.write(chunk);
  const rest = decoder.end();
  if (rest) yield rest;
}

const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function xmlText(s) {
  return s
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
      e[0] === "#"
        ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
        : XML_ENTITIES[e] ?? m
    )
    // Excel escapes control characters as _xHHHH_
    .replace(/_x([0-9a-f]{4})_/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/** Concatenated text of every <t> element in an XML fragment (rich text runs). */
function joinT(fragment) {
  let out = "";
  for (const m of fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) out += m[1] ?? "";
  return xmlText(out);
}

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Yields each worksheet row of the first sheet as an array of cell strings. */
async function* xlsxRows(file) {
  const entries = zipEntries(readFileSync(file));
  const sheetName =
    [...entries.keys()].filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }))[0];
  if (!sheetName) fail("no worksheet found in the .xlsx file");

  const shared = [];
  const ss = entries.get("xl/sharedStrings.xml");
  if (ss) {
    let xml = "";
    for await (const t of entryText(ss)) xml += t;
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(joinT(m[1].replace(/<rPh[\s\S]*?<\/rPh>/g, "")));
  }

  let pending = "";
  for await (const text of entryText(entries.get(sheetName))) {
    pending += text;
    let from = 0;
    for (;;) {
      const open = pending.indexOf("<row", from);
      if (open < 0) break;
      const selfClose = pending.indexOf("/>", open);
      const gt = pending.indexOf(">", open);
      if (gt < 0) break;
      if (selfClose >= 0 && selfClose + 1 === gt) {
        yield [];
        from = gt + 1;
        continue;
      }
      const close = pending.indexOf("</row>", gt);
      if (close < 0) break;
      const body = pending.slice(gt + 1, close);
      const cells = [];
      for (const c of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1];
        const ref = attrs.match(/\br="([A-Z]+)\d+"/);
        const type = (attrs.match(/\bt="(\w+)"/) ?? [])[1];
        const inner = c[2] ?? "";
        let value;
        if (type === "inlineStr") value = joinT(inner);
        else {
          const v = (inner.match(/<v>([\s\S]*?)<\/v>/) ?? [])[1] ?? "";
          value = type === "s" ? shared[Number(v)] ?? "" : xmlText(v);
        }
        cells[ref ? colIndex(ref[1]) : cells.length] = value.trim();
      }
      yield Array.from(cells, (v) => v ?? "");
      from = close + 6;
    }
    pending = pending.slice(from);
  }
}

/** Reads the first worksheet and returns rows of the wanted sections as
 *  plain objects keyed by the header row. */
async function readSupplierRows(file) {
  const rows = [];
  let total = 0;
  let header = null;
  for await (const values of xlsxRows(file)) {
    if (!header) {
      header = values;
      for (const col of ["Артикул", "Раздел", "Цена", "Валюта"]) {
        if (!header.includes(col)) fail(`Column "${col}" not found — is this the mplus price list?`);
      }
      continue;
    }
    if (values.every((v) => !v)) continue;
    total++;
    const rec = {};
    header.forEach((h, i) => {
      if (h) rec[h] = values[i] ?? "";
    });
    if (sectionKind(rec["Раздел"])) rows.push(rec);
  }
  return { rows, total };
}

/* --- Mapping helpers ----------------------------------------------------- */

const UK_TRANSLIT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i",
  ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e",
  ё: "e", ъ: "",
};

function slugify(name, sku) {
  const base = name
    .toLowerCase()
    .split("")
    .map((ch) => UK_TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return `${base || "product"}-${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

const ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", mdash: "—", ndash: "–",
  laquo: "«", raquo: "»", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  bull: "•", deg: "°", times: "×", middot: "·", plusmn: "±", trade: "™", reg: "®", copy: "©",
};

/** Supplier descriptions are HTML; the storefront shows plain text with
 *  line breaks preserved. Bullets become "• ", blocks become paragraphs. */
function htmlToText(html) {
  if (!html) return "";
  let s = String(html)
    .replace(/<h[1-6][^>]*>\s*(Опис товару|Описание товара)\s*<\/h[1-6]>/gi, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
  s = s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

function num(s) {
  return Number(String(s).replace(/\s/g, "").replace(",", "."));
}

/** Pulls power (W), capacity (Wh / mAh), LiFePO4 and UPS out of the product
 *  name — the price list has no separate spec columns for these. */
function specsFromName(name) {
  const specs = {};
  let rest = name;

  // Capacity spellings seen in the price list: 268WH, 2048Wh, 1.5kWh,
  // "1024 Вт·год", "768 Вт·г", "2304 Вт-ч", "245 Вт/ч", "2073 Вт*год".
  const kwh = rest.match(/(\d+(?:[.,]\d+)?)\s*kwh\b/i);
  const wh = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:wh\b|вт\s*[·*\-\/]?\s*(?:год|г|ч)(?![a-zа-яіїєґ])|втг(?![a-zа-яіїєґ]))/i);
  if (kwh) {
    specs.capacity_wh = Math.round(num(kwh[1]) * 1000);
    rest = rest.replace(kwh[0], " ");
  } else if (wh) {
    specs.capacity_wh = Math.round(num(wh[1]));
    rest = rest.replace(wh[0], " ");
  }

  const kw = rest.match(/(\d+(?:[.,]\d+)?)\s*kw\b/i);
  const w = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:w|вт)(?![a-zа-яіїєґ])/i);
  const watts = kw ? num(kw[1]) * 1000 : w ? num(w[1]) : null;
  // power_w is an integer column; "22.5W" goes into the extra specs as-is
  // instead of being shown rounded to a wrong "23 W".
  if (watts !== null && Number.isInteger(watts)) specs.power_w = watts;
  else if (watts !== null) specs.power_fraction = watts;

  const mah = name.match(/(\d{3,6})\s*mah\b/i);
  if (mah) specs.mah = Number(mah[1]);
  else {
    const ah = name.match(/(\d+(?:[.,]\d+)?)\s*ah\b/i);
    if (ah) specs.capacity_ah = num(ah[1]);
  }
  const volts = name.match(/(\d+(?:[.,]\d+)?)\s*v\b/i);
  if (volts) specs.voltage_v = num(volts[1]);

  if (/lifepo4/i.test(name)) {
    specs.is_lifepo4 = true;
    specs.battery_type = "LiFePO4";
  }
  if (/\bups\b|дбж/i.test(name)) specs.has_ups = true;
  return specs;
}

function photoUrls(rec) {
  return [rec["Фото"], rec["Галерея"]]
    .join(";")
    .split(/[;\s,]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/(www\.)?mplus\.com\.ua\//i.test(u))
    .slice(0, 5);
}

function makeBrandMatcher(rows) {
  const names = new Set(EXTRA_BRANDS);
  for (const r of rows) if (r["Бренд"]) names.add(r["Бренд"]);
  const list = [...names].filter((n) => n.length >= 2).sort((a, b) => b.length - a.length);
  return (rec) => {
    if (rec["Бренд"]) return rec["Бренд"];
    const name = rec["Название модификации (UA)"] || rec["Название (UA)"];
    for (const b of list) {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu");
      if (re.test(name)) return b;
    }
    return "";
  };
}

/** Turns supplier rows into catalog-ready items. */
function buildItems(rows, rate, markup) {
  const brandOf = makeBrandMatcher(rows);
  const items = [];
  const skipped = [];
  const seen = new Set();
  for (const rec of rows) {
    const sku = rec["Артикул"];
    const name = (rec["Название модификации (UA)"] || rec["Название (UA)"]).replace(/\s+/g, " ").trim();
    // Retail price basis: РРЦ (recommended retail), falling back to "Цена".
    const rrc = num(rec["РРЦ"] ?? "");
    const usd = rrc > 0 ? rrc : num(rec["Цена"]);
    if (!sku || !name) {
      skipped.push(`${sku || "?"}: no article or name`);
      continue;
    }
    if (seen.has(sku)) {
      skipped.push(`${sku}: duplicate article`);
      continue;
    }
    seen.add(sku);
    if ((rec["Валюта"] || "USD").toUpperCase() !== "USD") {
      skipped.push(`${sku}: currency ${rec["Валюта"]} (only USD supported)`);
      continue;
    }
    if (!(usd > 0)) {
      skipped.push(`${sku}: price is 0`);
      continue;
    }
    const specs = specsFromName(name);
    const extra = [];
    if (specs.power_fraction) {
      extra.push({
        key: "power",
        labelUk: "Потужність",
        labelEn: "Power",
        valueUk: `${String(specs.power_fraction).replace(".", ",")} Вт`,
        valueEn: `${specs.power_fraction} W`,
      });
    }
    if (specs.mah) {
      extra.push({
        key: "capacity-mah",
        labelUk: "Ємність",
        labelEn: "Capacity",
        valueUk: `${specs.mah.toLocaleString("uk-UA")} мА·год`,
        valueEn: `${specs.mah.toLocaleString("en-US")} mAh`,
      });
    }
    items.push({
      sku,
      name,
      category: categoryFor(sectionKind(rec["Раздел"]), name),
      ...groupingFor(rec["Раздел"]),
      brand: brandOf(rec),
      usd,
      price: Math.round(usd * rate * (1 + markup / 100)),
      inStock: /наявн|наличи|in stock/i.test(rec["Наличие"] || "В наявності"),
      description: htmlToText(rec["Описание товара (UA)"]),
      photos: photoUrls(rec),
      slug: slugify(name, sku),
      specs,
      extra,
    });
  }
  return { items, skipped };
}

/* --- Price sanity check ------------------------------------------------- */

const SUSPICIOUS_RATIO = 0.15;
const MIN_GROUP = 5;

function median(values) {
  const v = [...values].sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Marks items priced far below the median of their product type. */
function flagSuspiciousPrices(items) {
  const groups = new Map();
  for (const it of items) {
    const key = it.productType ?? `category:${it.category}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it.usd);
  }
  const medians = new Map();
  for (const [key, prices] of groups) if (prices.length >= MIN_GROUP) medians.set(key, median(prices));
  for (const it of items) {
    const med = medians.get(it.productType ?? `category:${it.category}`);
    it.typeMedianUsd = med ?? null;
    it.flagged = med !== undefined && it.usd < med * SUSPICIOUS_RATIO;
  }
  return items.filter((it) => it.flagged);
}

async function writeSuspiciousCsv(file, flagged, rate) {
  const out = path.join(path.dirname(path.resolve(file)), "mplus-suspicious-prices.csv");
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Артикул", "Назва", "Розділ", "Тип", "Ціна постачальника, USD", "Медіана типу, USD", "Ціна на сайті була б, грн"].map(q).join(";"),
    ...flagged.map((it) =>
      [it.sku, it.name, it.subcategory, it.productType, it.usd, it.typeMedianUsd?.toFixed(2), Math.round(it.usd * rate)].map(q).join(";")
    ),
  ];
  await writeFile(out, "\uFEFF" + lines.join("\r\n") + "\r\n");
  return out;
}

/* --- Images -------------------------------------------------------------- */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function sniffImageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 12) === "ftypavif") return "avif";
  return null;
}

/** Downloads one supplier photo into PRODUCT_IMAGES_DIR under a random UUID
 *  name (same scheme as src/lib/storage/local.ts) and returns its app URL,
 *  or null if the download failed or the file isn't a supported image. */
async function downloadImage(url, dir) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
    const ext = sniffImageExt(buf);
    if (!ext) return null;
    const filename = `${randomUUID()}.${ext}`;
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf, { mode: 0o644 });
    return `/api/storage/products/${filename}`;
  } catch {
    return null;
  }
}

/* --- Main ---------------------------------------------------------------- */

// Products processed in parallel (each may download a photo). Keeps a few
// thousand photos to minutes instead of the better part of an hour.
const CONCURRENCY = 4;

async function runPool(list, size, fn) {
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const item = list[next++];
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, list.length) }, worker));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  loadDotEnv();

  let rate = opts.rate;
  let rateNote = "set manually with --rate";
  if (rate === null) {
    try {
      const nbu = await fetchNbuRate();
      rate = nbu.rate;
      rateNote = `NBU rate for ${nbu.date}`;
    } catch (err) {
      fail(`could not get the NBU exchange rate (${err.message}). Re-run with --rate <UAH per USD>.`);
    }
  }

  console.log(`Reading ${opts.file} ...`);
  const { rows, total } = await readSupplierRows(opts.file);
  const { items, skipped } = buildItems(rows, rate, opts.markup);

  console.log(`\nPrice list rows: ${total}; in imported sections: ${rows.length}; ready to import: ${items.length}; skipped: ${skipped.length}`);
  console.log(`Rate: ${rate} UAH/USD (${rateNote}); markup over РРЦ: ${opts.markup}%  ->  price = РРЦ USD × ${rate}${opts.markup ? ` × ${1 + opts.markup / 100}` : ""}`);
  const byCat = {};
  for (const it of items) byCat[it.category] = (byCat[it.category] ?? 0) + 1;
  console.log("By category:", byCat);
  console.log(`With photos: ${items.filter((i) => i.photos.length).length}; with description: ${items.filter((i) => i.description).length}; with brand: ${items.filter((i) => i.brand).length}`);
  if (skipped.length) console.log("Skipped:\n  " + skipped.slice(0, 20).join("\n  ") + (skipped.length > 20 ? `\n  … and ${skipped.length - 20} more` : ""));

  const flagged = flagSuspiciousPrices(items);
  if (flagged.length) {
    const csv = await writeSuspiciousCsv(opts.file, flagged, rate);
    console.log(`\nSuspicious prices: ${flagged.length} products cost less than ${SUSPICIOUS_RATIO * 100}% of their type's median.`);
    console.log(`New ones are imported HIDDEN; existing ones keep their current price. Full list: ${csv}`);
    for (const it of flagged.slice(0, 10)) console.log(`  ! $${it.usd} (type median $${it.typeMedianUsd?.toFixed(0)}) ${it.name.slice(0, 70)}`);
  }

  if (opts.dryRun) {
    console.log("\nSample (dry run — nothing written):");
    for (const it of items.slice(0, 25)) {
      const sp = [it.specs.power_w && `${it.specs.power_w} W`, it.specs.power_fraction && `${it.specs.power_fraction} W*`, it.specs.capacity_wh && `${it.specs.capacity_wh} Wh`, it.specs.mah && `${it.specs.mah} mAh`].filter(Boolean).join(", ");
      console.log(`  [${it.category}] ${it.name} | ${it.brand || "—"} | $${it.usd} -> ${it.price} ₴${sp ? ` | ${sp}` : ""}`);
    }
    return;
  }

  if (!process.env.DATABASE_URL) fail("DATABASE_URL is not set (and ./.env has none). Run from the project directory.");
  const sql = postgres(process.env.DATABASE_URL, { max: CONCURRENCY + 1, connect_timeout: 10, onnotice: () => {} });
  const imagesDir = path.resolve(process.cwd(), process.env.PRODUCT_IMAGES_DIR || "./storage/products");

  try {
    const [{ has }] = await sql`
      select exists (
        select 1 from information_schema.columns
        where table_name = 'products' and column_name = 'supplier_sku'
      ) as has`;
    if (!has) fail("migration 0011 is not applied. Run: sudo -u postgres psql -d holotech -f migrations/0011_supplier_import.sql");
    const [{ has12 }] = await sql`
      select exists (
        select 1 from information_schema.columns
        where table_name = 'products' and column_name = 'product_type'
      ) as has12`;
    if (!has12) fail("migration 0012 is not applied. Run: sudo -u postgres psql -d holotech -f migrations/0012_electronics_categories.sql");

    const cats = await sql`select id, slug from categories`;
    const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    for (const c of Object.keys(byCat)) if (!catId[c]) fail(`category "${c}" does not exist in the database`);

    const brandIds = new Map((await sql`select id, name from brands`).map((b) => [b.name.toLowerCase(), b.id]));
    async function brandId(name) {
      if (!name) return null;
      const key = name.toLowerCase();
      if (brandIds.has(key)) return brandIds.get(key);
      const [row] = await sql`
        insert into brands (name) values (${name})
        on conflict (name) do update set name = excluded.name
        returning id`;
      brandIds.set(key, row.id);
      return row.id;
    }

    const [{ now: runStart }] = await sql`select now()`;
    let created = 0, updated = 0, photos = 0, failed = 0, repaired = 0;

    let done = 0;
    await runPool(items, CONCURRENCY, async (it) => {
      try {
        const [existing] = await sql`
          select p.id, p.images, p.name_uk, p.description_uk, b.name as brand_name
          from products p left join brands b on b.id = p.brand_id
          where p.supplier = ${SUPPLIER} and p.supplier_sku = ${it.sku}`;

        let images = null;
        if (opts.images && it.photos.length && (!existing || existing.images.length === 0)) {
          images = [];
          for (const url of it.photos) {
            const saved = await downloadImage(url, imagesDir);
            if (saved) images.push(saved);
          }
          photos += images.length;
        }

        if (existing) {
          // Repair text broken by the old exceljs-based reader ("�" = U+FFFD).
          // Such text can't be an admin edit, so it is safe to replace.
          const broken = (v) => typeof v === "string" && v.includes("\uFFFD");
          const fixName = broken(existing.name_uk) ? it.name : null;
          const fixDescription = broken(existing.description_uk) ? it.description : null;
          const fixBrand = broken(existing.brand_name) ? await brandId(it.brand) : null;
          if (fixName || fixDescription || fixBrand) repaired++;
          await sql`
            update products set
              name_uk = coalesce(${fixName}, name_uk),
              name_en = coalesce(${fixName}, name_en),
              description_uk = coalesce(${fixDescription}, description_uk),
              description_en = coalesce(${fixDescription}, description_en),
              brand_id = coalesce(${fixBrand}::uuid, brand_id),
              -- a flagged (implausible) supplier price never replaces the site price
              price = case when ${it.flagged} then price else ${it.price} end,
              -- hidden only because of an earlier flag, and the price is sane now -> publish
              is_published = case when not ${it.flagged} and supplier_price_flagged then true else is_published end,
              supplier_price_flagged = ${it.flagged},
              in_stock = ${it.inStock},
              supplier_price_usd = ${it.usd},
              subcategory = ${it.subcategory},
              product_type = ${it.productType},
              supplier_synced_at = now(),
              images = case when cardinality(images) = 0 and ${images ?? []}::text[] <> '{}' then ${images ?? []}::text[] else images end,
              updated_at = now()
            where id = ${existing.id}`;
          updated++;
        } else {
          let slug = it.slug;
          const [taken] = await sql`select 1 from products where slug = ${slug}`;
          if (taken) slug = `${slug}-mp`;
          const s = it.specs;
          await sql`
            insert into products (
              slug, category_id, brand_id, name_uk, name_en, description_uk, description_en,
              price, in_stock, power_w, capacity_wh, voltage_v, capacity_ah, battery_type, is_lifepo4, has_ups,
              extra_specs, images, is_published, supplier_price_flagged, subcategory, product_type,
              supplier, supplier_sku, supplier_price_usd, supplier_synced_at
            ) values (
              ${slug}, ${catId[it.category]}, ${await brandId(it.brand)}, ${it.name}, ${it.name},
              ${it.description}, ${it.description},
              ${it.price}, ${it.inStock}, ${s.power_w ?? null}, ${s.capacity_wh ?? null},
              ${s.voltage_v ?? null}, ${s.capacity_ah ?? null},
              ${s.battery_type ?? null}, ${s.is_lifepo4 ?? null}, ${s.has_ups ?? null},
              ${sql.json(it.extra)}, ${images ?? []}::text[], ${!it.flagged}, ${it.flagged}, ${it.subcategory}, ${it.productType},
              ${SUPPLIER}, ${it.sku}, ${it.usd}, now()
            )`;
          created++;
        }
      } catch (err) {
        failed++;
        console.error(`  ! ${it.sku} ${it.name}: ${err.message}`);
      }
      done++;
      if (done % 100 === 0) console.log(`  … ${done}/${items.length}`);
    });

    // Supplier products that were not in this price list -> out of stock.
    // Skipped entirely if nothing was imported (wrong/empty file), so a bad
    // run can never take the whole supplier range off sale.
    let deactivated = 0;
    if (created + updated > 0) {
      const res = await sql`
        update products set in_stock = false, updated_at = now()
        where supplier = ${SUPPLIER} and in_stock = true
          and (supplier_synced_at is null or supplier_synced_at < ${runStart})`;
      deactivated = res.count;
    }

    console.log(`\nDone. Created: ${created}; updated: ${updated} (text repaired: ${repaired}); photos downloaded: ${photos}; marked out of stock: ${deactivated}; errors: ${failed}`);
    console.log("Now rebuild so the catalog pages pick up the changes:\n  npm run build && systemctl restart holotech");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
