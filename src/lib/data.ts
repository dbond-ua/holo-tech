import type {
  BaseProduct,
  CategorySlug,
  KitProduct,
  Localized,
  LocalizedList,
  Review,
} from "./types";

/**
 * DEMO DATA
 * ---------
 * All products, prices, availability and part of the technical specifications
 * in this file are for storefront demonstration purposes. Where possible the
 * numbers are based on real public specs of the named models, but they must
 * be checked against the manufacturer/supplier before real-world use.
 * Text content (name/tagline/description/whatsIncluded/features) is fully
 * localized for "uk" and "en"; shared technical fields (power, capacity,
 * cycles, etc.) live once as typed values and are rendered per-locale via
 * `buildSpecs()` in `src/lib/specs.ts`.
 */
export const IS_DEMO_DATA = true;

/** The original energy range — header category row, homepage mosaic. */
export const energyCategorySlugs: CategorySlug[] = [
  "stations",
  "inverters",
  "batteries",
  "solar-panels",
  "kits",
  "accessories",
];

/** Electronics range added with the supplier import. Served by the generic
 *  src/app/(shop)/[locale]/[category] routes. */
export const electronicsCategorySlugs: CategorySlug[] = [
  "audio-video",
  "home-appliances",
  "computers",
  "smart-gadgets",
  "watches",
  "apple",
  "tv-monitors",
  "gaming",
];

export const categorySlugs: CategorySlug[] = [...energyCategorySlugs, ...electronicsCategorySlugs];

export const brands = [
  { name: "EcoFlow", categories: ["stations", "solar-panels", "accessories"] },
  { name: "OUKITEL", categories: ["stations", "accessories"] },
  { name: "Bluetti", categories: ["stations", "solar-panels", "accessories"] },
  { name: "Anker SOLIX", categories: ["stations", "solar-panels", "accessories"] },
  { name: "Jackery", categories: ["stations", "solar-panels", "accessories"] },
  { name: "Zendure", categories: ["stations"] },
  { name: "Deye", categories: ["inverters"] },
  { name: "Growatt", categories: ["inverters"] },
  { name: "Victron Energy", categories: ["inverters"] },
  { name: "Pylontech", categories: ["batteries"] },
] as const;

export const brandLogos = [
  "EcoFlow",
  "OUKITEL",
  "Bluetti",
  "Anker SOLIX",
  "Jackery",
  "Zendure",
  "Deye",
  "Growatt",
  "Victron Energy",
  "Pylontech",
];

function reviews(list: Array<Omit<Review, "id">>, productId: string): Review[] {
  return list.map((r, i) => ({ ...r, id: `${productId}-r${i + 1}` }));
}
function L(uk: string, en: string): Localized {
  return { uk, en };
}
function LL(uk: string[], en: string[]): LocalizedList {
  return { uk, en };
}

/* ------------------------------------------------------------------ */
/* Power stations                                                      */
/* ------------------------------------------------------------------ */

export const stations: BaseProduct[] = [
  {
    id: "st-ecoflow-delta2",
    slug: "ecoflow-delta-2",
    category: "stations",
    brand: "EcoFlow",
    name: L("EcoFlow DELTA 2", "EcoFlow DELTA 2"),
    tagline: L(
      "Компактна станція для дому та подорожей",
      "A compact station for home and travel"
    ),
    price: 34999,
    oldPrice: 39999,
    rating: 4.8,
    reviewsCount: 214,
    inStock: true,
    stockCount: 12,
    isBestseller: true,
    images: 4,
    powerW: 1800,
    capacityWh: 1024,
    outlets: 11,
    chargeTimeH: 1.1,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 12,
    description: L(
      "EcoFlow DELTA 2 — компактна зарядна станція на LiFePO4-акумуляторі, яка заряджається від 0 до 80% усього за 50 хвилин. Підходить для резерву вдома під час відключень світла, роботи невеликої техніки та поїздок.",
      "EcoFlow DELTA 2 is a compact LiFePO4 power station that charges from 0 to 80% in just 50 minutes. Great as a home backup during outages, for running small appliances, and for trips."
    ),
    whatsIncluded: LL(
      ["Зарядна станція EcoFlow DELTA 2", "Кабель живлення AC", "Автомобільний кабель зарядки", "Короткий посібник користувача"],
      ["EcoFlow DELTA 2 power station", "AC power cable", "Car charging cable", "Quick start guide"]
    ),
    features: LL(
      ["Заряд до 80% за 50 хвилин", "6000+ циклів до 80% ємності", "Керування через застосунок", "Функція ІБП (UPS) — перемикання < 20 мс"],
      ["0-80% charge in 50 minutes", "6000+ cycles to 80% capacity", "App control", "UPS function — switchover < 20 ms"]
    ),
    reviews: reviews(
      [
        { author: "Олександр К.", rating: 5, date: "2026-06-14", text: "Взяв для дому на час відключень — тримає холодильник і роутер весь вечір без проблем. Заряджається дуже швидко.", verified: true },
        { author: "Марина Т.", rating: 4, date: "2026-05-02", text: "Відмінна станція, але хотілося б трохи більше виходів USB-C. У решті повністю задоволена.", verified: true },
      ],
      "st-ecoflow-delta2"
    ),
  },
  {
    id: "st-ecoflow-delta2max",
    slug: "ecoflow-delta-2-max",
    category: "stations",
    brand: "EcoFlow",
    name: L("EcoFlow DELTA 2 Max", "EcoFlow DELTA 2 Max"),
    tagline: L("Більше ємності для дому та невеликого бізнесу", "More capacity for home and small business"),
    price: 54999,
    oldPrice: 61999,
    rating: 4.9,
    reviewsCount: 178,
    inStock: true,
    stockCount: 8,
    isBestseller: true,
    expandable: true,
    images: 4,
    powerW: 2400,
    capacityWh: 2048,
    outlets: 12,
    chargeTimeH: 1.3,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 23,
    description: L(
      "EcoFlow DELTA 2 Max — розширена версія DELTA 2 з ємністю 2048 Втг. Здатна живити більшість побутової техніки і легко розширюється додатковими батареями для збільшення автономності.",
      "EcoFlow DELTA 2 Max is an extended version of the DELTA 2 with a 2048 Wh capacity. It can run most home appliances and easily expands with extra batteries for more autonomy."
    ),
    whatsIncluded: LL(
      ["Зарядна станція EcoFlow DELTA 2 Max", "Кабель живлення AC", "Автомобільний кабель зарядки", "Короткий посібник користувача"],
      ["EcoFlow DELTA 2 Max power station", "AC power cable", "Car charging cable", "Quick start guide"]
    ),
    features: LL(
      ["Розширення ємності додатковими батареями", "Заряд до 80% за 65 хвилин", "Потужність до 3400 Вт з X-Boost", "Тиха робота — до 30 дБ"],
      ["Expandable with extra batteries", "0-80% charge in 65 minutes", "Up to 3400 W with X-Boost", "Quiet operation — down to 30 dB"]
    ),
    reviews: reviews(
      [
        { author: "Дмитро П.", rating: 5, date: "2026-04-21", text: "Для дому з котлом і холодильником — ідеальний баланс ємності та потужності. Рекомендую.", verified: true },
        { author: "Ірина С.", rating: 5, date: "2026-03-10", text: "Працює вже пів року, жодного нарікання. Застосунок зручний, видно витрати у реальному часі." },
      ],
      "st-ecoflow-delta2max"
    ),
  },
  {
    id: "st-ecoflow-deltapro3",
    slug: "ecoflow-delta-pro-3",
    category: "stations",
    brand: "EcoFlow",
    name: L("EcoFlow DELTA Pro 3", "EcoFlow DELTA Pro 3"),
    tagline: L("Домашня енергосистема з розширенням до 24 кВтг", "A home energy system expandable to 24 kWh"),
    price: 129999,
    rating: 4.9,
    reviewsCount: 96,
    inStock: true,
    stockCount: 5,
    isNew: true,
    expandable: true,
    images: 5,
    powerW: 4000,
    capacityWh: 4096,
    outlets: 14,
    chargeTimeH: 1.7,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 51,
    description: L(
      "EcoFlow DELTA Pro 3 — флагманська станція, яка здатна стати основою повноцінної домашньої енергосистеми. Розширюється додатковими батареями до 24 кВтг і підтримує інтеграцію із сонячними панелями та розумною панеллю керування домом.",
      "The EcoFlow DELTA Pro 3 is a flagship station that can serve as the core of a full home energy system. It expands with extra batteries up to 24 kWh and supports solar panel integration and a smart home power panel."
    ),
    whatsIncluded: LL(
      ["Зарядна станція EcoFlow DELTA Pro 3", "Кабель живлення AC", "Кабель для паралельного підключення", "Короткий посібник користувача"],
      ["EcoFlow DELTA Pro 3 power station", "AC power cable", "Parallel connection cable", "Quick start guide"]
    ),
    features: LL(
      ["Розширення до 24 кВтг", "Потужність до 4000 Вт (пік 4500 Вт)", "Інтеграція з панеллю керування домом", "Сумісність із генератором"],
      ["Expandable up to 24 kWh", "Up to 4000 W (4500 W peak)", "Integrates with a home power panel", "Generator compatible"]
    ),
    reviews: reviews(
      [
        { author: "Сергій В.", rating: 5, date: "2026-07-01", text: "Поставили як основу резервного живлення дому із сонячними панелями. Повністю закриває потреби сім'ї з чотирьох осіб.", verified: true },
      ],
      "st-ecoflow-deltapro3"
    ),
  },
  {
    id: "st-ecoflow-river2pro",
    slug: "ecoflow-river-2-pro",
    category: "stations",
    brand: "EcoFlow",
    name: L("EcoFlow RIVER 2 Pro", "EcoFlow RIVER 2 Pro"),
    tagline: L("Легка станція для щоденних завдань", "A lightweight station for everyday tasks"),
    price: 19999,
    oldPrice: 23999,
    rating: 4.7,
    reviewsCount: 302,
    inStock: true,
    stockCount: 20,
    images: 4,
    powerW: 800,
    capacityWh: 768,
    outlets: 9,
    chargeTimeH: 1.0,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: false,
    weightKg: 7.8,
    description: L(
      "EcoFlow RIVER 2 Pro — компактна й легка станція, яка вміщується в рюкзак і легко живить ноутбук, роутер, освітлення та невелику побутову техніку.",
      "The EcoFlow RIVER 2 Pro is a compact, lightweight station that fits in a backpack and easily powers a laptop, router, lighting and small appliances."
    ),
    whatsIncluded: LL(
      ["Зарядна станція EcoFlow RIVER 2 Pro", "Кабель живлення AC", "Автомобільний кабель зарядки"],
      ["EcoFlow RIVER 2 Pro power station", "AC power cable", "Car charging cable"]
    ),
    features: LL(
      ["Повний заряд за 1 годину", "Вага всього 7.8 кг", "3000+ циклів до 80% ємності", "Компактний форм-фактор"],
      ["Full charge in 1 hour", "Only 7.8 kg", "3000+ cycles to 80% capacity", "Compact form factor"]
    ),
    reviews: reviews(
      [
        { author: "Юлія М.", rating: 5, date: "2026-02-18", text: "Беру з собою на дачу та в поїздки — дуже легка, але при цьому тримає ноутбук, телефон і лампу весь вечір.", verified: true },
        { author: "Богдан Л.", rating: 4, date: "2026-01-09", text: "Хороша станція за свої гроші, єдине — немає Wi-Fi модуля, керувати можна лише через Bluetooth поруч." },
      ],
      "st-ecoflow-river2pro"
    ),
  },
  {
    id: "st-oukitel-p2001plus",
    slug: "oukitel-p2001-plus",
    category: "stations",
    brand: "OUKITEL",
    name: L("OUKITEL P2001 Plus", "OUKITEL P2001 Plus"),
    tagline: L("Вигідне рішення з великою ємністю", "Great value with a large capacity"),
    price: 38999,
    rating: 4.6,
    reviewsCount: 88,
    inStock: true,
    stockCount: 14,
    images: 4,
    powerW: 2200,
    capacityWh: 2000,
    outlets: 15,
    chargeTimeH: 1.5,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 25,
    description: L(
      "OUKITEL P2001 Plus пропонує велику ємність і безліч виходів за доступною ціною — гарний варіант для дому, гаража чи майстерні.",
      "The OUKITEL P2001 Plus offers a large capacity and plenty of outlets at an affordable price — a great fit for a home, garage or workshop."
    ),
    whatsIncluded: LL(
      ["Зарядна станція OUKITEL P2001 Plus", "Кабель живлення AC", "Автомобільний кабель зарядки", "Сонячний кабель MC4"],
      ["OUKITEL P2001 Plus power station", "AC power cable", "Car charging cable", "MC4 solar cable"]
    ),
    features: LL(
      ["15 виходів різних типів", "Подвійна зарядка: мережа + сонце", "Інформативний дисплей", "Вбудована ручка для перенесення"],
      ["15 outlets of various types", "Dual charging: grid + solar", "Informative display", "Built-in carry handle"]
    ),
    reviews: reviews(
      [
        { author: "Віталій Н.", rating: 5, date: "2026-05-27", text: "За такі гроші — дуже багато виходів і пристойна ємність. Використовую в гаражі для інструменту.", verified: true },
      ],
      "st-oukitel-p2001plus"
    ),
  },
  {
    id: "st-oukitel-p5000",
    slug: "oukitel-p5000",
    category: "stations",
    brand: "OUKITEL",
    name: L("OUKITEL P5000", "OUKITEL P5000"),
    tagline: L("Потужна станція для дому та невеликого бізнесу", "A powerful station for home and small business"),
    price: 74999,
    rating: 4.7,
    reviewsCount: 54,
    inStock: true,
    stockCount: 6,
    isNew: true,
    expandable: true,
    images: 4,
    powerW: 3000,
    capacityWh: 5120,
    outlets: 16,
    chargeTimeH: 2.0,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 58,
    description: L(
      "OUKITEL P5000 — потужна станція з ємністю 5120 Втг і піковою потужністю до 6000 Вт, здатна одночасно живити холодильник, котел, освітлення та електроінструмент.",
      "The OUKITEL P5000 is a powerful station with a 5120 Wh capacity and up to 6000 W peak output, able to run a fridge, boiler, lighting and power tools at the same time."
    ),
    whatsIncluded: LL(
      ["Зарядна станція OUKITEL P5000", "Кабель живлення AC", "Колісна база для транспортування", "Сонячний кабель MC4"],
      ["OUKITEL P5000 power station", "AC power cable", "Wheeled base for transport", "MC4 solar cable"]
    ),
    features: LL(
      ["Пікова потужність до 6000 Вт", "Розширення додатковими батареями", "Колеса та телескопічна ручка", "Робота при низьких температурах"],
      ["Up to 6000 W peak output", "Expandable with extra batteries", "Wheels and telescopic handle", "Works in low temperatures"]
    ),
    reviews: reviews(
      [
        { author: "Олег Р.", rating: 5, date: "2026-06-30", text: "Взяв для дому на час тривалих відключень — тягне холодильник, котел та освітлення одночасно кілька днів.", verified: true },
      ],
      "st-oukitel-p5000"
    ),
  },
  {
    id: "st-bluetti-ac180",
    slug: "bluetti-ac180",
    category: "stations",
    brand: "Bluetti",
    name: L("Bluetti AC180", "Bluetti AC180"),
    tagline: L("Баланс потужності та портативності", "A balance of power and portability"),
    price: 32999,
    oldPrice: 36999,
    rating: 4.7,
    reviewsCount: 121,
    inStock: true,
    stockCount: 10,
    images: 4,
    powerW: 1800,
    capacityWh: 1152,
    outlets: 13,
    chargeTimeH: 0.9,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 16,
    description: L(
      "Bluetti AC180 поєднує швидку зарядку, солідну ємність і компактні розміри — хороший вибір для квартири та частих поїздок.",
      "The Bluetti AC180 combines fast charging, solid capacity and a compact size — a good choice for an apartment and frequent trips."
    ),
    whatsIncluded: LL(
      ["Зарядна станція Bluetti AC180", "Кабель живлення AC", "Автомобільний кабель зарядки"],
      ["Bluetti AC180 power station", "AC power cable", "Car charging cable"]
    ),
    features: LL(
      ["Заряд до 80% за 45 хвилин", "13 виходів", "Робота як ІБП", "Застосунок Bluetti з віддаленим керуванням"],
      ["0-80% charge in 45 minutes", "13 outlets", "Works as a UPS", "Bluetti app with remote control"]
    ),
    reviews: reviews(
      [
        { author: "Наталя Ф.", rating: 5, date: "2026-04-05", text: "Компактна, але потужна. Тримає холодильник і частину освітлення всю ніч.", verified: true },
      ],
      "st-bluetti-ac180"
    ),
  },
  {
    id: "st-bluetti-ac200l",
    slug: "bluetti-ac200l",
    category: "stations",
    brand: "Bluetti",
    name: L("Bluetti AC200L", "Bluetti AC200L"),
    tagline: L("Універсальна станція для дому", "A versatile station for the home"),
    price: 52999,
    rating: 4.8,
    reviewsCount: 143,
    inStock: true,
    stockCount: 9,
    isBestseller: true,
    expandable: true,
    images: 4,
    powerW: 2400,
    capacityWh: 2048,
    outlets: 16,
    chargeTimeH: 1.2,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 27.5,
    description: L(
      "Bluetti AC200L — універсальна станція з великою кількістю виходів і можливістю розширення ємності, чудово підходить як основне джерело резервного живлення дому.",
      "The Bluetti AC200L is a versatile station with plenty of outlets and expandable capacity — a great fit as the primary backup power source for a home."
    ),
    whatsIncluded: LL(
      ["Зарядна станція Bluetti AC200L", "Кабель живлення AC", "Автомобільний кабель зарядки", "Сонячний кабель MC4"],
      ["Bluetti AC200L power station", "AC power cable", "Car charging cable", "MC4 solar cable"]
    ),
    features: LL(
      ["16 виходів різних типів", "Розширення додатковими батареями", "Заряд від сонця до 1200 Вт", "Кольоровий сенсорний дисплей"],
      ["16 outlets of various types", "Expandable with extra batteries", "Solar charging up to 1200 W", "Color touchscreen"]
    ),
    reviews: reviews(
      [
        { author: "Костянтин Ш.", rating: 5, date: "2026-03-22", text: "Відмінний баланс ціни та можливостей. Використовуємо як основний резерв на весь дім.", verified: true },
      ],
      "st-bluetti-ac200l"
    ),
  },
  {
    id: "st-anker-solix-f2000",
    slug: "anker-solix-f2000",
    category: "stations",
    brand: "Anker SOLIX",
    name: L("Anker SOLIX F2000", "Anker SOLIX F2000"),
    tagline: L("Надійна станція від Anker зі швидкою зарядкою", "A reliable Anker station with fast charging"),
    price: 49999,
    oldPrice: 57999,
    rating: 4.8,
    reviewsCount: 167,
    inStock: true,
    stockCount: 11,
    isBestseller: true,
    images: 4,
    powerW: 2400,
    capacityWh: 2048,
    outlets: 14,
    chargeTimeH: 1.0,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 24.6,
    description: L(
      "Anker SOLIX F2000 — станція від відомого виробника електроніки з фірмовою надійністю Anker, швидкою зарядкою та продуманим застосунком.",
      "The Anker SOLIX F2000 comes from a well-known electronics maker, with Anker's signature reliability, fast charging and a thoughtful app."
    ),
    whatsIncluded: LL(
      ["Зарядна станція Anker SOLIX F2000", "Кабель живлення AC", "Автомобільний кабель зарядки"],
      ["Anker SOLIX F2000 power station", "AC power cable", "Car charging cable"]
    ),
    features: LL(
      ["Заряд до 80% за 58 хвилин", "3000+ циклів до 80% ємності", "Система керування температурою InfiniPower", "Застосунок Anker з аналітикою споживання"],
      ["0-80% charge in 58 minutes", "3000+ cycles to 80% capacity", "InfiniPower thermal management", "Anker app with usage analytics"]
    ),
    reviews: reviews(
      [
        { author: "Ганна Д.", rating: 5, date: "2026-02-11", text: "Якість збірки на висоті, як і все в Anker. Застосунок дуже зручний.", verified: true },
      ],
      "st-anker-solix-f2000"
    ),
  },
  {
    id: "st-jackery-explorer2000plus",
    slug: "jackery-explorer-2000-plus",
    category: "stations",
    brand: "Jackery",
    name: L("Jackery Explorer 2000 Plus", "Jackery Explorer 2000 Plus"),
    tagline: L("Модульна система з розширенням ємності", "A modular system with expandable capacity"),
    price: 57999,
    rating: 4.7,
    reviewsCount: 132,
    inStock: true,
    stockCount: 7,
    expandable: true,
    images: 4,
    powerW: 3000,
    capacityWh: 2042,
    outlets: 12,
    chargeTimeH: 2.0,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 29,
    description: L(
      "Jackery Explorer 2000 Plus — модульна система, ємність якої можна нарощувати додатковими батареями до десятків кВтг, що робить її чудовою основою для зростаючих потреб дому.",
      "The Jackery Explorer 2000 Plus is a modular system whose capacity can be scaled up with extra batteries to tens of kWh, making it a great foundation for growing home needs."
    ),
    whatsIncluded: LL(
      ["Зарядна станція Jackery Explorer 2000 Plus", "Кабель живлення AC", "Автомобільний кабель зарядки"],
      ["Jackery Explorer 2000 Plus power station", "AC power cable", "Car charging cable"]
    ),
    features: LL(
      ["Розширення до 24+ кВтг додатковими батареями", "Потужність до 3000 Вт (пік 6000 Вт)", "5 способів зарядки", "10-річна гарантія за реєстрації"],
      ["Expandable to 24+ kWh with extra batteries", "Up to 3000 W (6000 W peak)", "5 charging methods", "10-year warranty on registration"]
    ),
    reviews: reviews(
      [
        { author: "Павло Г.", rating: 5, date: "2026-01-30", text: "Почав з однієї станції, за пів року докупив ще одну батарею — тепер вистачає на кілька днів автономності.", verified: true },
      ],
      "st-jackery-explorer2000plus"
    ),
  },
  {
    id: "st-zendure-superbase-v6400",
    slug: "zendure-superbase-v6400",
    category: "stations",
    brand: "Zendure",
    name: L("Zendure SuperBase V6400", "Zendure SuperBase V6400"),
    tagline: L("Енергосистема для всього дому", "A whole-home energy system"),
    price: 219999,
    rating: 4.6,
    reviewsCount: 21,
    inStock: true,
    stockCount: 3,
    isNew: true,
    isDemo: true,
    expandable: true,
    images: 4,
    powerW: 6400,
    capacityWh: 6400,
    outlets: 16,
    chargeTimeH: 2.5,
    batteryType: "LiFePO4",
    fastCharge: true,
    isLiFePO4: true,
    hasUPS: true,
    solarCharging: true,
    bluetooth: true,
    wifi: true,
    weightKg: 92,
    description: L(
      "Zendure SuperBase V6400 — потужна енергосистема, спроєктована як повноцінна заміна частини домашньої електромережі. Демонстраційна позиція каталогу з розширеними характеристиками.",
      "The Zendure SuperBase V6400 is a powerful energy system designed to fully substitute part of a home's electrical grid. A demo catalog entry with extended specifications."
    ),
    whatsIncluded: LL(
      ["Енергосистема Zendure SuperBase V6400", "Кабель живлення AC", "Комплект для підключення до щитка (проф. монтаж)"],
      ["Zendure SuperBase V6400 energy system", "AC power cable", "Panel connection kit (professional install)"]
    ),
    features: LL(
      ["Потужність до 6400 Вт", "Розширення додатковими батареями", "Паралельна робота кількох блоків", "Моніторинг через застосунок Zendure"],
      ["Up to 6400 W output", "Expandable with extra batteries", "Multiple units can run in parallel", "Monitoring via the Zendure app"]
    ),
    reviews: reviews(
      [
        { author: "Роман К.", rating: 4, date: "2026-06-02", text: "Потужна система, але потребує професійного монтажу для підключення до щитка. Працює стабільно." },
      ],
      "st-zendure-superbase-v6400"
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Inverters                                                            */
/* ------------------------------------------------------------------ */

export const inverters: BaseProduct[] = [
  {
    id: "inv-deye-5k-sg04lp1",
    slug: "deye-sun-5k-sg04lp1-eu",
    category: "inverters",
    brand: "Deye",
    name: L("Deye SUN-5K-SG04LP1-EU", "Deye SUN-5K-SG04LP1-EU"),
    tagline: L("Гібридний однофазний інвертор 5 кВт", "A 5 kW single-phase hybrid inverter"),
    price: 42999,
    rating: 4.8,
    reviewsCount: 74,
    inStock: true,
    stockCount: 15,
    isBestseller: true,
    images: 3,
    phase: "single",
    mppt: 2,
    inverterType: "hybrid",
    powerW: 5000,
    description: L(
      "Deye SUN-5K-SG04LP1-EU — популярний гібридний інвертор для домашніх систем резервного живлення з двома незалежними MPPT-трекерами та підтримкою паралельної роботи.",
      "The Deye SUN-5K-SG04LP1-EU is a popular hybrid inverter for home backup power systems, with two independent MPPT trackers and parallel-operation support."
    ),
    whatsIncluded: LL(
      ["Інвертор Deye SUN-5K-SG04LP1-EU", "Кронштейн для настінного монтажу", "Роз'єми MC4", "Посібник користувача"],
      ["Deye SUN-5K-SG04LP1-EU inverter", "Wall-mount bracket", "MC4 connectors", "User manual"]
    ),
    features: LL(
      ["Два незалежні MPPT-трекери", "Паралельна робота до 6 інверторів", "Підтримка LiFePO4 через RS485/CAN", "Вбудований Wi-Fi модуль моніторингу"],
      ["Two independent MPPT trackers", "Parallel operation of up to 6 inverters", "LiFePO4 support via RS485/CAN", "Built-in Wi-Fi monitoring module"]
    ),
    reviews: reviews(
      [
        { author: "Максим О.", rating: 5, date: "2026-05-15", text: "Стабільно працює вже рік із батареями Pylontech. Моніторинг через Wi-Fi дуже зручний.", verified: true },
      ],
      "inv-deye-5k-sg04lp1"
    ),
  },
  {
    id: "inv-deye-8k-sg01hp3",
    slug: "deye-sun-8k-sg01hp3-eu-am2",
    category: "inverters",
    brand: "Deye",
    name: L("Deye SUN-8K-SG01HP3-EU-AM2", "Deye SUN-8K-SG01HP3-EU-AM2"),
    tagline: L("Трифазний гібридний інвертор 8 кВт", "An 8 kW three-phase hybrid inverter"),
    price: 68999,
    rating: 4.8,
    reviewsCount: 41,
    inStock: true,
    stockCount: 9,
    images: 3,
    phase: "three",
    mppt: 2,
    inverterType: "hybrid",
    powerW: 8000,
    description: L(
      "Трифазний гібридний інвертор для будинків із трифазним вводом. Забезпечує рівномірне навантаження по фазах і повноцінну резервну роботу при відключенні мережі.",
      "A three-phase hybrid inverter for homes with a three-phase supply. Balances load across phases and provides full backup operation during a grid outage."
    ),
    whatsIncluded: LL(
      ["Інвертор Deye SUN-8K-SG01HP3-EU-AM2", "Кронштейн для настінного монтажу", "Роз'єми MC4", "Посібник користувача"],
      ["Deye SUN-8K-SG01HP3-EU-AM2 inverter", "Wall-mount bracket", "MC4 connectors", "User manual"]
    ),
    features: LL(
      ["Робота на трьох фазах", "Два MPPT-трекери", "Резервне живлення всього дому", "Сумісність із батареями LiFePO4"],
      ["Runs on all three phases", "Two MPPT trackers", "Backs up the whole home", "LiFePO4 battery compatible"]
    ),
    reviews: reviews(
      [
        { author: "Ігор З.", rating: 5, date: "2026-04-18", text: "Ставили на будинок зі зварюванням і верстатом — тягне без просідань. Монтажники розібралися швидко.", verified: true },
      ],
      "inv-deye-8k-sg01hp3"
    ),
  },
  {
    id: "inv-growatt-spf5000es",
    slug: "growatt-spf-5000-es",
    category: "inverters",
    brand: "Growatt",
    name: L("Growatt SPF 5000 ES", "Growatt SPF 5000 ES"),
    tagline: L("Автономний (off-grid) інвертор 5 кВт", "A 5 kW off-grid inverter"),
    price: 31999,
    rating: 4.5,
    reviewsCount: 63,
    inStock: true,
    stockCount: 18,
    images: 3,
    phase: "single",
    mppt: 1,
    inverterType: "off-grid",
    powerW: 5000,
    description: L(
      "Growatt SPF 5000 ES — доступний автономний інвертор для систем без прив'язки до мережі, добре підходить для дач, гаражів і невеликих автономних об'єктів.",
      "The Growatt SPF 5000 ES is an affordable off-grid inverter for standalone systems, well suited to cottages, garages and small independent sites."
    ),
    whatsIncluded: LL(
      ["Інвертор Growatt SPF 5000 ES", "Кронштейн для настінного монтажу", "Посібник користувача"],
      ["Growatt SPF 5000 ES inverter", "Wall-mount bracket", "User manual"]
    ),
    features: LL(
      ["Вбудований MPPT-контролер заряду", "РК-дисплей з індикацією параметрів", "Сумісність зі свинцево-кислотними та LiFePO4 батареями", "Доступна ціна входу"],
      ["Built-in MPPT charge controller", "LCD display with live parameters", "Compatible with lead-acid and LiFePO4 batteries", "Affordable entry price"]
    ),
    reviews: reviews(
      [
        { author: "Василь Т.", rating: 4, date: "2026-03-02", text: "Хороший варіант для дачі без підключення до мережі. Працює від сонячних панелей та акумулятора." },
      ],
      "inv-growatt-spf5000es"
    ),
  },
  {
    id: "inv-growatt-min6000tlx",
    slug: "growatt-min-6000tl-x",
    category: "inverters",
    brand: "Growatt",
    name: L("Growatt MIN 6000TL-X", "Growatt MIN 6000TL-X"),
    tagline: L("Мережевий інвертор 6 кВт для сонячної станції", "A 6 kW grid-tie inverter for a solar array"),
    price: 36999,
    rating: 4.6,
    reviewsCount: 39,
    inStock: true,
    stockCount: 13,
    images: 3,
    phase: "single",
    mppt: 2,
    inverterType: "grid",
    powerW: 6000,
    description: L(
      "Growatt MIN 6000TL-X — мережевий інвертор для сонячних станцій без функції резерву, оптимальний для зниження рахунків за електроенергію завдяки виробітку сонця.",
      "The Growatt MIN 6000TL-X is a grid-tie inverter for solar arrays without a backup function, ideal for cutting electricity bills through solar generation."
    ),
    whatsIncluded: LL(
      ["Інвертор Growatt MIN 6000TL-X", "Кронштейн для настінного монтажу", "Роз'єми MC4", "Посібник користувача"],
      ["Growatt MIN 6000TL-X inverter", "Wall-mount bracket", "MC4 connectors", "User manual"]
    ),
    features: LL(
      ["Два незалежні MPPT-трекери", "Компактний та легкий корпус", "Моніторинг через застосунок ShinePhone", "Високий ККД перетворення"],
      ["Two independent MPPT trackers", "Compact, lightweight housing", "Monitoring via the ShinePhone app", "High conversion efficiency"]
    ),
    reviews: reviews(
      [
        { author: "Тетяна Б.", rating: 5, date: "2026-02-27", text: "Помітно знизився рахунок за електрику після встановлення. Працює тихо і без нарікань.", verified: true },
      ],
      "inv-growatt-min6000tlx"
    ),
  },
  {
    id: "inv-victron-multiplus2-5000",
    slug: "victron-multiplus-ii-5000-48",
    category: "inverters",
    brand: "Victron Energy",
    name: L("Victron Energy MultiPlus-II 5000/48", "Victron Energy MultiPlus-II 5000/48"),
    tagline: L("Преміальний гібридний інвертор-зарядний пристрій", "A premium hybrid inverter/charger"),
    price: 79999,
    rating: 4.9,
    reviewsCount: 58,
    inStock: true,
    stockCount: 6,
    images: 3,
    phase: "single",
    mppt: 0,
    inverterType: "hybrid",
    powerW: 5000,
    description: L(
      "Victron Energy MultiPlus-II — еталон надійності серед інверторів-зарядних пристроїв. Використовується як у приватних будинках, так і в професійних енергосистемах.",
      "The Victron Energy MultiPlus-II is a benchmark for reliability among inverter/chargers, used in both private homes and professional power systems."
    ),
    whatsIncluded: LL(
      ["Інвертор-ЗП Victron MultiPlus-II 5000/48", "Кронштейн для настінного монтажу", "Посібник користувача"],
      ["Victron MultiPlus-II 5000/48 inverter/charger", "Wall-mount bracket", "User manual"]
    ),
    features: LL(
      ["PowerAssist — підсумовування потужності мережі та батареї", "Інтеграція в екосистему Victron (Cerbo GX, VRM)", "Чиста синусоїда найвищої якості", "Професійна надійність"],
      ["PowerAssist — combines grid and battery power", "Integrates with the Victron ecosystem (Cerbo GX, VRM)", "Top-quality pure sine wave", "Professional-grade reliability"]
    ),
    reviews: reviews(
      [
        { author: "Андрій Ф.", rating: 5, date: "2026-01-12", text: "Дорого, але повністю виправдовує ціну — якість і надійність на голову вищі за багато аналогів.", verified: true },
      ],
      "inv-victron-multiplus2-5000"
    ),
  },
  {
    id: "inv-deye-12k-sg04lp3",
    slug: "deye-sun-12k-sg04lp3-eu",
    category: "inverters",
    brand: "Deye",
    name: L("Deye SUN-12K-SG04LP3-EU", "Deye SUN-12K-SG04LP3-EU"),
    tagline: L("Потужний трифазний гібридний інвертор 12 кВт", "A powerful 12 kW three-phase hybrid inverter"),
    price: 119999,
    rating: 4.8,
    reviewsCount: 27,
    inStock: true,
    stockCount: 4,
    isNew: true,
    images: 3,
    phase: "three",
    mppt: 2,
    inverterType: "hybrid",
    powerW: 12000,
    description: L(
      "Deye SUN-12K-SG04LP3-EU — рішення для великих будинків та об'єктів із високим енергоспоживанням, що забезпечує повне резервування трифазної мережі.",
      "The Deye SUN-12K-SG04LP3-EU suits large homes and high-consumption sites, providing full backup for a three-phase supply."
    ),
    whatsIncluded: LL(
      ["Інвертор Deye SUN-12K-SG04LP3-EU", "Кронштейн для настінного монтажу", "Роз'єми MC4", "Посібник користувача"],
      ["Deye SUN-12K-SG04LP3-EU inverter", "Wall-mount bracket", "MC4 connectors", "User manual"]
    ),
    features: LL(
      ["Повне резервування трифазної мережі", "Два MPPT-трекери", "Паралельна робота кількох інверторів", "Сумісність із батареями через додаткове обладнання"],
      ["Full three-phase grid backup", "Two MPPT trackers", "Multiple inverters can run in parallel", "Battery compatible via extra hardware"]
    ),
    reviews: reviews(
      [
        { author: "Микола Д.", rating: 5, date: "2026-06-20", text: "Встановили на великий будинок з майстернею — тримає всі навантаження одночасно без проблем.", verified: true },
      ],
      "inv-deye-12k-sg04lp3"
    ),
  },
];

/* ------------------------------------------------------------------ */
/* LiFePO4 batteries                                                    */
/* ------------------------------------------------------------------ */

export const batteries: BaseProduct[] = [
  {
    id: "bat-pylontech-us5000",
    slug: "pylontech-us5000",
    category: "batteries",
    brand: "Pylontech",
    name: L("Pylontech US5000", "Pylontech US5000"),
    tagline: L("Модульна батарея для домашніх систем", "A modular battery for home systems"),
    price: 54999,
    rating: 4.8,
    reviewsCount: 112,
    inStock: true,
    stockCount: 22,
    isBestseller: true,
    images: 3,
    voltageV: 48,
    capacityAh: 100,
    capacityWh: 4800,
    maxCurrentA: 50,
    cycles: 6000,
    weightKg: 44,
    isLiFePO4: true,
    description: L(
      "Pylontech US5000 — один із найпоширеніших модулів LiFePO4 для гібридних систем, відомий високою надійністю та сумісністю з більшістю інверторів.",
      "The Pylontech US5000 is one of the most widely used LiFePO4 modules for hybrid systems, known for high reliability and compatibility with most inverters."
    ),
    whatsIncluded: LL(
      ["Батарейний модуль Pylontech US5000", "Комунікаційні кабелі", "Силові кабелі", "Посібник користувача"],
      ["Pylontech US5000 battery module", "Communication cables", "Power cables", "User manual"]
    ),
    features: LL(
      ["Сумісність із Deye, Growatt, Victron та ін.", "Можливість об'єднання до 16 модулів паралельно", "Вбудована система BMS", "6000 циклів заряду/розряду"],
      ["Compatible with Deye, Growatt, Victron and more", "Up to 16 modules can be combined in parallel", "Built-in BMS", "6000 charge/discharge cycles"]
    ),
    reviews: reviews(
      [
        { author: "Артем Л.", rating: 5, date: "2026-05-08", text: "Стандарт індустрії не просто так — ставиться паралельно, чудово працює з Deye.", verified: true },
      ],
      "bat-pylontech-us5000"
    ),
  },
  {
    id: "bat-pylontech-us3000c",
    slug: "pylontech-us3000c",
    category: "batteries",
    brand: "Pylontech",
    name: L("Pylontech US3000C", "Pylontech US3000C"),
    tagline: L("Компактний модуль для невеликих систем", "A compact module for smaller systems"),
    price: 38999,
    rating: 4.7,
    reviewsCount: 89,
    inStock: true,
    stockCount: 26,
    images: 3,
    voltageV: 48,
    capacityAh: 74,
    capacityWh: 3552,
    maxCurrentA: 37,
    cycles: 6000,
    weightKg: 32,
    isLiFePO4: true,
    description: L(
      "Pylontech US3000C — компактна версія популярної лінійки US-серії, зручна для поступового нарощування ємності системи невеликими кроками.",
      "The Pylontech US3000C is a compact version of the popular US-series lineup, convenient for scaling up system capacity in small increments."
    ),
    whatsIncluded: LL(
      ["Батарейний модуль Pylontech US3000C", "Комунікаційні кабелі", "Силові кабелі", "Посібник користувача"],
      ["Pylontech US3000C battery module", "Communication cables", "Power cables", "User manual"]
    ),
    features: LL(
      ["Зручне нарощування ємності модулями", "Компактні розміри", "Вбудована BMS", "Широка сумісність з інверторами"],
      ["Easy to scale capacity module by module", "Compact size", "Built-in BMS", "Broad inverter compatibility"]
    ),
    reviews: reviews(
      [
        { author: "Оксана В.", rating: 5, date: "2026-04-14", text: "Почали з двох модулів, докуповуємо за потреби. Дуже зручно.", verified: true },
      ],
      "bat-pylontech-us3000c"
    ),
  },
  {
    id: "bat-dyness-a48100",
    slug: "dyness-a48100",
    category: "batteries",
    brand: "Pylontech",
    name: L("Dyness A48100", "Dyness A48100"),
    tagline: L("Настінна батарея 48 В 100 Аг", "A 48 V 100 Ah wall-mount battery"),
    price: 52999,
    rating: 4.6,
    reviewsCount: 47,
    inStock: true,
    stockCount: 16,
    isDemo: true,
    images: 3,
    voltageV: 48,
    capacityAh: 100,
    capacityWh: 5120,
    maxCurrentA: 50,
    cycles: 6000,
    weightKg: 46,
    isLiFePO4: true,
    description: L(
      "Dyness A48100 — настінна LiFePO4 батарея зі зручним монтажем і вбудованим екраном для контролю стану системи.",
      "The Dyness A48100 is a wall-mount LiFePO4 battery with easy installation and a built-in display for monitoring system status."
    ),
    whatsIncluded: LL(
      ["Батарея Dyness A48100", "Кронштейн для настінного монтажу", "Комунікаційні та силові кабелі", "Посібник користувача"],
      ["Dyness A48100 battery", "Wall-mount bracket", "Communication and power cables", "User manual"]
    ),
    features: LL(
      ["Вбудований дисплей стану", "Настінний монтаж, економія місця", "Сумісність із популярними гібридними інверторами", "Вбудована система BMS із захистом"],
      ["Built-in status display", "Wall mounting saves floor space", "Compatible with popular hybrid inverters", "Built-in BMS with protection"]
    ),
    reviews: reviews(
      [
        { author: "Євген К.", rating: 4, date: "2026-03-19", text: "Хороша батарея, екран зручно показує рівень заряду без застосунку." },
      ],
      "bat-dyness-a48100"
    ),
  },
  {
    id: "bat-dyness-powerbox-h2",
    slug: "dyness-powerbox-h2",
    category: "batteries",
    brand: "Pylontech",
    name: L("Dyness Powerbox H2", "Dyness Powerbox H2"),
    tagline: L("Батарея підвищеної ємності для дому", "A higher-capacity battery for the home"),
    price: 99999,
    rating: 4.7,
    reviewsCount: 18,
    inStock: true,
    stockCount: 7,
    isNew: true,
    isDemo: true,
    images: 3,
    voltageV: 51.2,
    capacityAh: 200,
    capacityWh: 10240,
    maxCurrentA: 100,
    cycles: 6000,
    weightKg: 88,
    isLiFePO4: true,
    description: L(
      "Dyness Powerbox H2 — батарея збільшеної ємності для будинків із високим енергоспоживанням, що дозволяє обійтися меншою кількістю модулів.",
      "The Dyness Powerbox H2 is a higher-capacity battery for high-consumption homes, letting you use fewer modules overall."
    ),
    whatsIncluded: LL(
      ["Батарея Dyness Powerbox H2", "Кронштейн для настінного/підлогового монтажу", "Комунікаційні та силові кабелі", "Посібник користувача"],
      ["Dyness Powerbox H2 battery", "Wall/floor mount bracket", "Communication and power cables", "User manual"]
    ),
    features: LL(
      ["Збільшена ємність в одному корпусі", "Паралельне підключення до 8 батарей", "Сумісність із гібридними інверторами", "Розширена гарантія за реєстрації"],
      ["Higher capacity in a single unit", "Up to 8 batteries in parallel", "Hybrid inverter compatible", "Extended warranty on registration"]
    ),
    reviews: reviews(
      [
        { author: "Владислав М.", rating: 5, date: "2026-06-09", text: "Одна батарея замінила три модулі меншої ємності — зручніше в монтажі та обслуговуванні.", verified: true },
      ],
      "bat-dyness-powerbox-h2"
    ),
  },
  {
    id: "bat-lifepo4-51v2-100",
    slug: "lifepo4-51-2v-100ah",
    category: "batteries",
    brand: "Pylontech",
    name: L("LiFePO4 51.2V 100Ah", "LiFePO4 51.2V 100Ah"),
    tagline: L("Універсальна стійкова батарея", "A versatile rack-mount battery"),
    price: 45999,
    rating: 4.5,
    reviewsCount: 33,
    inStock: true,
    stockCount: 19,
    isDemo: true,
    images: 3,
    voltageV: 51.2,
    capacityAh: 100,
    capacityWh: 5120,
    maxCurrentA: 50,
    cycles: 5000,
    weightKg: 45,
    isLiFePO4: true,
    description: L(
      "Універсальна LiFePO4 батарея 51.2 В 100 Аг стійкового виконання — гнучке та доступне рішення для систем на базі більшості гібридних інверторів.",
      "A versatile 51.2 V 100 Ah rack-mount LiFePO4 battery — a flexible, affordable option for systems built around most hybrid inverters."
    ),
    whatsIncluded: LL(
      ["Батарея LiFePO4 51.2V 100Ah", "Стійкові кріплення", "Комунікаційні та силові кабелі", "Посібник користувача"],
      ["LiFePO4 51.2V 100Ah battery", "Rack mounting hardware", "Communication and power cables", "User manual"]
    ),
    features: LL(
      ["Стійкове виконання 19″", "Вбудована BMS з балансуванням", "Сумісність із поширеними протоколами зв'язку", "Доступна ціна за кВтг"],
      ["19″ rack-mount form factor", "Built-in BMS with cell balancing", "Compatible with common communication protocols", "Affordable price per kWh"]
    ),
    reviews: reviews(
      [
        { author: "Руслан П.", rating: 4, date: "2026-02-06", text: "Гарне співвідношення ціни та ємності, працює з нашим інвертором Growatt без нарікань." },
      ],
      "bat-lifepo4-51v2-100"
    ),
  },
  {
    id: "bat-pylontech-force-h2",
    slug: "pylontech-force-h2",
    category: "batteries",
    brand: "Pylontech",
    name: L("Pylontech Force H2", "Pylontech Force H2"),
    tagline: L("Високовольтна батарея для великих систем", "A high-voltage battery for large systems"),
    price: 149999,
    rating: 4.9,
    reviewsCount: 14,
    inStock: true,
    stockCount: 3,
    isNew: true,
    highVoltage: true,
    images: 3,
    voltageV: 358,
    capacityAh: 50,
    capacityWh: 17800,
    cycles: 6000,
    weightKg: 168,
    isLiFePO4: true,
    description: L(
      "Pylontech Force H2 — високовольтна батарея для великих домашніх і комерційних систем, що забезпечує високу енергощільність при компактних габаритах.",
      "The Pylontech Force H2 is a high-voltage battery for large home and commercial systems, delivering high energy density in a compact footprint."
    ),
    whatsIncluded: LL(
      ["Батарея Pylontech Force H2", "Підлогова стійка", "Комунікаційні та силові кабелі", "Посібник користувача"],
      ["Pylontech Force H2 battery", "Floor stand", "Communication and power cables", "User manual"]
    ),
    features: LL(
      ["Високовольтна архітектура — менші втрати на струмі", "Компактна енергощільність", "Сумісність із високовольтними гібридними інверторами", "Рекомендований професійний монтаж"],
      ["High-voltage architecture — lower current losses", "Compact energy density", "Compatible with high-voltage hybrid inverters", "Professional installation recommended"]
    ),
    reviews: reviews(
      [
        { author: "Дмитро В.", rating: 5, date: "2026-07-11", text: "Ставили для комерційного об'єкта — щільність енергії вражає, місця займає небагато.", verified: true },
      ],
      "bat-pylontech-force-h2"
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Solar panels                                                        */
/* ------------------------------------------------------------------ */

export const solarPanels: BaseProduct[] = [
  {
    id: "solar-ecoflow-400w",
    slug: "ecoflow-400w-rigid",
    category: "solar-panels",
    brand: "EcoFlow",
    name: L("EcoFlow 400W жорстка панель", "EcoFlow 400W Rigid Panel"),
    tagline: L("Для стаціонарного встановлення на даху", "For fixed rooftop installation"),
    price: 12999,
    rating: 4.7,
    reviewsCount: 42,
    inStock: true,
    stockCount: 24,
    images: 3,
    powerW: 400,
    weightKg: 21,
    description: L(
      "Жорстка монокристалічна панель для стаціонарного встановлення — дах будинку, гараж, навіс. Високий ККД перетворення та стійкість до погодних умов.",
      "A rigid monocrystalline panel for fixed installation — a home roof, garage or carport. High conversion efficiency and weather resistance."
    ),
    whatsIncluded: LL(["Сонячна панель 400 Вт", "Кабель MC4", "Комплект кріплення"], ["400 W solar panel", "MC4 cable", "Mounting kit"]),
    features: LL(
      ["ККД елементів до 22.8%", "Стійкість до граду та вітрових навантажень", "Вологозахищений роз'єм MC4", "Гарантія продуктивності 25 років"],
      ["Cell efficiency up to 22.8%", "Hail and wind load resistant", "Weatherproof MC4 connector", "25-year performance warranty"]
    ),
    reviews: reviews(
      [
        { author: "Леонід А.", rating: 5, date: "2026-05-20", text: "Встановили 4 штуки на дах — відмінна вироблення навіть у похмурі дні.", verified: true },
      ],
      "solar-ecoflow-400w"
    ),
  },
  {
    id: "solar-jackery-solarsaga200",
    slug: "jackery-solarsaga-200w",
    category: "solar-panels",
    brand: "Jackery",
    name: L("Jackery SolarSaga 200W", "Jackery SolarSaga 200W"),
    tagline: L("Складана панель для подорожей", "A foldable panel for travel"),
    price: 10999,
    rating: 4.6,
    reviewsCount: 58,
    inStock: true,
    stockCount: 31,
    images: 3,
    powerW: 200,
    weightKg: 8.5,
    description: L(
      "Складана сонячна панель Jackery SolarSaga 200W — зручне рішення для заряджання станції в поїздках, на дачі чи в кемпінгу.",
      "The foldable Jackery SolarSaga 200W is a convenient way to charge a station on the road, at a cottage or while camping."
    ),
    whatsIncluded: LL(["Сонячна панель 200 Вт", "Кабель для зарядки станції", "Чохол для перенесення"], ["200 W solar panel", "Station charging cable", "Carry case"]),
    features: LL(
      ["Складана конструкція з ручкою для перенесення", "Вбудована підставка-кікстенд", "Сумісна зі станціями Jackery", "Вологозахищене виконання"],
      ["Foldable design with a carry handle", "Built-in kickstand", "Compatible with Jackery stations", "Weather-resistant build"]
    ),
    reviews: reviews(
      [
        { author: "Христина О.", rating: 5, date: "2026-04-02", text: "Беремо в кожну поїздку — компактно складається і швидко заряджає станцію.", verified: true },
      ],
      "solar-jackery-solarsaga200"
    ),
  },
  {
    id: "solar-anker-ps400",
    slug: "anker-solix-ps400",
    category: "solar-panels",
    brand: "Anker SOLIX",
    name: L("Anker SOLIX PS400", "Anker SOLIX PS400"),
    tagline: L("Потужна складана панель 400 Вт", "A powerful 400 W foldable panel"),
    price: 18999,
    rating: 4.8,
    reviewsCount: 29,
    inStock: true,
    stockCount: 14,
    isNew: true,
    images: 3,
    powerW: 400,
    weightKg: 13.6,
    description: L(
      "Anker SOLIX PS400 — потужна складана панель для швидкого заряджання станцій великої ємності в польових умовах.",
      "The Anker SOLIX PS400 is a powerful foldable panel for quickly charging high-capacity stations out in the field."
    ),
    whatsIncluded: LL(["Сонячна панель 400 Вт", "Кабель зарядки", "Чохол для перенесення"], ["400 W solar panel", "Charging cable", "Carry case"]),
    features: LL(
      ["Потужність 400 Вт у складаному форм-факторі", "Захист IP67 від вологи та пилу", "Регульований кут нахилу", "Сумісна з більшістю станцій через MC4"],
      ["400 W in a foldable form factor", "IP67 dust and water resistance", "Adjustable tilt angle", "MC4-compatible with most stations"]
    ),
    reviews: reviews(
      [
        { author: "Тарас Ю.", rating: 5, date: "2026-06-17", text: "Швидко заряджає велику станцію навіть у хмарну погоду. Складається компактно.", verified: true },
      ],
      "solar-anker-ps400"
    ),
  },
  {
    id: "solar-bluetti-pv350",
    slug: "bluetti-pv350",
    category: "solar-panels",
    brand: "Bluetti",
    name: L("Bluetti PV350", "Bluetti PV350"),
    tagline: L("Складана панель середнього класу", "A mid-range foldable panel"),
    price: 15999,
    rating: 4.6,
    reviewsCount: 22,
    inStock: true,
    stockCount: 17,
    images: 3,
    powerW: 350,
    weightKg: 11.8,
    description: L(
      "Bluetti PV350 поєднує гарну вихідну потужність і компактність у складеному вигляді — універсальний вибір для дачі та подорожей.",
      "The Bluetti PV350 balances solid output with a compact folded size — a versatile pick for a cottage or travel."
    ),
    whatsIncluded: LL(["Сонячна панель 350 Вт", "Кабель зарядки", "Чохол для перенесення"], ["350 W solar panel", "Charging cable", "Carry case"]),
    features: LL(
      ["Міцний багатошаровий захист ETFE", "Вбудована підставка", "Сумісна зі станціями Bluetti та більшістю інших через MC4"],
      ["Durable multi-layer ETFE coating", "Built-in kickstand", "MC4-compatible with Bluetti and most other stations"]
    ),
    reviews: reviews(
      [
        { author: "Вікторія Н.", rating: 4, date: "2026-03-25", text: "Хороша панель за свою ціну, покриття ETFE дійсно стійке до подряпин." },
      ],
      "solar-bluetti-pv350"
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Accessories                                                         */
/* ------------------------------------------------------------------ */

export const accessories: BaseProduct[] = [
  {
    id: "acc-mc4-solar-cable",
    slug: "solar-cable-mc4-5m",
    category: "accessories",
    brand: "EcoFlow",
    name: L("Сонячний кабель MC4, 5 м", "Solar Cable MC4, 5 m"),
    tagline: L("Кабель для підключення сонячних панелей", "A cable for connecting solar panels"),
    price: 899,
    rating: 4.7,
    reviewsCount: 64,
    inStock: true,
    stockCount: 120,
    images: 2,
    description: L(
      "Кабель з роз'ємами MC4 для підключення сонячних панелей до станції або контролера заряду.",
      "A cable with MC4 connectors for connecting solar panels to a station or charge controller."
    ),
    whatsIncluded: LL(["Кабель MC4, 5 м"], ["MC4 cable, 5 m"]),
    features: LL(
      ["Вологозахищені роз'єми", "Переріз провідника для мінімальних втрат", "Довжина 5 метрів"],
      ["Weatherproof connectors", "Cross-section sized for minimal losses", "5-meter length"]
    ),
    reviews: reviews(
      [{ author: "Ілля С.", rating: 5, date: "2026-05-03", text: "Якісний кабель, роз'єми сидять щільно." }],
      "acc-mc4-solar-cable"
    ),
  },
  {
    id: "acc-car-charging-cable",
    slug: "car-charging-cable-12v",
    category: "accessories",
    brand: "Bluetti",
    name: L("Автомобільний кабель зарядки 12В", "Car Charging Cable 12V"),
    tagline: L("Зарядка станції від прикурювача авто", "Charge a station from your car's socket"),
    price: 699,
    rating: 4.5,
    reviewsCount: 38,
    inStock: true,
    stockCount: 95,
    images: 2,
    description: L(
      "Кабель для заряджання портативної станції від автомобільного прикурювача в дорозі.",
      "A cable for charging a portable station from a car's 12V socket while on the road."
    ),
    whatsIncluded: LL(["Автомобільний кабель зарядки"], ["Car charging cable"]),
    features: LL(["Сумісний із більшістю станцій 12В", "Міцна обплітка кабелю"], ["Compatible with most 12V stations", "Durable cable braiding"]),
    reviews: reviews(
      [{ author: "Микита Р.", rating: 4, date: "2026-02-14", text: "Працює як треба, довжини вистачає." }],
      "acc-car-charging-cable"
    ),
  },
  {
    id: "acc-parallel-cable",
    slug: "parallel-sync-cable",
    category: "accessories",
    brand: "EcoFlow",
    name: L("Кабель паралельного підключення станцій", "Parallel Sync Cable"),
    tagline: L("Для об'єднання двох станцій у систему", "Combine two stations into one system"),
    price: 1499,
    rating: 4.6,
    reviewsCount: 19,
    inStock: true,
    stockCount: 40,
    images: 2,
    description: L(
      "Дозволяє об'єднати дві сумісні станції для збільшення загальної потужності та ємності.",
      "Lets you combine two compatible stations to increase total power and capacity."
    ),
    whatsIncluded: LL(["Кабель паралельного підключення"], ["Parallel connection cable"]),
    features: LL(
      ["Збільшення сумарної потужності системи", "Сумісний із лінійкою станцій одного виробника"],
      ["Increases total system power", "Compatible with stations from the same product line"]
    ),
    reviews: reviews(
      [{ author: "Олена Ж.", rating: 5, date: "2026-01-22", text: "Об'єднали дві станції — потужності тепер вистачає із запасом." }],
      "acc-parallel-cable"
    ),
  },
  {
    id: "acc-carry-bag",
    slug: "carry-bag-station",
    category: "accessories",
    brand: "Jackery",
    name: L("Сумка-чохол для перенесення станції", "Carry Bag for Power Stations"),
    tagline: L("Захист станції під час транспортування", "Protects a station during transport"),
    price: 1299,
    rating: 4.4,
    reviewsCount: 27,
    inStock: true,
    stockCount: 55,
    images: 2,
    description: L(
      "Міцна сумка для перенесення та захисту станції від пилу, вологи та подряпин у дорозі.",
      "A sturdy bag for carrying and protecting a station from dust, moisture and scratches on the go."
    ),
    whatsIncluded: LL(["Сумка-чохол"], ["Carry bag"]),
    features: LL(["Щільна захисна тканина", "Зручна ручка та ремінь", "Кишеня для кабелів"], ["Dense protective fabric", "Comfortable handle and strap", "Cable pocket"]),
    reviews: reviews(
      [{ author: "Соломія К.", rating: 4, date: "2026-03-11", text: "Добре сидить, станція не бовтається всередині." }],
      "acc-carry-bag"
    ),
  },
  {
    id: "acc-extension-cord",
    slug: "heavy-duty-extension-3m",
    category: "accessories",
    brand: "Anker SOLIX",
    name: L("Потужний подовжувач 3 м", "Heavy-Duty Extension Cord 3m"),
    tagline: L("Для підключення техніки на відстані", "For connecting devices at a distance"),
    price: 799,
    rating: 4.6,
    reviewsCount: 31,
    inStock: true,
    stockCount: 70,
    images: 2,
    description: L(
      "Подовжувач підвищеної потужності з кількома розетками для підключення техніки на відстані від станції.",
      "A heavy-duty extension cord with multiple outlets for connecting devices at a distance from the station."
    ),
    whatsIncluded: LL(["Подовжувач 3 м", "3 розетки"], ["3 m extension cord", "3 outlets"]),
    features: LL(["Розрахований на високе навантаження", "Міцний морозостійкий кабель"], ["Rated for heavy loads", "Durable, cold-resistant cable"]),
    reviews: reviews(
      [{ author: "Богдана Л.", rating: 5, date: "2026-04-29", text: "Товстий кабель, не гріється під навантаженням." }],
      "acc-extension-cord"
    ),
  },
  {
    id: "acc-smart-module",
    slug: "wifi-smart-module",
    category: "accessories",
    brand: "EcoFlow",
    name: L("Wi-Fi модуль віддаленого моніторингу", "Wi-Fi Remote Monitoring Module"),
    tagline: L("Керуйте станцією з будь-якої точки світу", "Control your station from anywhere"),
    price: 1999,
    rating: 4.5,
    reviewsCount: 16,
    inStock: true,
    stockCount: 25,
    images: 2,
    description: L(
      "Додатковий Wi-Fi модуль для станцій без вбудованого модуля — віддалений моніторинг і керування через застосунок.",
      "An add-on Wi-Fi module for stations without a built-in one — remote monitoring and control via the app."
    ),
    whatsIncluded: LL(["Wi-Fi модуль", "Інструкція зі встановлення"], ["Wi-Fi module", "Installation guide"]),
    features: LL(
      ["Віддалений моніторинг через застосунок", "Сповіщення про стан заряду", "Проста установка"],
      ["Remote monitoring via app", "Charge status notifications", "Simple installation"]
    ),
    reviews: reviews(
      [{ author: "Гліб Х.", rating: 4, date: "2026-02-08", text: "Зручно перевіряти рівень заряду, не виходячи з дому." }],
      "acc-smart-module"
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Kits (inverter + battery)                                           */
/* ------------------------------------------------------------------ */

export const kits: KitProduct[] = [
  {
    id: "kit-5kw-5-12kwh",
    slug: "kit-5kw-5-12kwh",
    name: L("Комплект 5 кВт + 5.12 кВтг", "Kit 5 kW + 5.12 kWh"),
    tier: "comfort",
    inverterKw: 5,
    batteryKwh: 5.12,
    price: 149999,
    oldPrice: 164999,
    runtimeHours: L("6–10 годин за середнього навантаження", "6–10 hours under average load"),
    suitableFor: LL(
      ["Холодильник", "Роутер", "Телевізор", "Освітлення", "Комп'ютер"],
      ["Fridge", "Router", "TV", "Lighting", "Computer"]
    ),
    description: L(
      "Готова система на базі гібридного інвертора 5 кВт і LiFePO4 батареї 5.12 кВтг — оптимальний варіант для середньостатистичної квартири чи будинку.",
      "A turnkey system built around a 5 kW hybrid inverter and a 5.12 kWh LiFePO4 battery — a solid fit for an average apartment or house."
    ),
    specs: {
      uk: [
        { label: "Інвертор", value: "Гібридний, 5 кВт, MPPT×2" },
        { label: "Акумулятор", value: "LiFePO4, 51.2В, 5.12 кВтг" },
        { label: "Час автономності", value: "6–10 годин за середнього навантаження" },
        { label: "Монтаж", value: "Рекомендований професійний монтаж" },
      ],
      en: [
        { label: "Inverter", value: "Hybrid, 5 kW, MPPT×2" },
        { label: "Battery", value: "LiFePO4, 51.2V, 5.12 kWh" },
        { label: "Runtime", value: "6–10 hours under average load" },
        { label: "Installation", value: "Professional installation recommended" },
      ],
    },
    whatsIncluded: LL(
      ["Гібридний інвертор 5 кВт", "Батарея LiFePO4 5.12 кВтг", "Кронштейни та кабелі для монтажу", "Базова консультація з установки"],
      ["5 kW hybrid inverter", "5.12 kWh LiFePO4 battery", "Mounting brackets and cables", "Basic installation consultation"]
    ),
  },
  {
    id: "kit-10kw-10-24kwh",
    slug: "kit-10kw-10-24kwh",
    name: L("Комплект 10 кВт + 10.24 кВтг", "Kit 10 kW + 10.24 kWh"),
    tier: "max",
    inverterKw: 10,
    batteryKwh: 10.24,
    price: 279999,
    oldPrice: 299999,
    runtimeHours: L("12–20 годин за середнього навантаження", "12–20 hours under average load"),
    suitableFor: LL(
      ["Холодильник", "Котел", "Освітлення", "Комп'ютери", "Побутова техніка"],
      ["Fridge", "Boiler", "Lighting", "Computers", "Home appliances"]
    ),
    description: L(
      "Потужна система для будинку з високим енергоспоживанням — котел, кухонна техніка, кілька холодильників і повноцінне освітлення працюють одночасно.",
      "A powerful system for high-consumption homes — a boiler, kitchen appliances, multiple fridges and full lighting can run at the same time."
    ),
    specs: {
      uk: [
        { label: "Інвертор", value: "Гібридний, 10 кВт (або 2×5 кВт паралельно), MPPT×2" },
        { label: "Акумулятор", value: "LiFePO4, 51.2В, 10.24 кВтг (2 модулі)" },
        { label: "Час автономності", value: "12–20 годин за середнього навантаження" },
        { label: "Монтаж", value: "Професійний монтаж обов'язковий" },
      ],
      en: [
        { label: "Inverter", value: "Hybrid, 10 kW (or 2×5 kW in parallel), MPPT×2" },
        { label: "Battery", value: "LiFePO4, 51.2V, 10.24 kWh (2 modules)" },
        { label: "Runtime", value: "12–20 hours under average load" },
        { label: "Installation", value: "Professional installation required" },
      ],
    },
    whatsIncluded: LL(
      ["Гібридний інвертор 10 кВт", "Батареї LiFePO4 загальною ємністю 10.24 кВтг", "Кронштейни, стійка та кабелі для монтажу", "Консультація та допомога з проєктом системи"],
      ["10 kW hybrid inverter", "LiFePO4 batteries totaling 10.24 kWh", "Mounting brackets, rack and cables", "System design consultation and support"]
    ),
  },
  {
    id: "kit-15kw-15-36kwh",
    slug: "kit-15kw-15-36kwh",
    name: L("Комплект 15 кВт + 15.36 кВтг", "Kit 15 kW + 15.36 kWh"),
    tier: "max",
    inverterKw: 15,
    batteryKwh: 15.36,
    price: 399999,
    runtimeHours: L("18–30+ годин за середнього навантаження", "18–30+ hours under average load"),
    suitableFor: LL(
      ["Весь будинок", "Котел", "Електроінструмент", "Кондиціонер", "Побутова техніка"],
      ["Whole house", "Boiler", "Power tools", "Air conditioner", "Home appliances"]
    ),
    description: L(
      "Максимальна готова система для великого будинку чи об'єкта з високим піковим енергоспоживанням — трифазний інвертор і збільшений банк батарей.",
      "The maximum turnkey system for a large home or a site with high peak consumption — a three-phase inverter and an expanded battery bank."
    ),
    specs: {
      uk: [
        { label: "Інвертор", value: "Гібридний, трифазний, 15 кВт, MPPT×2" },
        { label: "Акумулятор", value: "LiFePO4, 51.2В, 15.36 кВтг (3 модулі)" },
        { label: "Час автономності", value: "18–30+ годин за середнього навантаження" },
        { label: "Монтаж", value: "Професійний монтаж обов'язковий" },
      ],
      en: [
        { label: "Inverter", value: "Hybrid, three-phase, 15 kW, MPPT×2" },
        { label: "Battery", value: "LiFePO4, 51.2V, 15.36 kWh (3 modules)" },
        { label: "Runtime", value: "18–30+ hours under average load" },
        { label: "Installation", value: "Professional installation required" },
      ],
    },
    whatsIncluded: LL(
      ["Гібридний трифазний інвертор 15 кВт", "Батареї LiFePO4 загальною ємністю 15.36 кВтг", "Стійка, кронштейни та кабелі для монтажу", "Повний супровід проєкту встановлення"],
      ["15 kW three-phase hybrid inverter", "LiFePO4 batteries totaling 15.36 kWh", "Rack, brackets and mounting cables", "Full installation project support"]
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Home solutions (homepage tiers)                                     */
/* ------------------------------------------------------------------ */

export interface HomeSolution {
  tier: "basic" | "comfort" | "max";
  powerW: number;
  capacityWh: number;
  runtimeApprox: Localized;
  price: number;
}

export const homeSolutions: HomeSolution[] = [
  { tier: "basic", powerW: 800, capacityWh: 1024, runtimeApprox: L("до 8 годин", "up to 8 hours"), price: 34999 },
  { tier: "comfort", powerW: 2000, capacityWh: 2048, runtimeApprox: L("до 14 годин", "up to 14 hours"), price: 54999 },
  { tier: "max", powerW: 4000, capacityWh: 5120, runtimeApprox: L("до 30 годин", "up to 30 hours"), price: 129999 },
];

/* ------------------------------------------------------------------ */
/* Aggregated selections                                               */
/* ------------------------------------------------------------------ */

export const allProducts: BaseProduct[] = [
  ...stations,
  ...inverters,
  ...batteries,
  ...solarPanels,
  ...accessories,
];

export function getProductsByCategory(category: CategorySlug): BaseProduct[] {
  switch (category) {
    case "stations":
      return stations;
    case "inverters":
      return inverters;
    case "batteries":
      return batteries;
    case "solar-panels":
      return solarPanels;
    case "accessories":
      return accessories;
    default:
      return [];
  }
}

export function getProductBySlug(category: CategorySlug, slug: string): BaseProduct | undefined {
  return getProductsByCategory(category).find((p) => p.slug === slug);
}

export function getKitBySlug(slug: string): KitProduct | undefined {
  return kits.find((k) => k.slug === slug);
}

export const popularProducts: BaseProduct[] = [
  stations.find((s) => s.slug === "ecoflow-delta-2")!,
  stations.find((s) => s.slug === "ecoflow-delta-2-max")!,
  stations.find((s) => s.slug === "bluetti-ac200l")!,
  stations.find((s) => s.slug === "anker-solix-f2000")!,
  stations.find((s) => s.slug === "oukitel-p2001-plus")!,
  stations.find((s) => s.slug === "jackery-explorer-2000-plus")!,
  stations.find((s) => s.slug === "ecoflow-river-2-pro")!,
  stations.find((s) => s.slug === "bluetti-ac180")!,
];
